import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// "Poproś o miejsce" (przejazdy) / "Dołącz" (noclegi) — prośby o dołączenie
// do cudzej oferty. RLS (supabase/migrations/0007_join_requests_rls.sql)
// pokazuje każdemu tylko prośby, w których jest stroną (proszący albo
// właściciel oferty), więc jedno zapytanie bez dodatkowych filtrów już
// zwraca dokładnie to, co ten użytkownik powinien widzieć — tu tylko
// dzielimy wynik na "przychodzące" (moje oferty) i "wychodzące" (moje
// prośby), po `created_by_account_id` w embedowanych wyjazdach.
//
// `kind`: "ride" | "lodging" — te dwie tabele mają identyczny kształt,
// stąd jeden hook zamiast kopiowania dwa razy.
const CONFIG = {
  ride: {
    table: "ride_join_requests",
    offerFk: "ride_offer_id",
    offerEmbed:
      "ride_offers(id, free_seats, luggage_space, cost_split_suggestion, trips(departure_city, created_by_account_id, players(first_name), tournaments(name)))",
  },
  lodging: {
    table: "lodging_join_requests",
    offerFk: "lodging_offer_id",
    offerEmbed:
      "lodging_offers(id, kind, place_name, free_spots, trips(departure_city, created_by_account_id, players(first_name), tournaments(name)))",
  },
};

export function useJoinRequests(kind, accountId) {
  const cfg = CONFIG[kind];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!accountId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from(cfg.table)
      .select(`*, requester_trip:trips(departure_city, created_by_account_id, players(first_name)), ${cfg.offerEmbed}`)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setRows(data ?? []);
    }
    setLoading(false);
  }, [cfg, accountId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const offerKey = cfg.offerFk.startsWith("ride") ? "ride_offers" : "lodging_offers";
  const incoming = rows.filter((r) => r[offerKey]?.trips?.created_by_account_id === accountId);
  const outgoing = rows.filter((r) => r.requester_trip?.created_by_account_id === accountId);

  const requestToJoin = async ({ offerId, requesterTripId }) => {
    const { data, error } = await supabase
      .from(cfg.table)
      .insert({ [cfg.offerFk]: offerId, requester_trip_id: requesterTripId })
      .select(`*, requester_trip:trips(departure_city, created_by_account_id, players(first_name)), ${cfg.offerEmbed}`)
      .single();
    if (error) return { error };
    setRows((prev) => [data, ...prev]);
    return { data };
  };

  const respond = async (requestId, status) => {
    const { data, error } = await supabase
      .from(cfg.table)
      .update({ status })
      .eq("id", requestId)
      .select(`*, requester_trip:trips(departure_city, created_by_account_id, players(first_name)), ${cfg.offerEmbed}`)
      .single();
    if (error) return { error };
    setRows((prev) => prev.map((r) => (r.id === requestId ? data : r)));

    // Akceptacja odblokowuje wspólną rozmowę — patrz RLS w
    // 0008_messages_rls.sql (jedyna droga do rozmowy to zaakceptowana
    // prośba). Best-effort: jeśli się nie uda, prośba i tak jest
    // zaakceptowana, tylko czat trzeba by dodać ręcznie później.
    if (status === "accepted") {
      const requesterAccountId = data.requester_trip?.created_by_account_id;
      if (!requesterAccountId || !accountId) {
        // Nie powinno się zdarzyć przy poprawnym RLS (patrz
        // 0010_fix_requester_trip_visibility.sql) — zostawiamy ślad
        // zamiast cicho pomijać tworzenie rozmowy, jak wcześniej.
        console.error(
          "[useJoinRequests] Brak requester_trip.created_by_account_id — rozmowa NIE powstała dla",
          requestId
        );
      } else {
        const { data: conv, error: convError } = await supabase
          .from("conversations")
          .insert({ kind, [cfg.offerFk]: data[cfg.offerFk] })
          .select("id")
          .single();
        if (convError) {
          console.error("[useJoinRequests] Nie udało się utworzyć rozmowy:", convError.message);
        } else if (conv) {
          const { error: participantsError } = await supabase.from("conversation_participants").insert([
            { conversation_id: conv.id, account_id: accountId },
            { conversation_id: conv.id, account_id: requesterAccountId },
          ]);
          if (participantsError) {
            console.error("[useJoinRequests] Nie udało się dodać uczestników rozmowy:", participantsError.message);
          }
        }
      }
    }

    return { data };
  };

  return { incoming, outgoing, loading, error, requestToJoin, respond, refresh };
}
