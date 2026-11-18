/* The offline worker for 天天和警长的森林探案. TEMPLATE stamped by art/build_page.py into sw.js. */
/* global self, caches, fetch, URL, Request, Response */
const ASSET_VERSION = "aec63c32b67e";
const PAGE_HASH = "6aa3fbf073eb";
const PRECACHE = [
  "forest.html",
  "manifest.webmanifest",
  "game/icon-192.png",
  "game/icon-512.png",
  "game/icon-maskable-512.png",
  "game/apple-touch-icon.png",
  "game/font_zh.woff2?v=aec63c32b67e",
  "game/font_en.woff2?v=aec63c32b67e",
  "game/subs.json?v=aec63c32b67e",
  "game/key.webp?v=aec63c32b67e",
  "game/bg_woods.webp?v=aec63c32b67e",
  "game/ui_meet.webp?v=aec63c32b67e",
  "game/fx_star.webp?v=aec63c32b67e",
  "game/fx_heart.webp?v=aec63c32b67e",
  "game/prop_stump.webp?v=aec63c32b67e",
  "game/prop_bush.webp?v=aec63c32b67e",
  "game/prop_mushroom.webp?v=aec63c32b67e",
  "game/prop_lily.webp?v=aec63c32b67e",
  "game/prop_rock.webp?v=aec63c32b67e",
  "game/prop_nest.webp?v=aec63c32b67e",
  "game/prop_orb.webp?v=aec63c32b67e",
  "game/prop_postcard.webp?v=aec63c32b67e",
  "game/prop_stone.webp?v=aec63c32b67e",
  "game/prop_bench.webp?v=aec63c32b67e",
  "game/skye_idle.webp?v=aec63c32b67e",
  "game/skye_fly.webp?v=aec63c32b67e",
  "game/skye_cheer.webp?v=aec63c32b67e",
  "game/portrait_skye.webp?v=aec63c32b67e",
  "game/labrador_idle.webp?v=aec63c32b67e",
  "game/labrador_walk.webp?v=aec63c32b67e",
  "game/labrador_search.webp?v=aec63c32b67e",
  "game/labrador_cheer.webp?v=aec63c32b67e",
  "game/portrait_labrador.webp?v=aec63c32b67e"
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
