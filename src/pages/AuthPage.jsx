import { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../lib/AuthContext.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import { inputStyle, labelStyle } from "../components/formStyles.js";

const ROLES = [
  { value: "parent", label: "Rodzic" },
  { value: "guardian", label: "Opiekun" },
  { value: "coach", label: "Trener / klub" },
];

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: 0 }}>🎾</p>
          <h1 style={{ margin: "4px 0 0" }}>Tennis Together</h1>
          <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: 13 }}>
            Wspólne wyjazdy na turnieje tenisowe
          </p>
        </div>

        <div className="segmented">
          <button className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>
            Mam już konto
          </button>
          <button className={mode === "register" ? "is-active" : ""} onClick={() => setMode("register")}>
            Zakładam konto
          </button>
        </div>

        <div className="glass-card">{mode === "login" ? <LoginForm /> : <RegisterForm onDone={() => setMode("login")} />}</div>

        <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center" }}>
          Konto zakłada tylko dorosły (rodzic/opiekun/trener) — patrz PLAN.md.
          Regulamin i polityka prywatności są w przygotowaniu.
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(translateAuthError(error));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={labelStyle}>E-mail</label>
        <input style={inputStyle} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Hasło</label>
        <input
          style={inputStyle}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      <button className="btn-primary" type="submit" disabled={busy}>
        {busy ? "Loguję…" : "Zaloguj się"}
      </button>
    </form>
  );
}

function RegisterForm({ onDone }) {
  const { registerPendingProfile } = useAuth();
  const [role, setRole] = useState("parent");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmNotice, setConfirmNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    setBusy(true);
    // Zapisujemy dane profilu PRZED signUp — jeśli projekt wymaga
    // potwierdzenia e-maila, sesja (i możliwość zapisu do `accounts`)
    // pojawi się dopiero po kliknięciu linku z maila, w zupełnie nowym
    // wczytaniu aplikacji. Patrz AuthContext.jsx.
    registerPendingProfile({ role, full_name: fullName });

    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);

    if (error) {
      setError(translateAuthError(error));
      return;
    }

    if (!data.session) {
      // Confirm email włączone w ustawieniach projektu — trzeba kliknąć link.
      setConfirmNotice(true);
    }
    // Jeśli data.session istnieje, AuthContext sam złapie zmianę stanu i
    // utworzy wiersz w accounts — użytkownik od razu zobaczy główną appkę.
  };

  if (confirmNotice) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <p style={{ fontSize: 28, margin: "0 0 8px" }}>📬</p>
        <p style={{ margin: 0, fontWeight: 700 }}>Sprawdź swoją skrzynkę</p>
        <p style={{ margin: "8px 0 16px", fontSize: 13, color: "var(--color-text-muted)" }}>
          Wysłaliśmy link potwierdzający na {email}. Kliknij go, żeby dokończyć zakładanie konta.
        </p>
        <button className="btn-ghost" onClick={onDone}>
          Wróć do logowania
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={labelStyle}>Kim jesteś?</label>
        <div className="chip-row">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              className={`chip ${role === r.value ? "is-active" : ""}`}
              onClick={() => setRole(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Imię i nazwisko</label>
        <input style={inputStyle} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>E-mail</label>
        <input style={inputStyle} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Hasło (min. 8 znaków)</label>
        <input
          style={inputStyle}
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      <button className="btn-primary" type="submit" disabled={busy}>
        {busy ? "Zakładam konto…" : "Załóż konto"}
      </button>
    </form>
  );
}

function translateAuthError(error) {
  const msg = error.message || "";
  if (msg.includes("Invalid login credentials")) return "Błędny e-mail lub hasło.";
  if (msg.includes("Email not confirmed"))
    return "Ten e-mail nie jest jeszcze potwierdzony — sprawdź skrzynkę i kliknij link, który wysłaliśmy przy rejestracji.";
  if (msg.includes("User already registered")) return "Konto z tym e-mailem już istnieje — zaloguj się.";
  if (msg.includes("Password should be at least")) return "Hasło jest za krótkie.";
  if (msg.includes("Unable to validate email")) return "Nieprawidłowy adres e-mail.";
  return msg || "Coś poszło nie tak. Spróbuj ponownie.";
}
