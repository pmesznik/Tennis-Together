-- RLS dla conversations / conversation_participants / messages
-- ("Wiadomości") + rozszerzenie widoczności `accounts` o osoby, z którymi
-- dzielimy rozmowę.
--
-- Rozmowa powstaje automatycznie, gdy właściciel oferty przejazdu/noclegu
-- zaakceptuje prośbę o dołączenie (patrz src/lib/useJoinRequests.js) —
-- appka jeszcze nie ma ekranu "napisz do kogokolwiek", więc na start
-- jedyna droga do rozmowy to wspólny, zaakceptowany wyjazd. To celowe
-- ograniczenie z dokumentu założeń (kontakt dopiero po akceptacji).
--
-- Polityka na conversation_participants NIE może odwoływać się sama do
-- siebie w podzapytaniu (Postgres zgłasza "infinite recursion detected in
-- policy" przy takim wzorcu) — dlatego sprawdzenie "czy jestem
-- uczestnikiem rozmowy X" jest w osobnej funkcji SECURITY DEFINER, która
-- czyta tę tabelę z pominięciem RLS (to jest bezpieczne: funkcja i tak
-- tylko odpowiada true/false, nie zwraca żadnych danych).

create or replace function is_conversation_participant(conv_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = conv_id and account_id = auth.uid()
  );
$$;

-- ── conversations ──────────────────────────────────────────────────────
alter table conversations enable row level security;

create policy "Uczestnicy widzą rozmowę"
  on conversations for select to authenticated
  using (is_conversation_participant(id));

-- Tworzenie rozmowy samo w sobie nic nie ujawnia (brak uczestników =
-- nikt jej jeszcze nie widzi) — prawdziwą bramką jest insert do
-- conversation_participants niżej.
create policy "Zalogowani mogą zakładać rozmowy"
  on conversations for insert to authenticated
  with check (true);

-- ── conversation_participants ─────────────────────────────────────────
alter table conversation_participants enable row level security;

create policy "Uczestnicy widzą listę uczestników"
  on conversation_participants for select to authenticated
  using (is_conversation_participant(conversation_id));

-- Można dodać SIEBIE albo DRUGĄ STRONĘ zaakceptowanej prośby o
-- przejazd/nocleg — i nic więcej. To jedyna droga powstania rozmowy.
create policy "Strony zaakceptowanej prośby otwierają wspólną rozmowę"
  on conversation_participants for insert to authenticated
  with check (
    exists (
      select 1 from ride_join_requests rjr
      join ride_offers ro on ro.id = rjr.ride_offer_id
      join trips ot on ot.id = ro.trip_id
      join trips rt on rt.id = rjr.requester_trip_id
      where rjr.status = 'accepted'
        and (
          (account_id = ot.created_by_account_id and auth.uid() = rt.created_by_account_id)
          or (account_id = rt.created_by_account_id and auth.uid() = ot.created_by_account_id)
        )
    )
    or exists (
      select 1 from lodging_join_requests ljr
      join lodging_offers lo on lo.id = ljr.lodging_offer_id
      join trips ot on ot.id = lo.trip_id
      join trips rt on rt.id = ljr.requester_trip_id
      where ljr.status = 'accepted'
        and (
          (account_id = ot.created_by_account_id and auth.uid() = rt.created_by_account_id)
          or (account_id = rt.created_by_account_id and auth.uid() = ot.created_by_account_id)
        )
    )
  );

-- ── messages ───────────────────────────────────────────────────────────
alter table messages enable row level security;

create policy "Uczestnicy widzą wiadomości"
  on messages for select to authenticated
  using (is_conversation_participant(conversation_id));

create policy "Uczestnicy wysyłają wiadomości"
  on messages for insert to authenticated
  with check (is_conversation_participant(conversation_id) and sender_account_id = auth.uid());

-- ── accounts: rozszerzenie widoczności ────────────────────────────────
-- Dotychczasowa polityka z 0002 (właściciel widzi/edytuje swoje konto)
-- zostaje bez zmian — to dodatkowa, OR'owana polityka SELECT: imię i rolę
-- drugiej osoby widać, gdy dzielimy z nią rozmowę (potrzebne do
-- wyświetlenia "kto pisze" w czacie). Telefon i tak nie jest ujawniany
-- nigdzie w UI poza własnym profilem.
create policy "Konto widoczne, jeśli dzielimy rozmowę"
  on accounts for select to authenticated
  using (
    id in (
      select cp2.account_id
      from conversation_participants cp1
      join conversation_participants cp2 on cp2.conversation_id = cp1.conversation_id
      where cp1.account_id = auth.uid()
    )
  );
