const CACHE_NAME = 'hospibot-v1';
const OFFLINE_URL = '/offline';

// Critical resources to cache for offline use
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
];

// Install: precache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback (stale-while-revalidate for API)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-first, cache response for offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response(
          JSON.stringify({ error: 'Offline', offline: true, data: [] }),
          { headers: { 'Content-Type': 'application/json' } }
        )))
    );
    return;
  }

  // Static assets & pages: cache-first
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached || caches.match(OFFLINE_URL));
        return cached || fetchPromise;
      })
    );
  }
});

// Background sync: queue failed POST/PATCH requests for retry
self.addEventListener('sync', (event) => {
  if (event.tag === 'hospibot-sync') {
    event.waitUntil(replayQueue());
  }
});

async function replayQueue() {
  const db = await openSyncDB();
  const tx = db.transaction('outbox', 'readwrite');
  const store = tx.objectStore('outbox');
  const items = await store.getAll();
  for (const item of items) {
    try {
      await fetch(item.url, { method: item.method, headers: item.headers, body: item.body });
      store.delete(item.id);
    } catch { /* retry next sync */ }
  }
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('hospibot-sync', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
