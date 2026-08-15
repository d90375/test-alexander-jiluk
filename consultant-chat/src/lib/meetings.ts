export type MeetingStatus = "scheduled" | "completed" | "cancelled";

export type Meeting = {
  id: number;
  title: string;
  date: string; // ISO with explicit offset, so it doesn't depend on server tz
  status: MeetingStatus;
};

// Single source for both the route handler and the server-side prefetch.
const MEETINGS: Meeting[] = [
  {
    id: 1,
    title: "Первичная консультация",
    date: "2026-08-05T14:00:00+03:00",
    status: "completed",
  },
  {
    id: 2,
    title: "Разбор результатов анализов",
    date: "2026-08-13T11:30:00+03:00",
    status: "scheduled",
  },
  {
    id: 3,
    title: "Повторная консультация",
    date: "2026-08-20T16:00:00+03:00",
    status: "scheduled",
  },
  {
    id: 4,
    title: "Групповая сессия",
    date: "2026-08-08T18:00:00+03:00",
    status: "cancelled",
  },
];

export async function getMeetings(): Promise<Meeting[]> {
  return MEETINGS;
}
