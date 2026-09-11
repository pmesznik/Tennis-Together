-- Tennis Together — schemat startowy (MVP)
-- Uruchom w Supabase SQL Editor (projekt w regionie UE/Frankfurt).
--
-- Zasada bezpieczeństwa: konto (auth.users) należy tylko do dorosłych
-- (rodzic/opiekun/trener) lub do zawodnika 16+. Zawodnik poniżej 16 lat
-- NIE ma własnego konta — jest profilem (players) powiązanym z rodzicem
-- przez guardianships. Każda tabela ma RLS, żeby jedna rodzina nie mogła
-- zobaczyć danych drugiej poza tym, co jest celowo publiczne (np. ogłoszenia
-- o przejeździe).

create extension if not exists postgis;

-- ─────────────────────────────────────────────────────────────────────────
-- LUDZIE
-- ─────────────────────────────────────────────────────────────────────────

-- Konto dorosłego (1:1 z auth.users) albo zawodnika 16+.
create table accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('parent', 'guardian', 'coach', 'player_adult')),
  full_name text not null,
  phone text,
  city text,
  club_name text,
  -- Odznaka "Parent Verified" z docs/UX_Branding_Tennis_Together.docx.
  -- W MVP weryfikacja = potwierdzony telefon/e-mail (nie dokument tożsamości —
  -- to dopiero przy "nocleg u rodziny" w etapie 2, patrz PLAN.md).
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Profil zawodnika. owner_account_id = konto, które go prowadzi (rodzic/opiekun
-- albo, dla zawodnika 16+, jego własne konto — wtedy owner_account_id = id konta).
create table players (
  id uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references accounts(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_year int not null,
  category text, -- np. U12, U14, U16, U18
  club_name text,
  city text,
  pzt_login text, -- powiązanie z bazą PZT (do importu rankingu/meczów)
  ranking_te int,
  ranking_itf int,
  created_at timestamptz not null default now()
);

-- Zgoda rodzica/opiekuna na udział małoletniego zawodnika w funkcjach aplikacji
-- (RODO art. 8 + wymóg zgody na konkretne funkcje, np. udostępnianie danych
-- kontaktowych w grupie wyjazdowej). Zapisywana z datą, nie edytowana — nowa
-- zgoda to nowy wiersz.
create table consents (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  given_by_account_id uuid not null references accounts(id),
  consent_type text not null check (consent_type in ('terms', 'data_processing', 'contact_sharing')),
  granted boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- TURNIEJE I WYJAZDY
-- ─────────────────────────────────────────────────────────────────────────

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('otk', 'tennis_europe', 'itf', 'manual')),
  external_id text, -- id z portal.pzt.pl / TE / ITF, jeśli dostępne
  name text not null,
  city text not null,
  country text not null default 'Polska',
  lat double precision,
  lng double precision,
  category text, -- kategoria wiekowa/turnieju
  starts_on date not null,
  ends_on date not null,
  website_url text,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

-- "Jadę na turniej" — karta wyjazdu zawodnika. To centralny obiekt MVP:
-- z niej odpala się wyszukiwanie dopasowań (przejazd/nocleg).
create table trips (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  created_by_account_id uuid not null references accounts(id),
  departure_city text not null,
  departure_lat double precision,
  departure_lng double precision,
  departure_date date,
  return_date date,
  status text not null default 'planning' check (status in ('planning', 'confirmed', 'completed', 'cancelled')),
  trip_group_id uuid, -- fk dodany po utworzeniu trip_groups (patrz niżej)
  notes text,
  created_at timestamptz not null default now(),
  unique (player_id, tournament_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- PRZEJAZDY I NOCLEGI
-- ─────────────────────────────────────────────────────────────────────────

create table ride_offers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  free_seats int not null check (free_seats > 0),
  luggage_space text,
  driver_notes text,
  cost_split_suggestion text,
  created_at timestamptz not null default now()
);

create table ride_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  seats_needed int not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

-- Prośba o dołączenie do konkretnej oferty przejazdu/noclegu — wymaga
-- akceptacji właściciela oferty, zanim dane kontaktowe się odblokują
-- (patrz sekcja "Prywatność" w PLAN.md).
create table ride_join_requests (
  id uuid primary key default gen_random_uuid(),
  ride_offer_id uuid not null references ride_offers(id) on delete cascade,
  requester_trip_id uuid not null references trips(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (ride_offer_id, requester_trip_id)
);

create table lodging_offers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  kind text not null check (kind in ('shared_booking', 'roommate_wanted')), -- "u rodziny" odłożone na etap 2
  place_name text,
  free_spots int,
  budget_per_night numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table lodging_join_requests (
  id uuid primary key default gen_random_uuid(),
  lodging_offer_id uuid not null references lodging_offers(id) on delete cascade,
  requester_trip_id uuid not null references trips(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (lodging_offer_id, requester_trip_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- GRUPY WYJAZDOWE I CZAT
-- ─────────────────────────────────────────────────────────────────────────

create table trip_groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  created_by_account_id uuid not null references accounts(id),
  name text,
  created_at timestamptz not null default now()
);

alter table trips
  add constraint trips_trip_group_fk foreign key (trip_group_id) references trip_groups(id) on delete set null;

create table trip_group_members (
  trip_group_id uuid not null references trip_groups(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (trip_group_id, trip_id)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('trip_group', 'ride', 'lodging', 'direct')),
  trip_group_id uuid references trip_groups(id) on delete cascade,
  ride_offer_id uuid references ride_offers(id) on delete cascade,
  lodging_offer_id uuid references lodging_offers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  primary key (conversation_id, account_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_account_id uuid not null references accounts(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- BEZPIECZEŃSTWO (moderacja od pierwszego dnia — nie jest opcjonalna)
-- ─────────────────────────────────────────────────────────────────────────

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_account_id uuid not null references accounts(id),
  reported_account_id uuid references accounts(id),
  reported_message_id uuid references messages(id),
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at timestamptz not null default now()
);

create table blocks (
  blocker_account_id uuid not null references accounts(id) on delete cascade,
  blocked_account_id uuid not null references accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_account_id, blocked_account_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — szkielet (do dopracowania przed publikacją!)
-- ─────────────────────────────────────────────────────────────────────────
-- Poniżej tylko przykład podejścia na najbardziej czułej tabeli (players).
-- Każdą kolejną tabelę trzeba opatrzyć analogiczną polityką przed betą —
-- patrz PLAN.md, "Gotowe do produkcji".

alter table players enable row level security;

create policy "Właściciel widzi i edytuje swoich zawodników"
  on players for all
  using (owner_account_id = auth.uid())
  with check (owner_account_id = auth.uid());

-- TODO przed betą: włączyć RLS i napisać polityki dla każdej tabeli powyżej,
-- w tym wyjątek "publiczne ogłoszenie przejazdu/noclegu widoczne dla
-- zalogowanych, ale dane kontaktowe tylko po akceptacji" (patrz
-- ride_join_requests / lodging_join_requests).
