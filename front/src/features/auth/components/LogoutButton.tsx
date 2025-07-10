import React from 'react';
import { auth } from '@/config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button'; 

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