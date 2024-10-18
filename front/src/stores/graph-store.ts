// store.ts

import {create} from 'zustand';
import Papa from 'papaparse';
import { Node, Link } from '@/lib/types';

type GraphState = {
  nodes: Node[];
  links: Link[];
  setNodes: (nodes: Node[]) => void;
  setLinks: (links: Link[]) => void;
  loadGraphFromCSV: (file: File) => Promise<void>;
};

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  links: [],
  setNodes: (nodes) => set({ nodes }),
  setLinks: (links) => set({ links }),
  loadGraphFromCSV: async (file: File) => {
    const parseCSVToNodes = (csvFile: File): Promise<{ nodes: Node[]; links: Link[] }> => {
      return new Promise((resolve, reject) => {
        Papa.parse(csvFile, {
          header: true,
          complete: function (results) {
            const data = results.data;
            const nodes = new Map<string, Node>();
            const links: Link[] = [];

            data.forEach((row: any) => {
              const agentId = row.agent_id;
              const belief = parseFloat(row.belief);
              const publicBelief = parseFloat(row.public_belief);
              const isSpeaking = row.is_speaking === 'True';

              if (!nodes.has(agentId)) {
                nodes.set(agentId, {
                  id: agentId,
                  color: '#FF0000',
                  belief,
                  publicBelief,
                  isSpeaking,
                  x: Math.random() * 1024,
                  y: Math.random() * 768,
                });
              }

              const source = row.source_id;
              const target = row.target_id;
              const influenceValue = parseFloat(row.influence_value);

              if (source && target) {
                links.push({
                  source,
                  target,
                  influenceValue,
                });
              }
            });

            resolve({ nodes: Array.from(nodes.values()), links });
          },
          error: function (err) {
            reject(err);
          },
        });
      });
    };

    try {
      const graph = await parseCSVToNodes(file);
      set({ nodes: graph.nodes, links: graph.links });
    } catch (error) {
      console.error('Error parsing CSV:', error);
    }
  },
}));
