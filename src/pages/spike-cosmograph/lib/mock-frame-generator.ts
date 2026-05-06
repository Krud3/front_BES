/**
 * Mock frame generator for the Cosmograph spike.
 *
 * This is throwaway code — it lives only in the spike branch and will be
 * deleted once Phase 3 validation is complete.
 *
 * Design decisions:
 * - All Float32Array / Uint8Array allocations happen in generateInitialTopology
 *   and createFrameStream. Zero allocations inside the hot path (onFrame callbacks).
 * - Topology uses a small-world ring lattice: each agent connects to the k nearest
 *   neighbours in the index ring, then each edge is rewired with probability p=0.1.
 *   This keeps edge distribution realistic without requiring an external library.
 * - LCG-based PRNG makes results reproducible given the same seed.
 */

// ---------------------------------------------------------------------------
// PRNG (Linear Congruential Generator — Knuth MMIX constants)
// ---------------------------------------------------------------------------

class LCG {
  private state: number;

  constructor(seed: number) {
    // Ensure seed is a positive 32-bit integer
    this.state = seed >>> 0 || 1;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    // 32-bit LCG
    this.state = Math.imul(1664525, this.state) + 1013904223;
    this.state >>>= 0; // keep unsigned 32-bit
    return this.state / 0x100000000;
  }

  /** Returns an integer in [0, max) */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Returns a float in [min, max] */
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

// ---------------------------------------------------------------------------
// Topology
// ---------------------------------------------------------------------------

export interface SpikeTopology {
  pointIds: string[];
  pointIndices: Uint32Array;
  linkSourceIds: string[];
  linkTargetIds: string[];
  linkSourceIndices: Uint32Array;
  linkTargetIndices: Uint32Array;
}

/**
 * Generate a small-world graph topology for the spike.
 *
 * @param agentCount   Number of agents (nodes).
 * @param edgesPerAgent Average out-degree per agent (0 = no edges).
 * @param seed         Reproducibility seed (default 42).
 */
export function generateInitialTopology(
  agentCount: number,
  edgesPerAgent: number,
  seed = 42,
): SpikeTopology {
  const rng = new LCG(seed);

  // Point IDs — use string representation of index for Cosmograph pointIdBy
  const pointIds: string[] = new Array<string>(agentCount);
  const pointIndices = new Uint32Array(agentCount);
  for (let i = 0; i < agentCount; i++) {
    pointIds[i] = String(i);
    pointIndices[i] = i;
  }

  if (edgesPerAgent === 0) {
    return {
      pointIds,
      pointIndices,
      linkSourceIds: [],
      linkTargetIds: [],
      linkSourceIndices: new Uint32Array(0),
      linkTargetIndices: new Uint32Array(0),
    };
  }

  // Small-world ring lattice
  // k = edgesPerAgent nearest neighbours (k/2 on each side)
  const k = Math.max(2, edgesPerAgent);
  const halfK = Math.floor(k / 2);
  const rewireProbability = 0.1;

  // Collect edges as pairs to deduplicate
  const edgeSet = new Set<string>();
  const srcList: number[] = [];
  const tgtList: number[] = [];

  const addEdge = (src: number, tgt: number): void => {
    if (src === tgt) return;
    const key = src < tgt ? `${src}-${tgt}` : `${tgt}-${src}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    srcList.push(src);
    tgtList.push(tgt);
  };

  for (let i = 0; i < agentCount; i++) {
    for (let d = 1; d <= halfK; d++) {
      const j = (i + d) % agentCount;
      if (rng.next() < rewireProbability) {
        // Rewire to a random node
        addEdge(i, rng.nextInt(agentCount));
      } else {
        addEdge(i, j);
      }
    }
  }

  const edgeCount = srcList.length;
  const linkSourceIndices = new Uint32Array(edgeCount);
  const linkTargetIndices = new Uint32Array(edgeCount);
  const linkSourceIds: string[] = new Array<string>(edgeCount);
  const linkTargetIds: string[] = new Array<string>(edgeCount);

  for (let i = 0; i < edgeCount; i++) {
    linkSourceIndices[i] = srcList[i];
    linkTargetIndices[i] = tgtList[i];
    linkSourceIds[i] = String(srcList[i]);
    linkTargetIds[i] = String(tgtList[i]);
  }

  return {
    pointIds,
    pointIndices,
    linkSourceIds,
    linkTargetIds,
    linkSourceIndices,
    linkTargetIndices,
  };
}

// ---------------------------------------------------------------------------
// Frame stream
// ---------------------------------------------------------------------------

export type OnFrameCallback = (
  publicBelief: Float32Array,
  privateBelief: Float32Array,
  speaking: Uint8Array,
  round: number,
) => void;

export interface FrameStream {
  start(onFrame: OnFrameCallback): void;
  stop(): void;
}

/**
 * Creates a frame stream that fires `onFrame` at `tickRateHz`.
 *
 * The same pre-allocated typed arrays are passed to every callback.
 * The caller must NOT store references across ticks — it should copy
 * the data it needs immediately (or use a latestFrameRef pattern).
 *
 * @param agentCount  Number of agents.
 * @param tickRateHz  Target tick rate (e.g. 30 or 60).
 * @param seed        PRNG seed for reproducibility.
 */
export function createFrameStream(agentCount: number, tickRateHz: number, seed = 99): FrameStream {
  // Pre-allocate all buffers once
  const publicBelief = new Float32Array(agentCount);
  const privateBelief = new Float32Array(agentCount);
  const speaking = new Uint8Array(agentCount);

  const rng = new LCG(seed);

  // Initialise with random values in [-1, 1]
  for (let i = 0; i < agentCount; i++) {
    publicBelief[i] = rng.nextFloat(-1, 1);
    privateBelief[i] = rng.nextFloat(-1, 1);
    speaking[i] = rng.next() > 0.5 ? 1 : 0;
  }

  const intervalMs = Math.round(1000 / tickRateHz);
  let round = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  return {
    start(onFrame: OnFrameCallback): void {
      if (intervalId !== null) return;

      intervalId = setInterval(() => {
        round++;
        // Mutate in place — random walk on beliefs, probabilistic speaking toggle
        for (let i = 0; i < agentCount; i++) {
          // Random walk ±0.02 clamped to [-1, 1]
          publicBelief[i] = Math.max(-1, Math.min(1, publicBelief[i] + rng.nextFloat(-0.02, 0.02)));
          privateBelief[i] = Math.max(
            -1,
            Math.min(1, privateBelief[i] + rng.nextFloat(-0.02, 0.02)),
          );
          // 5 % chance to toggle speaking state each tick
          if (rng.next() < 0.05) {
            speaking[i] = speaking[i] === 0 ? 1 : 0;
          }
        }
        onFrame(publicBelief, privateBelief, speaking, round);
      }, intervalMs);
    },

    stop(): void {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
}
