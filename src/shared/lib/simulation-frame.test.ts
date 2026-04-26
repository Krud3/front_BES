import { describe, expect, it } from "vitest";
import type { SimulationFrame } from "./simulation-frame";
import { parseSimulationFrame } from "./simulation-frame";

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Writes 16 UUID bytes starting at `offset` into `view`. */
function writeUuidBytes(view: DataView, offset: number, bytes: number[]): void {
  for (let i = 0; i < 16; i++) {
    view.setUint8(offset + i, bytes[i] ?? 0);
  }
}

type AgentRecord = {
  agentId: number;
  belief: number;
  speaking: boolean;
};

/**
 * Builds a complete frame buffer: 36-byte header + N × 9-byte agent records.
 * Header layout: 16 (runId) + 16 (networkId) + 4 (round big-endian uint32)
 * Agent layout: 4 (agentId) + 4 (belief float32) + 1 (speaking uint8)
 */
function buildFrame(
  runIdBytes: number[],
  networkIdBytes: number[],
  round: number,
  agents: AgentRecord[],
): ArrayBuffer {
  const totalBytes = 36 + agents.length * 9;
  const buffer = new ArrayBuffer(totalBytes);
  const view = new DataView(buffer);

  writeUuidBytes(view, 0, runIdBytes);
  writeUuidBytes(view, 16, networkIdBytes);
  view.setUint32(32, round, false);

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    if (agent === undefined) continue;
    const base = 36 + i * 9;
    view.setUint32(base, agent.agentId, false);
    view.setFloat32(base + 4, agent.belief, false);
    view.setUint8(base + 8, agent.speaking ? 1 : 0);
  }

  return buffer;
}

