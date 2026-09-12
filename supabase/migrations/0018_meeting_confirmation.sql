-- Potwierdzenie spotkania kodem/QR (PLAN.md, "z kim ja właściwie jadę")
-- — druga warstwa po weryfikacji loginem PZT (0017): to nie sprawdza KIM
-- jest druga osoba, tylko że NA MIEJSCU spotkania to naprawdę ta strona,
-- z którą się umówiono przez ten konkretny, zaakceptowany przejazd/nocleg
-- (nie ktoś podający się za nią). Jedna strona generuje w apce
-- 6-znakowy kod (i pokazuje go jako QR), druga go wpisuje po zeskanowaniu
-- zwykłym aparatem telefonu — bez potrzeby wbudowanego skanera w apce.
--
-- Polityka UPDATE analogiczna do wzorca z 0013 (rezygnacja po akceptacji)
-- — kolejna PERMISSIVE polityka obok już istniejącej (właściciel oferty),
-- nie nadpisanie jej. Obie strony (proszący i właściciel oferty) mogą
-- zapisać kod/potwierdzenie, ale TYLKO gdy status='accepted' — nic
-- innego w wierszu się tą ścieżką nie zmienia.

alter table ride_join_requests
  add column meeting_code text,
  add column meeting_confirmed_at timestamptz,
  add column meeting_confirmed_by uuid references accounts(id);

alter table lodging_join_requests
  add column meeting_code text,
  add column meeting_confirmed_at timestamptz,
  add column meeting_confirmed_by uuid references accounts(id);

create policy "Strony potwierdzają spotkanie (przejazd)"
  on ride_join_requests for update to authenticated
  using (
    status = 'accepted'
    and (
      requester_trip_id in (select id from trips where created_by_account_id = auth.uid())
      or ride_offer_id in (
        select ro.id from ride_offers ro
        join trips t on t.id = ro.trip_id
        where t.created_by_account_id = auth.uid()
      )
    )
  )
  with check (status = 'accepted');

create policy "Strony potwierdzają spotkanie (nocleg)"
  on lodging_join_requests for update to authenticated
  using (
    status = 'accepted'
    and (
      requester_trip_id in (select id from trips where created_by_account_id = auth.uid())
      or lodging_offer_id in (
        select lo.id from lodging_offers lo
        join trips t on t.id = lo.trip_id
        where t.created_by_account_id = auth.uid()
      )
    )
  )
  with check (status = 'accepted');
