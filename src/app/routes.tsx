import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Button } from "@/shared/ui/button";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dummy route */}
        <Route index element={<DummyPage />} />

        {/* Redirect para testing */}
        <Route path="/dummy" element={<Navigate to="/" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Dummy
function DummyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 font-sans text-foreground">
      <h1 className="text-3xl font-bold">SiLEnSeSS v2.0.0-alpha.1</h1>
      <p className="text-muted-foreground">Rsbuild + React + TypeScript + FSD</p>

      <div className="flex gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </div>
  );
}

function NotFound() {
  return <div style={{ padding: "2rem" }}>404 - Not Found</div>;
}
