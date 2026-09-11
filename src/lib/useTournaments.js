import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// Kalendarz turniejów (tabela `tournaments`) — na razie tylko OTK, zasilane
// przez scripts/import_tournaments.py (GitHub Actions, codziennie). Tennis
// Europe i ITF są w schemacie przewidziane (kolumna `source`), ale na start
// dodawane ręcznie/przez zgłoszenia — patrz PLAN.md.
export function useTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .gte("starts_on", today)
        .order("starts_on", { ascending: true })
        .limit(200);

      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setTournaments(data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { tournaments, loading, error };
}

const SOURCE_LABELS = { otk: "OTK", tennis_europe: "Tennis Europe", itf: "ITF", manual: "Inne" };

export function sourceLabel(source) {
  return SOURCE_LABELS[source] ?? source;
}
