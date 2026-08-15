import { NextResponse } from "next/server";
import { getMeetings } from "@/lib/meetings";

// Per-user data — must not be cached between requests.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getMeetings());
}
