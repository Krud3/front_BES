import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "@/entities/user";
import { AuthLayout, LoginButton } from "@/features/auth/login";
import { LanguageSwitcher } from "@/features/language-switch";
import { useTranslation } from "@/shared/i18n";
import { Logo } from "@/shared/ui/logo";

export function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const { t } = useTranslation();

  if (loading) return null;

  if (user) return <Navigate to="/home" replace />;
  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Link to="/" aria-label="Home">
          <Logo className="h-60 w-auto" />
        </Link>
        <p className="mt-10 text-sm font-medium text-gray-700">{t("auth.loginPage")}</p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900 text-center">
          {t("auth.welcome")}
        </h1>
        <div className="mt-10">
          <LoginButton />
        </div>
        <Link to="/home" className="mt-4 text-blue-500 hover:underline">
          {t("auth.continueWithout")}
        </Link>
      </div>
    </AuthLayout>
  );
}
