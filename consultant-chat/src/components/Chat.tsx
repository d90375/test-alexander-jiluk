"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ChatMessage,
  type ConnectionState,
  useChatStore,
} from "@/lib/useChatStore";

const CONNECTION_UI: Record<ConnectionState, { text: string; dot: string }> = {
  online: { text: "на связи", dot: "bg-green-500" },
  connecting: { text: "подключение…", dot: "bg-amber-400" },
  offline: { text: "нет связи", dot: "bg-red-500" },
};

function MessageStatus({ status }: { status: ChatMessage["status"] }) {
  if (status === "pending") {
    return <span className="text-xs text-blue-200">отправляется…</span>;
  }
  if (status === "queued") {
    return (
      <span className="text-xs text-amber-200">
        не отправлено — уйдёт после переподключения
      </span>
    );
  }
  return <span className="text-xs text-blue-200">✓ доставлено</span>;
}

export function Chat() {
  const messages = useChatStore((s) => s.messages);
  const connection = useChatStore((s) => s.connection);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const retryNow = useChatStore((s) => s.retryNow);
  const connect = useChatStore((s) => s.connect);
  const disconnect = useChatStore((s) => s.disconnect);

  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    const list = listRef.current;
    if (list && atBottomRef.current) {
      list.scrollTo({ top: list.scrollHeight });
    }
  }, [messages]);

  const status = CONNECTION_UI[connection];

  return (
    <section className="flex h-[36rem] flex-col rounded-xl bg-white shadow-sm">
      <header className="flex items-center gap-2 border-b border-slate-200 p-4">
        <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} />
        <div>
          <h2 className="text-lg font-semibold leading-tight">Консультант</h2>
          <p className="text-xs text-slate-500">{status.text}</p>
        </div>
      </header>

      {connection === "offline" && (
        <div className="flex items-center justify-between gap-3 bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>Нет связи. Переподключаюсь автоматически…</span>
          <button
            type="button"
            onClick={retryNow}
            className="shrink-0 rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium transition hover:bg-red-100"
          >
            Повторить
          </button>
        </div>
      )}

      <div
        ref={listRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          atBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
        className="flex-1 space-y-2 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-slate-400">
            Напишите первое сообщение — сервер-эхо ответит через 300 мс.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.author === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                message.author === "me"
                  ? "rounded-br-sm bg-blue-600 text-white"
                  : "rounded-bl-sm bg-slate-100 text-slate-900"
              }`}
            >
              <p className="break-words text-sm">{message.text}</p>
              {message.author === "me" && (
                <MessageStatus status={message.status} />
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          atBottomRef.current = true;
          sendMessage(draft);
          setDraft("");
        }}
        className="flex gap-2 border-t border-slate-200 p-4"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Сообщение…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={draft.trim() === ""}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          Отправить
        </button>
      </form>
    </section>
  );
}
