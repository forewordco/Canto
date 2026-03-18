/* ═══════════════════════════════════════════════════════════
   Canto SERVICE WORKER — Push notifications & basic caching.

   Handles:
   - Push event listener for background notifications
   - Notification click handler for navigation
   - Basic cache-first strategy for static assets
   - Skip waiting / claim clients on install/activate

   Phase 9 P9-4 & Phase 11 P11-1 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = "flowos-v1";
const APP_URL = self.location.origin;

/** Pre-cache list for app shell (populated on install) */
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon.svg",
];

/* ─── Install ─── */

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  // Pre-cache app shell assets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Pre-cache failed (non-blocking):", err);
      })
    )
  );
  // Activate immediately without waiting for old SW to retire
  self.skipWaiting();
});

/* ─── Activate ─── */

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
    ])
  );
});

/* ─── Push Event ─── */

self.addEventListener("push", (event) => {
  console.log("[SW] Push event received");

  let data = {
    title: "Canto",
    body: "You have a new notification",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: "flowos-notification",
    data: { url: "/" },
  };

  // Parse push data if available
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: {
          url: payload.url || payload.data?.url || "/",
          ...payload.data,
        },
      };
    } catch (e) {
      // If JSON parse fails, try text
      const text = event.data.text();
      if (text) {
        data.body = text;
      }
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    // Show notification even if app is focused
    requireInteraction: false,
    // Vibration pattern for mobile (matches haptic "medium" pattern)
    vibrate: [15],
    // Actions for rich notifications
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/* ─── Notification Click ─── */

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Navigate to the appropriate URL
  const targetUrl = event.notification.data?.url || "/";
  const fullUrl = new URL(targetUrl, APP_URL).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If an existing window is open, focus it and navigate
        for (const client of clientList) {
          if (client.url === fullUrl && "focus" in client) {
            return client.focus();
          }
        }

        // If no matching window, try to focus any existing window
        for (const client of clientList) {
          if ("focus" in client && "navigate" in client) {
            return client.focus().then(() => client.navigate(fullUrl));
          }
        }

        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      })
  );
});

/* ─── Notification Close ─── */

self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification dismissed");
});

/* ─── Background Sync (future use) ─── */

self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "flowos-offline-sync") {
    event.waitUntil(
      // Signal the main thread to replay offline queue
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "REPLAY_OFFLINE_QUEUE",
          });
        });
      })
    );
  }
});

/* ─── Message Handler ─── */

self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Handle notification permission check from main thread
  if (event.data?.type === "CHECK_PUSH") {
    event.source?.postMessage({
      type: "PUSH_STATUS",
      subscribed: !!self.registration.pushManager,
    });
  }
});

/* ─── Fetch Handler (Network-first with cache fallback) ─── */

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only cache same-origin GET requests
  if (event.request.method !== "GET" || url.origin !== APP_URL) {
    return;
  }

  // Skip caching for API/auth/Supabase requests
  if (
    url.pathname.includes("/functions/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/rest/") ||
    url.pathname.includes("/storage/")
  ) {
    return;
  }

  // Network-first strategy for navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/index.html").then((cached) => cached || fetch(event.request))
      )
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
});