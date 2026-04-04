import { useState } from "react";
import { toast } from "sonner";
import { userApi, useAuthStore } from "@/entities/user";
import { logger } from "@/shared/lib/logger";

export function useEditName() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

  const editName = async (newName: string) => {
    if (!user || !newName.trim()) return;
    setLoading(true);
    try {
      const ok = await userApi.update(user.uid, { name: newName.trim() });
      if (ok) {
        setUser({ ...user, name: newName.trim() });
        toast.success("Display name updated");
      }
    } catch (error) {
      logger.error("useEditName", error);
      toast.error("Error updating display name");
    } finally {
      setLoading(false);
    }
  };

  return { editName, currentName: user?.name ?? "", loading };
}
