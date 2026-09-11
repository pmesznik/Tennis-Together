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
- **Ikona aplikacji** (2026-09-11, dostarczona przez Pawła):
  `docs/app-icon-source.png` (1254×1254, niebieska zaokrąglona plakietka —
  piłka tenisowa + ludzie + samolot/auto). Wygenerowane z niej automatycznie:
  `public/icon-192.png` / `icon-512.png` (PWA, przezroczyste narożniki) oraz
  komplet ikon Androida (`android/app/src/main/res/mipmap-*`) — legacy
  `ic_launcher`/`ic_launcher_round` per gęstość + adaptive icon
  (`ic_launcher_foreground` zmniejszony do 68% wewnątrz "safe zone", żeby
  żadna maska launchera — koło, squircle — nie ucinała samolotu/auta na
  krawędziach; tło adaptacyjne ustawione na dominujący niebieski z ikony,
  `#074BA8`). Nie dotyka to kolorystyki UI w apce (`tokens.css`) — ikona ma
  świadomie inną, własną kolorystykę niż "Neon Court" w środku.

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

## Stan Supabase (2026-09-11)

- Projekt `tennis-together` utworzony, region Frankfurt, plan Free.
- `supabase/migrations/0001_init.sql` uruchomiony — wszystkie 12 tabel
  istnieje i odpowiada przez REST API (zweryfikowane).
- `.env` lokalnie uzupełniony (`VITE_SUPABASE_URL` + nowy format klucza
  `sb_publishable_...`, obsługiwany przez `@supabase/supabase-js@^2.49`).
- Logowanie/rejestracja działają end-to-end: `src/lib/AuthContext.jsx` +
  `src/pages/AuthPage.jsx`. Cała appka jest teraz zabramkowana — bez sesji
  widać ekran logowania zamiast zakładek.
- Rejestracja tworzy wiersz w `accounts` **dopiero po pierwszym
  zalogowaniu**, bo projekt ma domyślnie włączone "Confirm email" (Auth →
  Providers → Email) — dane z formularza (rola, imię) czekają w tym czasie
  w `localStorage`. Do szybszego testowania na dev można wyłączyć "Confirm
  email" w tych ustawieniach; **trzeba je z powrotem włączyć przed betą**
  (bez tego ktoś mógłby zakładać konta na cudzy e-mail).
- Profil rodzica (`ProfilePage.jsx`) pokazuje już prawdziwe imię/rolę/e-mail
  z bazy i ma działające „Wyloguj”. Zgody i historia wyjazdów są nadal
  danymi przykładowymi — `consents`/`trips` jeszcze nie podłączone.
- **Profil zawodnika działa na prawdziwych danych** (`src/lib/usePlayers.js`
  + `ProfilePage.jsx`): dodawanie zawodnika (imię, nazwisko, rok urodzenia,
  kategoria, klub, miasto — opcjonalne pola), przełącznik między kilkoma
  dziećmi tego samego rodzica, formularz od razu widoczny, gdy lista jest
  pusta. Zapisane w `players`, chronione RLS. **Zweryfikowane na żywo przez
  Pawła 2026-09-11** — rejestracja, potwierdzenie e-maila, logowanie i
  dodanie zawodnika przeszły bez problemu.
- **RLS uzupełnione o `accounts`** (`supabase/migrations/0002_accounts_rls.sql`,
  uruchomiona przez Pawła w SQL Editorze) — była to jedyna otwarta tabela z
  prawdziwym zagrożeniem prywatności (każdy z publicznym kluczem anon mógł
  czytać/nadpisywać cudze konta, w tym telefony).
  Pozostałe tabele (`trips`, `ride_offers`, `conversations`, `messages`...)
  są nadal otwarte, ale świadomie odłożone — żadna z nich nie jest jeszcze
  podłączona pod prawdziwe zapytania (dalej korzystają z `mockData.js`),
  więc pisanie im polityk RLS teraz byłoby zgadywaniem bez możliwości
  przetestowania. Robimy to tabela po tabeli, w miarę jak każda dostaje
  prawdziwy ekran.
- Podczas testów rejestracji powstało testowe konto na wymyślony adres
  `pawel.test.tennistogether@gmail.com` (niepotwierdzone, nikt się nim nie
  zaloguje) — do usunięcia w Authentication → Users w panelu Supabase,
  jeśli przeszkadza.

## Import turniejów OTK (2026-09-11)

- `scripts/import_tournaments.py` — port scrapera `scrape_tournaments_list()`
  z projektu PZT (bez logowania do PZT, bez pola "registration"). **Przetestowany
  na żywo** przeciwko portal.pzt.pl (lokalnie, dry-run): 53 turnieje w 4
  kategoriach (U12/U14/U16/U18), poprawne polskie znaki, kilka wpisów bez
  miasta (np. mistrzostwa drużynowe) — stąd decyzja, żeby `city` było
  nullable. Ten widok PZT nigdy nie podaje daty zakończenia turnieju, więc
  `ends_on` też jest nullable (wolimy pokazać "nieznana" niż zgadywać złą datę).
