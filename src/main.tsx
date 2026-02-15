import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRoutes } from "@/app/routes";
import { Toaster } from "@/shared/ui/sonner";
import { useAuthStore } from "./entities/user";
import "./shared/styles/globals.css";

useAuthStore.getState().observeAuthState();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppRoutes />
    <Toaster />
  </StrictMode>,
);
