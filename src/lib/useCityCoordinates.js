import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// Lista współrzędnych polskich miast (city_coordinates, 439 wpisów, patrz
// 0014_city_coordinates.sql) — statyczna, nie zmienia się w czasie sesji,
// więc cache na poziomie modułu wystarcza (jedno zapytanie na całą sesję
// aplikacji, niezależnie ile komponentów użyje tego hooka).
let cache = null;

export function useCityCoordinates() {
  const [cities, setCities] = useState(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    supabase
      .from("city_coordinates")
      .select("city, lat, lng")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          cache = data;
          setCities(data);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { cities, loading };
}

// Usuwa polskie znaki diakrytyczne + normalizuje wielkość liter/spacje —
// część miast w statycznej liście ma literówki w oryginalnych danych (np.
// "Zielona Gora" zamiast "Zielona Góra", patrz komentarz w migracji), a to
// samo dopasowanie chroni przed literówkami w tym, co wpisze użytkownik.
function normalizeCityName(name) {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z");
}

export function findCityCoords(cities, cityName) {
  if (!cityName) return null;
  const norm = normalizeCityName(cityName);
  const match = cities.find((c) => normalizeCityName(c.city) === norm);
  return match ? { lat: match.lat, lng: match.lng } : null;
}

// Odległość po powierzchni Ziemi (wzór haversine) — wystarczająca do
// orientacyjnego "~X km od Ciebie", nie do wyliczania trasy samochodem.
export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
