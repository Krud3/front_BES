import React from 'react';
import { auth } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from './ui/button'; // Assuming you are using Shadcn/UI Button

const googleAuthProvider = new GoogleAuthProvider();

export const LoginButton: React.FC = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error: any) { // Type as 'any' or Error for broader type coverage
      console.error("Login error:", error);
      alert(`Login failed: ${error.message}`); // Basic error feedback
    }
  };

  return <Button onClick={handleLogin}>Login with Google</Button>;
};
