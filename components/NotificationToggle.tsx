"use client";

import { useEffect, useState } from "react";

type Status =
  | "loading"
  | "needs-install"     // iOS: not added to home screen yet
  | "unsupported"       // no push support at all
  | "permission-needed" // installed + supported, but permission hasn't been asked
  | "denied"            // user or OS has denied permission
  | "subscribing"
  | "ready"             // subscribed and working
  | "error";

export default function NotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    checkState().then(setStatus);
  }, []);

  async function enable() {
    setStatus("subscribing");
    setErrorMsg(null);
    try {
      // 1. Ask for notification permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      // 2. Get service worker registration
      const reg = await navigator.serviceWorker.ready;
      // 3. Subscribe with VAPID key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID_PUBLIC_KEY env var not set");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });
      // 4. Save subscription server-side
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error(`Subscribe failed: ${res.status}`);
      setStatus("ready");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  }

  return (
    <section aria-label="Notifications" className="rounded-lg border border-ink-800 bg-ink-900/30 p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400 mb-2">
        00 — alerts
      </div>
      {renderState(status, enable, errorMsg)}
    </section>
  );
}

function renderState(status: Status, enable: () => void, errorMsg: string | null) {
  switch (status) {
    case "loading":
      return <p className="text-sm text-ink-400">Checking notification support…</p>;

    case "needs-install":
      return (
        <div className="space-y-2">
          <p className="text-sm text-ink-200">
            <strong>iOS requires adding this to your home screen first.</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-ink-300 pl-1">
            <li>Tap the <ShareIcon /> share button in Safari.</li>
            <li>Scroll down and tap <em>Add to Home Screen</em>.</li>
            <li>Open the app from your home screen, then come back here.</li>
          </ol>
        </div>
      );

    case "unsupported":
      return (
        <p className="text-sm text-ink-300">
          This browser doesn't support web push. Use Safari on iOS 16.4+ or any modern Chrome/Firefox/Edge on Android/desktop.
        </p>
      );

    case "permission-needed":
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-200">
            Tap to enable push notifications when any watched game drops to your target price.
          </p>
          <button onClick={enable} className="btn-primary w-full">
            🔔 Enable alerts
          </button>
        </div>
      );

    case "subscribing":
      return <p className="text-sm text-ink-400">Subscribing…</p>;

    case "ready":
      return (
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-mint animate-pulse" />
          <p className="text-sm text-ink-200">
            Alerts are on. You'll be pushed as soon as a price hits target.
          </p>
        </div>
      );

    case "denied":
      return (
        <div className="space-y-2">
          <p className="text-sm text-flame">Notifications are blocked.</p>
          <p className="text-xs text-ink-400">
            On iOS: open <em>Settings → Notifications → eShop Watch</em> and allow. Then reload this page.
          </p>
        </div>
      );

    case "error":
      return (
        <div className="space-y-2">
          <p className="text-sm text-flame">Couldn't set up alerts.</p>
          {errorMsg && <p className="text-xs text-ink-400 font-mono">{errorMsg}</p>}
        </div>
      );
  }
}

// ─── Helpers ─────────────────────────────────────────────────

async function checkState(): Promise<Status> {
  // On iOS, web push only works when launched from the home screen (standalone mode).
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches;

  if (isIOS && !isStandalone) return "needs-install";

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "denied") return "denied";

  // If already granted AND already subscribed, we're ready.
  if (Notification.permission === "granted") {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) return "ready";
    } catch {
      /* fall through */
    }
  }

  return "permission-needed";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="inline-block align-text-bottom"
      aria-label="share"
    >
      <path d="M12 3v13M8 7l4-4 4 4M6 15v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}
