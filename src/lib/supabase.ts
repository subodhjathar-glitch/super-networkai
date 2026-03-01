import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const FALLBACK_URL = "https://mvkbbvuupszhhaxfodxi.supabase.co";
const FALLBACK_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12a2JidnV1cHN6aGhheGZvZHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDc2NDEsImV4cCI6MjA4NzkyMzY0MX0.0y3C_4FgFp8Bdn6lKkGZSB2kmaN5rRjBbxxsk7R_ZyI";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim() || FALLBACK_URL;
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim() ||
  FALLBACK_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
