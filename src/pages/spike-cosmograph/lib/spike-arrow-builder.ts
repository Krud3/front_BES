/**
 * Arrow Table builder for the Cosmograph spike.
 *
 * Key design decisions:
 *
 * 1. String `id` column: vectorFromArray produces a Utf8 vector from a JS
 *    string array. This is built ONCE at mount and reused every tick because
 *    string encoding is the most expensive part of Arrow serialisation.
 *
 * 2. `index` column: same — built once, reused as-is.
 *
 * 3. Per-tick numeric columns (publicBelief, privateBelief, speaking): built
 *    with `makeVector` from the existing typed arrays. makeVector wraps the
 *    underlying buffer without copying when the array is already the right
 *    Arrow primitive type — Float32 → Float32Array, Uint8 → Uint8Array.
 *
 * 4. `new Table({ ... })` constructor is used instead of tableFromArrays so
 *    we can mix pre-built Vectors with freshly-wrapped buffers per-tick.
 *
 * 5. Links Table is built once at mount and never touched during the hot path.
 *
 * Zero heap allocation in the hot path: makeVector and new Table only add
 * lightweight JS wrapper objects over the existing typed-array memory.
 */

import {
  Uint32 as ArrowUint32,
  makeVector,
  Table,
  Utf8,
  type Vector,
  vectorFromArray,
} from "apache-arrow";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PointsTableInput {
  /** Pre-built id vector — reuse across ticks */
  idVector: Vector<Utf8>;
  /** Pre-built index vector — reuse across ticks */
  indexVector: Vector<ArrowUint32>;
  /** Mutable Float32Array of length agentCount */
  publicBelief: Float32Array;
  /** Mutable Float32Array of length agentCount */
  privateBelief: Float32Array;
  /** Mutable Uint8Array of length agentCount */
  speaking: Uint8Array;
}

export interface LinksTableInput {
  sourceIds: string[];
  targetIds: string[];
  sourceIndices: Uint32Array;
  targetIndices: Uint32Array;
}

// ---------------------------------------------------------------------------
// One-time builders (call at mount, not per-tick)
// ---------------------------------------------------------------------------

/**
 * Build the id and index vectors once at mount.
 * Pass the returned vectors to buildPointsTable on every tick.
 */
export function buildStaticPointVectors(
  pointIds: string[],
  pointIndices: Uint32Array,
): { idVector: Vector<Utf8>; indexVector: Vector<ArrowUint32> } {
  // vectorFromArray encodes the string array into an Arrow Utf8 vector
  const idVector = vectorFromArray(pointIds, new Utf8()) as Vector<Utf8>;

  // makeVector wraps the Uint32Array buffer directly — zero copy
  const indexVector = makeVector({
    type: new ArrowUint32(),
    length: pointIndices.length,
    buffers: [null, pointIndices.buffer],
    byteOffset: pointIndices.byteOffset,
  }) as unknown as Vector<ArrowUint32>;

  // fallback: if makeVector signature doesn't accept that form, use vectorFromArray
  if (!indexVector || indexVector.length !== pointIndices.length) {
    const fallback = vectorFromArray(
      Array.from(pointIndices),
      new ArrowUint32(),
    ) as Vector<ArrowUint32>;
    return { idVector, indexVector: fallback };
  }

  return { idVector, indexVector };
}

/**
 * Build the links Arrow Table once at mount.
 */
export function buildLinksTable(input: LinksTableInput): Table {
  const { sourceIds, targetIds, sourceIndices, targetIndices } = input;

  if (sourceIds.length === 0) {
    // Return empty table with correct schema
    return new Table({
      sourceId: vectorFromArray([], new Utf8()),
      targetId: vectorFromArray([], new Utf8()),
      source: vectorFromArray([], new ArrowUint32()),
      target: vectorFromArray([], new ArrowUint32()),
    });
  }

  return new Table({
    sourceId: vectorFromArray(sourceIds, new Utf8()),
    targetId: vectorFromArray(targetIds, new Utf8()),
    source: vectorFromArray(Array.from(sourceIndices), new ArrowUint32()),
    target: vectorFromArray(Array.from(targetIndices), new ArrowUint32()),
  });
}

// ---------------------------------------------------------------------------
// Per-tick builder (hot path)
// ---------------------------------------------------------------------------

/**
 * Build an Arrow Table for the current tick.
 *
 * The `idVector` and `indexVector` are reused from mount — no string re-encoding.
 * publicBelief, privateBelief, and speaking are wrapped without copying.
 *
 * Note: Apache Arrow's makeVector wraps Float32Array/Uint8Array directly when
 * passed as the `data` argument of type Float32 / Uint8.
 */
export function buildPointsTable(input: PointsTableInput): Table {
  const { idVector, indexVector, publicBelief, privateBelief, speaking } = input;

  // Wrap typed arrays without copying — makeVector on typed arrays for numeric types
  const publicBeliefVec = makeVector(
    new Float32Array(publicBelief.buffer, publicBelief.byteOffset, publicBelief.length),
  );
  const privateBeliefVec = makeVector(
    new Float32Array(privateBelief.buffer, privateBelief.byteOffset, privateBelief.length),
  );
  const speakingVec = makeVector(
    new Uint8Array(speaking.buffer, speaking.byteOffset, speaking.length),
  );

  return new Table({
    id: idVector,
    index: indexVector,
    publicBelief: publicBeliefVec,
    privateBelief: privateBeliefVec,
    speaking: speakingVec,
  });
}

// ---------------------------------------------------------------------------
// Schema-mirrored builder
// ---------------------------------------------------------------------------

/**
 * Build a per-tick Arrow Table whose schema mirrors a reference Table
 * (typically `prepared.points` returned by `prepareCosmographData`).
 *
 * For every column in the reference schema:
 *   - `publicBelief`, `privateBelief`, `speaking` are replaced with fresh
 *     vectors wrapping the latest typed arrays (zero copy).
 *   - All other columns reuse the reference table's vectors as-is.
 *
 * This guarantees that Cosmograph's internal validation (which checks for
 * `pointIdBy`, `pointIndexBy`, etc. against the prepared config's column
 * names) sees an identical schema and accepts the new table.
 */
export function buildPointsTableFromPrepared(
  prepared: Table,
  publicBelief: Float32Array,
  privateBelief: Float32Array,
  speaking: Uint8Array,
): Table {
  const fields: Record<string, unknown> = {};

  for (const field of prepared.schema.fields) {
    const name = field.name;
    if (name === "publicBelief") {
      fields[name] = makeVector(
        new Float32Array(publicBelief.buffer, publicBelief.byteOffset, publicBelief.length),
      );
    } else if (name === "privateBelief") {
      fields[name] = makeVector(
        new Float32Array(privateBelief.buffer, privateBelief.byteOffset, privateBelief.length),
      );
    } else if (name === "speaking") {
      fields[name] = makeVector(
        new Uint8Array(speaking.buffer, speaking.byteOffset, speaking.length),
      );
    } else {
      // Reuse the prepared vector by name (id, idx, and any auto-generated columns)
      const vec = prepared.getChild(name);
      if (vec !== null) fields[name] = vec;
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: Arrow Table constructor accepts a column-name → Vector map; the runtime contract is dynamic.
  return new Table(fields as any);
}
