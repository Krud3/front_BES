/**
 * Representa un nodo en el grafo.
 */
export type Node = {
    id: string;
    x?: number;
    y?: number;
    color?: string;
    belief?: number;
    publicBelief?: number;
    isSpeaking?: boolean;
  };
  
  /**
   * Representa un enlace entre dos nodos en el grafo.
   */
  export type Link = {
    source: string;
    target: string;
    influenceValue?: number;
  };
  