import { setNodeColor } from '@/lib/utils'; // Asegúrate de que esta ruta sea correcta
import { Node, Links } from '@/lib/types';
// --- TIPOS DE ENTRADA (Provenientes del WebSocket) ---

export interface TopologyData {
  networkId: string;
  runId: bigint;
  numberOfAgents: number;
  numberOfNeighbors: number;
  indexOffset: Int32Array;
  neighborsRefs: Int32Array;
  neighborsWeights: Float32Array;
  neighborBiases: Uint8Array;
}

export interface SimulationData {
  runId: bigint;
  numberOfAgents: number;
  round: number;
  indexReference: number;
  beliefs: Float32Array;
  privateBeliefs: Float32Array;
  speakingStatuses: Uint8Array;
  timestamp: Date;
}

/**
 * Procesa los datos binarios de topología y de una ronda de simulación para
 * generar las estructuras de nodos y enlaces que necesita el visualizador de grafos.
 *
 * @param topologyData El paquete de datos de la estructura de la red.
 * @param roundData El paquete de datos del estado de los agentes para una ronda específica.
 * @returns Un objeto que contiene los arrays de `nodes` y `links`.
 */
export const processBinaryDataToGraph = (
  topologyData: TopologyData,
  roundData: SimulationData
): Promise<{ nodes: Node[]; links: Links[] }> => {
  
  const nodesMap = new Map<string, Node>();
  const roundDate = roundData.timestamp;

  // 1. CREAR LOS NODOS a partir de los datos de la ronda
  for (let i = 0; i < roundData.numberOfAgents; i++) {
    const agentId = i.toString();
    const belief = roundData.privateBeliefs[i];
    const publicBelief = roundData.beliefs[i];
    const isSpeaking = roundData.speakingStatuses[i] === 1;

    nodesMap.set(agentId, {
      id: agentId,
      color: setNodeColor(belief),
      belief,
      publicBelief,
      isSpeaking,
      // Inicializamos los historiales con los datos de esta ronda
      beliefsOverTime: [{ date: roundDate, value: belief }],
      publicBeliefsOverTime: [{ date: roundDate, value: publicBelief }],
      isSpeakingOverTime: [{ date: roundDate, value: isSpeaking }],
    });
  }

  // 2. CREAR LOS LINKS (ENLACES) usando la topología y el estado de los nodos
  const links: Links[] = [];
let neighborCursor =
  (topologyData.indexOffset && topologyData.indexOffset[0]) ?? 0;

for (let targetId = 0; targetId < topologyData.numberOfAgents; targetId++) {
  const offsets = topologyData.indexOffset as ArrayLike<number> | undefined;

  // Inicio de los vecinos para este agente
  const neighborsStart = offsets?.[targetId] ?? neighborCursor;

  // Fin "crudo" de los vecinos para este agente
  let rawEnd: number;
  if (offsets && targetId + 1 < (offsets as any).length) {
    rawEnd = offsets[targetId + 1] ?? neighborsStart;
  } else if (typeof topologyData.numberOfNeighbors === "number") {
    rawEnd = topologyData.numberOfNeighbors;
  } else {
    rawEnd = topologyData.neighborsRefs.length; // último recurso
  }

  // Clamp para no salirte de los arrays subyacentes
  const neighborsEnd = Math.min(
    rawEnd,
    topologyData.neighborsRefs.length,
    topologyData.neighborsWeights.length
  );

  // Recorremos solo la porción del array que corresponde a los vecinos del targetId actual
  for (let i = neighborsStart; i < neighborsEnd; i++) {
    const ref = topologyData.neighborsRefs[i];
    if (ref == null) continue; // evita .toString sobre undefined/null

    const sourceId = String(ref);
    const sourceNode = nodesMap.get(sourceId);

    // La condición clave: solo se crea un enlace si el nodo origen está "hablando"
    if (sourceNode?.isSpeaking) {
      links.push({
        source: sourceId,
        target: String(targetId),
        influenceValue: topologyData.neighborsWeights[i] ?? 0,
        date: roundDate,
      });
    }
  }

  // Actualizamos el cursor para el siguiente agente
  neighborCursor = neighborsEnd;
}
  
  const nodes = Array.from(nodesMap.values());
  return Promise.resolve({ nodes, links });
};