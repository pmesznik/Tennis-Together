-- RLS dla ride_join_requests i lodging_join_requests ("Poproś o miejsce" /
-- "Dołącz") — do tej pory włączone bez żadnej polityki (całkowicie
-- zablokowane, patrz 0005/0006), teraz dostają prawdziwy ekran
-- zarządzania (akceptacja/odrzucenie przez właściciela oferty).

-- ── ride_join_requests ──────────────────────────────────────────────────

create policy "Proszący tworzy prośbę o przejazd dla własnego wyjazdu"
  on ride_join_requests for insert to authenticated
  with check (requester_trip_id in (select id from trips where created_by_account_id = auth.uid()));

create policy "Strony widzą prośby o przejazd"
  on ride_join_requests for select to authenticated
  using (
    requester_trip_id in (select id from trips where created_by_account_id = auth.uid())
    or ride_offer_id in (
      select ro.id from ride_offers ro
      join trips t on t.id = ro.trip_id
      where t.created_by_account_id = auth.uid()
    )
  );

create policy "Właściciel oferty odpowiada na prośbę o przejazd"
  on ride_join_requests for update to authenticated
  using (
    ride_offer_id in (
      select ro.id from ride_offers ro
      join trips t on t.id = ro.trip_id
      where t.created_by_account_id = auth.uid()
    )
  )
  with check (
    ride_offer_id in (
      select ro.id from ride_offers ro
      join trips t on t.id = ro.trip_id
      where t.created_by_account_id = auth.uid()
    )
  );

create policy "Proszący usuwa swoją prośbę o przejazd"
  on ride_join_requests for delete to authenticated
  using (requester_trip_id in (select id from trips where created_by_account_id = auth.uid()));

-- ── lodging_join_requests (ten sam wzorzec) ───────────────────────────────

create policy "Proszący tworzy prośbę o nocleg dla własnego wyjazdu"
  on lodging_join_requests for insert to authenticated
  with check (requester_trip_id in (select id from trips where created_by_account_id = auth.uid()));

create policy "Strony widzą prośby o nocleg"
  on lodging_join_requests for select to authenticated
  using (
    requester_trip_id in (select id from trips where created_by_account_id = auth.uid())
    or lodging_offer_id in (
      select lo.id from lodging_offers lo
      join trips t on t.id = lo.trip_id
      where t.created_by_account_id = auth.uid()
    )
  );

create policy "Właściciel oferty odpowiada na prośbę o nocleg"
  on lodging_join_requests for update to authenticated
  using (
    lodging_offer_id in (
      select lo.id from lodging_offers lo
      join trips t on t.id = lo.trip_id
      where t.created_by_account_id = auth.uid()
    )
  )
  with check (
    lodging_offer_id in (
      select lo.id from lodging_offers lo
      join trips t on t.id = lo.trip_id
      where t.created_by_account_id = auth.uid()
    )
  );

create policy "Proszący usuwa swoją prośbę o nocleg"
  on lodging_join_requests for delete to authenticated
  using (requester_trip_id in (select id from trips where created_by_account_id = auth.uid()));
