import { useEffect, useState } from "react";

// "Znajdź turniej po zawodniku" (PLAN.md — kolejny krok w rozbudowie
// wyszukiwarki turniejów) — odpytuje NA ŻYWO backend z sąsiedniego projektu
// "NOWA APLIKACJA PZT ANDROID" (FastAPI na Railway, ten sam co zasila
// aplikację rankingową), zamiast duplikować scraper w tym projekcie.
// Wymaga, żeby origin tej apki był dopuszczony w CORS tamtego backendu
// (main.py, allow_origin_regex dla localhost:31xx) — inaczej przeglądarka
// po cichu zablokuje odpowiedź.
const PZT_API_BASE =
  import.meta.env.VITE_PZT_API_URL || "https://pzt-rankingi-api-production.up.railway.app";

const SEARCH_DEBOUNCE_MS = 400;

export function usePztPlayerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${PZT_API_BASE}/players/search?q=${encodeURIComponent(q)}&pzt_fallback=true&limit=15`
        );
        if (!res.ok) throw new Error(`Serwer PZT odpowiedział błędem ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setResults(data.results ?? []);
        setSearchError(null);
      } catch {
        if (cancelled) return;
        setResults([]);
        setSearchError("Nie udało się połączyć z bazą PZT. Spróbuj ponownie za chwilę.");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const getUpcomingTournaments = async (login) => {
    const res = await fetch(`${PZT_API_BASE}/players/${encodeURIComponent(login)}/upcoming`);
    if (!res.ok) throw new Error(`Serwer PZT odpowiedział błędem ${res.status}`);
    return res.json();
  };

  return { query, setQuery, results, searching, searchError, getUpcomingTournaments };
}
