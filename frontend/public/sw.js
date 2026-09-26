// AQI Route Navigator — Service Worker v1.0
const CACHE_NAME = "aqi-navigator-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API calls (/best-route, /aqi-point, /aqi-forecast): network-only (live data)
// - Everything else: network-first, fall back to cache
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always use network for API calls
  if (
    url.pathname.startsWith("/best-route") ||
    url.pathname.startsWith("/aqi-point") ||
    url.pathname.startsWith("/aqi-forecast") ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "localhost"
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
