-- RLS dla ride_offers / ride_requests — kolejny krok w kolejności "tabela
-- po tabeli", teraz że Przejazdy dostają prawdziwy ekran.
--
-- Inaczej niż trips/players (widoczne tylko dla właściciela), oferty i
-- prośby o przejazd MUSZĄ być widoczne dla wszystkich zalogowanych —
-- to jest sens tej funkcji (dopasowania między rodzinami). Zapis
-- (tworzenie/edycja/usuwanie) zostaje ograniczony do właściciela
-- powiązanego wyjazdu (trips.created_by_account_id).

alter table ride_offers enable row level security;
alter table ride_requests enable row level security;

create policy "Zalogowani widzą wszystkie oferty przejazdów"
  on ride_offers for select to authenticated using (true);

create policy "Właściciel wyjazdu zarządza swoimi ofertami przejazdu"
  on ride_offers for all to authenticated
  using (trip_id in (select id from trips where created_by_account_id = auth.uid()))
  with check (trip_id in (select id from trips where created_by_account_id = auth.uid()));

create policy "Zalogowani widzą wszystkie prośby o przejazd"
  on ride_requests for select to authenticated using (true);

create policy "Właściciel wyjazdu zarządza swoimi prośbami o przejazd"
  on ride_requests for all to authenticated
  using (trip_id in (select id from trips where created_by_account_id = auth.uid()))
  with check (trip_id in (select id from trips where created_by_account_id = auth.uid()));

-- ride_join_requests ("Poproś o miejsce") dostanie polityki, gdy powstanie
-- ekran zarządzania prośbami (akceptacja przez właściciela oferty) — na
-- razie tylko blokujemy dostęp całkowicie (RLS włączone, zero polityk =
-- nikt poza service_role), żeby nie zostawać z otwartą tabelą bez potrzeby.
alter table ride_join_requests enable row level security;

-- ── Kaskada widoczności: żeby pokazać KTO oferuje przejazd (imię
-- zawodnika, miasto wyjazdu), trips/players muszą być czytelne dla
-- wszystkich zalogowanych — ale TYLKO dla wyjazdów, które ich właściciel
-- świadomie upublicznił przez dodanie oferty/prośby o przejazd. To
-- realizuje zasadę z PLAN.md: "lista pokazuje imię i region, nazwisko/
-- telefon dopiero po akceptacji" (telefon i tak nie jest w tych tabelach —
-- jest w accounts, do którego nie ma stąd dostępu).

create policy "Wyjazd widoczny publicznie, jeśli ma ofertę/prośbę o przejazd"
  on trips for select to authenticated
  using (
    id in (select trip_id from ride_offers)
    or id in (select trip_id from ride_requests)
  );

create policy "Zawodnik widoczny publicznie, jeśli jego wyjazd ma ofertę/prośbę"
  on players for select to authenticated
  using (
    id in (
      select player_id from trips
      where id in (select trip_id from ride_offers)
         or id in (select trip_id from ride_requests)
    )
  );
