import { useState } from "react";
import { useTournaments, sourceLabel } from "../lib/useTournaments.js";
import ErrorBox from "../components/ErrorBox.jsx";

const SOURCES = [
  { key: "all", label: "Wszystkie" },
  { key: "otk", label: "OTK" },
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
  const { tournaments, loading, error } = useTournaments();

  const visible = tournaments.filter((t) => source === "all" || t.source === source);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Turnieje</h1>

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
        <button className="chip">📍 Dystans</button>
        <button className="chip">🎾 Kategoria wiekowa</button>
      </div>

      {error && <ErrorBox>Nie udało się wczytać turniejów: {error}</ErrorBox>}
      {loading && <p style={{ color: "var(--color-text-muted)" }}>Wczytywanie…</p>}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((t) => (
            <div key={t.id} className="glass-card">
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

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn-primary">Jadę na ten turniej</button>
                {t.website_url && (
                  <a className="btn-ghost" href={t.website_url} target="_blank" rel="noreferrer">
                    Strona turnieju
                  </a>
                )}
              </div>
            </div>
          ))}
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
        Kalendarz OTK jest importowany automatycznie codziennie ze scrapera
        PZT. Tennis Europe i ITF na start dodawane ręcznie / przez zgłoszenia
        (patrz PLAN.md). Przycisk „Jadę na ten turniej” jeszcze nic nie
        zapisuje — to następny krok.
      </p>
    </div>
  );
}
