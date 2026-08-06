import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    allowedHosts: true,
    host: true, // Instructs Vite to listen on all local IPv4 addresses
    port: 5173,
    strictPort: true,
  },
});
