import { initializeApp, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";

// Firebase configuration is already initialized in main.tsx
// Just get the existing app instance
const app = getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen for auth state changes
export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  return auth.onAuthStateChanged(callback);
};

export { auth };
