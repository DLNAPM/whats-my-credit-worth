
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  signInAnonymously,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
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

  // Set persistence to LOCAL so it survives session clearing on mobile browsers
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error:", err));
  }, []);

  useEffect(() => {
    // Check for redirect result on mount (crucial for mobile flow)
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("Redirect sign-in successful");
      }
    }).catch((error) => {
      console.error("Redirect sign-in error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const appUser = firebaseUser as AppUser;
        setUser(appUser);
        const isAdmin = SUPER_USER_EMAILS.includes(firebaseUser.email || '');
        const localPremium = localStorage.getItem(`premium_${firebaseUser.uid}`) === 'true';
        setIsPremium(localPremium || isAdmin);
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
    
    // Check if user is on mobile to use Redirect instead of Popup
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      setLoading(true);
      if (isMobile) {
        // Redirect is much more reliable on Android WebViews and mobile browsers
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
          const isAdmin = SUPER_USER_EMAILS.includes(result.user.email || '');
          setIsPremium(isAdmin || localStorage.getItem(`premium_${result.user.uid}`) === 'true');
        }
      }
    } catch (err) {
      console.error("Google login failed:", err);
      throw err;
    } finally {
      // Don't set loading false for mobile as it's redirecting away
      if (!isMobile) setLoading(false);
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
