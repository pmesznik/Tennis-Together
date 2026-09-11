import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { usePlayers } from "../lib/usePlayers.js";
import { useTrips } from "../lib/useTrips.js";
import { useClubRoster } from "../lib/useClubRoster.js";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });

function formatRange(startsOn, endsOn) {
  const start = dateFormatter.format(new Date(startsOn));
  if (!endsOn || endsOn === startsOn) return start;
  return `${start}–${dateFormatter.format(new Date(endsOn))}`;
}

const FIRST_NAME_GREETING = (fullName) => (fullName ?? "").trim().split(/\s+/)[0] || null;

const QUICK_LINKS = [
  { to: "/turnieje", icon: "🎾", label: "Turnieje" },
  { to: "/przejazdy", icon: "🚗", label: "Przejazdy" },
  { to: "/noclegi", icon: "🏨", label: "Noclegi" },
  { to: "/wiadomosci", icon: "💬", label: "Wiadomości" },
];

// Ekran Start jako prawdziwy dashboard (wcześniej: podgląd stylu na
// przykładowych danych, patrz git history) — powitanie, najbliższy
// prawdziwy wyjazd (albo podpowiedź kolejnego kroku, gdy go jeszcze nie ma)
// i skróty do głównych zakładek.
export default function StartPage() {
  const { account } = useAuth();
  const { players, loading: playersLoading } = usePlayers(account?.id);
  const { trips, loading: tripsLoading } = useTrips(account?.id);
  const { players: clubPlayers, trips: clubTrips } = useClubRoster(
    account?.role === "coach" ? account.club_name : null
  );

  const loading = playersLoading || tripsLoading;
  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrips = trips
    .filter((t) => t.tournaments && t.tournaments.starts_on >= today)
    .sort((a, b) => new Date(a.tournaments.starts_on) - new Date(b.tournaments.starts_on));
  const nextTrip = upcomingTrips[0];

  const firstName = FIRST_NAME_GREETING(account?.full_name);
  const clubUpcomingCount = clubTrips.filter((t) => t.tournaments && t.tournaments.starts_on >= today).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0 }}>{firstName ? `Cześć, ${firstName}! 👋` : "Cześć! 👋"}</h1>
        <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: 13 }}>
          Tu znajdziesz swój najbliższy wyjazd i szybkie skróty do całej aplikacji.
        </p>
      </div>

      {!loading && (
        <>
          {players.length === 0 ? (
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Zacznij od dodania zawodnika</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                Żeby zgłosić wyjazd na turniej i znaleźć dla niego przejazd czy nocleg, najpierw
                potrzebujemy profilu zawodnika.
              </p>
              <Link className="btn-primary" to="/profil" style={{ alignSelf: "flex-start" }}>
                Dodaj zawodnika
              </Link>
            </div>
          ) : nextTrip ? (
            <div className="glass-card">
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>
                Najbliższy wyjazd — {nextTrip.players?.first_name}
              </p>
              <p style={{ margin: "4px 0 12px", fontWeight: 700 }}>
                {nextTrip.tournaments.name} — {nextTrip.tournaments.city ?? "miasto nieznane"},{" "}
                {formatRange(nextTrip.tournaments.starts_on, nextTrip.tournaments.ends_on)}
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-muted)" }}>
                Wyjazd z: {nextTrip.departure_city}
              </p>
              <Link className="btn-primary" to="/moje-wyjazdy">
                Zobacz w Moich wyjazdach
              </Link>
            </div>
          ) : (
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Nie masz jeszcze zgłoszonego wyjazdu</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                Przeglądaj kalendarz turniejów i kliknij „Jadę na ten turniej”, żeby zacząć szukać
                przejazdu i noclegu.
              </p>
              <Link className="btn-primary" to="/turnieje" style={{ alignSelf: "flex-start" }}>
                Znajdź turniej
              </Link>
            </div>
          )}

          {account?.role === "coach" && account.club_name && (
            <Link to="/klub" className="glass-card" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
              <div className="avatar-circle" style={{ width: 40, height: 40, fontSize: 18 }}>
                🏆
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Klub — {account.club_name}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                  {clubPlayers.length} zawodników · {clubUpcomingCount} zgłoszonych wyjazdów
                </p>
              </div>
            </Link>
          )}
        </>
      )}

      <div>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text-muted)" }}>Skróty</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="glass-card"
              style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
            >
              <span style={{ fontSize: 20 }}>{link.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
