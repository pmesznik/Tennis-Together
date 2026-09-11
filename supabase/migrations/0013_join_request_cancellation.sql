-- Rezygnacja z PRZEJAZDU/NOCLEGU PO obustronnej akceptacji (np. kontuzja,
-- zmiana planów) — do tej pory `status` mógł tylko iść pending → accepted/
-- declined, bez drogi powrotnej. Paweł zgłosił, że to realny brak: życie
-- dzieje się już po akceptacji, nie tylko przed nią.
--
-- Właściciel oferty może to zrobić od razu — jego istniejąca polityka
-- update (0007) nie ogranicza docelowego statusu. Brakowało tylko: (1)
-- dopuszczenia wartości 'cancelled' w CHECK, (2) analogicznego prawa dla
-- PROSZĄCEGO (do tej pory mógł tylko insert/delete, nie update) — z
-- zawężeniem `using`/`with check`, żeby dało się przejść WYŁĄCZNIE
-- accepted → cancelled, nie np. cancelled → accepted albo pending → accepted
-- z pominięciem właściciela oferty.

alter table ride_join_requests drop constraint if exists ride_join_requests_status_check;
alter table ride_join_requests
  add constraint ride_join_requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'cancelled'));

alter table lodging_join_requests drop constraint if exists lodging_join_requests_status_check;
alter table lodging_join_requests
  add constraint lodging_join_requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'cancelled'));

drop policy if exists "Proszący rezygnuje z zaakceptowanego przejazdu" on ride_join_requests;
create policy "Proszący rezygnuje z zaakceptowanego przejazdu"
  on ride_join_requests for update to authenticated
  using (
    status = 'accepted'
    and requester_trip_id in (select id from trips where created_by_account_id = auth.uid())
  )
  with check (status = 'cancelled');

drop policy if exists "Proszący rezygnuje z zaakceptowanego noclegu" on lodging_join_requests;
create policy "Proszący rezygnuje z zaakceptowanego noclegu"
  on lodging_join_requests for update to authenticated
  using (
    status = 'accepted'
    and requester_trip_id in (select id from trips where created_by_account_id = auth.uid())
  )
  with check (status = 'cancelled');
