import React, { useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CosmographProvider } from '@cosmograph/react';
import { Node, Links } from '@/lib/types';
import Board from '@/pages/Board';
import Display from '@/pages/Display';
import Home from '@/pages/landing/Home';
import NotFound from '@/pages/not-found';
import OnConstruction from './pages/on-construction';


const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Links[]>([]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/board"
            element={
              <CosmographProvider nodes={nodes} links={links}>
                <Board setNodes={setNodes} setLinks={setLinks} />
              </CosmographProvider>
            }
          >
            <Route path="cosmograph" element={<Display />} />
          </Route>
          <Route path='*' element={<NotFound/>}/>
          <Route path='/wiki' element={<OnConstruction/>}/>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
