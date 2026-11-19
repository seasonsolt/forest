/* The offline worker for 天天和警长的森林探案. TEMPLATE stamped by art/build_page.py into sw.js. */
/* global self, caches, fetch, URL, Request, Response */
const ASSET_VERSION = "b6d3e7aede95";
const PAGE_HASH = "f289a1ddc1ea";
const PRECACHE = [
  "forest.html",
  "manifest.webmanifest",
  "game/icon-192.png",
  "game/icon-512.png",
  "game/icon-maskable-512.png",
  "game/apple-touch-icon.png",
  "game/font_zh.woff2?v=b6d3e7aede95",
  "game/font_en.woff2?v=b6d3e7aede95",
  "game/subs.json?v=b6d3e7aede95",
  "game/bg_canopy.webp?v=b6d3e7aede95",
  "game/bg_meadow.webp?v=b6d3e7aede95",
  "game/bg_pond.webp?v=b6d3e7aede95",
  "game/bg_woods.webp?v=b6d3e7aede95",
  "game/fx_heart.webp?v=b6d3e7aede95",
  "game/fx_star.webp?v=b6d3e7aede95",
  "game/hat_bow.webp?v=b6d3e7aede95",
  "game/hat_butterfly.webp?v=b6d3e7aede95",
  "game/hat_crown.webp?v=b6d3e7aede95",
  "game/hat_detective.webp?v=b6d3e7aede95",
  "game/hat_wreath.webp?v=b6d3e7aede95",
  "game/key.webp?v=b6d3e7aede95",
  "game/labrador_cheer.webp?v=b6d3e7aede95",
  "game/labrador_cheer_d1.webp?v=b6d3e7aede95",
  "game/labrador_cheer_d2.webp?v=b6d3e7aede95",
  "game/labrador_idle.webp?v=b6d3e7aede95",
  "game/labrador_idle_d1.webp?v=b6d3e7aede95",
  "game/labrador_idle_d2.webp?v=b6d3e7aede95",
  "game/labrador_search.webp?v=b6d3e7aede95",
  "game/labrador_search_d1.webp?v=b6d3e7aede95",
  "game/labrador_search_d2.webp?v=b6d3e7aede95",
  "game/labrador_walk.webp?v=b6d3e7aede95",
  "game/labrador_walk_d1.webp?v=b6d3e7aede95",
  "game/labrador_walk_d2.webp?v=b6d3e7aede95",
  "game/portrait_labrador.webp?v=b6d3e7aede95",
  "game/portrait_skye.webp?v=b6d3e7aede95",
  "game/prop_abc_party.webp?v=b6d3e7aede95",
  "game/prop_bench.webp?v=b6d3e7aede95",
  "game/prop_bush.webp?v=b6d3e7aede95",
  "game/prop_letter_gem.webp?v=b6d3e7aede95",
  "game/prop_lily.webp?v=b6d3e7aede95",
  "game/prop_mushroom.webp?v=b6d3e7aede95",
  "game/prop_nest.webp?v=b6d3e7aede95",
  "game/prop_orb.webp?v=b6d3e7aede95",
  "game/prop_postcard.webp?v=b6d3e7aede95",
  "game/prop_rock.webp?v=b6d3e7aede95",
  "game/prop_stone.webp?v=b6d3e7aede95",
  "game/prop_stump.webp?v=b6d3e7aede95",
  "game/skye_cheer.webp?v=b6d3e7aede95",
  "game/skye_cheer_d1.webp?v=b6d3e7aede95",
  "game/skye_cheer_d2.webp?v=b6d3e7aede95",
  "game/skye_fly.webp?v=b6d3e7aede95",
  "game/skye_fly_d1.webp?v=b6d3e7aede95",
  "game/skye_fly_d2.webp?v=b6d3e7aede95",
  "game/skye_idle.webp?v=b6d3e7aede95",
  "game/skye_idle_d1.webp?v=b6d3e7aede95",
  "game/skye_idle_d2.webp?v=b6d3e7aede95",
  "game/story_open.webp?v=b6d3e7aede95",
  "game/story_win.webp?v=b6d3e7aede95",
  "game/ui_meet.webp?v=b6d3e7aede95",
  "game/word_a.webp?v=b6d3e7aede95",
  "game/word_b.webp?v=b6d3e7aede95",
  "game/word_c.webp?v=b6d3e7aede95",
  "game/word_d.webp?v=b6d3e7aede95",
  "game/word_e.webp?v=b6d3e7aede95",
  "game/word_f.webp?v=b6d3e7aede95",
  "game/word_g.webp?v=b6d3e7aede95",
  "game/word_h.webp?v=b6d3e7aede95",
  "game/word_i.webp?v=b6d3e7aede95",
  "game/word_j.webp?v=b6d3e7aede95",
  "game/word_k.webp?v=b6d3e7aede95",
  "game/word_l.webp?v=b6d3e7aede95",
  "game/word_m.webp?v=b6d3e7aede95",
  "game/word_n.webp?v=b6d3e7aede95",
  "game/word_o.webp?v=b6d3e7aede95",
  "game/word_p.webp?v=b6d3e7aede95",
  "game/word_q.webp?v=b6d3e7aede95",
  "game/word_r.webp?v=b6d3e7aede95",
  "game/word_s.webp?v=b6d3e7aede95",
  "game/word_t.webp?v=b6d3e7aede95",
  "game/word_u.webp?v=b6d3e7aede95",
  "game/word_v.webp?v=b6d3e7aede95",
  "game/word_w.webp?v=b6d3e7aede95",
  "game/word_x.webp?v=b6d3e7aede95",
  "game/word_y.webp?v=b6d3e7aede95",
  "game/word_z.webp?v=b6d3e7aede95"
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
