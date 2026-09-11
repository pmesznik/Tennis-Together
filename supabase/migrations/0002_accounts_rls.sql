-- Tennis Together — RLS dla `accounts`
--
-- Do tej pory `accounts` nie miało włączonego RLS — było jedyną tabelą poza
-- `players` bez zabezpieczenia. Klucz anon jest z definicji publiczny (trafia
-- do skompilowanej aplikacji na każdym telefonie), więc bez RLS KAŻDY, kto go
-- wyciągnie, mógł odczytać i nadpisać dowolne konto w tabeli (imię, telefon,
-- miasto). Wzorzec identyczny jak przy `players` w 0001_init.sql.
--
-- Uruchom w Supabase SQL Editor, tak samo jak 0001_init.sql.

alter table accounts enable row level security;

create policy "Właściciel widzi i edytuje swoje konto"
  on accounts for all
  using (id = auth.uid())
  with check (id = auth.uid());
