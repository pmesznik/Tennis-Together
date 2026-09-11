import { useState } from "react";
import { MOCK_RIDE_OFFERS, MOCK_RIDE_REQUESTS } from "../mockData.js";

export default function RidesPage() {
  const [tab, setTab] = useState("offers"); // "offers" | "requests"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Przejazdy</h1>

      <div className="segmented">
        <button className={tab === "offers" ? "is-active" : ""} onClick={() => setTab("offers")}>
          Mam wolne miejsce
        </button>
        <button className={tab === "requests" ? "is-active" : ""} onClick={() => setTab("requests")}>
          Szukam przejazdu
        </button>
      </div>

      {tab === "offers" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MOCK_RIDE_OFFERS.map((r) => (
            <div key={r.id} className="glass-card">
              <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{r.tournament}</p>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text-muted)" }}>
                🚗 {r.from} → wyjazd {r.departureAt} · powrót {r.returnAt}
              </p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <span className="status-pill ok">{r.freeSeats} wolne miejsca</span>
                <span className="status-pill muted">🧳 {r.luggage}</span>
                <span className="status-pill muted">{r.costSplit}</span>
              </div>

              <p style={{ margin: "0 0 12px", fontSize: 13 }}>
                <span className="badge-verified">
                  🛡️ Kierowca: {r.driver}
                  {r.verified ? " — zweryfikowany" : ""}
                </span>
              </p>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary">Poproś o miejsce</button>
                <button className="btn-ghost">Napisz</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MOCK_RIDE_REQUESTS.map((r) => (
            <div key={r.id} className="glass-card">
              <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{r.tournament}</p>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text-muted)" }}>
                Wyjazd z: {r.from} · potrzebne miejsca: {r.seatsNeeded}
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-muted)" }}>
                {r.notes}
              </p>
              <button className="btn-secondary">Zaproponuj przejazd</button>
            </div>
          ))}
          <button className="btn-primary" style={{ alignSelf: "flex-start" }}>
            + Dodaj „Szukam przejazdu”
          </button>
        </div>
      )}

      <p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
        Aplikacja docelowo dopasowuje ogłoszenia automatycznie po turnieju,
        terminie i trasie. Powyżej dane przykładowe.
      </p>
    </div>
  );
}
