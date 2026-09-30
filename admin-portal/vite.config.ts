import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: process.env.VITE_ADMIN_BASE_PATH || "/",
  // En local, l'admin réutilise le .env de la racine du projet.
  // En déploiement séparé, les mêmes variables peuvent être fournies par l'environnement CI.
  envDir: path.resolve(__dirname, ".."),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: { port: 5174, host: true },
});
