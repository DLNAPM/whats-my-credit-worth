
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import type { AppUser } from '../types';

interface AuthContextType {
  user: (AppUser & { isMock?: boolean }) | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(AppUser & { isMock?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Firebase Auth State Changed:", firebaseUser ? "User exists" : "No user");
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else if (user?.isMock) {
        // Keep mock user if it exists to maintain session across re-renders
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user?.isMock]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google sign-in error", error);
      let errorMessage = "An unknown error occurred during sign-in.";
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = "Sign-in window closed. Please try again.";
            break;
          case 'auth/popup-blocked':
            errorMessage = "Popup blocked! Please allow popups for this site.";
            break;
          default:
            errorMessage = error.message;
        }
      }
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  const loginAsGuest = async () => {
    console.log("Starting Guest Login Process...");
    setLoading(true);
    
    // Fallback Mock User Template
    const mockUser = {
      uid: 'local-guest-' + Math.random().toString(36).substr(2, 9),
      isAnonymous: true,
      isMock: true,
      displayName: 'Guest User',
      email: null,
      photoURL: null,
    } as any;

    try {
      // Race Firebase against a 3-second timeout to ensure the UI doesn't hang
      const firebaseAuthPromise = signInAnonymously(auth);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firebase auth timeout")), 3000)
      );

      await Promise.race([firebaseAuthPromise, timeoutPromise]);
      console.log("Firebase Anonymous Auth Success");
    } catch (error: any) {
      console.warn("Guest login fallback triggered due to:", error.message);
      // Immediately set the mock user to unblock the UI
      setUser(mockUser);
    } finally {
      // Ensure loading is cleared so the app renders the dashboard
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      if (user && !user.isMock) {
        await signOut(auth);
      }
      setUser(null);
      if (user?.isMock) {
          localStorage.removeItem('wmcw_local_guest_data');
      }
    } finally {
      setLoading(false);
    }
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
