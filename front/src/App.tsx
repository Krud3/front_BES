import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CosmographProvider } from '@cosmograph/react';
import { Node, Links } from '@/lib/types';
import Board from '@/pages/board/Board';
import SimulationPage from '@/pages/board/SimulationPage';
import Display from '@/pages/Display';
import Home from '@/pages/landing/Home';
import NotFound from '@/pages/not-found';
import OnConstruction from '@/pages/on-construction';
import { useTheme } from '@/components/theme-provider';
import AdminPage from '@/pages/admin/AdminPage';
import { ReactNode } from 'react';
import TableData from '@/components/TableData';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import LoginPage from '@/pages/landing/LoginPage';
import CustomSimulationPage from "@/pages/board/CustomSimulationPage.tsx";
import { SimulationWebSocketProvider } from '@/contexts/WebSocketContext';
import { SimulationChart } from '@/components/SimulationChart';
import { SimulationDashboard } from './components/SimulationDashboard';
import { SimulationStateProvider } from '@/hooks/useSimulationState';

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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
      return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
      // Redirect to login page if not logged in
      return <Navigate to="/" replace />; // Redirect to the root path (LoginPage)
  }

  return <>{children}</>; // Render children (the route content) if logged in
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Links[]>([]);
  const { user } = useAuth();

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <ThemeManager>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
            {/* <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} /> */}
            <Route path="/home" element={<Home />} />
            <Route
              path="/board"
              element={
                <ProtectedRoute>
                  <CosmographProvider nodes={nodes} links={links}>
                    <SimulationWebSocketProvider>
                      <SimulationStateProvider>
                        <Board setNodes={setNodes} setLinks={setLinks} />
                      </SimulationStateProvider>
                    </SimulationWebSocketProvider>
                  </CosmographProvider>
                </ProtectedRoute>
              }
            >
              <Route path="custom-simulation" element={<ProtectedRoute><CustomSimulationPage /></ProtectedRoute>} />
              <Route path="simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
              <Route path="cosmograph" element={<ProtectedRoute><Display /></ProtectedRoute>} />
              <Route path="table-data" element={<ProtectedRoute><TableData /></ProtectedRoute>} />
              <Route path="test-grafica" element={<ProtectedRoute><SimulationChart /></ProtectedRoute>} />
              <Route path="test-panel" element={<ProtectedRoute><SimulationDashboard /></ProtectedRoute>} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            <Route path="/wiki" element={<OnConstruction />} />
          </Routes>
        </ThemeManager>
      </Router>
    </ThemeProvider>
  );
};

export default App;
