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
import { usePermissions } from '@/hooks/usePermissions';
import { Navigate } from 'react-router-dom';
import LoginPage from '@/pages/landing/LoginPage';
import CustomSimulationPage from "@/pages/board/CustomSimulationPage.tsx";
import AccessDeniedPage from '@/pages/AccessDeniedPage';
import { SimulationWebSocketProvider } from '@/contexts/WebSocketContext';
import { SimulationChart } from '@/components/SimulationChart';
import { SimulationDashboard } from './components/SimulationDashboard';
import { SimulationStateProvider } from '@/hooks/useSimulationState';
import { UnifiedDashboard } from './components/UnifiedDashboard';


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

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredPermission?: string }> = ({ children, requiredPermission }) => {
  const { user, loading: authLoading } = useAuth();
  // 2. Get permission checking logic
  const { hasPermission, loadingPermissions } = usePermissions();

  const loading = authLoading || loadingPermissions;

  if (loading) {
      return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
      // User not logged in, redirect to login
      return <Navigate to="/" replace />;
  }
  
  // 3. If a permission is required, check it
  if (requiredPermission && !hasPermission(requiredPermission)) {
      // User is logged in but doesn't have the right permission
      // You can redirect to a dedicated "Access Denied" page or home
      return <AccessDeniedPage /> // Or a custom <AccessDenied /> page
  }

  return <>{children}</>; // Render children if all checks pass
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
              <Route path="dashboard" element={<ProtectedRoute><UnifiedDashboard /></ProtectedRoute>} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute requiredPermission="manageUsers"><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            <Route path="/wiki" element={<OnConstruction />} />
          </Routes>
        </ThemeManager>
      </Router>
    </ThemeProvider>
  );
};

export default App;
