-- NAPRAWA: "infinite recursion detected in policy for relation ride_offers"
--
-- Przyczyna: polityka na `trips` (z 0005/0006, "widoczny publicznie, jeśli
-- ma ofertę") sprawdzała wprost `ride_offers`/`lodging_offers` w
-- podzapytaniu, a polityka na `ride_offers`/`lodging_offers` ("właściciel
-- zarządza") sprawdzała wprost `trips`. Postgres, sprawdzając dostęp do
-- jednej z tych tabel, ewaluuje politykę drugiej, co wraca do pierwszej —
-- w kółko. To DOKŁADNIE ten sam problem, przed którym zabezpieczono
-- conversation_participants w 0008 (funkcja SECURITY DEFINER) — tu
-- przeoczony przy pisaniu 0005/0006.
--
-- Naprawa: to samo lekarstwo — funkcja SECURITY DEFINER, która sprawdza
-- ride_offers/lodging_offers z pominięciem RLS (bezpieczne: funkcja
-- zwraca tylko true/false, nie żadne dane), więc polityka na `trips`
-- przestaje wywoływać RLS na `ride_offers`/`lodging_offers` w pętli.

create or replace function trip_has_public_offer(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from ride_offers where trip_id = p_trip_id)
      or exists (select 1 from lodging_offers where trip_id = p_trip_id);
$$;

drop policy if exists "Wyjazd widoczny publicznie, jeśli ma ofertę/prośbę o przejazd" on trips;
drop policy if exists "Wyjazd widoczny publicznie, jeśli ma ofertę noclegową" on trips;

create policy "Wyjazd widoczny publicznie, jeśli ma ofertę przejazdu/noclegu"
  on trips for select to authenticated
  using (trip_has_public_offer(id));

drop policy if exists "Zawodnik widoczny publicznie, jeśli jego wyjazd ma ofertę/prośbę" on players;
drop policy if exists "Zawodnik widoczny publicznie, jeśli jego wyjazd ma ofertę noclegową" on players;

create policy "Zawodnik widoczny publicznie, jeśli jego wyjazd ma ofertę"
  on players for select to authenticated
  using (id in (select player_id from trips where trip_has_public_offer(id)));
