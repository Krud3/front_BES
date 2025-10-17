import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect } from "react";
import UserDAO from "@/lib/UserDAO"; // Adjust the path as needed
import { auth } from "../firebaseConfig";
import { useAuthStore } from "../lib/authStore"; // Adjust path if needed

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser: User | null) => {
        if (currentUser) {
          const userData = await UserDAO.getUserById(currentUser.uid);
          if (userData.success) {
            setUser({ ...currentUser, ...userData.data });
          } else {
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      },
    );
    return () => unsubscribe(); // Unsubscribe on unmount
  }, [setUser, setLoading]);

  return <>{children}</>;
};
