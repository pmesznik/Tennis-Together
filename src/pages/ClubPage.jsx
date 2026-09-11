import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { useClubRoster } from "../lib/useClubRoster.js";
import ErrorBox from "../components/ErrorBox.jsx";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });

function formatRange(startsOn, endsOn) {
  const start = dateFormatter.format(new Date(startsOn));
  if (!endsOn || endsOn === startsOn) return start;
  return `${start}–${dateFormatter.format(new Date(endsOn))}`;
}

// Panel trenera/klubu (PLAN.md, "wchodzi do MVP, nie etap 2") — widok tylko
// dla roli `coach`. Pokazuje listę zawodników klubu (dopasowanych po
// `club_name`, patrz useClubRoster) i to, kto z klubu jedzie na jakie
// turnieje, żeby trener mógł od razu zorganizować wyjazd grupowy bez
// czekania, aż rodzice sami się znajdą w aplikacji.
export default function ClubPage() {
  const { account } = useAuth();

  if (account?.role !== "coach") {
    return (
      <div className="glass-card">
        <p style={{ margin: 0 }}>Ten panel jest dostępny tylko dla kont z rolą „Trener / klub”.</p>
      </div>
    );
  }

  if (!account.club_name) {
    return (
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0 }}>
          Żeby zobaczyć zawodników swojego klubu, najpierw wpisz nazwę klubu/akademii
          w swoim profilu — to po niej aplikacja rozpoznaje, kto jest „Twój”.
        </p>
        <Link className="btn-primary" to="/profil" style={{ alignSelf: "flex-start" }}>
          Ustaw klub w Profilu
        </Link>
      </div>
    );
  }

  return <ClubRoster clubName={account.club_name} />;
}

function ClubRoster({ clubName }) {
  const { players, trips, loading, error } = useClubRoster(clubName);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrips = trips.filter((t) => t.tournaments && t.tournaments.starts_on >= today);

  const tripsByTournament = new Map();
  for (const trip of upcomingTrips) {
    const key = trip.tournament_id;
    if (!tripsByTournament.has(key)) tripsByTournament.set(key, []);
    tripsByTournament.get(key).push(trip);
  }
  const tournamentGroups = [...tripsByTournament.values()].sort(
    (a, b) => new Date(a[0].tournaments.starts_on) - new Date(b[0].tournaments.starts_on)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Klub — {clubName}</h1>

      {error && <ErrorBox>Nie udało się wczytać danych klubu: {error}</ErrorBox>}
      {loading && <p style={{ color: "var(--color-text-muted)" }}>Wczytywanie…</p>}

      {!loading && (
        <>
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 15 }}>Nadchodzące wyjazdy klubowe</h2>
            {tournamentGroups.length === 0 && (
              <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                Nikt z klubu jeszcze nie zgłosił wyjazdu na nadchodzący turniej.
              </p>
            )}
            {tournamentGroups.map((group) => {
              const tournament = group[0].tournaments;
              return (
                <div key={tournament.id} className="glass-card">
                  <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15 }}>{tournament.name}</p>
                  <p style={{ margin: "0 0 10px", color: "var(--color-text-muted)", fontSize: 13 }}>
                    {tournament.city ?? "Miasto nieznane"} · {formatRange(tournament.starts_on, tournament.ends_on)}
                  </p>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <span className="badge-verified">
                      🎾 Jedzie {group.length}:{" "}
                      {group.map((t) => t.players?.first_name).filter(Boolean).join(", ")}
                    </span>
                  </p>
                </div>
              );
            })}
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 15 }}>Zawodnicy klubu ({players.length})</h2>
            {players.length === 0 && (
              <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                Jeszcze nikt nie wpisał tego klubu w profilu zawodnika.
              </p>
            )}
            {players.map((p) => (
              <div key={p.id} className="glass-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="avatar-circle" style={{ width: 40, height: 40, fontSize: 14 }}>
                  {p.first_name[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                    {p.first_name} {p.last_name}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                    {p.category ? `${p.category} · ` : ""}rocznik {p.birth_year}
                    {p.city ? ` · ${p.city}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
