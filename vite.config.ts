import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    // Fallback values when .env is missing (these are publishable keys, safe to inline)
    ...(process.env.VITE_SUPABASE_URL ? {} : {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://mvkbbvuupszhhaxfodxi.supabase.co"),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12a2JidnV1cHN6aGhheGZvZHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDc2NDEsImV4cCI6MjA4NzkyMzY0MX0.0y3C_4FgFp8Bdn6lKkGZSB2kmaN5rRjBbxxsk7R_ZyI"),
      'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify("mvkbbvuupszhhaxfodxi"),
    }),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
