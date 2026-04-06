import { BrowserRouter, Route, Routes } from "react-router-dom";
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

        {/* Protected app routes */}
        <Route
          path="/board"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<div>404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
