import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/app/layouts/dashboard";
import { LandingLayout } from "@/app/layouts/landing";
import { ProtectedRoute } from "@/features/auth";
import { BoardPage, HomePage, ProfilePage, ResultsPage, WikiPage } from "@/pages";
import { LoginPage } from "@/pages/login/login-page";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route index element={<LoginPage />} />

        {/* Public landing shell */}
        <Route element={<LandingLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/wiki" element={<WikiPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Route>

        {/* Protected app routes — wrapped in DashboardLayout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/board" element={<BoardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<div>404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
