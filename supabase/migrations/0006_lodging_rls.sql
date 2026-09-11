-- RLS dla lodging_offers — ten sam wzorzec co ride_offers/ride_requests
-- w 0005_rides_rls.sql: widoczne dla wszystkich zalogowanych (sens
-- funkcji), zapis tylko przez właściciela powiązanego wyjazdu.

alter table lodging_offers enable row level security;

create policy "Zalogowani widzą wszystkie oferty noclegowe"
  on lodging_offers for select to authenticated using (true);

create policy "Właściciel wyjazdu zarządza swoimi ofertami noclegowymi"
  on lodging_offers for all to authenticated
  using (trip_id in (select id from trips where created_by_account_id = auth.uid()))
  with check (trip_id in (select id from trips where created_by_account_id = auth.uid()));

-- lodging_join_requests ("Dołącz") — jak ride_join_requests w 0005:
-- zablokowane dla wszystkich poza service_role, dopóki nie powstanie
-- ekran zarządzania prośbami.
alter table lodging_join_requests enable row level security;

-- Rozszerzenie kaskady widoczności z 0005 (tam była tylko dla ofert/próśb
-- o przejazd) — te polityki są OR'owane z tamtymi, nie je zastępują:
-- wyjazd/zawodnik widoczny publicznie też, gdy ma TYLKO ofertę noclegową
-- (bez oferty przejazdu).
create policy "Wyjazd widoczny publicznie, jeśli ma ofertę noclegową"
  on trips for select to authenticated
  using (id in (select trip_id from lodging_offers));

create policy "Zawodnik widoczny publicznie, jeśli jego wyjazd ma ofertę noclegową"
  on players for select to authenticated
  using (id in (select player_id from trips where id in (select trip_id from lodging_offers)));
