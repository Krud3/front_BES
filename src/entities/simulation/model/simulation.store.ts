import { create } from "zustand";
import type { TopologyResponse } from "@/shared/api/backend";
import type { MergedFrame } from "@/shared/workers/simulation-frame-merger";
import type { SimulationState, SimulationStatus } from "../types/simulation.types";

interface SimulationActions {
  setRunId: (runId: string) => void;
  setStatus: (status: SimulationStatus) => void;
  setTopology: (topology: TopologyResponse) => void;
  updateFrame: (frame: MergedFrame) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState: SimulationState = {
  status: "idle",
  runId: null,
  topology: null,
  currentRound: 0,
  error: null,
};

export const useSimulationStore = create<SimulationState & SimulationActions>((set) => ({
  ...initialState,

  setRunId: (runId) => set({ runId }),

  setStatus: (status) => set({ status }),

  setTopology: (topology) => set({ topology }),

  updateFrame: (frame) => set({ currentRound: frame.round }),

  setError: (error) => set({ status: "error", error }),

  reset: () => set(initialState),
}));
