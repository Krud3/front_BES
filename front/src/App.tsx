// App.tsx

import React, { useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/pages/Navbar';
import Display from '@/pages/Display';
import { CosmographProvider } from '@cosmograph/react';
import { Node, Links } from '@/lib/types';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Links[]>([]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <CosmographProvider nodes={nodes} links={links}>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Navbar setNodes={setNodes} setLinks={setLinks} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Routes>
                <Route
                  path="/cosmograph"
                  element={
                    
                      <Display />
                    
                  }
                />
              </Routes>
            </div>
          </div>
        </Router>
      </CosmographProvider>
    </ThemeProvider>
  );
};

export default App;
