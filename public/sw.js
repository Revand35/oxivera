// Kill-switch service worker — unregisters any previous SW and clears caches.
// This exists to clean up leftover service workers from earlier deployments
// that were caching stale chunks and causing 404s.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});

self.addEventListener("fetch", () => {
  // Don't intercept any fetches — let the browser handle them natively.
});
