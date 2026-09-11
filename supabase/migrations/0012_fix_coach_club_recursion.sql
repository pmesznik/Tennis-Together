-- NAPRAWA: "infinite recursion detected in policy for relation players"
--
-- Przyczyna: dokładnie ten sam wzorzec błędu co w 0009/0010. Polityka na
-- `trips` z 0011 ("Trener widzi wyjazdy...") odpytywała wprost `players`,
-- a polityki na `players` z 0009/0010 ("widoczny publicznie, jeśli jego
-- wyjazd ma ofertę/prośbę") odpytują wprost `trips` — zamknięte koło.
-- Postgres, sprawdzając RLS na jednej z tych tabel, ewaluuje WSZYSTKIE
-- polityki drugiej, co wraca do pierwszej w kółko.
--
-- Naprawa: SECURITY DEFINER (ten sam sprawdzony wzorzec co
-- trip_has_public_offer / trip_is_requester_for_my_offer) — funkcja
-- omija RLS przy odpytywaniu players/accounts, więc polityki na
-- players/trips przestają wywoływać RLS drugiej tabeli w pętli. Precedens
-- na to, że definer-funkcja może bezpiecznie odpytywać TĘ SAMĄ tabelę, na
-- której wisi jako polityka, bez rekursji: trip_is_requester_for_my_offer
-- (0010) odpytuje `trips` i jest użyta jako polityka na `trips`.

create or replace function player_visible_to_my_coach(p_player_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from players p
    join accounts a on a.id = auth.uid()
    where p.id = p_player_id
      and a.role = 'coach'
      and a.club_name is not null
      and p.club_name is not null
      and lower(trim(a.club_name)) = lower(trim(p.club_name))
  );
$$;

drop policy if exists "Trener widzi zawodników swojego klubu" on players;
drop policy if exists "Trener widzi wyjazdy zawodników swojego klubu" on trips;

create policy "Trener widzi zawodników swojego klubu"
  on players for select
  to authenticated
  using (player_visible_to_my_coach(id));

create policy "Trener widzi wyjazdy zawodników swojego klubu"
  on trips for select
  to authenticated
  using (player_visible_to_my_coach(player_id));
