// test/test-generator.mjs
// ──────────────────────────────────────────────────────────────────
// Standalone Node test harness for the Pipes of Glory procedural
// level generator. Verifies that a wide spread of random seeds produce
// levels that are actually completable — every spawn → goal route has
// a continuous chain of platforms the player could feasibly traverse.
//
// USAGE:
//   node test/test-generator.mjs              # 100 seeds, default opts
//   node test/test-generator.mjs --n 500      # 500 seeds
//   node test/test-generator.mjs --verbose    # dump failing seeds
//
// HOW IT WORKS:
//   The generator currently lives inside index.html.
//   This harness extracts the JS body, evaluates it in a sandbox that
//   stubs the browser globals (`document`, `window`, `AudioContext`,
//   `localStorage`, `requestAnimationFrame`, …), then calls
//   `buildRandomLevel({ seed })` repeatedly.
//
//   For each generated level it checks two invariants:
//     (a) startX is left of goalX
//     (b) every "horizontal column" between startX and goalX has at
//         least one solid platform whose top is ≤ voidY (i.e. the
//         player would have something to land on if they fell).
//   These are heuristic — they don't simulate the full physics — but
//   they catch the most common generator bugs (totally missing
//   chunks, void gaps wider than the player can jump).
//
// ──────────────────────────────────────────────────────────────────
//
// NOTE: this file is the test SCAFFOLD. The full eval-in-sandbox path
// will become trivial once the generator is split into its own
// module (see modules todo). Until then it currently runs the
// pure-JS portion of the generator only.
//
// To make this run end-to-end today you have two options:
//   1. Run the assertions described below by hand against levels
//      you've already generated in-game.
//   2. Cut the generator out of index.html into
//      src/generator.js and `import` it here. The current script is
//      one big <script> block, so until that's split this file
//      documents the test pattern rather than executing it.
//
// ──────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(__dirname, '..', 'index.html');

// ── Parse CLI args ───────────────────────────────────────────────
const args = process.argv.slice(2);
const argN = (() => {
  const i = args.indexOf('--n');
  return i >= 0 ? parseInt(args[i + 1], 10) || 100 : 100;
})();
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const FAIL_LIMIT = 20;

// ── Build a minimal browser-shaped sandbox ────────────────────────
function makeSandbox() {
  const stubElement = () => ({
    style: {}, classList: {
      add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false,
    },
    appendChild: () => {}, removeChild: () => {}, insertAdjacentHTML: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    setAttribute: () => {}, getAttribute: () => null,
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
    getContext: () => ({
      fillRect: () => {}, clearRect: () => {}, fillText: () => {}, beginPath: () => {},
      moveTo: () => {}, lineTo: () => {}, closePath: () => {}, stroke: () => {},
      fill: () => {}, arc: () => {}, save: () => {}, restore: () => {},
      translate: () => {}, scale: () => {}, rotate: () => {}, setLineDash: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createPattern: () => null, drawImage: () => {},
      setTransform: () => {}, transform: () => {}, clip: () => {}, rect: () => {},
      fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1, font: '',
      textAlign: '', textBaseline: '',
    }),
    width: 960, height: 540, value: '', textContent: '', innerHTML: '',
    children: [], childNodes: [], firstChild: null, parentNode: null,
    offsetWidth: 0, offsetHeight: 0,
  });
  const documentStub = {
    createElement: () => stubElement(),
    getElementById: () => stubElement(),
    querySelector: () => stubElement(),
    querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    body: stubElement(),
    documentElement: stubElement(),
    fonts: { ready: Promise.resolve() },
  };
  const localStorageStub = (() => {
    const store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    };
  })();
  const audioCtxStub = function () {
    return {
      createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, value: 0 }, type: 'sine' }),
      createGain:       () => ({ connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {}, value: 0 } }),
      createBuffer:     () => ({}),
      createBufferSource: () => ({ connect: () => {}, start: () => {}, buffer: null }),
      destination: {}, currentTime: 0, state: 'running', resume: () => Promise.resolve(),
    };
  };
  return {
    console,
    document: documentStub,
    window: {
      AudioContext: audioCtxStub, webkitAudioContext: audioCtxStub,
      addEventListener: () => {}, requestAnimationFrame: () => 0,
      cancelAnimationFrame: () => {},
      innerWidth: 960, innerHeight: 540,
      localStorage: localStorageStub,
      // Game-specific globals it expects to assign to:
      __TEST__: true,
    },
    localStorage: localStorageStub,
    AudioContext: audioCtxStub, webkitAudioContext: audioCtxStub,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setTimeout, clearTimeout, setInterval, clearInterval,
    Math, Date, JSON, Object, Array, String, Number, Boolean,
    Map, Set, WeakMap, WeakSet, Symbol, Promise, Error,
    fetch: () => Promise.reject(new Error('fetch stubbed')),
  };
}

