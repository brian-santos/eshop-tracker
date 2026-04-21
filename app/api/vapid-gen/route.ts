import { NextResponse } from "next/server";
import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/vapid-gen
 *
 * Convenience endpoint: generates a fresh VAPID keypair you can paste into
 * Vercel env vars on first setup. Does NOT persist the keys anywhere — it
 * just shows them to you once.
 *
 * If the app already has keys configured, this endpoint refuses to emit new
 * ones (to avoid breaking existing push subscriptions if someone hits it by
 * accident).
 */
export async function GET() {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json(
      {
        alreadyConfigured: true,
        message:
          "VAPID keys are already set. To rotate them, first clear the env vars in Vercel, redeploy, then hit this endpoint again. Note: rotating invalidates all existing push subscriptions.",
      },
      { status: 409 },
    );
  }
  const keys = webpush.generateVAPIDKeys();
  return NextResponse.json({
    instructions:
      "Copy the three env vars below into Vercel → Settings → Environment Variables, then redeploy. These are shown ONCE — save them somewhere safe.",
    env: {
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: keys.publicKey,
      VAPID_PRIVATE_KEY: keys.privateKey,
      VAPID_SUBJECT: "mailto:you@example.com",
    },
  });
}
