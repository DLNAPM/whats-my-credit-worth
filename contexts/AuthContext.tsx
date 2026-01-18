
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
    // Standard listener for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Firebase Auth State Changed:", firebaseUser ? "User exists" : "No user");
      
      if (firebaseUser) {
        setUser(firebaseUser);
      } else if (user?.isMock) {
        // Maintain mock guest session if it already exists
        // (This prevents accidental logout of guest sessions on minor network blips)
      } else {
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
      // signInWithPopup is more reliable in iframe/sandboxed environments than redirect
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        console.log("Popup sign-in successful:", result.user.displayName);
        setUser(result.user);
      }
    } catch (error: any) {
      console.error("Google popup sign-in error", error);
      // Handle cases where popups are blocked
      if (error.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else {
        alert(error.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
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
