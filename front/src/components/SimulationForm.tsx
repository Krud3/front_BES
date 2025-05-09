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

import { AgentType, CognitiveBias, ALL_AGENT_TYPES, ALL_COGNITIVE_BIASES, SimulationConfig } from '@/lib/types'; // Adjust path if needed
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
// We'll handle complex inter-field validation manually for now
const formSchema = z.object({
  numNetworks: z.coerce.number().int().positive("Must be positive"),
  numAgents: z.coerce.number().int().positive("Must be positive"),
  density: z.coerce.number().min(0),
  iterationLimit: z.coerce.number().int().positive("Must be positive"),
  stopThreshold: z.coerce.number().min(0),
  saveMode: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof formSchema>;

export function SimulationForm() {
  const [agentEffects, setAgentEffects] = useState<Record<AgentType, "DeGroot" | "Memory" | "Memoryless">>(
    () =>
      Object.fromEntries(
        ALL_AGENT_TYPES.map(type => [type, "Memory"])
      ) as Record<AgentType, "DeGroot" | "Memory" | "Memoryless">
  );
  // === Basic Parameters State ===
  const { register, handleSubmit, watch, formState: { errors }, setValue: setFormValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numNetworks: 1,
      numAgents: 100, // Default example value
      density: 10, // Default example value
      iterationLimit: 100,
      stopThreshold: 1e-8, // From your example 0.00000001
      saveMode: 'Debug', // From your example
    },
  });

  const ws = useMemo(() => new WebSocket("ws://localhost:8080/ws"), []);
  const numAgents = watch('numAgents');
  const density = watch('density');

  // === Agent Type Distribution State ===
  const [agentCounts, setAgentCounts] = useState<Record<AgentType, number>>(
    () => Object.fromEntries(ALL_AGENT_TYPES.map(type => [type, 0])) as Record<AgentType, number>
  );

  // === Cognitive Bias Distribution State ===
  const [biasCounts, setBiasCounts] = useState<Record<CognitiveBias, number>>(
    () => Object.fromEntries(ALL_COGNITIVE_BIASES.map(bias => [bias, 0])) as Record<CognitiveBias, number>
  );

  // === Derived Values ===
  const totalAssignedAgents = useMemo(() => {
    return Object.values(agentCounts).reduce((sum, count) => sum + count, 0);
  }, [agentCounts]);

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
    return Object.values(biasCounts).reduce((sum, count) => sum + count, 0);
  }, [biasCounts]);

  const remainingBiases = useMemo(() => {
    return maxEdges - totalAssignedBiases;
  }, [maxEdges, totalAssignedBiases]);


  // === Validation Flags ===
  const isAgentDistributionValid = remainingAgents === 0 && (numAgents || 0) > 0;
  const isBiasDistributionValid = remainingBiases >= 0; // Can have fewer biased edges than maxEdges
  const isFormValid = !Object.keys(errors).length && isAgentDistributionValid && isBiasDistributionValid;

  // === Handlers ===

  // --- Agent Type Handlers ---
  const handleAgentChange = useCallback((type: AgentType, value: string | number, source: 'input' | 'slider') => {
    const currentNumAgents = numAgents || 0;
    if (currentNumAgents <= 0) return; // Don't allow changes if total agents is 0 or less

    let newCount = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
    if (isNaN(newCount) || newCount < 0) {
        newCount = 0;
    }

    setAgentCounts(prevCounts => {
        const otherAgentsTotal = totalAssignedAgents - (prevCounts[type] || 0);
        const maxAllowed = currentNumAgents - otherAgentsTotal;
        const clampedCount = Math.max(0, Math.min(newCount, maxAllowed));

        // Only update state if the clamped value is different
        // or if the source was the input (to reflect clamping immediately)
        if (clampedCount !== prevCounts[type] || source === 'input') {
             return { ...prevCounts, [type]: clampedCount };
        }
        return prevCounts; // No change needed
    });
  }, [numAgents, totalAssignedAgents]);


  // --- Cognitive Bias Handlers ---
    const handleBiasChange = useCallback((bias: CognitiveBias, value: string | number, source: 'input' | 'slider') => {
        if (maxEdges <= 0) return; // Don't allow changes if max edges is 0 or less

        let newCount = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
        if (isNaN(newCount) || newCount < 0) {
            newCount = 0;
        }

        setBiasCounts(prevCounts => {
            const otherBiasesTotal = totalAssignedBiases - (prevCounts[bias] || 0);
            const maxAllowed = maxEdges - otherBiasesTotal;
            const clampedCount = Math.max(0, Math.min(newCount, maxAllowed));

             // Only update state if the clamped value is different
             // or if the source was the input (to reflect clamping immediately)
            if(clampedCount !== prevCounts[bias] || source === 'input') {
                return { ...prevCounts, [bias]: clampedCount };
            }
            return prevCounts; // No change needed
        });
    }, [maxEdges, totalAssignedBiases]);


  // --- Form Submission ---
  const onFormSubmit = (data: FormValues) => {
    if (!isFormValid) {
        console.error("Form is invalid. Submission prevented.");
        // Optionally show a user-facing error message
        return;
    }

    const config: SimulationConfig = {
        ...data,
        agentTypeDistribution: agentCounts,
        cognitiveBiasDistribution: biasCounts,
    };

    console.log("Simulation Configuration:", config);
    const payload = {
      numNetworks: data.numNetworks,
      density: data.density,
      iterationLimit: data.iterationLimit,
      stopThreshold: data.stopThreshold,
      saveMode: data.saveMode,
      degreeDistribution: 2.5,
      agentTypeDistribution: ALL_AGENT_TYPES.map(type => ({
        strategy: type,
        effect: agentEffects[type],
        count: agentCounts[type]
      })),
      cognitiveBiasDistribution: ALL_COGNITIVE_BIASES.map(bias => ({
        bias,
        count: biasCounts[bias]
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

                     <div className="space-y-6">
                     {ALL_AGENT_TYPES.map((type) => {
                        const count = agentCounts[type] || 0;
                        const effect = agentEffects[type];

                        return (
                          <div key={type} className="space-y-2">
                            <Label className="flex justify-between">
                              <span>{type}</span>
                              <span className="text-sm text-muted-foreground">
                                {numAgents > 0 ? ((count / numAgents) * 100).toFixed(1) : "0.0"}%
                              </span>
                            </Label>
                            <div className="flex items-center gap-4">
                              {/* Slider e Input para count */}
                              <Slider
                                min={0}
                                max={numAgents || 0}
                                step={1}
                                value={[count]}
                                onValueChange={(v) => handleAgentChange(type, v[0], "slider")}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                min={0}
                                max={numAgents || 0}
                                value={count}
                                onChange={(e) => handleAgentChange(type, e.target.value, "input")}
                                className="w-24"
                              />

                              {/* Tu Select personalizado para el efecto */}
                              <Select
                                value={effect}
                                onValueChange={(val) =>
                                  setAgentEffects(prev => ({ ...prev, [type]: val as any }))
                                }
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="Effect" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Effects</SelectLabel>
                                    <SelectItem value="DeGroot">DeGroot</SelectItem>
                                    <SelectItem value="Memory">Memory</SelectItem>
                                    <SelectItem value="Memoryless">Memoryless</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })}
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

                     <div className="space-y-6">
                        {ALL_COGNITIVE_BIASES.map((bias) => {
                            const count = biasCounts[bias] || 0;
                             const percentage = maxEdges > 0 ? (count / maxEdges * 100).toFixed(1) : '0.0';
                             return (
                                <div key={bias} className="space-y-2">
                                    <Label htmlFor={`bias-${bias}`} className="flex justify-between">
                                        <span>{bias}</span>
                                         <span className='text-sm text-muted-foreground'>{percentage}%</span>
                                     </Label>
                                    <div className="flex items-center gap-4">
                                       <Slider
                                            id={`bias-slider-${bias}`}
                                            min={0}
                                            max={maxEdges}
                                            step={1}
                                            value={[count]}
                                            onValueChange={(value) => handleBiasChange(bias, value[0], 'slider')}
                                            disabled={maxEdges <= 0}
                                             className="flex-1"
                                         />
                                        <Input
                                            id={`bias-${bias}`}
                                            type="number"
                                            min="0"
                                            max={maxEdges} // Technically max is dynamic
                                            value={count}
                                            onChange={(e) => handleBiasChange(bias, e.target.value, 'input')}
                                            disabled={maxEdges <= 0}
                                             className="w-24"
                                         />
                                    </div>
                                </div>
                            );
                        })}
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