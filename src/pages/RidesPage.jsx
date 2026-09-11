import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { useTrips } from "../lib/useTrips.js";
import { useRideOffers, useRideRequests } from "../lib/useRides.js";
import ErrorBox from "../components/ErrorBox.jsx";
import { inputStyle, labelStyle } from "../components/formStyles.js";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });

function tripLabel(trip) {
  const t = trip?.tournaments;
  if (!t) return "Turniej";
  const date = t.starts_on ? dateFormatter.format(new Date(t.starts_on)) : "termin nieznany";
  return `${t.name} (${date})`;
}

export default function RidesPage() {
  const [tab, setTab] = useState("offers"); // "offers" | "requests"
  const [showForm, setShowForm] = useState(false);
  const { account } = useAuth();
  const { trips } = useTrips(account?.id);
  const { offers, loading: offersLoading, error: offersError, createOffer } = useRideOffers();
  const { requests, loading: requestsLoading, error: requestsError, createRequest } = useRideRequests();

  const switchTab = (t) => {
    setTab(t);
    setShowForm(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Przejazdy</h1>

      <div className="segmented">
        <button className={tab === "offers" ? "is-active" : ""} onClick={() => switchTab("offers")}>
          Mam wolne miejsce
        </button>
        <button className={tab === "requests" ? "is-active" : ""} onClick={() => switchTab("requests")}>
          Szukam przejazdu
        </button>
      </div>

      <button className="btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => setShowForm((v) => !v)}>
        {showForm ? "Anuluj" : tab === "offers" ? "+ Mam wolne miejsce" : "+ Szukam przejazdu"}
      </button>

      {showForm &&
        (tab === "offers" ? (
          <AddOfferForm trips={trips} createOffer={createOffer} onDone={() => setShowForm(false)} />
        ) : (
          <AddRequestForm trips={trips} createRequest={createRequest} onDone={() => setShowForm(false)} />
        ))}

      {tab === "offers" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {offersError && <ErrorBox>Nie udało się wczytać ofert: {offersError}</ErrorBox>}
          {offersLoading && <p style={{ color: "var(--color-text-muted)" }}>Wczytywanie…</p>}
          {!offersLoading &&
            offers.map((r) => (
              <div key={r.id} className="glass-card">
                <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{r.trips?.tournaments?.name ?? "Turniej"}</p>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text-muted)" }}>
                  🚗 {r.trips?.departure_city ?? "?"} · {r.trips?.players?.first_name ?? "Zawodnik"}
                  {r.trips?.departure_date ? ` · wyjazd ${dateFormatter.format(new Date(r.trips.departure_date))}` : ""}
                </p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className="status-pill ok">{r.free_seats} wolne miejsca</span>
                  {r.luggage_space && <span className="status-pill muted">🧳 {r.luggage_space}</span>}
                  {r.cost_split_suggestion && <span className="status-pill muted">{r.cost_split_suggestion}</span>}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary">Poproś o miejsce (wkrótce)</button>
                </div>
              </div>
            ))}
          {!offersLoading && offers.length === 0 && (
            <p style={{ color: "var(--color-text-muted)" }}>Nikt jeszcze nie zgłosił wolnego miejsca.</p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requestsError && <ErrorBox>Nie udało się wczytać próśb: {requestsError}</ErrorBox>}
          {requestsLoading && <p style={{ color: "var(--color-text-muted)" }}>Wczytywanie…</p>}
          {!requestsLoading &&
            requests.map((r) => (
              <div key={r.id} className="glass-card">
                <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{r.trips?.tournaments?.name ?? "Turniej"}</p>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text-muted)" }}>
                  Wyjazd z: {r.trips?.departure_city ?? "?"} · {r.trips?.players?.first_name ?? "Zawodnik"} · potrzebne
                  miejsca: {r.seats_needed}
                </p>
                {r.notes && (
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-muted)" }}>{r.notes}</p>
                )}
                <button className="btn-secondary">Zaproponuj przejazd (wkrótce)</button>
              </div>
            ))}
          {!requestsLoading && requests.length === 0 && (
            <p style={{ color: "var(--color-text-muted)" }}>Nikt jeszcze nie szuka przejazdu.</p>
          )}
        </div>
      )}

      <p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
        Aplikacja docelowo dopasowuje ogłoszenia automatycznie po turnieju,
        terminie i trasie. „Poproś o miejsce" / akceptacja próśb — następny krok.
      </p>
    </div>
  );
}

