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

// Usuwa polskie znaki + normalizuje wielkość liter/spacje — ten sam wzorzec
// co w useCityCoordinates.js (dopasowanie odporne na literówki/ogonki).
function normalizeName(name) {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z");
}

// "Zgadza się" = każde słowo z imienia/nazwiska podanego w profilu
// występuje też w nazwie zwróconej live przez PZT (portal zwraca format
// "Nazwisko Imię", więc porównujemy zbiór słów, nie kolejność).
function namesMatch(firstName, lastName, pztName) {
  const formWords = new Set(
    normalizeName(`${firstName} ${lastName}`)
      .split(/\s+/)
      .filter(Boolean)
  );
  const pztWords = normalizeName(pztName).split(/\s+/).filter(Boolean);
  return pztWords.length > 0 && pztWords.every((w) => formWords.has(w));
}

// Weryfikacja zawodnika przez login PZT (PLAN.md, "z kim ja właściwie
// jadę") — pyta ten sam endpoint co wyszukiwarka turniejów
// (/players/{login}/upcoming, live scrape z portal.pzt.pl, patrz projekt
// NOWA APLIKACJA PZT ANDROID) tylko po to, żeby dostać prawdziwe imię i
// nazwisko przypisane do tego loginu, i porównać je z tym, co rodzic
// wpisał w profilu zawodnika.
export async function verifyPztLogin(login, firstName, lastName) {
  const res = await fetch(`${PZT_API_BASE}/players/${encodeURIComponent(login)}/upcoming`);
  if (!res.ok) throw new Error(`Serwer PZT odpowiedział błędem ${res.status}`);
  const data = await res.json();
  if (!data.player_name) {
    return { found: false, pztName: null, matches: false };
  }
  return { found: true, pztName: data.player_name, matches: namesMatch(firstName, lastName, data.player_name) };
}
