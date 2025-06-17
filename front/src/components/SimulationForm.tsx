import React, { useMemo, useCallback, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { useSimulationState } from '@/hooks/useSimulationState.tsx';

import {
  AgentStrategyType,
  AgentEffectType,
  AgentConfig,
  CognitiveBias,
  BiasConfig,
  ALL_AGENT_STRATEGY_TYPES,
  ALL_AGENT_EFFECT_TYPES,
  ALL_COGNITIVE_BIASES,
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
} from "@/components/ui/select";

const formSchema = z.object({
  seed: z.string().optional(),
  numNetworks: z.coerce.number().int().positive("Must be positive"),
  numAgents: z.coerce.number().int().positive("Must be positive"),
  density: z.coerce.number().min(0),
  iterationLimit: z.coerce.number().int().positive("Must be positive"),
  stopThreshold: z.coerce.number().min(0),
  saveMode: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof formSchema>;

const strategyToByte = (strategy: AgentStrategyType): number => {
  switch (strategy) { case 'DeGroot': return 0; case 'Majority': return 1; case 'Threshold': return 2; case 'Confidence': return 3; default: return 1; }
};
const effectToByte = (effect: AgentEffectType): number => {
  switch (effect) { case 'DeGroot': return 0; case 'Memory': return 1; case 'Memoryless': return 2; default: return 0; }
};
const biasToByte = (bias: CognitiveBias): number => {
  switch (bias) { case 'DeGroot': return 0; case 'Confirmation': return 1; case 'Backfire': return 2; case 'Authority': return 3; case 'Insular': return 4; default: return 0; }
};

export function SimulationForm() {
  const { standardForm, setStandardForm } = useSimulationState();
  const {
    formValues,
    agentConfigs,
    biasConfigs,
    thresholdValue,
    thresholdValueConfidence,
    openMindedness,
  } = standardForm;

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: { ...formValues, seed: formValues.seed ? formValues.seed.toString() : '' },
  });

  useEffect(() => {
    const subscription = watch((value) => {
      setStandardForm(prevState => ({
        ...prevState,
        formValues: {
          ...prevState.formValues,
          ...value,
          saveMode: value.saveMode as SaveModeString,
          seed: value.seed && value.seed.trim() !== '' ? BigInt(value.seed) : undefined
        }
      }));
    });
    return () => subscription.unsubscribe();
  }, [watch, setStandardForm]);

  const numAgents = watch('numAgents');
  const density = watch('density');

  useEffect(() => {
    if (agentConfigs.length === 1 && agentConfigs[0].id === "default-agent") {
        setStandardForm(prev => {
            if (prev.agentConfigs[0].count !== (numAgents || 0)) {
                return {
                    ...prev,
                    agentConfigs: [{ ...prev.agentConfigs[0], count: numAgents || 0 }]
                };
            }
            return prev;
        });
    }
  }, [numAgents, agentConfigs, setStandardForm]);

  const maxEdges = useMemo(() => {
    const n = numAgents || 0;
    const d = density || 0;
    if (n <= 1 || d === 0) return 0;
    if (d > n) return n * (n - 1);
    return Math.floor(d * (d - 1) + ((n - d) * 2 * d));
  }, [numAgents, density]);

  useEffect(() => {
    if (biasConfigs.reduce((sum, config) => sum + config.count, 0) > maxEdges) {
      setStandardForm(prev => ({ ...prev, biasConfigs: prev.biasConfigs.map(config => ({ ...config, count: 0 })) }));
    }
  }, [maxEdges, biasConfigs, setStandardForm]);

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

  const handleAddAgentConfig = useCallback(() => {
    const availableTypeEffect = ALL_AGENT_STRATEGY_TYPES.reduce((found, type) => {
      if (found) return found;
      const availableEffect = ALL_AGENT_EFFECT_TYPES.find(effect => !(usedTypeEffectCombinations[type] || []).includes(effect));
      if (availableEffect) return { type, effect: availableEffect };
      return null;
    }, null as { type: AgentStrategyType, effect: AgentEffectType } | null);

    if (availableTypeEffect) {
      setStandardForm(prev => ({
        ...prev,
        agentConfigs: [...prev.agentConfigs, {
          id: `agent-${Date.now()}`,
          type: availableTypeEffect.type,
          effect: availableTypeEffect.effect,
          count: 0
        }]
      }));
    }
  }, [usedTypeEffectCombinations, setStandardForm]);

  const handleRemoveAgentConfig = useCallback((configId: string) => {
    setStandardForm(prev => ({ ...prev, agentConfigs: prev.agentConfigs.filter(c => c.id !== configId) }));
  }, [setStandardForm]);

  const handleAgentCountChange = useCallback((configId: string, value: string | number, source: 'input' | 'slider') => {
    let newCount = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
    if (isNaN(newCount) || newCount < 0) newCount = 0;

    setStandardForm(prev => {
      const currentConfig = prev.agentConfigs.find(c => c.id === configId);
      if (!currentConfig) return prev;
      const otherConfigsTotal = prev.agentConfigs.reduce((sum, c) => c.id === configId ? sum : sum + c.count, 0);
      const maxAllowed = (prev.formValues.numAgents || 0) - otherConfigsTotal;
      const clampedCount = Math.max(0, Math.min(newCount, maxAllowed));

      const newAgentConfigs = prev.agentConfigs.map(c => c.id === configId ? { ...c, count: clampedCount } : c);
      return { ...prev, agentConfigs: newAgentConfigs };
    });
  }, [setStandardForm]);

  const handleAgentTypeChange = useCallback((configId: string, type: AgentStrategyType) => {
    setStandardForm(prev => ({...prev, agentConfigs: prev.agentConfigs.map(c => c.id === configId ? {...c, type } : c)}));
  }, [setStandardForm]);

  const handleEffectChange = useCallback((configId: string, effect: AgentEffectType) => {
    setStandardForm(prev => ({...prev, agentConfigs: prev.agentConfigs.map(c => c.id === configId ? {...c, effect } : c)}));
  }, [setStandardForm]);

  const handleAddBiasConfig = useCallback(() => {
    const availableBias = ALL_COGNITIVE_BIASES.find(bias => !usedBiases.includes(bias));
    if (availableBias) {
      setStandardForm(prev => ({...prev, biasConfigs: [...prev.biasConfigs, {
        id: `bias-${Date.now()}`,
        bias: availableBias,
        count: 0
      }]}));
    }
  }, [usedBiases, setStandardForm]);

  const handleRemoveBiasConfig = useCallback((configId: string) => {
    setStandardForm(prev => ({...prev, biasConfigs: prev.biasConfigs.filter(c => c.id !== configId)}));
  }, [setStandardForm]);

  const handleBiasChange = useCallback((configId: string, bias: CognitiveBias) => {
    setStandardForm(prev => ({...prev, biasConfigs: prev.biasConfigs.map(c => c.id === configId ? {...c, bias } : c)}));
  }, [setStandardForm]);

  const handleBiasCountChange = useCallback((configId: string, value: string | number, source: 'input' | 'slider') => {
    let newCount = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
    if (isNaN(newCount) || newCount < 0) newCount = 0;

    setStandardForm(prev => {
      const currentConfig = prev.biasConfigs.find(c => c.id === configId);
      if (!currentConfig) return prev;
      const otherConfigsTotal = prev.biasConfigs.reduce((sum, c) => c.id === configId ? sum : sum + c.count, 0);
      const maxAllowedForThis = maxEdges - otherConfigsTotal;
      const clampedCount = Math.max(0, Math.min(newCount, maxAllowedForThis));

      const newBiasConfigs = prev.biasConfigs.map(c => c.id === configId ? { ...c, count: clampedCount } : c);
      return {...prev, biasConfigs: newBiasConfigs};
    });
  }, [maxEdges, setStandardForm]);

  const onFormSubmit = async (data: FormValues) => {
    if (!isFormValid) {
      alert("Form is invalid. Please ensure agent and bias distributions are fully and correctly assigned.");
      return;
    }

    const bufferSize = calculateBufferSizeLocal();
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    let offset = 0;

    const finalData = { ...formValues, ...data };
    view.setInt8(offset++, 0);
    view.setInt8(offset++, SAVE_MODES_MAP[finalData.saveMode as SaveModeString]);
    view.setInt8(offset++, agentConfigs.length);
    view.setInt8(offset++, biasConfigs.length);
    view.setInt32(offset, finalData.numNetworks, true); offset += 4;
    view.setInt32(offset, finalData.density, true); offset += 4;
    view.setInt32(offset, finalData.iterationLimit, true); offset += 4;
    view.setFloat32(offset, finalData.stopThreshold, true); offset += 4;
    view.setBigInt64(offset, finalData.seed ? BigInt(finalData.seed) : BigInt(-1), true); offset += 8;

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

    biasConfigs.forEach(config => {
      view.setInt32(offset, config.count, true); offset += 4;
      view.setInt8(offset++, biasToByte(config.bias));
    });

    try {
      await fetch('http://localhost:9000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buffer
      });
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  const calculateBufferSizeLocal = () => {
    let bufferSize = 28;
    agentConfigs.forEach(config => {
      bufferSize += 6;
      if (config.type === 'Threshold') bufferSize += 4;
      else if (config.type === 'Confidence') bufferSize += 8;
    });
    bufferSize += biasConfigs.length * 5;
    return bufferSize;
  };

  const totalAssignedAgents = useMemo(() => agentConfigs.reduce((sum, config) => sum + config.count, 0), [agentConfigs]);
  const remainingAgents = useMemo(() => (numAgents || 0) - totalAssignedAgents, [numAgents, totalAssignedAgents]);
  const totalAssignedBiases = useMemo(() => biasConfigs.reduce((sum, config) => sum + config.count, 0), [biasConfigs]);
  const remainingBiases = useMemo(() => maxEdges - totalAssignedBiases, [maxEdges, totalAssignedBiases]);
  const isAgentDistributionValid = remainingAgents === 0 && (numAgents || 0) > 0;
  const isBiasDistributionValid = (remainingBiases === 0 && maxEdges > 0) || maxEdges === 0;
  const isFormValid = !Object.keys(errors).length && isAgentDistributionValid && isBiasDistributionValid;

  return (
    <TooltipProvider>
      <Card className="w-full max-w-3xl mx-auto border-none shadow-none">
        <CardHeader>
          <CardTitle>Run Simulation</CardTitle>
          <CardDescription>Configure the parameters for the simulation run.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="numNetworks">Number of Networks</Label>
                <Input id="numNetworks" type="number" min="1" {...register("numNetworks")} />
                {errors.numNetworks && <p className="text-red-500 text-sm mt-1">{errors.numNetworks.message}</p>}
              </div>
              <div>
                <Label htmlFor="numAgents">Number of Agents (N)</Label>
                <Input id="numAgents" type="number" min="1" {...register("numAgents")} />
                {errors.numAgents && <p className="text-red-500 text-sm mt-1">{errors.numAgents.message}</p>}
              </div>
              <div>
                <Label htmlFor="density">Density</Label>
                 <Tooltip>
                    <TooltipTrigger asChild>
                      <Input id="density" type="number" min="0" max={numAgents ? numAgents -1 : undefined} step="1" {...register("density")} />
                    </TooltipTrigger>
                    <TooltipContent><p>Number of connections. Max edges: {maxEdges}</p></TooltipContent>
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
                <Input id="stopThreshold" type="number" min="0" step="any" {...register("stopThreshold")} />
                 {errors.stopThreshold && <p className="text-red-500 text-sm mt-1">{errors.stopThreshold.message}</p>}
             </div>
            <div>
                <Label htmlFor="saveMode">Save Mode</Label>
                <Controller
                    control={control}
                    name="saveMode"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select save mode" /></SelectTrigger>
                            <SelectContent><SelectGroup><SelectLabel>Save Modes</SelectLabel>
                                {Object.entries(SAVE_MODES_MAP).map(([key, value]) => (
                                    <SelectItem key={value} value={key as string}>{key}</SelectItem>
                                ))}
                            </SelectGroup></SelectContent>
                        </Select>
                    )}
                />
                {errors.saveMode && <p className="text-red-500 text-sm mt-1">{errors.saveMode.message}</p>}
            </div>
             <div>
                <Label htmlFor="seed">Seed (Optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild><Input id="seed" type="text" {...register("seed")} placeholder="Random if not provided"/></TooltipTrigger>
                  <TooltipContent><p>Specific seed for reproducible results.</p></TooltipContent>
                </Tooltip>
                {errors.seed && <p className="text-red-500 text-sm mt-1">{errors.seed.message}</p>}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4">Agent Type Distribution</h3>
              {(numAgents <= 0) ? (<p className="text-muted-foreground text-sm">Enter a positive Number of Agents to configure types.</p>) : (
                <>
                  <div className={`mb-4 p-3 rounded-md ${remainingAgents !== 0 ? 'bg-destructive/10 border-destructive' : 'bg-green-100 dark:bg-green-900/30 border-green-500'}`}>
                    <p className={`font-medium ${remainingAgents !== 0 ? 'text-destructive' : 'text-green-700 dark:text-green-400'}`}>
                      Agents to Assign: {remainingAgents} / {numAgents || 0}
                      {remainingAgents !== 0 && " (Must be exactly 0)"}
                    </p>
                  </div>
                  <div className="space-y-6 w-full">
                    {agentConfigs.map((config) => (
                      <Card key={config.id} className="w-full">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Select value={config.type} onValueChange={(val) => handleAgentTypeChange(config.id, val as AgentStrategyType)}>
                                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                                  <SelectContent><SelectGroup><SelectLabel>Agent Strategy</SelectLabel>{getAvailableTypes(config).map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectGroup></SelectContent>
                                </Select>
                                <Select value={config.effect} onValueChange={(val) => handleEffectChange(config.id, val as AgentEffectType)}>
                                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Effect" /></SelectTrigger>
                                  <SelectContent><SelectGroup><SelectLabel>Silence Effect</SelectLabel>{getAvailableEffects(config.type, config).map(effect => (<SelectItem key={effect} value={effect}>{effect}</SelectItem>))}</SelectGroup></SelectContent>
                                </Select>
                            </div>
                            {agentConfigs.length > 1 && (<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 -mt-2 self-start" onClick={() => handleRemoveAgentConfig(config.id)}>✕</Button>)}
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-[1fr_auto] items-center gap-4 w-full">
                                <Slider min={0} max={numAgents || 0} step={1} value={[config.count]} onValueChange={(v) => handleAgentCountChange(config.id, v[0], "slider")} className="col-start-1 w-full" />
                                <div className="relative w-24 mt-2">
                                  <span className="absolute -top-6 right-0 text-sm text-muted-foreground">{numAgents > 0 ? ((config.count / numAgents) * 100).toFixed(1) : "0.0"}%</span>
                                  <Input type="number" min={0} max={numAgents || 0} value={config.count} onChange={(e) => handleAgentCountChange(config.id, e.target.value, "input")} className="w-full" />
                                </div>
                            </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button onClick={handleAddAgentConfig} variant="outline" className="w-full" disabled={Object.values(usedTypeEffectCombinations).flat().length >= ALL_AGENT_STRATEGY_TYPES.length * ALL_AGENT_EFFECT_TYPES.length}>
                      + Add Agent Type Configuration
                    </Button>
                  </div>
                </>
              )}
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4">Cognitive Bias Distribution (Edges)</h3>
              {(maxEdges <= 0) ? (<p className="text-muted-foreground text-sm">Set Number of Agents (&gt;1) and Density (&gt;0) to configure biases.</p>) : (
                <>
                  <div className={`mb-4 p-3 rounded-md ${remainingBiases !== 0 ? 'bg-destructive/10 border-destructive' : 'bg-green-100 dark:bg-green-900/30 border-green-500'}`}>
                    <p className={`font-medium ${remainingBiases !== 0 ? 'text-destructive' : 'text-green-700 dark:text-green-400'}`}>
                      Edges to Assign a Bias: {remainingBiases} / {maxEdges}
                      {remainingBiases !== 0 && " (Must be exactly 0)"}
                    </p>
                  </div>
                  <div className="space-y-6 w-full">
                    {biasConfigs.map((config) => (
                       <Card key={config.id} className="w-full">
                         <CardHeader className="pb-2 flex flex-row items-center justify-between">
                             <Select value={config.bias} onValueChange={(val) => handleBiasChange(config.id, val as CognitiveBias)}>
                               <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cognitive Bias" /></SelectTrigger>
                               <SelectContent><SelectGroup><SelectLabel>Cognitive Bias</SelectLabel>{getAvailableBiases(config).map(bias => (<SelectItem key={bias} value={bias}>{bias}</SelectItem>))}</SelectGroup></SelectContent>
                             </Select>
                             {biasConfigs.length > 1 && (<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 -mt-2 self-start" onClick={() => handleRemoveBiasConfig(config.id)}>✕</Button>)}
                         </CardHeader>
                         <CardContent>
                            <div className="grid grid-cols-[1fr_auto] items-center gap-4 w-full">
                                <Slider min={0} max={maxEdges} step={1} value={[config.count]} onValueChange={(v) => handleBiasCountChange(config.id, v[0], "slider")} disabled={maxEdges === 0} />
                                <div className="relative w-24 mt-2">
                                  <span className="absolute -top-6 right-0 text-sm text-muted-foreground">{maxEdges > 0 ? ((config.count / maxEdges) * 100).toFixed(1) : "0.0"}%</span>
                                  <Input type="number" min={0} max={maxEdges} value={config.count} onChange={(e) => handleBiasCountChange(config.id, e.target.value, "input")} disabled={maxEdges === 0} />
                                </div>
                            </div>
                         </CardContent>
                       </Card>
                    ))}
                    <Button onClick={handleAddBiasConfig} variant="outline" className="w-full" disabled={usedBiases.length >= ALL_COGNITIVE_BIASES.length || maxEdges === 0}>
                      + Add Cognitive Bias
                    </Button>
                  </div>
                </>
              )}
            </div>
            {(!isFormValid && (numAgents || 0) > 0) && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Configuration Issues</AlertTitle>
                <AlertDescription>
                    Please resolve the following before submitting:
                    <ul className="list-disc list-inside">
                        {!isAgentDistributionValid && <li>Agent type distribution must sum exactly to the total Number of Agents ({numAgents || 0}).</li>}
                        {!isBiasDistributionValid && <li>Biased edge distribution must sum exactly to the calculated Max Edges ({maxEdges}).</li>}
                    </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={!isFormValid}>Run Simulation</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
