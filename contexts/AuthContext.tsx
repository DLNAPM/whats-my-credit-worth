
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
import type { AppUser, AccountType } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isPremium: boolean;
  isSuperUser: boolean;
  isFrozen: boolean;
  savedTickers: string[];
  showStockBanner: boolean;
  accountType: AccountType;
  businessName: string;
  businessType: string;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  updateSavedTickers: (tickers: string[]) => Promise<void>;
  updateShowStockBanner: (enabled: boolean) => Promise<void>;
  updateAccountType: (type: AccountType, details?: { businessName?: string; businessType?: string }) => Promise<void>;
}

const SUPER_USER_EMAILS = [
  'reach_dlaniger@hotmail.com',
  'dlaniger.napm.consulting@gmail.com'
];

const DEFAULT_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'TSLA'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [savedTickers, setSavedTickers] = useState<string[]>(DEFAULT_TICKERS);
  const [showStockBanner, setShowStockBanner] = useState<boolean>(true);
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [businessName, setBusinessName] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('LLC');

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

        const localTickers = localStorage.getItem(`tickers_${firebaseUser.uid}`);
        if (localTickers) {
          try {
            const parsed = JSON.parse(localTickers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSavedTickers(parsed.slice(0, 5));
            }
          } catch (e) {
            console.error("Failed parsing local tickers", e);
          }
        }

        const localBannerSetting = localStorage.getItem(`banner_visible_${firebaseUser.uid}`);
        if (localBannerSetting !== null) {
          setShowStockBanner(localBannerSetting === 'true');
        }

        const localAccountType = localStorage.getItem(`account_type_${firebaseUser.uid}`) as AccountType;
        if (localAccountType === 'personal' || localAccountType === 'business') {
          setAccountType(localAccountType);
        }

        const localBizName = localStorage.getItem(`biz_name_${firebaseUser.uid}`);
        if (localBizName) setBusinessName(localBizName);

        const localBizType = localStorage.getItem(`biz_type_${firebaseUser.uid}`);
        if (localBizType) setBusinessType(localBizType);

        // 3. Check Firestore (Source of Truth)
        if (!isAdmin) {
            try {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    // Check specifically if isPremium is true. If false or undefined, they are basic.
                    const data = userDocSnap.data();
                    if (data.isFrozen === true) {
                        setIsFrozen(true);
                    } else {
                        setIsFrozen(false);
                    }

                    if (data.isPremium === true) {
                        hasPremium = true;
                        setIsPremium(true);
                        localStorage.setItem(`premium_${firebaseUser.uid}`, 'true');
                    } else {
                        // Ensure local state matches cloud state (downgrade if cloud says false)
                        setIsPremium(false);
                        localStorage.removeItem(`premium_${firebaseUser.uid}`);
                    }

                    if (data.savedTickers && Array.isArray(data.savedTickers) && data.savedTickers.length > 0) {
                      const cleanTickers = data.savedTickers.map((t: string) => t.trim().toUpperCase()).slice(0, 5);
                      setSavedTickers(cleanTickers);
                      localStorage.setItem(`tickers_${firebaseUser.uid}`, JSON.stringify(cleanTickers));
                    }

                    if (typeof data.showStockBanner === 'boolean') {
                      setShowStockBanner(data.showStockBanner);
                      localStorage.setItem(`banner_visible_${firebaseUser.uid}`, String(data.showStockBanner));
                    }

                    if (data.accountType === 'personal' || data.accountType === 'business') {
                      setAccountType(data.accountType);
                      localStorage.setItem(`account_type_${firebaseUser.uid}`, data.accountType);
                    }

                    if (data.businessName) {
                      setBusinessName(data.businessName);
                      localStorage.setItem(`biz_name_${firebaseUser.uid}`, data.businessName);
                    }

                    if (data.businessType) {
                      setBusinessType(data.businessType);
                      localStorage.setItem(`biz_type_${firebaseUser.uid}`, data.businessType);
                    }
                    
                    // Update last login
                    await setDoc(userDocRef, { 
                      lastLogin: new Date().toISOString(),
                      email: firebaseUser.email,
                      displayName: firebaseUser.displayName
                    }, { merge: true });
                } else {
                    // Create new user document
                    await setDoc(userDocRef, {
                      email: firebaseUser.email,
                      displayName: firebaseUser.displayName,
                      isPremium: false,
                      savedTickers: DEFAULT_TICKERS,
                      showStockBanner: true,
                      accountType: 'personal',
                      createdAt: new Date().toISOString(),
                      lastLogin: new Date().toISOString()
                    });
                }
            } catch (err) {
                console.error("Error fetching premium status:", err);
            }
        } else {
            // Admin user, still save to users collection for visibility
            try {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  const data = userDocSnap.data();
                  if (data?.savedTickers) {
                    const cleanTickers = data.savedTickers.map((t: string) => t.trim().toUpperCase()).slice(0, 5);
                    setSavedTickers(cleanTickers);
                  }
                  if (typeof data?.showStockBanner === 'boolean') {
                    setShowStockBanner(data.showStockBanner);
                  }
                  if (data?.accountType === 'personal' || data?.accountType === 'business') {
                    setAccountType(data.accountType);
                  }
                  if (data?.businessName) setBusinessName(data.businessName);
                  if (data?.businessType) setBusinessType(data.businessType);
                }
                await setDoc(userDocRef, {
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    isPremium: true,
                    isAdmin: true,
                    lastLogin: new Date().toISOString()
                }, { merge: true });
            } catch (err) {
                console.error("Error saving admin user data:", err);
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

  const cancelSubscription = async () => {
    if (user) {
        // 1. Update State immediately
        setIsPremium(false);
        // 2. Clear Local Storage
        localStorage.removeItem(`premium_${user.uid}`);
        // 3. Update Firestore to reflect basic status
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { isPremium: false }, { merge: true });
        } catch (err) {
            console.error("Failed to persist subscription cancellation:", err);
            // Revert UI if DB fails (optional, but good for data integrity)
            alert("Failed to update subscription status on server. Please check connection.");
        }
    }
  };

  const updateSavedTickers = async (newTickers: string[]) => {
    const cleanTickers = newTickers
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0)
      .slice(0, 5);

    setSavedTickers(cleanTickers);
    
    if (user?.uid) {
      localStorage.setItem(`tickers_${user.uid}`, JSON.stringify(cleanTickers));
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { savedTickers: cleanTickers }, { merge: true });
      } catch (err) {
        console.error("Failed to save tickers to Firestore:", err);
      }
    } else {
      localStorage.setItem('tickers_guest', JSON.stringify(cleanTickers));
    }
  };

  const updateShowStockBanner = async (enabled: boolean) => {
    setShowStockBanner(enabled);

    if (user?.uid) {
      localStorage.setItem(`banner_visible_${user.uid}`, String(enabled));
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { showStockBanner: enabled }, { merge: true });
      } catch (err) {
        console.error("Failed to save banner visibility setting to Firestore:", err);
      }
    } else {
      localStorage.setItem('banner_visible_guest', String(enabled));
    }
  };

  const updateAccountType = async (type: AccountType, details?: { businessName?: string; businessType?: string }) => {
    setAccountType(type);
    if (details?.businessName !== undefined) setBusinessName(details.businessName);
    if (details?.businessType !== undefined) setBusinessType(details.businessType);

    if (user?.uid) {
      localStorage.setItem(`account_type_${user.uid}`, type);
      if (details?.businessName !== undefined) localStorage.setItem(`biz_name_${user.uid}`, details.businessName);
      if (details?.businessType !== undefined) localStorage.setItem(`biz_type_${user.uid}`, details.businessType);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          accountType: type,
          ...(details?.businessName !== undefined ? { businessName: details.businessName } : {}),
          ...(details?.businessType !== undefined ? { businessType: details.businessType } : {})
        }, { merge: true });
      } catch (err) {
        console.error("Failed to save account type to Firestore:", err);
      }
    } else {
      localStorage.setItem('account_type_guest', type);
      if (details?.businessName !== undefined) localStorage.setItem('biz_name_guest', details.businessName);
      if (details?.businessType !== undefined) localStorage.setItem('biz_type_guest', details.businessType);
    }
  };

  const value = { 
    user, 
    loading, 
    isPremium: isPremium || isSuperUser, 
    isSuperUser,
    isFrozen,
    savedTickers,
    showStockBanner,
    accountType,
    businessName,
    businessType,
    loginWithGoogle, 
    loginAsGuest, 
    logout,
    upgradeToPremium,
    cancelSubscription,
    deleteUserAccount,
    updateSavedTickers,
    updateShowStockBanner,
    updateAccountType
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
