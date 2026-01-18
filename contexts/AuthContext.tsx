
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import type { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isPremium: boolean;
  isSuperUser: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => void;
}

const SUPER_USER_EMAILS = [
  'reach_dlaniger@hotmail.com',
  'dlaniger.napm.consulting@gmail.com'
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const isSuperUser = user?.email ? SUPER_USER_EMAILS.includes(user.email) : false;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const appUser = firebaseUser as AppUser;
        setUser(appUser);
        // Check local storage or admin status for premium
        const localPremium = localStorage.getItem(`premium_${firebaseUser.uid}`) === 'true';
        setIsPremium(localPremium || SUPER_USER_EMAILS.includes(firebaseUser.email || ''));
      } else {
        setUser(null);
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const appUser = result.user as AppUser;
        setUser(appUser);
        const isAdmin = SUPER_USER_EMAILS.includes(result.user.email || '');
        setIsPremium(isAdmin);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setLoading(true);
    const mockUser = {
      uid: 'guest-' + Math.random().toString(36).substr(2, 9),
      isAnonymous: true,
      isMock: true,
      displayName: 'Guest User',
      email: null,
    } as AppUser;

    try {
      await signInAnonymously(auth);
    } catch (e) {
      setUser(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      if (user && !user.isMock) await signOut(auth);
      setUser(null);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPremium = () => {
    if (user) {
      localStorage.setItem(`premium_${user.uid}`, 'true');
      setIsPremium(true);
    }
  };

  const value = { 
    user, 
    loading, 
    isPremium: isPremium || isSuperUser, 
    isSuperUser,
    loginWithGoogle, 
    loginAsGuest, 
    logout,
    upgradeToPremium
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
