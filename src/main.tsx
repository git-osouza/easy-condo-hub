import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

createRoot(document.getElementById("root")!).render(<App />);

try {
  registerSW({
    onRegistered(reg) {
      console.log('SW registrado:', reg);
    },
    onRegisterError(err) {
      console.error('Falha ao registrar SW:', err);
    },
  });
} catch (e) {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registrado (fallback)'))
        .catch(err => console.log('Falha ao registrar SW (fallback):', err));
    });
  }
}