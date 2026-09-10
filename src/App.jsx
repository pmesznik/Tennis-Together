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

export default function App() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
        <strong>🎾 Tennis Together</strong>
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
          borderTop: "1px solid #e2e8f0",
          background: "#fff",
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
              color: isActive ? "#0f172a" : "#64748b",
              fontWeight: isActive ? 600 : 400,
              borderTop: isActive ? "2px solid #0f172a" : "2px solid transparent",
            })}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
