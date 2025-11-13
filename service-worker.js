const CACHE_NAME = 'flappy-avatar-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './mp3/aruk.mp3',
  './mp3/tung.mp3',
  './mp3/lemdc.mp3',
  './mp3/mkb.mp3',
  './mp3/sahur.mp3',
  './mp3/aag.mp3',
  './images/bg.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
