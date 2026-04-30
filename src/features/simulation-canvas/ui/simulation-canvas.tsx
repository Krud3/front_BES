import { Link } from "react-router-dom";
import type { SimulationStatus } from "@/entities/simulation";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface SimulationCanvasProps {
  status: SimulationStatus;
}

export function SimulationCanvas({ status }: SimulationCanvasProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-muted/20">
      {status === "connecting" && (
        <p className="font-sans text-sm text-muted-foreground">
          {t("simulation.statusConnecting")}
        </p>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3">
          <p className="font-sans text-sm text-destructive">{t("simulation.errorStream")}</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/board">{t("simulation.backToBoard")}</Link>
          </Button>
        </div>
      )}

      {(status === "running" || status === "converged") && (
        <p className="font-sans text-sm text-muted-foreground">{t("simulation.panelCosmograph")}</p>
      )}

      {status === "completed" && (
        <div className="flex flex-col items-center gap-3">
          <p className="font-sans text-base font-medium text-foreground">
            {t("simulation.simulationComplete")}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/board">{t("simulation.backToBoard")}</Link>
          </Button>
        </div>
      )}

      {status === "idle" && (
        <p className="font-sans text-sm text-muted-foreground">{t("simulation.panelCosmograph")}</p>
      )}
    </div>
  );
}
