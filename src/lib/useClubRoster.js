import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// Panel trenera/klubu (PLAN.md) — zawodnicy i wyjazdy dopasowani po
// `club_name`, nie po owner_account_id/created_by_account_id (trener zwykle
// nie jest rodzicem żadnego z nich). RLS (0011_coach_club_visibility.sql)
// i tak dopuszcza tylko zawodników/wyjazdy tego samego klubu — zapytania
// poniżej nie filtrują ręcznie po club_name, bo trener ma wpisany jeden,
// swój, i to jedyny, który RLS mu odkryje.
export function useClubRoster(clubName) {
  const [players, setPlayers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!clubName) {
      setPlayers([]);
      setTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [playersRes, tripsRes] = await Promise.all([
      supabase.from("players").select("*").order("first_name", { ascending: true }),
      supabase
        .from("trips")
        .select("*, tournaments(*), players(first_name, last_name, club_name)")
        .order("created_at", { ascending: false }),
    ]);

    if (playersRes.error) {
      setError(playersRes.error.message);
    } else if (tripsRes.error) {
      setError(tripsRes.error.message);
    } else {
      setError(null);
      setPlayers(playersRes.data ?? []);
      setTrips(tripsRes.data ?? []);
    }
    setLoading(false);
  }, [clubName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { players, trips, loading, error, refresh };
}
