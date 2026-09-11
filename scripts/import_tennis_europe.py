#!/usr/bin/env python3
"""
Import kalendarza turniejów Tennis Europe (te.tournamentsoftware.com) do
tabeli `tournaments` w Supabase.

W przeciwieństwie do OTK (portal.pzt.pl, scripts/import_tournaments.py),
Tennis Europe udostępnia jedno, czyste zapytanie POST zwracające turnieje
z CAŁEJ Europy naraz (puste CountryCode = wszystkie kraje), ze
strukturalnym, łatwym do sparsowania HTML-em (klasy CSS: media__title,
media__subheading, tag, atrybuty <time datetime="...">) — i, czego OTK nie
dawało, PRAWDZIWĄ datą zakończenia turnieju, nie tylko startu.

Paginacja jest KUMULATYWNA — "Page=N" zwraca WSZYSTKIE wyniki od strony 1
do N naraz (zweryfikowane ręcznie: Page=10/15/20 dały identyczne 126
wyników). Dlatego zamiast pętli liniowej 1,2,3... robimy kilka zapytań
rosnąco (1, 3, 9, 27...) i kończymy, gdy liczba wyników przestaje rosnąć —
to sam komplet danych w 3-4 zapytaniach zamiast kilkunastu.

Endpoint znaleziony i zweryfikowany ręcznie (DevTools + testy z requests)
2026-09-11 — nie jest to udokumentowane, publiczne API, więc może się kiedyś
zmienić; jeśli import zacznie zwracać 0 wyników, sprawdzić najpierw czy
struktura strony się nie zmieniła.

Wymaga zmiennych środowiskowych:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY   (NIE anon/publishable key — upsert musi ominąć
                                RLS, tak samo jak w import_tournaments.py)

Uruchamiane przez .github/workflows/import-tennis-europe.yml (cron + ręcznie),
ale działa też lokalnie: `python scripts/import_tennis_europe.py`.
"""
from __future__ import annotations

import os
import re
import sys
from datetime import date, timedelta

import requests
from bs4 import BeautifulSoup

SEARCH_URL = "https://te.tournamentsoftware.com/find/tournament/DoSearch"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    # Bez tego serwer zwraca pełną stronę HTML (błąd/"message-page") zamiast
    # fragmentu z wynikami — złapane podczas ręcznego testowania.
    "X-Requested-With": "XMLHttpRequest",
}
MAX_PROBES = 6  # bezpiecznik: 1,3,9,27,81,243 — dalej już nie ma sensu
HORIZON_DAYS = 270  # ~9 miesięcy do przodu

# Strona źródłowa podaje kraj po angielsku — tłumaczymy na polski, żeby
# UI (polskojęzyczny) był spójny z turniejami OTK (tam kraj to zawsze
# "Polska", patrz import_tournaments.py). Kraj spoza tej listy zostaje
# po angielsku (bezpieczny fallback) zamiast wywalać import.
COUNTRY_PL = {
    "Albania": "Albania", "Andorra": "Andora", "Armenia": "Armenia",
    "Austria": "Austria", "Azerbaijan": "Azerbejdżan", "Belarus": "Białoruś",
    "Belgium": "Belgia", "Bosnia and Herzegovina": "Bośnia i Hercegowina",
    "Bulgaria": "Bułgaria", "Croatia": "Chorwacja", "Cyprus": "Cypr",
    "Czechia": "Czechy", "Denmark": "Dania", "Estonia": "Estonia",
    "Faroe Islands": "Wyspy Owcze", "Finland": "Finlandia", "France": "Francja",
    "Georgia": "Gruzja", "Germany": "Niemcy", "Great Britain": "Wielka Brytania",
    "Greece": "Grecja", "Hungary": "Węgry", "Iceland": "Islandia",
    "Ireland": "Irlandia", "Israel": "Izrael", "Italy": "Włochy",
    "Kosovo": "Kosowo", "Latvia": "Łotwa", "Liechtenstein": "Liechtenstein",
    "Lithuania": "Litwa", "Luxembourg": "Luksemburg", "Malta": "Malta",
    "Moldova": "Mołdawia", "Monaco": "Monako", "Montenegro": "Czarnogóra",
    "Netherlands": "Holandia", "North Macedonia": "Macedonia Północna",
    "Norway": "Norwegia", "Poland": "Polska", "Portugal": "Portugalia",
    "Romania": "Rumunia", "Russia": "Rosja", "San Marino": "San Marino",
    "Serbia": "Serbia", "Slovakia": "Słowacja", "Slovak Republic": "Słowacja",
    "Slovenia": "Słowenia", "Spain": "Hiszpania", "Sweden": "Szwecja",
    "Switzerland": "Szwajcaria", "Turkiye": "Turcja", "Ukraine": "Ukraina",
}