// Known UUID fixture: all bytes 0x01 → "01010101-0101-0101-0101-010101010101"
const RUN_ID_BYTES = Array<number>(16).fill(0x01);
const NETWORK_ID_BYTES = Array<number>(16).fill(0x02);
const EXPECTED_RUN_ID = "01010101-0101-0101-0101-010101010101";
const EXPECTED_NETWORK_ID = "02020202-0202-0202-0202-020202020202";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("parseSimulationFrame", () => {
  describe("UUID parsing (bytesToUuid via parseSimulationFrame)", () => {
    it("parses runId from bytes 0–15 as a UUID string", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 0, []);
      const frame: SimulationFrame = parseSimulationFrame(buffer);
      expect(frame.runId).toBe(EXPECTED_RUN_ID);
    });

    it("parses networkId from bytes 16–31 as a UUID string", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 0, []);
      const frame: SimulationFrame = parseSimulationFrame(buffer);
      expect(frame.networkId).toBe(EXPECTED_NETWORK_ID);
    });

    it("produces a UUID with hyphens at positions 8, 13, 18, 23", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 0, []);
      const { runId } = parseSimulationFrame(buffer);
      expect(runId[8]).toBe("-");
      expect(runId[13]).toBe("-");
      expect(runId[18]).toBe("-");
      expect(runId[23]).toBe("-");
    });

    it("produces lowercase hex digits in the UUID", () => {
      // Use bytes that produce A-F if upper-cased
      const mixedBytes = [
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x11, 0x22, 0x33, 0x44,
        0x55,
      ];
      const buffer = buildFrame(mixedBytes, NETWORK_ID_BYTES, 0, []);
      const { runId } = parseSimulationFrame(buffer);
      expect(runId).toBe(runId.toLowerCase());
    });

    it("zero-pads single-digit hex bytes in the UUID", () => {
      // Byte 0x01 must appear as "01", not "1"
      const bytes = Array<number>(16).fill(0x01);
      const buffer = buildFrame(bytes, NETWORK_ID_BYTES, 0, []);
      const { runId } = parseSimulationFrame(buffer);
      // All byte segments are "01" — every two-char group must be "01"
      const withoutHyphens = runId.replace(/-/g, "");
      expect(withoutHyphens).toBe("01".repeat(16));
    });
  });

  describe("round parsing", () => {
    it("parses round from bytes 32–35 as big-endian uint32", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 42, []);
      const frame = parseSimulationFrame(buffer);
      expect(frame.round).toBe(42);
    });

    it("parses the maximum uint32 round value correctly", () => {
      const maxUint32 = 4_294_967_295;
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, maxUint32, []);
      const frame = parseSimulationFrame(buffer);
      expect(frame.round).toBe(maxUint32);
    });

    it("parses round 0 correctly", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 0, []);
      expect(parseSimulationFrame(buffer).round).toBe(0);
    });
  });

  describe("header-only buffer (no agents)", () => {
    it("returns an empty agents array when buffer is exactly 36 bytes", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 1, []);
      const frame = parseSimulationFrame(buffer);
      expect(frame.agents).toEqual([]);
    });

    it("still parses runId, networkId, and round correctly with no agents", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 7, []);
      const frame = parseSimulationFrame(buffer);
      expect(frame.runId).toBe(EXPECTED_RUN_ID);
      expect(frame.networkId).toBe(EXPECTED_NETWORK_ID);
      expect(frame.round).toBe(7);
    });
  });

  describe("single agent", () => {
    it("parses agentId as big-endian uint32", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 1, [
        { agentId: 99, belief: 0.5, speaking: false },
      ]);
      const frame = parseSimulationFrame(buffer);
      expect(frame.agents[0]?.agentId).toBe(99);
    });

    it("parses belief as big-endian float32", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 1, [
        { agentId: 1, belief: 0.75, speaking: false },
      ]);
      const frame = parseSimulationFrame(buffer);
      // float32 has limited precision — compare within tolerance
      expect(frame.agents[0]?.belief).toBeCloseTo(0.75, 5);
    });

    it("parses speaking as true when the byte is non-zero", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 1, [
        { agentId: 1, belief: 0, speaking: true },
      ]);
      expect(parseSimulationFrame(buffer).agents[0]?.speaking).toBe(true);
    });

    it("parses speaking as false when the byte is zero", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 1, [
        { agentId: 1, belief: 0, speaking: false },
      ]);
      expect(parseSimulationFrame(buffer).agents[0]?.speaking).toBe(false);
    });
  });

  describe("multiple agents", () => {
    it("returns the correct number of agent records", () => {
      const agents: AgentRecord[] = [
        { agentId: 1, belief: 0.1, speaking: true },
        { agentId: 2, belief: 0.5, speaking: false },
        { agentId: 3, belief: 0.9, speaking: true },
      ];
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 5, agents);
      expect(parseSimulationFrame(buffer).agents).toHaveLength(3);
    });

    it("parses each agent record independently without overlap", () => {
      const agents: AgentRecord[] = [
        { agentId: 10, belief: 0.1, speaking: true },
        { agentId: 20, belief: 0.5, speaking: false },
        { agentId: 30, belief: 0.9, speaking: true },
      ];
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 2, agents);
      const frame = parseSimulationFrame(buffer);

      expect(frame.agents[0]?.agentId).toBe(10);
      expect(frame.agents[0]?.speaking).toBe(true);

      expect(frame.agents[1]?.agentId).toBe(20);
      expect(frame.agents[1]?.speaking).toBe(false);

      expect(frame.agents[2]?.agentId).toBe(30);
      expect(frame.agents[2]?.speaking).toBe(true);
    });

    it("parses belief values for each agent within float32 precision", () => {
      const agents: AgentRecord[] = [
        { agentId: 1, belief: 0.0, speaking: false },
        { agentId: 2, belief: 0.5, speaking: false },
        { agentId: 3, belief: 1.0, speaking: false },
      ];
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 0, agents);
      const frame = parseSimulationFrame(buffer);

      expect(frame.agents[0]?.belief).toBeCloseTo(0.0, 5);
      expect(frame.agents[1]?.belief).toBeCloseTo(0.5, 5);
      expect(frame.agents[2]?.belief).toBeCloseTo(1.0, 5);
    });
  });

  describe("exact agent boundary sizes", () => {
    it("parses 1 agent from a 45-byte buffer (36 + 1×9)", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 0, [
        { agentId: 7, belief: 0.3, speaking: false },
      ]);
      expect(buffer.byteLength).toBe(45);
      expect(parseSimulationFrame(buffer).agents).toHaveLength(1);
    });

    it("parses 5 agents from a 81-byte buffer (36 + 5×9)", () => {
      const agents: AgentRecord[] = Array.from({ length: 5 }, (_, i) => ({
        agentId: i + 1,
        belief: i * 0.25,
        speaking: i % 2 === 0,
      }));
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 0, agents);
      expect(buffer.byteLength).toBe(81);
      expect(parseSimulationFrame(buffer).agents).toHaveLength(5);
    });

    it("parses 10 agents from a 126-byte buffer (36 + 10×9)", () => {
      const agents: AgentRecord[] = Array.from({ length: 10 }, (_, i) => ({
        agentId: i,
        belief: 0.5,
        speaking: false,
      }));
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 0, agents);
      expect(buffer.byteLength).toBe(126);
      expect(parseSimulationFrame(buffer).agents).toHaveLength(10);
    });
  });

  describe("return shape", () => {
    it("returns an object with runId, networkId, round, and agents keys", () => {
      const buffer = buildFrame(RUN_ID_BYTES, NETWORK_ID_BYTES, 3, []);
      const frame = parseSimulationFrame(buffer);
      expect(frame).toHaveProperty("runId");
      expect(frame).toHaveProperty("networkId");
      expect(frame).toHaveProperty("round");
      expect(frame).toHaveProperty("agents");
    });
  });
});
