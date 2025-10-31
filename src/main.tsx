import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA. Use the Vite base URL so the path
// works when the app is deployed under a subpath (for example /easy-portaria/).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swPath)
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(err => {
        console.log('SW registration failed:', err);
      });
  });
}