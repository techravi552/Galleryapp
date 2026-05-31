/**
 * RAVI GALLERY — SERVICE WORKER
 * Strategy:
 *   - App shell (HTML/CSS/JS): Cache-First
 *   - API calls: Network-First with fallback
 *   - Cloudinary images: Cache-First with 7-day expiry
 *   - Offline fallback page for navigation
 */

const SW_VERSION   = 'ravi-gallery-v1.0.0';
const SHELL_CACHE  = `${SW_VERSION}-shell`;
const IMAGE_CACHE  = `${SW_VERSION}-images`;
const API_CACHE    = `${SW_VERSION}-api`;

// App shell assets to pre-cache
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/gallery.html',
  '/upload.html',
  '/profile.html',
  '/css/main.css',
  '/js/api.js',
  '/js/ui.js',
  '/js/lightbox.js',
  '/js/gallery.js',
  '/js/upload.js',
  '/js/profile.js',
  '/js/pwa.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const OFFLINE_PAGE = '/index.html';
const IMAGE_CACHE_MAX = 100;  // max cached Cloudinary images
const IMAGE_TTL_MS    = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Shell pre-cache partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== IMAGE_CACHE && key !== API_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Cloudinary images → Cache-First with expiry
  if (url.hostname.includes('cloudinary.com') || url.hostname.includes('res.cloudinary.com')) {
    event.respondWith(cloudinaryStrategy(request));
    return;
  }

  // API calls → Network-First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  // App shell & pages → Cache-First
  event.respondWith(cacheFirstShell(request));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirstShell(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback: serve index.html for navigation requests
    if (request.mode === 'navigate') {
      const fallback = await caches.match(OFFLINE_PAGE);
      if (fallback) return fallback;
    }
    return new Response('Offline — content not cached.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function networkFirstApi(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving API from cache (offline):', request.url);
      return cached;
    }
    return new Response(
      JSON.stringify({ success: false, message: 'You are offline. Cached data unavailable.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cloudinaryStrategy(request) {
  const cache  = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Check TTL via Date header
    const dateHeader = cached.headers.get('sw-cached-at');
    if (dateHeader) {
      const age = Date.now() - parseInt(dateHeader, 10);
      if (age < IMAGE_TTL_MS) return cached;
    } else {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers  = new Headers(response.headers);
      headers.set('sw-cached-at', String(Date.now()));
      const modified = new Response(await response.blob(), { status: response.status, headers });

      // Evict oldest if over limit
      await evictOldImages(cache);
      cache.put(request, modified.clone());

      return modified;
    }
    return response;
  } catch {
    if (cached) return cached;
    return new Response('Image offline.', { status: 503 });
  }
}

async function evictOldImages(cache) {
  const keys = await cache.keys();
  if (keys.length >= IMAGE_CACHE_MAX) {
    // Delete oldest 20
    const toDelete = keys.slice(0, 20);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}

// ─── Background Sync (upload retry placeholder) ───────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-uploads') {
    console.log('[SW] Background sync: sync-uploads (no pending uploads)');
  }
});

// ─── Push Notifications (placeholder) ────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'Ravi Gallery', {
    body: data.body || 'You have a new notification.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    data: { url: data.url || '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
