import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// Zawodnicy (tabela `players`) należący do zalogowanego konta. RLS w bazie
// (supabase/migrations/0001_init.sql) i tak dopuszcza tylko własne wiersze
// (owner_account_id = auth.uid()) — filtr .eq() poniżej jest dla czytelności
// zapytania, nie jest jedyną linią obrony.
export function usePlayers(ownerAccountId) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!ownerAccountId) {
      setPlayers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("owner_account_id", ownerAccountId)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setPlayers(data ?? []);
    }
    setLoading(false);
  }, [ownerAccountId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPlayer = async (fields) => {
    const { data, error } = await supabase
      .from("players")
      .insert({ ...fields, owner_account_id: ownerAccountId })
      .select()
      .single();

    if (error) return { error };
    setPlayers((prev) => [...prev, data]);
    return { data };
  };

  return { players, loading, error, addPlayer, refresh };
}
