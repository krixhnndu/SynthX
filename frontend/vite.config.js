import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5001,
    proxy: {
      "/auth": "http://localhost:8000",
      "/contracts": "http://localhost:8000",
      "/internal": "http://localhost:8000",
      "/approvals": "http://localhost:8000",
      "/users": "http://localhost:8000",
      "/ws": { target: "ws://localhost:8000", ws: true },
    },
  },
});
