// sw.js
// ──────────────────────────────────────────────────────────────────
// Service Worker for "Ascend the Highlands". Caches everything the
// game needs to run offline. Stale-while-revalidate strategy:
//   • Network response wins if it succeeds — keeps cache fresh.
//   • If the network fails (offline / flaky wifi), serve from cache.
//
// To bust the cache when shipping a new build, bump CACHE_VERSION.
// Old caches are automatically deleted on activate.
// ──────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'highlands-v3-171-051';
const CORE_ASSETS = [
  './',
  './index.html',
  './README.md',
  './Highlands.png',
  // src modules
  './src/util.js',
  './src/themes.js',
  './src/state.js',
  './src/stats.js',
  './src/wallet.js',
  './src/perks.js',
  './src/progression.js',
  './src/unlocks.js',
  './src/audio.js',
  './src/sprites.js',
  './src/weather.js',
  './src/generator.js',
  './src/projectiles.js',
  './src/enemies.js',
  './src/allies.js',
  './src/physics.js',
  './src/ui.js',
  './src/builder.js',
  './src/worldmap.js',
  // level data — 18 worlds + tutorial
  './levels/world-01-misty-peaks.js',
  './levels/world-02-haunted-glens.js',
  './levels/world-03-crystal-caves.js',
  './levels/world-04-sky-citadel.js',
  './levels/world-05-legacy.js',
  './levels/world-06-new-levels.js',
  './levels/world-07-clever-five.js',
  './levels/world-08-inferno-echoes.js',
  './levels/world-09-frost-gauntlet.js',
  './levels/world-10-shadow-crucible.js',
  './levels/world-11-neon-spires.js',
  './levels/world-12-coral-depths.js',
  './levels/world-13-brass-works.js',
  './levels/world-14-hollow-shivers.js',
  './levels/world-15-starfall-void.js',
  './levels/world-16-dune-embers.js',
  './levels/world-17-veiled-thicket.js',
  './levels/world-18-petal-shrine.js',
  './levels/world-19-celestial-ascent.js',
  // Galaxy · THE SUNKEN ROAD
  './levels/world-20-tidewatch-cliffs.js',
  './levels/world-21-brackmarsh.js',
  './levels/world-22-lantern-catacombs.js',
  './levels/world-23-brass-locks.js',
  './levels/world-24-glasswater-caverns.js',
  './levels/world-25-emberflow-depths.js',
  './levels/world-26-frostbound-vault.js',
  './levels/world-27-switchworks.js',
  './levels/world-28-gravemind-hollow.js',
  './levels/world-29-throne-of-tides.js',
  // Galaxy · THE ASCENT BEYOND
  './levels/world-30-meadow-gates.js',
  './levels/world-31-thornwild-canopy.js',
  './levels/world-32-cinderpeak-climb.js',
  './levels/world-33-aurora-spires.js',
  './levels/world-34-the-clockspire.js',
  './levels/world-35-stormreach.js',
  './levels/world-36-petalfall-shrine.js',
  './levels/world-37-the-hollowing.js',
  './levels/world-38-starfall-causeway.js',
  './levels/world-39-the-apex.js',
  './levels/tutorial.js',
];

// ── Install — pre-cache the entire game shell ─────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // addAll is atomic; if any one fetch fails the whole install fails.
      // Use individual adds with catch so a single missing asset doesn't
      // brick the install (mp3s sometimes 404 in odd hosting setups).
      return Promise.all(CORE_ASSETS.map((url) =>
        cache.add(url).catch((err) => {
          console.warn('[sw] skip caching ' + url + ':', err.message);
        })
      ));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate — clear old caches so old versions don't linger ──────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// ── Fetch — split strategy ────────────────────────────────────────
// CODE files (HTML / JS / CSS / JSON, and the directory root) use a
// NETWORK-FIRST strategy: always try the server, fall back to cache
// only when offline. This is the fix for "updates don't show" — the
// old stale-while-revalidate always served the cached copy first, so
// the game was permanently one version behind. Network-first means a
// normal refresh shows the latest build immediately.
//
// ASSET files (mp3 / png / etc.) stay CACHE-FIRST with background
// revalidate — they're big, rarely change, and benefit from instant
// offline playback.
function _isCodeRequest(url) {
  if (url.pathname.endsWith('/')) return true;          // directory root
  return /\.(html?|js|mjs|css|json)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle GET — POST etc are unusual for this game.
  if (req.method !== 'GET') return;
  // Only same-origin — don't try to cache analytics, font CDNs, etc.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (_isCodeRequest(url)) {
    // ── Network-first ──────────────────────────────────────────
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      try {
        // `cache: 'no-cache'` makes the SW bypass the browser HTTP
        // cache and revalidate with the server every time, so a
        // freshly-deployed build is always picked up.
        const res = await fetch(req, { cache: 'no-cache' });
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (e) {
        // Offline — fall back to the cached copy.
        const cached = await cache.match(req);
        return cached || new Response('', { status: 504 });
      }
    })());
  } else {
    // ── Cache-first + background revalidate (assets) ───────────
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(req);
      const networkFetch = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      }).catch(() => null);
      return cached || (await networkFetch) || new Response('', { status: 504 });
    })());
  }
});
