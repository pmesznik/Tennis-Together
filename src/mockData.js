// Dane-atrapy do podglądu stylu i przepływów. Do usunięcia, gdy strony
// podłączą się pod Supabase (patrz PLAN.md, "Następne kroki").

export const MOCK_TOURNAMENTS = [
  {
    id: "t1",
    source: "Tennis Europe",
    name: "Tennis Europe U16",
    city: "Zabrze",
    category: "U16",
    startsOn: "12 maja",
    endsOn: "16 maja",
    interested: 4,
  },
  {
    id: "t2",
    source: "OTK",
    name: "OTK Kategoria U14",
    city: "Katowice",
    category: "U14",
    startsOn: "3 czerwca",
    endsOn: "5 czerwca",
    interested: 2,
  },
  {
    id: "t3",
    source: "ITF",
    name: "ITF Juniors J30",
    city: "Wrocław",
    category: "U18",
    startsOn: "20 czerwca",
    endsOn: "27 czerwca",
    interested: 1,
  },
  {
    id: "t4",
    source: "OTK",
    name: "OTK Kategoria U12",
    city: "Gliwice",
    category: "U12",
    startsOn: "8 lipca",
    endsOn: "9 lipca",
    interested: 0,
  },
];

export const MOCK_RIDE_OFFERS = [
  {
    id: "r1",
    tournament: "Tennis Europe U16 — Zabrze",
    from: "Katowice",
    departureAt: "11 maja, 16:00",
    returnAt: "16 maja, 18:00",
    freeSeats: 2,
    luggage: "2 torby + rakiety",
    costSplit: "~40 zł/os. za paliwo",
    driver: "Jan M.",
    verified: true,
  },
  {
    id: "r2",
    tournament: "OTK U14 — Katowice",
    from: "Zabrze",
    departureAt: "2 czerwca, 15:30",
    returnAt: "5 czerwca, 17:00",
    freeSeats: 1,
    luggage: "1 torba",
    costSplit: "~25 zł/os.",
    driver: "Ewa K.",
    verified: true,
  },
];

export const MOCK_RIDE_REQUESTS = [
  {
    id: "rr1",
    tournament: "ITF Juniors J30 — Wrocław",
    from: "Opole",
    seatsNeeded: 1,
    notes: "Elastyczne godziny wyjazdu.",
  },
];

export const MOCK_LODGING_OFFERS = [
  {
    id: "l1",
    kind: "Wspólny hotel/apartament",
    tournament: "Tennis Europe U16 — Zabrze",
    place: "Apartament 3-osobowy, 800m od kortów",
    freeSpots: 1,
    budgetPerNight: "90 zł/os./noc",
  },
  {
    id: "l2",
    kind: "Szukam współlokatora",
    tournament: "OTK U14 — Katowice",
    place: "Hotel Ibis, mam już rezerwację pokoju 2-os.",
    freeSpots: 1,
    budgetPerNight: "110 zł/os./noc",
  },
];

export const MOCK_TRIPS = [
  {
    id: "tr1",
    status: "upcoming",
    tournament: "Tennis Europe U16 — Zabrze",
    dates: "12–16 maja",
    transportStatus: { label: "Zapewniony — wspólny przejazd", state: "ok" },
    lodgingStatus: { label: "Rezerwacja w grupie 3-osobowej", state: "ok" },
    participants: 3,
    costEstimate: "≈ 320 zł / zawodnika",
  },
  {
    id: "tr2",
    status: "organizing",
    tournament: "OTK U14 — Katowice",
    dates: "3–5 czerwca",
    transportStatus: { label: "Szukam przejazdu", state: "pending" },
    lodgingStatus: { label: "Nie wybrano", state: "muted" },
    participants: 1,
    costEstimate: "—",
  },
  {
    id: "tr3",
    status: "completed",
    tournament: "OTK U10 — Bytom",
    dates: "14–15 marca",
    transportStatus: { label: "Zakończony", state: "muted" },
    lodgingStatus: { label: "Zakończony", state: "muted" },
    participants: 2,
    costEstimate: "180 zł / zawodnika",
  },
];

export const MOCK_CONVERSATIONS = [
  {
    id: "c1",
    kind: "Grupa wyjazdowa",
    title: "Tennis Europe U16 — Zabrze",
    lastMessage: "Jan M.: Wyjeżdżamy 11 maja o 16:00, zbiórka pod Carrefourem.",
    unread: 2,
  },
  {
    id: "c2",
    kind: "Rodzic-rodzic",
    title: "Ewa K. (mama Zosi)",
    lastMessage: "Dzięki, to super, że macie wolne miejsce 🙂",
    unread: 0,
  },
  {
    id: "c3",
    kind: "Przejazd",
    title: "OTK U14 — Katowice, przejazd z Zabrza",
    lastMessage: "Ty: Możemy dołożyć fotelik?",
    unread: 0,
  },
];

export const MOCK_CHAT_MESSAGES = [
  { id: "m1", mine: false, author: "Jan M.", text: "Cześć! Mam 2 wolne miejsca na Tennis Europe do Zabrza." },
  { id: "m2", mine: true, author: "Ty", text: "Super, ile miejsca na bagaż zostaje?" },
  { id: "m3", mine: false, author: "Jan M.", text: "Spokojnie zmieszczą się 2 torby i rakiety." },
  { id: "m4", mine: true, author: "Ty", text: "Idealnie, dołączamy 👍" },
];

export const MOCK_PLAYER_PROFILE = {
  firstName: "Zosia",
  lastName: "Kowalska",
  birthYear: 2013,
  category: "U14",
  club: "Akademia Tenisowa Zabrze",
  city: "Zabrze",
  rankingTE: 142,
};

export const MOCK_PARENT_PROFILE = {
  fullName: "Ewa Kowalska",
  role: "Rodzic",
  verified: true,
  phone: "+48 6•• ••• •••",
  consents: [
    { type: "Zgoda na przetwarzanie danych", granted: true, date: "2026-09-01" },
    { type: "Udostępnianie danych kontaktowych w grupie", granted: true, date: "2026-09-01" },
  ],
  completedTrips: 3,
};
