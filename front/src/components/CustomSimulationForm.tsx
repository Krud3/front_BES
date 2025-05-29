import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, AlertCircle, Check } from "lucide-react";

// Agent type with all properties
interface Agent {
  id: string;
  name: string;
  initialBelief: number;
  toleranceRadius: number;
  toleranceOffset: number;
  silenceStrategy: number;
  thresholdValue?: number; // For Threshold strategy
  confidenceValue?: number; // For Confidence strategy
  updateValue?: number; // For Confidence strategy (u32 integer)
  silenceEffect: number;
}

// Neighbor type
interface Neighbor {
  id: string;
  source: string;
  target: string;
  influence: number;
  bias: number; // 0-4 for the five bias types
}

// Save modes mapping
const SAVE_MODES = {
  0: "Full",
  1: "Standard",
  2: "Standard Light",
  3: "Standard Light",
  4: "Roundless",
  5: "Agentless Typed",
  6: "Agentless Typed",
  7: "Agentless",
  8: "Performance",
  9: "Debug"
};

const SILENCE_STRATEGIES = {
  0: "DeGroot",
  1: "Majority",
  2: "Threshold",
  3: "Confidence"
};

const SILENCE_EFFECTS = {
  0: "DeGroot",
  1: "Memory",
  2: "Memoryless"
};

const BIASES = {
  0: "DeGroot",
  1: "Confirmation",
  2: "Backfire",
  3: "Authority",
  4: "Insular"
};

// Reusable component for agent float inputs (0-1 range)
const AgentInput = ({ label, value, onChange, type = "float", min = 0, max = 1, step = 0.01, placeholder }) => (
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
        const inputVal = e.target.value;
        if (inputVal === "") {
          // Don't call onChange when empty, let it stay empty
          return;
        }
        const val = type === "int" ? parseInt(inputVal) || 0 : parseFloat(inputVal) || 0;
        onChange(val);
      }}
      onBlur={(e) => {
        // Only set default if field is actually empty when user leaves
        if (e.target.value === "") {
          onChange(type === "float" ? 0.5 : 1);
        }
      }}
      className="mt-2"
    />
  </div>
);

