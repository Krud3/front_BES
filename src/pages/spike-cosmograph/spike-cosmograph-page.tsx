/**
 * Cosmograph 2.0 Spike — Phase 3 of plan_cosmograph/plan.md
 *
 * Validates whether Cosmograph can sustain per-tick updates of a `points`
 * Arrow Table at ≈30 Hz with `preservePointPositionsOnDataUpdate: true` and
 * a frozen layout, for 10 k / 50 k / 100 k synthetic agents.
 *
 * This page is intentionally throwaway and self-contained. It does NOT import
 * from `entities/simulation`, `features/simulation-canvas`, or any M-04 hot path.
 *
 * Two strategies are compared:
 *   - Ruta A: rebuild Arrow Table every tick + setConfig({ points: newTable })
 *   - Ruta C: mutate Float32Arrays in place, setConfig with closure refs
 *             (pointColorByFn / pointSizeByFn reading from module-level arrays)
 *
 * Fix (Phase 3 spike v2):
 *   - Initial mount now uses prepareCosmographData so Cosmograph's internal
 *     DuckDB tables are registered under the names it expects (cosmograph_points /
 *     cosmograph_links). Without this the first _rebuildGraph query fails.
 *   - Per-tick manual Arrow tables are tested after the valid mount — this is
 *     the actual hypothesis under test.
 *   - React.StrictMode double-mount is avoided by only rendering <Cosmograph>
 *     AFTER prepareCosmographData resolves (status = "warmup"), ensuring the
 *     component only mounts once per user-initiated Start.
 */

import {
  Cosmograph,
  type CosmographConfig,
  CosmographPointColorStrategy,
  CosmographPointSizeStrategy,
  type CosmographRef,
  prepareCosmographData,
} from "@cosmograph/react";
import { type Table } from "apache-arrow";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/shared/i18n";
import { appendLog, EventLog, type LogEntry } from "./components/event-log";
import { FpsHud, type FpsStats, useFpsCounter } from "./components/fps-hud";
import {
  SpikeControls,
  type SpikeControlsConfig,
  type SpikeStatus,
} from "./components/spike-controls";
import {
  createFrameStream,
  type FrameStream,
  generateInitialTopology,
  type SpikeTopology,
} from "./lib/mock-frame-generator";
import { buildPointsTableFromPrepared } from "./lib/spike-arrow-builder";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WARMUP_DURATION_MS = 5_000;
const WARMUP_TIMEOUT_MS = 12_000;
const OPINION_PALETTE = ["#ef4444", "#94a3b8", "#3b82f6"] as const;
const POINT_SPEAKING_SIZE = 14;
const POINT_SILENT_SIZE = 8;
const MAX_TICK_ERRORS = 10;

// ---------------------------------------------------------------------------
// Ruta C — module-level mutable array refs
// These are replaced on each Start so the closures always read the current run's data.
// ---------------------------------------------------------------------------
let _rutaCPublicBelief: Float32Array | null = null;
let _rutaCPrivateBelief: Float32Array | null = null;
let _rutaCSpeaking: Uint8Array | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(n);
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// ---------------------------------------------------------------------------
// Extended status — "preparing" is a sub-phase of initializing where
// prepareCosmographData is running (before <Cosmograph> is rendered at all).
// ---------------------------------------------------------------------------

