import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { useTrips } from "../lib/useTrips.js";
import { useLodgingOffers } from "../lib/useLodging.js";
import ErrorBox from "../components/ErrorBox.jsx";
import { inputStyle, labelStyle } from "../components/formStyles.js";

const KIND_LABELS = {
  shared_booking: "Wspólny hotel/apartament",
  roommate_wanted: "Szukam współlokatora",
};

export default function LodgingPage() {
  const [showForm, setShowForm] = useState(false);
  const { account } = useAuth();
  const { trips } = useTrips(account?.id);
  const { offers, loading, error, createOffer } = useLodgingOffers();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Noclegi</h1>

      {error && <ErrorBox>Nie udało się wczytać ofert noclegowych: {error}</ErrorBox>}
      {loading && <p style={{ color: "var(--color-text-muted)" }}>Wczytywanie…</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!loading &&
          offers.map((l) => (
            <div key={l.id} className="glass-card">
              <span className="status-pill muted">{KIND_LABELS[l.kind] ?? l.kind}</span>
              <p style={{ margin: "8px 0 4px", fontWeight: 700 }}>{l.trips?.tournaments?.name ?? "Turniej"}</p>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text-muted)" }}>
                {l.place_name || `${l.trips?.departure_city ?? "?"} · ${l.trips?.players?.first_name ?? "Zawodnik"}`}
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {l.free_spots != null && <span className="status-pill ok">{l.free_spots} wolne miejsce</span>}
                {l.budget_per_night != null && (
                  <span className="status-pill muted">{l.budget_per_night} zł/os./noc</span>
                )}
              </div>
              {l.notes && <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-muted)" }}>{l.notes}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary">Dołącz (wkrótce)</button>
              </div>
            </div>
          ))}
        {!loading && offers.length === 0 && (
          <p style={{ color: "var(--color-text-muted)" }}>Nikt jeszcze nie dodał ogłoszenia noclegowego.</p>
        )}

        {/* Nocleg u rodziny — odłożony na etap 2 (patrz PLAN.md: wymaga
            weryfikacji tożsamości i konsultacji prawnej). Zostaje widoczny
            na liście, żeby użytkownicy wiedzieli, że funkcja jest planowana,
            ale wyszarzony i bez akcji. Nie ma odpowiednika w schemacie bazy
            (kind dopuszcza tylko shared_booking/roommate_wanted). */}
        <div className="glass-card card-disabled">
          <span className="status-pill muted">Nocleg u zawodnika</span>
          <p style={{ margin: "8px 0 4px", fontWeight: 700 }}>
            Rodzina przyjmuje zawodnika na czas turnieju
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
            Ta funkcja wymaga dodatkowej weryfikacji i zgody rodzica dla
            osoby niepełnoletniej — pracujemy nad bezpiecznymi zasadami.
          </p>
        </div>
      </div>

      <button className="btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => setShowForm((v) => !v)}>
        {showForm ? "Anuluj" : "+ Dodaj ogłoszenie noclegowe"}
      </button>

      {showForm && <AddLodgingForm trips={trips} createOffer={createOffer} onDone={() => setShowForm(false)} />}

      <p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
        „Dołącz" — następny krok (wymaga ekranu zarządzania prośbami, jak w
        Przejazdach).
      </p>
    </div>
  );
}

function AddLodgingForm({ trips, createOffer, onDone }) {
  const [kind, setKind] = useState("shared_booking");
  const [tripId, setTripId] = useState(trips[0]?.id ?? "");
  const [placeName, setPlaceName] = useState("");
  const [freeSpots, setFreeSpots] = useState(1);
  const [budgetPerNight, setBudgetPerNight] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (trips.length === 0) {
    return (
      <div className="glass-card">
        <p style={{ margin: "0 0 12px", fontSize: 13 }}>
          Najpierw zgłoś wyjazd na turniej — dopiero wtedy możesz dodać do niego ogłoszenie noclegowe.
        </p>
        <Link className="btn-primary" to="/turnieje">
          Wybierz turniej
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await createOffer({
      tripId,
      kind,
      placeName,
      freeSpots: Number(freeSpots) || null,
      budgetPerNight: budgetPerNight ? Number(budgetPerNight) : null,
      notes,
    });
    setBusy(false);
    if (error) {
      setError(error.message || "Nie udało się dodać ogłoszenia.");
      return;
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <label style={labelStyle}>Rodzaj</label>
        <div className="chip-row">
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip ${kind === value ? "is-active" : ""}`}
              onClick={() => setKind(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Który wyjazd?</label>
        <div className="chip-row">
          {trips.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${tripId === t.id ? "is-active" : ""}`}
              onClick={() => setTripId(t.id)}
            >
              {t.tournaments?.name ?? "Turniej"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Miejsce (opcjonalnie)</label>
        <input
          style={inputStyle}
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="np. Apartament 3-osobowy, 800m od kortów"
        />
      </div>
      <div>
        <label style={labelStyle}>Wolne miejsca (opcjonalnie)</label>
        <input style={inputStyle} type="number" min="1" value={freeSpots} onChange={(e) => setFreeSpots(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Budżet za noc/os. w zł (opcjonalnie)</label>
        <input
          style={inputStyle}
          type="number"
          min="0"
          value={budgetPerNight}
          onChange={(e) => setBudgetPerNight(e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>Uwagi (opcjonalnie)</label>
        <input style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      <button className="btn-primary" type="submit" disabled={busy}>
        {busy ? "Zapisuję…" : "Dodaj ogłoszenie"}
      </button>
    </form>
  );
}
