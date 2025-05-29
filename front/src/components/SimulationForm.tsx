import React, { useState, useMemo, useCallback } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

import { AgentType, AgentConfig, CognitiveBias, BiasConfig, ALL_AGENT_TYPES, ALL_COGNITIVE_BIASES, SimulationConfig } from '@/lib/types'; // Adjust path if needed
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

// --- Zod Schema for Basic Validation ---
// We'll handle complex inter-field validation manually for now
const formSchema = z.object({
  seed: z.coerce.bigint().nonnegative("Must be 0 or positive").optional(),
  numNetworks: z.coerce.number().int().positive("Must be positive"),
  numAgents: z.coerce.number().int().positive("Must be positive"),
  density: z.coerce.number().min(0),
  iterationLimit: z.coerce.number().int().positive("Must be positive"),
  stopThreshold: z.coerce.number().min(0),
  saveMode: z.string().min(1, "Required")
});

type FormValues = z.infer<typeof formSchema>;

export function SimulationForm() {
  const [thresholdValue, setThresholdValue] = useState<number>(0);
  const [thresholdValueConfidence, setThresholdValueConfidence] = useState<number>(1);
  const [openMindedness, setOpenMindedness] = useState<number>(2);
  // === Basic Parameters State ===
  const { register, handleSubmit, watch, formState: { errors }, setValue: setFormValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numNetworks: 1,
      numAgents: 100, // Default example value
      density: 16, // Default example value
      iterationLimit: 100,
      stopThreshold: 0.001, // From your example 0.00000001
      saveMode: 'Debug', // From your example
    },
  });

  const ws = useMemo(() => new WebSocket("ws://localhost:8080/ws"), []);
  const numAgents = watch('numAgents');
  const density = watch('density');

  // === Agent Type Distribution State ===
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([
    // Start with one default configuration
    {
      id: "default",
      type: "DeGroot",
      effect: "Memory",
      count: 0
    }
  ]);

  React.useEffect(() => {
    // This empty dependency array ensures it only runs once on mount
  }, []);

  // Track used Type-Effect combinations
  const usedTypeEffectCombinations = useMemo(() => {
    const combinations: Record<string, string[]> = {};
    
    // Initialize all agent types with empty arrays
    ALL_AGENT_TYPES.forEach(type => {
      combinations[type] = [];
    });
    
    // Fill with used effects - handle consistently
    agentConfigs.forEach(config => {
      if (config.type && config.effect) { // Only track if both are set
        if (!combinations[config.type]) {
          combinations[config.type] = [];
        }
        
        // Avoid duplicates
        if (!combinations[config.type].includes(config.effect)) {
          combinations[config.type].push(config.effect);
        }
      }
    });
    
    return combinations;
  }, [agentConfigs]);

  // Get available types (those that don't have all effects used)
  const getAvailableTypes = useCallback((currentConfig: AgentConfig) => {
    const allEffects = ["DeGroot", "Memory", "Memoryless"];
    
    // Filter types that don't have all effects used yet
    return ALL_AGENT_TYPES.filter(type => {
      // If this is the current type being edited, always include it
      if (currentConfig.type === type) return true;
      
      // Check if all possible effects are already used for this type
      const usedEffects = usedTypeEffectCombinations[type] || [];
      return usedEffects.length < allEffects.length;
    });
  }, [usedTypeEffectCombinations]);

  // Get available effects for a specific type
  const getAvailableEffects = useCallback((type: string, currentConfig: AgentConfig) => {
    if (!type) return []; // Return empty if no type selected
    
    const allEffects = ["DeGroot", "Memory", "Memoryless"] as const;
    const usedEffects = usedTypeEffectCombinations[type] || [];
    
    return allEffects.filter(effect => {
      // If this is the current effect being edited, include it
      if (currentConfig.effect === effect && currentConfig.type === type) return true;
      
      // Otherwise, only include effects not yet used for this type
      return !usedEffects.includes(effect);
    });
  }, [usedTypeEffectCombinations]);

  // === Cognitive Bias Distribution State ===
  const [biasConfigs, setBiasConfigs] = useState<BiasConfig[]>([
    {
      id: "default-bias",
      bias: "DeGroot",
      count: 0
    }
  ]);

  const usedBiases = useMemo(() => {
    return biasConfigs.map(config => config.bias);
  }, [biasConfigs]);

  const getAvailableBiases = useCallback((currentConfig: BiasConfig) => {
    return ALL_COGNITIVE_BIASES.filter(bias => {
      // Include current bias
      if (currentConfig.bias === bias) return true;
      
      // Only include biases that aren't already used
      return !usedBiases.includes(bias);
    });
  }, [usedBiases]);


  // === Derived Values ===
  const totalAssignedAgents = useMemo(() => {
    return agentConfigs.reduce((sum, config) => sum + config.count, 0);
  }, [agentConfigs]);

  const remainingAgents = useMemo(() => {
    return (numAgents || 0) - totalAssignedAgents;
  }, [numAgents, totalAssignedAgents]);

  // Approximate Max Edges (for a directed graph where density is proportion of N*(N-1))
  // Adjust if your density definition or graph type (undirected) is different
  const maxEdges = useMemo(() => {
    const n = numAgents || 0;
    const d = density || 0;
    if (n <= 1) return 0;
    // Use Math.floor to ensure integer count
    return d * (d - 1) + ((n - d) * 2 * d);
  }, [numAgents, density]);

  const totalAssignedBiases = useMemo(() => {
    return biasConfigs.reduce((sum, config) => sum + config.count, 0);
  }, [biasConfigs]);

  const remainingBiases = useMemo(() => {
    return maxEdges - totalAssignedBiases;
  }, [maxEdges, totalAssignedBiases]);


  // === Validation Flags ===
  const isAgentDistributionValid = remainingAgents === 0 && (numAgents || 0) > 0;
  const isBiasDistributionValid = remainingBiases >= 0; // Can have fewer biased edges than maxEdges
  const isFormValid = !Object.keys(errors).length && isAgentDistributionValid && isBiasDistributionValid;

  // === Handlers ===
  // Handler for adding a new agent configuration
  const handleAddAgentConfig = useCallback(() => {
    // Find an available type-effect combination
    const availableTypeEffect = ALL_AGENT_TYPES.reduce((found, type) => {
      if (found) return found;
      
      const usedEffects = usedTypeEffectCombinations[type] || [];
      const allEffects = ["DeGroot", "Memory", "Memoryless"];
      
      const availableEffect = allEffects.find(effect => 
        !usedEffects.includes(effect)
      );
      
      if (availableEffect) {
        return { type, effect: availableEffect };
      }
      
      return null;
    }, null as { type: string, effect: string } | null);
    
    // Only add if there's an available combination
    if (availableTypeEffect) {
      setAgentConfigs(prev => [
        ...prev, 
        {
          id: `agent-${Date.now()}`,
          type: availableTypeEffect.type as AgentType,
          effect: availableTypeEffect.effect as "DeGroot" | "Memory" | "Memoryless",
          count: 0
        }
      ]);
    }
  }, [usedTypeEffectCombinations]);

  // Handler for removing an agent configuration
  const handleRemoveAgentConfig = useCallback((configId: string) => {
    setAgentConfigs(prev => prev.filter(config => config.id !== configId));
  }, []);

  // Handler for changing agent count for a configuration
  const handleAgentCountChange = useCallback((configId: string, value: string | number, source: 'input' | 'slider') => {
    const currentNumAgents = numAgents || 0;
    if (currentNumAgents <= 0) return;

    let newCount = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
    if (isNaN(newCount) || newCount < 0) {
      newCount = 0;
    }

    setAgentConfigs(prev => {
      const currentConfig = prev.find(c => c.id === configId);
      if (!currentConfig) return prev;

      const otherConfigsTotal = prev.reduce((sum, c) => 
        c.id === configId ? sum : sum + c.count, 0);
      const maxAllowed = currentNumAgents - otherConfigsTotal;
      const clampedCount = Math.max(0, Math.min(newCount, maxAllowed));

      if (clampedCount !== currentConfig.count || source === 'input') {
        return prev.map(c => 
          c.id === configId ? {...c, count: clampedCount} : c
        );
      }
      return prev;
    });
  }, [numAgents]);

  // Handler for changing agent type for a configuration
  const handleAgentTypeChange = useCallback((configId: string, type: AgentType) => {
    setAgentConfigs(prev => 
      prev.map(c => c.id === configId ? {...c, type} : c)
    );
  }, []);

  // Handler for changing effect for a configuration
  const handleEffectChange = useCallback((configId: string, effect: "DeGroot" | "Memory" | "Memoryless") => {
    setAgentConfigs(prev => 
      prev.map(c => c.id === configId ? {...c, effect} : c)
    );
  }, []);


  // --- Cognitive Bias Handlers ---
  const handleAddBiasConfig = useCallback(() => {
    const availableBias = ALL_COGNITIVE_BIASES.find(bias => !usedBiases.includes(bias));
    
    if (availableBias) {
      setBiasConfigs(prev => [
        ...prev,
        {
          id: `bias-${Date.now()}`,
          bias: availableBias,
          count: 0
        }
      ]);
    }
  }, [usedBiases]);

  const handleRemoveBiasConfig = useCallback((configId: string) => {
    setBiasConfigs(prev => prev.filter(config => config.id !== configId));
  }, []);

  // Handler for changing bias value
  const handleBiasChange = useCallback((configId: string, bias: CognitiveBias) => {
    setBiasConfigs(prev => 
      prev.map(c => c.id === configId ? {...c, bias} : c)
    );
  }, []);

  // Handler for changing bias count
  const handleBiasCountChange = useCallback((configId: string, value: string | number, source: 'input' | 'slider') => {
    if (maxEdges <= 0) return;

    let newCount = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
    if (isNaN(newCount) || newCount < 0) {
      newCount = 0;
    }

    setBiasConfigs(prev => {
      const currentConfig = prev.find(c => c.id === configId);
      if (!currentConfig) return prev;

      const otherConfigsTotal = prev.reduce((sum, c) => 
        c.id === configId ? sum : sum + c.count, 0);
      const maxAllowed = maxEdges - otherConfigsTotal;
      const clampedCount = Math.max(0, Math.min(newCount, maxAllowed));

      if (clampedCount !== currentConfig.count || source === 'input') {
        return prev.map(c => 
          c.id === configId ? {...c, count: clampedCount} : c
        );
      }
      return prev;
    });
  }, [maxEdges]);


  // --- Form Submission ---
  function calculateBufferSize(config: SimulationConfig) {
    const agentTypes = document.getElementsByClassName('agent-type');
    const biasCount = document.getElementsByClassName('bias').length;

    // Fixed header: 28 bytes
    let bufferSize = 28;

    // Calculate agent data size with variable length
    for (let i = 0; i < agentTypes.length; i++) {
      const agentType = agentTypes[i];
      const strategyType = parseInt(agentType.querySelector('.silence-strategy').value);

      // Base size: 6 bytes (agent count + strategy type + effect type)
      let agentEntrySize = 6;

      // Add extra parameters based on strategy type
      if (strategyType === 2) {
        // Add 4 bytes for the extra float parameter
        agentEntrySize += 4;
      } else if (strategyType === 3) {
        // Add 8 bytes for the two extra parameters (float + int)
        agentEntrySize += 8;
      }

      bufferSize += agentEntrySize;
    }

    // Bias data: 5 bytes per bias
    bufferSize += biasCount * 5;

    return bufferSize;
  }

  const onFormSubmit = (data: FormValues) => {
    if (!isFormValid) {
      console.error("Form is invalid. Submission prevented.");
      return;
    }

      const config: SimulationConfig = {
          ...data,
          agentTypeDistribution: agentConfigs.reduce((acc, config) => {
              if (!acc[config.type]) acc[config.type] = 0;
              acc[config.type] += config.count;
              return acc;
          }, {} as Record<AgentType, number>),
          cognitiveBiasDistribution: biasConfigs.reduce((acc, config) => {
              acc[config.bias] = config.count;
              return acc;
          }, {} as Record<CognitiveBias, number>),
      };

      // const agentTypes = document.getElementsByClassName('agent-type');
      // const biasCount = document.getElementsByClassName('bias').length;
      //
      // // Calculate buffer size
      // const bufferSize = calculateBufferSize();
      //
      // // Create buffer and DataView
      // const buffer = new ArrayBuffer(bufferSize);
      // const view = new DataView(buffer);
      //
      // let offset = 0;
      //
      // // Write fixed fields
      // view.setInt8(offset++, 0);
      // view.setInt8(offset++, parseInt(data.saveMode));
      // view.setInt8(offset++, agentTypes.length);
      // view.setInt8(offset++, biasCount);
      // view.setInt32(offset, parseInt(document.getElementById('numberOfNetworks').value), true);
      // offset += 4;
      // view.setInt32(offset, parseInt(document.getElementById('density').value), true);
      // offset += 4;
      // view.setInt32(offset, parseInt(document.getElementById('iterLimit').value), true);
      // offset += 4;
      // view.setFloat32(offset, parseFloat(document.getElementById('stopThreshold').value), true);
      // offset += 4;
      // const seedValue = document.getElementById('seed').value;
      // view.setBigInt64(offset, BigInt(seedValue === "" ? -1 : seedValue), true);
      // offset += 8;
      //
      // // Write agent data with variable length
      // for (let i = 0; i < agentTypes.length; i++) {
      //     const agentType = agentTypes[i];
      //     const agentCount = parseInt(agentType.querySelector('.agent-count').value);
      //     const strategyType = parseInt(agentType.querySelector('.silence-strategy').value);
      //     const effectType = parseInt(agentType.querySelector('.silence-effect').value);
      //
      //     view.setInt32(offset, agentCount, true);
      //     offset += 4;
      //     view.setInt8(offset++, strategyType);
      //     view.setInt8(offset++, effectType);
      //
      //     // Add extra parameters based on strategy type
      //     if (strategyType === 2) {
      //         const threshold = parseFloat(agentType.querySelector('.extra-param1').value);
      //         view.setFloat32(offset, threshold, true);
      //         offset += 4;
      //     } else if (strategyType === 3) {
      //         const confidenceThreshold = parseFloat(agentType.querySelector('.extra-param1').value);
      //         const updateValue = parseInt(agentType.querySelector('.extra-param2').value);
      //         view.setFloat32(offset, confidenceThreshold, true);
      //         offset += 4;
      //         view.setInt32(offset, updateValue, true);
      //         offset += 4;
      //     }
      // }
      //
      // // Write bias data
      // const biases = document.getElementsByClassName('bias');
      // for (let i = 0; i < biases.length; i++) {
      //     const bias = biases[i];
      //     const neighborCount = parseInt(bias.querySelector('.neighbor-count').value);
      //     const biasType = parseInt(bias.querySelector('.bias-type').value);
      //
      //     view.setInt32(offset, neighborCount, true);
      //     offset += 4;
      //     view.setInt8(offset++, biasType);
      // }

      console.log("Simulation Configuration:", config);
      const payload = {
          seed: data.seed ? data.seed.toString() : undefined, // Convert BigInt to string
          numNetworks: data.numNetworks,
          density: data.density,
          iterationLimit: data.iterationLimit,
          stopThreshold: data.stopThreshold,
          saveMode: data.saveMode,
          degreeDistribution: 2.5,
          agentTypeDistribution: agentConfigs.map(config => ({
              strategy: config.type,
              effect: config.effect,
              count: config.count
          })),
          cognitiveBiasDistribution: biasConfigs.map(config => ({
              bias: config.bias,
              count: config.count
          }))
      };
  
    ws.send(JSON.stringify(payload));
    alert("Configuración enviada al servidor via WebSocket");
  };

  // === Rendering ===
  return (
    <TooltipProvider>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Run Simulation</CardTitle>
          <CardDescription>Configure the parameters for the simulation run.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">

            {/* --- Basic Parameters --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="numNetworks">Number of Networks</Label>
                <Input id="numNetworks" type="number" min="1" {...register("numNetworks")} />
                {errors.numNetworks && <p className="text-red-500 text-sm mt-1">{errors.numNetworks.message}</p>}
              </div>
              <div>
                <Label htmlFor="numAgents">Number of Agents (N)</Label>
                <Input id="numAgents" type="number" min="1" {...register("numAgents")}
                       onChange={(e) => {
                           setFormValue('numAgents', parseInt(e.target.value) || 0);
                           // Reset distributions on N change? Or just validate? Let's validate for now.
                           // Consider adding logic here if distributions should reset/scale.
                       }}
                />
                {errors.numAgents && <p className="text-red-500 text-sm mt-1">{errors.numAgents.message}</p>}
              </div>
              <div>
                <Label htmlFor="density">Density</Label>
                 <Tooltip>
                    <TooltipTrigger asChild>
                      <Input id="density" type="number" min="0" max={numAgents-1} step="1" {...register("density")}
                            onChange={(e) => {
                                setFormValue('density', parseFloat(e.target.value) || 0);
                               // Recalculates maxEdges implicitly due to watch()
                           }}
                       />
                    </TooltipTrigger>
                    <TooltipContent>
                       <p>Proportion of possible edges (0 to 1). Max edges: {maxEdges}</p>
                    </TooltipContent>
                </Tooltip>
                {errors.density && <p className="text-red-500 text-sm mt-1">{errors.density.message}</p>}
              </div>
              <div>
                <Label htmlFor="iterationLimit">Iteration Limit</Label>
                <Input id="iterationLimit" type="number" min="1" {...register("iterationLimit")} />
                {errors.iterationLimit && <p className="text-red-500 text-sm mt-1">{errors.iterationLimit.message}</p>}
              </div>
              <div>
                <Label htmlFor="stopThreshold">Stop Threshold</Label>
                <Input id="stopThreshold" type="number" min="0" step="0.00000001" {...register("stopThreshold")} />
                 {errors.stopThreshold && <p className="text-red-500 text-sm mt-1">{errors.stopThreshold.message}</p>}
             </div>
              <div>
                <Label htmlFor="saveMode">Save Mode</Label>
                <Input id="saveMode" {...register("saveMode")} />
                 {errors.saveMode && <p className="text-red-500 text-sm mt-1">{errors.saveMode.message}</p>}
             </div>
             <div>
                <Label htmlFor="seed">Seed (Optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input 
                      id="seed" 
                      type="number" 
                      min="0" 
                      step="1" 
                      {...register("seed")} 
                      placeholder="Random if not provided"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Specific seed for reproducible results. Leave empty for random generation.</p>
                  </TooltipContent>
                </Tooltip>
                {errors.seed && <p className="text-red-500 text-sm mt-1">{errors.seed.message}</p>}
              </div>
            </div>

            <Separator />

            {/* --- Agent Type Distribution --- */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Agent Type Distribution</h3>
              {(numAgents === undefined || numAgents <= 0) ? (
                <p className="text-muted-foreground text-sm">Enter a positive Number of Agents to configure types.</p>
              ) : (
                <>
                  <div className={`mb-4 p-3 rounded-md ${remainingAgents !== 0 ? 'bg-destructive/10 border border-destructive' : 'bg-green-100 dark:bg-green-900/30 border border-green-500'}`}>
                    <p className={`font-medium ${remainingAgents !== 0 ? 'text-destructive' : 'text-green-700 dark:text-green-400'}`}>
                      Agents to Assign: {remainingAgents} / {numAgents || 0}
                      {remainingAgents !== 0 && " (Must be exactly 0)"}
                    </p>
                  </div>

                  <div className="space-y-6 w-full">
                    {agentConfigs.map((config) => {
                      const availableTypes = getAvailableTypes(config);
                      const availableEffects = getAvailableEffects(config.type, config);

                      return (
                        <Card key={config.id} className="w-full">
                          <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div className="flex flex-col gap-0">
                              {/* <CardTitle>Agent Configuration</CardTitle> */}
                              <div className="flex items-center gap-2">
                                <Select 
                                  value={config.type} 
                                  onValueChange={(val) => handleAgentTypeChange(config.id, val as AgentType)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Agent Type</SelectLabel>
                                      {availableTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                                
                                <Select
                                  value={config.effect}
                                  onValueChange={(val) => handleEffectChange(
                                    config.id, 
                                    val as "DeGroot" | "Memory" | "Memoryless"
                                  )}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Effect" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Effects</SelectLabel>
                                      {availableEffects.map(effect => (
                                        <SelectItem key={effect} value={effect}>{effect}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {agentConfigs.length > 1 && (
                              <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveAgentConfig(config.id)}
                              className="h-8 w-8 hover:bg-red-500/10 -mt-2 self-start"
                              >
                              ✕
                              </Button>
                            )}

                          </CardHeader>
                          
                          <CardContent>
                            <div className="grid grid-cols-[1fr_auto] items-center gap-4 w-full">
                              <Slider
                                min={0}
                                max={numAgents || 0}
                                step={1}
                                value={[config.count]}
                                onValueChange={(v) => handleAgentCountChange(config.id, v[0], "slider")}
                                className="col-start-1 w-full"
                              />

                              <div className="relative w-24 mt-2">
                                <span className="absolute -top-6 right-0 text-sm text-muted-foreground">
                                  {numAgents > 0
                                    ? ((config.count / numAgents) * 100).toFixed(1)
                                    : "0.0"}
                                  %
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  max={numAgents || 0}
                                  value={config.count}
                                  onChange={(e) => handleAgentCountChange(config.id, e.target.value, "input")}
                                  className="w-full"
                                />
                              </div>
                            </div>

                            {config.type === "Threshold" && (
                              <div className="mt-2 flex flex-col space-y-1">
                                <Label htmlFor={`threshold-${config.id}`}>Threshold (0–1)</Label>
                                <Input
                                  id={`threshold-${config.id}`}
                                  type="number"
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  value={thresholdValue}
                                  onChange={(e) => {
                                    let v = parseFloat(e.target.value) || 0;
                                    if (v < 0) v = 0;
                                    if (v > 1) v = 1;
                                    setThresholdValue(v);
                                  }}
                                  className="w-32"
                                />
                              </div>
                            )}
                            
                            {config.type === "Confidence" && (
                              <div className="mt-2 flex items-start gap-x-6">
                                {/* Threshold */}
                                <div className="flex flex-col space-y-1">
                                  <Label htmlFor={`thresconf-${config.id}`}>Threshold (0–1)</Label>
                                  <Input
                                    id={`thresconf-${config.id}`}
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={thresholdValueConfidence}
                                    onChange={(e) => {
                                      let v = parseFloat(e.target.value) || 0;
                                      if (v < 0) v = 0;
                                      if (v > 1) v = 1;
                                      setThresholdValueConfidence(v);
                                    }}
                                    className="w-32"
                                  />
                                </div>
                                
                                {/* Open Mindedness */}
                                <div className="flex flex-col space-y-1">
                                  <Label htmlFor={`openm-${config.id}`}>Open Mindedness (≥1)</Label>
                                  <Input
                                    id={`openm-${config.id}`}
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={openMindedness}
                                    onChange={(e) => {
                                      let v = parseInt(e.target.value, 10) || 1;
                                      if (v < 1) v = 1;
                                      setOpenMindedness(v);
                                    }}
                                    className="w-32"
                                  />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    <Button 
                      onClick={handleAddAgentConfig}
                      variant="outline"
                      className="w-full"
                      // Disable the button if all possible combinations are already used
                      disabled={Object.entries(usedTypeEffectCombinations).every(
                        ([type, effects]) => effects.length >= 3
                      )}
                    >
                      + Add Agent Type Configuration
                    </Button>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* --- Cognitive Bias Distribution --- */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Cognitive Bias Distribution (Edges)</h3>
              {(maxEdges <= 0) ? (
                <p className="text-muted-foreground text-sm">Set Number of Agents (&gt;1) and Density (&gt;0) to configure biases. Calculated Max Edges: {maxEdges}</p>
              ) : (
                <>
                  <div className={`mb-4 p-3 rounded-md ${remainingBiases < 0 ? 'bg-destructive/10 border border-destructive' : 'bg-accent'}`}>
                    <p className={`font-medium ${remainingBiases < 0 ? 'text-destructive' : ''}`}>
                      Biased Edges Assigned: {totalAssignedBiases} / {maxEdges} (Max Possible)
                    </p>
                    <p className="text-sm text-muted-foreground">Remaining edges that can be assigned a bias: {remainingBiases}</p>
                    {remainingBiases < 0 && <p className="text-destructive font-semibold">Too many biases assigned!</p>}
                  </div>

                  <div className="space-y-6 w-full">
                    {biasConfigs.map((config) => {
                      const availableBiases = getAvailableBiases(config);
                      
                      return (
                        <Card key={config.id} className="w-full">
                          <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div className="flex flex-col gap-0">
                              <div className="flex items-center gap-2">
                                <Select 
                                  value={config.bias} 
                                  onValueChange={(val) => handleBiasChange(config.id, val as CognitiveBias)}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Cognitive Bias" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Cognitive Bias</SelectLabel>
                                      {availableBiases.map(bias => (
                                        <SelectItem key={bias} value={bias}>{bias}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {biasConfigs.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveBiasConfig(config.id)}
                                className="h-8 w-8 hover:bg-red-500/10 -mt-2 self-start"
                              >
                                ✕
                              </Button>
                            )}
                          </CardHeader>
                          
                          <CardContent>
                            <div className="grid grid-cols-[1fr_auto] items-center gap-4 w-full">
                              <Slider
                                min={0}
                                max={maxEdges}
                                step={1}
                                value={[config.count]}
                                onValueChange={(v) => handleBiasCountChange(config.id, v[0], "slider")}
                                className="col-start-1 w-full"
                              />

                              <div className="relative w-24 mt-2">
                                <span className="absolute -top-6 right-0 text-sm text-muted-foreground">
                                  {maxEdges > 0
                                    ? ((config.count / maxEdges) * 100).toFixed(1)
                                    : "0.0"}
                                  %
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  max={maxEdges}
                                  value={config.count}
                                  onChange={(e) => handleBiasCountChange(config.id, e.target.value, "input")}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    <Button 
                      onClick={handleAddBiasConfig}
                      variant="outline"
                      className="w-full"
                      disabled={usedBiases.length >= ALL_COGNITIVE_BIASES.length}
                    >
                      + Add Cognitive Bias
                    </Button>
                  </div>
                </>
              )}
            </div>

             {/* --- Validation Error Summary --- */}
            {(!isAgentDistributionValid || !isBiasDistributionValid) && (numAgents || 0) > 0 && (
                 <Alert variant="destructive">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertTitle>Configuration Issues</AlertTitle>
                    <AlertDescription>
                        Please resolve the following before submitting:
                        <ul className="list-disc list-inside">
                             {!isAgentDistributionValid && <li>Agent type distribution must sum exactly to the total Number of Agents ({numAgents || 0}).</li>}
                             {!isBiasDistributionValid && <li>The total number of biased edges cannot exceed the calculated maximum ({maxEdges}).</li>}
                         </ul>
                    </AlertDescription>
                </Alert>
            )}


             {/* --- Submit Button --- */}
             <div className="flex justify-end pt-4">
                 <Button type="submit" disabled={!isFormValid}>
                     Run Simulation
                 </Button>
             </div>
          </form>
        </CardContent>
         {/* Optional Footer */}
         {/* <CardFooter>
             <p>Footer information if needed.</p>
         </CardFooter> */}
      </Card>
    </TooltipProvider>
  );
}