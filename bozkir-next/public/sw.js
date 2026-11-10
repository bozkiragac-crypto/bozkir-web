/*
 * Bozkır Ağaç — minimal PWA service worker.
 * - Sayfa (HTML) istekleri: ağ öncelikli; çevrimdışıysa offline sayfası.
 * - Statik varlıklar: önbellek + arka planda tazeleme (stale-while-revalidate).
 * - API ve yönetim paneli hiç önbelleklenmez.
 */
const VERSION = 'bozkir-pwa-v1';
const CACHE = `${VERSION}-static`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [
  OFFLINE_URL,
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/images/bozkir-agac-logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Tek bir varlık başarısız olsa bile kurulum devam etsin.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Dinamik veri ve panel: her zaman ağdan.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/media/quotes/')
  ) {
    return;
  }

  // Sayfa gezinmesi: ağ öncelikli, çevrimdışıysa önbellekteki offline sayfası.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return (
            offline ||
            new Response(
              '<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bağlantı yok</title><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100svh;margin:0;background:#f7f7f5;color:#1a1a1a"><div style="text-align:center;padding:24px"><h1>Bağlantı yok</h1><p>İnternet bağlantınızı kontrol edip yeniden deneyin.</p><button onclick="location.reload()">Yeniden dene</button></div></body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
            )
          );
        }
      })(),
    );
    return;
  }

  // Statik varlıklar: önbellekten hemen dön, arka planda güncelle.
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    /\.(?:css|js|woff2?|ttf|png|jpe?g|webp|avif|svg|ico)$/i.test(url.pathname);

  if (!isStatic) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
