import React from "react";
import { Outlet } from "react-router-dom";
import { UnifiedDashboard } from "@/components/UnifiedDashboard";
import { Links, Node } from "@/lib/types";
import Navbar from "@/pages/board/Navbar";

type BoardProps = {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
};

const Board: React.FC<BoardProps> = ({ setNodes, setLinks }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar setNodes={setNodes} setLinks={setLinks} />
      <div style={{ flex: 1, overflow: "auto" }}>
        <Outlet />
        <UnifiedDashboard />
      </div>
    </div>
  );
};

export default Board;
