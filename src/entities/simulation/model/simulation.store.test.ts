import { beforeEach, describe, expect, it } from "vitest";
import type { TopologyResponse } from "@/shared/api/backend";
import type { SimulationFrame } from "@/shared/lib/simulation-frame";
import type { SimulationState } from "../types/simulation.types";
import { useSimulationStore } from "./simulation.store";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockTopology: TopologyResponse = {
  runId: "run-abc-123",
  networkId: "net-abc-123",
  agentCount: 3,
  edgeCount: 2,
  agentOffset: 0,
  agentLimit: 10,
  edgeOffset: 0,
  edgeLimit: 10,
  agents: [],
  edges: [],
};

const mockFrame: SimulationFrame = {
  runId: "run-abc-123",
  networkId: "net-abc-123",
  round: 5,
  agents: [
    { agentId: 1, belief: 0.4, speaking: true },
    { agentId: 2, belief: 0.7, speaking: false },
  ],
};

const initialState: SimulationState = {
  status: "idle",
  runId: null,
  topology: null,
  currentRound: 0,
  agents: [],
  error: null,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useSimulationStore", () => {
  beforeEach(() => {
    useSimulationStore.setState(initialState);
  });

  describe("initial state", () => {
    it("has status idle", () => {
      expect(useSimulationStore.getState().status).toBe("idle");
    });

    it("has runId null", () => {
      expect(useSimulationStore.getState().runId).toBeNull();
    });

    it("has topology null", () => {
      expect(useSimulationStore.getState().topology).toBeNull();
    });

    it("has currentRound zero", () => {
      expect(useSimulationStore.getState().currentRound).toBe(0);
    });

    it("has agents as empty array", () => {
      expect(useSimulationStore.getState().agents).toEqual([]);
    });

    it("has error null", () => {
      expect(useSimulationStore.getState().error).toBeNull();
    });
  });

  describe("setRunId", () => {
    it("updates runId to the provided value", () => {
      useSimulationStore.getState().setRunId("run-xyz-999");
      expect(useSimulationStore.getState().runId).toBe("run-xyz-999");
    });
  });

  describe("setStatus", () => {
    it("updates status to the provided SimulationStatus value", () => {
      useSimulationStore.getState().setStatus("running");
      expect(useSimulationStore.getState().status).toBe("running");
    });

    it("updates status to converged", () => {
      useSimulationStore.getState().setStatus("converged");
      expect(useSimulationStore.getState().status).toBe("converged");
    });
  });

  describe("setTopology", () => {
    it("updates topology to the provided TopologyResponse object", () => {
      useSimulationStore.getState().setTopology(mockTopology);
      expect(useSimulationStore.getState().topology).toEqual(mockTopology);
    });
  });

  describe("updateFrame", () => {
    it("updates agents from the provided frame", () => {
      useSimulationStore.getState().updateFrame(mockFrame);
      expect(useSimulationStore.getState().agents).toEqual(mockFrame.agents);
    });

    it("updates currentRound from the provided frame", () => {
      useSimulationStore.getState().updateFrame(mockFrame);
      expect(useSimulationStore.getState().currentRound).toBe(mockFrame.round);
    });
  });

  describe("setError", () => {
    it("sets status to error", () => {
      useSimulationStore.getState().setError("Connection lost");
      expect(useSimulationStore.getState().status).toBe("error");
    });

    it("sets error to the provided message", () => {
      useSimulationStore.getState().setError("Connection lost");
      expect(useSimulationStore.getState().error).toBe("Connection lost");
    });
  });

  describe("reset", () => {
    it("restores status to idle", () => {
      useSimulationStore.setState({ status: "running" });
      useSimulationStore.getState().reset();
      expect(useSimulationStore.getState().status).toBe("idle");
    });

    it("restores runId to null", () => {
      useSimulationStore.setState({ runId: "run-xyz-999" });
      useSimulationStore.getState().reset();
      expect(useSimulationStore.getState().runId).toBeNull();
    });

    it("restores topology to null", () => {
      useSimulationStore.setState({ topology: mockTopology });
      useSimulationStore.getState().reset();
      expect(useSimulationStore.getState().topology).toBeNull();
    });

    it("restores currentRound to zero", () => {
      useSimulationStore.setState({ currentRound: 42 });
      useSimulationStore.getState().reset();
      expect(useSimulationStore.getState().currentRound).toBe(0);
    });

    it("restores agents to empty array", () => {
      useSimulationStore.setState({ agents: mockFrame.agents });
      useSimulationStore.getState().reset();
      expect(useSimulationStore.getState().agents).toEqual([]);
    });

    it("restores error to null", () => {
      useSimulationStore.setState({ error: "some error" });
      useSimulationStore.getState().reset();
      expect(useSimulationStore.getState().error).toBeNull();
    });
  });
});
