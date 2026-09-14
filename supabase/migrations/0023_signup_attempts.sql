-- Licznik prób rejestracji — komunikat "X/2 w tej godzinie" na ekranie
-- rejestracji (Paweł, wczesna beta). Wbudowany mailer Supabase ma twardy
-- limit 2 maile/h na cały projekt (Authentication → Rate Limits) —
-- zamiast dawać ludziom czekać w ciemno na maila, który może nie
-- przyjść, apka pokazuje, ile prób już wykorzystano w tej godzinie.
--
-- UWAGA: to loguje KAŻDĄ próbę wysłania formularza, nie faktycznie
-- wysłane maile (np. próba z zajętym e-mailem i tak tu wpadnie, choć
-- Supabase nie wyśle za nią maila) — przybliżenie wystarczające do
-- komunikatu w UI, nie precyzyjne odzwierciedlenie limitu Supabase.
-- Żadnych danych osobowych — tylko znacznik czasu.

create table signup_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table signup_attempts enable row level security;

create policy "Każdy zapisuje próbę rejestracji"
  on signup_attempts for insert
  to anon, authenticated
  with check (true);

create policy "Każdy widzi licznik prób rejestracji"
  on signup_attempts for select
  to anon, authenticated
  using (true);
