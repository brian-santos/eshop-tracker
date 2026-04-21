import { NextRequest, NextResponse } from "next/server";
import { searchEU } from "@/lib/nintendo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/search?q=... → array of EU-region game matches with NSUIDs. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });
  const results = await searchEU(q);
  return NextResponse.json({ results });
}
