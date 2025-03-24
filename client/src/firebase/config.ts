import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, User } from "firebase/auth";

// Get the Firebase app - if it doesn't exist yet, create it
// This ensures we don't try to create multiple instances
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDvR61q56SDVdcNLeIOhAGZof0wL7xMEP0",
  authDomain: import.meta.env.VITE_FIREBASE_PROJECT_ID + ".firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gjersjoengolfclub",
  storageBucket: import.meta.env.VITE_FIREBASE_PROJECT_ID + ".firebasestorage.app",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:823610815817:web:77b493aee1c06644f21698"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sign in with email/password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email/password:", error);
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
