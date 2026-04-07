import { Outlet } from "react-router-dom";
import { DashboardHeader } from "./dashboard-header";

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
