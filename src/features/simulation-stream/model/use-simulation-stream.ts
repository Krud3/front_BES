import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { SimulationWsClient } from "@/entities/simulation";
import { createSimulationWsClient, useSimulationStore } from "@/entities/simulation";
import { useTranslation } from "@/shared/i18n";
import { isErrorCode } from "@/shared/lib/backend-error";
import { logger } from "@/shared/lib/logger";

export function useSimulationStream(runId: string) {
  const { t } = useTranslation();
  const clientRef = useRef<SimulationWsClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const status = useSimulationStore((s) => s.status);
  const topology = useSimulationStore((s) => s.topology);
  const currentRound = useSimulationStore((s) => s.currentRound);
  const agents = useSimulationStore((s) => s.agents);
  const error = useSimulationStore((s) => s.error);
  const reset = useSimulationStore((s) => s.reset);

  useEffect(() => {
    reset();
    clientRef.current = createSimulationWsClient(runId);

    const connect = async () => {
      setIsConnecting(true);
      try {
        await clientRef.current?.connect();
      } catch (err) {
        logger.error("useSimulationStream", err);
        if (isErrorCode(err, "rate_limited")) {
          toast.error(t("simulation.errorRateLimited"));
        } else if (isErrorCode(err, "forbidden")) {
          toast.error(t("simulation.errorForbidden"));
        } else {
          toast.error(t("simulation.errorStream"));
        }
      } finally {
        setIsConnecting(false);
      }
    };

    connect();

    return () => {
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
    // runId is intentionally the only dependency — changing runId starts a new stream
    // biome-ignore lint/react-hooks/exhaustive-deps: runId is the only stable identity
  }, [runId]);

  return { status, topology, currentRound, agents, error, isConnecting };
}
