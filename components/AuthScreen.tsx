import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.641-3.219-11.334-7.618l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,34.019,44,28.891,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const AuthScreen: React.FC = () => {
  const { loginWithGoogle, loginAsGuest } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6 animate-fade-in">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-brand-primary dark:text-brand-light">What's My Credit Worth?</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Your personal finance dashboard.</p>
        </div>
        <div className="space-y-4">
            <Button onClick={loginWithGoogle} variant="secondary" className="w-full">
                <GoogleIcon />
                Sign in with Google
            </Button>
            <Button onClick={loginAsGuest} variant="primary" className="w-full">
                Continue as Guest
            </Button>
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>
                Signing in with Google allows you to save your data across devices.
            </p>
            <p className="mt-1">
                Guest sessions are stored locally in this browser.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;