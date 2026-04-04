import { useAuthStore, usePermissions } from "@/entities/user";
import { DeactivateButton, EditNameForm } from "@/features/profile";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { roles, limits } = usePermissions();

  return (
    <div className="mx-auto max-w-lg space-y-8 p-8">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <section className="space-y-1">
        <h2 className="text-sm font-medium text-muted-foreground">Account info</h2>
        <p className="text-sm">
          <span className="font-medium">Email:</span> {user?.email}
        </p>
        <p className="text-sm">
          <span className="font-medium">Role:</span> {roles.join(", ")}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Usage limits</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span>Max agents</span>
          <span>{limits.maxAgents === Infinity ? "Unlimited" : limits.maxAgents}</span>
          <span>Max iterations</span>
          <span>{limits.maxIterations === Infinity ? "Unlimited" : limits.maxIterations}</span>
          <span>Density factor</span>
          <span>{limits.densityFactor}</span>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Edit display name</h2>
        <EditNameForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Danger zone</h2>
        <DeactivateButton />
      </section>
    </div>
  );
}
