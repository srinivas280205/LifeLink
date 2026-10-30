const CACHE_NAME = 'lifelink-v3';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// ── Install: cache core shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('lifelink-') && k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first, fall back to cache, then offline page ────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
  // Only public static files are cached; never APIs, demo login pages or personal data.
  if (!url.pathname.startsWith('/assets/') && !url.pathname.startsWith('/icons/') && !['/manifest.json','/offline.html'].includes(url.pathname)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))); }
    return response;
  }).catch(async () => (await caches.match(event.request)) || new Response('', {status:503})));

});

// ── Push: show notification ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* ignore */ }

  const title   = data.title  || 'LifeLink Alert';
  const options = {
    body:    data.body   || 'You have a new notification.',
    icon:    data.icon   || '/logo.svg',
    badge:   data.badge  || '/logo.svg',
    tag:     data.tag    || 'lifelink',
    data:    data.data   || { url: '/' },
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click: open / focus tab ──────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const proposed = new URL(event.notification.data?.url || '/dashboard', self.location.origin);
  const targetUrl = proposed.origin === self.location.origin ? proposed.href : self.location.origin + '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find(
        (c) => c.url === targetUrl
      );
      if (existing) return existing.focus();
      return clients.openWindow(targetUrl);
    })
  );
});
