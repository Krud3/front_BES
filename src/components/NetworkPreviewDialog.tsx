import React, { useMemo } from "react";
import { Cosmograph } from "@cosmograph/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { CustomAgent, Neighbor, Node, Links } from "@/lib/types";
import { setNodeColor } from "@/lib/utils"; // Assuming this exists based on Display.tsx

interface NetworkPreviewDialogProps {
  agents: CustomAgent[];
  neighbors: Neighbor[];
  disabled?: boolean;
}

export const NetworkPreviewDialog: React.FC<NetworkPreviewDialogProps> = ({ 
  agents, 
  neighbors,
  disabled = false 
}) => {
  // Transform Form Data into Cosmograph Data
  // Note: We use agent.name as the ID because neighbors store source/target by Name, not UUID.
  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = agents.map((agent) => ({
      id: agent.name, 
      belief: agent.initialBelief,
      color: setNodeColor ? setNodeColor(agent.initialBelief) : "#b3b3b3",
      // Add other props if you want them in the tooltip later
    }));

    const links: Links[] = neighbors.map((neighbor) => ({
      source: neighbor.source,
      target: neighbor.target,
      influenceValue: neighbor.influence,
    }));

    return { nodes, links };
  }, [agents, neighbors]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="lg" disabled={disabled || agents.length === 0}>
          <Eye className="w-4 h-4 mr-2" />
          Preview Network
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[1000px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Network Structure Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 w-full h-full min-h-0 bg-secondary/10 rounded-md border relative overflow-hidden">
          {nodes.length > 0 ? (
             <Cosmograph
             nodes={nodes}
             links={links}
             nodeColor={(n) => n.color || "#b3b3b3"}
             nodeSize={1}
             nodeLabelAccessor={(n) => n.id}
             linkWidth={(l) => (l.influenceValue || 0.5) * 4}
             linkArrows={true}
             curvedLinks={false}
             simulationRepulsion={1.5}
             simulationGravity={0.2} 
             hoveredNodeRingColor={"red"}
             focusedNodeRingColor={"white"}
             disableSimulation={false}
             simulationLinkSpring={0.1}
             simulationFriction={0.1}
             simulationRepulsionFromMouse={0.5}
           />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Add agents to generate a preview
            </div>
          )}
         
          {/* Simple Legend Overlay */}
          <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur p-2 rounded text-xs border">
            <div className="font-semibold mb-1">Stats</div>
            <div>Agents: {nodes.length}</div>
            <div>Connections: {links.length}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};