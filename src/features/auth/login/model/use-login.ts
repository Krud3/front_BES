import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { useAuthStore } from "@/entities/user";
import { auth } from "@/shared/api/firebase";
import { useTranslation } from "@/shared/i18n";
import { logger } from "@/shared/lib/logger";

const provider = new GoogleAuthProvider();

export function useLogin() {
  const { t } = useTranslation();
  const loading = useAuthStore((state) => state.loading);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      logger.error("useLogin", error);
      toast.error(t("auth.errorLogin"));
    }
  };

  return { login, loading };
}
