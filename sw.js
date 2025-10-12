// Basic service worker for Vegan Places PWA
const CACHE_VERSION = 'v1';
const CORE_CACHE = `core-${CACHE_VERSION}`;
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/places.csv',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => ![CORE_CACHE].includes(k)).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Strategy: network-first for dynamic CSV, cache-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.pathname.endsWith('/places.csv')) {
    event.respondWith(
      fetch(request).then(resp => {
        const clone = resp.clone();
        caches.open(CORE_CACHE).then(c => c.put(request, clone));
        return resp;
      }).catch(() => caches.match(request))
    );
    return;
  }
  // Default: cache-first then network fallback
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).catch(() => {
      // Offline fallback (simple)
      if (request.destination === 'document') {
        return new Response('<!doctype html><html lang="he"><head><meta charset="utf-8"><title>אופליין</title></head><body><h1>אתם אופליין</h1><p>לא ניתן לטעון תוכן. התחברו לרשת ונסו שוב.</p></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    }))
  );
});
