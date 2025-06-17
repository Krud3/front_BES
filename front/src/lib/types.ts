// lib/types.ts

// Cosmograph Simulation Types (assuming these are still needed)
export type Node = {
  id: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  color?: string;
  belief?: number;
  publicBelief?: number;
  isSpeaking?: boolean;
  beliefsOverTime?: { date: Date; value: number }[];
  publicBeliefsOverTime?: { date: Date; value: number }[];
  isSpeakingOverTime?: { date: Date; value: boolean }[];
};

export type Links = {
  source: string;
  target: string;
  influenceValue?: number;
  date?: Date;
};

// Simulation Form Types
export type AgentStrategyType =
  | 'DeGroot'
  | 'Majority' // Assuming 'Memory' in your types.ts was a typo for strategy and meant Majority based on HTML
  | 'Threshold'
  | 'Confidence';

export type AgentEffectType = "DeGroot" | "Memory" | "Memoryless";

export type CognitiveBias =
  | 'DeGroot'
  | 'Confirmation'
  | 'Backfire'
  | 'Authority'
  | 'Insular';

export type AgentConfig = {
  id: string;
  type: AgentStrategyType; // Changed from AgentType to AgentStrategyType for clarity
  effect: AgentEffectType;
  count: number;
};

export type BiasConfig = {
  id: string;
  bias: CognitiveBias;
  count: number;
};

export const ALL_AGENT_STRATEGY_TYPES: AgentStrategyType[] = [
  'DeGroot',
  'Majority',
  'Threshold',
  'Confidence',
];

export const ALL_AGENT_EFFECT_TYPES: AgentEffectType[] = [
  "DeGroot",
  "Memory",
  "Memoryless",
];

export const ALL_COGNITIVE_BIASES: CognitiveBias[] = [
  'DeGroot',
  'Confirmation',
  'Backfire',
  'Authority',
  'Insular',
];

// Save Modes based on your constants and backend expectations
export const SAVE_MODES_MAP = {
  "Full": 0,
  "Standard": 1,
  "Standard Light": 2, // Assuming 2 and 3 map to the same string for UI
  // "Standard Light Duplicate": 3, // Or handle differently if needed
  "Roundless": 4,
  "Agentless Typed": 5, // Assuming 5 and 6 map to the same string for UI
  // "Agentless Typed Duplicate": 6,
  "Agentless": 7,
  "Performance": 8,
  "Debug": 9
} as const; // Use "as const" for stricter typing of keys and values

export type SaveModeString = keyof typeof SAVE_MODES_MAP;
export type SaveModeValue = typeof SAVE_MODES_MAP[SaveModeString];

export interface SimulationConfig {
  seed?: bigint;
  numNetworks: number;
  numAgents: number;
  density: number;
  iterationLimit: number;
  stopThreshold: number;
  saveMode: SaveModeString; // Use the string representation for the form
  degreeDistribution?: number; // Added as it's in the binary payload
  agentConfigs: AgentConfig[]; // Changed from agentTypeDistribution
  biasConfigs: BiasConfig[]; // Changed from cognitiveBiasDistribution
}

export interface CustomAgent {
  id: string;
  name: string;
  initialBelief: number;
  toleranceRadius: number;
  toleranceOffset: number;
  silenceStrategy: number;
  thresholdValue?: number;
  confidenceValue?: number;
  updateValue?: number;
  silenceEffect: number;
}

export interface Neighbor {
  id: string;
  source: string;
  target: string;
  influence: number;
  bias: number;
}