function NoTripsNotice() {
  return (
    <div className="glass-card">
      <p style={{ margin: "0 0 12px", fontSize: 13 }}>
        Najpierw zgłoś wyjazd na turniej — dopiero wtedy możesz dodać do niego przejazd.
      </p>
      <Link className="btn-primary" to="/turnieje">
        Wybierz turniej
      </Link>
    </div>
  );
}

function AddOfferForm({ trips, createOffer, onDone }) {
  const [tripId, setTripId] = useState(trips[0]?.id ?? "");
  const [freeSeats, setFreeSeats] = useState(1);
  const [luggageSpace, setLuggageSpace] = useState("");
  const [costSplitSuggestion, setCostSplitSuggestion] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (trips.length === 0) return <NoTripsNotice />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await createOffer({
      tripId,
      freeSeats: Number(freeSeats) || 1,
      luggageSpace,
      costSplitSuggestion,
    });
    setBusy(false);
    if (error) {
      setError(error.message || "Nie udało się dodać oferty.");
      return;
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <TripPicker trips={trips} value={tripId} onChange={setTripId} />
      <div>
        <label style={labelStyle}>Liczba wolnych miejsc</label>
        <input
          style={inputStyle}
          type="number"
          min="1"
          value={freeSeats}
          onChange={(e) => setFreeSeats(e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>Miejsce na bagaż (opcjonalnie)</label>
        <input style={inputStyle} value={luggageSpace} onChange={(e) => setLuggageSpace(e.target.value)} placeholder="np. 2 torby + rakiety" />
      </div>
      <div>
        <label style={labelStyle}>Proponowany podział kosztów (opcjonalnie)</label>
        <input
          style={inputStyle}
          value={costSplitSuggestion}
          onChange={(e) => setCostSplitSuggestion(e.target.value)}
          placeholder="np. 40 zł/os. za paliwo"
        />
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      <button className="btn-primary" type="submit" disabled={busy}>
        {busy ? "Zapisuję…" : "Dodaj ofertę"}
      </button>
    </form>
  );
}

function AddRequestForm({ trips, createRequest, onDone }) {
  const [tripId, setTripId] = useState(trips[0]?.id ?? "");
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (trips.length === 0) return <NoTripsNotice />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await createRequest({ tripId, seatsNeeded: Number(seatsNeeded) || 1, notes });
    setBusy(false);
    if (error) {
      setError(error.message || "Nie udało się dodać prośby.");
      return;
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <TripPicker trips={trips} value={tripId} onChange={setTripId} />
      <div>
        <label style={labelStyle}>Potrzebne miejsca</label>
        <input
          style={inputStyle}
          type="number"
          min="1"
          value={seatsNeeded}
          onChange={(e) => setSeatsNeeded(e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>Uwagi (opcjonalnie)</label>
        <input style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="np. elastyczne godziny wyjazdu" />
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      <button className="btn-primary" type="submit" disabled={busy}>
        {busy ? "Zapisuję…" : "Dodaj prośbę"}
      </button>
    </form>
  );
}

function TripPicker({ trips, value, onChange }) {
  return (
    <div>
      <label style={labelStyle}>Który wyjazd?</label>
      <div className="chip-row">
        {trips.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${value === t.id ? "is-active" : ""}`}
            onClick={() => onChange(t.id)}
          >
            {tripLabel(t)}
          </button>
        ))}
      </div>
    </div>
  );
}
