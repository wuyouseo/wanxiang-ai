import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Local dev convenience: mirrors the edge-function proxy path so the
      // frontend can always call same-origin "/api/agnes/..." regardless of
      // which platform (Cloudflare / Vercel / Netlify) ends up hosting it.
      "/api/agnes": {
        target: "https://api.agnes-ai.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/agnes/, ""),
      },
    },
  },
});
