-- Zgłoszenia testerów klubowych (docs/testerzy.html, GitHub Pages) —
-- formularz na stronie dla testerów pisze tu wprost przez REST API
-- kluczem publicznym anon (ta sama strona nie jest częścią aplikacji,
-- testerzy nie są zalogowani przez Supabase Auth, więc insert musi być
-- dostępny anonimowo).
--
-- Bez danych osobowych realnych ludzi: tester wpisuje pseudonim, nie
-- prawdziwe dane (patrz ostrzeżenie na stronie) — dlatego bezpiecznie
-- zarówno insert, jak i select są otwarte na klucz anon, tak jak np.
-- `tournaments`. To pozwala też mnie (Claude) czytać zgłoszenia wprost
-- przez REST API tym samym kluczem, bez potrzeby service_role.

create table bug_reports (
  id uuid primary key default gen_random_uuid(),
  tester_name text,
  screen text,
  report_type text,
  priority text,
  apk_version text,
  description text not null,
  steps text,
  created_at timestamptz not null default now()
);

alter table bug_reports enable row level security;

create policy "Każdy może zgłosić błąd"
  on bug_reports for insert
  to anon, authenticated
  with check (true);

create policy "Każdy może zobaczyć zgłoszenia"
  on bug_reports for select
  to anon, authenticated
  using (true);
