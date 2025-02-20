// types.ts

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
  };


export interface Agent {
  id: number;
  number_of_networks: number;
  tolerance_radius: number;
  tolerance_offset: number;
  silence_strategy: number;
  silence_effect: number;
  expression_threshold: number;
  open_mindedness: number;
  name: string;
}

export interface Neighbor {
  source: number;
  target: number;
  value: number;
  cognitive_bias: number;
}

export interface Network {
  id: string;
  run_time: number;
  build_time: number;
  number_of_agents: number;
  final_round: number;
  name: string;
  outcome: boolean;
  agents: Agent[];
  neighbors: Neighbor[];
}

export interface Simulation {
  id: number;
  run_time: number;
  build_time: number;
  run_date: number;
  number_of_networks: number;
  iteration_limit: number;
  stop_threshold: number;
  initial_distribution: number;
  run_mode: number;
  save_mode: number;
  networks: Network[];
}
