import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, /api is forwarded to the booking server (`npm run server`).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8787" } },
});
