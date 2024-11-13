// types.ts

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
    // Agrega otras propiedades si es necesario
  };
  
  export type Links = {
    source: string;
    target: string;
    influenceValue?: number;
    // Agrega otras propiedades si es necesario
  };
  