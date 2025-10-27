import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;
createRoot(root).render(<App />);

// Registrar Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/easy-condo-hub/sw.js")
      .then(() => console.log("SW registrado (fallback)"))
      .catch((err) =>
        console.log("Falha ao registrar SW (fallback):", err)
      );
  });
}
