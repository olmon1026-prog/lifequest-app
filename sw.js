// Service Worker — precache بكاش مُرقّم lq-__BUILD__ (constraints §13)
const BUILD = '2026-11-24-p30';
const CACHE = 'lq-' + BUILD;

const FILES = [
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'src/main.js',
  'src/store.js',
  'src/sw-register.js',
  'src/styles/base.css',
  'src/core/ids.js',
  'src/core/dates.js',
  'src/core/progress.js',
  'src/core/xp.js',
  'src/core/streak.js',
  'src/core/schema.js',
  'src/core/importer.js',
  'src/core/exporter.js',
  'src/db/db.js',
  'src/db/migrations.js',
  'src/db/repo.js',
  'src/ui/icons.js',
  'src/ui/router.js',
  'src/ui/topbar.js',
  'src/ui/sheet.js',
  'src/ui/today.js',
  'src/ui/goals.js',
  'src/ui/more.js',
  'src/world/world.js',
  'src/world/life.js',
  'src/world/story.js',
  'src/world/actors.js',
  'src/world/scenery.js',
  'src/world/destcard.js',
  'src/world/layout.js',
  'src/world/renderer.js',
  'src/world/sprites.js',
  'src/world/sound.js',
  'assets/characters/sami/walk-side.png',
  'assets/characters/sami/walk-side.json',
  'assets/characters/bondok/walk-side.png',
  'assets/characters/bondok/walk-side.json',
  'assets/buildings/housea-night.png',
  'assets/buildings/housea-day.png',
  'assets/buildings/houseb-night.png',
  'assets/buildings/houseb-day.png',
  'assets/buildings/stone-night.png',
  'assets/buildings/stone-day.png',
  'assets/buildings/sami-night.png',
  'assets/buildings/sami-day.png',
  'assets/buildings/sami-open-night.png',
  'assets/buildings/sami-open-day.png',
  'assets/buildings/lighthouse-night.png',
  'assets/buildings/lighthouse-day.png',
  'assets/buildings/ruined-night.png',
  'assets/buildings/ruined-day.png',
  'assets/buildings/workshop-night.png',
  'assets/buildings/workshop-day.png',
  'assets/buildings/market-night.png',
  'assets/buildings/market-day.png',
  'assets/buildings/beachhut-night.png',
  'assets/buildings/beachhut-day.png',
  'assets/buildings/tree-night.png',
  'assets/buildings/tree-day.png',
  'assets/buildings/rocks-night.png',
  'assets/buildings/rocks-day.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('lq-') && k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});
