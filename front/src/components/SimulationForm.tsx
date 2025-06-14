import React, { useState, useMemo, useCallback } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form"; // Added Controller
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

import {
  AgentStrategyType, // Updated name
  AgentEffectType,
  AgentConfig,
  CognitiveBias,
  BiasConfig,
  ALL_AGENT_STRATEGY_TYPES, // Updated name
  ALL_AGENT_EFFECT_TYPES,
  ALL_COGNITIVE_BIASES,
  // SimulationConfig, // Using the interface from types.ts
  SAVE_MODES_MAP,
  SaveModeString
} from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- Zod Schema for Basic Validation ---
const formSchema = z.object({
  seed: z.coerce.bigint().nonnegative("Must be 0 or positive").optional(),
  numNetworks: z.coerce.number().int().positive("Must be positive"),
  numAgents: z.coerce.number().int().positive("Must be positive"),
  density: z.coerce.number().min(0),
  iterationLimit: z.coerce.number().int().positive("Must be positive"),
  stopThreshold: z.coerce.number().min(0),
  saveMode: z.string().min(1, "Required"), // Will be one of SaveModeString
});

type FormValues = z.infer<typeof formSchema>;

// Helper to map string strategy/effect/bias to byte codes
const strategyToByte = (strategy: AgentStrategyType): number => {
  switch (strategy) {
    case 'DeGroot': return 0;
    case 'Majority': return 1;
    case 'Threshold': return 2;
    case 'Confidence': return 3;
    default: return 1; // Default to Majority/Standard
  }
};

const effectToByte = (effect: AgentEffectType): number => {
  switch (effect) {
    case 'DeGroot': return 0;
    case 'Memory': return 1;
    case 'Memoryless': return 2;
    default: return 0;
  }
};

const biasToByte = (bias: CognitiveBias): number => {
  switch (bias) {
    case 'DeGroot': return 0;
    case 'Confirmation': return 1;
    case 'Backfire': return 2;
    case 'Authority': return 3;
    case 'Insular': return 4;
    default: return 0;
  }
};


