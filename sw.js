/* The offline worker for 天天和警长的森林探案. TEMPLATE stamped by art/build_page.py into sw.js. */
/* global self, caches, fetch, URL, Request, Response */
const ASSET_VERSION = "8dd0ba9c10f0";
const PAGE_HASH = "0f17b707302c";
const PRECACHE = [
  "forest.html",
  "manifest.webmanifest",
  "game/icon-192.png",
  "game/icon-512.png",
  "game/icon-maskable-512.png",
  "game/apple-touch-icon.png",
  "game/font_zh.woff2?v=8dd0ba9c10f0",
  "game/font_en.woff2?v=8dd0ba9c10f0",
  "game/subs.json?v=8dd0ba9c10f0",
  "game/bg_canopy.webp?v=8dd0ba9c10f0",
  "game/bg_meadow.webp?v=8dd0ba9c10f0",
  "game/bg_pond.webp?v=8dd0ba9c10f0",
  "game/bg_woods.webp?v=8dd0ba9c10f0",
  "game/fx_heart.webp?v=8dd0ba9c10f0",
  "game/fx_star.webp?v=8dd0ba9c10f0",
  "game/hat_crown.webp?v=8dd0ba9c10f0",
  "game/hat_detective.webp?v=8dd0ba9c10f0",
  "game/hat_wreath.webp?v=8dd0ba9c10f0",
  "game/key.webp?v=8dd0ba9c10f0",
  "game/labrador_cheer.webp?v=8dd0ba9c10f0",
  "game/labrador_cheer_d1.webp?v=8dd0ba9c10f0",
  "game/labrador_cheer_d2.webp?v=8dd0ba9c10f0",
  "game/labrador_idle.webp?v=8dd0ba9c10f0",
  "game/labrador_idle_d1.webp?v=8dd0ba9c10f0",
  "game/labrador_idle_d2.webp?v=8dd0ba9c10f0",
  "game/labrador_search.webp?v=8dd0ba9c10f0",
  "game/labrador_search_d1.webp?v=8dd0ba9c10f0",
  "game/labrador_search_d2.webp?v=8dd0ba9c10f0",
  "game/labrador_walk.webp?v=8dd0ba9c10f0",
  "game/labrador_walk_d1.webp?v=8dd0ba9c10f0",
  "game/labrador_walk_d2.webp?v=8dd0ba9c10f0",
  "game/portrait_labrador.webp?v=8dd0ba9c10f0",
  "game/portrait_skye.webp?v=8dd0ba9c10f0",
  "game/prop_bench.webp?v=8dd0ba9c10f0",
  "game/prop_bush.webp?v=8dd0ba9c10f0",
  "game/prop_lily.webp?v=8dd0ba9c10f0",
  "game/prop_mushroom.webp?v=8dd0ba9c10f0",
  "game/prop_nest.webp?v=8dd0ba9c10f0",
  "game/prop_orb.webp?v=8dd0ba9c10f0",
  "game/prop_postcard.webp?v=8dd0ba9c10f0",
  "game/prop_rock.webp?v=8dd0ba9c10f0",
  "game/prop_stone.webp?v=8dd0ba9c10f0",
  "game/prop_stump.webp?v=8dd0ba9c10f0",
  "game/skye_cheer.webp?v=8dd0ba9c10f0",
  "game/skye_cheer_d1.webp?v=8dd0ba9c10f0",
  "game/skye_cheer_d2.webp?v=8dd0ba9c10f0",
  "game/skye_fly.webp?v=8dd0ba9c10f0",
  "game/skye_fly_d1.webp?v=8dd0ba9c10f0",
  "game/skye_fly_d2.webp?v=8dd0ba9c10f0",
  "game/skye_idle.webp?v=8dd0ba9c10f0",
  "game/skye_idle_d1.webp?v=8dd0ba9c10f0",
  "game/skye_idle_d2.webp?v=8dd0ba9c10f0",
  "game/story_open.webp?v=8dd0ba9c10f0",
  "game/story_win.webp?v=8dd0ba9c10f0",
  "game/ui_meet.webp?v=8dd0ba9c10f0",
  "game/word_bat.webp?v=8dd0ba9c10f0",
  "game/word_box.webp?v=8dd0ba9c10f0",
  "game/word_bug.webp?v=8dd0ba9c10f0",
  "game/word_cat.webp?v=8dd0ba9c10f0",
  "game/word_dig.webp?v=8dd0ba9c10f0",
  "game/word_dog.webp?v=8dd0ba9c10f0",
  "game/word_drum.webp?v=8dd0ba9c10f0",
  "game/word_duck.webp?v=8dd0ba9c10f0",
  "game/word_fly.webp?v=8dd0ba9c10f0",
  "game/word_fox.webp?v=8dd0ba9c10f0",
  "game/word_frog.webp?v=8dd0ba9c10f0",
  "game/word_hen.webp?v=8dd0ba9c10f0",
  "game/word_hop.webp?v=8dd0ba9c10f0",
  "game/word_hug.webp?v=8dd0ba9c10f0",
  "game/word_hum.webp?v=8dd0ba9c10f0",
  "game/word_log.webp?v=8dd0ba9c10f0",
  "game/word_mud.webp?v=8dd0ba9c10f0",
  "game/word_nap.webp?v=8dd0ba9c10f0",
  "game/word_net.webp?v=8dd0ba9c10f0",
  "game/word_pig.webp?v=8dd0ba9c10f0",
  "game/word_pup.webp?v=8dd0ba9c10f0",
  "game/word_run.webp?v=8dd0ba9c10f0",
  "game/word_sit.webp?v=8dd0ba9c10f0",
  "game/word_twig.webp?v=8dd0ba9c10f0"
];
const PAGE = 'forest.html';
const CACHE = `forest-${ASSET_VERSION}-${PAGE_HASH}`;

const absolute = path => new URL(path, self.registration.scope).href;
const scopePath = new URL(self.registration.scope).pathname;
const known = new Set(PRECACHE.map(absolute));

const unredirected = res => (res.redirected
  ? res.blob().then(body => new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers }))
  : res);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(PRECACHE.map(path => {
    const url = absolute(path);
    return fetch(new Request(url, { cache: 'reload' })).then(res => {
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return Promise.resolve(unredirected(res)).then(plain => cache.put(url, plain));
    });
  }))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('forest-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const isPage = url => url.pathname === scopePath || url.pathname === `${scopePath}index.html` || url.pathname === `${scopePath}${PAGE}`;
const isAsset = url => known.has(url.origin + url.pathname + url.search) || url.pathname.startsWith(`${scopePath}game/`);

function fromCacheOrNetwork(request, key) {
  return caches.open(CACHE).then(cache => cache.match(key).then(hit => {
    if (hit) return hit;
    return fetch(request).then(res => {
      if (res.ok && res.status === 200 && res.type === 'basic' && !request.headers.has('range')) cache.put(key, res.clone()).catch(() => {});
      return res;
    });
  }));
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    if (url.searchParams.get('dev') === '1' || !isPage(url)) return;
    event.respondWith(fromCacheOrNetwork(request, absolute(PAGE)));
    return;
  }
  if (isAsset(url)) event.respondWith(fromCacheOrNetwork(request, request.url));
});
