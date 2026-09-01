// WISDOM Official PWA Service Worker - High Performance Image & Static Caching
const CACHE_NAME = 'wisdom-pwa-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/logo-wisdom.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/wisdom_hero_banner_1786398469341.jpg',
  '/wisdom_black_shirt_1786398483035.jpg',
  '/wisdom_white_shirt_1786398496994.jpg',
  '/wisdom_sleeve_patch_1787825766441.jpg',
  '/wisdom_chest_logo_1787825785711.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW cache addAll warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET requests and API calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  const url = new URL(event.request.url);
  const isImageOrAsset = 
    url.pathname.match(/\.(jpg|jpeg|png|webp|svg|gif|ico|woff2|css|js)$/i) ||
    url.pathname.startsWith('/assets/');

  if (isImageOrAsset) {
    // Cache-First strategy with background revalidation for instant loading
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Network-first for dynamic navigation HTML
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