export function SimulationForm() {
  const [thresholdValue, setThresholdValue] = useState<number>(0.5); // Default from HTML
  const [thresholdValueConfidence, setThresholdValueConfidence] = useState<number>(0.5); // Default from HTML
  const [openMindedness, setOpenMindedness] = useState<number>(100); // Default from HTML

  const { register, handleSubmit, watch, control, formState: { errors }, setValue: setFormValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numNetworks: 1,
      numAgents: 10,      // Adjusted for quicker testing
      density: 5,        // Adjusted
      iterationLimit: 100,
      stopThreshold: 0.01, // From your HTML example
      saveMode: 'Debug' as SaveModeString, // Default from your example
    },
  });

  const numAgents = watch('numAgents');
  const density = watch('density');

  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([
    {
      id: "default-agent",
      type: "Majority", // More common default
      effect: "Memoryless",
      count: numAgents || 10 // Initialize with numAgents
    }
  ]);

  const [biasConfigs, setBiasConfigs] = useState<BiasConfig[]>([
    {
      id: "default-bias",
      bias: "DeGroot",
      count: 0 // Default to 0 initially
    }
  ]);
  
  // Update default agent config count when numAgents changes
  React.useEffect(() => {
    setAgentConfigs(prev => {
      if (prev.length === 1 && prev[0].id === "default-agent") {
        return [{ ...prev[0], count: numAgents || 0 }];
      }
      // If user has added more configs, let them manage counts
      // Or, you could implement logic to redistribute/cap counts
      return prev;
    });
  }, [numAgents]);


  // Track used Type-Effect combinations
  const usedTypeEffectCombinations = useMemo(() => {
    const combinations: Record<string, string[]> = {};
    ALL_AGENT_STRATEGY_TYPES.forEach(type => { combinations[type] = []; });
    agentConfigs.forEach(config => {
      if (config.type && config.effect) {
        if (!combinations[config.type]) combinations[config.type] = [];
        if (!combinations[config.type].includes(config.effect)) {
          combinations[config.type].push(config.effect);
        }
      }
    });
    return combinations;
  }, [agentConfigs]);

  const getAvailableTypes = useCallback((currentConfig: AgentConfig) => {
    return ALL_AGENT_STRATEGY_TYPES.filter(type => {
      if (currentConfig.type === type) return true;
      const usedEffects = usedTypeEffectCombinations[type] || [];
      return usedEffects.length < ALL_AGENT_EFFECT_TYPES.length;
    });
  }, [usedTypeEffectCombinations]);

  const getAvailableEffects = useCallback((type: string, currentConfig: AgentConfig) => {
    if (!type) return [];
    const usedEffects = usedTypeEffectCombinations[type] || [];
    return ALL_AGENT_EFFECT_TYPES.filter(effect => {
      if (currentConfig.effect === effect && currentConfig.type === type) return true;
      return !usedEffects.includes(effect);
    });
  }, [usedTypeEffectCombinations]);

  const usedBiases = useMemo(() => biasConfigs.map(config => config.bias), [biasConfigs]);

  const getAvailableBiases = useCallback((currentConfig: BiasConfig) => {
    return ALL_COGNITIVE_BIASES.filter(bias => {
      if (currentConfig.bias === bias) return true;
      return !usedBiases.includes(bias);
    });
  }, [usedBiases]);

  const totalAssignedAgents = useMemo(() => agentConfigs.reduce((sum, config) => sum + config.count, 0), [agentConfigs]);
  const remainingAgents = useMemo(() => (numAgents || 0) - totalAssignedAgents, [numAgents, totalAssignedAgents]);

  const maxEdges = useMemo(() => {
    const n = numAgents || 0;
    const d = density || 0;
    if (n <= 1 || d === 0) return 0; // if density is 0, no edges.
     //This formula d * (d - 1) + ((n - d) * 2 * d) is specific and might not represent generic max edges (N*(N-1) for directed)
     //Using your specific formula:
    if (d > n) return n * (n-1); // Density cannot be greater than N. Cap at N*(N-1)
    return Math.floor(d * (d - 1) + ((n - d) * 2 * d));
  }, [numAgents, density]);

  const totalAssignedBiases = useMemo(() => biasConfigs.reduce((sum, config) => sum + config.count, 0), [biasConfigs]);
  const remainingBiases = useMemo(() => maxEdges - totalAssignedBiases, [maxEdges, totalAssignedBiases]);

  const isAgentDistributionValid = remainingAgents === 0 && (numAgents || 0) > 0;
  const isBiasDistributionValid = remainingBiases >= 0;
  const isFormValid = !Object.keys(errors).length && isAgentDistributionValid && isBiasDistributionValid;

  const handleAddAgentConfig = useCallback(() => {
    const availableTypeEffect = ALL_AGENT_STRATEGY_TYPES.reduce((found, type) => {
      if (found) return found;
      const availableEffect = ALL_AGENT_EFFECT_TYPES.find(effect => !(usedTypeEffectCombinations[type] || []).includes(effect));
      if (availableEffect) return { type, effect: availableEffect };
      return null;
    }, null as { type: AgentStrategyType, effect: AgentEffectType } | null);

    if (availableTypeEffect) {
      setAgentConfigs(prev => [...prev, {
        id: `agent-${Date.now()}`,
        type: availableTypeEffect.type,
        effect: availableTypeEffect.effect,
        count: 0
      }]);
    }
  }, [usedTypeEffectCombinations]);

  const handleRemoveAgentConfig = useCallback((configId: string) => {
    setAgentConfigs(prev => prev.filter(config => config.id !== configId));
  }, []);

  const handleAgentCountChange = useCallback((configId: string, value: string | number, source: 'input' | 'slider') => {
    const currentNumAgents = numAgents || 0;
    if (currentNumAgents <= 0) return;
    let newCount = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
    if (isNaN(newCount) || newCount < 0) newCount = 0;

    setAgentConfigs(prev => {
      const currentConfig = prev.find(c => c.id === configId);
      if (!currentConfig) return prev;
      const otherConfigsTotal = prev.reduce((sum, c) => c.id === configId ? sum : sum + c.count, 0);
      const maxAllowed = currentNumAgents - otherConfigsTotal;
      const clampedCount = Math.max(0, Math.min(newCount, maxAllowed));
      if (clampedCount !== currentConfig.count || source === 'input') {
        return prev.map(c => c.id === configId ? { ...c, count: clampedCount } : c);
      }
      return prev;
    });
  }, [numAgents]);

  const handleAgentTypeChange = useCallback((configId: string, type: AgentStrategyType) => {
    setAgentConfigs(prev => prev.map(c => c.id === configId ? { ...c, type } : c));
  }, []);

  const handleEffectChange = useCallback((configId: string, effect: AgentEffectType) => {
    setAgentConfigs(prev => prev.map(c => c.id === configId ? { ...c, effect } : c));
  }, []);

  const handleAddBiasConfig = useCallback(() => {
    const availableBias = ALL_COGNITIVE_BIASES.find(bias => !usedBiases.includes(bias));
    if (availableBias) {
      setBiasConfigs(prev => [...prev, {
        id: `bias-${Date.now()}`,
        bias: availableBias,
        count: 0
      }]);
    }
  }, [usedBiases]);

  const handleRemoveBiasConfig = useCallback((configId: string) => {
    setBiasConfigs(prev => prev.filter(config => config.id !== configId));
  }, []);

  const handleBiasChange = useCallback((configId: string, bias: CognitiveBias) => {
    setBiasConfigs(prev => prev.map(c => c.id === configId ? { ...c, bias } : c));
  }, []);

  const handleBiasCountChange = useCallback((configId: string, value: string | number, source: 'input' | 'slider') => {
    if (maxEdges <= 0 && totalAssignedBiases ===0 ) return; // Allow setting to 0 if maxEdges is 0.
    let newCount = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
    if (isNaN(newCount) || newCount < 0) newCount = 0;

    setBiasConfigs(prev => {
      const currentConfig = prev.find(c => c.id === configId);
      if (!currentConfig) return prev;
      const otherConfigsTotal = prev.reduce((sum, c) => c.id === configId ? sum : sum + c.count, 0);
      const maxAllowedForThis = maxEdges - otherConfigsTotal; // Max this slider can take
      const clampedCount = Math.max(0, Math.min(newCount, maxAllowedForThis));

      if (clampedCount !== currentConfig.count || source === 'input') {
        return prev.map(c => c.id === configId ? { ...c, count: clampedCount } : c);
      }
      return prev;
    });
  }, [maxEdges, totalAssignedBiases]);


  // --- Form Submission ---
  function calculateBufferSizeLocal() {
    let bufferSize = 28; // Fixed header
    agentConfigs.forEach(config => {
      bufferSize += 6; // agentCount (4), strategyType (1), effectType (1)
      if (config.type === 'Threshold') bufferSize += 4; // thresholdValue (float32)
      else if (config.type === 'Confidence') bufferSize += 8; // confidenceThreshold (float32) + updateValue (int32)
    });
    bufferSize += biasConfigs.length * 5; // neighborCount (4) + biasType (1) for each bias config
    return bufferSize;
  }

  const onFormSubmit = async (data: FormValues) => {
    if (!isFormValid) {
      console.error("Form is invalid. Submission prevented.");
      // You might want to show a user-facing error message here
      alert("Form is invalid. Please check agent and bias distributions.");
      return;
    }

    const bufferSize = calculateBufferSizeLocal();
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    let offset = 0;

    // Write fixed fields (matching message.txt structure)
    view.setInt8(offset++, 0); // runType, assumed 0 for generated run [cite: 46]
    
    const saveModeValue = SAVE_MODES_MAP[data.saveMode as SaveModeString];
    view.setInt8(offset++, saveModeValue);
    
    view.setInt8(offset++, agentConfigs.length);
    view.setInt8(offset++, biasConfigs.length);
    
    view.setInt32(offset, data.numNetworks, true); offset += 4;
    view.setInt32(offset, data.density, true); offset += 4;
    view.setInt32(offset, data.iterationLimit, true); offset += 4;
    view.setFloat32(offset, data.stopThreshold, true); offset += 4;
    
    const seedBigInt = data.seed !== undefined ? data.seed : BigInt(-1);
    view.setBigInt64(offset, seedBigInt, true); offset += 8;

    // Write agent data
    agentConfigs.forEach(config => {
      view.setInt32(offset, config.count, true); offset += 4;
      view.setInt8(offset++, strategyToByte(config.type));
      view.setInt8(offset++, effectToByte(config.effect));

      if (config.type === 'Threshold') {
        view.setFloat32(offset, thresholdValue, true); offset += 4;
      } else if (config.type === 'Confidence') {
        view.setFloat32(offset, thresholdValueConfidence, true); offset += 4;
        view.setInt32(offset, openMindedness, true); offset += 4;
      }
    });

    // Write bias data
    biasConfigs.forEach(config => {
      view.setInt32(offset, config.count, true); offset += 4; // This is 'neighborCount' in HTML, but represents count of edges for this bias
      view.setInt8(offset++, biasToByte(config.bias));
    });

    // For debugging: Display binary data as hex
    const hexView = new Uint8Array(buffer);
    let hexString = '';
    for (let i = 0; i < hexView.length; i++) {
        hexString += hexView[i].toString(16).padStart(2, '0') + ' ';
        if ((i + 1) % 16 === 0) hexString += '\n';
    }
    console.log("Binary Payload (Hex):\n", hexString);


    try {
      const response = await fetch('http://localhost:9000/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: buffer
      });
      const responseText = await response.text();
      console.log("Server Response:", responseText);
      //alert(`Server Response: ${responseText}`);
      // You can update some state here to show the response in the UI if needed
    } catch (error) {
      console.error("Error sending request:", error);
      alert(`Error sending request: ${error}`);
      // Update UI to show error
    }
  };

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
                <Input id="numAgents" type="number" min="1" {...register("numAgents", { valueAsNumber: true })}
                       onChange={(e) => {
                           setFormValue('numAgents', parseInt(e.target.value) || 0);
                       }}
                />
                {errors.numAgents && <p className="text-red-500 text-sm mt-1">{errors.numAgents.message}</p>}
              </div>
              <div>
                <Label htmlFor="density">Density</Label>
                 <Tooltip>
                    <TooltipTrigger asChild>
                      <Input id="density" type="number" min="0" max={numAgents ? numAgents -1 : undefined} step="1" {...register("density", { valueAsNumber: true })}
                            onChange={(e) => {
                                setFormValue('density', parseFloat(e.target.value) || 0);
                           }}
                       />
                    </TooltipTrigger>
                    <TooltipContent>
                       <p>Number of connections for certain agent types. Max edges: {maxEdges}</p>
                    </TooltipContent>
                </Tooltip>
                {errors.density && <p className="text-red-500 text-sm mt-1">{errors.density.message}</p>}
              </div>
              <div>
                <Label htmlFor="iterationLimit">Iteration Limit</Label>
                <Input id="iterationLimit" type="number" min="1" {...register("iterationLimit", { valueAsNumber: true })} />
                {errors.iterationLimit && <p className="text-red-500 text-sm mt-1">{errors.iterationLimit.message}</p>}
              </div>
              <div>
                <Label htmlFor="stopThreshold">Stop Threshold</Label>
                <Input id="stopThreshold" type="number" min="0" step="any" {...register("stopThreshold", { valueAsNumber: true })} />
                 {errors.stopThreshold && <p className="text-red-500 text-sm mt-1">{errors.stopThreshold.message}</p>}
             </div>
             
            <div>
                <Label htmlFor="saveMode">Save Mode</Label>
                <Controller
                    control={control}
                    name="saveMode"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select save mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Save Modes</SelectLabel>
                                    {Object.entries(SAVE_MODES_MAP).map(([key, value]) => (
                                        <SelectItem key={value} value={key as string}>{key}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.saveMode && <p className="text-red-500 text-sm mt-1">{errors.saveMode.message}</p>}
            </div>

             <div>
                <Label htmlFor="seed">Seed (Optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input 
                      id="seed" 
                      type="text" // Changed to text to handle BigInt correctly
                      {...register("seed", {setValueAs: (v) => v === "" ? undefined : BigInt(v)})}
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
                              <div className="flex items-center gap-2">
                                <Select 
                                  value={config.type} 
                                  onValueChange={(val) => handleAgentTypeChange(config.id, val as AgentStrategyType)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Agent Strategy</SelectLabel>
                                      {availableTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                                
                                <Select
                                  value={config.effect}
                                  onValueChange={(val) => handleEffectChange(config.id, val as AgentEffectType)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Effect" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Silence Effect</SelectLabel>
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
                                  {numAgents && numAgents > 0
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
                                <Label htmlFor={`threshold-${config.id}`}>Threshold Value (0–1)</Label>
                                <Input
                                  id={`threshold-${config.id}`}
                                  type="number" min={0} max={1} step={0.01}
                                  value={thresholdValue}
                                  onChange={(e) => setThresholdValue(parseFloat(e.target.value) || 0)}
                                  className="w-32"
                                />
                              </div>
                            )}
                            
                            {config.type === "Confidence" && (
                              <div className="mt-2 flex items-start gap-x-6">
                                <div className="flex flex-col space-y-1">
                                  <Label htmlFor={`thresconf-${config.id}`}>Confidence Threshold (0–1)</Label>
                                  <Input
                                    id={`thresconf-${config.id}`}
                                    type="number" min={0} max={1} step={0.01}
                                    value={thresholdValueConfidence}
                                    onChange={(e) => setThresholdValueConfidence(parseFloat(e.target.value) || 0)}
                                    className="w-32"
                                  />
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <Label htmlFor={`openm-${config.id}`}>Update Value (Open Mindedness, ≥1)</Label>
                                  <Input
                                    id={`openm-${config.id}`}
                                    type="number" min={1} step={1}
                                    value={openMindedness}
                                    onChange={(e) => setOpenMindedness(parseInt(e.target.value, 10) || 1)}
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
                      disabled={Object.values(usedTypeEffectCombinations).every(effects => effects.length >= ALL_AGENT_EFFECT_TYPES.length) &&
                                agentConfigs.length >= ALL_AGENT_STRATEGY_TYPES.length * ALL_AGENT_EFFECT_TYPES.length
                               }
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
              {(maxEdges <= 0 && numAgents > 0 && density > 0)  ? ( // Show if N and D are set but result in 0 edges
                <p className="text-muted-foreground text-sm">Max Edges is {maxEdges}. Cannot assign biases.</p>
              ): (maxEdges <= 0) ? (
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
                                max={maxEdges} // Max for this slider should be remainingBiases + current count of this slider.
                                step={1}
                                value={[config.count]}
                                onValueChange={(v) => handleBiasCountChange(config.id, v[0], "slider")}
                                className="col-start-1 w-full"
                                disabled={maxEdges === 0}
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
                                  disabled={maxEdges === 0}
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
                      disabled={usedBiases.length >= ALL_COGNITIVE_BIASES.length || maxEdges === 0}
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
                         </ul>eee
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
      </Card>
    </TooltipProvider>
  );
}