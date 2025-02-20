import React, { useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuthStore } from '../lib/authStore'; // Adjust path if needed
import UserDAO from '@/lib/UserDAO'; // Adjust the path as needed

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

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