// ── Extract the main <script> body from the HTML ─────────────────
function extractScriptBody(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => m[1]);
  if (scripts.length === 0) throw new Error('No <script> tag found in HTML');
  // Pick the longest one — the game's main bundle.
  return scripts.sort((a, b) => b.length - a.length)[0];
}

// ── Winnability heuristic ────────────────────────────────────────
// The full physics is complex. As a fast approximation we check:
//   1. startX < goalX (or startX is reasonable)
//   2. For every 32-px column between startX and goalX, there's at
//      least one platform top within reachable range (≤ voidY - 32).
// This catches generator bugs that produce impossible voids.
function isWinnable(level) {
  if (!level || !Array.isArray(level.platforms)) {
    return { ok: false, reason: 'missing platforms' };
  }
  const startX = level.startX ?? 60;
  const goalX  = level.goalX ?? (level.width - 100);
  if (goalX <= startX + 100) {
    return { ok: false, reason: `goalX (${goalX}) too close to startX (${startX})` };
  }
  const voidY = level.voidY ?? 460;
  // Column-coverage check: scan 32-px columns from startX to goalX.
  // A column is "covered" if any platform overlaps it AND has its top
  // at or above voidY - 16 (i.e. you could stand on it).
  const STEP = 32;
  const colMissing = [];
  for (let cx = startX; cx <= goalX; cx += STEP) {
    let covered = false;
    for (const p of level.platforms) {
      if (!p || p.type === 'water' || p.type === 'windtunnel' ||
          p.type === 'grapplehook' || p.type === 'magnetic') continue;
      const pw = p.w || 0;
      if (cx < p.x || cx > p.x + pw) continue;
      if ((p.y ?? 0) <= voidY - 8) { covered = true; break; }
    }
    if (!covered) colMissing.push(cx);
  }
  // Allow a few isolated gaps (player can jump them) but reject runs
  // of contiguous bare columns wider than ~120px (≈ max jump distance).
  const MAX_GAP = 4 * STEP;  // 128px
  let runStart = null, biggestRun = 0;
  for (let cx = startX; cx <= goalX; cx += STEP) {
    if (colMissing.includes(cx)) {
      if (runStart == null) runStart = cx;
    } else {
      if (runStart != null) {
        biggestRun = Math.max(biggestRun, cx - runStart);
        runStart = null;
      }
    }
  }
  if (runStart != null) biggestRun = Math.max(biggestRun, goalX - runStart);
  if (biggestRun > MAX_GAP) {
    return { ok: false, reason: `${biggestRun}px contiguous void > ${MAX_GAP}px max-jump` };
  }
  return { ok: true };
}

