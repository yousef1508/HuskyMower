import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeApp } from "firebase/app";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDvR61q56SDVdcNLeIOhAGZof0wL7xMEP0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gjersjoengolfclub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gjersjoengolfclub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gjersjoengolfclub.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "823610815817",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:823610815817:web:77b493aee1c06644f21698",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9ZXQDSRFQK"
};

// Initialize Firebase
initializeApp(firebaseConfig);

createRoot(document.getElementById("root")!).render(<App />);
