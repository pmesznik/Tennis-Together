-- Opcjonalne zdjęcie profilowe ("z kim ja właściwie jadę" #2, na końcu
-- zgodnie z ustaleniem) — WYŁĄCZNIE pomoc w rozpoznaniu drugiej osoby na
-- miejscu spotkania, nie weryfikacja tożsamości (to robią #1 i #3).
--
-- Świadomy kompromis prywatności: bucket `avatars` jest PUBLICZNY (każdy
-- ze znajomym adresem URL może zobaczyć zdjęcie, bez logowania) —
-- upraszcza to znacznie implementację (brak podpisywanych URL-i) i jest
-- standardowym podejściem do zdjęć profilowych w większości aplikacji.
-- Adresy są nieodgadalne (folder = UUID konta), ale to NIE jest to samo
-- co "widoczne tylko dla dopasowanej drugiej strony" — to trzeba
-- wyraźnie powiedzieć użytkownikowi w UI. Kto może zdjęcie WGRAĆ/USUNĄĆ
-- jest już ściśle ograniczone RLS do właściciela folderu.
--
-- Kogo/co widać w apce jest osobno ograniczone: `match_profile()` (niżej)
-- ujawnia imię+zdjęcie tylko stronie zaakceptowanego przejazdu/noclegu —
-- NIE otwiera całej tabeli `accounts` (tam są telefon/e-mail/miasto).

alter table accounts add column avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Właściciel zarządza swoim avatarem"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Profil widoczny drugiej stronie zaakceptowanego przejazdu/noclegu —
-- TYLKO imię i zdjęcie (+ status "Parent Verified"), nic więcej z
-- `accounts`. SECURITY DEFINER + pusty wynik gdy brak dopasowania to ten
-- sam sprawdzony wzorzec co trip_has_public_offer/account_is_active
-- (0009/0016) — bezpieczne, bo funkcja sama decyduje, co zwrócić, RLS na
-- `accounts` nie ma tu żadnego znaczenia.
create or replace function match_profile(other_account_id uuid)
returns table (full_name text, avatar_url text, verified boolean)
language sql
security definer
set search_path = public
stable
as $$
  select a.full_name, a.avatar_url, a.verified
  from accounts a
  where a.id = other_account_id
    and (
      exists (
        select 1
        from ride_join_requests rjr
        join ride_offers ro on ro.id = rjr.ride_offer_id
        join trips ot on ot.id = ro.trip_id
        join trips rt on rt.id = rjr.requester_trip_id
        where rjr.status = 'accepted'
          and (
            (ot.created_by_account_id = auth.uid() and rt.created_by_account_id = other_account_id)
            or (rt.created_by_account_id = auth.uid() and ot.created_by_account_id = other_account_id)
          )
      )
      or exists (
        select 1
        from lodging_join_requests ljr
        join lodging_offers lo on lo.id = ljr.lodging_offer_id
        join trips ot on ot.id = lo.trip_id
        join trips rt on rt.id = ljr.requester_trip_id
        where ljr.status = 'accepted'
          and (
            (ot.created_by_account_id = auth.uid() and rt.created_by_account_id = other_account_id)
            or (rt.created_by_account_id = auth.uid() and ot.created_by_account_id = other_account_id)
          )
      )
    );
$$;