def fetch_page(page: int, start_date: str, end_date: str, timeout: int = 30) -> str:
    data = {
        "Page": str(page),
        "TournamentExtendedFilter.SportID": "0",
        "TournamentFilter.Q": "",
        "TournamentFilter.DateFilterType": "0",
        "TournamentFilter.StartDate": start_date,
        "TournamentFilter.EndDate": end_date,
        "TournamentExtendedFilter.CountryCode": "",  # puste = wszystkie kraje
        "TournamentExtendedFilter.GradingID": "",
        "TournamentExtendedFilter.AgeGroupID": "",
    }
    resp = requests.post(SEARCH_URL, data=data, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    return resp.text


def parse_cards(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    out = []

    for card in soup.select("div.media"):
        title_a = card.select_one("h4.media__title a")
        if not title_a:
            continue
        name = re.sub(r"\s+", " ", title_a.get_text(" ", strip=True)).strip()
        if not name:
            continue

        href = title_a.get("href", "")
        id_match = re.search(r"id=([0-9A-Fa-f-]+)", href)
        if not id_match:
            continue
        external_id = id_match.group(1).upper()

        subheadings = card.select(".media__subheading")
        location_el = subheadings[0] if subheadings else None
        city, country = None, None
        if location_el:
            flag_img = location_el.select_one("img")
            country = (flag_img.get("title") or flag_img.get("alt")) if flag_img else None
            loc_text = re.sub(r"\s+", " ", location_el.get_text(" ", strip=True)).strip()
            # Format: "Nazwa klubu | MIASTO, Kraj" (flaga w środku, get_text ją pomija)
            after_pipe = loc_text.split("|")[-1].strip()
            city_match = re.match(r"^([^,]+),", after_pipe)
            if city_match:
                city = city_match.group(1).strip().title()

        times = card.select("time[datetime]")
        starts_on = times[0]["datetime"][:10] if len(times) > 0 else None
        ends_on = times[1]["datetime"][:10] if len(times) > 1 else None
        if not starts_on:
            continue  # bez daty startu wpis jest bezużyteczny (starts_on NOT NULL)

        tags = [re.sub(r"\s+", " ", t.get_text(strip=True)) for t in card.select(".tag")]
        age_tag = next((t for t in tags if re.match(r"^\d+&U$", t)), None)
        category = f"U{age_tag[:-2]}" if age_tag else None

        out.append(
            {
                "external_id": external_id,
                "name": name,
                "city": city,
                "country": country,
                "category": category,
                "starts_on": starts_on,
                "ends_on": ends_on,
                "website_url": f"https://te.tournamentsoftware.com{href}" if href.startswith("/") else href,
            }
        )

    return out


def fetch_all(start_date: str, end_date: str) -> list[dict]:
    """Kumulatywna paginacja — eskaluje 1,3,9,27... aż liczba wyników
    przestanie rosnąć (patrz docstring modułu)."""
    prev_rows: list[dict] = []
    page = 1
    for _ in range(MAX_PROBES):
        html = fetch_page(page, start_date, end_date)
        rows = parse_cards(html)
        print(f"[Page={page}] {len(rows)} turniejów łącznie")
        if len(rows) <= len(prev_rows):
            return rows if rows else prev_rows
        prev_rows = rows
        page *= 3
    return prev_rows


def upsert_tournaments(rows: list[dict], supabase_url: str, service_role_key: str) -> None:
    if not rows:
        return
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/tournaments"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    payload = [
        {
            "source": "tennis_europe",
            "external_id": row["external_id"],
            "name": row["name"],
            "city": row["city"],
            "country": COUNTRY_PL.get(row["country"], row["country"]) if row["country"] else "Europa",
            "category": row["category"],
            "starts_on": row["starts_on"],
            "ends_on": row["ends_on"],
            "website_url": row["website_url"],
        }
        for row in rows
    ]
    resp = requests.post(
        endpoint,
        params={"on_conflict": "source,external_id"},
        headers=headers,
        json=payload,
        timeout=60,
    )
    if not resp.ok:
        print(f"Supabase odpowiedział {resp.status_code}: {resp.text[:500]}", file=sys.stderr)
    resp.raise_for_status()


def main() -> int:
    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    service_role_key = re.sub(r"\s+", "", os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))
    if not supabase_url or not service_role_key:
        print("Brak SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY w środowisku.", file=sys.stderr)
        return 1

    today = date.today()
    start_date = today.isoformat()
    end_date = (today + timedelta(days=HORIZON_DAYS)).isoformat()

    try:
        rows = fetch_all(start_date, end_date)
    except Exception as exc:
        print(f"Błąd pobierania kalendarza Tennis Europe: {exc}", file=sys.stderr)
        return 1

    upsert_tournaments(rows, supabase_url, service_role_key)
    print(f"Gotowe — zaimportowano/zaktualizowano {len(rows)} turniejów Tennis Europe.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
