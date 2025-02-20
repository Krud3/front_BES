// src/lib/parseSimulationToGraph.ts
import { Node, Links, Simulation } from '@/lib/types';

export interface GraphData {
  nodes: Node[];
  links: Links[];
}

export const parseSimulationToGraph = (simulation: Simulation): GraphData => {
  const nodes: Node[] = [];
  const links: Links[] = [];

  simulation.networks.forEach((network) => {

    network.agents.forEach((agent) => {
      const node: Node = {
        id: `${network.id}-${agent.id}`,
        belief: 0, 
        publicBelief: 0,
        isSpeaking: false,
        beliefsOverTime: [],
        publicBeliefsOverTime: [],
        isSpeakingOverTime: [],
      };
      nodes.push(node);
    });

    // Creation link
    network.neighbors.forEach((neighbor) => {
      const link: Links = {
        source: `${network.id}-${neighbor.source}`, 
        target: `${network.id}-${neighbor.target}`,
        influenceValue: neighbor.value,
        // using run date as date for now
        date: new Date(simulation.run_date),
      };
      links.push(link);
    });
  });

  return { nodes, links };
};
