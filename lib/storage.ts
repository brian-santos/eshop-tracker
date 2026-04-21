import { Redis } from "@upstash/redis";
import type { WatchItem, PushSubscriptionRecord } from "./types";

// Vercel's Upstash integration injects these exact env var names.
const redis = Redis.fromEnv();

// ─── Watchlist ────────────────────────────────────────────────

const WATCHLIST_KEY = "watchlist:v1";

export async function getWatchlist(): Promise<WatchItem[]> {
  const items = await redis.hvals<WatchItem>(WATCHLIST_KEY);
  return (items ?? []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addWatchItem(item: WatchItem): Promise<void> {
  await redis.hset(WATCHLIST_KEY, { [item.id]: item });
}

export async function removeWatchItem(id: string): Promise<void> {
  await redis.hdel(WATCHLIST_KEY, id);
}

export async function updateWatchItem(
  id: string,
  patch: Partial<WatchItem>,
): Promise<WatchItem | null> {
  const existing = await redis.hget<WatchItem>(WATCHLIST_KEY, id);
  if (!existing) return null;
  const updated: WatchItem = { ...existing, ...patch };
  await redis.hset(WATCHLIST_KEY, { [id]: updated });
  return updated;
}

// ─── Push subscriptions ───────────────────────────────────────

const SUBS_KEY = "push-subscriptions:v1";

export async function getSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const subs = await redis.hvals<PushSubscriptionRecord>(SUBS_KEY);
  return subs ?? [];
}

export async function addSubscription(sub: PushSubscriptionRecord): Promise<void> {
  // Use endpoint as the hash key — prevents duplicates if the same browser resubscribes.
  await redis.hset(SUBS_KEY, { [sub.endpoint]: sub });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await redis.hdel(SUBS_KEY, endpoint);
}

// ─── Alert state (prevents repeat alerts) ─────────────────────
// For each watchlist item we remember the last price we alerted on
// so we only alert again when the price drops further or rises then drops.

const ALERT_STATE_KEY = "alert-state:v1";

export interface AlertState {
  lastAlertedPrice: number;
  lastAlertedAt: number;
}

export async function getAlertState(itemId: string): Promise<AlertState | null> {
  return await redis.hget<AlertState>(ALERT_STATE_KEY, itemId);
}

export async function setAlertState(
  itemId: string,
  state: AlertState,
): Promise<void> {
  await redis.hset(ALERT_STATE_KEY, { [itemId]: state });
}

export async function clearAlertState(itemId: string): Promise<void> {
  await redis.hdel(ALERT_STATE_KEY, itemId);
}

// ─── Exchange rates cache ─────────────────────────────────────

const RATES_KEY = "rates:usd:v1";
const RATES_TTL = 24 * 60 * 60; // 24h

export interface RatesSnapshot {
  base: "USD";
  fetchedAt: number;
  rates: Record<string, number>;
}

export async function getCachedRates(): Promise<RatesSnapshot | null> {
  return await redis.get<RatesSnapshot>(RATES_KEY);
}

export async function setCachedRates(snapshot: RatesSnapshot): Promise<void> {
  await redis.set(RATES_KEY, snapshot, { ex: RATES_TTL });
}
