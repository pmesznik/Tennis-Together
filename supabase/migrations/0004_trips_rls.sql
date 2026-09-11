-- RLS dla `trips` — kolejna tabela w kolejności "RLS tabela po tabeli, w
-- miarę jak dostaje prawdziwy ekran" (patrz PLAN.md). "Jadę na ten turniej"
-- (TournamentsPage.jsx) i "Moje wyjazdy" (TripsPage.jsx) czytają/piszą
-- teraz naprawdę, więc ta tabela nie może dłużej być otwarta przez anon key.
--
-- Właściciel wyjazdu = created_by_account_id (rodzic/opiekun, który go
-- utworzył) — prostsze niż sprawdzanie przez players.owner_account_id,
-- i wystarczające, bo trips zawsze zakłada dorosły w imieniu zawodnika.

alter table trips enable row level security;

create policy "Właściciel widzi i zarządza swoimi wyjazdami"
  on trips for all
  using (created_by_account_id = auth.uid())
  with check (created_by_account_id = auth.uid());
