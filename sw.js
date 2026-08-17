// ============================================================
// Service Worker — The Pride of Tirumala
// ============================================================

const CACHE_NAME = 'pride-tirumala-v1';
const ASSETS = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './css/style.css',
  './js/auth.js',
  './js/sheets.js',
  './js/dashboard.js',
  './js/flats.js',
  './js/expenses.js',
  './js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first for Google APIs; cache-first for app shell
  if (e.request.url.includes('googleapis.com') || e.request.url.includes('accounts.google.com')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
