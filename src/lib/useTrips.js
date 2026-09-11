import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// Wyjazdy (tabela `trips`) należące do zalogowanego konta (created_by_account_id).
// RLS w bazie (supabase/migrations/0004_trips_rls.sql) i tak dopuszcza tylko
// własne wiersze — filtr .eq() poniżej jest dla czytelności zapytania.
//
// Dołączamy dane turnieju i zawodnika przez wbudowane w Supabase embedowanie
// relacji (foreign key -> zagnieżdżony obiekt), żeby nie robić osobnych zapytań.
export function useTrips(accountId) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!accountId) {
      setTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select("*, tournaments(*), players(first_name, last_name)")
      .eq("created_by_account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setTrips(data ?? []);
    }
    setLoading(false);
  }, [accountId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTrip = async ({ playerId, tournamentId, departureCity }) => {
    const { data, error } = await supabase
      .from("trips")
      .insert({
        player_id: playerId,
        tournament_id: tournamentId,
        created_by_account_id: accountId,
        departure_city: departureCity,
      })
      .select("*, tournaments(*), players(first_name, last_name)")
      .single();

    if (error) return { error };
    setTrips((prev) => [data, ...prev]);
    return { data };
  };

  return { trips, loading, error, createTrip, refresh };
}
