import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/censusapi": {
        target: "http://mlinfomapcensus2027.com",
        changeOrigin: true,
      },
    },
  },
});
