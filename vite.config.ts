import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: '/easy-condo-hub/',
  server: { host: "::", port: 8080 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'placeholder.svg', 'robots.txt', 'app-icon.svg'],
      manifest: {
        name: 'EASY - Gestão para Portarias',
        short_name: 'EASY',
        start_url: '/easy-condo-hub/',
        scope: '/easy-condo-hub/',
        display: 'standalone',
        background_color: '#0ea5a0',
        theme_color: '#0ea5a0',
        icons: [
          { src: 'app-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512x512.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'placeholder.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      }
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
}));