const CACHE_PREFIX = 'guanxiang-shell-';
const CACHE = `${CACHE_PREFIX}v2`;
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, '/manifest.webmanifest'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  const isNavigation = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type === 'basic') {
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (isNavigation) return caches.match(OFFLINE);
      return new Response('', {
        status: 503,
        statusText: 'Offline resource unavailable',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }));
});
