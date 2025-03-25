import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, User } from "firebase/auth";

// Helper function to get environment variables that will work both in development and production
const getEnv = (key: string, defaultValue = ''): string => {
  // For GitHub Pages deployment, we use window.ENV which is set in env-config.js
  // This is loaded at runtime rather than build time
  if (typeof window !== 'undefined' && window.ENV) {
    // Check for GitHub Pages style environment variables (without VITE_ prefix)
    const githubPagesKey = key.replace('VITE_', '');
    if (window.ENV[githubPagesKey]) {
      return window.ENV[githubPagesKey];
    }
    
    // Also check with the original key
    if (window.ENV[key]) {
      return window.ENV[key];
    }
  }
  
  // For development and regular builds, use import.meta.env
  if (import.meta && import.meta.env) {
    // @ts-ignore - TypeScript doesn't know about import.meta.env
    if (import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  }
  
  console.log(`Environment variable ${key} not found, using default value: "${defaultValue}"`);
  return defaultValue;
};

// Get Firebase config from environment variables
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: `${getEnv('VITE_FIREBASE_PROJECT_ID')}.firebaseapp.com`,
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: `${getEnv('VITE_FIREBASE_PROJECT_ID')}.appspot.com`,
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Log Firebase config (without sensitive values) to help with debugging
console.log('Firebase configuration:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyProvided: !!firebaseConfig.apiKey,
  appIdProvided: !!firebaseConfig.appId
});

// Only initialize Firebase if we have the required configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Missing required Firebase configuration. Authentication will not work.');
  console.error('Make sure to set the Firebase environment variables in GitHub repository secrets.');
  console.error('Required variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID');
}

// Initialize Firebase app
let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.error('Error initializing Firebase app:', error);
  throw error;
}
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
