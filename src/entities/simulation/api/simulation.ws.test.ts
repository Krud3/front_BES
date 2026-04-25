import { beforeEach, describe, expect, it, vi } from "vitest";
import { simulationsApi } from "@/shared/api/backend";
import { parseSimulationFrame } from "@/shared/lib/simulation-frame";
import { useSimulationStore } from "../model/simulation.store";
import { createSimulationWsClient } from "./simulation.ws";

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock("@/shared/api/backend", () => ({
  simulationsApi: {
    getWsTicket: vi.fn(),
    getTopology: vi.fn(),
  },
}));

vi.mock("../model/simulation.store", () => ({
  useSimulationStore: {
    getState: vi.fn(),
  },
}));

vi.mock("@/shared/lib/simulation-frame", () => ({
  parseSimulationFrame: vi.fn(),
}));

// ─── Types ───────────────────────────────────────────────────────────────────

type MockStoreActions = {
  setRunId: ReturnType<typeof vi.fn>;
  setStatus: ReturnType<typeof vi.fn>;
  setTopology: ReturnType<typeof vi.fn>;
  updateFrame: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
};

type MockWebSocket = {
  onopen: (() => void) | null;
  onmessage: ((event: MessageEvent) => void | Promise<void>) | null;
  onerror: (() => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  close: ReturnType<typeof vi.fn>;
  lastUrl: string;
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const RUN_ID = "run-abc-123";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("createSimulationWsClient", () => {
  let mockStore: MockStoreActions;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStore = {
      setRunId: vi.fn(),
      setStatus: vi.fn(),
      setTopology: vi.fn(),
      updateFrame: vi.fn(),
      setError: vi.fn(),
    };

    vi.mocked(useSimulationStore.getState).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useSimulationStore.getState>,
    );

    mockWs = {
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      close: vi.fn(),
      lastUrl: "",
    };

    // WebSocket must be a constructor — use a class-based stub that proxies
    // handler assignments back to the shared `mockWs` object so tests can
    // read them back after `connect()` completes.
    const captured = mockWs;
    vi.stubGlobal(
      "WebSocket",
      class MockWebSocketConstructor {
        onopen: (() => void) | null = null;
        onmessage: ((event: MessageEvent) => void | Promise<void>) | null = null;
        onerror: (() => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;
        close = captured.close;
        constructor(url: string) {
          captured.lastUrl = url;
          Object.defineProperties(this, {
            onopen: {
              get: () => captured.onopen,
              set: (v: (() => void) | null) => {
                captured.onopen = v;
              },
              enumerable: true,
              configurable: true,
            },
            onmessage: {
              get: () => captured.onmessage,
              set: (v: ((event: MessageEvent) => void | Promise<void>) | null) => {
                captured.onmessage = v;
              },
              enumerable: true,
              configurable: true,
            },
            onerror: {
              get: () => captured.onerror,
              set: (v: (() => void) | null) => {
                captured.onerror = v;
              },
              enumerable: true,
              configurable: true,
            },
            onclose: {
              get: () => captured.onclose,
              set: (v: ((event: CloseEvent) => void) | null) => {
                captured.onclose = v;
              },
              enumerable: true,
              configurable: true,
            },
          });
        }
      },
    );

    vi.mocked(simulationsApi.getWsTicket).mockResolvedValue({ wsTicket: "ticket-xyz" });
  });

  it("returns an object with connect and disconnect", () => {
    const client = createSimulationWsClient(RUN_ID);
    expect(typeof client.connect).toBe("function");
    expect(typeof client.disconnect).toBe("function");
  });

  describe("connect()", () => {
    it("calls getWsTicket with the runId", async () => {
      const client = createSimulationWsClient(RUN_ID);
      await client.connect();
      expect(simulationsApi.getWsTicket).toHaveBeenCalledWith(RUN_ID);
    });

    it("constructs a ws:// URL from an http base URL and includes the ticket", async () => {
      vi.stubEnv("PUBLIC_BACKEND_URL", "http://backend.local:9000");
      const client = createSimulationWsClient(RUN_ID);
      await client.connect();
      expect(mockWs.lastUrl).toBe(
        `ws://backend.local:9000/simulations/${RUN_ID}/stream?ticket=ticket-xyz`,
      );
    });

    it("constructs a wss:// URL from an https base URL", async () => {
      vi.stubEnv("PUBLIC_BACKEND_URL", "https://backend.prod");
      const client = createSimulationWsClient(RUN_ID);
      await client.connect();
      expect(mockWs.lastUrl).toBe(
        `wss://backend.prod/simulations/${RUN_ID}/stream?ticket=ticket-xyz`,
      );
    });

    it("sets runId and status to connecting before opening the socket", async () => {
      const client = createSimulationWsClient(RUN_ID);
      await client.connect();
      expect(mockStore.setRunId).toHaveBeenCalledWith(RUN_ID);
      expect(mockStore.setStatus).toHaveBeenCalledWith("connecting");
    });

    describe("ws.onopen", () => {
      it("sets status to running when the connection opens", async () => {
        const client = createSimulationWsClient(RUN_ID);
        await client.connect();
        mockWs.onopen?.();
        expect(mockStore.setStatus).toHaveBeenCalledWith("running");
      });
    });

    describe("ws.onmessage — control events", () => {
      async function triggerMessage(data: string) {
        const client = createSimulationWsClient(RUN_ID);
        await client.connect();
        const event = { data } as MessageEvent;
        await mockWs.onmessage?.(event);
      }

      it("calls getTopology and setTopology on topology_ready", async () => {
        const mockTopology = {
          runId: RUN_ID,
          networkId: "net-1",
          agentCount: 2,
          edgeCount: 1,
          agentOffset: 0,
          agentLimit: 100,
          edgeOffset: 0,
          edgeLimit: 100,
          agents: [],
          edges: [],
        };
        vi.mocked(simulationsApi.getTopology).mockResolvedValue(mockTopology);

        await triggerMessage(
          JSON.stringify({ event: "topology_ready", runId: RUN_ID, networkId: "net-1" }),
        );

        expect(simulationsApi.getTopology).toHaveBeenCalledWith(RUN_ID, "net-1");
        expect(mockStore.setTopology).toHaveBeenCalledWith(mockTopology);
      });

      it("sets status to running on network_started", async () => {
        await triggerMessage(
          JSON.stringify({ event: "network_started", runId: RUN_ID, networkId: "net-1" }),
        );
        expect(mockStore.setStatus).toHaveBeenCalledWith("running");
      });

      it("sets status to converged on network_converged", async () => {
        await triggerMessage(
          JSON.stringify({ event: "network_converged", runId: RUN_ID, networkId: "net-1" }),
        );
        expect(mockStore.setStatus).toHaveBeenCalledWith("converged");
      });

      it("sets status to completed on run_completed", async () => {
        await triggerMessage(JSON.stringify({ event: "run_completed", runId: RUN_ID }));
        expect(mockStore.setStatus).toHaveBeenCalledWith("completed");
      });

      it("calls setError on error event", async () => {
        await triggerMessage(JSON.stringify({ event: "error", message: "something went wrong" }));
        expect(mockStore.setError).toHaveBeenCalledWith("something went wrong");
      });
    });

    describe("ws.onmessage — binary frame", () => {
      it("parses the ArrayBuffer and calls updateFrame", async () => {
        const mockFrame = {
          runId: RUN_ID,
          networkId: "net-1",
          round: 5,
          agents: [],
        };
        vi.mocked(parseSimulationFrame).mockReturnValue(mockFrame);

        const client = createSimulationWsClient(RUN_ID);
        await client.connect();

        const buffer = new ArrayBuffer(8);
        const event = { data: buffer } as MessageEvent;
        await mockWs.onmessage?.(event);

        expect(parseSimulationFrame).toHaveBeenCalledWith(buffer);
        expect(mockStore.updateFrame).toHaveBeenCalledWith(mockFrame);
      });
    });

    describe("ws.onclose", () => {
      it("does not reconnect when code is 1000", async () => {
        const client = createSimulationWsClient(RUN_ID);
        await client.connect();

        // Reset call counts — we only care about side-effects after close
        vi.clearAllMocks();

        const closeEvent = { code: 1000 } as CloseEvent;
        mockWs.onclose?.(closeEvent);

        expect(simulationsApi.getWsTicket).not.toHaveBeenCalled();
        expect(mockStore.setStatus).not.toHaveBeenCalledWith("connecting");
      });

      it("sets status to connecting on unexpected close code", async () => {
        const client = createSimulationWsClient(RUN_ID);
        await client.connect();

        vi.mocked(simulationsApi.getWsTicket).mockResolvedValue({ wsTicket: "ticket-2" });

        const closeEvent = { code: 1006 } as CloseEvent;
        mockWs.onclose?.(closeEvent);

        expect(mockStore.setStatus).toHaveBeenCalledWith("connecting");
      });

      it("calls setError when the socket reconnect fails", async () => {
        const client = createSimulationWsClient(RUN_ID);
        vi.mocked(simulationsApi.getWsTicket).mockResolvedValueOnce({ wsTicket: "ticket-1" });
        await client.connect();

        // Subsequent calls reject to simulate a failed reconnect
        vi.mocked(simulationsApi.getWsTicket).mockRejectedValue(new Error("network error"));

        const closeEvent = { code: 1006 } as CloseEvent;
        mockWs.onclose?.(closeEvent);

        // Wait for the async reconnect promise to reject
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockStore.setError).toHaveBeenCalledWith(
          expect.stringContaining("reconnect failed"),
        );
      });
    });
  });

  describe("disconnect()", () => {
    it("closes the WebSocket with code 1000", async () => {
      const client = createSimulationWsClient(RUN_ID);
      await client.connect();
      client.disconnect();
      expect(mockWs.close).toHaveBeenCalledWith(1000);
    });

    it("does not reconnect after disconnect even when onclose fires", async () => {
      const client = createSimulationWsClient(RUN_ID);
      await client.connect();
      client.disconnect();

      vi.clearAllMocks();

      // onclose fires after close() in real browsers — should be a no-op
      const closeEvent = { code: 1006 } as CloseEvent;
      mockWs.onclose?.(closeEvent);

      expect(simulationsApi.getWsTicket).not.toHaveBeenCalled();
    });
  });
});
