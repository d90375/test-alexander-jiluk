"use client";

import { useQuery } from "@tanstack/react-query";
import type { Meeting, MeetingStatus } from "@/lib/meetings";

const STATUS_LABEL: Record<MeetingStatus, { text: string; className: string }> =
  {
    scheduled: { text: "запланирована", className: "bg-green-100 text-green-800" },
    completed: { text: "прошла", className: "bg-slate-200 text-slate-600" },
    cancelled: { text: "отменена", className: "bg-red-100 text-red-700" },
  };

// Pinned timezone: server and client must format identically or hydration fails.
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});

async function fetchMeetings(): Promise<Meeting[]> {
  const res = await fetch("/api/meetings");
  if (!res.ok) throw new Error(`GET /api/meetings: ${res.status}`);
  return res.json();
}

export function MeetingsList() {
  const { data, isFetching, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
  });

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Мои встречи</h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {isFetching ? "Обновляю…" : "Обновить"}
        </button>
      </div>

      {isError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Не удалось загрузить встречи. Попробуйте «Обновить» ещё раз.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {data?.map((meeting) => {
          const status = STATUS_LABEL[meeting.status];
          return (
            <li
              key={meeting.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3"
            >
              <div>
                <p className="font-medium">{meeting.title}</p>
                <p className="text-sm text-slate-500">
                  {dateFormat.format(new Date(meeting.date))}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${status.className}`}
              >
                {status.text}
              </span>
            </li>
          );
        })}
      </ul>

      {dataUpdatedAt > 0 && (
        <p className="text-xs text-slate-400" suppressHydrationWarning>
          Обновлено:{" "}
          {new Intl.DateTimeFormat("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }).format(dataUpdatedAt)}
        </p>
      )}
    </section>
  );
}
