'use client';

/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/client';
import { AuthUser, UserRole, CustomClaims } from '@/lib/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    console.log('AuthContext - Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext - Auth state changed, user:', firebaseUser?.uid);
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        console.log('AuthContext - No user, setting loading to false');
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadUserProfile(firebaseUser: User) {
    try {
      console.log('AuthContext - Loading user profile for:', firebaseUser.uid);
      const db = getFirebaseFirestore();
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      console.log('AuthContext - User doc exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('AuthContext - User data:', userData);
        
        // Get custom claims from ID token
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const claims = idTokenResult.claims as unknown as CustomClaims;
        console.log('AuthContext - Custom claims:', claims);

        const authUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: claims.role as UserRole || UserRole.DRIVER,
          companyId: claims.companyId as string | null || null,
          active: claims.active !== false,
        };
        console.log('AuthContext - Setting user:', JSON.stringify(authUser, null, 2));
        setUser(authUser);
      } else {
        console.log('AuthContext - User document does not exist, signing out');
        // User document doesn't exist - sign out
        await firebaseSignOut(getFirebaseAuth());
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext - Error loading user profile:', error);
      setUser(null);
    } finally {
      console.log('AuthContext - Setting loading to false');
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle setting the user
  }

  async function signOut() {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
