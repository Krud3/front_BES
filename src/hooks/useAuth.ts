import { useAuthStore } from "../lib/authStore";

export const useAuth = () => {
  const authState = useAuthStore();
  return {
    user: authState.user,
    loading: authState.loading,
  };
};
