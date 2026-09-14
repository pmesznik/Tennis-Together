-- System ocen po wyjeździe (inspiracja: Uber "tylko wysoko oceniani
-- kierowcy dostają prośby od kont nastoletnich", Booking.com "opinia
-- tylko po zakończonym pobycie") — jedyny etap zaufania, którego dotąd
-- nie mieliśmy: wszystko co zbudowaliśmy wcześniej (PZT, zdjęcie, kod/QR)
-- działa PRZED/W TRAKCIE spotkania, nic nie mówi jak poszło POTEM.
--
-- Ocenić można TYLKO po potwierdzonym spotkaniu (meeting_confirmed_at
-- niepuste na ride_join_requests/lodging_join_requests, patrz
-- 0018_meeting_confirmation.sql) — to naturalny, już istniejący dowód,
-- że do spotkania faktycznie doszło, a nie tylko "zaakceptowano" (co
-- mogło się zdarzyć na tydzień przed wyjazdem i zostać odwołane).
--
-- `join_request_id` celowo bez FK — odnosi się na przemian do
-- ride_join_requests ALBO lodging_join_requests (dwie różne tabele),
-- Postgres nie ma polimorficznych kluczy obcych. Poprawność sprawdza
-- `can_rate()` w chwili zapisu, nie ograniczenie FK.

create table ratings (
  id uuid primary key default gen_random_uuid(),
  join_request_id uuid not null,
  join_request_kind text not null check (join_request_kind in ('ride', 'lodging')),
  rater_account_id uuid not null references accounts(id) on delete cascade,
  rated_account_id uuid not null references accounts(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (join_request_id, join_request_kind, rater_account_id)
);

create or replace function can_rate(p_join_request_id uuid, p_kind text, p_other_account_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case p_kind
    when 'ride' then exists (
      select 1
      from ride_join_requests rjr
      join ride_offers ro on ro.id = rjr.ride_offer_id
      join trips ot on ot.id = ro.trip_id
      join trips rt on rt.id = rjr.requester_trip_id
      where rjr.id = p_join_request_id
        and rjr.meeting_confirmed_at is not null
        and (
          (ot.created_by_account_id = auth.uid() and rt.created_by_account_id = p_other_account_id)
          or (rt.created_by_account_id = auth.uid() and ot.created_by_account_id = p_other_account_id)
        )
    )
    when 'lodging' then exists (
      select 1
      from lodging_join_requests ljr
      join lodging_offers lo on lo.id = ljr.lodging_offer_id
      join trips ot on ot.id = lo.trip_id
      join trips rt on rt.id = ljr.requester_trip_id
      where ljr.id = p_join_request_id
        and ljr.meeting_confirmed_at is not null
        and (
          (ot.created_by_account_id = auth.uid() and rt.created_by_account_id = p_other_account_id)
          or (rt.created_by_account_id = auth.uid() and ot.created_by_account_id = p_other_account_id)
        )
    )
    else false
  end;
$$;

alter table ratings enable row level security;

create policy "Oceniający dodaje ocenę tylko za potwierdzone spotkanie"
  on ratings for insert
  to authenticated
  with check (
    rater_account_id = auth.uid()
    and rated_account_id != auth.uid()
    and can_rate(join_request_id, join_request_kind, rated_account_id)
  );

create policy "Widzę oceny, które dałem lub dostałem"
  on ratings for select
  to authenticated
  using (rater_account_id = auth.uid() or rated_account_id = auth.uid());

create policy "Admin widzi wszystkie oceny"
  on ratings for select
  to authenticated
  using (is_admin());

-- Ten sam wyłącznik konta co reszta "żywych" tabel (0016) — zawieszone
-- konto nie dodaje nowych ocen (odczyt własnych ocen zostaje, tak samo
-- jak przy accounts, żeby nie chować danych bez potrzeby).
create policy "Zawieszone konto nie ma dostępu"
  on ratings as restrictive for insert
  to authenticated
  with check (account_is_active());

-- Średnia ocena + liczba ocen — jawnie publiczne (jak gwiazdki na
-- Uberze/Booking.com), żeby dało się je pokazać PRZED dopasowaniem
-- (np. na karcie oferty przejazdu), nie tylko po. Ujawnia wyłącznie
-- zagregowaną liczbę, nigdy treść komentarzy (te chronione są przez
-- zwykłe RLS wyżej).
create or replace function account_rating(target_account_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'avg_stars', round(avg(stars)::numeric, 1),
    'count', count(*)
  )
  from ratings
  where rated_account_id = target_account_id;
$$;
