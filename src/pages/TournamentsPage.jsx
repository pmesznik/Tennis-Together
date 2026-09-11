import { useState } from "react";
import { MOCK_TOURNAMENTS } from "../mockData.js";

const SOURCES = ["Wszystkie", "OTK", "Tennis Europe", "ITF"];

export default function TournamentsPage() {
  const [source, setSource] = useState("Wszystkie");

  const visible = MOCK_TOURNAMENTS.filter(
    (t) => source === "Wszystkie" || t.source === source
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Turnieje</h1>

      <div className="chip-row">
        {SOURCES.map((s) => (
          <button
            key={s}
            className={`chip ${source === s ? "is-active" : ""}`}
            onClick={() => setSource(s)}
          >
            {s}
          </button>
        ))}
        <button className="chip">📍 Dystans</button>
        <button className="chip">📅 Data</button>
        <button className="chip">🎾 Kategoria wiekowa</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((t) => (
          <div key={t.id} className="glass-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <span className="status-pill muted">{t.source}</span>
                <p style={{ margin: "8px 0 2px", fontWeight: 700, fontSize: 16 }}>{t.name}</p>
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>
                  {t.city} · {t.category} · {t.startsOn}–{t.endsOn}
                </p>
              </div>
              <div className="avatar-circle" title="Kategoria wiekowa">
                {t.category}
              </div>
            </div>

            <p style={{ margin: "12px 0", fontSize: 13, color: "var(--color-text-muted)" }}>
              {t.interested > 0
                ? `👥 ${t.interested} zawodników już jedzie na ten turniej`
                : "Bądź pierwszą osobą, która zgłosi wyjazd"}
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary">Jadę na ten turniej</button>
              <button className="btn-ghost">Szczegóły</button>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p style={{ color: "var(--color-text-muted)" }}>Brak turniejów dla tego filtra.</p>
        )}
      </div>

      <p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
        Kalendarz OTK docelowo importowany automatycznie ze scrapera PZT.
        Tennis Europe i ITF na start dodawane ręcznie / przez zgłoszenia
        (patrz PLAN.md). Powyżej dane przykładowe.
      </p>
    </div>
  );
}
