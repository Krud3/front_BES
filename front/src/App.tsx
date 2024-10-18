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
  const [labelButton, setLabelButton] = useState<string>('id');

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Navbar setNodes={setNodes} setLinks={setLinks} />
        <Routes>
          <Route
            path="/cosmograph"
            element={
              <CosmographProvider nodes={nodes} links={links}>
                <Display labelButton={labelButton} />
              </CosmographProvider>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
