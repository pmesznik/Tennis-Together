# Tennis Together — plan i decyzje

Apka ma rozwiązywać jeden problem: koszt i organizację wyjazdów na turnieje
tenisowe (przejazdy, noclegi, grupy wyjazdowe). Pełne założenia funkcjonalne
w `docs/ATZ_Aplikacja_Zawodnicy_Rodzice_Zalozenia.docx`.

## Decyzje (ustalone 2026-09, Paweł)

- **Podmiot prowadzący:** jeszcze nie wybrany — do ustalenia przed publikacją
  (wpływa na konto deweloperskie, administratora danych, regulamin).
- **Platformy:** Android (Capacitor) + PWA równolegle od startu. iOS dochodzi
  później, przed publikacją produkcyjną.
- **Nocleg u rodziny innego zawodnika:** **odłożony na etap 2** — najpierw
  sprawdzamy popyt na resztę aplikacji, potem wracamy do tego z weryfikacją
  tożsamości i konsultacją prawną.
- **Konta:** tylko dorośli (rodzic/opiekun/trener) zakładają konto. Zawodnik
  jest profilem pod kontem rodzica. Zawodnik 16+ może mieć własne logowanie,
  powiązane z rodzicem.
- **Nazwa robocza:** Tennis Together (domena jeszcze nie kupiona).
- **Zespół:** głównie Paweł + Claude Code, programista pomocniczy dopiero na
  późniejszym etapie.
- **Zasięg startu:** cała Polska od pierwszego dnia (nie wąski region) — patrz
  ryzyko "zimny start" niżej, kompensujemy to panelem trenera/klubu w MVP.
- **Budżet:** ograniczony na start — wszystko na darmowych/najtańszych planach,
  płatne dopiero jak będzie ruch. **Supabase Free** (sprawdzone 2026-09,
  supabase.com/pricing): 500 MB bazy, 1 GB storage, 50 000 MAU, 5 GB
  transferu/mies., 2 darmowe projekty, bez karty kredytowej, użycie
  komercyjne dozwolone. Wystarczy z dużym zapasem na fazę budowy i pierwsze
  testy. Jedyny haczyk: darmowy projekt usypia się po 7 dniach bez ruchu i
  budzi się sam przy pierwszym zapytaniu (parę sekund opóźnienia) — jeśli
  zrobimy dłuższą przerwę, może trzeba będzie ręcznie "obudzić" go w panelu.
  Przejście na Pro (od 25 USD/mies., głównie: brak usypiania + kopie
  zapasowe) dopiero gdy zbliżymy się do limitów albo aplikacja ma już
  żywych użytkowników.
- **Termin:** działające MVP do końca 2026 (orientacyjnie ~3,5 miesiąca od
  2026-09-10 — to jest napięty harmonogram, patrz "Ryzyka terminu" niżej).
- **Design:** nowy, własny styl marki (nie kopiujemy wyglądu apki PZT) —
  identyfikacja wizualna do zaprojektowania równolegle z budową MVP.
- **Regulamin / polityka prywatności:** czekamy na prawnika, nie tworzymy
  roboczych wersji na własną rękę.
- **GitHub:** repo pod kontem `pmesznik` — https://github.com/pmesznik/Tennis-Together
- **Dane o turniejach:** reużywamy scraper OTK z projektu PZT
  (`portal.pzt.pl`, patrz `NOWA APLIKACJA PZT ANDROID/analyzer.py` i
  `pzt_player_scraper.py`). Tennis Europe i ITF na start — ręcznie/zgłoszenia.
- **Panel trenera/klubu:** wchodzi do MVP (nie etap 2) — jeden trener = od
  razu 5–10 rodzin, kluczowe przy starcie ogólnopolskim bez wąskiego regionu
  testowego.
- **Monetyzacja:** brak w MVP, całkowicie bezpłatne na start.

## Identyfikacja wizualna (UX/branding)

Koncepcja graficzna przygotowana przez Pawła:
`docs/UX_Branding_Tennis_Together.docx` ("Neon Court & Cyber Clay").
Wdrożona jako design tokens w `src/styles/tokens.css` + demo na stronie Start.

- **Styl:** glassmorphism, Dark Mode Premium domyślnie (oszczędza baterię na
  całodniowych turniejach), Light Mode jako ręczny przełącznik (czytelność w
  słońcu na korcie) — nie podłączony pod ustawienia systemowe telefonu.
- **Paleta:** Tennis Ball Neon `#D4FF00` (primary), Clay Court Coral `#FF5E3A`
  (secondary), Emerald/Cyan (`#10B981` / `#00F0FF`) na odznakę "Parent
  Verified", Deep Court Graphite `#0D131E` (tło dark), Soft Ice Gray `#F4F6FB`
  (tło light).
- **Odstępstwo od dokumentu:** w light mode odcienie neonu i koralu są
  przyciemnione (`#7A9400`, `#C2431F`) względem oryginalnych kodów — surowe
  `#D4FF00`/`#FF5E3A` nie dają wystarczającego kontrastu tekstu na jasnym tle
  (WCAG AA). Na dark mode oryginalne kolory zostają.
- **Typografia:** nagłówki Plus Jakarta Sans, treść Inter — oba darmowe
  (Google Fonts). Dokument proponował też płatny Clash Display do nagłówków;
  pominięty na start ze względu na ograniczony budżet, do rozważenia później.
- **"Parent Verified":** w MVP to weryfikacja telefonu/e-maila (kolumna
  `accounts.verified` w schemacie), nie weryfikacja dokumentu tożsamości —
  ta cięższa wersja ma sens przy "noclegu u rodziny" w etapie 2.
