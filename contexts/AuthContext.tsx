
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
        // Firebase user logged in
        setUser(firebaseUser);
        sessionStorage.removeItem('guestUser');
      } else {
        // No Firebase user, check for guest session
        const guestData = sessionStorage.getItem('guestUser');
        if (guestData) {
          try {
            setUser(JSON.parse(guestData));
          } catch (e) {
            setUser(null);
            sessionStorage.removeItem('guestUser');
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Add custom parameters if needed
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the UI state transition
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
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection.";
            break;
          default:
            errorMessage = error.message;
        }
      }
      throw new Error(errorMessage);
    }
  };

  const loginAsGuest = () => {
    const guestUser: GuestUser = {
      uid: `guest_${Date.now()}`,
      isGuest: true,
      displayName: 'Guest User',
    };
    sessionStorage.setItem('guestUser', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      sessionStorage.removeItem('guestUser');
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
