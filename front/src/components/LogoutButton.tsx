import React from 'react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button'; // Assuming you are using Shadcn/UI Button

export const LogoutButton: React.FC = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) { // Type as 'any' or Error for broader type coverage
      console.error("Logout error:", error);
      alert(`Logout failed: ${error.message}`); // Basic error feedback
    }
  };

  return <Button onClick={handleLogout}>Logout</Button>;
};