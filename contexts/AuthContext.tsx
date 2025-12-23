
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
      if (firebaseUser) {
        setUser(firebaseUser);
      } else if (!user?.isMock) {
        // Only clear if we aren't in a mock guest session
        setUser(null);
      }
      setLoading(false);
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
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = async () => {
    try {
      setLoading(true);
      // Try real Firebase Anonymous Auth first
      await signInAnonymously(auth);
    } catch (error: any) {
      console.warn("Firebase Anonymous Auth failed or is disabled. Falling back to local Guest Mode.", error);
      
      // Fallback: Create a mock user object to bypass AuthScreen
      // This ensures "nothing happens" never occurs even if Firebase config is restrictive
      const mockUser = {
        uid: 'local-guest-' + Math.random().toString(36).substr(2, 9),
        isAnonymous: true,
        isMock: true,
        displayName: 'Guest User',
        email: null,
        photoURL: null,
      } as any;
      
      setUser(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      if (!user?.isMock) {
        await signOut(auth);
      }
      setUser(null);
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
