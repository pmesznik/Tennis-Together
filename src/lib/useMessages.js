import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const POLL_MS = 4000;

// Wiadomości w jednej rozmowie. Bez Supabase Realtime na razie (wymaga
// dopisania tabeli do publikacji replikacji, czego nie da się zweryfikować
// bez sesji na żywo) — zamiast tego lekkie odpytywanie co 4s, dopóki okno
// czatu jest otwarte. Prosty, przewidywalny mechanizm na start.
export function useMessages(conversationId, accountId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) setError(error.message);
    else {
      setError(null);
      setMessages(data ?? []);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [conversationId, load]);

  const sendMessage = async (body) => {
    const trimmed = body.trim();
    if (!trimmed) return { error: null };
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_account_id: accountId, body: trimmed })
      .select()
      .single();
    if (error) return { error };
    setMessages((prev) => [...prev, data]);
    return { data };
  };

  return { messages, loading, error, sendMessage };
}
