import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth";
import { HomePage } from "@/pages/home/home-page";
import { LoginPage } from "@/pages/login/login-page";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<LoginPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div>404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
