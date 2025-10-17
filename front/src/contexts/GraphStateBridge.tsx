import React, { useEffect } from 'react';
import { useSimulationWebSocket } from '@/contexts/WebSocketContext';
import { Node, Links } from '@/lib/types';

interface GraphStateBridgeProps {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
}

/**
 * Este componente actúa como un puente. Escucha el estado del grafo
 * dentro del WebSocketContext y lo "levanta" al estado de nivel superior
 * en App.tsx para que CosmographProvider pueda usarlo.
 */
export const GraphStateBridge: React.FC<GraphStateBridgeProps> = ({ setNodes, setLinks }) => {
  const { nodes, links, isGraphInitialized } = useSimulationWebSocket();

  useEffect(() => {
    // Cuando el contexto nos avisa que el grafo está listo (o se actualiza)...
    if (isGraphInitialized) {
      // ...actualizamos el estado de App.tsx.
      setNodes(nodes);
      setLinks(links);
    }
  }, [nodes, links, isGraphInitialized, setNodes, setLinks]);

  // Este componente no renderiza nada en la UI.
  return null;
};
