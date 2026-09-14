import { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

// Średnia ocena + liczba ocen danego konta — jawnie publiczne (patrz
// account_rating() w 0022_ratings.sql), więc bezpieczne do pokazania
// PRZED dopasowaniem (np. na karcie oferty przejazdu), nie tylko po.
export function useAccountRating(accountId) {
  const [rating, setRating] = useState(null); // {avg_stars, count} | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .rpc("account_rating", { target_account_id: accountId })
      .then(({ data }) => {
        if (cancelled) return;
        setRating(data ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return { rating, loading };
}

// Czy JA już oceniłem/am to konkretne, potwierdzone spotkanie — żeby nie
// pokazywać formularza drugi raz (unique constraint na bazie i tak by
// zablokował duplikat, to tylko lepsze UI).
export async function hasRated(joinRequestId, kind) {
  const { data } = await supabase
    .from("ratings")
    .select("id")
    .eq("join_request_id", joinRequestId)
    .eq("join_request_kind", kind)
    .maybeSingle();
  return !!data;
}

export async function submitRating({ joinRequestId, kind, raterAccountId, ratedAccountId, stars, comment }) {
  const { error } = await supabase.from("ratings").insert({
    join_request_id: joinRequestId,
    join_request_kind: kind,
    rater_account_id: raterAccountId,
    rated_account_id: ratedAccountId,
    stars,
    comment: comment?.trim() || null,
  });
  return { error };
}
