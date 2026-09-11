import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTournaments, sourceLabel } from "../lib/useTournaments.js";
import { useTrips } from "../lib/useTrips.js";
import { usePlayers } from "../lib/usePlayers.js";
import { usePztPlayerSearch } from "../lib/usePztPlayerSearch.js";
import { useAuth } from "../lib/AuthContext.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import { inputStyle, labelStyle } from "../components/formStyles.js";

const SOURCES = [
  { key: "all", label: "Wszystkie" },
  { key: "otk", label: "PZT" },
  { key: "tennis_europe", label: "Tennis Europe" },
  { key: "itf", label: "ITF" },
];

const dateFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });

function formatRange(startsOn, endsOn) {
  const start = dateFormatter.format(new Date(startsOn));
  if (!endsOn || endsOn === startsOn) return start;
  return `${start}–${dateFormatter.format(new Date(endsOn))}`;
}

export default function TournamentsPage() {
  const [source, setSource] = useState("all");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const [openTournamentId, setOpenTournamentId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { tournaments, loading, error } = useTournaments();
  const { account } = useAuth();
  const { players, loading: playersLoading } = usePlayers(account?.id);
  const { trips, createTrip } = useTrips(account?.id);

  // Deep-link z Przejazdów/Noclegów ("najpierw zgłoś wyjazd na TEN turniej")
  // i z wyszukiwarki po zawodniku — ?turniej=<id> w URL od razu otwiera
  // formularz zgłoszenia dla właściwego turnieju, zamiast zostawiać
  // użytkownika z generycznym linkiem do przewinięcia całego kalendarza.
  // Resetujemy filtry, bo docelowy turniej mógłby akurat nie pasować do
  // aktualnie wybranego źródła/kategorii/kraju i zniknąć z listy.
  useEffect(() => {
    const targetId = searchParams.get("turniej");
    if (!targetId || !tournaments.some((t) => t.id === targetId)) return;
    setSource("all");
    setCategory("all");
    setCountry("all");
    setOpenTournamentId(targetId);
    setSearchParams({}, { replace: true });
  }, [searchParams, tournaments, setSearchParams]);

  useEffect(() => {
    if (!openTournamentId) return;
    const timer = setTimeout(() => {
      document.getElementById(`tournament-${openTournamentId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    return () => clearTimeout(timer);
  }, [openTournamentId]);

  // Listy do filtrów wyliczone z tego, co faktycznie jest w kalendarzu —
  // nie na sztywno, bo OTK i Tennis Europe mają różne zestawy kategorii/krajów.
  const categories = [...new Set(tournaments.map((t) => t.category).filter(Boolean))].sort();
  const countries = [...new Set(tournaments.map((t) => t.country).filter(Boolean))].sort();

  const visible = tournaments.filter(
    (t) =>
      (source === "all" || t.source === source) &&
      (category === "all" || t.category === category) &&
      (country === "all" || t.country === country)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Turnieje</h1>

      <PlayerTournamentFinder tournaments={tournaments} onSelectTournament={setOpenTournamentId} />

      <div className="chip-row">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            className={`chip ${source === s.key ? "is-active" : ""}`}
            onClick={() => setSource(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {(categories.length > 0 || countries.length > 0) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.length > 0 && (
            <select style={{ ...inputStyle, width: "auto" }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">Wszystkie kategorie</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          {countries.length > 0 && (
            <select style={{ ...inputStyle, width: "auto" }} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="all">Wszystkie kraje</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {error && <ErrorBox>Nie udało się wczytać turniejów: {error}</ErrorBox>}
      {loading && <p style={{ color: "var(--color-text-muted)" }}>Wczytywanie…</p>}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((t) => {
            const tripsForTournament = trips.filter((tr) => tr.tournament_id === t.id);
            return (
              <div key={t.id} id={`tournament-${t.id}`} className="glass-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <span className="status-pill muted">{sourceLabel(t.source)}</span>
                    <p style={{ margin: "8px 0 2px", fontWeight: 700, fontSize: 16 }}>{t.name}</p>
                    <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>
                      {t.city ?? "Miasto nieznane"} · {t.category} · {formatRange(t.starts_on, t.ends_on)}
                    </p>
                  </div>
                  <div className="avatar-circle" title="Kategoria wiekowa">
                    {t.category}
                  </div>
                </div>

                {tripsForTournament.length > 0 && (
                  <p style={{ margin: "12px 0 0", fontSize: 13 }}>
                    <span className="badge-verified">
                      ✅ Jedziesz: {tripsForTournament.map((tr) => tr.players?.first_name).join(", ")}
                    </span>
                  </p>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <button
                    className="btn-primary"
                    onClick={() => setOpenTournamentId(openTournamentId === t.id ? null : t.id)}
                  >
                    {openTournamentId === t.id ? "Anuluj" : "Jadę na ten turniej"}
                  </button>
                  {tripsForTournament.length > 0 && (
                    <Link className="btn-ghost" to="/moje-wyjazdy">
                      Zobacz w Moich wyjazdach
                    </Link>
                  )}
                  {t.website_url && (
                    <a className="btn-ghost" href={t.website_url} target="_blank" rel="noreferrer">
                      Strona turnieju
                    </a>
                  )}
                </div>

                {openTournamentId === t.id && (
                  <JoinTripForm
                    tournamentId={t.id}
                    players={players}
                    playersLoading={playersLoading}
                    createTrip={createTrip}
                    onDone={() => setOpenTournamentId(null)}
                  />
                )}
              </div>
            );
          })}
          {visible.length === 0 && (
            <p style={{ color: "var(--color-text-muted)" }}>
              {tournaments.length === 0
                ? "Kalendarz jest jeszcze pusty — import turniejów OTK dopiero czeka na uruchomienie (patrz PLAN.md)."
                : "Brak turniejów dla tego filtra."}
            </p>
          )}
        </div>
      )}

      <p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
        Kalendarz OTK i Tennis Europe jest importowany automatycznie
        codziennie (scraper PZT + te.tournamentsoftware.com). ITF na start
        dodawane ręcznie / przez zgłoszenia (patrz PLAN.md).
      </p>
    </div>
  );
}

function JoinTripForm({ tournamentId, players, playersLoading, createTrip, onDone }) {
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");
  const [departureCity, setDepartureCity] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (playersLoading) {
    return <p style={{ marginTop: 12, color: "var(--color-text-muted)" }}>Wczytywanie zawodników…</p>;
  }

  if (players.length === 0) {
    return (
      <div className="glass-card" style={{ marginTop: 12 }}>
        <p style={{ margin: "0 0 12px", fontSize: 13 }}>
          Najpierw dodaj zawodnika, żeby zgłosić wyjazd na turniej.
        </p>
        <Link className="btn-primary" to="/profil">
          Dodaj zawodnika w Profilu
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!departureCity.trim()) {
      setError("Podaj miasto wyjazdu — to po nim aplikacja dopasowuje przejazdy i noclegi.");
      return;
    }
    setBusy(true);
    const { error } = await createTrip({
      playerId,
      tournamentId,
      departureCity: departureCity.trim(),
    });
    setBusy(false);
    if (error) {
      setError(
        error.code === "23505"
          ? "Ten zawodnik już ma zgłoszony wyjazd na ten turniej."
          : error.message || "Nie udało się zapisać wyjazdu."
      );
      return;
    }
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-card-border)" }}
    >
      {players.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Który zawodnik jedzie?</label>
          <div className="chip-row">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${playerId === p.id ? "is-active" : ""}`}
                onClick={() => setPlayerId(p.id)}
              >
                {p.first_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <label style={labelStyle}>Miasto wyjazdu</label>
      <input
        style={inputStyle}
        placeholder="np. Katowice"
        value={departureCity}
        onChange={(e) => setDepartureCity(e.target.value)}
        autoFocus
      />

      {error && (
        <p style={{ color: "var(--color-secondary)", fontSize: 13, margin: "8px 0 0" }}>{error}</p>
      )}

      <button className="btn-primary" type="submit" disabled={busy} style={{ marginTop: 10 }}>
        {busy ? "Zapisuję…" : "Potwierdź wyjazd"}
      </button>
    </form>
  );
}

// "Znajdź turniej po zawodniku" — zamiast przeglądać cały kalendarz, rodzic
// wpisuje imię i nazwisko znanego zawodnika (np. z klubu/okolicy) i widzi, na
// jakie nadchodzące turnieje PZT jest zgłoszony. Jeśli dany turniej jest już
// w naszym zaimportowanym kalendarzu (source=otk, dopasowanie po
// external_id/tournament_id), pozwala od razu przewinąć do niego i zgłosić
// swój wyjazd — patrz usePztPlayerSearch.js po szczegóły integracji z
// backendem PZT (osobny projekt, Railway).
function PlayerTournamentFinder({ tournaments, onSelectTournament }) {
  const { query, setQuery, results, searching, searchError, getUpcomingTournaments } = usePztPlayerSearch();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [upcoming, setUpcoming] = useState(null);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [upcomingError, setUpcomingError] = useState(null);

  const reset = () => {
    setSelectedPlayer(null);
    setUpcoming(null);
    setUpcomingError(null);
  };

  const handlePick = async (player) => {
    setSelectedPlayer(player);
    setQuery("");
    setUpcoming(null);
    setUpcomingError(null);
    setLoadingUpcoming(true);
    try {
      const data = await getUpcomingTournaments(player.login);
      setUpcoming(data);
    } catch {
      setUpcomingError("Nie udało się pobrać turniejów tego zawodnika. Spróbuj ponownie.");
    }
    setLoadingUpcoming(false);
  };

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: 0, fontWeight: 700 }}>🔍 Znajdź turniej po zawodniku</p>
      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
        Wpisz imię i nazwisko zawodnika z Twojej okolicy — zobaczysz, na jakie nadchodzące
        turnieje PZT jest zgłoszony, i dołączysz do niego, jeśli już jest w naszym kalendarzu.
      </p>

      {!selectedPlayer && (
        <input
          style={inputStyle}
          placeholder="np. Kowalska Zofia"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {searching && <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>Szukam…</p>}
      {searchError && <ErrorBox>{searchError}</ErrorBox>}

      {!selectedPlayer && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {results.map((p, i) => (
            <button
              key={p.login || i}
              type="button"
              className="list-item"
              style={{ justifyContent: "space-between", flexWrap: "wrap", cursor: "pointer" }}
              onClick={() => handlePick(p)}
            >
              <strong style={{ fontSize: 14 }}>{p.name}</strong>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                {[p.club, p.province].filter(Boolean).join(" · ") || "brak danych klubu"}
              </span>
            </button>
          ))}
        </div>
      )}

      {!selectedPlayer && query.trim().length >= 2 && !searching && results.length === 0 && !searchError && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
          Nie znaleziono zawodnika o takim imieniu i nazwisku.
        </p>
      )}

      {selectedPlayer && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 14 }}>{selectedPlayer.name}</strong>
            <button className="btn-ghost" onClick={reset}>
              Zmień zawodnika
            </button>
          </div>

          {loadingUpcoming && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>Wczytywanie turniejów…</p>
          )}
          {upcomingError && <ErrorBox>{upcomingError}</ErrorBox>}
          {upcoming && (upcoming.tournaments?.length ?? 0) === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
              Brak zgłoszonych nadchodzących turniejów.
            </p>
          )}

          {upcoming?.tournaments?.map((pt) => {
            const local = tournaments.find(
              (t) =>
                t.source === "otk" &&
                t.external_id &&
                pt.tournament_id &&
                t.external_id.toUpperCase() === pt.tournament_id.toUpperCase()
            );
            return (
              <div
                key={pt.tournament_id || pt.name}
                className="list-item"
                style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{pt.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                    {pt.date_from ? formatRange(pt.date_from, pt.date_to) : "termin nieznany"}
                    {pt.categories?.length ? ` · ${pt.categories.join(", ")}` : ""}
                  </p>
                </div>
                {local ? (
                  <button className="btn-primary" onClick={() => onSelectTournament(local.id)}>
                    Zobacz w kalendarzu
                  </button>
                ) : (
                  <span className="status-pill muted">Jeszcze nie w naszym kalendarzu</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
