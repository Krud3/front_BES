// Display.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Cosmograph, CosmographSearch, useCosmograph, CosmographTimeline, CosmographTimelineRef, CosmographHistogram } from '@cosmograph/react';
import { Node, Links } from '@/lib/types';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';

interface DisplayProps {
}

const setColor = (value: boolean) => {
  if (value) {
    return '#88C6FF';
  } else {
    return '#FFD700';
  }
}

const Display: React.FC<DisplayProps> = () => {
  const timelineRef = useRef<CosmographTimelineRef<any>>(null);

  const { cosmograph, nodes, links } = useCosmograph() || {};

  const updateBeliefsBasedOnTimeline = () => {
    const timeline = timelineRef.current;
    if (!timeline || !cosmograph || !nodes ) return;

    const selection = timeline.getCurrentSelection() as [Date, Date] | undefined;
    if (selection) {
      const [startDate, endDate] = selection;

      const updatedNodes = nodes.map((node) => {
        const customNode = node as Node;

        const beliefEntry = customNode.beliefsOverTime?.find(
          (entry) => entry.date >= startDate && entry.date <= endDate
        );
        const publicBeliefEntry = customNode.publicBeliefsOverTime?.find(
          (entry) => entry.date >= startDate && entry.date <= endDate
        );
        const isSpeakingEntry = customNode.isSpeakingOverTime?.find(
          (entry) => entry.date >= startDate && entry.date <= endDate
        );

        console.log('beliefEntry', beliefEntry);

        return {
          ...customNode,
          belief: beliefEntry ? beliefEntry.value : customNode.belief,
          publicBelief: publicBeliefEntry ? publicBeliefEntry.value : customNode.publicBelief,
          isSpeaking: isSpeakingEntry ? isSpeakingEntry.value : customNode.isSpeaking,
          color: isSpeakingEntry ? setColor(isSpeakingEntry.value) : customNode.color,
        };
      });

      // Use setData to update nodes
      cosmograph.setData(updatedNodes, links || [], true );
    } else {
      // Reset nodes to original state if no selection is made
      cosmograph.setData(nodes || [], links || [], true );
    }

    timeline.setSelection(selection);
  };

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
      cosmograph?.selectNodes(nodes || []);
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
        <CosmographTimeline
            ref={timelineRef}
            accessor={(l: Links) => l.date || new Date("2000-01-01T00:00:00Z")}
            animationSpeed={100}
            showAnimationControls
            onAnimationPlay={() => console.log('Animation started')}
            // onAnimationPause={() => {
            //   const timeline = timelineRef.current;
            //   if (!timeline) return;
            //   if (timeline.getIsAnimationRunning()) {
            //     timeline.stopAnimation();
            //   } 
            //   updateBeliefsBasedOnTimeline();
            // }}
          />
        <CosmographHistogram 
          accessor={(d: Node) => d.belief || 0}
          allowSelection
          barCount={6}
        />  
          <Cosmograph
            nodes={nodes}
            links={links}
            curvedLinks={true}
            disableSimulation={false}
            nodeColor={(node: Node) => node.color || '#b3b3b3'}
            nodeSize={2}
            nodeGreyoutOpacity={0.1}
            hoveredNodeRingColor={'red'}
            focusedNodeRingColor={'white'}
            nodeLabelAccessor={nodeLabelFunction}
            linkWidth={(link: Links) => link.influenceValue || 0.1}
            linkColor={'#666666'}
            spaceSize={8096}
            simulationRepulsion={1.0}
            simulationFriction={0.1} 
            simulationLinkSpring={1} 
            simulationLinkDistance={1.0}
            simulationGravity={0.1}
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
          <button
            onClick={() => {
              const timeline = timelineRef.current;
              if (!timeline) return;
              if (timeline.getIsAnimationRunning()) {
                timeline.stopAnimation();
              } 
              updateBeliefsBasedOnTimeline();
              // timeline.setConfig();
            }}
            style={{
              marginLeft: '5px',
              padding: '5px',
              cursor: 'pointer',
            }}
          >
            Actualizar
          </button>
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
