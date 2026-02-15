import { useAuthStore } from "@/entities/user";

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  return { logout };
}
