const VERSION = "v3"; // ⬅️ bump this number every time you update
const CACHE_NAME = `timetable-${VERSION}`;
// Add the files you want cached
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  "./icons/icon-maskable-512x512.png"
  // Add any new assets (like specific icons for buttons) if needed
  // "./icons/icon-share-192x192.png",
  // "./icons/icon-notify-192x192.png"
];

// Install service worker and cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // ⬅️ new SW takes over immediately
});

// Activate new service worker and clear old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // ⬅️ ensures all tabs use the new SW
});

// Fetch requests: try cache first, then network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return (
        response ||
        fetch(event.request).catch(() =>
          caches.match("./index.html") // fallback if offline
        )
      );
    })
  );
});
