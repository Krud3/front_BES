import { CosmographProvider } from "@cosmograph/react";
import React, { ReactNode, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import { SimulationChart } from "@/components/SimulationChart";
import TableData from "@/components/TableData";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
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
import OnConstruction from "@/pages/on-construction";
import { SimulationDashboard } from "./components/SimulationDashboard";

interface ThemeManagerProps {
  children: ReactNode;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ children }) => {
  const location = useLocation();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (location.pathname.startsWith("/board")) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, [location.pathname, setTheme]);

  return <>{children}</>;
};

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredPermission?: string;
}> = ({ children, requiredPermission }) => {
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
    return <AccessDeniedPage />; // Or a custom <AccessDenied /> page
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
            <Route
              path="/"
              element={user ? <Navigate to="/home" replace /> : <LoginPage />}
            />
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
              {/* <Route path="dashboard" element={<ProtectedRoute><UnifiedDashboard /></ProtectedRoute>} /> */}
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
            <Route path="/wiki" element={<OnConstruction />} />
          </Routes>
        </ThemeManager>
      </Router>
    </ThemeProvider>
  );
};

export default App;
