import { useState } from "react";
import { MOCK_PARENT_PROFILE, MOCK_PLAYER_PROFILE } from "../mockData.js";
import { useAuth } from "../lib/AuthContext.jsx";

const ROLE_LABELS = {
  parent: "Rodzic",
  guardian: "Opiekun",
  coach: "Trener / klub",
  player_adult: "Zawodnik (16+)",
};

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
  const { account, user, signOut } = useAuth();
  // Zgody i historia wyjazdów nie są jeszcze podłączone pod `consents`/`trips`
  // (patrz PLAN.md, "Następne kroki") — na razie dane przykładowe, reszta
  // karty (imię, rola, e-mail, wylogowanie) jest już prawdziwa.
  const mock = MOCK_PARENT_PROFILE;
  const displayName = account?.full_name || user?.email || "…";

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="avatar-circle" style={{ width: 48, height: 48, fontSize: 16 }}>
          {displayName[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>{displayName}</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
            {account ? ROLE_LABELS[account.role] ?? account.role : "…"}
          </p>
          {account?.verified && <span className="badge-verified">🛡️ Parent Verified</span>}
        </div>
      </div>

      <div>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--color-text-muted)" }}>E-mail</p>
        <p style={{ margin: 0 }}>{user?.email}</p>
      </div>

      <div>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--color-text-muted)" }}>
          Zgody <span style={{ opacity: 0.6 }}>(przykładowe — jeszcze nie z bazy)</span>
        </p>
        {mock.consents.map((c) => (
          <div key={c.type} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span>{c.type}</span>
            <span className="status-pill ok">udzielona {c.date}</span>
          </div>
        ))}
      </div>

      <div>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--color-text-muted)" }}>
          Historia wyjazdów <span style={{ opacity: 0.6 }}>(przykładowe)</span>
        </p>
        <p style={{ margin: 0 }}>{mock.completedTrips} zakończone wyjazdy</p>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-ghost">Edytuj profil</button>
        <button className="btn-ghost" onClick={signOut}>
          Wyloguj
        </button>
      </div>
    </div>
  );
}

function PlayerProfile() {
  // Cała karta jest jeszcze na danych przykładowych — profile zawodników
  // (tabela `players`) nie mają jeszcze ekranu dodawania, patrz PLAN.md.
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
