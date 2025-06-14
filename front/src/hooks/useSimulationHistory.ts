// src/hooks/useSimulationHistory.ts
import { useMemo } from 'react';
import { useSimulationWebSocket } from '@/contexts/WebSocketContext';

export const useSimulationHistory = () => {
  const { historyMap, clearData } = useSimulationWebSocket();

  const history = useMemo(() => {
    console.log(`Memoizing history for ${historyMap.size} rounds.`);
    return Array.from(historyMap.values()).sort((a, b) => a.round - b.round);
  }, [historyMap]);

  const getLatestRound = () => {
    if (historyMap.size === 0) return 0;
    return Math.max(...historyMap.keys());
  };

  const getAgentKeys = () => {
    if (historyMap.size === 0) return [];
    const latestRoundData = historyMap.get(getLatestRound());
    if (!latestRoundData) return [];
    return Object.keys(latestRoundData)
      .filter(key => key.startsWith('agent'))
      .sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)));
  };

  return {
    history,
    totalRounds: historyMap.size,
    clearHistory: clearData,
    getLatestRound,
    getAgentKeys,
    getRoundData: (round: number) => historyMap.get(round) || null,
  };
};