import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Wait for DOM and Capacitor to be ready
function initApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  // Register Service Worker for PWA (skip in Capacitor)
  if ('serviceWorker' in navigator && typeof window !== 'undefined' && !window.Capacitor) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful:', registration.scope);
        })
        .catch((error) => {
          console.log('ServiceWorker registration failed:', error);
        });
    });
  }

  // Render app
  createRoot(rootElement).render(<App />);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already ready
  initApp();
}
