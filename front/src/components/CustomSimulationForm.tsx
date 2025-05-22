import React, {useMemo} from 'react';
import {zodResolver} from "@hookform/resolvers/zod";
import {useFieldArray, useForm} from "react-hook-form";
import * as z from "zod";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {ExclamationTriangleIcon} from "@radix-ui/react-icons";
import {PlusCircle, Trash2} from "lucide-react";

import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";

// Define save mode options
const SAVE_MODES = [
  { value: "0", label: "Full" },
  { value: "1", label: "RoundSampling" },
  { value: "2", label: "Standard" },
  { value: "3", label: "StandardLight" },
  { value: "4", label: "Roundless" },
  { value: "5", label: "AgentlessTyped" },
  { value: "6", label: "Agentless" },
  { value: "7", label: "Performance" },
  { value: "8", label: "Debug" },
];

// Define silence strategy options
const SILENCE_STRATEGIES = [
  { value: "0", label: "DeGroot" },
  { value: "1", label: "Majority" },
  { value: "2", label: "Threshold" },
  { value: "3", label: "Confidence" },
];

// Define silence effect options
const SILENCE_EFFECTS = [
  { value: "0", label: "DeGroot" },
  { value: "1", label: "Memory" },
  { value: "2", label: "Memoryless" },
];

// Define cognitive bias options
const COGNITIVE_BIASES = [
  { value: "0", label: "DeGroot (No bias)" },
  { value: "1", label: "Confirmation" },
  { value: "2", label: "Backfire" },
  { value: "3", label: "Authority" },
  { value: "4", label: "Insular" },
];

// Regular expression to ensure no spaces in names
const noSpacesRegex = /^[^\s]+$/;

// Zod schema for form validation
const customFormSchema = z.object({
  stopThreshold: z.coerce.number()
    .min(0, "Must be non-negative")
    .max(1, "Must be at most 1"),
  iterationLimit: z.coerce.number()
    .int("Must be an integer")
    .nonnegative("Must be non-negative"),
  networkName: z.string()
    .min(1, "Network name is required")
    .max(31, "Name must be 31 characters or less")
    .regex(noSpacesRegex, "Spaces are not allowed in the name"),
  saveMode: z.string().min(1, "Save mode is required"),

  agents: z.array(z.object({
    name: z.string()
      .min(1, "Name is required")
      .max(31, "Name must be 31 characters or less")
      .regex(noSpacesRegex, "Spaces are not allowed in the name"),
    initialBelief: z.coerce.number()
      .min(0, "Must be at least 0")
      .max(1, "Must be at most 1"),
    toleranceRadius: z.coerce.number()
      .min(0, "Must be at least 0")
      .max(1, "Must be at most 1"),
    toleranceOffset: z.coerce.number()
      .min(0, "Must be at least 0")
      .max(1, "Must be at most 1"),
    silenceStrategy: z.string().min(1, "Strategy is required"),
    silenceStrategyThreshold: z.coerce.number()
      .min(0, "Must be at least 0")
      .max(1, "Must be at most 1")
      .optional(),
    silenceStrategyConfidence: z.coerce.number()
      .min(0, "Must be at least 0")
      .max(1, "Must be at most 1")
      .optional(),
    silenceStrategyUpdate: z.coerce.number()
      .int("Must be an integer")
      .positive("Must be positive")
      .optional(),
    silenceEffect: z.string().min(1, "Effect is required"),
  })).min(1, "At least one agent is required"),

  neighbors: z.array(z.object({
    source: z.string().min(1, "Source is required"),
    target: z.string().min(1, "Target is required"),
    influence: z.coerce.number()
      .min(0, "Must be at least 0")
      .max(1, "Must be at most 1"),
    cognitiveBias: z.string().min(1, "Cognitive bias is required"),
  })),
}).refine(data => {
  // Check for duplicate agent names
  const names = data.agents.map(agent => agent.name);
  return new Set(names).size === names.length;
}, {
  message: "Agent names must be unique",
  path: ["agents"],
}).refine(data => {
  // Check for valid neighbor relationships
  const agentNames = new Set(data.agents.map(agent => agent.name));
  return data.neighbors.every(neighbor =>
    agentNames.has(neighbor.source) &&
    agentNames.has(neighbor.target) &&
    neighbor.source !== neighbor.target
  );
}, {
  message: "Neighbors must reference valid and different agents",
  path: ["neighbors"],
}).refine(data => {
  // Check for duplicate neighbor pairs
  const pairs = data.neighbors.map(n => `${n.source}-${n.target}`);
  return new Set(pairs).size === pairs.length;
}, {
  message: "Cannot have duplicate neighbor pairs",
  path: ["neighbors"],
});

