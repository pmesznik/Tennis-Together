import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import StartPage from "./pages/StartPage.jsx";
import TournamentsPage from "./pages/TournamentsPage.jsx";
import RidesPage from "./pages/RidesPage.jsx";
import LodgingPage from "./pages/LodgingPage.jsx";
import TripsPage from "./pages/TripsPage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

// Szkielet głównego menu z dokumentu założeń (Start / Turnieje / Przejazdy /
// Noclegi / Moje wyjazdy / Wiadomości / Profil). Każda zakładka na razie to
// placeholder — wypełniamy je w kolejnych etapach zgodnie z PLAN.md.
const TABS = [
  { to: "/", label: "Start", end: true },
  { to: "/turnieje", label: "Turnieje" },
  { to: "/przejazdy", label: "Przejazdy" },
  { to: "/noclegi", label: "Noclegi" },
  { to: "/moje-wyjazdy", label: "Moje wyjazdy" },
  { to: "/wiadomosci", label: "Wiadomości" },
  { to: "/profil", label: "Profil" },
];

const THEME_STORAGE_KEY = "tennis-together-theme";

// Dark Mode Premium jest domyślny z dokumentu UX (docs/UX_Branding_Tennis_Together.docx) —
// Light Mode jest świadomym wyborem użytkownika (np. pełne słońce na korcie),
// nie wynika z ustawień systemowych telefonu.
function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_STORAGE_KEY) || "dark"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return [theme, setTheme];
}

export default function App() {
  const [theme, setTheme] = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          borderBottom: "1px solid var(--color-card-border)",
        }}
      >
        <strong style={{ fontFamily: "var(--font-heading)" }}>🎾 Tennis Together</strong>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Przełącz tryb jasny/ciemny"
          style={{
            background: "transparent",
            border: "1px solid var(--color-card-border)",
            color: "var(--color-text)",
            borderRadius: 999,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {theme === "dark" ? "☀️ Jasny" : "🌙 Ciemny"}
        </button>
      </header>

      <main style={{ flex: 1, padding: "16px" }}>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/turnieje" element={<TournamentsPage />} />
          <Route path="/przejazdy" element={<RidesPage />} />
          <Route path="/noclegi" element={<LodgingPage />} />
          <Route path="/moje-wyjazdy" element={<TripsPage />} />
          <Route path="/wiadomosci" element={<MessagesPage />} />
          <Route path="/profil" element={<ProfilePage />} />
        </Routes>
      </main>

      <nav
        style={{
          display: "flex",
          overflowX: "auto",
          borderTop: "1px solid var(--color-card-border)",
          background: "var(--color-bg-elevated)",
          position: "sticky",
          bottom: 0,
        }}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              flex: "1 0 auto",
              padding: "10px 12px",
              textAlign: "center",
              textDecoration: "none",
              fontSize: 13,
              whiteSpace: "nowrap",
              color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
              fontWeight: isActive ? 700 : 400,
              borderTop: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
            })}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
