const CACHE = "GrowthNotes-v1";
const SHELL = ["/", "/dashboard", "/journal", "/plan", "/analytics"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});

/* ── Show notification — page posts this message ──────────────────────
   Payload: { type, title, body, url, tag, icon }
   url: where to navigate when user clicks the notification
────────────────────────────────────────────────────────────────────── */
self.addEventListener("message", (e) => {
  if (e.data?.type !== "SHOW_NOTIFICATION") return;
  const {
    title,
    body,
    url = "/dashboard",
    tag = "GrowthNotes",
    icon = "/icon-192.png",
  } = e.data;
  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/icon-192.png",
    tag,
    renotify: true,
    data: { url }, // ← carry the destination URL
  });
});

/* ── Notification click — navigate to data.url ────────────────────── */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const dest = e.notification.data?.url || "/dashboard";

  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        // If app is already open in a tab, focus it and navigate
        if (list.length > 0) {
          const win = list[0];
          win.navigate(dest);
          return win.focus();
        }
        // Otherwise open a new window
        return clients.openWindow(dest);
      }),
  );
});
