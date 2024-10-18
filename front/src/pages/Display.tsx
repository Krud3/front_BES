// Display.tsx

import React from 'react';
import { Cosmograph, useCosmograph } from '@cosmograph/react';
import { Node, Links } from '@/lib/types';

type DisplayProps = {
  labelButton: string;
};

const Display: React.FC<DisplayProps> = ({ labelButton }) => {
  const cosmographContext = useCosmograph();
  const cosmograph = cosmographContext?.cosmograph;
  const nodes = cosmographContext?.nodes || [];
  const links = cosmographContext?.links || [];

  const nodeLabelFunction = (d: Node) => {
    switch (labelButton) {
      case 'belief':
        return d.belief !== undefined ? d.belief.toFixed(2) : '';
      case 'publicBelief':
        return d.publicBelief !== undefined ? d.publicBelief.toFixed(2) : '';
      case 'isSpeaking':
        return d.isSpeaking !== undefined ? d.isSpeaking.toString() : '';
      case 'id':
        return d.id || '';
      default:
        return d.id || '';
    }
  };
  const colors: string[] = ['#88C6FF', '#FF99D2', '#2748A4'];
  return (
    <div>
      <Cosmograph
        nodes={nodes}
        links={links}
        disableSimulation={true}
        nodeColor={() => colors[Math.floor(Math.random() * 3)]}
        nodeSize={20}
        hoveredNodeRingColor={'red'}
        focusedNodeRingColor={'white'}
        nodeLabelAccessor={nodeLabelFunction}
        linkWidth={(link: Links) => link.influenceValue || 0.1}
        linkColor={() => colors[Math.floor(Math.random() * 3)]}
        spaceSize={1024}
      />
    </div>
  );
};

export default Display;
