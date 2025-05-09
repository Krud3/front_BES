// Cosmograph Simulation Types
export type Node = {
  id: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  color?: string;
  belief?: number; // Current belief value (used for visualization)
  publicBelief?: number; // Current public belief value
  isSpeaking?: boolean; // Current speaking state
  beliefsOverTime?: { date: Date; value: number }[]; // Historical beliefs
  publicBeliefsOverTime?: { date: Date; value: number }[]; // Historical public beliefs
  isSpeakingOverTime?: { date: Date; value: boolean }[]; // Historical speaking states
};
  
export type Links = {
  source: string;
  target: string;
  influenceValue?: number;
  date?: Date;
  // Agrega otras propiedades si es necesario
};

// Simulation Form Types
export type AgentType =
  | 'DeGroot'
  | 'Memory'
  | 'Threshold'
  | 'Confidence';

export type CognitiveBias =
  | 'DeGroot'
  | 'Confirmation'
  | 'Backfire'
  | 'Authority'
  | 'Insular';

export const ALL_AGENT_TYPES: AgentType[] = [
  'DeGroot',
  'Memory',
  'Threshold',
  'Confidence',
];

export const ALL_COGNITIVE_BIASES: CognitiveBias[] = [
  'DeGroot',
  'Confirmation',
  'Backfire',
  'Authority',
  'Insular',
];

export interface SimulationConfig {
  numNetworks: number;
  numAgents: number;
  density: number;
  iterationLimit: number;
  stopThreshold: number;
  saveMode: string;
  agentTypeDistribution: Record<AgentType, number>;
  cognitiveBiasDistribution: Record<CognitiveBias, number>; // Represents counts per bias
}
  