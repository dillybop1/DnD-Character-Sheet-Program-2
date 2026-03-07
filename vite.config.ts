import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@src": resolve(__dirname, "src"),
      "@shared": resolve(__dirname, "shared"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
