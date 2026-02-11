import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

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
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1> SiLEnSeSS v2.0.0-alpha.1</h1>
      <p>Rsbuild + React + TypeScript + FSD</p>
    </div>
  );
}

function NotFound() {
  return <div style={{ padding: "2rem" }}>404 - Not Found</div>;
}
