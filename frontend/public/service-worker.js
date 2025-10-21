/* eslint-env serviceworker */
/* global clients */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Always bypass SW for API requests to avoid caching/interception issues
  if (url.pathname.startsWith('/api/') || url.host.includes('localhost:5181')) {
    event.respondWith(fetch(event.request));
    return;
  }
  // Only cache GET requests. Always go to network for POST/PUT/DELETE etc.
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  // Network-first for GET
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
