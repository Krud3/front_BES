import { useAuthStore } from "../lib/authStore";

export const useAuth = () => {
  const authState = useAuthStore() as { user: any; loading: boolean };
  return {
    user: authState.user,
    loading: authState.loading,
  };
};
