import { useState } from "react";
import { MOCK_CONVERSATIONS, MOCK_CHAT_MESSAGES } from "../mockData.js";

export default function MessagesPage() {
  const [openId, setOpenId] = useState(null);
  const open = MOCK_CONVERSATIONS.find((c) => c.id === openId);

  if (open) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
        <button className="btn-ghost" style={{ alignSelf: "flex-start", marginBottom: 12 }} onClick={() => setOpenId(null)}>
          ← Wiadomości
        </button>
        <h2 style={{ margin: "0 0 12px" }}>{open.title}</h2>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
          {MOCK_CHAT_MESSAGES.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.mine ? "mine" : "theirs"}`} style={{ display: "flex", flexDirection: "column" }}>
              {!m.mine && <strong style={{ fontSize: 11, opacity: 0.7 }}>{m.author}</strong>}
              {m.text}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            placeholder="Napisz wiadomość…"
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid var(--color-card-border)",
              background: "var(--color-bg-elevated)",
              color: "var(--color-text)",
            }}
          />
          <button className="btn-primary">Wyślij</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Wiadomości</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {MOCK_CONVERSATIONS.map((c) => (
          <button
            key={c.id}
            className="list-item"
            onClick={() => setOpenId(c.id)}
            style={{ cursor: "pointer", textAlign: "left" }}
          >
            <div className="avatar-circle">{c.title[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontSize: 14 }}>{c.title}</strong>
                {c.unread > 0 && (
                  <span
                    style={{
                      background: "var(--color-primary)",
                      color: "var(--color-primary-text)",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "1px 7px",
                      height: "fit-content",
                    }}
                  >
                    {c.unread}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.kind} · {c.lastMessage}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
