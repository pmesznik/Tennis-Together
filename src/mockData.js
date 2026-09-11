// Ostatnie dane-atrapy w apce — reszta (turnieje, przejazdy, noclegi,
// wyjazdy, wiadomości, profil zawodnika) już czyta prawdziwe dane z
// Supabase, patrz PLAN.md. Zostaje tylko profil rodzica: zgody i historia
// wyjazdów jeszcze nie są podłączone pod `consents`/`trips.status`.

export const MOCK_PARENT_PROFILE = {
  consents: [
    { type: "Zgoda na przetwarzanie danych", granted: true, date: "2026-09-01" },
    { type: "Udostępnianie danych kontaktowych w grupie", granted: true, date: "2026-09-01" },
  ],
  completedTrips: 3,
};
