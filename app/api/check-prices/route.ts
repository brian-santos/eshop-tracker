import { NextRequest, NextResponse } from "next/server";
import {
  getWatchlist,
  getSubscriptions,
  getAlertState,
  setAlertState,
  clearAlertState,
} from "@/lib/storage";
import { fetchPrices, extractPrice } from "@/lib/nintendo";
import { broadcastPush } from "@/lib/push";
import { formatPrice, REGIONS } from "@/lib/regions";
import type { RegionCode, WatchItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds

/**
 * GET /api/check-prices
 *
 * Secured with Bearer ${CRON_SECRET}. Iterates the watchlist, fetches prices
 * from Nintendo grouped by region, and dispatches push notifications for any
 * item whose current price is at or below its configured threshold.
 *
 * Alerting logic (de-dupe):
 *   - First time a price is ≤ threshold, we alert and record the price.
 *   - Subsequent checks don't re-alert unless:
 *       (a) the price drops further, OR
 *       (b) the price rises above threshold (state clears) and then drops again.
 */
export async function GET(req: NextRequest) {
  // Auth
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getWatchlist();
  if (items.length === 0) {
    return NextResponse.json({ checked: 0, alerts: 0 });
  }

  // Group by region
  const byRegion = new Map<RegionCode, WatchItem[]>();
  for (const it of items) {
    const arr = byRegion.get(it.region) ?? [];
    arr.push(it);
    byRegion.set(it.region, arr);
  }

  const alerts: Array<{ item: WatchItem; currentPrice: number; currency: string }> = [];
  let checked = 0;

  for (const [region, group] of byRegion.entries()) {
    try {
      const res = await fetchPrices(region, group.map((g) => g.nsuid));
      const byNsuid = new Map(res.prices.map((p) => [String(p.title_id), p]));
      for (const item of group) {
        checked++;
        const p = byNsuid.get(item.nsuid);
        if (!p) continue;
        const ext = extractPrice(p);
        if (ext.currentPrice == null || !ext.currency) continue;

        const state = await getAlertState(item.id);

        if (ext.currentPrice > item.threshold) {
          // Price is above threshold — clear any prior alert state so a future drop triggers again.
          if (state) await clearAlertState(item.id);
          continue;
        }

        // Below threshold. Alert unless we've already alerted at ≤ this price.
        const shouldAlert =
          !state || ext.currentPrice < state.lastAlertedPrice;

        if (shouldAlert) {
          alerts.push({
            item,
            currentPrice: ext.currentPrice,
            currency: ext.currency,
          });
          await setAlertState(item.id, {
            lastAlertedPrice: ext.currentPrice,
            lastAlertedAt: Date.now(),
          });
        }
      }
    } catch (err) {
      console.error(`Failed to fetch prices for ${region}:`, err);
    }
  }

  // Dispatch pushes
  let sent = 0;
  if (alerts.length > 0) {
    const subs = await getSubscriptions();
    if (subs.length > 0) {
      for (const alert of alerts) {
        const regionMeta = REGIONS[alert.item.region];
        const priceStr = formatPrice(alert.currentPrice, alert.currency);
        const thresholdStr = formatPrice(alert.item.threshold, alert.currency);
        const result = await broadcastPush(subs, {
          title: `🎮 ${alert.item.title} is ${priceStr}`,
          body: `${regionMeta.flag} ${regionMeta.name} — below your ${thresholdStr} target`,
          url: "/",
          tag: `watch-${alert.item.id}`,
        });
        sent += result.sent;
      }
    }
  }

  return NextResponse.json({
    checked,
    alerts: alerts.length,
    pushSent: sent,
  });
}
