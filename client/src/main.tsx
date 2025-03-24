import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeApp } from "firebase/app";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "default-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "default"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "default",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "default"}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "default",
};

// Initialize Firebase
initializeApp(firebaseConfig);

createRoot(document.getElementById("root")!).render(<App />);
