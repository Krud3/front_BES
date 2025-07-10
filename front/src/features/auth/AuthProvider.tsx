import React, { useEffect } from 'react';
import { auth } from '@/config/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuthStore } from '@/features/auth/store/authStore'; 
import UserDAO from '@/features/auth/services/UserDAO'; 

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const setUser = useAuthStore((state: any) => state.setUser);
  const setLoading = useAuthStore((state: any) => state.setLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
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
    });
    return () => unsubscribe(); // Unsubscribe on unmount
  }, [setUser, setLoading]);

  return <>{children}</>;
};