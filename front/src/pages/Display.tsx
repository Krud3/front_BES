// Display.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Cosmograph, useCosmograph } from '@cosmograph/react';
import { Node, Links } from '@/lib/types';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';

type DisplayProps = {
};

const Display: React.FC<DisplayProps> = () => {
  const cosmographContext = useCosmograph();
  const cosmograph = cosmographContext?.cosmograph;
  const nodes = cosmographContext?.nodes || [];
  const links = cosmographContext?.links || [];
  
  const [labelButton, setLabelButton] = useState<string>('id');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey) {
      switch (event.key) {
        case '1':
          setLabelButton('belief');
          event.preventDefault();
          break;
        case '2':
          setLabelButton('publicBelief');
          event.preventDefault();
          break;
        case '3':
          setLabelButton('isSpeaking');
          event.preventDefault();
          break;
        case '4':
          setLabelButton('id');
          event.preventDefault();
          break;
        default:
          break;
      }
    }
  };
  
  useEffect(() => {
    const currentRef = containerRef.current;
    if (currentRef) {
      currentRef.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

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
    <div ref={containerRef} tabIndex={0} style={{ outline: 'none' }}>
      <ContextMenu>
        <ContextMenuTrigger>
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
        </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => setLabelButton('belief')}>
              Mostrar Belief
              <ContextMenuShortcut>Ctrl+1</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setLabelButton('publicBelief')}>
              Mostrar Public Belief
              <ContextMenuShortcut>Ctrl+2</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setLabelButton('isSpeaking')}>
              Mostrar Is Speaking
              <ContextMenuShortcut>Ctrl+3</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setLabelButton('id')}>
              Mostrar ID
              <ContextMenuShortcut>Ctrl+4</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default Display;
