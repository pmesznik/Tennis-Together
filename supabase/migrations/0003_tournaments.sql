-- Turnieje: przygotowanie pod import ze scripts/import_tournaments.py
-- (scraper OTK z portal.pzt.pl).

-- Ten widok kalendarza PZT nie zawsze podaje miasto (np. mistrzostwa
-- drużynowe) i nigdy nie podaje daty zakończenia. Lepiej pokazać w appce
-- "nieznane" niż zgadywać i skłamać datą — więc oba pola przestają być
-- wymagane. (starts_on zostaje NOT NULL — bez niej wpis w ogóle nie ma
-- sensu i scraper taki wpis pomija.)
alter table tournaments alter column city drop not null;
alter table tournaments alter column ends_on drop not null;

-- RLS: kalendarz turniejów nie zawiera nic prywatnego, więc każdy
-- zalogowany użytkownik aplikacji może go czytać. Zapis (insert/update)
-- celowo NIE ma polityki — jedyny sposób pisania to `service_role`
-- (używany przez GitHub Actions w scripts/import_tournaments.py), który
-- omija RLS całkowicie.
alter table tournaments enable row level security;

create policy "Zalogowani widzą kalendarz turniejów"
  on tournaments for select
  to authenticated
  using (true);
