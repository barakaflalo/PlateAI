/* AppNest Service Worker — PlateAI · network-first shell */
const VERSION = 'plateai-v11';
const CORE = ['./index.html', './appnest-assistant.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only handle same-origin GET. Cross-origin (AI providers, Open Food Facts, CDNs) pass through untouched.
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Network-first: always try the network so users get the latest version automatically;
  // fall back to cache only when offline.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