- Nazwa w dokumencie brzmi "Tennis Trip" (robocza nazwa z wcześniejszego
  etapu) — w kodzie i repo zostaje ustalone "Tennis Together".

## Architektura

| Warstwa | Wybór |
|---|---|
| Aplikacja | React + Vite + Capacitor (ten sam zestaw co w projekcie PZT) |
| Backend | Supabase (Postgres + PostGIS + Auth + Realtime), region UE/Frankfurt |
| Powiadomienia | Firebase Cloud Messaging + `@capacitor/push-notifications` |
| Import turniejów | GitHub Actions (cron) + scraper z projektu PZT |
| Błędy | Sentry (do podłączenia przed betą) |

Brak własnego backendu FastAPI — logowanie, RLS, czat i kopie zapasowe
zapewnia Supabase od razu, bez pisania tego samodzielnie.

## Model danych (MVP)

Schemat startowy: `supabase/migrations/0001_init.sql`.

- **Ludzie:** `accounts` (dorośli), `players` (profile pod rodzicem),
  `consents` (zgody z datą).
- **Turnieje i wyjazdy:** `tournaments`, `trips` ("Jadę" — zawodnik + turniej +
  miejsce wyjazdu + daty).
- **Przejazdy/noclegi:** `ride_offers`/`ride_requests`,
  `ride_join_requests` (prośba → akceptacja → dane kontaktowe się odblokowują),
  analogicznie `lodging_*`.
- **Grupy i czat:** `trip_groups`, `conversations`, `messages`.
- **Bezpieczeństwo:** `reports`, `blocks` (od pierwszego dnia, nie opcjonalne).

**Dopasowania w MVP:** ten sam turniej + nakładające się daty (±1 dzień) +
miejsce wyjazdu w promieniu X km (PostGIS, jedno zapytanie). Dopasowanie "po
trasie" — etap 2.

**Prywatność:** lista "kto jedzie" pokazuje imię, kategorię, region. Nazwisko,
telefon i dokładne miejsce zbiórki — tylko po zaakceptowaniu prośby
(`ride_join_requests` / `lodging_join_requests`).

## MVP — zakres

W MVP:
- rejestracja dorosłych, profile zawodników, zgody
- kalendarz: OTK automatycznie, TE/ITF ręcznie
- "Jadę" → karta wyjazdu
- dopasowania (turniej + termin + trasa)
- przejazdy: "mam miejsce" / "szukam" + prośba/akceptacja
- noclegi: wspólny obiekt / współlokator (bez "u rodziny")
- grupa wyjazdowa + czat
- powiadomienia push
- zgłoś/zablokuj użytkownika, usuwanie konta
- **panel trenera/klubu** (wyjazd klubowy, lista zawodników)
- prosty panel administratora do moderacji

Etap 2: nocleg u rodziny, oceny, liczenie/podział kosztów, mapa przejazdów,
integracja kalendarzy. Etap 3: rezerwacje w aplikacji, system reputacji,
model biznesowy (z dokumentu założeń, sekcje 19–21).

## Ryzyka

1. **Zimny start + start ogólnopolski.** Dopasowania działają tylko przy
   krytycznej masie użytkowników na tym samym turnieju. Mitygacja: panel
   trenera/klubu w MVP, karta wyjazdu użyteczna nawet solo (plan/koszty/lista
   rzeczy), ambasadorzy-trenerzy, QR/link w komunikatach organizatorów.
2. **Termin koniec 2026 jest napięty** na pełny zakres MVP powyżej przy jednej
   osobie piszącej kod. Jeśli się nie wyrobimy — pierwsza rzecz do wycięcia:
   panel admina rozbudowany (zostaje minimalny), potem integracja TE/ITF
   (zostaje ręczne dodawanie).
3. **Dzieci + dane + nocleg.** Rozwiązane architekturą kont (tylko dorośli)
   i odłożeniem "nocleg u rodziny" na etap 2 — ale regulamin/polityka
   prywatności i DPIA muszą powstać z prawnikiem przed betą z udziałem
   zewnętrznych klubów (nie tylko ATZ).
4. **Przejazdy za pieniądze = przewóz osób.** Regulamin musi jasno mówić, że
   to dzielenie kosztów, nie usługa przewozu, i że aplikacja nie jest
   przewoźnikiem. Bez prawnika na razie nie formułujemy tego tekstu.

## Lista kontrolna „gotowe do produkcji”

- RLS uzupełnione na każdej tabeli (dziś gotowe tylko dla `players` jako
  przykład) + test, że rodzina A nie widzi danych rodziny B
- kopie zapasowe z przywracaniem do punktu w czasie, osobna baza prod/staging
- Sentry + ograniczenie liczby zapytań
- podpisany plik AAB z numerem wersji w nazwie (jak w projekcie PZT)
- formularz "Bezpieczeństwo danych" + ankieta treści w Google Play, link do
  polityki prywatności
- kolejka zgłoszeń z czasem reakcji, filtr słów w czacie
- akceptacja regulaminu i zgody rodzica zapisane z datą (`consents`)

## Następne kroki

1. Uzupełnić `.env` z danymi nowego projektu Supabase (region Frankfurt) i
   uruchomić `supabase/migrations/0001_init.sql`.
2. Dodać logowanie (Supabase Auth) i ekran rejestracji rodzic/zawodnik.
3. Przenieść/zaadaptować scraper OTK z projektu PZT do zasilania `tournaments`.
4. Zaprojektować identyfikację wizualną (branding) — równolegle, nie blokuje
   budowy funkcji.
5. Znaleźć prawnika do regulaminu/polityki prywatności/DPIA — zanim ruszy
   zamknięta beta z udziałem osób spoza ATZ.
