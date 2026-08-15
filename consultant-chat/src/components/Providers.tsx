"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Per-render client: a module-level singleton would be shared across SSR requests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Keeps hydrated data fresh so it isn't refetched right after hydration.
        defaultOptions: { queries: { staleTime: 30_000 } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
