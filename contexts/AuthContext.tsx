
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isPremium: boolean;
  isSuperUser: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
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
      }
    }).catch((error) => {
      console.error("Redirect sign-in error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = firebaseUser as AppUser;
        setUser(appUser);
        
        // 1. Check Admin List
        const isAdmin = SUPER_USER_EMAILS.includes(firebaseUser.email || '');
        
        // 2. Check Local Storage (Optimistic)
        let hasPremium = isAdmin || localStorage.getItem(`premium_${firebaseUser.uid}`) === 'true';
        setIsPremium(hasPremium);

        // 3. Check Firestore (Source of Truth)
        if (!isAdmin) {
            try {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data().isPremium) {
                    hasPremium = true;
                    setIsPremium(true);
                    localStorage.setItem(`premium_${firebaseUser.uid}`, 'true');
                }
            } catch (err) {
                console.error("Error fetching premium status:", err);
            }
        }
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
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    try {
      setLoading(true);
      try {
        await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        if ((isMobile && !isAndroid) || (popupErr.code === 'auth/popup-blocked' && !isAndroid)) {
          await signInWithRedirect(auth, provider);
        } else {
          if (popupErr.code === 'auth/popup-blocked') {
            throw new Error("Login popup blocked. Please check your browser settings and allow popups for this site.");
          } else if (popupErr.code !== 'auth/cancelled-by-user') {
             throw popupErr;
          }
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

  const upgradeToPremium = async () => {
    if (user) {
      // 1. Update State
      setIsPremium(true);
      // 2. Update Local Storage
      localStorage.setItem(`premium_${user.uid}`, 'true');
      // 3. Update Firestore (Persistence)
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { isPremium: true }, { merge: true });
      } catch (err) {
        console.error("Failed to persist premium upgrade:", err);
      }
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
