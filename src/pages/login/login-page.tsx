import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "@/entities/user";
import { AuthLayout, LoginButton } from "@/features/auth/login";
import { Logo } from "@/shared/ui/logo";

export function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) return null;

  if (user) return <Navigate to="/home" replace />;
  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center h-screen">
        <Link to="/" aria-label="Home">
          <Logo className="h-60 w-auto" />
        </Link>
        <p className="mt-10 text-sm font-medium text-gray-700">Login Page</p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900 text-center">
          Welcome to the Belief Evolution Simulator
        </h1>
        <p className="mt-3 text-sm text-gray-700 text-center max-w-md">
          Sign up to access special features.
        </p>
        <div className="mt-10">
          <LoginButton />
        </div>
        <Link to="/home" className="mt-4 text-blue-500 hover:underline">
          Continue without signing in
        </Link>
      </div>
    </AuthLayout>
  );
}
