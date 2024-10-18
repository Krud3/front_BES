// Display.tsx

import React, { useCallback } from 'react';
import { Cosmograph } from '@cosmograph/react';
import { useGraphStore } from '@/stores/graph-store';

type Node = {
  id: string;
  x?: number;
  y?: number;
  color?: string;
  belief?: number;
  publicBelief?: number;
  isSpeaking?: boolean;
};

type LinkType = {
  source: string;
  target: string;
  influenceValue?: number;
};

type DisplayProps = {
  labelButton: string;
};

const Display: React.FC<DisplayProps> = ({ labelButton }) => {
  const nodes = useGraphStore((state) => state.nodes);
  const links = useGraphStore((state) => state.links);
  const cosmographRef = useCallback((ref: any) => {
    ref?.focusNode({ id: 'Node1' });
  }, []);

  const colors: string[] = ['#88C6FF', '#FF99D2', '#2748A4'];

  const nodeLabelFunction = (d: Node) => {
    switch (labelButton) {
      case 'belief':
        return d.belief?.toFixed(2) || '';
      case 'publicBelief':
        return d.publicBelief?.toFixed(2) || '';
      case 'isSpeaking':
        return d.isSpeaking?.toString() || '';
      case 'id':
        return d.id || '';
      default:
        return d.id || '';
    }
  };

  return (
    <div>
      <Cosmograph
        disableSimulation={true}
        ref={cosmographRef}
        nodes={nodes}
        links={links}
        nodeColor={() => colors[Math.floor(Math.random() * 3)]}
        nodeSize={20}
        hoveredNodeRingColor={'red'}
        focusedNodeRingColor={'white'}
        nodeLabelAccessor={nodeLabelFunction}
        linkWidth={(l: LinkType) => l.influenceValue || 0.1}
        linkColor={() => colors[Math.floor(Math.random() * 3)]}
        spaceSize={1024}
      />
    </div>
  );
};

export default Display;
