import React from 'react';
import { auth } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from './ui/button'; // Assuming you are using Shadcn/UI Button
import UserDAO from '@/lib/UserDAO'; // Adjust the path as needed

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