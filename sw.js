// sw.js

const VERSION = "v3"; // ⬅️ Bump this number every time you update cached files
const CACHE_NAME = `timetable-${VERSION}`;

// Add the files you want cached
const FILES_TO_CACHE = [
  "./",                    // Cache the root (usually serves index.html)
  "./index.html",
  "./offline.html",        // ⬅️ Add the dedicated offline fallback page
  "./manifest.json",
  "./styles.css",          // ⬅️ Add your CSS file
  "./app.js",              // ⬅️ Add your main JS file
  // ⬇️ Corrected paths to match manifest.json and actual filenames
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  "./icons/icon-maskable-512x512.png"
  // Add other assets like data files if needed, e.g., "./data/timetable.json"
];

// Install service worker and cache files
self.addEventListener("install", event => {
  console.log(`[Service Worker] Install event for ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("[Service Worker] Caching app shell");
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(error => {
        console.error("[Service Worker] Failed to cache files during install:", error);
      })
  );
  self.skipWaiting(); // ⬅️ New SW takes over immediately
});

// Activate new service worker and clear old caches
self.addEventListener("activate", event => {
  console.log(`[Service Worker] Activate event for ${CACHE_NAME}`);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches that don't match the current version
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // ⬅️ Ensures all tabs controlled by this SW instance
});

// Fetch requests: try cache first, then network, with specific offline fallback
self.addEventListener("fetch", event => {
  // Only handle GET requests for same-origin resources
  if (event.request.method === "GET" && new URL(event.request.url).origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Return cached response if found
          if (cachedResponse) {
            console.log(`[Service Worker] Returning cached response for: ${event.request.url}`);
            return cachedResponse;
          }

          // If not in cache, try the network
          console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
          return fetch(event.request)
            .then(networkResponse => {
              // Optional: Cache the network response (Stale-While-Revalidate)
              // Check if response is valid before caching
              if (networkResponse.ok && networkResponse.type === 'basic') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  console.log(`[Service Worker] Caching new response for: ${event.request.url}`);
                  cache.put(event.request, responseToCache);
                }).catch(err => {
                  console.warn(`[Service Worker] Could not cache response for ${event.request.url}:`, err);
                });
              }
              return networkResponse;
            })
            .catch(networkError => {
              // Network request failed (e.g., offline)
              console.log(`[Service Worker] Network fetch failed for: ${event.request.url}`, networkError);

              // Check if the request is for a navigation (HTML page)
              if (event.request.destination === 'document') {
                // Return the cached offline page as a fallback for navigations
                console.log("[Service Worker] Serving offline fallback page.");
                return caches.match('./offline.html');
              }

              // For other requests (e.g., images, data), just let the fetch fail
              // The main page logic should handle missing data gracefully
              // You could potentially return a default response here if needed
              throw networkError; // Re-throw for non-navigation requests
            });
        })
        .catch(matchError => {
           console.error("[Service Worker] Caching/Network strategy failed:", matchError);
           // Ultimate fallback if cache match itself fails unexpectedly
           if (event.request.destination === 'document') {
             return caches.match('./offline.html');
           }
        })
    );
  }
  // For non-GET or cross-origin requests, they pass through normally
  // (e.g., API calls you don't want to cache, requests for external resources)
});
