import { useState } from "react";
import { MOCK_PARENT_PROFILE, MOCK_PLAYER_PROFILE } from "../mockData.js";

export default function ProfilePage() {
  const [view, setView] = useState("parent"); // "parent" | "player"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Profil</h1>

      {/* "Szybka zmiana widoku" z docs/UX_Branding_Tennis_Together.docx —
          rodzic jednym kliknięciem przełącza się między swoim profilem
          a profilem dziecka. */}
      <div className="segmented">
        <button className={view === "parent" ? "is-active" : ""} onClick={() => setView("parent")}>
          👤 Rodzic
        </button>
        <button className={view === "player" ? "is-active" : ""} onClick={() => setView("player")}>
          🎾 Zawodnik
        </button>
      </div>

      {view === "parent" ? <ParentProfile /> : <PlayerProfile />}
    </div>
  );
}

function ParentProfile() {
  const p = MOCK_PARENT_PROFILE;
  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="avatar-circle" style={{ width: 48, height: 48, fontSize: 16 }}>
          {p.fullName[0]}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>{p.fullName}</p>
          {p.verified && <span className="badge-verified">🛡️ Parent Verified</span>}
        </div>
      </div>

      <div>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--color-text-muted)" }}>Telefon</p>
        <p style={{ margin: 0 }}>{p.phone}</p>
      </div>

      <div>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--color-text-muted)" }}>Zgody</p>
        {p.consents.map((c) => (
          <div key={c.type} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span>{c.type}</span>
            <span className="status-pill ok">udzielona {c.date}</span>
          </div>
        ))}
      </div>

      <div>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--color-text-muted)" }}>
          Historia wyjazdów
        </p>
        <p style={{ margin: 0 }}>{p.completedTrips} zakończone wyjazdy</p>
      </div>

      <button className="btn-ghost" style={{ alignSelf: "flex-start" }}>
        Edytuj profil
      </button>
    </div>
  );
}

function PlayerProfile() {
  const p = MOCK_PLAYER_PROFILE;
  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="avatar-circle" style={{ width: 48, height: 48, fontSize: 16 }}>
          {p.firstName[0]}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>
            {p.firstName} {p.lastName}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
            {p.category} · rocznik {p.birthYear}
          </p>
        </div>
      </div>

      <Field label="Klub / akademia" value={p.club} />
      <Field label="Miasto" value={p.city} />
      <Field label="Ranking Tennis Europe" value={`#${p.rankingTE}`} />

      <button className="btn-ghost" style={{ alignSelf: "flex-start" }}>
        Edytuj profil zawodnika
      </button>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-muted)" }}>{label}</p>
      <p style={{ margin: 0 }}>{value}</p>
    </div>
  );
}
