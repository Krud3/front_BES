// src/components/SimulationChart.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSimulationWebSocket } from '@/contexts/WebSocketContext';
import { useSimulationHistory } from '@/hooks/useSimulationHistory';

export const SimulationChart: React.FC = () => {
  const { connected, connect, disconnect, simulationData, messageCount, clearData } = useSimulationWebSocket();
  const { history, clearHistory } = useSimulationHistory();
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  // Update debug info when new data arrives
  useEffect(() => {
    if (!simulationData) return;

    const validBeliefs = simulationData.beliefs.filter(b => b !== null);
    
    setDebugInfo(prev => {
      const newInfo = [...prev];
      if (newInfo.length > 5) newInfo.shift();

      newInfo.push({
        timestamp: new Date().toLocaleTimeString(),
        round: simulationData.round,
        totalAgents: simulationData.numberOfAgents,
        validBeliefs: validBeliefs.length,
        sampleBeliefs: validBeliefs.slice(0, 5),
        speaking: simulationData.speakingStatuses.slice(0, 5)
      });

      return newInfo;
    });
  }, [simulationData]);

  // Clear all data
  const handleClearData = () => {
    clearData();
    clearHistory();
    setDebugInfo([]);
  };

  // Generate lines for the chart
  const generateLines = () => {
    const colors = ['#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#e74c3c', '#1abc9c', '#34495e', '#e67e22'];

    if (history.length === 0) return null;

    const lastDataPoint = history[history.length - 1];
    const agentKeys = Object.keys(lastDataPoint)
      .filter(key => key.startsWith('agent'))
      .sort((a, b) => {
        const numA = parseInt(a.replace('agent', ''));
        const numB = parseInt(b.replace('agent', ''));
        return numA - numB;
      });

    return agentKeys.map((key, index) => {
      const agentIndex = key.replace('agent', '');
      const speakingKey = `speaking${agentIndex}`;

      const renderDot = (props: any) => {
        const { cx, cy, payload } = props;
        if (payload[speakingKey] === true) {
          return (
            <circle
              cx={cx}
              cy={cy}
              r={5}
              fill={colors[index % colors.length]}
              stroke="white"
              strokeWidth={2}
            />
          );
        }
        // Return a hidden SVG element instead of null to satisfy type requirements
        return (
          <circle
            cx={cx}
            cy={cy}
            r={0}
            fill="none"
            stroke="none"
            style={{ display: 'none' }}
          />
        );
      };

      return (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={colors[index % colors.length]}
          strokeWidth={2}
          dot={renderDot}
          activeDot={{ r: 6, fill: colors[index % colors.length] }}
          isAnimationActive={false}
        />
      );
    });
  };

  // Custom x-axis ticks
  const getCustomXAxisTicks = () => {
    if (history.length <= 1) return [];

    const firstRound = history[0].round;
    const lastRound = history[history.length - 1].round;
    const roundSpan = lastRound - firstRound;

    let interval = 1;
    if (roundSpan > 500) interval = 50;
    else if (roundSpan > 200) interval = 20;
    else if (roundSpan > 100) interval = 10;
    else if (roundSpan > 50) interval = 5;
    else if (roundSpan > 20) interval = 2;

    const ticks = [];
    for (let i = firstRound; i <= lastRound; i += interval) {
      ticks.push(i);
    }

    if (ticks[ticks.length - 1] !== lastRound) {
      ticks.push(lastRound);
    }

    return ticks;
  };

  const currentRound = simulationData?.round || 0;

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {connected ? 'Connected to WebSocket Server' : 'Disconnected from WebSocket Server'}
                {connected && <span className="text-muted-foreground"> • {messageCount} messages received</span>}
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
              >
                🗑️ Clear Data
              </Button>

              <Button
                onClick={() => setShowDebug(!showDebug)}
                variant="ghost"
                size="sm"
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel */}
      {showDebug && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Messages received: {messageCount}</p>
            <p className="text-sm">Current round: {currentRound}</p>

            {debugInfo.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold">Recent Messages:</h4>
                {debugInfo.map((info, idx) => (
                  <div key={idx} className="p-2 bg-muted rounded text-xs">
                    <p><strong>{info.timestamp}</strong> - Round {info.round}</p>
                    <p>Agents: {info.totalAgents}, Valid beliefs: {info.validBeliefs}</p>
                    {info.sampleBeliefs.length > 0 && (
                      <div>
                        <strong>Sample beliefs:</strong>{' '}
                        {info.sampleBeliefs.map((b: number, i: number) =>
                          <span key={i} className={info.speaking && info.speaking[i] ? 'text-green-600' : ''}>
                            {b?.toFixed(4) || 'N/A'}{i < info.sampleBeliefs.length - 1 ? ', ' : ''}
                          </span>
                        )}
                      </div>
                    )}
                    {info.speaking && info.speaking.length > 0 && (
                      <div>
                        <strong>Speaking status:</strong>{' '}
                        {info.speaking.map((s: boolean, i: number) =>
                          <span key={i} className={s ? 'text-green-600' : 'text-gray-500'}>
                            Agent {i}: {s ? 'Speaking' : 'Silent'}{i < info.speaking.length - 1 ? ', ' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Belief Evolution Over Time</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current Round: {currentRound}
          </p>
          <p className="text-xs text-muted-foreground">
            Displaying data for {history.length} rounds
            {history.length > 0 && ` (${history[0].round} to ${history[history.length - 1].round})`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span>Belief Value</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
              <span>Agent Speaking</span>
            </div>
          </div>

          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={history} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="round"
                  label={{ value: 'Round', position: 'insideBottomRight', offset: -5 }}
                  ticks={getCustomXAxisTicks()}
                  tickMargin={10}
                />
                <YAxis
                  domain={[0, 1]}
                  label={{ value: 'Belief Value', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name.startsWith('agent')) {
                      return value.toFixed(4);
                    }
                    return null;
                  }}
                  labelFormatter={(label) => `Round ${label}`}
                />
                {generateLines()}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Waiting for data... ({messageCount} messages received)</p>
                {messageCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Messages are being received but no valid belief data has been extracted yet.
                    Check the console for detailed debug information.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};