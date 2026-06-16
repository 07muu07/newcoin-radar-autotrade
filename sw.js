// NewCoin Radar — Service Worker v3.0
const CACHE = 'newcoin-radar-v3';
const ASSETS = [
  './',
  './index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        return cache.add('./index.html');
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // APIコールは常にネットワーク
  if (url.hostname.includes('anthropic.com') ||
      url.hostname.includes('openai.com') ||
      url.hostname.includes('coinmarketcap.com') ||
      url.hostname.includes('coinglass.com') ||
      url.hostname.includes('bitget.com') ||
      url.hostname.includes('railway.app')) {
    return;
  }

  // index.htmlは常にネットワークから取得（キャッシュしない）
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
