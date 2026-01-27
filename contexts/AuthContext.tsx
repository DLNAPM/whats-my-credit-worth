
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

  const isSuperUser = user?.email ? SUPER_USER_EMAILS.includes(user.email) : false;

  useEffect(() => {
    // Set persistence to LOCAL so it survives session clearing on mobile browsers
    setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error:", err));
    
    // Check for redirect result on mount (crucial for mobile flow)
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("Redirect sign-in successful:", result.user.email);
        // Explicitly update user here if needed, but onAuthStateChanged usually catches it
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
    
    // Detect mobile environment
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      setLoading(true);
      
      /**
       * IMPROVED IPHONE FLOW:
       * On iOS, Popups are often more reliable than Redirects for 3rd party apps
       * because Safari's "Prevent Cross-Site Tracking" can break the redirect loop.
       * We try Popup first, and only use Redirect as a true fallback or for known
       * constrained environments like Android WebViews.
       */
      try {
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
          const isAdmin = SUPER_USER_EMAILS.includes(result.user.email || '');
          setIsPremium(isAdmin || localStorage.getItem(`premium_${result.user.uid}`) === 'true');
        }
      } catch (popupErr: any) {
        // If popup is blocked or closed, try redirect for mobile
        if (isMobile || popupErr.code === 'auth/popup-blocked') {
          console.log("Popup failed/blocked, falling back to redirect...");
          await signInWithRedirect(auth, provider);
        } else {
          throw popupErr;
        }
      }
    } catch (err) {
      console.error("Google login failed:", err);
      setLoading(false);
      throw err;
    }
  };

  const loginAsGuest = async () => {
    setLoading(true);
    // Ensure we reset any previous guest state
    localStorage.removeItem('wmcw_local_guest_data');
    
    const mockUser = {
      uid: 'guest-' + Math.random().toString(36).substr(2, 9),
      isAnonymous: true,
      isMock: true,
      displayName: 'Guest User',
      email: null,
    } as AppUser;

    try {
      // We try to use Firebase's real anonymous auth if possible
      await signInAnonymously(auth);
    } catch (e) {
      // Fallback to local mock user if Firebase fails
      console.log("Using mock guest fallback");
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