- `supabase/migrations/0003_tournaments.sql` — powyższe zmiany kolumn + RLS
  na `tournaments` (publiczny odczyt dla zalogowanych, zapis tylko przez
  `service_role`). **Jeszcze nie uruchomiona w bazie.**
- `.github/workflows/import-tournaments.yml` — cron codziennie o 2:00 UTC +
  ręczne uruchomienie. **Wymaga sekretu `SUPABASE_SERVICE_ROLE_KEY`** w
  Settings → Secrets and variables → Actions (klucz "secret"/service_role z
  Project Settings → API Keys w Supabase — inny niż `VITE_SUPABASE_ANON_KEY`
  używany w appce; ten omija RLS, więc tylko jako sekret CI, nigdy w `.env`).
- Zakładka Turnieje (`TournamentsPage.jsx` + `src/lib/useTournaments.js`)
  czyta już prawdziwe dane z `tournaments` zamiast `mockData.js`. Build
  przechodzi, ekran logowania (niezależny od tej zmiany) zweryfikowany bez
  błędów konsoli — **pełny widok z danymi jeszcze nie zweryfikowany na żywo**
  (czeka na migrację 0003 + pierwszy import + Twoją prawdziwą sesję).
  Przycisk „Jadę na ten turniej” nadal nic nie zapisuje (patrz niżej).

## Android — lekcje przeniesione z projektu PZT (2026-09-11)

Trzy problemy, na które PZT Rankingi wpadło dopiero po fakcie (i wymagały
naprawy w locie) — tu zaadresowane od razu, zanim zdążyły się ujawnić:

- **Paski systemowe zasłaniały appkę** (`viewport-fit=cover` bez
  `env(safe-area-inset-*)` na nagłówku/dolnym menu/ekranie logowania) —
  naprawione w `App.jsx` i `AuthPage.jsx`. Zgłoszone przez Pawła po
  zainstalowaniu pierwszego debug APK.
- **Service Worker rejestrujący się też wewnątrz natywnej apki** — w PZT
  powodowało to "utkniętą" starą wersję po aktualizacji (stary SW w WebView
  przechwytywał żądania). Tu zapobieżone prewencyjnie: `injectRegister: null`
  w `vite.config.js` + rejestracja w `main.jsx` tylko gdy
  `!Capacitor.isNativePlatform()`.
- **`versionCode` zaszyty na sztywno** — w PZT był "1" od pierwszego builda,
  co też blokowało aktualizacje. Tu: `build.gradle` czyta go z
  `-PappVersionCode` (numer przebiegu CI), ale trzeba pamiętać, żeby ta
  flaga była w **każdym** workflow budującym APK — przy pierwszym labie tej
  naprawy zapomniałem jej dodać do `android-debug-apk.yml` (dodał tylko do
  `android-build.yml`), poprawione tego samego dnia.

Pełny opis wzorca (do zastosowania w KOLEJNYCH projektach Capacitor od
pierwszego dnia, nie po fakcie) zapisany w pamięci: `android-safe-area-insets`
i `capacitor-sw-versioncode`.

**Czwarty problem, znaleziony tego samego dnia:** `android-debug-apk.yml` na
świeżej maszynie GitHub Actions generował za każdym razem INNY, losowy klucz
debug (`~/.android/debug.keystore` nie jest zapamiętywany między
uruchomieniami CI) — Android traktował appkę podpisaną innym kluczem jako
inną aplikację i blokował instalację "aktualizacji" (trzeba było
odinstalować poprzednią wersję). Naprawione: `android/app/debug.keystore`
ze standardowymi, publicznie znanymi danymi (nie sekret) wygenerowany RAZ
przez CI i zacommitowany do repo — od buildu #7 każdy kolejny ma ten sam
podpis. Po drodze złapany i naprawiony błąd składni YAML (wieloliniowy
komunikat commita bez wcięcia w bloku `run: |` łamał parsowanie całego
pliku workflow — od tego czasu każdy plik `.yml` jest walidowany lokalnie
przez PyYAML przed pushem).

**Dystrybucja debug APK:** oprócz artifactu w zakładce Actions (wymaga
zalogowania do GitHub), `android-debug-apk.yml` publikuje teraz też
**GitHub Release** (`softprops/action-gh-release@v2`, tag `debug-vN`,
`prerelease: true`) — stały publiczny link do pobrania wprost w
przeglądarce na telefonie, bez logowania. Nie rozważamy dystrybucji przez
Google Play (świadoma decyzja Pawła) — jeśli sideloading APK zacznie
sprawiać kłopoty z Play Protect na szerszą skalę, jedyna droga bez Play
Store to instalacja przez ADB (kabel USB), do rozważenia później.
**Zasada robocza: przy każdym nowym buildzie APK, link do Release podawany
w czacie** (Paweł prosił o to wprost, 2026-09-11).

## Turnieje → wyjazdy (2026-09-11)

