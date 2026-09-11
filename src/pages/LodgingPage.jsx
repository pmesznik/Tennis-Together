import { MOCK_LODGING_OFFERS } from "../mockData.js";

export default function LodgingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Noclegi</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MOCK_LODGING_OFFERS.map((l) => (
          <div key={l.id} className="glass-card">
            <span className="status-pill muted">{l.kind}</span>
            <p style={{ margin: "8px 0 4px", fontWeight: 700 }}>{l.tournament}</p>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text-muted)" }}>
              {l.place}
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span className="status-pill ok">{l.freeSpots} wolne miejsce</span>
              <span className="status-pill muted">{l.budgetPerNight}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary">Dołącz</button>
              <button className="btn-ghost">Napisz</button>
            </div>
          </div>
        ))}

        {/* Nocleg u rodziny — odłożony na etap 2 (patrz PLAN.md: wymaga
            weryfikacji tożsamości i konsultacji prawnej). Zostaje widoczny
            na liście, żeby użytkownicy wiedzieli, że funkcja jest planowana,
            ale wyszarzony i bez akcji. */}
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

      <button className="btn-primary" style={{ alignSelf: "flex-start" }}>
        + Dodaj ogłoszenie noclegowe
      </button>

      <p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
        Powyżej dane przykładowe.
      </p>
    </div>
  );
}
