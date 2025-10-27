import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: "/easy-condo-hub/",
  server: { host: "::", port: 8080 },
  plugins: [
    react(),
    VitePWA({
      base: "/easy-condo-hub/",
      scope: "/easy-condo-hub/",
      outDir: "dist",
      registerType: "autoUpdate",

      includeAssets: [
        "placeholder.svg",
        "robots.txt",
        "app-icon.svg",
      ],

      manifest: {
        name: "EASY - Gestão para Portarias",
        short_name: "EASY",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0ea5a0",
        orientation: "portrait",
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false
      },

      srcDir: "src",
      filename: "sw.js",
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