export function CustomSimulationForm() {
  const [stopThreshold, setStopThreshold] = useState(0.0001);
  const [iterationLimit, setIterationLimit] = useState(100);
  const [saveMode, setSaveMode] = useState(1);
  const [networkName, setNetworkName] = useState("Custom Network");
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: crypto.randomUUID(),
      name: "Agent 1",
      initialBelief: 0.5,
      toleranceRadius: 0.3,
      toleranceOffset: 0.1,
      silenceStrategy: 0,
      silenceEffect: 0,
      thresholdValue: 0.5,
      confidenceValue: 0.5,
      updateValue: 1
    }
  ]);
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Helper function to convert string to UTF-8 bytes
  const stringToBytes = (str: string): Uint8Array => {
    return new TextEncoder().encode(str);
  };

  // Helper function to write float32 to buffer
  const writeFloat32 = (buffer: ArrayBuffer, offset: number, value: number): void => {
    new DataView(buffer).setFloat32(offset, value, true); // Little endian
  };

  // Helper function to write uint32 to buffer
  const writeUint32 = (buffer: ArrayBuffer, offset: number, value: number): void => {
    new DataView(buffer).setUint32(offset, value, true); // Little endian
  };

  // Calculate total buffer size needed
  const calculateBufferSize = (): number => {
    let size = 9; // stopThreshold(4) + saveMode(1)
    const networkNameBytes = stringToBytes(networkName);
    size += 1 + networkNameBytes.length; // length byte + name

    // Align to 4 bytes
    size = Math.ceil(size / 4) * 4;

    size += 4; // numberOfAgents
    size += agents.length * 4 * 3; // initialBeliefs, toleranceRadii, toleranceOffset
    size += agents.length * 2; // silenceStrategies, silenceEffects

    // Agent names
    agents.forEach(agent => {
      const nameBytes = stringToBytes(agent.name);
      size += 1 + nameBytes.length;
    });

    // Align to 4 bytes
    size = Math.ceil(size / 4) * 4;

    size += 4; // numberOfNeighbors
    size += neighbors.length * 4; // influences
    size += neighbors.length; // biases

    // Source and target names
    neighbors.forEach(neighbor => {
      const sourceBytes = stringToBytes(neighbor.source);
      const targetBytes = stringToBytes(neighbor.target);
      size += 2 + sourceBytes.length + targetBytes.length;
    });

    return size;
  };

  // Build the binary buffer
  const buildBuffer = (): ArrayBuffer => {
    const bufferSize = calculateBufferSize();
    const buffer = new ArrayBuffer(bufferSize);
    //const view = new DataView(buffer);
    const uint8View = new Uint8Array(buffer);

    let offset = 0;

    // Header
    writeFloat32(buffer, offset, stopThreshold);
    offset += 4;

    writeUint32(buffer, offset, iterationLimit);
    offset += 4;

    uint8View[offset] = saveMode;
    offset += 1;

    // Network name
    const networkNameBytes = stringToBytes(networkName);
    uint8View[offset] = networkNameBytes.length;
    offset += 1;
    uint8View.set(networkNameBytes, offset);
    offset += networkNameBytes.length;

    // Align to 4 bytes
    while (offset % 4 !== 0) offset++;

    // Number of agents
    writeUint32(buffer, offset, agents.length);
    offset += 4;

    // Agent data arrays
    agents.forEach((agent, i) => {
      writeFloat32(buffer, offset + i * 4, agent.initialBelief);
    });
    offset += agents.length * 4;

    agents.forEach((agent, i) => {
      writeFloat32(buffer, offset + i * 4, agent.toleranceRadius);
    });
    offset += agents.length * 4;

    agents.forEach((agent, i) => {
      writeFloat32(buffer, offset + i * 4, agent.toleranceOffset);
    });
    offset += agents.length * 4;

    agents.forEach((agent, i) => {
      uint8View[offset + i] = agent.silenceStrategy;
    });
    offset += agents.length;

    agents.forEach((agent, i) => {
      uint8View[offset + i] = agent.silenceEffect;
    });
    offset += agents.length;

    // Agent names
    agents.forEach(agent => {
      const nameBytes = stringToBytes(agent.name);
      uint8View[offset] = nameBytes.length;
      offset += 1;
      uint8View.set(nameBytes, offset);
      offset += nameBytes.length;
    });

    // Align to 4 bytes
    while (offset % 4 !== 0) offset++;

    // Number of neighbors
    writeUint32(buffer, offset, neighbors.length);
    offset += 4;

    // Neighbor data
    neighbors.forEach((neighbor, i) => {
      writeFloat32(buffer, offset + i * 4, neighbor.influence);
    });
    offset += neighbors.length * 4;

    neighbors.forEach((neighbor, i) => {
      uint8View[offset + i] = neighbor.bias;
    });
    offset += neighbors.length;

    // Source names
    neighbors.forEach(neighbor => {
      const sourceBytes = stringToBytes(neighbor.source);
      uint8View[offset] = sourceBytes.length;
      offset += 1;
      uint8View.set(sourceBytes, offset);
      offset += sourceBytes.length;
    });

    // Target names
    neighbors.forEach(neighbor => {
      const targetBytes = stringToBytes(neighbor.target);
      uint8View[offset] = targetBytes.length;
      offset += 1;
      uint8View.set(targetBytes, offset);
      offset += targetBytes.length;
    });
    console.log(buffer)
    return buffer;
  };

  // Add agent handler
  const handleAddAgent = useCallback(() => {
    const newAgent: Agent = {
      id: crypto.randomUUID(),
      name: `Agent ${agents.length + 1}`,
      initialBelief: 0.5,
      toleranceRadius: 0.3,
      toleranceOffset: 0.1,
      silenceStrategy: 0,
      silenceEffect: 0,
      thresholdValue: 0.5,
      confidenceValue: 0.5,
      updateValue: 1
    };
    setAgents(prev => [...prev, newAgent]);
  }, [agents.length]);

  // Remove agent handler
  const handleRemoveAgent = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    // Remove agent
    setAgents(prev => prev.filter(a => a.id !== agentId));

    // Remove neighbors that reference this agent
    setNeighbors(prev => prev.filter(n => n.source !== agent.name && n.target !== agent.name));
  }, [agents]);

  // Update agent handler
  const handleUpdateAgent = useCallback((agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        const oldName = agent.name;
        const updatedAgent = { ...agent, ...updates };

        // If name changed, update neighbors
        if (updates.name && updates.name !== oldName) {
          const newName = updates.name; // Store in variable to ensure it's not undefined
          setNeighbors(prevNeighbors => prevNeighbors.map(n => ({
            ...n,
            source: n.source === oldName ? newName : n.source,
            target: n.target === oldName ? newName : n.target
          })));
        }

        return updatedAgent;
      }
      return agent;
    }));
  }, []);

  // Add neighbor handler
  const handleAddNeighbor = useCallback(() => {
    if (agents.length < 2) return;

    // Count how many times each agent is used as source
    const sourceCounts: Record<string, number> = {};
    neighbors.forEach(n => {
      sourceCounts[n.source] = (sourceCounts[n.source] || 0) + 1;
    });

    const maxSourceCount = agents.length - 1;
    const usedPairs = new Set(neighbors.map(n => `${n.source}-${n.target}`));

    let source = '';
    let target = '';

    // Try to find an unused pair with a source that hasn't reached its limit
    for (const sourceAgent of agents) {
      // Skip if this source has reached its limit
      if ((sourceCounts[sourceAgent.name] || 0) >= maxSourceCount) continue;

      for (const targetAgent of agents) {
        if (sourceAgent.id !== targetAgent.id) {
          const pair = `${sourceAgent.name}-${targetAgent.name}`;
          if (!usedPairs.has(pair)) {
            source = sourceAgent.name;
            target = targetAgent.name;
            break;
          }
        }
      }
      if (source && target) break;
    }

    // If no available pair found, don't add
    if (!source || !target) return;

    const newNeighbor: Neighbor = {
      id: crypto.randomUUID(),
      source,
      target,
      influence: 0.5,
      bias: 0
    };
    setNeighbors(prev => [...prev, newNeighbor]);
  }, [agents, neighbors]);

  // Remove neighbor handler
  const handleRemoveNeighbor = useCallback((neighborId: string) => {
    setNeighbors(prev => prev.filter(n => n.id !== neighborId));
  }, []);

  // Update neighbor handler
  const handleUpdateNeighbor = useCallback((neighborId: string, updates: Partial<Neighbor>) => {
    setNeighbors(prev => prev.map(n => n.id === neighborId ? { ...n, ...updates } : n));
  }, []);

  // Get available sources (sources that haven't reached their limit)
  const getAvailableSources = useCallback((currentNeighborId: string) => {
    const currentNeighbor = neighbors.find(n => n.id === currentNeighborId);
    const sourceCounts: Record<string, number> = {};

    // Count how many times each agent is used as source
    neighbors.forEach(n => {
      if (n.id !== currentNeighborId) {
        sourceCounts[n.source] = (sourceCounts[n.source] || 0) + 1;
      }
    });

    // An agent can be source at most (n-1) times
    const maxSourceCount = agents.length - 1;

    return agents
      .map(a => a.name)
      .filter(name => {
        // Always include the current source (for editing)
        if (currentNeighbor && name === currentNeighbor.source) return true;
        // Otherwise check if under the limit
        return (sourceCounts[name] || 0) < maxSourceCount;
      });
  }, [agents, neighbors]);

  // Get available targets for a source
  const getAvailableTargets = useCallback((source: string, currentNeighborId: string) => {
    const usedPairs = neighbors
      .filter(n => n.id !== currentNeighborId)
      .map(n => `${n.source}-${n.target}`);

    return agents
      .map(a => a.name)
      .filter(name => {
        if (name === source) return false; // Can't target self
        const pair = `${source}-${name}`;
        return !usedPairs.includes(pair);
      });
  }, [agents, neighbors]);

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const buffer = buildBuffer();

      const response = await fetch('http://localhost:8080/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: buffer
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      // Success
      setSubmitSuccess(true);
      // Reset form after a delay if desired
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation
  const maxNeighbors = agents.length * (agents.length - 1);
  const isValid = agents.length > 0 &&
      agents.every(a => a.name.trim().length > 0) &&
      neighbors.every(n => n.source !== n.target) &&
      networkName.trim().length > 0 &&
      stringToBytes(networkName).length <= 255;

  return (
    <TooltipProvider>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Custom Simulation Run</CardTitle>
          <CardDescription>Configure and run a custom simulation with specific agents and network topology</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stopThreshold" className="text-sm font-medium">Stop Threshold</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      id="stopThreshold"
                      type="number"
                      min={0}
                      step={0.0001}
                      value={stopThreshold}
                      onChange={(e) => setStopThreshold(parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Convergence threshold for stopping iterations</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <Label htmlFor="iterationLimit" className="text-sm font-medium">Iteration Limit</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      id="iterationLimit"
                      type="number"
                      min={1}
                      value={iterationLimit}
                      onChange={(e) => setIterationLimit(parseInt(e.target.value) || 1)}
                      className="h-9"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximum number of simulation iterations</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saveMode" className="text-sm font-medium">Save Mode</Label>
                <Select value={saveMode.toString()} onValueChange={(v) => setSaveMode(parseInt(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SAVE_MODES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="networkName" className="text-sm font-medium">Network Name</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      id="networkName"
                      value={networkName}
                      onChange={(e) => setNetworkName(e.target.value)}
                      maxLength={255}
                      className="h-9"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Max 255 bytes (UTF-8)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <Separator />

          {/* Agents Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Agents <span className="text-muted-foreground font-normal">({agents.length})</span></h3>
              <Button onClick={handleAddAgent} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Agent
              </Button>
            </div>

            <div className="space-y-4">
              {agents.map((agent) => (
                <Card key={agent.id} className="relative overflow-hidden">
                  {/* Delete button - absolute positioned */}
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

                  <div className="p-4 pr-14">
                    {/* First row: Name, Strategy, Effect */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Agent Name</Label>
                        <Input
                            value={agent.name}
                            onChange={(e) => handleUpdateAgent(agent.id, {name: e.target.value})}
                            placeholder="Agent name"
                            className="h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Silence Strategy</Label>
                        <Select
                            value={agent.silenceStrategy.toString()}
                            onValueChange={(v) => handleUpdateAgent(agent.id, {silenceStrategy: parseInt(v)})}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue/>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SILENCE_STRATEGIES).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Silence Effect</Label>
                        <Select
                            value={agent.silenceEffect.toString()}
                            onValueChange={(v) => handleUpdateAgent(agent.id, {silenceEffect: parseInt(v)})}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue/>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SILENCE_EFFECTS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="my-3"/>

                    {/* Second row: Belief, Radius, Offset */}
                    {(() => {
                      let totalCols = 3;
                      if (agent.silenceStrategy === 2) totalCols += 1;
                      if (agent.silenceStrategy === 3) totalCols += 2;

                      const gridClass = `grid gap-4 grid-cols-${totalCols}`;

                      return (
                          <div className={gridClass}>
                            <AgentInput
                                label="Belief"
                                value={agent.initialBelief}
                                onChange={(val) => handleUpdateAgent(agent.id, {initialBelief: val})}
                                placeholder={0}
                            />
                            <AgentInput
                                label="Radius"
                                value={agent.toleranceRadius}
                                onChange={(val) => handleUpdateAgent(agent.id, {toleranceRadius: val})}
                                placeholder={0}
                            />
                            <AgentInput
                                label="Offset"
                                value={agent.toleranceOffset}
                                onChange={(val) => handleUpdateAgent(agent.id, {toleranceOffset: val})}
                                placeholder={0}
                            />
                            {agent.silenceStrategy === 2 && (
                                <AgentInput
                                    label="Threshold Value"
                                    value={agent.thresholdValue}
                                    onChange={(val) => handleUpdateAgent(agent.id, {thresholdValue: val})}
                                    placeholder={0}
                                />
                            )}

                            {agent.silenceStrategy === 3 && (
                                <>
                                  <AgentInput
                                      label="Confidence Value"
                                      value={agent.confidenceValue}
                                      onChange={(val) => handleUpdateAgent(agent.id, {confidenceValue: val})}
                                      placeholder={0}
                                  />
                                  <AgentInput
                                      label="Update Value"
                                      type="int"
                                      min={0}
                                      step={1}
                                      value={agent.updateValue}
                                      placeholder={0}
                                      onChange={(val) => handleUpdateAgent(agent.id, {updateValue: val})}
                                  />
                                </>
                            )}
                          </div>
                      );
                    })()}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator/>

          {/* Neighbors Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Neighbors <span
                  className="text-muted-foreground font-normal">({neighbors.length}/{maxNeighbors})</span></h3>
              <Button
                  onClick={handleAddNeighbor}
                  size="sm"
                  variant="outline"
                  disabled={agents.length < 2 || neighbors.length >= maxNeighbors}
              >
                <Plus className="w-4 h-4 mr-2"/>
                Add Neighbor
              </Button>
            </div>

            {agents.length < 2 && (
                <Alert>
                  <AlertCircle className="h-4 w-4"/>
                  <AlertDescription>
                    You need at least 2 agents to create neighbor relationships.
                  </AlertDescription>
                </Alert>
            )}

            {neighbors.length >= maxNeighbors && (
                <Alert>
                  <AlertCircle className="h-4 w-4"/>
                  <AlertDescription>
                    Maximum number of neighbors reached. Each agent can connect to every other agent at most once.
                  </AlertDescription>
                </Alert>
            )}

            <div className="space-y-3">
              {neighbors.map((neighbor) => (
                  <Card key={neighbor.id} className="overflow-hidden">
                    <div className="p-3">
                      {/* Header with source/target selection and delete */}
                      <div className="flex justify-between items-center gap-3 mb-3">
                        <div className="flex gap-2 items-center flex-1">
                          <Select
                              value={neighbor.source}
                              onValueChange={(v) => handleUpdateNeighbor(neighbor.id, {source: v})}
                          >
                            <SelectTrigger className="h-9 w-[130px]">
                              <SelectValue placeholder="Source"/>
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableSources(neighbor.id).map(name => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="text-muted-foreground">→</span>

                          <Select
                              value={neighbor.target}
                              onValueChange={(v) => handleUpdateNeighbor(neighbor.id, {target: v})}
                          >
                            <SelectTrigger className="h-9 w-[130px]">
                            <SelectValue placeholder="Target" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableTargets(neighbor.source, neighbor.id).map(name => (
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

                    {/* Controls row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Influence</Label>
                          <span className="text-xs font-medium">{neighbor.influence.toFixed(2)}</span>
                        </div>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[neighbor.influence]}
                          onValueChange={(v) => handleUpdateNeighbor(neighbor.id, { influence: v[0] })}
                          className="mt-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Bias Type</Label>
                        <Select
                          value={neighbor.bias.toString()}
                          onValueChange={(v) => handleUpdateNeighbor(neighbor.id, { bias: parseInt(v) })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(BIASES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {submitSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
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