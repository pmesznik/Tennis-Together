import { useEffect, useState } from "react";
import { MOCK_PARENT_PROFILE } from "../mockData.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { usePlayers } from "../lib/usePlayers.js";
import ErrorBox from "../components/ErrorBox.jsx";
import { inputStyle, labelStyle } from "../components/formStyles.js";

const ROLE_LABELS = {
  parent: "Rodzic",
  guardian: "Opiekun",
  coach: "Trener / klub",
  player_adult: "Zawodnik (16+)",
};

const CATEGORIES = ["U10", "U12", "U14", "U16", "U18", "Senior"];

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

      {view === "parent" ? <ParentProfile /> : <PlayerSection />}
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

function PlayerSection() {
  const { account } = useAuth();
  const { players, loading, error, addPlayer } = usePlayers(account?.id);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Gdy lista się wczyta, domyślnie pokaż pierwszego zawodnika; gdy nikogo
  // jeszcze nie ma, od razu pokaż formularz dodawania zamiast pustej karty.
  useEffect(() => {
    if (loading) return;
    if (players.length === 0) {
      setShowForm(true);
      setSelectedId(null);
    } else if (!selectedId || !players.some((p) => p.id === selectedId)) {
      setSelectedId(players[0].id);
      setShowForm(false);
    }
  }, [players, loading, selectedId]);

  if (!account) {
    return <p style={{ color: "var(--color-text-muted)" }}>Wczytywanie konta…</p>;
  }

  if (loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Wczytywanie zawodników…</p>;
  }

  const selected = players.find((p) => p.id === selectedId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {error && <ErrorBox>Nie udało się wczytać zawodników: {error}</ErrorBox>}

      {players.length > 0 && (
        <div className="chip-row">
          {players.map((p) => (
            <button
              key={p.id}
              className={`chip ${selectedId === p.id && !showForm ? "is-active" : ""}`}
              onClick={() => {
                setSelectedId(p.id);
                setShowForm(false);
              }}
            >
              {p.first_name}
            </button>
          ))}
          <button className={`chip ${showForm ? "is-active" : ""}`} onClick={() => setShowForm(true)}>
            + Dodaj zawodnika
          </button>
        </div>
      )}

      {showForm ? (
        <AddPlayerForm
          addPlayer={addPlayer}
          onAdded={(player) => {
            setSelectedId(player.id);
            setShowForm(false);
          }}
          onCancel={players.length > 0 ? () => setShowForm(false) : undefined}
        />
      ) : selected ? (
        <PlayerCard player={selected} />
      ) : null}
    </div>
  );
}

function PlayerCard({ player: p }) {
  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="avatar-circle" style={{ width: 48, height: 48, fontSize: 16 }}>
          {p.first_name[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>
            {p.first_name} {p.last_name}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
            {p.category ? `${p.category} · ` : ""}rocznik {p.birth_year}
          </p>
        </div>
      </div>

      {p.club_name && <Field label="Klub / akademia" value={p.club_name} />}
      {p.city && <Field label="Miasto" value={p.city} />}
      {p.ranking_te != null && <Field label="Ranking Tennis Europe" value={`#${p.ranking_te}`} />}

      <button className="btn-ghost" style={{ alignSelf: "flex-start" }}>
        Edytuj profil zawodnika
      </button>
    </div>
  );
}

function AddPlayerForm({ addPlayer, onAdded, onCancel }) {
  const { account } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [category, setCategory] = useState("U12");
  const [clubName, setClubName] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const year = Number(birthYear);
    if (!year || year < 1990 || year > new Date().getFullYear()) {
      setError("Podaj poprawny rok urodzenia.");
      return;
    }

    setBusy(true);
    const { data, error } = await addPlayer({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birth_year: year,
      category,
      club_name: clubName.trim() || null,
      city: city.trim() || null,
    });
    setBusy(false);

    if (error) {
      setError(error.message || "Nie udało się dodać zawodnika. Spróbuj ponownie.");
      return;
    }
    onAdded(data);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ margin: 0, fontWeight: 700 }}>Dodaj zawodnika</p>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Imię</label>
          <input style={inputStyle} required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Nazwisko</label>
          <input style={inputStyle} required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Rok urodzenia</label>
        <input
          style={inputStyle}
          type="number"
          required
          min="1990"
          max={new Date().getFullYear()}
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
        />
      </div>

      <div>
        <label style={labelStyle}>Kategoria wiekowa</label>
        <div className="chip-row">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${category === c ? "is-active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Klub / akademia (opcjonalnie)</label>
        <input style={inputStyle} value={clubName} onChange={(e) => setClubName(e.target.value)} />
      </div>

      <div>
        <label style={labelStyle}>Miasto (opcjonalnie)</label>
        <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary" type="submit" disabled={busy || !account}>
          {busy ? "Dodaję…" : "Dodaj zawodnika"}
        </button>
        {onCancel && (
          <button className="btn-ghost" type="button" onClick={onCancel}>
            Anuluj
          </button>
        )}
      </div>
    </form>
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
