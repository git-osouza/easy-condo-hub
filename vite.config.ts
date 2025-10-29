import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: '/easy-portaria/',
  server: { host: "::", port: 8080 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'placeholder.svg', 'robots.txt', 'app-icon.svg'],
      manifest: {
        name: 'EASY - Gestão para Portarias',
        short_name: 'EASY',
        description: 'Sistema completo de gestão para portarias de condomínios',
        start_url: '/easy-portaria/',
        scope: '/easy-portaria/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0ea5a0',
        orientation: 'portrait',
        categories: ['productivity', 'business'],
        icons: [
          { src: '/easy-portaria/app-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/easy-portaria/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/easy-portaria/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/dcibizmcavharwnxxbor\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
}));