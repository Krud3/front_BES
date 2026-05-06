import { useEffect, useRef } from "react";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

export interface FpsStats {
  /** Current instantaneous FPS (last frame delta) */
  currentFps: number;
  /** Rolling 1-second average FPS */
  avg1s: number;
  /** Rolling 5-second average FPS */
  avg5s: number;
  /** Total frames rendered since start */
  totalFrames: number;
  /** Number of frames where the paint gap exceeded 50 ms (GC / jank) */
  droppedFrames: number;
  /** Elapsed seconds since the stream started */
  elapsedSeconds: number;
  /** Number of per-tick setConfig calls that threw an error */
  tickErrors: number;
}

interface FpsHudProps {
  stats: FpsStats;
  className?: string;
}

/** Colour-codes the FPS value: green ≥ 30, yellow ≥ 20, red < 20 */
function fpsColor(fps: number): string {
  if (fps >= 30) return "text-green-400";
  if (fps >= 20) return "text-yellow-400";
  return "text-red-400";
}

/**
 * Overlay HUD that shows rolling FPS stats.
 * Positioned absolute — parent must be relative.
 */
export function FpsHud({ stats, className }: FpsHudProps) {
  const { t } = useTranslation();
  const { currentFps, avg1s, avg5s, totalFrames, droppedFrames, elapsedSeconds, tickErrors } =
    stats;

  return (
    <div
      className={cn(
        "absolute top-2 right-2 z-20 rounded bg-black/70 px-3 py-2 font-mono text-xs text-white backdrop-blur-sm select-none",
        className,
      )}
      aria-live="polite"
      aria-label={t("spike.hud.ariaLabel")}
    >
      <div className="mb-1 border-b border-white/20 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">
        {t("spike.hud.title")}
      </div>

      <Row
        label={t("spike.hud.current")}
        value={`${currentFps.toFixed(0)}`}
        colorClass={fpsColor(currentFps)}
      />
      <Row
        label={t("spike.hud.avg1s")}
        value={`${avg1s.toFixed(1)}`}
        colorClass={fpsColor(avg1s)}
      />
      <Row
        label={t("spike.hud.avg5s")}
        value={`${avg5s.toFixed(1)}`}
        colorClass={fpsColor(avg5s)}
      />
      <div className="mt-1 border-t border-white/20 pt-1">
        <Row label={t("spike.hud.frames")} value={`${totalFrames}`} />
        <Row
          label={t("spike.hud.dropped")}
          value={`${droppedFrames}`}
          colorClass={droppedFrames > 0 ? "text-orange-400" : undefined}
        />
        <Row
          label={t("spike.hud.tickErrors")}
          value={`${tickErrors}`}
          colorClass={tickErrors > 0 ? "text-red-400" : undefined}
        />
        <Row label={t("spike.hud.elapsed")} value={`${elapsedSeconds.toFixed(0)} s`} />
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  colorClass?: string;
}

function Row({ label, value, colorClass }: RowProps) {
  return (
    <div className="flex justify-between gap-4 leading-5">
      <span className="text-white/60">{label}</span>
      <span className={cn("font-semibold", colorClass ?? "text-white")}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hook — manages FPS measurement in a rAF loop
// ---------------------------------------------------------------------------

const WINDOW_1S = 60;
const WINDOW_5S = 300;
const JANK_THRESHOLD_MS = 50;

/**
 * Mutable FPS counter that runs its own rAF loop independently of the render loop.
 * Returns a ref to the latest stats; the caller is responsible for reading it on
 * each render cycle (or triggering re-renders via a state callback).
 *
 * @param onStats  Called every 200 ms with the latest stats.
 * @param running  Whether the measurement loop should be active.
 */
export function useFpsCounter(onStats: (stats: FpsStats) => void, running: boolean): void {
  const rafRef = useRef<number | null>(null);
  const statsRef = useRef<{
    prevTimestamp: number;
    startTimestamp: number;
    totalFrames: number;
    droppedFrames: number;
    deltas1s: number[];
    deltas5s: number[];
    lastReportTs: number;
  } | null>(null);

  useEffect(() => {
    if (!running) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        statsRef.current = null;
      }
      return;
    }

    const now = performance.now();
    statsRef.current = {
      prevTimestamp: now,
      startTimestamp: now,
      totalFrames: 0,
      droppedFrames: 0,
      deltas1s: [],
      deltas5s: [],
      lastReportTs: now,
    };

    const loop = (ts: number) => {
      const s = statsRef.current;
      if (s === null) return;

      const delta = ts - s.prevTimestamp;
      s.prevTimestamp = ts;

      if (s.totalFrames > 0) {
        // Sliding windows
        s.deltas1s.push(delta);
        if (s.deltas1s.length > WINDOW_1S) s.deltas1s.shift();

        s.deltas5s.push(delta);
        if (s.deltas5s.length > WINDOW_5S) s.deltas5s.shift();

        if (delta > JANK_THRESHOLD_MS) {
          s.droppedFrames++;
        }
      }

      s.totalFrames++;

      // Report at most every 200 ms to avoid flooding React renders
      if (ts - s.lastReportTs >= 200) {
        s.lastReportTs = ts;

        const avgDelta1s =
          s.deltas1s.length > 0 ? s.deltas1s.reduce((a, b) => a + b, 0) / s.deltas1s.length : delta;
        const avgDelta5s =
          s.deltas5s.length > 0 ? s.deltas5s.reduce((a, b) => a + b, 0) / s.deltas5s.length : delta;

        onStats({
          currentFps: delta > 0 ? 1000 / delta : 0,
          avg1s: avgDelta1s > 0 ? 1000 / avgDelta1s : 0,
          avg5s: avgDelta5s > 0 ? 1000 / avgDelta5s : 0,
          totalFrames: s.totalFrames,
          droppedFrames: s.droppedFrames,
          elapsedSeconds: (ts - s.startTimestamp) / 1000,
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      statsRef.current = null;
    };
  }, [running, onStats]);
}
