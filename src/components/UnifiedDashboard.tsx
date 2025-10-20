import { SkipBack, SkipForward } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSimulationWebSocket } from "@/contexts/WebSocketContext";
import { useSimulationHistory } from "@/hooks/useSimulationHistory";

export const UnifiedDashboard: React.FC = () => {
  const { connected, latestSimulationData, messageCount } =
    useSimulationWebSocket();
  const { history, getLatestRound, getAgentKeys, totalRounds } =
    useSimulationHistory();
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const currentDataPoint = useMemo(() => {
    if (selectedRound !== null) {
      return history.find((h) => h.round === selectedRound);
    }
    return history.length > 0 ? history[history.length - 1] : undefined;
  }, [selectedRound, history]);

  const metrics = useMemo(() => {
    const roundNumber = currentDataPoint?.round ?? getLatestRound();
    if (!currentDataPoint) {
      return {
        round: roundNumber,
        speakingCount: 0,
        averageBelief: 0,
        standardDeviation: 0,
        totalAgents: 0,
      };
    }

    const beliefs: number[] = [];
    let speakingCount = 0;

    Object.keys(currentDataPoint).forEach((key) => {
      if (key.startsWith("agent")) {
        const value = currentDataPoint[key];
        if (typeof value === "number") beliefs.push(value);
      }
      if (key.startsWith("speaking") && currentDataPoint[key] === true) {
        speakingCount++;
      }
    });

    const totalAgents =
      beliefs.length || latestSimulationData?.numberOfAgents || 0;
    const averageBelief =
      beliefs.reduce((sum, b) => sum + b, 0) / beliefs.length || 0;
    const variance =
      beliefs.reduce((sum, b) => sum + Math.pow(b - averageBelief, 2), 0) /
        beliefs.length || 0;
    const standardDeviation = Math.sqrt(variance);

    return {
      round: roundNumber,
      speakingCount,
      averageBelief,
      standardDeviation,
      totalAgents,
    };
  }, [currentDataPoint, getLatestRound, latestSimulationData]);

  const pieData = [
    { name: "Speaking", value: metrics.speakingCount, color: "#22c55e" },
    {
      name: "Silent",
      value: metrics.totalAgents - metrics.speakingCount,
      color: "#e5e7eb",
    },
  ];

  const handlePreviousRound = () => {
    if (history.length === 0) return;
    const currentRound = selectedRound ?? getLatestRound();
    const currentIndex = history.findIndex((h) => h.round === currentRound);
    if (currentIndex > 0) {
      setSelectedRound(history[currentIndex - 1].round);
    }
  };

  const handleNextRound = () => {
    if (history.length === 0 || selectedRound === null) return;
    const currentIndex = history.findIndex((h) => h.round === selectedRound);
    if (currentIndex < history.length - 1) {
      setSelectedRound(history[currentIndex + 1].round);
    }
  };

  const handleLive = () => {
    setSelectedRound(null);
  };

  const progressPercentage = (metrics.round / (getLatestRound() || 1)) * 100;

  const generateLines = () => {
    const colors = [
      "#3498db",
      "#2ecc71",
      "#9b59b6",
      "#f1c40f",
      "#e74c3c",
      "#1abc9c",
    ];
    const agentKeys = getAgentKeys();
    if (agentKeys.length === 0) return null;

    return agentKeys.map((key, index) => {
      const agentIndex = key.replace("agent", "");
      const speakingKey = `speaking${agentIndex}`;
      const renderDot = (props: any) => {
        const { cx, cy, payload, index: dotIndex } = props;
        if (payload[speakingKey] === true) {
          return (
            <circle
              key={`dot-${key}-${dotIndex}`}
              cx={cx}
              cy={cy}
              r={4}
              fill={colors[index % colors.length]}
            />
          );
        }
        // Return an invisible circle instead of null
        return (
          <circle
            key={`dot-${key}-${dotIndex}`}
            cx={cx}
            cy={cy}
            r={0}
            fill="transparent"
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
          activeDot={{ r: 6 }}
          isAnimationActive={false}
        />
      );
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simulation Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Round {metrics.round}</span>
              <span className="text-muted-foreground">
                Latest: {getLatestRound()}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={handlePreviousRound}
              disabled={history.length < 2}
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
                "Go Live"
              )}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleNextRound}
              disabled={
                selectedRound === null ||
                history.findIndex((h) => h.round === selectedRound) ===
                  history.length - 1
              }
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            />
            <div>
              <p className="font-bold">
                {connected ? "Connected" : "Disconnected"}
              </p>
              <p className="text-xs text-muted-foreground">
                {messageCount} messages received
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Round</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.round}</div>
            {/* --- NEW: Indicator for historical view --- */}
            {selectedRound !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Viewing historical data
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Agents Speaking
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {metrics.speakingCount}/{metrics.totalAgents}
            </div>
            <div className="w-20 h-20">
              {metrics.totalAgents > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={35}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Belief
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageBelief.toFixed(4)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Belief Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Belief Evolution Over Time</CardTitle>
          <CardDescription>
            Tracking {getAgentKeys().length} agents over {totalRounds} rounds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart
                data={history}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="round"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                />
                <YAxis domain={[0, 1]} />
                <Tooltip
                  formatter={(value: any) =>
                    typeof value === "number" ? value.toFixed(4) : value
                  }
                  labelFormatter={(label) => `Round ${label}`}
                />
                {generateLines()}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-center">
              <p className="text-muted-foreground">
                {connected
                  ? "Connection established. Waiting for first data packet..."
                  : "Simulation not running or not connected."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
