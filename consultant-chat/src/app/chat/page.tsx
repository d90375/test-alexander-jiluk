import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Chat } from "@/components/Chat";
import { MeetingsList } from "@/components/MeetingsList";
import { getMeetings } from "@/lib/meetings";

// Meetings are per-user data, so render on every request.
export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const queryClient = new QueryClient();

  // Prefetch on the server so the list ships in the HTML and works without JS.
  // Calls getMeetings() directly — no point in an HTTP round trip to ourselves.
  await queryClient.prefetchQuery({
    queryKey: ["meetings"],
    queryFn: getMeetings,
  });

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-4 sm:p-6 lg:grid-cols-[2fr_3fr]">
      <h1 className="text-2xl font-bold lg:col-span-2">Чат с консультантом</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MeetingsList />
      </HydrationBoundary>
      <Chat />
    </main>
  );
}
