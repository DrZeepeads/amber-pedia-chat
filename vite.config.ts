import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const manifestPath = path.resolve(__dirname, "public", "manifest.json");
  let pwaManifest: any = undefined;
  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    pwaManifest = JSON.parse(raw);
  } catch {}

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "public",
        filename: "sw.js",
        registerType: "autoUpdate",
        manifest: pwaManifest,
        devOptions: { enabled: true, type: "module" },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === "script" || request.destination === "style",
              handler: "CacheFirst",
              options: { cacheName: "static-assets", expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/assets/"),
              handler: "StaleWhileRevalidate",
              options: { cacheName: "ui-components", expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
            {
              urlPattern: ({ request, url }) => request.destination === "" && (url.pathname.startsWith("/api") || url.hostname.endsWith("supabase.co")),
              handler: "NetworkFirst",
              options: { cacheName: "api-cache", networkTimeoutSeconds: 3, expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 } },
            },
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "CacheFirst",
              options: { cacheName: "image-cache", expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "html-cache", networkTimeoutSeconds: 3 },
            },
          ],
        },
      }),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});