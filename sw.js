self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('music-cache').then(cache => {
      return cache.addAll([
        'index.html',
        'styles.css',
        'app.js',
        'manifest.json',
        'icon-192.png',
        'icon-512.png',
        'cover.png'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