type CustomFormValues = z.infer<typeof customFormSchema>;

export function CustomSimulationForm() {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue
  } = useForm<CustomFormValues>({
    resolver: zodResolver(customFormSchema),
    defaultValues: {
      stopThreshold: 0.0001,
      iterationLimit: 100,
      networkName: "",
      saveMode: "8", // Debug
      agents: [
        {
          name: "Agent1",
          initialBelief: 0.5,
          toleranceRadius: 0.1,
          toleranceOffset: 0.0,
          silenceStrategy: "0", // DeGroot
          silenceEffect: "0" // DeGroot
        }
      ],
      neighbors: []
    }
  });

  const { fields: agentFields, append: appendAgent, remove: removeAgent } = useFieldArray({
    control,
    name: "agents"
  });

  const { fields: neighborFields, append: appendNeighbor, remove: removeNeighbor } = useFieldArray({
    control,
    name: "neighbors"
  });

  // Watch the agents array for dropdown options in neighbors
  const agents = watch("agents");
  const agentOptions = useMemo(() =>
    agents.map(agent => ({
      value: agent.name,
      label: agent.name
    })),
    [agents]
  );

  // Watch silence strategy for conditional rendering
  const watchedAgents = watch("agents");

  // WebSocket connection
  const ws = useMemo(() => new WebSocket("ws://localhost:8080/ws"), []);

  const onFormSubmit = (data: CustomFormValues) => {
    console.log("Custom Simulation Configuration:", data);

    // Prepare agents with proper types based on selected strategies
    const formattedAgents = data.agents.map(agent => {
      let silenceStrategyObj;
      switch (agent.silenceStrategy) {
        case "0":
          silenceStrategyObj = { type: "DeGroot" };
          break;
        case "1":
          silenceStrategyObj = { type: "Majority" };
          break;
        case "2":
          silenceStrategyObj = {
            type: "Threshold",
            thresholdValue: agent.silenceStrategyThreshold || 0.5
          };
          break;
        case "3":
          silenceStrategyObj = {
            type: "Confidence",
            confidenceValue: agent.silenceStrategyConfidence || 0.5,
            updateValue: agent.silenceStrategyUpdate || 1
          };
          break;
        default:
          silenceStrategyObj = { type: "DeGroot" };
      }

      return {
        name: agent.name,
        initialBelief: agent.initialBelief,
        toleranceRadius: agent.toleranceRadius,
        toleranceOffset: agent.toleranceOffset,
        silenceStrategy: silenceStrategyObj,
        silenceEffect: parseInt(agent.silenceEffect)
      };
    });

    // Format neighbors
    const formattedNeighbors = data.neighbors.map(neighbor => ({
      source: neighbor.source,
      target: neighbor.target,
      influence: neighbor.influence,
      cognitiveBias: parseInt(neighbor.cognitiveBias)
    }));

    // Final payload
    const payload = {
      stopThreshold: data.stopThreshold,
      iterationLimit: data.iterationLimit,
      networkName: data.networkName,
      saveMode: parseInt(data.saveMode),
      agents: formattedAgents,
      neighbors: formattedNeighbors
    };

    ws.send(JSON.stringify(payload));
    alert("Configuration sent to server via WebSocket");
  };

  // Add a new agent with default values
  const handleAddAgent = () => {
    appendAgent({
      name: `Agent${agentFields.length + 1}`,
      initialBelief: 0.5,
      toleranceRadius: 0.1,
      toleranceOffset: 0,
      silenceStrategy: "0",
      silenceEffect: "0"
    });
  };


  //let selectedAgents = new Map<string, number[]>();
  // Add a new neighbor with default values
  const handleAddNeighbor = () => {
    if (agents.length < 2) {
      alert("You need at least two agents to create a neighbor relationship");
      return;
    }

    // Check if we've reached the maximum number of possible connections
    const maxConnections = agents.length * (agents.length - 1);
    if (neighborFields.length >= maxConnections) {
      alert(`Maximum number of connections (${maxConnections}) reached`);
      return;
    }

    // Find a valid source-target pair that doesn't already exist
    const source = agents[0]?.name || "";
    const target = agents[0]?.name || "";
    //selectedAgents.get(source)

    appendNeighbor({
      source,
      target,
      influence: 0.5,
      cognitiveBias: "0"
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-950">
      <CardHeader className="pb-2">
        <CardTitle>Custom Simulation</CardTitle>
        <CardDescription>Configure a custom simulation with precise agent parameters and network topology.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Header Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">General Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stopThreshold" className="text-sm">Stop Threshold</Label>
                <Input
                  id="stopThreshold"
                  type="number"
                  step="0.00000001"
                  min="0"
                  max="1"
                  className="h-8 text-sm"
                  {...register("stopThreshold")}
                />
                {errors.stopThreshold && (
                  <p className="text-red-500 text-xs mt-1">{errors.stopThreshold.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="iterationLimit" className="text-sm">Iteration Limit</Label>
                <Input
                  id="iterationLimit"
                  type="number"
                  min="0"
                  step="1"
                  className="h-8 text-sm"
                  {...register("iterationLimit")}
                />
                {errors.iterationLimit && (
                  <p className="text-red-500 text-xs mt-1">{errors.iterationLimit.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="networkName" className="text-sm">Network Name (no spaces)</Label>
                <Input
                  id="networkName"
                  className="h-8 text-sm"
                  maxLength={31}
                  {...register("networkName")}
                />
                {errors.networkName && (
                  <p className="text-red-500 text-xs mt-1">{errors.networkName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="saveMode" className="text-sm">Save Mode</Label>
                <Select
                  onValueChange={(value) => setValue("saveMode", value)}
                  defaultValue={watch("saveMode")}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select save mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SAVE_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label} ({mode.value})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.saveMode && (
                  <p className="text-red-500 text-xs mt-1">{errors.saveMode.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Agents Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Agents</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 bg-green-800 hover:bg-green-700 text-white border-green-600"
                onClick={handleAddAgent}
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add Agent
              </Button>
            </div>

            {agentFields.length === 0 ? (
              <Alert className="mb-2 py-2">
                <AlertTitle className="text-sm">No agents defined</AlertTitle>
                <AlertDescription className="text-xs">
                  Add at least one agent to configure the simulation.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {agentFields.map((field, index) => (
                  <Card key={field.id} className="p-3 border bg-gray-900">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">Agent {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-400 hover:bg-red-950"
                        onClick={() => removeAgent(index)}
                        disabled={agentFields.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                      <div className="col-span-1">
                        <Label htmlFor={`agents.${index}.name`} className="text-xs">Name (no spaces)</Label>
                        <Input
                            id={`agents.${index}.name`}
                            maxLength={31}
                            className="h-8 text-sm"
                            {...register(`agents.${index}.name`)}
                        />
                        {errors.agents?.[index]?.name && (
                            <p className="text-red-500 text-xs mt-1">{errors.agents[index]?.name?.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`agents.${index}.initialBelief`} className="text-xs">Initial Belief</Label>
                        <Input
                            id={`agents.${index}.initialBelief`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            className="h-8 text-sm"
                            {...register(`agents.${index}.initialBelief`)}
                        />
                        {errors.agents?.[index]?.initialBelief && (
                            <p className="text-red-500 text-xs mt-1">{errors.agents[index]?.initialBelief?.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`agents.${index}.toleranceRadius`} className="text-xs">Tolerance Radius</Label>
                        <Input
                            id={`agents.${index}.toleranceRadius`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            className="h-8 text-sm"
                            {...register(`agents.${index}.toleranceRadius`)}
                        />
                        {errors.agents?.[index]?.toleranceRadius && (
                            <p className="text-red-500 text-xs mt-1">{errors.agents[index]?.toleranceRadius?.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`agents.${index}.toleranceOffset`} className="text-xs">Tolerance Offset</Label>
                        <Input
                            id={`agents.${index}.toleranceOffset`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            className="h-8 text-sm"
                            {...register(`agents.${index}.toleranceOffset`)}
                        />
                        {errors.agents?.[index]?.toleranceOffset && (
                            <p className="text-red-500 text-xs mt-1">{errors.agents[index]?.toleranceOffset?.message}</p>
                        )}
                      </div>

                      <div className="col-span-1">
                        <Label htmlFor={`agents.${index}.silenceEffect`} className="text-xs">Silence Effect</Label>
                        <Select
                            onValueChange={(value) => setValue(`agents.${index}.silenceEffect`, value)}
                            defaultValue={watchedAgents[index]?.silenceEffect}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select effect"/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {SILENCE_EFFECTS.map((effect) => (
                                  <SelectItem key={effect.value} value={effect.value}>
                                    {effect.label}
                                  </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {errors.agents?.[index]?.silenceEffect && (
                            <p className="text-red-500 text-xs mt-1">{errors.agents[index]?.silenceEffect?.message}</p>
                        )}
                      </div>

                      <div className="col-span-1">
                        <Label htmlFor={`agents.${index}.silenceStrategy`} className="text-xs">Silence Strategy</Label>
                        <Select
                            onValueChange={(value) => setValue(`agents.${index}.silenceStrategy`, value)}
                            defaultValue={watchedAgents[index]?.silenceStrategy}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select strategy"/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {SILENCE_STRATEGIES.map((strategy) => (
                                  <SelectItem key={strategy.value} value={strategy.value}>
                                    {strategy.label}
                                  </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {errors.agents?.[index]?.silenceStrategy && (
                            <p className="text-red-500 text-xs mt-1">{errors.agents[index]?.silenceStrategy?.message}</p>
                        )}
                      </div>

                      {/* Conditional fields based on silence strategy */}
                      {watchedAgents[index]?.silenceStrategy === "2" && (
                          <div className="col-span-1">
                            <Label htmlFor={`agents.${index}.silenceStrategyThreshold`} className="text-xs">Threshold
                              Value</Label>
                            <Input
                                id={`agents.${index}.silenceStrategyThreshold`}
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                defaultValue="0.5"
                                className="h-8 text-sm"
                                {...register(`agents.${index}.silenceStrategyThreshold`)}
                            />
                            {errors.agents?.[index]?.silenceStrategyThreshold && (
                                <p className="text-red-500 text-xs mt-1">{errors.agents[index]?.silenceStrategyThreshold?.message}</p>
                            )}
                          </div>
                      )}

                      {watchedAgents[index]?.silenceStrategy === "3" && (
                          <>
                            <div>
                              <Label htmlFor={`agents.${index}.silenceStrategyConfidence`} className="text-xs">Confidence
                                Value</Label>
                              <Input
                                  id={`agents.${index}.silenceStrategyConfidence`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="1"
                                  defaultValue="0.5"
                                  className="h-8 text-sm"
                                  {...register(`agents.${index}.silenceStrategyConfidence`)}
                              />
                              {errors.agents?.[index]?.silenceStrategyConfidence && (
                                  <p className="text-red-500 text-xs mt-1">{errors.agents[index]?.silenceStrategyConfidence?.message}</p>
                              )}
                            </div>
                            <div className="col-span-1">
                              <Label htmlFor={`agents.${index}.silenceStrategyUpdate`} className="text-xs">Update
                                Value</Label>
                              <Input
                                  id={`agents.${index}.silenceStrategyUpdate`}
                                  type="number"
                                  step="1"
                                  min="1"
                                  defaultValue="1"
                                  className="h-8 text-sm"
                                  {...register(`agents.${index}.silenceStrategyUpdate`)}
                              />
                              {errors.agents?.[index]?.silenceStrategyUpdate && (
                                  <p className="text-red-500 text-xs mt-1">{errors.agents[index]?.silenceStrategyUpdate?.message}</p>
                              )}
                            </div>
                          </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {errors.agents && !Array.isArray(errors.agents) && (
                <Alert variant="destructive" className="mt-2 py-2">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5"/>
                  <AlertTitle className="text-sm">Agent Configuration Error</AlertTitle>
                  <AlertDescription className="text-xs">{errors.agents.message}</AlertDescription>
                </Alert>
            )}
          </div>

          <Separator className="my-2"/>

          {/* Neighbors Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Connections</h3>
              <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 bg-green-800 hover:bg-green-700 text-white border-green-600"
                  onClick={handleAddNeighbor}
                  disabled={agentFields.length < 2}
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1"/>
                Add Connection
              </Button>
            </div>

            {neighborFields.length === 0 ? (
                <Alert className="mb-2 py-2">
                  <AlertTitle className="text-sm">No connections defined</AlertTitle>
                  <AlertDescription className="text-xs">
                    Add connections between agents to define the network topology.
                  </AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-2">
                  {neighborFields.map((field, index) => (
                      <Card key={field.id} className="p-3 border bg-gray-900 relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNeighbor(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-400 hover:bg-red-950 absolute top-2 right-2"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                        </Button>
                        <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                          <div>
                            <Label htmlFor={`neighbors.${index}.source`} className="text-xs">Source Agent</Label>
                            <Select
                                onValueChange={(value) => setValue(`neighbors.${index}.source`, value)}
                                defaultValue={watch(`neighbors.${index}.source`)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select source"/>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {agentOptions.map((agent) => (
                                      <SelectItem key={`source-${agent.value}`} value={agent.value}>
                                        {agent.label}
                                      </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {errors.neighbors?.[index]?.source && (
                                <p className="text-red-500 text-xs mt-1">{errors.neighbors[index]?.source?.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor={`neighbors.${index}.target`} className="text-xs">Target Agent</Label>
                            <Select
                                onValueChange={(value) => setValue(`neighbors.${index}.target`, value)}
                                defaultValue={watch(`neighbors.${index}.target`)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select target"/>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {agentOptions
                                      .filter(agent => agent.value !== watch(`neighbors.${index}.source`))
                                      .map((agent) => (
                                          <SelectItem key={`target-${agent.value}`} value={agent.value}>
                                            {agent.label}
                                          </SelectItem>
                                      ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {errors.neighbors?.[index]?.target && (
                                <p className="text-red-500 text-xs mt-1">{errors.neighbors[index]?.target?.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor={`neighbors.${index}.influence`} className="text-xs">Influence</Label>
                            <Input
                                id={`neighbors.${index}.influence`}
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                className="h-8 text-sm"
                                {...register(`neighbors.${index}.influence`)}
                            />
                            {errors.neighbors?.[index]?.influence && (
                                <p className="text-red-500 text-xs mt-1">{errors.neighbors[index]?.influence?.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor={`neighbors.${index}.cognitiveBias`} className="text-xs">Cognitive
                              Bias</Label>
                            <Select
                                onValueChange={(value) => setValue(`neighbors.${index}.cognitiveBias`, value)}
                                defaultValue={watch(`neighbors.${index}.cognitiveBias`)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select bias"/>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {COGNITIVE_BIASES.map((bias) => (
                                      <SelectItem key={bias.value} value={bias.value}>
                                        {bias.label}
                                      </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {errors.neighbors?.[index]?.cognitiveBias && (
                                <p className="text-red-500 text-xs mt-1">{errors.neighbors[index]?.cognitiveBias?.message}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                  ))}
                </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-blue-700 hover:bg-blue-600">
              Run Custom Simulation
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}