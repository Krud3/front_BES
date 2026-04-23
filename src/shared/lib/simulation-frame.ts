export interface SimulationFrame {
  runId: string;
  networkId: string;
  round: number;
  agents: Array<{
    agentId: number;
    belief: number;
    speaking: boolean;
  }>;
}

// UUID: 4 groups separated by hyphens (8-4-4-4-12 hex chars)
function bytesToUuid(view: DataView, offset: number): string {
  const hex = Array.from({ length: 16 }, (_, i) =>
    view
      .getUint8(offset + i)
      .toString(16)
      .padStart(2, "0"),
  );
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

// Header: 16 (runId) + 16 (networkId) + 4 (round) = 36 bytes
// Each agent record: 4 (agentId) + 4 (belief) + 1 (speaking) = 9 bytes
const HEADER_BYTES = 36;
const AGENT_RECORD_BYTES = 9;

export function parseSimulationFrame(buffer: ArrayBuffer): SimulationFrame {
  const view = new DataView(buffer);

  const runId = bytesToUuid(view, 0);
  const networkId = bytesToUuid(view, 16);
  const round = view.getUint32(32, false); // big-endian

  const agentCount = (buffer.byteLength - HEADER_BYTES) / AGENT_RECORD_BYTES;
  const agents: SimulationFrame["agents"] = [];

  for (let i = 0; i < agentCount; i++) {
    const base = HEADER_BYTES + i * AGENT_RECORD_BYTES;
    agents.push({
      agentId: view.getUint32(base, false),
      belief: view.getFloat32(base + 4, false),
      speaking: view.getUint8(base + 8) !== 0,
    });
  }

  return { runId, networkId, round, agents };
}
