// sw.js
const VERSION = "v9"; // ⬅️ bump this number every time you update (was v8)
const CACHE_NAME = `timetable-${VERSION}`;
// Add the files you want cached
const FILES_TO_CACHE = [
  "./",
  "./index.html", // ⬅️ This now includes the new sidebar features
  "./students.html", // ⬅️ Added new page
  "./offline.html", // ⬅️ Added offline page
  "./manifest.json",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  "./icons/icon-maskable-512x512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" // ⬅️ Fixed: Removed trailing space
  // Add any new assets (like specific icons for buttons) if needed
  // "./icons/icon-share-192x192.png",
  // "./icons/icon-notify-192x192.png"
];

// Install service worker and cache files
self.addEventListener("install", event => {
  console.log(`[Service Worker] Install v${VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching files');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // ⬅️ new SW takes over immediately
});

// Activate new service worker and clear old caches
self.addEventListener("activate", event => {
  console.log(`[Service Worker] Activate v${VERSION}`);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // ⬅️ ensures all tabs use the new SW
});

// Fetch requests: cache-first strategy with offline fallback
self.addEventListener("fetch", event => {
  // Only handle navigation requests (e.g., HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try to get the resource from the network first
          const networkResponse = await fetch(event.request);
          // If successful, cache it and return it
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          // If network request fails, try the cache
          console.log('[Service Worker] Fetch failed; returning offline page instead.', error);
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache, return the offline page
          const offlineResponse = await caches.match('./offline.html');
          if (offlineResponse) {
             return offlineResponse;
          }
          // Fallback if offline.html is also not cached (shouldn't happen)
          return new Response('You are offline. This page is not available.', {status: 503, statusText: 'Offline'});
        }
      })()
    );
  } else {
    // For other requests (like CSS, JS, images), use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached version if found, otherwise fetch from network
          return response || fetch(event.request);
        })
    );
  }
});
