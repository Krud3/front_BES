import { Cosmograph } from '@cosmograph/react';
import { useCallback, useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';

// Define the types
type Node = {
  id: string;
  x?: number;
  y?: number;
  color?: string;
  belief?: number;
  publicBelief?: number;
  isSpeaking?: boolean;
};

type Link = {
  source: string;
  target: string;
  influenceValue?: number;
};

// Function to parse CSV and generate nodes and links
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

          // Create node if it doesn't exist
          if (!nodes.has(agentId)) {
            nodes.set(agentId, {
              id: agentId,
              color: '#FF0000', // You can customize the color as needed
              belief,
              x: Math.random() * 1024, // Random x position
              y: Math.random() * 768, // Random y position
            });
          }

          // Create edge between source and target
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

const Display = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const cosmographRef = useCallback((ref: any) => {
    ref?.focusNode({ id: 'Node1' });
  }, []);

  // Event handler for uploading CSV file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseCSVToNodes(file).then((graph) => {
        setNodes(graph.nodes);
        setLinks(graph.links);
      });
    }
  };

  const colors:string[] = ['#88C6FF', '#FF99D2', '#2748A4'];

  const [lable, setLable] = useState<string>('');

  const handleButtonClick = () => {
    setLable('Hello World');
  }


  const funct = (d:Node) => {
    if(lable === 'Hello World') {
        return d.belief?.toFixed(2) || '';
    } else {
        return d.id || '';
    }
  }   

  return (
    <div>
        <Button onClick={handleButtonClick}>Click me</Button>
      <Cosmograph
        ref={cosmographRef}
        nodes={nodes}
        links={links}
        // nodeColor={(d: Node) => d.color || '#b3b3b3'}
        nodeColor={() => colors[Math.floor(Math.random() * 3)]}
        nodeSize={20}
        hoveredNodeRingColor={'red'}
        focusedNodeRingColor={'white'}
        // nodeLabelAccessor={(d: Node) => d.belief?.toFixed(2) || ''}
        nodeLabelAccessor={funct}
        // linkWidth={() => 1 + 2 * Math.random()}
        linkWidth={(l:Link) => l.influenceValue || 0.1}
        linkColor={() => ['#88C6FF', '#FF99D2', '#2748A4'][Math.floor(Math.random() * 3)]}
        spaceSize={1024}
      />
      <input type="file" onChange={handleFileUpload} accept=".csv" />
    </div>
  );
};

export default Display;
