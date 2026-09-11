-- Panel trenera/klubu (PLAN.md, "wchodzi do MVP") — trener potrzebuje
-- widzieć zawodników i wyjazdy SWOJEGO klubu, nie tylko swoich własnych
-- (owner_account_id / created_by_account_id), bo trener zwykle nie jest
-- rodzicem żadnego z nich.
--
-- Dopasowanie po `club_name` (wolny tekst, już istniejący w `accounts` i
-- `players` od 0001_init.sql) — bez nowej tabeli członkostwa, bo w MVP
-- jeden trener = jeden klub, bez formalnego zarządzania listą. lower(trim())
-- po obu stronach, żeby "ATZ" / "atz " / " ATZ" nie rozjeżdżały się przez
-- literówkę w wielkości liter czy spację na końcu.
--
-- Brak ryzyka rekursji (patrz 0009/0010): ta polityka na `players`/`trips`
-- odpytuje tylko `accounts`, a polityka na `accounts` (0002) nie odpytuje
-- z powrotem `players`/`trips` — jednostronna zależność, nie cykl.

create policy "Trener widzi zawodników swojego klubu"
  on players for select
  to authenticated
  using (
    club_name is not null
    and exists (
      select 1 from accounts a
      where a.id = auth.uid()
        and a.role = 'coach'
        and a.club_name is not null
        and lower(trim(a.club_name)) = lower(trim(players.club_name))
    )
  );

create policy "Trener widzi wyjazdy zawodników swojego klubu"
  on trips for select
  to authenticated
  using (
    exists (
      select 1 from players p
      join accounts a on a.id = auth.uid()
      where p.id = trips.player_id
        and a.role = 'coach'
        and p.club_name is not null
        and a.club_name is not null
        and lower(trim(a.club_name)) = lower(trim(p.club_name))
    )
  );
