/* ============================================================
   Mafatlal Digital Team Task Tracker — Service Worker
   - Makes the app installable (PWA) on mobile & desktop
   - Shows OS notifications and handles taps on them
   - Includes a push handler ready for a backend (Web Push / VAPID)
   ============================================================ */
const CACHE = "fd-shell-v1";

// Light "network-first, cache fallback" so the app still opens offline.
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Tapping a notification focuses the app and opens the relevant task.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const data = e.notification.data || {};
  const url = data.taskId ? ("./index.html#tasks") : "./index.html";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) { c.postMessage({ type: "notif-click", data }); return c.focus(); } }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// PUSH (background, when the app is closed) — needs a backend push server
// sending Web Push messages with a VAPID key. Wire that up and this fires.
self.addEventListener("push", (e) => {
  let payload = { title: "Task Tracker", body: "You have a new update." };
  try { if (e.data) payload = e.data.json(); } catch (err) {}
  e.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "assets/img/app-icon-192.png",
      badge: "assets/img/app-icon-192.png",
      data: payload.data || {},
      tag: payload.tag,
    })
  );
});
