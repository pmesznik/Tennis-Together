-- NAPRAWA: brak widoczności wyjazdu PROSZĄCEGO dla właściciela oferty.
--
-- 0005/0006/0009 udostępniały wyjazd publicznie tylko wtedy, gdy TEN
-- wyjazd miał WŁASNĄ ofertę (trip_has_public_offer). To nie obejmowało
-- wyjazdu osoby, która tylko POPROSIŁA o dołączenie do cudzej oferty —
-- taki wyjazd sam nie ma oferty, więc pozostawał niewidoczny nawet dla
-- właściciela oferty, do której ta osoba prosiła. Efekt uboczny: przy
-- akceptacji prośby kod nie mógł odczytać konta proszącego (dane
-- przychodziły puste) i po cichu pomijał tworzenie wspólnej rozmowy —
-- zgłoszone przez Pawła jako "Zawodnik · ?" i brak rozmowy mimo
-- zaakceptowanej prośby.
--
-- Funkcja SECURITY DEFINER (ten sam, sprawdzony wzorzec co
-- trip_has_public_offer / is_conversation_participant) — unika ponownie
-- błędu "infinite recursion", bo polityka na `trips` nie może sama
-- odpytywać `trips` w zwykłym podzapytaniu.

create or replace function trip_is_requester_for_my_offer(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from ride_join_requests rjr
    join ride_offers ro on ro.id = rjr.ride_offer_id
    join trips ot on ot.id = ro.trip_id
    where rjr.requester_trip_id = p_trip_id
      and ot.created_by_account_id = auth.uid()
  )
  or exists (
    select 1 from lodging_join_requests ljr
    join lodging_offers lo on lo.id = ljr.lodging_offer_id
    join trips ot on ot.id = lo.trip_id
    where ljr.requester_trip_id = p_trip_id
      and ot.created_by_account_id = auth.uid()
  );
$$;

drop policy if exists "Wyjazd proszącego widoczny dla właściciela oferty" on trips;

create policy "Wyjazd proszącego widoczny dla właściciela oferty"
  on trips for select to authenticated
  using (trip_is_requester_for_my_offer(id));

drop policy if exists "Zawodnik proszącego widoczny dla właściciela oferty" on players;

create policy "Zawodnik proszącego widoczny dla właściciela oferty"
  on players for select to authenticated
  using (id in (select player_id from trips where trip_is_requester_for_my_offer(id)));
