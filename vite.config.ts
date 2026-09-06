import fs from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Convert Convex cloud URL to HTTP site URL
  const convexUrl = env.VITE_CONVEX_URL || "";
  const convexSiteUrl = convexUrl.replace(".cloud", ".site");

  const hasProductionEnvFile = fs.existsSync(
    path.join(process.cwd(), ".env.production.local"),
  );
  const devEnv = loadEnv("development", process.cwd(), "");
  const prodEnv: Record<string, string> = hasProductionEnvFile
    ? loadEnv("production", process.cwd(), "")
    : {};

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_DEV_CONVEX_URL": JSON.stringify(
        devEnv.VITE_CONVEX_URL || "",
      ),
      "import.meta.env.VITE_PROD_CONVEX_URL": JSON.stringify(
        hasProductionEnvFile ? prodEnv.VITE_CONVEX_URL || "" : "",
      ),
      "import.meta.env.VITE_PROD_SITE_URL": JSON.stringify(
        hasProductionEnvFile
          ? prodEnv.VITE_SITE_URL || prodEnv.VITE_CONVEX_SITE_URL || ""
          : "",
      ),
      "import.meta.env.VITE_HAS_PRODUCTION_ENV": JSON.stringify(
        hasProductionEnvFile ? "1" : "",
      ),
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          // v2 path segment: one-time cache bust after a bad deploy window let
          // Cloudflare cache 404s for the old /assets/ chunk URLs
          entryFileNames: "assets/v2/[name]-[hash].js",
          chunkFileNames: "assets/v2/[name]-[hash].js",
          assetFileNames: "assets/v2/[name]-[hash][extname]",
          manualChunks: {
            // Vendor chunks for better caching
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-convex": ["convex", "convex/react"],
            "vendor-markdown": [
              "react-markdown",
              "remark-gfm",
              "remark-breaks",
              "rehype-raw",
              "rehype-sanitize",
            ],
            "vendor-syntax": ["react-syntax-highlighter"],
          },
        },
      },
    },
    server: {
      proxy: {
        // Proxy RSS and sitemap to Convex HTTP endpoints in development
        "/rss.xml": {
          target: convexSiteUrl,
          changeOrigin: true,
        },
        "/rss-full.xml": {
          target: convexSiteUrl,
          changeOrigin: true,
        },
        "/sitemap.xml": {
          target: convexSiteUrl,
          changeOrigin: true,
        },
        "/api/posts": {
          target: convexSiteUrl,
          changeOrigin: true,
        },
        "/api/post": {
          target: convexSiteUrl,
          changeOrigin: true,
        },
        "/meta/post": {
          target: convexSiteUrl,
          changeOrigin: true,
        },
        "/raw/": {
          target: convexSiteUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