type ExtendedStatus = SpikeStatus | "preparing" | "warmup";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SpikeCosmographPage(): ReactElement {
  const { t } = useTranslation();

  // ---- UI state ----
  const [config, setConfig] = useState<SpikeControlsConfig>({
    agentCount: 10_000,
    edgeDensity: 5,
    tickRate: 30,
    strategy: "rutaA",
  });
  const [status, setStatus] = useState<ExtendedStatus>("idle");
  const [fpsStats, setFpsStats] = useState<FpsStats>({
    currentFps: 0,
    avg1s: 0,
    avg5s: 0,
    totalFrames: 0,
    droppedFrames: 0,
    elapsedSeconds: 0,
    tickErrors: 0,
  });
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [copyLabel, setCopyLabel] = useState<string>("");

  // ---- Cosmograph ref ----
  const cosmographRef = useRef<CosmographRef>(undefined);

  // ---- Mount counter guard ----
  // Tracks how many times onMount has fired for the current run.
  // If > 1 it indicates a re-mount bug (StrictMode or prop-reference churn).
  const mountCountRef = useRef<number>(0);

  // ---- Hot-path refs (no re-renders from these) ----
  const latestFrameRef = useRef<{
    publicBelief: Float32Array;
    privateBelief: Float32Array;
    speaking: Uint8Array;
    round: number;
  } | null>(null);
  const pendingSetConfigRef = useRef<boolean>(false);
  const rafLoopRef = useRef<number | null>(null);

  // Reference to the Arrow Table returned by prepareCosmographData.
  // Per-tick builder mirrors this schema exactly (column names + non-mutating vectors).
  const preparedPointsRef = useRef<Table | null>(null);
  const linksTableRef = useRef<Table | null>(null);

  // Ruta D — direct refs to Cosmograph's internal GPU buffers (Float32Array).
  // Mutated in place per tick; relies on Cosmograph's render loop picking up changes.
  const gpuColorsRef = useRef<Float32Array | null>(null);
  const gpuSizesRef = useRef<Float32Array | null>(null);

  // Dedup milestone log spam — only log once per round threshold.
  const lastLoggedMilestoneRef = useRef<number>(-1);

  // Current Cosmograph config reference (used by both strategies)
  const cosmographConfigRef = useRef<CosmographConfig | null>(null);

  // Frame stream
  const frameStreamRef = useRef<FrameStream | null>(null);

  // Warmup timer
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Topology (kept for results dump)
  const topologyRef = useRef<SpikeTopology | null>(null);

  // Results accumulator for the "copy" button
  const measurementsRef = useRef<{
    startTime: number;
    mountTime: number;
    firstTickRound: number | null;
    tickErrors: number;
  }>({ startTime: 0, mountTime: 0, firstTickRound: null, tickErrors: 0 });

  // ---- Logging helpers ----
  const log = useCallback((message: string, kind: LogEntry["kind"] = "info") => {
    setLogEntries((prev) => appendLog(prev, message, kind));
  }, []);

  // ---- FPS counter — active only when status === "running" ----
  useFpsCounter(
    useCallback((stats: FpsStats) => {
      setFpsStats((prev) => ({
        ...stats,
        tickErrors: measurementsRef.current.tickErrors,
        // preserve tickErrors from ref, not from the FPS hook (which doesn't track it)
        droppedFrames: stats.droppedFrames,
      }));
    }, []),
    status === "running",
  );

  // ---- Handle config change (while idle / stopped) ----
  const handleConfigChange = useCallback((partial: Partial<SpikeControlsConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  // ---- Cleanup helper ----
  const cleanupRun = useCallback(() => {
    if (warmupTimerRef.current !== null) {
      clearTimeout(warmupTimerRef.current);
      warmupTimerRef.current = null;
    }
    frameStreamRef.current?.stop();
    frameStreamRef.current = null;
    if (rafLoopRef.current !== null) {
      cancelAnimationFrame(rafLoopRef.current);
      rafLoopRef.current = null;
    }
    latestFrameRef.current = null;
    pendingSetConfigRef.current = false;
    preparedPointsRef.current = null;
    linksTableRef.current = null;
    gpuColorsRef.current = null;
    gpuSizesRef.current = null;
    lastLoggedMilestoneRef.current = -1;
    cosmographConfigRef.current = null;
    mountCountRef.current = 0;
    _rutaCPublicBelief = null;
    _rutaCPrivateBelief = null;
    _rutaCSpeaking = null;
  }, []);

  // ---- Stop ----
  const handleStop = useCallback(() => {
    cleanupRun();
    setStatus("stopped");
    log(t("spike.log.stopped"), "warn");
  }, [cleanupRun, log, t]);

  // ---- Reset ----
  const handleReset = useCallback(() => {
    cleanupRun();
    setStatus("idle");
    setFpsStats({
      currentFps: 0,
      avg1s: 0,
      avg5s: 0,
      totalFrames: 0,
      droppedFrames: 0,
      elapsedSeconds: 0,
      tickErrors: 0,
    });
    setLogEntries([]);
    measurementsRef.current = {
      startTime: 0,
      mountTime: 0,
      firstTickRound: null,
      tickErrors: 0,
    };
  }, [cleanupRun]);

  // ---- Freeze layout and start tick loop ----
  const startTickLoop = useCallback(
    (strategy: SpikeControlsConfig["strategy"], tickRate: number) => {
      if (cosmographRef.current === undefined || cosmographRef.current === null) {
        log(t("spike.log.errorNoRef"), "warn");
        return;
      }

      const baseConfig: CosmographConfig = {
        ...(cosmographConfigRef.current ?? {}),
        enableSimulation: false,
        preservePointPositionsOnDataUpdate: true,
      };

      // Freeze layout
      void cosmographRef.current.setConfig(baseConfig).then(() => {
        cosmographConfigRef.current = baseConfig;
        log(t("spike.log.layoutFrozen"), "milestone");

        // Ruta D — capture GPU buffer references after layout freezes
        // (buffers exist only after data has been uploaded to GPU)
        if (strategy === "rutaD" && cosmographRef.current !== undefined) {
          const colors = cosmographRef.current.getPointColors();
          const sizes = cosmographRef.current.getPointSizes();
          if (colors !== undefined && sizes !== undefined) {
            gpuColorsRef.current = colors;
            gpuSizesRef.current = sizes;
            log(
              t("spike.log.rutaDBuffersOk", { cLen: colors.length, sLen: sizes.length }),
              "milestone",
            );
          } else {
            log(t("spike.log.rutaDBuffersUnavailable"), "warn");
          }
        }
      });

      setStatus("running");
      log(t("spike.log.tickLoopStarted"), "milestone");
      measurementsRef.current.mountTime = performance.now() - measurementsRef.current.startTime;

      // ---- Tick-error handler with hard-stop guard ----
      const handleTickError = (err: unknown) => {
        pendingSetConfigRef.current = false;
        measurementsRef.current.tickErrors++;
        const message = extractErrorMessage(err);
        log(t("spike.log.tickError", { message }), "warn");
        setFpsStats((prev) => ({
          ...prev,
          tickErrors: measurementsRef.current.tickErrors,
        }));
        if (measurementsRef.current.tickErrors >= MAX_TICK_ERRORS) {
          log(
            t("spike.log.tooManyTickErrors", { count: measurementsRef.current.tickErrors }),
            "warn",
          );
          if (rafLoopRef.current !== null) {
            cancelAnimationFrame(rafLoopRef.current);
            rafLoopRef.current = null;
          }
          frameStreamRef.current?.stop();
          frameStreamRef.current = null;
          setStatus("stopped");
        }
      };

      // ---- rAF loop ----
      const rafTick = () => {
        const frame = latestFrameRef.current;
        const cosmo = cosmographRef.current;

        if (
          frame !== null &&
          cosmo !== undefined &&
          cosmo !== null &&
          !pendingSetConfigRef.current
        ) {
          if (measurementsRef.current.firstTickRound === null) {
            measurementsRef.current.firstTickRound = frame.round;
          }
          if (frame.round % 300 === 0 && lastLoggedMilestoneRef.current !== frame.round) {
            lastLoggedMilestoneRef.current = frame.round;
            log(t("spike.log.tickMilestone", { round: frame.round }), "milestone");
          }

          const currentConfig = cosmographConfigRef.current ?? baseConfig;

          if (strategy === "rutaA") {
            // Rebuild Arrow Table mirroring prepared.points schema (Ruta A hypothesis test)
            if (preparedPointsRef.current !== null) {
              const newTable = buildPointsTableFromPrepared(
                preparedPointsRef.current,
                frame.publicBelief,
                frame.privateBelief,
                frame.speaking,
              );
              const isFirstTick = measurementsRef.current.firstTickRound === frame.round;
              const tickStart = isFirstTick ? performance.now() : 0;

              pendingSetConfigRef.current = true;
              void cosmo
                .setConfig({
                  ...currentConfig,
                  points: newTable,
                  preservePointPositionsOnDataUpdate: true,
                  enableSimulation: false,
                })
                .then(() => {
                  pendingSetConfigRef.current = false;
                  if (isFirstTick) {
                    const ms = (performance.now() - tickStart).toFixed(0);
                    log(t("spike.log.firstManualTick", { ms }), "milestone");
                  }
                })
                .catch(handleTickError);
            }
          } else if (strategy === "rutaC") {
            // Ruta C: arrays are already mutated by the frame stream
            // The closures in pointColorByFn / pointSizeByFn read from
            // the module-level refs which the stream updates in place.
            // Just call setConfig with the same config object to force redraw.
            pendingSetConfigRef.current = true;
            void cosmo
              .setConfig({ ...currentConfig })
              .then(() => {
                pendingSetConfigRef.current = false;
              })
              .catch(handleTickError);
          } else {
            // Ruta D: mutate Cosmograph's internal GPU buffers directly.
            // No setConfig call. Relies on Cosmograph's render loop picking
            // up the buffer changes naturally.
            const colors = gpuColorsRef.current;
            const sizes = gpuSizesRef.current;
            if (colors !== null && sizes !== null) {
              const isFirstTick = measurementsRef.current.firstTickRound === frame.round;
              const tickStart = isFirstTick ? performance.now() : 0;

              const n = frame.publicBelief.length;
              for (let i = 0; i < n; i++) {
                // Map publicBelief [-1, 1] → bipolar palette (red / slate / blue)
                const t2 = (frame.publicBelief[i] + 1) / 2; // [0, 1]
                let r: number;
                let g: number;
                let b: number;
                if (t2 < 0.5) {
                  // red → slate
                  const f = t2 * 2;
                  r = (239 - f * (239 - 148)) / 255;
                  g = (68 + f * (163 - 68)) / 255;
                  b = (68 + f * (184 - 68)) / 255;
                } else {
                  // slate → blue
                  const f = (t2 - 0.5) * 2;
                  r = (148 - f * (148 - 59)) / 255;
                  g = (163 + f * (130 - 163)) / 255;
                  b = (184 + f * (246 - 184)) / 255;
                }
                colors[i * 4 + 0] = r;
                colors[i * 4 + 1] = g;
                colors[i * 4 + 2] = b;
                colors[i * 4 + 3] = 1;
                sizes[i] = frame.speaking[i] > 0 ? POINT_SPEAKING_SIZE : POINT_SILENT_SIZE;
              }

              if (isFirstTick) {
                const ms = (performance.now() - tickStart).toFixed(0);
                log(t("spike.log.rutaDFirstMutation", { ms }), "milestone");
              }
            }
          }
        }

        rafLoopRef.current = requestAnimationFrame(rafTick);
      };

      rafLoopRef.current = requestAnimationFrame(rafTick);
    },
    [log, t],
  );

  // ---- Start ----
  const handleStart = useCallback(() => {
    cleanupRun();
    setLogEntries([]);
    // "preparing" = prepareCosmographData running, <Cosmograph> NOT yet rendered
    setStatus("preparing");
    measurementsRef.current = {
      startTime: performance.now(),
      mountTime: 0,
      firstTickRound: null,
      tickErrors: 0,
    };

    const { agentCount, edgeDensity, tickRate, strategy } = config;
    log(
      t("spike.log.starting", {
        agents: formatCount(agentCount),
        edges: edgeDensity,
        rate: tickRate,
        strat: strategy === "rutaA" ? "Ruta A" : "Ruta C",
      }),
      "milestone",
    );

    // 1. Generate topology (sync)
    const topology = generateInitialTopology(agentCount, edgeDensity);
    topologyRef.current = topology;
    log(
      t("spike.log.topologyBuilt", {
        agents: formatCount(agentCount),
        links: formatCount(topology.linkSourceIds.length),
      }),
      "info",
    );

    // 2. Set up Ruta C module-level refs (initial neutral data)
    const initPublicBelief = new Float32Array(agentCount);
    const initPrivateBelief = new Float32Array(agentCount);
    const initSpeaking = new Uint8Array(agentCount);
    for (let i = 0; i < agentCount; i++) {
      initSpeaking[i] = i % 2 === 0 ? 1 : 0;
    }
    _rutaCPublicBelief = initPublicBelief;
    _rutaCPrivateBelief = initPrivateBelief;
    _rutaCSpeaking = initSpeaking;

    // 4. Build raw JS objects for prepareCosmographData — one-time mount cost.
    //    This is what registers cosmograph_points / cosmograph_links in DuckDB.
    log(t("spike.log.preparingData"), "info");
    const prepStart = performance.now();

    const rawPoints = topology.pointIds.map((id, i) => ({
      id,
      publicBelief: 0,
      privateBelief: 0,
      speaking: i % 2,
    }));

    const rawLinks =
      topology.linkSourceIds.length > 0
        ? topology.linkSourceIds.map((s, i) => ({
            source: s,
            target: topology.linkTargetIds[i] ?? s,
          }))
        : undefined;

    const dataPrepConfig = {
      points: {
        pointIdBy: "id",
        pointColorBy: "publicBelief",
        pointSizeBy: "speaking",
      },
      ...(rawLinks !== undefined
        ? {
            links: {
              linkSourceBy: "source",
              linkTargetsBy: ["target"],
            },
          }
        : {}),
    };

    void prepareCosmographData(dataPrepConfig, rawPoints, rawLinks).then((prepared) => {
      if (prepared === undefined) {
        log(t("spike.log.errorNoRef"), "warn");
        setStatus("stopped");
        return;
      }

      const prepMs = (performance.now() - prepStart).toFixed(0);
      log(t("spike.log.dataPrepared", { ms: prepMs }), "milestone");

      // Capture prepared.points so per-tick rebuilds can mirror its schema exactly.
      preparedPointsRef.current = prepared.points ?? null;

      // Diagnostic — surface what prepareCosmographData actually produced.
      const schemaFields = prepared.points?.schema?.fields ?? [];
      const columns = schemaFields.map((f) => `${f.name}:${f.type}`).join(", ");
      const idBy =
        (prepared.cosmographConfig as { pointIdBy?: string } | undefined)?.pointIdBy ?? "?";
      const indexBy =
        (prepared.cosmographConfig as { pointIndexBy?: string } | undefined)?.pointIndexBy ?? "?";
      log(t("spike.log.preparedSchema", { columns, idBy, indexBy }), "info");

      // Build the full Cosmograph config merging prepared tables with visual config
      const baseConfig: CosmographConfig = {
        // Prepared Arrow Tables (properly registered with DuckDB)
        points: prepared.points,
        ...(prepared.links !== undefined ? { links: prepared.links } : {}),
        // Use the cosmographConfig returned by prepareCosmographData as the
        // canonical field mapping (it has the correct internal column names)
        ...prepared.cosmographConfig,
        // Override / add visual properties
        pointColorStrategy:
          strategy === "rutaA"
            ? CosmographPointColorStrategy.Continuous
            : CosmographPointColorStrategy.Direct,
        pointColorPalette: [...OPINION_PALETTE],
        // Ruta C: override with a fn that reads from mutable ref
        ...(strategy === "rutaC"
          ? {
              pointColorByFn: (_value: unknown, idx?: number) => {
                const val =
                  _rutaCPublicBelief && idx !== undefined ? (_rutaCPublicBelief[idx] ?? 0) : 0;
                const t2 = (val + 1) / 2;
                if (t2 < 0.5) {
                  const frac = t2 * 2;
                  return `rgb(${Math.round(239 - frac * (239 - 148))}, ${Math.round(68 + frac * (163 - 68))}, ${Math.round(68 + frac * (184 - 68))})`;
                }
                const frac = (t2 - 0.5) * 2;
                return `rgb(${Math.round(148 - frac * (148 - 59))}, ${Math.round(163 + frac * (130 - 163))}, ${Math.round(184 + frac * (246 - 184))})`;
              },
            }
          : {}),
        pointSizeStrategy: CosmographPointSizeStrategy.Direct,
        pointSizeByFn:
          strategy === "rutaA"
            ? (v: unknown) => ((v as number) > 0 ? POINT_SPEAKING_SIZE : POINT_SILENT_SIZE)
            : (_v: unknown, idx?: number) => {
                const speaking =
                  _rutaCSpeaking && idx !== undefined ? (_rutaCSpeaking[idx] ?? 0) : 0;
                return speaking > 0 ? POINT_SPEAKING_SIZE : POINT_SILENT_SIZE;
              },
        // Simulation — warm up first
        enableSimulation: true,
        preservePointPositionsOnDataUpdate: false,
        // Aesthetics
        backgroundColor: "#0a0a0a",
        disableLogging: true,
        statusIndicatorMode: false,
      };

      cosmographConfigRef.current = baseConfig;

      // 5. Start the frame stream (producer — runs at tickRate Hz)
      const stream = createFrameStream(agentCount, tickRate);
      frameStreamRef.current = stream;

      stream.start((pubBelief, privBelief, spk, round) => {
        latestFrameRef.current = {
          publicBelief: pubBelief,
          privateBelief: privBelief,
          speaking: spk,
          round,
        };
        if (strategy === "rutaC") {
          _rutaCPublicBelief = pubBelief;
          _rutaCPrivateBelief = privBelief;
          _rutaCSpeaking = spk;
        }
      });

      // 6. Transition to "warmup" — this triggers the conditional render of <Cosmograph>
      //    StrictMode's double-mount dance happens before this point (we're in a Promise
      //    callback, well past the initial synchronous render cycle).
      setStatus("warmup");
      log(t("spike.log.warmupStarted"), "info");

      // 7. Warmup: run force layout for WARMUP_DURATION_MS then freeze
      const hardTimeout = setTimeout(() => {
        if (warmupTimerRef.current !== null) {
          clearTimeout(warmupTimerRef.current);
          warmupTimerRef.current = null;
          log(t("spike.log.warmupTimeout"), "warn");
          startTickLoop(strategy, tickRate);
        }
      }, WARMUP_TIMEOUT_MS);

      warmupTimerRef.current = setTimeout(() => {
        clearTimeout(hardTimeout);
        log(t("spike.log.warmupDone"), "milestone");
        startTickLoop(strategy, tickRate);
      }, WARMUP_DURATION_MS);
    });
  }, [config, cleanupRun, log, startTickLoop, t]);

  // ---- Cosmograph onMount callback ----
  const handleCosmographMount = useCallback(
    (cosmo: NonNullable<CosmographRef>) => {
      mountCountRef.current++;
      if (mountCountRef.current > 1) {
        log(`[DEBUG] Cosmograph re-mounted (count=${mountCountRef.current})`, "warn");
      }
      log(t("spike.log.mountComplete"), "milestone");
      cosmographRef.current = cosmo;
    },
    [log, t],
  );

  // ---- Copy results ----
  const handleCopyResults = useCallback(() => {
    const { avg5s, droppedFrames, totalFrames, elapsedSeconds, tickErrors } = fpsStats;
    const snippet = [
      `## Resultados Spike Cosmograph`,
      ``,
      `| Campo | Valor |`,
      `|---|---|`,
      `| Agentes | ${formatCount(config.agentCount)} |`,
      `| Aristas/agente | ${config.edgeDensity} |`,
      `| Tasa de ticks | ${config.tickRate} Hz |`,
      `| Estrategia | ${config.strategy === "rutaA" ? "Ruta A" : "Ruta C"} |`,
      `| FPS promedio 5 s | ${avg5s.toFixed(1)} |`,
      `| Frames totales | ${totalFrames} |`,
      `| Frames caídos | ${droppedFrames} |`,
      `| Errores por tick | ${tickErrors} |`,
      `| Tiempo transcurrido | ${elapsedSeconds.toFixed(0)} s |`,
      `| Tiempo de montaje | ${measurementsRef.current.mountTime.toFixed(0)} ms |`,
    ].join("\n");

    void navigator.clipboard.writeText(snippet).then(() => {
      setCopyLabel(t("spike.controls.copied"));
      setTimeout(() => setCopyLabel(""), 2000);
    });
  }, [fpsStats, config, t]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      cleanupRun();
    };
  }, [cleanupRun]);

  // ---- Render ----
  // Cosmograph is only rendered when status is "warmup" or "running" or "stopped"
  // AND cosmographConfigRef.current is set. "preparing" explicitly excludes it.
  const shouldRenderCosmograph =
    (status === "warmup" || status === "running" || status === "stopped") &&
    cosmographConfigRef.current !== null;

  // Map extended status down to SpikeStatus for child components
  const spikeStatus: SpikeStatus =
    status === "preparing" || status === "warmup" || status === "initializing"
      ? "initializing"
      : status === "idle" || status === "running" || status === "stopped"
        ? status
        : "idle";

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            to="/board"
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {t("spike.header.backToBoard")}
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-sm font-semibold">{t("spike.header.title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("spike.header.branch")}</span>
          <button
            type="button"
            onClick={handleCopyResults}
            className="rounded border border-border px-2 py-0.5 text-xs hover:bg-accent"
          >
            {copyLabel !== "" ? copyLabel : t("spike.header.copyResults")}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — controls + log */}
        <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border p-3">
          <SpikeControls
            config={config}
            status={spikeStatus}
            onConfigChange={handleConfigChange}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
          />

          <EventLog entries={logEntries} className="flex-1 min-h-48" />
        </aside>

        {/* Right panel — Cosmograph canvas */}
        <main className="relative flex-1 overflow-hidden bg-[#0a0a0a]">
          {/* FPS HUD (only shown when running) */}
          {status === "running" && <FpsHud stats={fpsStats} />}

          {/* Preparing overlay — prepareCosmographData in progress */}
          {status === "preparing" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-white/80">{t("spike.canvas.preparingData")}</p>
            </div>
          )}

          {/* Warmup overlay — Cosmograph is mounted but layout is running */}
          {status === "warmup" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-white/80">{t("spike.canvas.warmingUp")}</p>
              <p className="text-xs text-white/40">
                {t("spike.canvas.warmupHint", {
                  seconds: WARMUP_DURATION_MS / 1000,
                })}
              </p>
            </div>
          )}

          {/* Idle overlay */}
          {(status === "idle" || status === "stopped") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/30">
              <p className="text-lg font-semibold">
                {status === "idle" ? t("spike.canvas.idleHint") : t("spike.canvas.stoppedHint")}
              </p>
              <p className="text-sm">{t("spike.canvas.idleSubhint")}</p>
            </div>
          )}

          {/* Cosmograph — only rendered after prepareCosmographData resolves.
              Key is intentionally absent — the component must NOT remount between
              warmup and running. cosmographConfigRef.current is stable after mount. */}
          {shouldRenderCosmograph && (
            <Cosmograph
              ref={cosmographRef}
              className="size-full"
              onMount={handleCosmographMount}
              {...(cosmographConfigRef.current ?? {})}
            />
          )}
        </main>
      </div>
    </div>
  );
}
