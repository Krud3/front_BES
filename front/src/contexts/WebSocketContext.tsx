import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getChannelId } from '../lib/channelStore.ts';
import { Node, Links, TopologyData, SimulationData } from '@/lib/types'; // Asegúrate que los tipos estén exportados desde types.ts
import { processBinaryDataToGraph } from '@/lib/graphProcessor.ts';

/** =========================
 * Tipos y modelos
 * ========================= */

interface ChartDataPoint {
  round: number;
  [key: string]: number | boolean | null;
}

interface WebSocketContextType {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  latestSimulationData: SimulationData | null;
  topologyData: TopologyData | null;
  nodes: Node[];
  links: Links[];
  isGraphInitialized: boolean;
  historyMap: Map<number, ChartDataPoint>;
  messageCount: number;
  clearData: () => void;
}

/** =========================
 * Contexto y Provider
 * ========================= */

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const RENDER_FPS = 5;
const RENDER_INTERVAL = 1000 / RENDER_FPS;

export const SimulationWebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [latestSimulationData, setLatestSimulationData] = useState<SimulationData | null>(null);
  const [topologyData, setTopologyData] = useState<TopologyData | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Links[]>([]);
  const [isGraphInitialized, setIsGraphInitialized] = useState(false);
  const [historyMap, setHistoryMap] = useState<Map<number, ChartDataPoint>>(new Map());
  const [messageCount, setMessageCount] = useState(0);

  const [roundZeroData, setRoundZeroData] = useState<SimulationData | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const dataQueueRef = useRef<SimulationData[]>([]);
  const animationFrameId = useRef<number>();
  const lastRenderTimeRef = useRef<number>(0);

  const processAndQueueMessage = useCallback((buffer: ArrayBuffer) => {
    if (buffer.byteLength === 0) return;
    const view = new DataView(buffer);
    const packetId = view.getUint8(0);

    const parseTopologyPacket = (buf: ArrayBuffer) => {
      const dataView = new DataView(buf);
      let offset = 4;
      const networkId_msb = dataView.getBigUint64(offset, false); offset += 8;
      const networkId_lsb = dataView.getBigUint64(offset, false); offset += 8;
      const runId = dataView.getBigUint64(offset, false); offset += 8;
      const numberOfAgents = dataView.getInt32(offset, false); offset += 4;
      const numberOfNeighbors = dataView.getInt32(offset, false); offset += 4;
      const indexOffset = new Int32Array(buf, offset, numberOfAgents); offset += numberOfAgents * 4;
      const neighborsRefs = new Int32Array(buf, offset, numberOfNeighbors); offset += numberOfNeighbors * 4;
      const neighborsWeights = new Float32Array(buf, offset, numberOfNeighbors); offset += numberOfNeighbors * 4;
      const neighborBiases = new Uint8Array(buf, offset, numberOfNeighbors);
      const topology: TopologyData = { networkId: `${networkId_msb.toString(16)}-${networkId_lsb.toString(16)}`, runId, numberOfAgents, numberOfNeighbors, indexOffset, neighborsRefs, neighborsWeights, neighborBiases };
      setTopologyData(topology);
      console.log("✅ Topology data received and processed:", topology);
    };

    const parseRoundDataPacket = (buf: ArrayBuffer) => {
      const dataView = new DataView(buf);
      let offset = 4;
      offset += 16;
      const runId = dataView.getBigInt64(offset, true); offset += 8;
      const numberOfAgents = dataView.getInt32(offset, true); offset += 4;
      const round = dataView.getInt32(offset, true); offset += 4;
      const indexReference = dataView.getInt32(offset, true); offset += 4;
      const publicBeliefs = new Float32Array(buf, offset, numberOfAgents); offset += numberOfAgents * 4;
      const privateBeliefs = new Float32Array(buf, offset, numberOfAgents); offset += numberOfAgents * 4;
      const speakingStatuses = new Uint8Array(buf, offset, numberOfAgents);
      const newSimData: SimulationData = { runId, numberOfAgents, round, indexReference, beliefs: publicBeliefs, privateBeliefs, speakingStatuses, timestamp: new Date() };
      
      // --- LÓGICA MODIFICADA ---
      // "Atrapamos" los datos de la ronda 0 la primera vez que llegan.
      if (round === 0) {
        setRoundZeroData(newSimData);
      }

      dataQueueRef.current.push(newSimData);
    };

    console.log(`PacketID: ${packetId}`);
    switch (packetId) {
      case 1: parseTopologyPacket(buffer); break;
      case 2: parseRoundDataPacket(buffer); break;
      default: console.warn(`Unknown packet ID received: ${packetId}`);
    }
  }, []);

  const renderLoop = useCallback(() => {
    animationFrameId.current = requestAnimationFrame(renderLoop);
    const now = performance.now();
    if (now - lastRenderTimeRef.current < RENDER_INTERVAL) {
      return;
    }
    lastRenderTimeRef.current = now;
    if (dataQueueRef.current.length === 0) {
      return;
    }
    const batchToProcess = dataQueueRef.current;
    dataQueueRef.current = [];
    setLatestSimulationData(batchToProcess[batchToProcess.length - 1]);
    setMessageCount(prev => prev + batchToProcess.length);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current) {
      disconnect();
    }
    const channelId = getChannelId();
    const socket = new WebSocket(`ws://localhost:9000/ws/${channelId}`);
    socketRef.current = socket;
    
    socket.onopen = () => {
      console.log(`Connected to WebSocket on channel: ${channelId}`);
      setConnected(true);
      lastRenderTimeRef.current = performance.now();
      animationFrameId.current = requestAnimationFrame(renderLoop);
    };
    socket.onclose = (event) => {
      console.log(`Disconnected from WebSocket. Code: ${event.code}, Reason: ${event.reason}`);
      setConnected(false);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };
    socket.onmessage = (event) => {
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then(processAndQueueMessage).catch(error => {
          console.error('Error converting blob to buffer:', error);
        });
      }
    };
  }, [processAndQueueMessage, renderLoop, disconnect]);

  const clearData = useCallback(() => {
    dataQueueRef.current = [];
    setHistoryMap(new Map());
    setLatestSimulationData(null);
    setTopologyData(null);
    setMessageCount(0);
    setNodes([]);
    setLinks([]);
    setIsGraphInitialized(false);
    // --- MODIFICADO ---
    // Limpiamos también el estado de la ronda 0.
    setRoundZeroData(null);
  }, []);

  // --- LÓGICA DE ENSAMBLAJE CORREGIDA Y ROBUSTA ---
  useEffect(() => {
    // La nueva condición: se ejecuta cuando tengamos la topología Y los datos de la ronda 0.
    if (topologyData && roundZeroData && !isGraphInitialized) {
      console.log("🚀 Assembling initial graph state...");
      
      // Usamos los datos guardados de la ronda 0, garantizando que son los correctos.
      (async () => {
        const graph = await processBinaryDataToGraph(topologyData, roundZeroData);
        setNodes(graph.nodes);
        setLinks(graph.links);
        setIsGraphInitialized(true);
        console.log("✅ Initial graph state assembled!", { nodes: graph.nodes, links: graph.links });
      })();
    }
  }, [topologyData, roundZeroData, isGraphInitialized]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        connect,
        disconnect,
        latestSimulationData,
        topologyData,
        nodes,
        links,
        isGraphInitialized,
        historyMap,
        messageCount,
        clearData,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

/** =========================
 * Hook de consumo
 * ========================= */

export const useSimulationWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useSimulationWebSocket must be used within a SimulationWebSocketProvider');
  }
  return context;
};