- **"Jadę na ten turniej" zapisuje teraz naprawdę** (`TournamentsPage.jsx`):
  klik otwiera formularz (wybór zawodnika, jeśli rodzic ma więcej niż
  jednego + **miasto wyjazdu**, wymagane — to jest to, po czym docelowo
  działa system dopasowań z dokumentu założeń, więc nie mogło zostać
  pominięte nawet w najprostszej wersji). Tworzy wiersz w `trips`.
- **"Moje wyjazdy" czyta prawdziwe dane** (`TripsPage.jsx` +
  `src/lib/useTrips.js`) zamiast `mockData.js`. Zakładki
  nadchodzące/w trakcie organizacji/zakończone są wyliczane z daty turnieju
  i pola `trips.status` (nowy wyjazd = "planning" = trafia do "w trakcie
  organizacji", dopóki nic go nie potwierdzi).
- **RLS na `trips`** (`0004_trips_rls.sql`) i na `tournaments`
  (`0003_tournaments.sql`) — **uruchomione przez Pawła, potwierdzone.**
- **Import turniejów OTK — działa.** Pierwsza próba (workflow „Import
  turniejów OTK") wysypała się z `InvalidHeader`: sekret
  `SUPABASE_SERVICE_ROLE_KEY` w GitHub zawierał jakiś biały znak (pewnie
  kopiowanie "na oko"). Naprawione w `scripts/import_tournaments.py` —
  skrypt teraz usuwa WSZYSTKIE białe znaki z klucza, nie tylko brzegi.
  Drugie uruchomienie: sukces, wszystkie kroki przeszły (scraper znalazł
  20 turniejów przy pierwszej, nieudanej próbie zapisu — sam scraping
  działał od początku).

## Przejazdy (2026-09-11)

- **Zakładka Przejazdy czyta i zapisuje prawdziwe dane**
  (`RidesPage.jsx` + `src/lib/useRides.js`) zamiast `mockData.js`. Oba
  kierunki ("Mam wolne miejsce" / "Szukam przejazdu") — lista widoczna dla
  wszystkich zalogowanych + formularz dodawania, który wymaga wybrania
  jednego z WŁASNYCH wyjazdów (z "Moje wyjazdy") jako punktu odniesienia.
  Jeśli użytkownik nie ma jeszcze żadnego wyjazdu, widzi podpowiedź z
  linkiem do zakładki Turnieje zamiast pustego formularza.
- **"Poproś o miejsce" / "Zaproponuj przejazd" / "Napisz" są nadal
  nieaktywne** (oznaczone "wkrótce") — wymagają ekranu zarządzania
  `ride_join_requests` (akceptacja przez właściciela oferty) i czatu,
  których jeszcze nie ma.
- **RLS** (`supabase/migrations/0005_rides_rls.sql`): `ride_offers` i
  `ride_requests` czytelne dla każdego zalogowanego (to jest sens tej
  funkcji), zapis tylko przez właściciela powiązanego wyjazdu. Dodatkowo
  kaskadowa widoczność `trips`/`players` — wyjazd i zawodnik stają się
  publicznie widoczni (imię, miasto wyjazdu — nie telefon, ten jest gdzie
  indziej) dopiero gdy ich właściciel doda do nich ofertę/prośbę o
  przejazd. Realizuje zasadę "imię i region widoczne od razu, reszta po
  akceptacji" z dokumentu założeń. `ride_join_requests` ma włączone RLS
  bez żadnej polityki (czyli zablokowane dla wszystkich poza
  service_role) — czeka na ekran zarządzania. **Migracja 0005 jeszcze nie
  uruchomiona w bazie.**
- Build zweryfikowany, ekran logowania bez błędów konsoli — **pełny
  przepływ Przejazdów jeszcze nie zweryfikowany na żywo** (czeka na
  migrację 0005 + Twoją sesję z co najmniej jednym wyjazdem).

## Następne kroki

1. ~~Uzupełnić `.env`~~ / ~~uruchomić `0001_init.sql`~~ / ~~logowanie~~ /
   ~~ekran dodawania zawodnika~~ / ~~RLS na `accounts`~~ /
   ~~"Jadę na ten turniej" → trips~~ / ~~import turniejów OTK~~ /
   ~~Przejazdy (kod)~~ — zrobione (patrz wyżej).
2. **Zostało do zrobienia przez Ciebie:** `0005_rides_rls.sql` w SQL
   Editorze (jak poprzednie migracje) → Przejazdy zaczną działać zgodnie
   z RLS.
3. Ekran akceptacji próśb o dołączenie (`ride_join_requests`) — właściciel
   oferty widzi kto prosi i może zaakceptować/odrzucić. Dopiero to
   odblokuje prawdziwe "Poproś o miejsce".
4. Podłączyć prawdziwe dane pod Noclegi i Wiadomości zamiast `mockData.js`
   (ten sam wzorzec co Przejazdy).
5. Znaleźć prawnika do regulaminu/polityki prywatności/DPIA — zanim ruszy
   zamknięta beta z udziałem osób spoza ATZ.
