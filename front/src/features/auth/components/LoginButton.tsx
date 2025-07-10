import React from 'react';
import { auth } from '@/config/firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button'; 
import UserDAO from '@/features/auth/services/UserDAO'; 

const googleAuthProvider = new GoogleAuthProvider();

export const LoginButton: React.FC = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;

      // Create user in Firestore
      await UserDAO.createUser({
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photo: user.photoURL,
        roles: ['Guest'], // Default role
        usageLimits: {}, // Default usage limits
      });
    } catch (error: any) { // Type as 'any' or Error for broader type coverage
      console.error("Login error:", error);
      alert(`Login failed: ${error.message}`); // Basic error feedback
    }
  };

  return <Button onClick={handleLogin}>Login with Google</Button>;
};