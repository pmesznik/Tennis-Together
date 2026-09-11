import { useState } from "react";
import { MOCK_TRIPS } from "../mockData.js";

const FILTERS = [
  { key: "upcoming", label: "Nadchodzące" },
  { key: "organizing", label: "W trakcie organizacji" },
  { key: "completed", label: "Zakończone" },
];

export default function TripsPage() {
  const [filter, setFilter] = useState("upcoming");
  const visible = MOCK_TRIPS.filter((t) => t.status === filter);

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

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((t) => (
          <div key={t.id} className="glass-card">
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 16 }}>{t.tournament}</p>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-muted)" }}>
              {t.dates} · {t.participants} os. w grupie
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <Row label="🚗 Transport" status={t.transportStatus} />
              <Row label="🏨 Nocleg" status={t.lodgingStatus} />
              <Row label="💰 Koszt" status={{ label: t.costEstimate, state: "muted" }} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary">Otwórz kartę wyjazdu</button>
              <button className="btn-ghost">💬 Czat grupy</button>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p style={{ color: "var(--color-text-muted)" }}>Brak wyjazdów w tej kategorii.</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, status }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{label}</span>
      <span className={`status-pill ${status.state}`}>{status.label}</span>
    </div>
  );
}
