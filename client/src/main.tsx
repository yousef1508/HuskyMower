import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Firebase initialization is now handled in client/src/firebase/config.ts
createRoot(document.getElementById("root")!).render(<App />);
