import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeIOSApp } from "./lib/ios-utils";

// Initialize iOS-specific features
initializeIOSApp();

createRoot(document.getElementById("root")!).render(<App />);
