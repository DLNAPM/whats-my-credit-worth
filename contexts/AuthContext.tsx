import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import type { AppUser, GuestUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        sessionStorage.removeItem('guestUser');
      } else {
        const guestData = sessionStorage.getItem('guestUser');
        if (guestData) {
          setUser(JSON.parse(guestData));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // On success, the onAuthStateChanged listener will handle setting the user
      // and clearing guest data from session storage.
    } catch (error: any) {
      console.error("Google sign-in error", error);
      
      let errorMessage = "An unknown error occurred during sign-in.";
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = "The sign-in window was closed before completing. Please try again.";
            break;
          case 'auth/popup-blocked':
            errorMessage = "The sign-in popup was blocked by your browser. Please allow popups for this site and try again.";
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = "Sign-in was cancelled.";
            break;
          case 'auth/operation-not-allowed':
             errorMessage = "Sign-in with Google is not enabled for this app. Please check your Firebase project settings to ensure the Google provider is enabled.";
             break;
          default:
            errorMessage = `Sign-in failed. Please check your connection or try again later. (Error code: ${error.code})`;
        }
      }
      alert(`Google Sign-In Failed: ${errorMessage}`);
      setLoading(false);
    }
  };

  const loginAsGuest = () => {
    setLoading(true);
    const guestUser: GuestUser = {
      uid: `guest_${Date.now()}`,
      isGuest: true,
      displayName: 'Guest',
    };
    sessionStorage.setItem('guestUser', JSON.stringify(guestUser));
    setUser(guestUser);
    setLoading(false);
  };

  const logout = async () => {
    sessionStorage.removeItem('guestUser');
    await signOut(auth);
    setUser(null);
  };

  const value = { user, loading, loginWithGoogle, loginAsGuest, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};