// ── Run the harness ──────────────────────────────────────────────
async function main() {
  console.log(`▶ Loading game script from ${HTML_PATH}`);
  const scriptBody = extractScriptBody(HTML_PATH);
  const sandbox = makeSandbox();
  vm.createContext(sandbox);

  // Load extracted modules first — util/themes/state/audio/sprites are
  // <script src=...> tags in the real HTML and the inline body assumes
  // their globals exist (THEMES_BG, AC, PLAYER_CUSTOM, etc.).
  console.log('▶ Pre-loading src modules…');
  for (const modPath of ['../src/util.js', '../src/themes.js',
                          '../src/state.js', '../src/audio.js',
                          '../src/sprites.js', '../src/weather.js',
                          '../src/generator.js', '../src/projectiles.js',
                          '../src/enemies.js', '../src/allies.js',
                          '../src/physics.js', '../src/ui.js',
                          '../src/builder.js']) {
    try {
      const modSrc = readFileSync(join(__dirname, modPath), 'utf8');
      vm.runInContext(modSrc, sandbox, { filename: modPath, timeout: 5000 });
    } catch (e) {
      console.error(`✗ Failed to load ${modPath}: ${e.message}`);
      process.exit(2);
    }
  }
  // The modules attach to `sandbox.window.X`. Mirror those to the bare
  // sandbox scope so the main script's plain references (e.g. THEMES_BG)
  // resolve. In the browser this happens automatically because <script>
  // top-level vars become window properties; in vm.createContext the
  // sandbox object IS the global, but `window` is a separate property
  // we wired up. Copy the relevant bindings down.
  for (const k of Object.keys(sandbox.window)) {
    if (!(k in sandbox)) sandbox[k] = sandbox.window[k];
  }

  console.log('▶ Evaluating script in sandbox…');
  try {
    vm.runInContext(scriptBody, sandbox, {
      filename: 'index.html',
      timeout: 10000,
    });
  } catch (e) {
    // Many side-effect statements (gameLoop kicking off, audio probes,
    // pointer setup) will throw against stubbed DOM/audio. That's
    // fine as long as buildRandomLevel got defined before the throw.
    if (typeof sandbox.buildRandomLevel !== 'function') {
      console.error('✗ Sandbox eval crashed before buildRandomLevel was defined:');
      console.error(e);
      process.exit(2);
    }
  }
  if (typeof sandbox.buildRandomLevel !== 'function') {
    console.error('✗ buildRandomLevel is not defined after sandbox eval.');
    console.error('  The generator needs to be exported / hoisted to the global scope.');
    console.error('  See the "module split" TODO — once generator.js exists, this');
    console.error('  harness can `import` it directly and skip the eval dance.');
    process.exit(2);
  }

  console.log(`▶ Generating ${argN} levels…\n`);
  let passed = 0, failed = 0;
  const failures = [];
  for (let i = 0; i < argN; i++) {
    const seed = `test_${i}_${Date.now().toString(36)}`;
    let level;
    try {
      level = sandbox.buildRandomLevel({ seed });
    } catch (e) {
      failed++;
      failures.push({ seed, reason: 'generator threw: ' + e.message });
      continue;
    }
    const r = isWinnable(level);
    if (r.ok) {
      passed++;
    } else {
      failed++;
      if (failures.length < FAIL_LIMIT) failures.push({ seed, reason: r.reason });
    }
  }

  console.log(`\n── Results ────────────────────────────────────────`);
  console.log(`Total:   ${argN}`);
  console.log(`Pass:    ${passed}`);
  console.log(`Fail:    ${failed}`);
  if (failures.length > 0) {
    console.log(`\nFirst ${Math.min(FAIL_LIMIT, failures.length)} failing seed(s):`);
    for (const f of failures) console.log(`  • ${f.seed.padEnd(30)} ${f.reason}`);
  }
  if (VERBOSE && passed > 0) {
    console.log('\n(--verbose) sample successful seed shape:');
    const sampleSeed = `test_sample_${Date.now().toString(36)}`;
    const sample = sandbox.buildRandomLevel({ seed: sampleSeed });
    console.log({
      width: sample.width, startX: sample.startX, goalX: sample.goalX,
      voidY: sample.voidY, platforms: (sample.platforms || []).length,
      enemies:  (sample.enemies  || []).length, coins: (sample.coins || []).length,
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Harness crashed:', e);
  process.exit(2);
});
