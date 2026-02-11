import { CosmographProvider } from "@cosmograph/react";
import React, { useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { SimulationChart } from "@/components/SimulationChart";
import TableData from "@/components/TableData";
import { ThemeProvider } from "@/components/theme-provider";
import { SimulationWebSocketProvider } from "@/contexts/WebSocketContext";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { SimulationStateProvider } from "@/hooks/useSimulationState";
import { Links, Node } from "@/lib/types";
import AccessDeniedPage from "@/pages/AccessDeniedPage";
import AdminPage from "@/pages/admin/AdminPage";
import Board from "@/pages/board/Board";
import CustomSimulationPage from "@/pages/board/CustomSimulationPage.tsx";
import SimulationPage from "@/pages/board/SimulationPage";
import Display from "@/pages/Display";
import Home from "@/pages/landing/Home";
import LoginPage from "@/pages/landing/LoginPage";
import NotFound from "@/pages/not-found";
import { SimulationDashboard } from "./components/SimulationDashboard";
import Wiki from "@/pages/Wiki";

// Remove the ThemeManager component entirely - it's causing the issue

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredPermission?: string;
}> = ({ children, requiredPermission }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loadingPermissions } = usePermissions();

  const loading = authLoading || loadingPermissions;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Links[]>([]);
  const { user } = useAuth();

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/home" replace /> : <LoginPage />}
          />
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
            <Route
              path="custom-simulation"
              element={
                <ProtectedRoute>
                  <CustomSimulationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="simulation"
              element={
                <ProtectedRoute>
                  <SimulationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="cosmograph"
              element={
                <ProtectedRoute>
                  <Display />
                </ProtectedRoute>
              }
            />
            <Route
              path="table-data"
              element={
                <ProtectedRoute>
                  <TableData />
                </ProtectedRoute>
              }
            />
            <Route
              path="test-grafica"
              element={
                <ProtectedRoute>
                  <SimulationChart />
                </ProtectedRoute>
              }
            />
            <Route
              path="test-panel"
              element={
                <ProtectedRoute>
                  <SimulationDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredPermission="manageUsers">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
          <Route path="/wiki" element={<Wiki />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;