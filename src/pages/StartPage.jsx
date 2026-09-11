export default function StartPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Start</h1>

      <div className="glass-card">
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>
          Najbliższy turniej
        </p>
        <p style={{ margin: "4px 0 12px", fontWeight: 700 }}>
          Tennis Europe U16 — Zabrze, 12–16 maja
        </p>
        <p style={{ margin: "0 0 12px" }}>
          „Znaleziono 2 wolne miejsca w aucie z Katowic”
          <br />
          <span className="badge-verified">🛡️ Kierowca: Rodzic Jan M. — zweryfikowany</span>
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary">Jadę na ten turniej</button>
          <button className="btn-secondary">Zobacz przejazd</button>
        </div>
      </div>

      <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
        To jest podgląd stylu („Neon Court &amp; Cyber Clay”, patrz
        docs/UX_Branding_Tennis_Together.docx). Docelowo ekran Start pokazuje
        realne dopasowania, a nie przykładowe dane.
      </p>
    </div>
  );
}
