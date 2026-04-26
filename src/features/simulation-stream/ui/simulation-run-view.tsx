import type { SimulationStatus } from "@/entities/simulation";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { useSimulationStream } from "../model/use-simulation-stream";

const STATUS_DOT: Record<SimulationStatus, string> = {
  idle: "bg-muted-foreground",
  connecting: "bg-yellow-500 animate-pulse",
  running: "bg-primary animate-pulse",
  converged: "bg-green-500",
  completed: "bg-green-500",
  error: "bg-destructive",
};

const STATUS_KEYS: Record<SimulationStatus, string> = {
  idle: "simulation.statusIdle",
  connecting: "simulation.statusConnecting",
  running: "simulation.statusRunning",
  converged: "simulation.statusConverged",
  completed: "simulation.statusCompleted",
  error: "simulation.statusError",
};

interface SimulationRunViewProps {
  runId: string;
}

export function SimulationRunView({ runId }: SimulationRunViewProps) {
  const { t } = useTranslation();
  const { status, topology, currentRound, isConnecting } = useSimulationStream(runId);

  const agentCount = topology?.agentCount ?? null;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[status])}
          />
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
        </div>
      </div>

      {/* Visualization canvas — placeholder for M4 (Cosmograph) */}
      <div className="relative flex-1 rounded-lg border border-dashed border-border bg-muted/30">
        {(isConnecting || status === "connecting") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-sans text-sm text-muted-foreground">
              {t("simulation.statusConnecting")}
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-sans text-sm text-destructive">{t("simulation.errorStream")}</p>
          </div>
        )}
        {status === "running" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-sans text-sm text-muted-foreground">
              {t("simulation.visualizationPlaceholder")}
            </p>
          </div>
        )}
        {(status === "converged" || status === "completed") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-sans text-sm text-muted-foreground">
              {t("simulation.visualizationPlaceholder")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
