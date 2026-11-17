/**
 * BlinkDrop Service Worker
 * Enables offline caching, PWA installation, and Web Share Target capabilities.
 */

const CACHE_NAME = 'blinkdrop-cache-v1';
const PRECACHE_ASSETS = ['/', '/index.html', '/favicon.svg'];

// 1. Install Event: Cache essential shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-first with cache fallback for app shell
self.addEventListener('fetch', (event) => {
  // Do not intercept Socket.IO signaling, WebRTC, or browser extensions
  if (
    event.request.url.includes('/socket.io/') ||
    event.request.url.startsWith('chrome-extension:') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for static assets
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Network error', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
