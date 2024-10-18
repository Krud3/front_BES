// Display.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Cosmograph, CosmographSearch, useCosmograph } from '@cosmograph/react';
import { Node, Links } from '@/lib/types';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';

type DisplayProps = {};

const Display: React.FC<DisplayProps> = () => {
  const cosmographContext = useCosmograph();
  const cosmograph = cosmographContext?.cosmograph;
  const nodes = cosmographContext?.nodes || [];
  const links = cosmographContext?.links || [];

  const [labelButton, setLabelButton] = useState<string>('id');
  const containerRef = useRef<HTMLDivElement>(null);
  const cosmographSearchRef = useRef<any>(null);

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
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cosmographSearchRef.current?.clearInput();
      cosmograph?.fitView(400);
      // Deseleccionar todos los nodos
      cosmograph?.unselectNodes();
      cosmograph?.selectNodes(nodes);
      cosmograph?.setConfig();
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
  }, [handleKeyDown]);

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

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{ outline: 'none', position: 'relative', width: '100%', height: '100%' }}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <Cosmograph
            nodes={nodes}
            links={links}
            disableSimulation={true}
            nodeColor={(node: Node) => node.color || '#b3b3b3'}
            nodeSize={20}
            nodeGreyoutOpacity={0.1}
            hoveredNodeRingColor={'red'}
            focusedNodeRingColor={'white'}
            nodeLabelAccessor={nodeLabelFunction}
            linkWidth={(link: Links) => link.influenceValue || 0.1}
            linkColor={'#666666'}
            spaceSize={1024}
            // Asegúrate de tener una referencia al Cosmograph si es necesario
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
      {nodes && nodes.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <CosmographSearch
            ref={cosmographSearchRef}
            placeholder="Buscar nodos..."
            style={{ minWidth: '200px' }}
            onSelectResult={(node?: Node) => {
              if (node) {
                cosmograph?.selectNode(node);
                cosmograph?.zoomToNode(node);
              }
            }}
          />
          <button
            onClick={() => {
              cosmographSearchRef.current?.clearInput();
              cosmograph?.fitView(400);
              // Deseleccionar todos los nodos
              cosmograph?.unselectNodes();
            }}
            style={{
              marginLeft: '5px',
              padding: '5px',
              cursor: 'pointer',
            }}
          >
            X
          </button>
        </div>
      )}
    </div>
  );
};

export default Display;
