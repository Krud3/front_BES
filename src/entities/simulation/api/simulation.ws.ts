import { simulationsApi } from "@/shared/api/backend";
import type { MergedFrame } from "@/shared/workers/simulation-frame-merger";
import { useSimulationStore } from "../model/simulation.store";
import type { WsControlEvent } from "../types/simulation.types";

const MAX_RECONNECT_ATTEMPTS = 3;

// Codes that signal ticket rejection — do not retry
const NO_RETRY_CODES = new Set([1000, 1008]);

export interface SimulationWsClient {
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function createSimulationWsClient(runId: string): SimulationWsClient {
  let ws: WebSocket | null = null;
  let worker: Worker | null = null;
  let topologyReady = false;
  let reconnectAttempts = 0;
  let destroyed = false;

  const store = useSimulationStore.getState;

  async function openConnection(): Promise<void> {
    const { wsTicket } = await simulationsApi.getWsTicket(runId);

    const baseUrl = import.meta.env.PUBLIC_BACKEND_URL ?? "http://localhost:9000";
    const wsBase = baseUrl.replace(/^http/, "ws");
    const url = `${wsBase}/simulations/${runId}/stream?ticket=${wsTicket}`;

    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectAttempts = 0;
      store().setStatus("running");
    };

    ws.onmessage = async (event: MessageEvent) => {
      if (typeof event.data === "string") {
        handleControlEvent(JSON.parse(event.data) as WsControlEvent);
        return;
      }

      // Drop binary frames until topology is loaded (worker is not initialized yet)
      if (!topologyReady) return;

      const buffer: ArrayBuffer =
        event.data instanceof Blob ? await event.data.arrayBuffer() : (event.data as ArrayBuffer);

      worker?.postMessage({ type: "frame", buffer }, [buffer]);
    };

    ws.onerror = () => {
      // onclose fires right after onerror, handle reconnect there
    };

    ws.onclose = (event: CloseEvent) => {
      if (destroyed) return;
      if (NO_RETRY_CODES.has(event.code)) return;

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        store().setStatus("connecting");
        openConnection().catch(() => {
          store().setError(`WebSocket reconnect failed after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        });
      } else {
        store().setError(`WebSocket closed unexpectedly (code ${event.code})`);
      }
    };
  }

  async function handleControlEvent(msg: WsControlEvent): Promise<void> {
    switch (msg.event) {
      case "topology_ready": {
        store().setStatus("running");
        const topology = await simulationsApi.getTopology(msg.runId, msg.networkId);
        if (topology) {
          store().setTopology(topology);
          worker?.postMessage({ type: "init", agentCount: topology.agentCount });
          topologyReady = true;
        }
        break;
      }
      case "network_started":
        store().setStatus("running");
        break;
      case "network_converged":
        // per-network event; run-level status stays 'running' until run_completed
        break;
      case "run_completed":
        store().setStatus("completed");
        break;
      case "error":
        store().setError(msg.message);
        break;
    }
  }

  return {
    connect: async () => {
      destroyed = false;
      topologyReady = false;

      worker = new Worker(
        new URL("../../../shared/workers/simulation-frame.worker.ts", import.meta.url),
      );
      worker.onmessage = (event: MessageEvent<MergedFrame>) => {
        store().updateFrame(event.data);
      };

      store().setRunId(runId);
      store().setStatus("connecting");
      await openConnection();
    },

    disconnect: () => {
      destroyed = true;
      ws?.close(1000);
      ws = null;
      worker?.terminate();
      worker = null;
      topologyReady = false;
    },
  };
}
