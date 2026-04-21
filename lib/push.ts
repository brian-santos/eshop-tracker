import webpush from "web-push";
import type { PushSubscriptionRecord } from "./types";
import { removeSubscription } from "./storage";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not configured. Run `npm run gen-vapid` and set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel env vars.",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string; // used for deduping on the device
}

/**
 * Send a push notification to a single subscription.
 * Automatically removes the subscription from storage on 404/410 (expired).
 */
export async function sendPush(
  sub: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<{ ok: boolean; expired?: boolean; error?: string }> {
  configure();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 }, // 24h
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      // Subscription expired — clean it up.
      await removeSubscription(sub.endpoint);
      return { ok: false, expired: true };
    }
    return {
      ok: false,
      error: (err as Error).message ?? "unknown push error",
    };
  }
}

/**
 * Broadcast a push to all stored subscriptions.
 */
export async function broadcastPush(
  subs: PushSubscriptionRecord[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number; expired: number }> {
  let sent = 0,
    failed = 0,
    expired = 0;
  await Promise.all(
    subs.map(async (sub) => {
      const result = await sendPush(sub, payload);
      if (result.ok) sent++;
      else if (result.expired) expired++;
      else failed++;
    }),
  );
  return { sent, failed, expired };
}
