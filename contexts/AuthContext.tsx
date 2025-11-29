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
      sessionStorage.removeItem('guestUser');
    } catch (error) {
      console.error("Google sign-in error", error);
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