"use client";

import { create } from "zustand";

export type ConnectionState = "connecting" | "online" | "offline";

export type ChatMessage = {
  id: string;
  text: string;
  author: "me" | "consultant";
  // "me" only: pending — sent, awaiting echo; queued — not sent, will be
  // retried after reconnect; delivered — echo confirmed.
  status?: "pending" | "queued" | "delivered";
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8081";

// crypto.randomUUID is secure-context only (absent over plain http on a LAN IP).
function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Closing a CONNECTING socket logs an error; StrictMode's cleanup hits exactly that.
function closeSocket(ws: WebSocket | null) {
  if (!ws) return;
  if (ws.readyState === WebSocket.CONNECTING) {
    ws.addEventListener("open", () => ws.close(), { once: true });
    return;
  }
  ws.close();
}

type ChatStore = {
  messages: ChatMessage[];
  connection: ConnectionState;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  retryNow: () => void;
};

// Socket and timers are not UI state — changing them must not trigger a render.
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;
let disposed = true;

export const useChatStore = create<ChatStore>((set, get) => {
  const flushQueue = (sock: WebSocket) => {
    // get() reads state at call time, so socket callbacks never go stale.
    const queued = get().messages.filter(
      (m) => m.author === "me" && m.status === "queued",
    );
    if (queued.length === 0) return;
    for (const m of queued) {
      sock.send(JSON.stringify({ id: m.id, text: m.text }));
    }
    set((s) => ({
      messages: s.messages.map((m) =>
        m.author === "me" && m.status === "queued"
          ? { ...m, status: "pending" }
          : m,
      ),
    }));
  };

  const openSocket = () => {
    if (disposed) return;
    set({ connection: "connecting" });

    const sock = new WebSocket(WS_URL);
    ws = sock;

    sock.onopen = () => {
      if (disposed) return;
      attempt = 0;
      set({ connection: "online" });
      flushQueue(sock);
    };

    // Protocol on top of the echo server: send {id, text}, get it back verbatim.
    sock.onmessage = (event) => {
      let payload: { id?: unknown; text?: unknown };
      try {
        payload = JSON.parse(String(event.data));
      } catch {
        return;
      }
      const { id, text } = payload;
      if (typeof id !== "string" || typeof text !== "string") return;

      set((s) => {
        const mine = s.messages.find((m) => m.id === id && m.author === "me");
        // Ignore duplicate echo after a resend, else the reply is added twice.
        if (!mine || mine.status === "delivered") return s;
        return {
          messages: [
            ...s.messages.map((m) =>
              m.id === id ? { ...m, status: "delivered" as const } : m,
            ),
            { id: `${id}:reply`, text, author: "consultant" as const },
          ],
        };
      });
    };

    // A browser WebSocket always fires close after error, so this covers both.
    sock.onclose = () => {
      if (disposed) return;
      if (ws === sock) ws = null;
      set((s) => ({
        connection: "offline",
        // Unconfirmed sends go back to the queue: the server may not have got
        // them, and resending is safe because echo is deduped by id.
        messages: s.messages.map((m) =>
          m.author === "me" && m.status === "pending"
            ? { ...m, status: "queued" }
            : m,
        ),
      }));
      const delay = Math.min(500 * 2 ** attempt, 5000);
      attempt += 1;
      reconnectTimer = setTimeout(openSocket, delay);
    };
  };

  return {
    messages: [],
    connection: "connecting",

    connect: () => {
      disposed = false;
      openSocket();
    },

    disconnect: () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      closeSocket(ws);
      ws = null;
    },

    sendMessage: (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const id = newId();
      const canSend = ws !== null && ws.readyState === WebSocket.OPEN;
      // Optimistic: show immediately, queue it when offline.
      set((s) => ({
        messages: [
          ...s.messages,
          {
            id,
            text: trimmed,
            author: "me" as const,
            status: canSend ? ("pending" as const) : ("queued" as const),
          },
        ],
      }));
      if (canSend) ws!.send(JSON.stringify({ id, text: trimmed }));
    },

    retryNow: () => {
      if (disposed) return;
      if (ws && ws.readyState <= WebSocket.OPEN) return;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      attempt = 0;
      openSocket();
    },
  };
});
