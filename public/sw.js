// eShop Price Watch — service worker
// Handles incoming web push events and displays them as iOS notifications.

self.addEventListener("install", (event) => {
  // Activate immediately on first install so push starts working ASAP.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "eShop Price Watch", body: "A price dropped!" };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "eshop-price",
    data: { url: payload.url || "/" },
    // iOS respects these; they make the alert sound and appear on lock screen.
    requireInteraction: false,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If the PWA is already open, focus it.
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        // Otherwise open a new window.
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      }),
  );
});
