import { useAuthStore, usePermissions } from "@/entities/user";
import { LogoutButton } from "@/features/auth";
import { LanguageSwitcher } from "@/features/language-switch";
import { useTranslation } from "@/shared/i18n";

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const { roles, limits } = usePermissions();
  const { t } = useTranslation();

  return (
    <div className="p-8 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🚀 SiLEnSeSS v2.0.0-alpha.1</h1>
        <LanguageSwitcher />
      </div>
      <div className="mt-6 space-y-2">
        <p>
          <strong>{t("home.name")}:</strong> {user?.name ?? "Guest"}
        </p>
        <p>
          <strong>{t("home.email")}:</strong> {user?.email ?? "-"}
        </p>
        <p>
          <strong>{t("home.roles")}:</strong> {roles.join(", ")}
        </p>
        <p>
          <strong>{t("home.maxAgents")}:</strong> {limits.maxAgents}
        </p>
        <p>
          <strong>{t("home.maxIterations")}:</strong> {limits.maxIterations}
        </p>
        <p>
          <strong>{t("home.densityFactor")}:</strong> {limits.densityFactor}
        </p>
      </div>
      <div className="mt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
