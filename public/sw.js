/* Service worker Juragan Warung: precache saat install (daftar & versi disuntik saat build). */
const BUILD = '__BUILD__';
const PRECACHE = __PRECACHE__;
const CACHE = `juragan-warung-${BUILD}`;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('juragan-warung-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // halaman: ambil versi terbaru dari jaringan, jatuh ke cache saat offline
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html', { ignoreVary: true }).then(r => r || caches.match('./', { ignoreVary: true }))),
    );
    return;
  }
  // aset: cache dulu (nama berhash), lalu jaringan
  e.respondWith(
    caches.match(req, { ignoreVary: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })),
  );
});
