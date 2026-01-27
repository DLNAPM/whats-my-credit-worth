
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  getRedirectResult, 
  signOut, 
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  deleteUser
} from 'firebase/auth';
import { auth } from '../firebase';
import type { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isPremium: boolean;
  isSuperUser: boolean;
  isStandalone: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => void;
  deleteUserAccount: () => Promise<void>;
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
  const [isStandalone, setIsStandalone] = useState(false);

  const isSuperUser = user?.email ? SUPER_USER_EMAILS.includes(user.email) : false;

  useEffect(() => {
    // Detect if app is running in standalone mode (installed PWA)
    const checkStandalone = () => {
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches || 
                                 (window.navigator as any).standalone || 
                                 document.referrer.includes('android-app://');
        setIsStandalone(!!isStandaloneMatch);
    };
    
    checkStandalone();

    // Ensure persistence is set to LOCAL
    setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error:", err));
    
    // Check for redirect result on mount (important if popup failed and reverted to redirect)
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("Auth result found from redirect:", result.user.email);
      }
    }).catch((error) => {
      if (error.code === 'auth/missing-initial-state') {
        console.warn("Storage partitioning detected. State lost during auth redirect.");
      }
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
    
    try {
      setLoading(true);
      
      // Attempt popup first
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const isAdmin = SUPER_USER_EMAILS.includes(result.user.email || '');
        setIsPremium(isAdmin || localStorage.getItem(`premium_${result.user.uid}`) === 'true');
      }
    } catch (err: any) {
      console.error("Google login attempt failed:", err.code, err.message);
      
      setLoading(false);

      // SPECIFIC FIX FOR ANDROID STORAGE PARTITIONING
      if (err.code === 'auth/missing-initial-state') {
        throw new Error("ANDROID_AUTH_STATE_ERROR");
      } else if (err.code === 'auth/popup-blocked') {
        throw new Error("The login popup was blocked. Please enable popups in your browser settings and try again.");
      } else if (err.code === 'auth/cancelled-by-user') {
        return;
      }
      
      throw err;
    }
  };

  const loginAsGuest = async () => {
    setLoading(true);
    localStorage.removeItem('wmcw_local_guest_data');
    
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

  const deleteUserAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await deleteUser(currentUser);
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        alert("This operation is sensitive and requires a recent login. Please sign out and sign back in before deleting your account.");
      }
      throw err;
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
    isStandalone,
    loginWithGoogle, 
    loginAsGuest, 
    logout,
    upgradeToPremium,
    deleteUserAccount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
