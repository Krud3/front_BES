import type { TopologyResponse } from "@/shared/api/backend";
import type { SimulationFrame } from "@/shared/lib/simulation-frame";

export type SimulationStatus =
  | "idle"
  | "connecting"
  | "running"
  | "converged"
  | "completed"
  | "error";

export type WsControlEvent =
  | { event: "topology_ready"; runId: string; networkId: string }
  | { event: "network_started"; runId: string; networkId: string }
  | { event: "network_converged"; runId: string; networkId: string }
  | { event: "run_completed"; runId: string }
  | { event: "error"; message: string };

export interface SimulationState {
  status: SimulationStatus;
  runId: string | null;
  topology: TopologyResponse | null;
  currentRound: number;
  agents: SimulationFrame["agents"];
  error: string | null;
}
