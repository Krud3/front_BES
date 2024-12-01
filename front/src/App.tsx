import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CosmographProvider } from '@cosmograph/react';
import { Node, Links } from '@/lib/types';
import Board from '@/pages/board/Board';
import Display from '@/pages/board/Display';
import Home from '@/pages/landing/Home';
import NotFound from '@/pages/not-found';
import OnConstruction from './pages/on-construction';
import { useTheme } from '@/components/theme-provider';

import { ReactNode } from 'react';
import TableData from '@/components/TableData';

interface ThemeManagerProps {
  children: ReactNode;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ children }) => {
  const location = useLocation();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (location.pathname.startsWith('/board')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [location.pathname, setTheme]);

  return <>{children}</>;
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Links[]>([]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <ThemeManager>
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
              <Route path ="table-data" element={<TableData/>}/>
            </Route>
            <Route path="*" element={<NotFound />} />
            <Route path="/wiki" element={<OnConstruction />} />
          </Routes>
        </ThemeManager>
      </Router>
    </ThemeProvider>
  );
};

export default App;
