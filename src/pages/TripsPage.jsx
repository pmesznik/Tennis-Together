import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { useTrips } from "../lib/useTrips.js";
import ErrorBox from "../components/ErrorBox.jsx";

const FILTERS = [
  { key: "upcoming", label: "Nadchodzące" },
  { key: "organizing", label: "W trakcie organizacji" },
  { key: "completed", label: "Zakończone" },
];

const dateFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });

function formatRange(startsOn, endsOn) {
  if (!startsOn) return "termin nieznany";
  const start = dateFormatter.format(new Date(startsOn));
  if (!endsOn || endsOn === startsOn) return start;
  return `${start}–${dateFormatter.format(new Date(endsOn))}`;
}

// Klasyfikacja karty do zakładki: "zakończone" po dacie turnieju albo po
// jawnym statusie; reszta dzieli się na "nadchodzące" (status=confirmed) i
// "w trakcie organizacji" (status=planning — domyślny dla każdego nowego
// "Jadę na ten turniej", dopóki nikt niczego nie potwierdzi).
function classify(trip) {
  const startsOn = trip.tournaments?.starts_on;
  const isPast = startsOn ? new Date(startsOn) < new Date(new Date().toDateString()) : false;
  if (trip.status === "completed" || isPast) return "completed";
  if (trip.status === "confirmed") return "upcoming";
  return "organizing";
}

export default function TripsPage() {
  const [filter, setFilter] = useState("upcoming");
  const { account } = useAuth();
  const { trips, loading, error } = useTrips(account?.id);

  const visible = trips.filter((t) => classify(t) === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Moje wyjazdy</h1>

      <div className="chip-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? "is-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <ErrorBox>Nie udało się wczytać wyjazdów: {error}</ErrorBox>}
      {loading && <p style={{ color: "var(--color-text-muted)" }}>Wczytywanie…</p>}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((t) => (
            <div key={t.id} className="glass-card">
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 16 }}>
                {t.tournaments?.name ?? "Turniej"}
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-muted)" }}>
                {formatRange(t.tournaments?.starts_on, t.tournaments?.ends_on)} ·{" "}
                {t.players?.first_name} {t.players?.last_name} · wyjazd z {t.departure_city}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <Row label="🚗 Transport" text="Jeszcze nikt się nie zgłosił" state="muted" />
                <Row label="🏨 Nocleg" text="Jeszcze nikt się nie zgłosił" state="muted" />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost">💬 Czat grupy (wkrótce)</button>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <p style={{ color: "var(--color-text-muted)" }}>
              {trips.length === 0
                ? 'Nie masz jeszcze żadnego wyjazdu — zacznij od zakładki "Turnieje" i przycisku "Jadę na ten turniej".'
                : "Brak wyjazdów w tej kategorii."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, text, state }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{label}</span>
      <span className={`status-pill ${state}`}>{text}</span>
    </div>
  );
}
