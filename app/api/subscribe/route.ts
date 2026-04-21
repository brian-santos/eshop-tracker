import { NextRequest, NextResponse } from "next/server";
import { addSubscription, removeSubscription } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/subscribe → store a browser push subscription. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const endpoint = body?.endpoint;
  const keys = body?.keys;
  if (
    typeof endpoint !== "string" ||
    !keys ||
    typeof keys.p256dh !== "string" ||
    typeof keys.auth !== "string"
  ) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  await addSubscription({ endpoint, keys, createdAt: Date.now() });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/subscribe?endpoint=... → unsubscribe. */
export async function DELETE(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  await removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
