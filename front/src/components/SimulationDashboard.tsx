import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useSimulationWebSocket } from '@/contexts/WebSocketContext';
import { useSimulationHistory } from '@/hooks/useSimulationHistory';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Play, Pause, SkipBack, SkipForward, Trash2 } from 'lucide-react';

export const SimulationDashboard: React.FC = () => {
  const { connected, connect, disconnect, latestSimulationData: simulationData, clearData } = useSimulationWebSocket();

  const { history, clearHistory } = useSimulationHistory();
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  
  // Get data for selected round or current round
  const currentRoundData = useMemo(() => {
    if (selectedRound !== null && history.length > 0) {
      return history.find(h => h.round === selectedRound);
    }
    return simulationData;
  }, [selectedRound, simulationData, history]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!currentRoundData) {
      return {
        round: 0,
        speakingCount: 0,
        averageBelief: 0,
        standardDeviation: 0,
        totalAgents: 0
      };
    }

    // Get beliefs from current data
    let beliefs: number[] = [];
    let speakingCount = 0;
    
    if ('beliefs' in currentRoundData) {
      // It's simulationData format
      beliefs = Array.isArray(currentRoundData.beliefs)
        ? currentRoundData.beliefs.filter((b): b is number => b !== null)
        : [];
      speakingCount = Array.isArray(currentRoundData.speakingStatuses)
        ? currentRoundData.speakingStatuses.filter(s => s).length
        : 0;
    } else {
      // It's history format
      Object.keys(currentRoundData).forEach(key => {
        if (key.startsWith('agent')) {
          const value = currentRoundData[key];
          if (typeof value === 'number') {
            beliefs.push(value);
          }
        }
        if (key.startsWith('speaking')) {
          if (currentRoundData[key] === true) {
            speakingCount++;
          }
        }
      });
    }

    const totalAgents = beliefs.length;
    const averageBelief = beliefs.reduce((sum, b) => sum + b, 0) / totalAgents || 0;
    
    // Calculate standard deviation
    const variance = beliefs.reduce((sum, b) => sum + Math.pow(b - averageBelief, 2), 0) / totalAgents || 0;
    const standardDeviation = Math.sqrt(variance);

    return {
      round: currentRoundData.round,
      speakingCount,
      averageBelief,
      standardDeviation,
      totalAgents
    };
  }, [currentRoundData]);

  // Progress calculation
  const maxRound = useMemo(() => {
    if (history.length === 0) return simulationData?.round || 100;
    return Math.max(...history.map(h => h.round));
  }, [history, simulationData]);

  const progressPercentage = (metrics.round / maxRound) * 100;

  // Historical data for mini charts
  const historicalMetrics = useMemo(() => {
    return history.map(dataPoint => {
      let beliefs: number[] = [];
      let speakingCount = 0;
      
      Object.keys(dataPoint).forEach(key => {
        if (key.startsWith('agent')) {
          const value = dataPoint[key];
          if (typeof value === 'number') {
            beliefs.push(value);
          }
        }
        if (key.startsWith('speaking') && dataPoint[key] === true) {
          speakingCount++;
        }
      });

      const avg = beliefs.reduce((sum, b) => sum + b, 0) / beliefs.length || 0;
      const variance = beliefs.reduce((sum, b) => sum + Math.pow(b - avg, 2), 0) / beliefs.length || 0;
      
      return {
        round: dataPoint.round,
        average: avg,
        stdDev: Math.sqrt(variance),
        speaking: speakingCount
      };
    });
  }, [history]);

  // Clear all data
  const handleClearData = () => {
    clearData();
    clearHistory();
    setSelectedRound(null);
  };

  // Navigation functions
  const handlePreviousRound = () => {
    if (history.length === 0) return;
    const currentIndex = history.findIndex(h => h.round === (selectedRound || metrics.round));
    if (currentIndex > 0) {
      setSelectedRound(history[currentIndex - 1].round);
    }
  };

  const handleNextRound = () => {
    if (history.length === 0) return;
    const currentIndex = history.findIndex(h => h.round === (selectedRound || metrics.round));
    if (currentIndex < history.length - 1) {
      setSelectedRound(history[currentIndex + 1].round);
    } else {
      setSelectedRound(null); // Go to live
    }
  };

  const handleLive = () => {
    setSelectedRound(null);
  };

  // Pie chart data for speaking status
  const pieData = [
    { name: 'Speaking', value: metrics.speakingCount, color: '#22c55e' },
    { name: 'Silent', value: metrics.totalAgents - metrics.speakingCount, color: '#e5e7eb' }
  ];

  return (
    <div className="space-y-4">
      {/* Connection Control */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {connected ? 'Connected to Simulation' : 'Disconnected'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={connected ? disconnect : connect}
                variant={connected ? "destructive" : "default"}
                size="sm"
              >
                {connected ? '⏹ Disconnect' : '▶ Connect'}
              </Button>
              
              <Button
                onClick={handleClearData}
                variant="outline"
                size="sm"
                disabled={history.length === 0 && !simulationData}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                🗑️ Clear Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Round Progress and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simulation Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Round {metrics.round}</span>
              <span className="text-muted-foreground">Max: {maxRound}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={handlePreviousRound}
              disabled={history.length === 0 || metrics.round === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant={selectedRound === null ? "default" : "outline"}
              onClick={handleLive}
              className="px-4"
            >
              {selectedRound === null ? (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                  LIVE
                </>
              ) : (
                'Go Live'
              )}
            </Button>
            
            <Button
              size="icon"
              variant="outline"
              onClick={handleNextRound}
              disabled={selectedRound === null || history.length === 0}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Round */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Round
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.round}</div>
            {selectedRound !== null && (
              <p className="text-xs text-muted-foreground mt-1">Viewing historical data</p>
            )}
          </CardContent>
        </Card>

        {/* Speaking Agents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agents Speaking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.speakingCount}/{metrics.totalAgents}
            </div>
            <div className="mt-2 h-20">
              {metrics.totalAgents > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={35}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Average Belief */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Belief
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageBelief.toFixed(4)}
            </div>
            <div className="mt-2 h-20">
              {historicalMetrics.length > 1 && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalMetrics}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#3b82f6" 
                      fill="url(#colorAvg)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Standard Deviation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Standard Deviation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.standardDeviation.toFixed(4)}
            </div>
            <div className="mt-2 h-20">
              {historicalMetrics.length > 1 && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalMetrics}>
                    <defs>
                      <linearGradient id="colorStd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="stdDev" 
                      stroke="#f59e0b" 
                      fill="url(#colorStd)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Trends */}
      {historicalMetrics.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historical Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalMetrics}>
                  <defs>
                    <linearGradient id="colorAvgFull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorStdFull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="round" 
                    label={{ value: 'Round', position: 'insideBottomRight', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
                    domain={[0, 1]}
                  />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#3b82f6" 
                    fill="url(#colorAvgFull)"
                    strokeWidth={2}
                    name="Average Belief"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="stdDev" 
                    stroke="#f59e0b" 
                    fill="url(#colorStdFull)"
                    strokeWidth={2}
                    name="Std Deviation"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};