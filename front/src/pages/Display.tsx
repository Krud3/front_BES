// Display.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Cosmograph, CosmographSearch, useCosmograph, CosmographTimeline, CosmographTimelineRef, CosmographHistogram } from '@cosmograph/react';
import { Node, Links } from '@/lib/types';
import { setNodeColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';

interface DisplayProps {
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

        return {
          ...customNode,
          belief: beliefEntry ? beliefEntry.value : customNode.belief,
          publicBelief: publicBeliefEntry ? publicBeliefEntry.value : customNode.publicBelief,
          isSpeaking: isSpeakingEntry ? isSpeakingEntry.value : customNode.isSpeaking,
          color: beliefEntry ? setNodeColor(beliefEntry.value) : customNode.color,
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

  const colors = ['#385357', '#4B7076', '#5E8B92', '#70A6AE', '#82C1CB'];

  const [polarization, setPolarization] = useState<number | null>(null);

  const handleCalculatePolarization = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/process_nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodes),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setPolarization(result.polarization);
    } catch (error) {
      console.error('Failed to fetch:', error);
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
          <div className="relative w-full h-full">
            <Cosmograph
              curvedLinks={false}
              disableSimulation={false}
              nodeColor={(node: Node) => node.color || '#b3b3b3'}
              nodeSize={2}
              nodeGreyoutOpacity={0.1}
              hoveredNodeRingColor={'red'}
              focusedNodeRingColor={'white'}
              nodeLabelAccessor={nodeLabelFunction}
              linkWidth={(link: Links) => (link.influenceValue || 0.1)*2}
              linkColor={(link: Links) => colors[Math.floor((link.influenceValue || 0.1) * colors.length)]}
              spaceSize={8096}
              simulationRepulsion={4.0}
              simulationFriction={0.1} 
              simulationLinkSpring={1} 
              simulationLinkDistance={2.0}
              simulationGravity={0.1}
              className="z-10 w-full h-full"
            />
            {nodes && nodes.length> 0 && 
              <div className=" flex-column absolute bottom-0 left-0 z-20 w-full px-1 py-1 space-y-1">
                <CosmographHistogram 
                  accessor={(d: Node) => d.belief || 0}
                  allowSelection
                  barCount={6}
                  className='histogram w-1/4 backdrop-blur ml-auto rounded-lg py-1'
                  style={{
                    '--cosmograph-histogram-bar-color': `var(--cosmograph-histogram-bar-color-3)`,
                  }}
                />
                <CosmographTimeline
                    ref={timelineRef}
                    accessor={(l: Links) => l.date || new Date("2000-01-01T00:00:00Z")}
                    animationSpeed={100}
                    showAnimationControls
                    onAnimationPlay={() => console.log('Animation started')}
                    className='timeline w-full backdrop-blur rounded-lg py-1 items-center space-x-1'
                    style={{
                      '--cosmograph-timeline-bar-color': `var(--cosmograph-timeline-bar-color-0)`,
                    }}
                  />
              </div>
            }
            {nodes && nodes.length > 0 && 
              <div className='flex absolute text-md font-medium top-0 right-0 z-20 w-auto py-1 px-2 space-x-2 justify-end backdrop-blur rounded-lg items-center'>
                <Button
                  variant="outline"
                  onClick={() => {
                    const timeline = timelineRef.current;
                    if (!timeline) return;
                    if (timeline.getIsAnimationRunning()) {
                      timeline.stopAnimation();
                    } 
                    updateBeliefsBasedOnTimeline();
                    // timeline.setConfig();
                  }}
                  className="ml-1 px-2 py-1 bg-transparent transition-colors rounded hover:bg-cyan-500 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 cursor-pointer"
                >
                  Actualizar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCalculatePolarization}
                  className="ml-1 px-2 py-1 bg-transparent transition-colors text-white rounded hover:bg-green-500 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 cursor-pointer"
                >
                  Calcular Polarización
                </Button>
                {polarization !== null && (
                  <div className="ml-2 px-2 py-1 bg-transparent text-white" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    Polarización: {polarization.toFixed(6)}
                  </div>
                )}
                <CosmographSearch
                  ref={cosmographSearchRef}
                  placeholder="Buscar nodos..."
                  // style={{ margin: '0 0rem' }}
                  // className="w-48 h-12"
                  onSelectResult={(node?: Node) => {
                    if (node) {
                      cosmograph?.selectNode(node);
                      cosmograph?.zoomToNode(node);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    cosmographSearchRef.current?.clearInput();
                    cosmograph?.fitView(400);
                    // Deseleccionar todos los nodos
                    cosmograph?.unselectNodes();
                  }}
                  className="ml-1 px-2 py-1 bg-transparent transition-colors text-white rounded hover:bg-red-600 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 cursor-pointer"
                >
                  X
                </Button>
              </div>
            }
          </div>
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
