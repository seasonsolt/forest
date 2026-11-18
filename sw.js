/* The offline worker for 天天和警长的森林探案. TEMPLATE stamped by art/build_page.py into sw.js. */
/* global self, caches, fetch, URL, Request, Response */
const ASSET_VERSION = "1fd50823ae6a";
const PAGE_HASH = "67a3acc6a8c4";
const PRECACHE = [
  "forest.html",
  "manifest.webmanifest",
  "game/icon-192.png",
  "game/icon-512.png",
  "game/icon-maskable-512.png",
  "game/apple-touch-icon.png",
  "game/font_zh.woff2?v=1fd50823ae6a",
  "game/font_en.woff2?v=1fd50823ae6a",
  "game/subs.json?v=1fd50823ae6a",
  "game/bg_canopy.webp?v=1fd50823ae6a",
  "game/bg_meadow.webp?v=1fd50823ae6a",
  "game/bg_pond.webp?v=1fd50823ae6a",
  "game/bg_woods.webp?v=1fd50823ae6a",
  "game/fx_heart.webp?v=1fd50823ae6a",
  "game/fx_star.webp?v=1fd50823ae6a",
  "game/hat_crown.webp?v=1fd50823ae6a",
  "game/hat_detective.webp?v=1fd50823ae6a",
  "game/hat_wreath.webp?v=1fd50823ae6a",
  "game/key.webp?v=1fd50823ae6a",
  "game/labrador_cheer.webp?v=1fd50823ae6a",
  "game/labrador_cheer_d1.webp?v=1fd50823ae6a",
  "game/labrador_cheer_d2.webp?v=1fd50823ae6a",
  "game/labrador_idle.webp?v=1fd50823ae6a",
  "game/labrador_idle_d1.webp?v=1fd50823ae6a",
  "game/labrador_idle_d2.webp?v=1fd50823ae6a",
  "game/labrador_search.webp?v=1fd50823ae6a",
  "game/labrador_search_d1.webp?v=1fd50823ae6a",
  "game/labrador_search_d2.webp?v=1fd50823ae6a",
  "game/labrador_walk.webp?v=1fd50823ae6a",
  "game/labrador_walk_d1.webp?v=1fd50823ae6a",
  "game/labrador_walk_d2.webp?v=1fd50823ae6a",
  "game/portrait_labrador.webp?v=1fd50823ae6a",
  "game/portrait_skye.webp?v=1fd50823ae6a",
  "game/prop_bench.webp?v=1fd50823ae6a",
  "game/prop_bush.webp?v=1fd50823ae6a",
  "game/prop_lily.webp?v=1fd50823ae6a",
  "game/prop_mushroom.webp?v=1fd50823ae6a",
  "game/prop_nest.webp?v=1fd50823ae6a",
  "game/prop_orb.webp?v=1fd50823ae6a",
  "game/prop_postcard.webp?v=1fd50823ae6a",
  "game/prop_rock.webp?v=1fd50823ae6a",
  "game/prop_stone.webp?v=1fd50823ae6a",
  "game/prop_stump.webp?v=1fd50823ae6a",
  "game/skye_cheer.webp?v=1fd50823ae6a",
  "game/skye_cheer_d1.webp?v=1fd50823ae6a",
  "game/skye_cheer_d2.webp?v=1fd50823ae6a",
  "game/skye_fly.webp?v=1fd50823ae6a",
  "game/skye_fly_d1.webp?v=1fd50823ae6a",
  "game/skye_fly_d2.webp?v=1fd50823ae6a",
  "game/skye_idle.webp?v=1fd50823ae6a",
  "game/skye_idle_d1.webp?v=1fd50823ae6a",
  "game/skye_idle_d2.webp?v=1fd50823ae6a",
  "game/story_open.webp?v=1fd50823ae6a",
  "game/story_win.webp?v=1fd50823ae6a",
  "game/ui_meet.webp?v=1fd50823ae6a",
  "game/word_bat.webp?v=1fd50823ae6a",
  "game/word_box.webp?v=1fd50823ae6a",
  "game/word_bug.webp?v=1fd50823ae6a",
  "game/word_cat.webp?v=1fd50823ae6a",
  "game/word_dig.webp?v=1fd50823ae6a",
  "game/word_dog.webp?v=1fd50823ae6a",
  "game/word_drum.webp?v=1fd50823ae6a",
  "game/word_duck.webp?v=1fd50823ae6a",
  "game/word_fly.webp?v=1fd50823ae6a",
  "game/word_fox.webp?v=1fd50823ae6a",
  "game/word_frog.webp?v=1fd50823ae6a",
  "game/word_hen.webp?v=1fd50823ae6a",
  "game/word_hop.webp?v=1fd50823ae6a",
  "game/word_hug.webp?v=1fd50823ae6a",
  "game/word_hum.webp?v=1fd50823ae6a",
  "game/word_log.webp?v=1fd50823ae6a",
  "game/word_mud.webp?v=1fd50823ae6a",
  "game/word_nap.webp?v=1fd50823ae6a",
  "game/word_net.webp?v=1fd50823ae6a",
  "game/word_pig.webp?v=1fd50823ae6a",
  "game/word_pup.webp?v=1fd50823ae6a",
  "game/word_run.webp?v=1fd50823ae6a",
  "game/word_sit.webp?v=1fd50823ae6a",
  "game/word_twig.webp?v=1fd50823ae6a"
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
