-- Panel administratora (Paweł, 2026-09-14) — zastępuje ręczny SQL osobną
-- stroną (docs/admin.html, GitHub Pages, ten sam wzorzec co testerzy.html).
--
-- `accounts.is_admin` jest CELOWO osobne od `role` (parent/guardian/coach/
-- player_adult) — administrator to niezależna flaga, nie kolejna wartość
-- roli, bo ktoś może być jednocześnie rodzicem w systemie i administratorem.
--
-- PRZY OKAZJI: `reports` i `blocks` istniały od 0001_init.sql, ale nigdy
-- nie dostały RLS — sprawdzone na żywo (anon key), obie zwracały puste [],
-- ale BEZ filtrowania wierszy (żadnych realnych danych tam jeszcze nie
-- było, bo apka nigdy nie miała UI do zgłaszania/blokowania — MVP scope
-- z PLAN.md, jeszcze niezaimplementowane). Zamykamy to teraz, przy okazji
-- nadawania `reports` realnego znaczenia w panelu.

alter table accounts add column is_admin boolean not null default false;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select accounts.is_admin from accounts where id = auth.uid()), false);
$$;

-- ── accounts: admin widzi/aktualizuje każde konto (np. zawieszenie) ───────
-- Dodatkowe PERMISSIVE polityki obok istniejącej "właściciel swoje konto"
-- (0002) — OR-ują się, nie nadpisują niczego.

create policy "Admin widzi wszystkie konta"
  on accounts for select
  to authenticated
  using (is_admin());

create policy "Admin aktualizuje dowolne konto"
  on accounts for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ── reports: RLS od zera (tabela była niezabezpieczona) ───────────────────

alter table reports enable row level security;

create policy "Zalogowany zgłasza w swoim imieniu"
  on reports for insert
  to authenticated
  with check (reporter_account_id = auth.uid());

create policy "Zgłaszający widzi własne zgłoszenia"
  on reports for select
  to authenticated
  using (reporter_account_id = auth.uid());

create policy "Admin widzi i zarządza wszystkimi zgłoszeniami"
  on reports for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ── blocks: RLS od zera (tabela była niezabezpieczona) ────────────────────

alter table blocks enable row level security;

create policy "Właściciel zarządza swoimi blokadami"
  on blocks for all
  to authenticated
  using (blocker_account_id = auth.uid())
  with check (blocker_account_id = auth.uid());

create policy "Admin widzi wszystkie blokady"
  on blocks for select
  to authenticated
  using (is_admin());

-- ── bug_reports: dodaj oznaczanie jako rozpatrzone ────────────────────────

alter table bug_reports add column resolved boolean not null default false;

create policy "Admin zarządza zgłoszeniami błędów"
  on bug_reports for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ── Statystyki dashboardu — jedna funkcja, żeby nie otwierać RLS-em całych
-- tabel players/trips/tournaments tylko po to, żeby policzyć wiersze ─────

create or replace function admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not is_admin() then
    raise exception 'Brak uprawnień';
  end if;
  return jsonb_build_object(
    'accounts', (select count(*) from accounts),
    'players', (select count(*) from players),
    'trips', (select count(*) from trips),
    'ride_offers', (select count(*) from ride_offers),
    'lodging_offers', (select count(*) from lodging_offers),
    'open_reports', (select count(*) from reports where status = 'open'),
    'unresolved_bugs', (select count(*) from bug_reports where not resolved),
    'suspended_accounts', (select count(*) from accounts where status = 'suspended'),
    'last_tournament_import', (select max(created_at) from tournaments)
  );
end;
$$;
