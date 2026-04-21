import { NextRequest, NextResponse } from "next/server";
import { getWatchlist, addWatchItem, removeWatchItem, clearAlertState } from "@/lib/storage";
import { fetchPrices, extractPrice } from "@/lib/nintendo";
import { toUSD } from "@/lib/rates";
import { getRegion } from "@/lib/regions";
import type { RegionCode, WatchItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/watchlist → all watchlist items enriched with live prices. */
export async function GET() {
  const items = await getWatchlist();
  if (items.length === 0) return NextResponse.json({ items: [] });

  // Group by region so we batch Nintendo API calls.
  const byRegion = new Map<RegionCode, WatchItem[]>();
  for (const item of items) {
    const arr = byRegion.get(item.region) ?? [];
    arr.push(item);
    byRegion.set(item.region, arr);
  }

  const enriched = await Promise.all(
    [...byRegion.entries()].map(async ([region, group]) => {
      try {
        const res = await fetchPrices(region, group.map((g) => g.nsuid));
        const byNsuid = new Map(res.prices.map((p) => [String(p.title_id), p]));
        return await Promise.all(
          group.map(async (item) => {
            const p = byNsuid.get(item.nsuid);
            if (!p) return { ...item, currentPrice: null, lastChecked: Date.now() };
            const ext = extractPrice(p);
            const usd =
              ext.currentPrice != null && ext.currency
                ? await toUSD(ext.currentPrice, ext.currency)
                : null;
            return {
              ...item,
              ...ext,
              usdEquivalent: usd,
              lastChecked: Date.now(),
            };
          }),
        );
      } catch {
        return group.map((item) => ({ ...item, currentPrice: null, lastChecked: Date.now() }));
      }
    }),
  );

  return NextResponse.json({ items: enriched.flat() });
}

/** POST /api/watchlist → add a new watch item. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const nsuid = String(body.nsuid ?? "").trim();
  const region = String(body.region ?? "").toUpperCase() as RegionCode;
  const threshold = Number(body.threshold);

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (!/^7\d{13}$/.test(nsuid))
    return NextResponse.json({ error: "NSUID must be 14 digits starting with 7" }, { status: 400 });
  if (!getRegion(region))
    return NextResponse.json({ error: "Unsupported region" }, { status: 400 });
  if (!Number.isFinite(threshold) || threshold <= 0)
    return NextResponse.json({ error: "Threshold must be a positive number" }, { status: 400 });

  const item: WatchItem = {
    id: crypto.randomUUID(),
    title,
    nsuid,
    region,
    threshold,
    createdAt: Date.now(),
  };
  await addWatchItem(item);
  return NextResponse.json({ item });
}

/** DELETE /api/watchlist?id=... → remove a watch item. */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await removeWatchItem(id);
  await clearAlertState(id);
  return NextResponse.json({ ok: true });
}
