-- Powiadomienia push: "ktoś jedzie na ten sam turniej i proponuje
-- przejazd/nocleg" (Paweł, 2026-09-14).
--
-- Architektura: Capacitor `@capacitor/push-notifications` (już w
-- zależnościach, dotąd nieużywany) + Firebase Cloud Messaging + Supabase
-- Edge Function `notify-tournament` (supabase/functions/notify-tournament/),
-- wyzwalana triggerem bazy przez pg_net na każdej nowej ofercie przejazdu
-- lub noclegu. Wymaga jeszcze konfiguracji Firebase po stronie Pawła —
-- patrz supabase/functions/notify-tournament/README.md.
--
-- Klucz "anon" w nagłówku triggera jest publiczny (ten sam co w apce/CI) —
-- wystarcza, żeby przejść bramkę autoryzacji Edge Function. Prawdziwe
-- uprawnienia (odczyt device_tokens z pominięciem RLS, wysyłka FCM) ma
-- sama funkcja przez WŁASNY, automatycznie wstrzykiwany
-- SUPABASE_SERVICE_ROLE_KEY — nigdy nie trafia do tego pliku ani do repo.

create extension if not exists pg_net;

create table device_tokens (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  token text not null,
  platform text not null default 'android' check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now(),
  unique (account_id, token)
);

alter table device_tokens enable row level security;

create policy "Właściciel zarządza swoimi tokenami urządzeń"
  on device_tokens for all
  to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create or replace function notify_new_offer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://jrabxtiranllayerhutm.supabase.co/functions/v1/notify-tournament',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_8-yxyMhoEEq-kHx2opU0Pg_QylogBur'
    ),
    body := jsonb_build_object(
      'trip_id', new.trip_id,
      'offer_kind', TG_ARGV[0]
    )
  );
  return new;
end;
$$;

create trigger on_ride_offer_notify
  after insert on ride_offers
  for each row execute function notify_new_offer('ride');

create trigger on_lodging_offer_notify
  after insert on lodging_offers
  for each row execute function notify_new_offer('lodging');
