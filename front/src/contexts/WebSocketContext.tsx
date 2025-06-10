// src/contexts/SimulationWebSocketContext.tsx
import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import { flushSync } from 'react-dom';

interface SimulationData {
  runId: number;
  numberOfAgents: number;
  round: number;
  beliefs: (number | null)[];
  speakingStatuses: boolean[];
  timestamp: Date;
}

interface WebSocketContextType {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  simulationData: SimulationData | null;
  messageCount: number;
  clearData: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const SimulationWebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  const processBinaryMessage = useCallback((buffer: ArrayBuffer) => {
    const dataView = new DataView(buffer);

    try {
      // Extract header data with big-endian
      const runId          = dataView.getInt32(16, false);
      const numberOfAgents = dataView.getInt32(20, false);
      const round          = dataView.getInt32(24, false);
      console.log(`Received data for round ${round} at ${new Date().toISOString()}`);

      // Skip header and UUIDs
      const beliefsOffset = 28 + (numberOfAgents * 16);

      const expectedMinSize = 28 + (numberOfAgents * 16) + (numberOfAgents * 4);
      if (buffer.byteLength < expectedMinSize) {
          console.warn(`Buffer too small: ${buffer.byteLength} bytes, expected at least ${expectedMinSize}`);
          return;
      }

      // Extract beliefs
      const beliefs: (number | null)[] = [];
      for (let i = 0; i < numberOfAgents; i++) {
        try {
          const belief = dataView.getFloat32(beliefsOffset + (i * 4), false);
          beliefs[i] = (!isNaN(belief) && belief >= 0 && belief <= 1) ? belief : null;
        } catch (e) {
          beliefs[i] = null;
        }
      }

      // Extract speaking status
      const speakingStatuses: boolean[] = [];
      try {
        const speakingOffset = beliefsOffset + (numberOfAgents * 4);
        if (buffer.byteLength >= speakingOffset + numberOfAgents) {
          for (let i = 0; i < numberOfAgents; i++) {
            speakingStatuses[i] = dataView.getUint8(speakingOffset + i) === 1;
          }
        }
      } catch (e) {
        console.warn("Error reading speaking statuses:", e);
      }

      // Update simulation data
      const validBeliefs = beliefs.filter(b => b !== null);
      if (validBeliefs.length > 0) {
        flushSync(() => {
          setSimulationData({
            runId,
            numberOfAgents,
            round,
            beliefs,
            speakingStatuses,
            timestamp: new Date()
          });
        });
      } else {
          console.warn(`No valid beliefs found in round ${round}`);
      }

    } catch (error) {
      console.error('Error parsing binary message:', error);
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current) {
      disconnect();
    }

    const socket = new WebSocket('ws://localhost:8080/ws');

    socket.onopen = () => {
      console.log('Connected to WebSocket');
      setConnected(true);
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    socket.onmessage = (event) => {
      flushSync(() => {
        setMessageCount(prev => prev + 1);
      });

      if (event.data instanceof Blob) {
        console.log(`Processing blob of size: ${event.data.size} bytes`); // Agregar este log
        event.data.arrayBuffer().then(buffer => {
          processBinaryMessage(buffer);
        }).catch(error => {
          console.error('Error converting blob to buffer:', error); // Agregar manejo de error
        });
      }
    };

    socketRef.current = socket;
  }, [processBinaryMessage]);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const clearData = useCallback(() => {
    setSimulationData(null);
    setMessageCount(0);
  }, []);

  return (
    <WebSocketContext.Provider value={{
      connected,
      connect,
      disconnect,
      simulationData,
      messageCount,
      clearData
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useSimulationWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useSimulationWebSocket must be used within a SimulationWebSocketProvider');
  }
  return context;
};