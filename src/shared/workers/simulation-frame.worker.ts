/// <reference lib="webworker" />
import { parseSimulationFrame } from "@/shared/lib/simulation-frame";
import type { MergedFrame } from "./simulation-frame-merger";
import { PartitionMerger } from "./simulation-frame-merger";

type InMessage = { type: "init"; agentCount: number } | { type: "frame"; buffer: ArrayBuffer };

let merger: PartitionMerger | null = null;

(self as DedicatedWorkerGlobalScope).onmessage = (event: MessageEvent<InMessage>) => {
  const msg = event.data;

  if (msg.type === "init") {
    merger = new PartitionMerger(msg.agentCount);
    return;
  }

  if (msg.type === "frame" && merger) {
    const partition = parseSimulationFrame(msg.buffer);
    const merged = merger.processPartition(partition);
    if (merged) {
      (self as DedicatedWorkerGlobalScope).postMessage(merged as MergedFrame, [
        merged.publicBelief.buffer,
        merged.privateBelief.buffer,
        merged.speaking.buffer,
      ]);
    }
  }
};
