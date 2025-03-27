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
      console.log(`Found GitHub Pages env var for ${key} (as ${githubPagesKey})`);
      return window.ENV[githubPagesKey];
    }
    
    // Also check with the original key
    if (window.ENV[key]) {
      console.log(`Found GitHub Pages env var for ${key}`);
      return window.ENV[key];
    }
  }
  
  // For development and regular builds, use import.meta.env
  if (import.meta && import.meta.env) {
    // @ts-ignore - TypeScript doesn't know about import.meta.env
    if (import.meta.env[key]) {
      console.log(`Found Vite env var for ${key}`);
      // @ts-ignore
      return import.meta.env[key];
    }
  }
  
  // For debugging - be more explicit about missing config
  if (key.includes('FIREBASE')) {
    console.warn(`Firebase config missing: ${key}`);
    if (typeof window !== 'undefined') {
      console.log('Available window.ENV:', window.ENV ? Object.keys(window.ENV) : 'No window.ENV');
    }
    if (import.meta && import.meta.env) {
      // @ts-ignore
      console.log('Available import.meta.env keys:', Object.keys(import.meta.env).filter(k => !k.includes('SSR')));
    }
  } else {
    console.log(`Environment variable ${key} not found, using default value: "${defaultValue}"`);
  }
  
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

// Create a global variable to track Firebase initialization status 
// This will be used by the login page to display appropriate errors
export const firebaseInitStatus = {
  initialized: false,
  missing: {
    apiKey: !firebaseConfig.apiKey,
    projectId: !firebaseConfig.projectId,
    appId: !firebaseConfig.appId
  },
  error: null as Error | null
};

// Only initialize Firebase if we have the required configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Missing required Firebase configuration. Authentication will not work.');
  console.error('Make sure to set the Firebase environment variables in GitHub repository secrets.');
  console.error('Required variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID');
  
  // Update status for display on login page
  firebaseInitStatus.initialized = false;
} else {
  console.log('Firebase configuration appears complete, initializing...');
}

// Initialize Firebase app
let app;
try {
  // Only attempt to initialize if we have the minimum required config
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    firebaseInitStatus.initialized = true;
    console.log('Firebase successfully initialized');
  } else {
    console.warn('Skipping Firebase initialization due to missing configuration');
    app = undefined as any; // Typecasting to avoid errors
  }
} catch (error) {
  console.error('Error initializing Firebase app:', error);
  firebaseInitStatus.error = error as Error;
  app = undefined as any; // Typecasting to avoid errors
}

// Get auth even if initialization failed - this will be handled in the login page
const auth = app ? getAuth(app) : null as any;

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
