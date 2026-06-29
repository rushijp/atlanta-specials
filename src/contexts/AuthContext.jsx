import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result (for browsers/devices where popup was blocked)
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        await ensureUserProfile(result.user);
      }
    }).catch((err) => {
      console.error('Google redirect result error:', err);
    });

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profileDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
          setUserProfile(profileDoc.exists() ? profileDoc.data() : null);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const ensureUserProfile = async (firebaseUser) => {
    const profileDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    if (!profileDoc.exists()) {
      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL || null,
        plan: 'free',
        createdAt: serverTimestamp(),
      });
    }
  };

  const register = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), {
      email,
      displayName,
      plan: 'free',
      createdAt: serverTimestamp(),
    });
    return cred.user;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      await ensureUserProfile(cred.user);
      return cred.user;
    } catch (err) {
      // If popup was blocked or failed, fall back to redirect
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw err;
    }
  };

  const logout = () => signOut(auth);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
