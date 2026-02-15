import { useAuthStore, usePermissions } from "@/entities/user";
import { LogoutButton } from "@/features/auth";

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const { roles, limits } = usePermissions();

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold">🚀 SiLEnSeSS v2.0.0-alpha.1</h1>
      <div className="mt-6 space-y-2">
        <p>
          <strong>Name:</strong> {user?.name ?? "Guest"}
        </p>
        <p>
          <strong>Email:</strong> {user?.email ?? "-"}
        </p>
        <p>
          <strong>Roles:</strong> {roles.join(", ")}
        </p>
        <p>
          <strong>Max Agents:</strong> {limits.maxAgents}
        </p>
        <p>
          <strong>Max Iterations:</strong> {limits.maxIterations}
        </p>
        <p>
          <strong>Density Factor:</strong> {limits.densityFactor}
        </p>
      </div>
      <div className="mt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
