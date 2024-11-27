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
    // Agrega otras propiedades si es necesario
  };
  