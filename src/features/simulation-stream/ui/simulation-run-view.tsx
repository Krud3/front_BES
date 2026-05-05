import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { SimulationStatus } from "@/entities/simulation";
import { SimulationCanvas } from "@/features/simulation-canvas";
import { simulationsApi } from "@/shared/api/backend";
import { useTranslation } from "@/shared/i18n";
import { logger } from "@/shared/lib/logger";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/shared/ui/resizable";
import { useSimulationStream } from "../model/use-simulation-stream";

const STATUS_DOT: Record<SimulationStatus, string> = {
  idle: "bg-muted-foreground",
  connecting: "bg-yellow-500 animate-pulse",
  running: "bg-primary animate-pulse",
  completed: "bg-green-500",
  cancelled: "bg-muted-foreground",
  error: "bg-destructive",
};

const STATUS_KEYS: Record<SimulationStatus, string> = {
  idle: "simulation.statusIdle",
  connecting: "simulation.statusConnecting",
  running: "simulation.statusRunning",
  completed: "simulation.statusCompleted",
  cancelled: "simulation.statusCancelled",
  error: "simulation.statusError",
};

const PANEL_DEFAULTS = {
  a: 25,
  right: 75,
  b: 70,
  c: 30,
} as const;

type MaximizedPanel = "a" | "b" | "c" | null;

interface SimulationRunViewProps {
  runId: string;
}

export function SimulationRunView({ runId }: SimulationRunViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, topology, currentRound } = useSimulationStream(runId);

  const panelARef = useRef<PanelImperativeHandle | null>(null);
  const panelRightRef = useRef<PanelImperativeHandle | null>(null);
  const panelBRef = useRef<PanelImperativeHandle | null>(null);
  const panelCRef = useRef<PanelImperativeHandle | null>(null);

  const [maximized, setMaximized] = useState<MaximizedPanel>(null);
  const [cancelling, setCancelling] = useState(false);

  const agentCount = topology?.agentCount ?? null;
  const cancellable = status === "connecting" || status === "running";

  const handleMaximize = useCallback(
    (target: "a" | "b" | "c") => {
      if (maximized === target) {
        if (target === "a") {
          panelRightRef.current?.expand();
        } else if (target === "b") {
          panelARef.current?.expand();
          panelCRef.current?.expand();
        } else {
          panelARef.current?.expand();
          panelBRef.current?.expand();
        }
        setMaximized(null);
        return;
      }

      if (target === "a") {
        panelRightRef.current?.collapse();
      } else if (target === "b") {
        panelARef.current?.collapse();
        panelCRef.current?.collapse();
      } else {
        panelARef.current?.collapse();
        panelBRef.current?.collapse();
      }
      setMaximized(target);
    },
    [maximized],
  );

  const handleCancel = useCallback(() => {
    toast.warning(t("simulation.cancelConfirm"), {
      action: {
        label: t("common.cancel"),
        onClick: async () => {
          setCancelling(true);
          try {
            await simulationsApi.cancel(runId);
            toast.success(t("simulation.cancelSuccess"));
            navigate("/board");
          } catch (err) {
            logger.error("SimulationRunView.cancel", err);
            toast.error(t("simulation.errorCancel"));
          } finally {
            setCancelling(false);
          }
        },
      },
    });
  }, [runId, navigate, t]);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[status])} />
          <span className="font-sans text-sm font-medium text-foreground">
            {t(STATUS_KEYS[status] as Parameters<typeof t>[0])}
          </span>
          {currentRound > 0 && (
            <span className="font-sans text-xs text-muted-foreground">
              {t("simulation.roundLabel", { round: String(currentRound) })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {agentCount !== null && (
            <span className="font-sans text-xs text-muted-foreground">
              {t("simulation.agentCount", { count: String(agentCount) })}
            </span>
          )}
          <span className="font-mono text-xs text-muted-foreground/60">{runId.slice(0, 8)}</span>
          {cancellable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cancelling}
              onClick={handleCancel}
            >
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </div>

      {/* Three-panel resizable layout */}
      <div className="flex-1 overflow-hidden rounded-lg border border-border">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            panelRef={panelARef}
            id="panel-a"
            defaultSize={PANEL_DEFAULTS.a}
            minSize={15}
            collapsible
            collapsedSize={0}
          >
            <PanelPlaceholder
              label={t("simulation.panelStatistical")}
              maximized={maximized === "a"}
              onToggleMaximize={() => handleMaximize("a")}
              maximizeLabel={t("simulation.maximizePanel")}
              restoreLabel={t("simulation.restorePanel")}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            panelRef={panelRightRef}
            id="panel-right"
            defaultSize={PANEL_DEFAULTS.right}
            minSize={30}
            collapsible
            collapsedSize={0}
          >
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel
                panelRef={panelBRef}
                id="panel-b"
                defaultSize={PANEL_DEFAULTS.b}
                minSize={30}
                collapsible
                collapsedSize={0}
              >
                <div className="relative h-full w-full">
                  <SimulationCanvas status={status} />
                  <MaximizeButton
                    maximized={maximized === "b"}
                    onClick={() => handleMaximize("b")}
                    maximizeLabel={t("simulation.maximizePanel")}
                    restoreLabel={t("simulation.restorePanel")}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel
                panelRef={panelCRef}
                id="panel-c"
                defaultSize={PANEL_DEFAULTS.c}
                minSize={15}
                collapsible
                collapsedSize={0}
              >
                <PanelPlaceholder
                  label={t("simulation.panelLiveCharts")}
                  maximized={maximized === "c"}
                  onToggleMaximize={() => handleMaximize("c")}
                  maximizeLabel={t("simulation.maximizePanel")}
                  restoreLabel={t("simulation.restorePanel")}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

interface PanelPlaceholderProps {
  label: string;
  maximized: boolean;
  onToggleMaximize: () => void;
  maximizeLabel: string;
  restoreLabel: string;
}

function PanelPlaceholder({
  label,
  maximized,
  onToggleMaximize,
  maximizeLabel,
  restoreLabel,
}: PanelPlaceholderProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-muted/20">
      <p className="font-sans text-sm text-muted-foreground">{label}</p>
      <MaximizeButton
        maximized={maximized}
        onClick={onToggleMaximize}
        maximizeLabel={maximizeLabel}
        restoreLabel={restoreLabel}
      />
    </div>
  );
}

interface MaximizeButtonProps {
  maximized: boolean;
  onClick: () => void;
  maximizeLabel: string;
  restoreLabel: string;
}

function MaximizeButton({ maximized, onClick, maximizeLabel, restoreLabel }: MaximizeButtonProps) {
  const Icon = maximized ? Minimize2 : Maximize2;
  const label = maximized ? restoreLabel : maximizeLabel;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-2 top-2"
      aria-label={label}
      onClick={onClick}
    >
      <Icon />
    </Button>
  );
}
