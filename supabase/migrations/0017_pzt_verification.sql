-- Weryfikacja zawodnika przez login PZT (Paweł, 2026-09-12) — pierwszy,
-- najtańszy krok w stronę "z kim ja właściwie jadę": zamiast dowolnego
-- zdjęcia (nic nie weryfikuje samo z siebie) albo drogiej weryfikacji
-- dokumentu tożsamości, kotwiczymy profil zawodnika w PRAWDZIWYM,
-- zewnętrznym rejestrze — bazie PZT, do której dostęp już mamy (scraper
-- z projektu NOWA APLIKACJA PZT ANDROID, ten sam co w "znajdź turniej po
-- zawodniku").
--
-- `players.pzt_login` istniał od 0001_init.sql, ale nieużywany. Te dwie
-- kolumny dokładają samą weryfikację: `pzt_verified` = imię/nazwisko
-- wpisane w tym profilu zgadzało się z tym, co portal PZT zwraca live dla
-- tego loginu, w chwili `pzt_verified_at`. Ustawiane z aplikacji (nie tu),
-- bo to ona robi live-sprawdzenie przez API — RLS na `players` (0001)
-- już pozwala właścicielowi na update własnego wiersza, więc nie trzeba
-- żadnej nowej polityki.

alter table players
  add column pzt_verified boolean not null default false,
  add column pzt_verified_at timestamptz;
