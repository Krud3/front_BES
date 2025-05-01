import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from '@/pages/board/Navbar';
import { Node, Links } from '@/lib/types';


type BoardProps = {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Links[]>>;
};

const Board: React.FC<BoardProps> = ({ setNodes, setLinks }) => {

  return (
    
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Navbar setNodes={setNodes} setLinks={setLinks} />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
      </div>
    
  );
};

export default Board;