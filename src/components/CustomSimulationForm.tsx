import { AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSimulationWebSocket } from "@/contexts/WebSocketContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useSimulationState } from "@/hooks/useSimulationState.tsx";
import { setChannelId } from "@/lib/channelStore.ts";
import { CustomAgent, Neighbor } from "@/lib/types";

const SAVE_MODES = {
  0: "Full",
  1: "Standard",
  2: "Standard Light",
  4: "Roundless",
  5: "Agentless Typed",
  7: "Agentless",
  8: "Performance",
  9: "Debug",
};
const SILENCE_STRATEGIES = {
  0: "DeGroot",
  1: "Majority",
  2: "Threshold",
  3: "Confidence",
};
const SILENCE_EFFECTS = { 0: "DeGroot", 1: "Memory", 2: "Memoryless" };
const BIASES = {
  0: "DeGroot",
  1: "Confirmation",
  2: "Backfire",
  3: "Authority",
  4: "Insular",
};

const AgentInput = ({
  label,
  value,
  onChange,
  type = "float",
  min = 0,
  max = 1,
  step = 0.01,
  placeholder,
}) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      placeholder={placeholder || (type === "float" ? "0.5" : "1")}
      onChange={(e) => {
        const val =
          type === "int"
            ? parseInt(e.target.value) || 0
            : parseFloat(e.target.value) || 0;
        onChange(val);
      }}
      className="mt-2"
    />
  </div>
);

