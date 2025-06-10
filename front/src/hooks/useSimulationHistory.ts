// src/hooks/useSimulationHistory.ts
import { useState, useEffect, useRef } from 'react';
import { useSimulationWebSocket } from '@/contexts/WebSocketContext';

interface ChartDataPoint {
  round: number;
  [key: string]: number | boolean | null;
}

export const useSimulationHistory = () => {
  const { simulationData } = useSimulationWebSocket();
  const [history, setHistory] = useState<ChartDataPoint[]>([]);
  
  const pendingUpdates = useRef<ChartDataPoint[]>([]);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!simulationData) return;

    console.log('Processing simulation data:', {
        round: simulationData.round,
        beliefsLength: simulationData.beliefs.length,
        validBeliefs: simulationData.beliefs.filter(b => b !== null).length,
        speakingLength: simulationData.speakingStatuses.length
    });

    const { round, beliefs, speakingStatuses } = simulationData;

    // Create data point for this round
    const roundData: ChartDataPoint = { round };

    // Add beliefs and speaking status
    beliefs.forEach((belief, index) => {
      if (belief !== null) {
        roundData[`agent${index}`] = belief;
        roundData[`speaking${index}`] = speakingStatuses[index] || false;
      }
    });
    console.log('Created roundData:', roundData);

    // Update history
    setHistory(prevHistory => {
      const roundIndex = prevHistory.findIndex(d => d.round === round);

      if (roundIndex >= 0) {
        const newHistory = [...prevHistory];
        newHistory[roundIndex] = roundData;
        return newHistory.sort((a, b) => a.round - b.round);
      } else {
        return [...prevHistory, roundData].sort((a, b) => a.round - b.round);
      }
    });
  }, [simulationData]);

  const clearHistory = () => setHistory([]);

  return { history, clearHistory };
};