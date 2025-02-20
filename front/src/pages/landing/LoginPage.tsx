import React from 'react';
import { LoginButton } from '@/components/LoginButton';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { SlimLayout } from '@/components/SlimLayout';

const LoginPage: React.FC = () => {
  return (
    <SlimLayout>
      <div className="flex flex-col items-center justify-center h-screen">
        <Link to="/" aria-label="Home">
          <Logo className="h-60 w-auto" />
        </Link>
        <p className=""mt-10 text-sm font-medium text-gray-700>Login Page</p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900 text-center">
          Welcome to the Belief Evolution Simulator
        </h1>
        <p className="mt-3 text-sm text-gray-700 text-center max-w-md">
          Please log in to access the application.
        </p>
        <div className="mt-10">
          <LoginButton />
        </div>
        <Link to="/home" className="mt-4 text-blue-500 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    </SlimLayout>
  );
};

export default LoginPage;