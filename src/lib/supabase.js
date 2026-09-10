import { createClient } from "@supabase/supabase-js";

// Klucz "anon" jest z definicji publiczny (trafia do każdej aplikacji klienckiej) —
// prawdziwe bezpieczeństwo danych zapewnia Row Level Security w bazie (patrz
// supabase/migrations), nie tajność tego klucza. Mimo to trzymamy go w .env,
// żeby nie commitować adresu konkretnego projektu Supabase na produkcji/staging.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Brak VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — skopiuj .env.example do .env i wypełnij."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
