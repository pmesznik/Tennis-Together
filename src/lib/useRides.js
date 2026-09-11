import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// Oferty i prośby o przejazd — widoczne dla WSZYSTKICH zalogowanych (nie
// tylko właściciela), to jest sens tej funkcji: dopasowania między
// rodzinami. RLS w bazie (supabase/migrations/0005_rides_rls.sql) i tak to
// egzekwuje — tu tylko dołączamy dane turnieju/zawodnika do wyświetlenia.
const SELECT_WITH_TRIP =
  "*, trips(tournament_id, departure_city, departure_date, tournaments(name, starts_on, category), players(first_name))";

export function useRideOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ride_offers")
      .select(SELECT_WITH_TRIP)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setOffers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createOffer = async ({ tripId, freeSeats, luggageSpace, driverNotes, costSplitSuggestion }) => {
    const { data, error } = await supabase
      .from("ride_offers")
      .insert({
        trip_id: tripId,
        free_seats: freeSeats,
        luggage_space: luggageSpace || null,
        driver_notes: driverNotes || null,
        cost_split_suggestion: costSplitSuggestion || null,
      })
      .select(SELECT_WITH_TRIP)
      .single();

    if (error) return { error };
    setOffers((prev) => [data, ...prev]);
    return { data };
  };

  return { offers, loading, error, createOffer, refresh };
}

export function useRideRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ride_requests")
      .select(SELECT_WITH_TRIP)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setRequests(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRequest = async ({ tripId, seatsNeeded, notes }) => {
    const { data, error } = await supabase
      .from("ride_requests")
      .insert({ trip_id: tripId, seats_needed: seatsNeeded, notes: notes || null })
      .select(SELECT_WITH_TRIP)
      .single();

    if (error) return { error };
    setRequests((prev) => [data, ...prev]);
    return { data };
  };

  return { requests, loading, error, createRequest, refresh };
}
