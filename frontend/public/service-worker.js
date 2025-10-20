/* eslint-env serviceworker */
/* global clients */
// eslint-disable-next-line no-unused-vars
self.addEventListener('install', event => {
  self.skipWaiting();
});

// eslint-disable-next-line no-unused-vars
self.addEventListener('activate', event => {
  clients.claim();
});

// eslint-disable-next-line no-unused-vars
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