export function CustomSimulationForm() {
  const { customForm, setCustomForm } = useSimulationState();
  const {
    stopThreshold,
    iterationLimit,
    saveMode,
    networkName,
    agents,
    neighbors,
  } = customForm;

  const { limits, loadingPermissions } = usePermissions();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { connect, clearData, disconnect, connected } =
    useSimulationWebSocket();

  const agentsLimitExceeded = agents.length > limits.maxAgents;
  const iterationsLimitExceeded = iterationLimit > limits.maxIterations;
  const maxAllowedNeighbors = isFinite(limits.maxAgents)
    ? Math.floor(agents.length * (agents.length - 1) * limits.densityFactor)
    : agents.length * (agents.length - 1);

  const stringToBytes = (str: string): Uint8Array =>
    new TextEncoder().encode(str);
  const writeFloat32 = (
    buffer: ArrayBuffer,
    offset: number,
    value: number,
  ): void => {
    new DataView(buffer).setFloat32(offset, value, true);
  };
  const writeUint32 = (
    buffer: ArrayBuffer,
    offset: number,
    value: number,
  ): void => {
    new DataView(buffer).setUint32(offset, value, true);
  };

  const calculateBufferSize = (): number => {
    let size = 9; // stopThreshold(4) + iterationLimit(4) + saveMode(1)
    const nameBytes = stringToBytes(networkName);
    size += 1 + nameBytes.length;
    size = Math.ceil(size / 4) * 4;

    size += 4; // numberOfAgents
    size += agents.length * 4 * 3; // initialBeliefs, toleranceRadii, toleranceOffset
    size += agents.length * 2; // silenceStrategies, silenceEffects
    agents.forEach((agent) => {
      size += 1 + stringToBytes(agent.name).length;
    });
    size = Math.ceil(size / 4) * 4;

    size += 4; // numberOfNeighbors
    size += neighbors.length * 4; // influences
    size += neighbors.length; // biases
    neighbors.forEach((neighbor) => {
      size +=
        2 +
        stringToBytes(neighbor.source).length +
        stringToBytes(neighbor.target).length;
    });

    agents.forEach((agent) => {
      if (agent.silenceStrategy === 2 || agent.silenceStrategy === 3) {
        size += 12;
      }
    });

    return size;
  };

  const buildBuffer = (): ArrayBuffer => {
    const buffer = new ArrayBuffer(calculateBufferSize());
    const uint8View = new Uint8Array(buffer);
    let offset = 0;

    // Headers
    writeFloat32(buffer, offset, stopThreshold);
    offset += 4;
    writeUint32(buffer, offset, iterationLimit);
    offset += 4;
    uint8View[offset] = saveMode;
    offset += 1;

    const networkNameBytes = stringToBytes(networkName);
    uint8View[offset] = networkNameBytes.length;
    offset += 1;
    uint8View.set(networkNameBytes, offset);
    offset += networkNameBytes.length;
    while (offset % 4 !== 0) offset++;

    // Agents data
    writeUint32(buffer, offset, agents.length);
    offset += 4;

    agents.forEach((agent, i) =>
      writeFloat32(buffer, offset + i * 4, agent.initialBelief),
    );
    offset += agents.length * 4;
    agents.forEach((agent, i) =>
      writeFloat32(buffer, offset + i * 4, agent.toleranceRadius),
    );
    offset += agents.length * 4;
    agents.forEach((agent, i) =>
      writeFloat32(buffer, offset + i * 4, agent.toleranceOffset),
    );
    offset += agents.length * 4;
    agents.forEach((agent, i) => {
      uint8View[offset + i] = agent.silenceStrategy;
    });
    offset += agents.length;
    agents.forEach((agent, i) => {
      uint8View[offset + i] = agent.silenceEffect;
    });
    offset += agents.length;

    agents.forEach((agent) => {
      const nameBytes = stringToBytes(agent.name);
      uint8View[offset] = nameBytes.length;
      offset += 1;
      uint8View.set(nameBytes, offset);
      offset += nameBytes.length;
    });
    while (offset % 4 !== 0) offset++;

    // Neighbors data
    writeUint32(buffer, offset, neighbors.length);
    offset += 4;

    neighbors.forEach((neighbor, i) =>
      writeFloat32(buffer, offset + i * 4, neighbor.influence),
    );
    offset += neighbors.length * 4;
    neighbors.forEach((neighbor, i) => {
      uint8View[offset + i] = neighbor.bias;
    });
    offset += neighbors.length;

    neighbors.forEach((neighbor) => {
      const sourceBytes = stringToBytes(neighbor.source);
      uint8View[offset] = sourceBytes.length;
      offset += 1;
      uint8View.set(sourceBytes, offset);
      offset += sourceBytes.length;
    });
    neighbors.forEach((neighbor) => {
      const targetBytes = stringToBytes(neighbor.target);
      uint8View[offset] = targetBytes.length;
      offset += 1;
      uint8View.set(targetBytes, offset);
      offset += targetBytes.length;
    });

    // Optional extra data
    const agentsWithOptionalData = agents
      .map((agent, index) => ({ ...agent, originalIndex: index }))
      .filter(
        (agent) => agent.silenceStrategy === 2 || agent.silenceStrategy === 3,
      );

    agentsWithOptionalData.forEach((agent) => {
      if (agent.silenceStrategy === 2) {
        // Threshold
        writeUint32(buffer, offset, agent.originalIndex);
        writeFloat32(buffer, offset + 4, agent.thresholdValue ?? 0);
        writeFloat32(buffer, offset + 8, 2.0); // Type indicator
        offset += 12;
      } else if (agent.silenceStrategy === 3) {
        // Confidence
        writeUint32(buffer, offset, agent.originalIndex);
        writeFloat32(buffer, offset + 4, agent.updateValue ?? 1);
        writeFloat32(buffer, offset + 8, agent.confidenceValue ?? 0);
        offset += 12;
      }
    });
    return buffer;
  };

  const handleAddAgent = useCallback(() => {
    const newAgent: CustomAgent = {
      id: crypto.randomUUID(),
      name: `Agent ${agents.length + 1}`,
      initialBelief: 0.5,
      toleranceRadius: 0.3,
      toleranceOffset: 0.1,
      silenceStrategy: 0,
      silenceEffect: 0,
      thresholdValue: 0.5,
      confidenceValue: 0.5,
      updateValue: 1,
    };
    setCustomForm((prev) => ({ ...prev, agents: [...prev.agents, newAgent] }));
  }, [agents.length, setCustomForm]);

  const handleRemoveAgent = useCallback(
    (agentId: string) => {
      const agentToRemove = agents.find((a) => a.id === agentId);
      if (!agentToRemove) return;
      setCustomForm((prev) => ({
        ...prev,
        agents: prev.agents.filter((a) => a.id !== agentId),
        neighbors: prev.neighbors.filter(
          (n) =>
            n.source !== agentToRemove.name && n.target !== agentToRemove.name,
        ),
      }));
    },
    [agents, setCustomForm],
  );

  const handleUpdateAgent = useCallback(
    (agentId: string, updates: Partial<CustomAgent>) => {
      setCustomForm((prev) => {
        const oldAgent = prev.agents.find((a) => a.id === agentId);
        const newAgents = prev.agents.map((agent) =>
          agent.id === agentId ? { ...agent, ...updates } : agent,
        );
        let newNeighbors = prev.neighbors;
        if (updates.name && oldAgent && updates.name !== oldAgent.name) {
          newNeighbors = prev.neighbors.map((n) => ({
            ...n,
            source: n.source === oldAgent.name ? updates.name! : n.source,
            target: n.target === oldAgent.name ? updates.name! : n.target,
          }));
        }
        return { ...prev, agents: newAgents, neighbors: newNeighbors };
      });
    },
    [setCustomForm],
  );

  const handleAddNeighbor = useCallback(() => {
    if (agents.length < 2) return;
    const sourceCounts: Record<string, number> = {};
    neighbors.forEach((n) => {
      sourceCounts[n.source] = (sourceCounts[n.source] || 0) + 1;
    });
    const maxSourceCount = agents.length - 1;
    const usedPairs = new Set(neighbors.map((n) => `${n.source}-${n.target}`));
    let source = "",
      target = "";
    for (const sourceAgent of agents) {
      if ((sourceCounts[sourceAgent.name] || 0) >= maxSourceCount) continue;
      for (const targetAgent of agents) {
        if (sourceAgent.id !== targetAgent.id) {
          if (!usedPairs.has(`${sourceAgent.name}-${targetAgent.name}`)) {
            source = sourceAgent.name;
            target = targetAgent.name;
            break;
          }
        }
      }
      if (source) break;
    }
    if (!source || !target) return;
    const newNeighbor: Neighbor = {
      id: crypto.randomUUID(),
      source,
      target,
      influence: 0.5,
      bias: 0,
    };
    setCustomForm((prev) => ({
      ...prev,
      neighbors: [...prev.neighbors, newNeighbor],
    }));
  }, [agents, neighbors, setCustomForm]);

  const handleRemoveNeighbor = useCallback(
    (neighborId: string) => {
      setCustomForm((prev) => ({
        ...prev,
        neighbors: prev.neighbors.filter((n) => n.id !== neighborId),
      }));
    },
    [setCustomForm],
  );

  const handleUpdateNeighbor = useCallback(
    (neighborId: string, updates: Partial<Neighbor>) => {
      setCustomForm((prev) => ({
        ...prev,
        neighbors: prev.neighbors.map((n) =>
          n.id === neighborId ? { ...n, ...updates } : n,
        ),
      }));
    },
    [setCustomForm],
  );

  const getAvailableSources = useCallback(
    (currentNeighborId: string) => {
      const currentNeighbor = neighbors.find((n) => n.id === currentNeighborId);
      const sourceCounts: Record<string, number> = {};
      neighbors.forEach((n) => {
        if (n.id !== currentNeighborId) {
          sourceCounts[n.source] = (sourceCounts[n.source] || 0) + 1;
        }
      });
      const maxSourceCount = agents.length - 1;
      return agents
        .map((a) => a.name)
        .filter((name) => {
          if (currentNeighbor && name === currentNeighbor.source) return true;
          return (sourceCounts[name] || 0) < maxSourceCount;
        });
    },
    [agents, neighbors],
  );

  const getAvailableTargets = useCallback(
    (source: string, currentNeighborId: string) => {
      const usedPairs = neighbors
        .filter((n) => n.id !== currentNeighborId)
        .map((n) => `${n.source}-${n.target}`);
      return agents
        .map((a) => a.name)
        .filter((name) => {
          if (name === source) return false;
          return !usedPairs.includes(`${source}-${name}`);
        });
    },
    [agents, neighbors],
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Clear any existing data before starting new simulation
    if (connected) {
      disconnect();
    }
    clearData(); // Add this line to clear previous data

    try {
      const buffer = buildBuffer();

      const response = await fetch("http://localhost:9000/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      });

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`,
        );
      }

      const channelId = await response.text();
      console.log("Custom simulation channel ID:", channelId);
      setChannelId(channelId);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);

      // Add a small delay before connecting to ensure channel is ready
      setTimeout(() => {
        connect();
      }, 1000);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxNeighbors = agents.length * (agents.length - 1);
  // const isValid = agents.length > 0 && agents.every(a => a.name.trim().length > 0) && neighbors.every(n => n.source && n.target && n.source !== n.target) && networkName.trim().length > 0 && stringToBytes(networkName).length <= 255;
  const isValid =
    agents.length > 0 &&
    agents.every((a) => a.name.trim().length > 0) &&
    neighbors.every((n) => n.source && n.target && n.source !== n.target) &&
    networkName.trim().length > 0 &&
    stringToBytes(networkName).length <= 255 &&
    !agentsLimitExceeded &&
    !iterationsLimitExceeded;

  return (
    <TooltipProvider>
      <Card className="w-full max-w-4xl mx-auto border-none shadow-none">
        <CardHeader>
          <CardTitle>Custom Simulation Run</CardTitle>
          <CardDescription>
            Configure and run a custom simulation with specific agents and
            network topology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stopThreshold" className="text-sm font-medium">
                  Stop Threshold
                </Label>
                <Input
                  id="stopThreshold"
                  type="number"
                  min={0}
                  step={0.0001}
                  value={stopThreshold}
                  onChange={(e) =>
                    setCustomForm((p) => ({
                      ...p,
                      stopThreshold: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iterationLimit" className="text-sm font-medium">
                  Iteration Limit
                </Label>
                <Input
                  id="iterationLimit"
                  type="number"
                  min={1}
                  value={iterationLimit}
                  onChange={(e) =>
                    setCustomForm((p) => ({
                      ...p,
                      iterationLimit: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="h-9"
                />
                {iterationsLimitExceeded && (
                  <p className="text-destructive text-sm mt-1">
                    You have exceeded your iteration limit of{" "}
                    {limits.maxIterations}.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="saveMode" className="text-sm font-medium">
                  Save Mode
                </Label>
                <Select
                  value={saveMode.toString()}
                  onValueChange={(v) =>
                    setCustomForm((p) => ({ ...p, saveMode: parseInt(v) }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SAVE_MODES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="networkName" className="text-sm font-medium">
                  Network Name
                </Label>
                <Input
                  id="networkName"
                  value={networkName}
                  onChange={(e) =>
                    setCustomForm((p) => ({
                      ...p,
                      networkName: e.target.value,
                    }))
                  }
                  maxLength={255}
                  className="h-9"
                />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Agents{" "}
                <span className="text-muted-foreground font-normal">
                  ({agents.length})
                </span>
              </h3>
              <Button
                onClick={handleAddAgent}
                size="sm"
                variant="outline"
                disabled={agents.length >= limits.maxAgents}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Agent
              </Button>
            </div>
            {agentsLimitExceeded && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have exceeded your role's limit of {limits.maxAgents}{" "}
                  agents.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className="relative overflow-hidden p-4 pr-14"
                >
                  {agents.length > 1 && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveAgent(agent.id)}
                      className="absolute top-3 right-3 h-8 w-8 z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Agent Name
                      </Label>
                      <Input
                        value={agent.name}
                        onChange={(e) =>
                          handleUpdateAgent(agent.id, { name: e.target.value })
                        }
                        placeholder="Agent name"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Silence Strategy
                      </Label>
                      <Select
                        value={agent.silenceStrategy.toString()}
                        onValueChange={(v) =>
                          handleUpdateAgent(agent.id, {
                            silenceStrategy: parseInt(v),
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SILENCE_STRATEGIES).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Silence Effect
                      </Label>
                      <Select
                        value={agent.silenceEffect.toString()}
                        onValueChange={(v) =>
                          handleUpdateAgent(agent.id, {
                            silenceEffect: parseInt(v),
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SILENCE_EFFECTS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  {(() => {
                    const needsThreshold = agent.silenceStrategy === 2;
                    const needsConfidence = agent.silenceStrategy === 3;
                    const gridClass = needsConfidence
                      ? "grid gap-4 grid-cols-5"
                      : needsThreshold
                        ? "grid gap-4 grid-cols-4"
                        : "grid gap-4 grid-cols-3";
                    return (
                      <div className={gridClass}>
                        <AgentInput
                          label="Belief"
                          value={agent.initialBelief}
                          onChange={(val) =>
                            handleUpdateAgent(agent.id, { initialBelief: val })
                          }
                          placeholder={0.5}
                        />
                        <AgentInput
                          label="Radius"
                          value={agent.toleranceRadius}
                          onChange={(val) =>
                            handleUpdateAgent(agent.id, {
                              toleranceRadius: val,
                            })
                          }
                          placeholder={0.3}
                        />
                        <AgentInput
                          label="Offset"
                          value={agent.toleranceOffset}
                          onChange={(val) =>
                            handleUpdateAgent(agent.id, {
                              toleranceOffset: val,
                            })
                          }
                          placeholder={0.1}
                        />
                        {needsThreshold && (
                          <AgentInput
                            label="Threshold Value"
                            value={agent.thresholdValue}
                            onChange={(val) =>
                              handleUpdateAgent(agent.id, {
                                thresholdValue: val,
                              })
                            }
                            placeholder={0.5}
                          />
                        )}
                        {needsConfidence && (
                          <>
                            <AgentInput
                              label="Confidence Value"
                              value={agent.confidenceValue}
                              onChange={(val) =>
                                handleUpdateAgent(agent.id, {
                                  confidenceValue: val,
                                })
                              }
                              placeholder={0.5}
                            />
                            <AgentInput
                              label="Update Value"
                              type="int"
                              min={0}
                              step={1}
                              value={agent.updateValue}
                              placeholder={1}
                              onChange={(val) =>
                                handleUpdateAgent(agent.id, {
                                  updateValue: val,
                                })
                              }
                            />
                          </>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              ))}
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Neighbors{" "}
                <span className="text-muted-foreground font-normal">
                  ({neighbors.length}/{maxNeighbors})
                </span>
              </h3>
              <Button
                onClick={handleAddNeighbor}
                size="sm"
                variant="outline"
                disabled={
                  agents.length < 2 || neighbors.length >= maxAllowedNeighbors
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Neighbor
              </Button>
            </div>
            {agents.length < 2 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need at least 2 agents to create neighbor relationships.
                </AlertDescription>
              </Alert>
            )}
            {neighbors.length >= maxNeighbors && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Maximum number of neighbors reached.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              {neighbors.map((neighbor) => (
                <Card key={neighbor.id} className="overflow-hidden p-3">
                  <div className="flex justify-between items-center gap-3 mb-3">
                    <div className="flex gap-2 items-center flex-1">
                      <Select
                        value={neighbor.source}
                        onValueChange={(v) =>
                          handleUpdateNeighbor(neighbor.id, { source: v })
                        }
                      >
                        <SelectTrigger className="h-9 w-[130px]">
                          <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableSources(neighbor.id).map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">→</span>
                      <Select
                        value={neighbor.target}
                        onValueChange={(v) =>
                          handleUpdateNeighbor(neighbor.id, { target: v })
                        }
                      >
                        <SelectTrigger className="h-9 w-[130px]">
                          <SelectValue placeholder="Target" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableTargets(
                            neighbor.source,
                            neighbor.id,
                          ).map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveNeighbor(neighbor.id)}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Separator className="mb-3" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                          Influence
                        </Label>
                        <span className="text-xs font-medium">
                          {neighbor.influence.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[neighbor.influence]}
                        onValueChange={(v) =>
                          handleUpdateNeighbor(neighbor.id, { influence: v[0] })
                        }
                        className="mt-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Bias Type
                      </Label>
                      <Select
                        value={neighbor.bias.toString()}
                        onValueChange={(v) =>
                          handleUpdateNeighbor(neighbor.id, {
                            bias: parseInt(v),
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BIASES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          {submitSuccess && (
            <Alert className="border-green-500">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Simulation started successfully!
              </AlertDescription>
            </Alert>
          )}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end items-center gap-4 pt-6 border-t">
            {!isValid && (
              <p className="text-sm text-muted-foreground">
                Please ensure all fields are valid
              </p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              size="lg"
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Submitting...
                </>
              ) : (
                "Run Simulation"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
