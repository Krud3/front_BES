import React, { useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSimulationWebSocket } from '@/contexts/WebSocketContext';
import { useSimulationHistory } from '@/hooks/useSimulationHistory';
import { Trash2 } from 'lucide-react';
import Plotly from 'plotly.js-dist-min';

export const SimulationHeatmap: React.FC = () => {
  const { connected, connect, disconnect, simulationData, clearData } = useSimulationWebSocket();
  const { history, clearHistory } = useSimulationHistory();
  const plotRef = useRef<HTMLDivElement>(null);

  // Process data for heatmap
  const { heatmapData, agentIds, rounds } = useMemo(() => {
    if (history.length === 0) return { heatmapData: [], agentIds: [], rounds: [] };

    // Get all unique agents and rounds
    const agentSet = new Set<number>();
    const roundSet = new Set<number>();
    
    history.forEach(point => {
      roundSet.add(point.round);
      Object.keys(point).forEach(key => {
        if (key.startsWith('agent')) {
          const agentId = parseInt(key.replace('agent', ''));
          agentSet.add(agentId);
        }
      });
    });

    const agentIds = Array.from(agentSet).sort((a, b) => a - b);
    const rounds = Array.from(roundSet).sort((a, b) => a - b);

    // Create 2D array for heatmap
    const heatmapData: number[][] = agentIds.map(() => new Array(rounds.length).fill(null));
    const speakingData: boolean[][] = agentIds.map(() => new Array(rounds.length).fill(false));

    // Fill the data
    history.forEach((point, roundIndex) => {
      const roundIdx = rounds.indexOf(point.round);
      
      agentIds.forEach((agentId, agentIndex) => {
        const belief = point[`agent${agentId}`];
        const speaking = point[`speaking${agentId}`];
        
        if (typeof belief === 'number') {
          heatmapData[agentIndex][roundIdx] = belief;
          speakingData[agentIndex][roundIdx] = speaking === true;
        }
      });
    });

    return { heatmapData, agentIds, rounds, speakingData };
  }, [history]);

  // Create/Update Plotly heatmap
  useEffect(() => {
    if (!plotRef.current || heatmapData.length === 0) return;

    // Create custom hover text including speaking status
    const hoverText = heatmapData.map((row, agentIdx) => 
      row.map((value, roundIdx) => {
        const speaking = history[roundIdx]?.[`speaking${agentIds[agentIdx]}`] ? ' (Speaking)' : '';
        return value !== null 
          ? `Agent ${agentIds[agentIdx]}<br>Round ${rounds[roundIdx]}<br>Belief: ${value.toFixed(4)}${speaking}`
          : 'No data';
      })
    );

    // Create annotations for speaking indicators
    const annotations: any[] = [];
    history.forEach((point, roundIdx) => {
      agentIds.forEach((agentId, agentIdx) => {
        if (point[`speaking${agentId}`] === true) {
          annotations.push({
            x: rounds[roundIdx],
            y: agentIds[agentIdx],
            text: '🔊',
            showarrow: false,
            font: {
              size: 12,
              color: 'white'
            }
          });
        }
      });
    });

    const data = [{
      z: heatmapData,
      x: rounds.map(r => `Round ${r}`),
      y: agentIds.map(a => `Agent ${a}`),
      type: 'heatmap' as const,
      colorscale: [
        [0, '#ff0000'],      // Red
        [0.5, '#ffff00'],    // Yellow
        [1, '#00ff00']       // Green
      ],
      colorbar: {
        title: 'Belief Value',
        titleside: 'right',
        tickmode: 'linear',
        tick0: 0,
        dtick: 0.2
      },
      hoverongaps: false,
      hovertemplate: '%{hovertext}<extra></extra>',
      hovertext: hoverText
    }];

    const layout = {
      title: '',
      xaxis: {
        title: 'Simulation Rounds',
        tickangle: -45,
        automargin: true,
        tickmode: rounds.length > 50 ? 'linear' : 'array',
        tickvals: rounds.length > 50 ? undefined : rounds.map(r => `Round ${r}`),
        dtick: rounds.length > 50 ? Math.ceil(rounds.length / 20) : undefined
      },
      yaxis: {
        title: 'Agents',
        automargin: true
      },
      annotations: annotations,
      height: 600,
      margin: {
        l: 80,
        r: 80,
        t: 40,
        b: 80
      },
      plot_bgcolor: '#f3f4f6',
      paper_bgcolor: 'white'
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'simulation_heatmap',
        height: 1200,
        width: 1600,
        scale: 2
      }
    };

    Plotly.newPlot(plotRef.current, data, layout, config);

    // Cleanup
    return () => {
      if (plotRef.current) {
        Plotly.purge(plotRef.current);
      }
    };
  }, [heatmapData, agentIds, rounds, history]);

  // Handle clear data
  const handleClearData = () => {
    clearData();
    clearHistory();
  };

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
                {connected ? 'Disconnect' : 'Connect'}
              </Button>
              
              <Button
                onClick={handleClearData}
                variant="outline"
                size="sm"
                disabled={history.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Belief Evolution Heatmap</CardTitle>
          <p className="text-sm text-muted-foreground">
            {agentIds.length} agents × {rounds.length} rounds
            {rounds.length > 0 && ` (Round ${rounds[0]} to ${rounds[rounds.length - 1]})`}
          </p>
          <p className="text-xs text-muted-foreground">
            🔊 = Agent speaking | Hover for details | Use toolbar to zoom, pan, and export
          </p>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Waiting for simulation data...
              </p>
            </div>
          ) : (
            <div ref={plotRef} className="w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};