import { useAuthStore } from "@/entities/user";

export function useLogin() {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  return { login, loading };
}
