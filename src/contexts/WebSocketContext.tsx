import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getChannelId } from "../lib/channelStore.ts";

// This interface is used for the data points in our history map
interface ChartDataPoint {
  round: number;
  [key: string]: number | boolean | null;
}

// This interface represents a raw data packet from the WebSocket
interface SimulationData {
  runId: number;
  numberOfAgents: number;
  round: number;
  indexReference: number;
  beliefs: Float32Array;
  privateBeliefs: Float32Array;
  speakingStatuses: Uint8Array;
  timestamp: Date;
}

// This interface defines what the context will provide to consumers.
interface WebSocketContextType {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  latestSimulationData: SimulationData | null;
  historyMap: Map<number, ChartDataPoint>;
  messageCount: number;
  clearData: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

const RENDER_FPS = 5;
const RENDER_INTERVAL = 1000 / RENDER_FPS;

const WS_URL = import.meta.env.VITE_API_WS_URL;

export const SimulationWebSocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [historyMap, setHistoryMap] = useState<Map<number, ChartDataPoint>>(
    new Map(),
  );
  const [latestSimulationData, setLatestSimulationData] =
    useState<SimulationData | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const dataQueueRef = useRef<SimulationData[]>([]);
  const animationFrameId = useRef<number>();
  const lastRenderTimeRef = useRef<number>(0);

  const processAndQueueMessage = useCallback((buffer: ArrayBuffer) => {
    try {
      const dataView = new DataView(buffer);

      // The backend sends a 36-byte header. These offsets match that structure.
      // networkId is bytes 0-15
      const runId = dataView.getBigInt64(16, true);
      const numberOfAgents = dataView.getInt32(24, true);
      const round = dataView.getInt32(28, true);
      const indexReference = dataView.getInt32(32, true);
      const offset = 36;

      // The console log below will now show correct values
      console.log(
        `Header: runId=${runId}, agents=${numberOfAgents}, round=${round}`,
      );

      const expectedMinSize = offset + numberOfAgents * (4 + 4 + 1);
      if (buffer.byteLength < expectedMinSize) {
        console.warn(
          `Buffer too small: ${buffer.byteLength} bytes, expected at least ${expectedMinSize}`,
        );
        return;
      }

      const beliefs = new Float32Array(buffer, offset, numberOfAgents);
      const privateBeliefs = new Float32Array(
        buffer,
        offset + numberOfAgents * 4,
        numberOfAgents,
      );
      const speakingStatuses = new Uint8Array(
        buffer,
        offset + numberOfAgents * 8,
        numberOfAgents,
      );

      dataQueueRef.current.push({
        runId: Number(runId),
        numberOfAgents,
        round,
        indexReference,
        beliefs,
        privateBeliefs,
        speakingStatuses,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error parsing binary message:", error);
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
    setMessageCount((prev) => prev + batchToProcess.length);

    setHistoryMap((prevMap) => {
      const newMap = new Map(prevMap);
      for (const data of batchToProcess) {
        const { round, beliefs, speakingStatuses, indexReference } = data;
        const existingData = newMap.get(round) || { round };

        let roundMax = existingData.max as number | undefined;
        let roundMin = existingData.min as number | undefined;

        const roundData: ChartDataPoint = { ...existingData };

        for (let index = 0; index < beliefs.length; index++) {
          const agentId = indexReference + index;
          const belief = beliefs[index];
          roundData[`agent${agentId}`] = belief;
          roundData[`speaking${agentId}`] = speakingStatuses[index] === 1;

          if (roundMax === undefined || belief > roundMax) roundMax = belief;
          if (roundMin === undefined || belief < roundMin) roundMin = belief;
        }

        roundData.max = roundMax ?? null;
        roundData.min = roundMin ?? null;

        newMap.set(round, roundData);
      }
      return newMap;
    });
  }, []);

  const disconnect = useCallback(() => {
    if (
      socketRef.current &&
      socketRef.current.readyState !== WebSocket.CLOSED
    ) {
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
    const socket = new WebSocket(`${WS_URL}/ws/${channelId}`);

    socket.onopen = () => {
      console.log(`Connected to WebSocket on channel: ${channelId}`);
      setConnected(true);
      lastRenderTimeRef.current = performance.now();
      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    socket.onclose = (event) => {
      console.log(
        `Disconnected from WebSocket. Code: ${event.code}, Reason: ${event.reason}`,
      );
      setConnected(false);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };

    socket.onmessage = (event) => {
      if (event.data instanceof Blob) {
        event.data
          .arrayBuffer()
          .then(processAndQueueMessage)
          .catch((error) => {
            console.error("Error converting blob to buffer:", error);
          });
      }
    };

    socketRef.current = socket;
  }, [processAndQueueMessage, renderLoop, disconnect]);

  const clearData = useCallback(() => {
    dataQueueRef.current = [];
    setHistoryMap(new Map());
    setLatestSimulationData(null);
    setMessageCount(0);
  }, []);

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
        historyMap,
        messageCount,
        clearData,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useSimulationWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error(
      "useSimulationWebSocket must be used within a SimulationWebSocketProvider",
    );
  }
  return context;
};
