// src/worldmap.js
// ──────────────────────────────────────────────────────────────────
// 3D-style world navigation, Mario-Galaxy / 3D-World style.
//
// Two views:
//   1. GALAXY  — Top-level. Each "category" (OG, NEW, EXPANSION,
//      TUTORIAL, GENERATED) is a planet orbiting a central sun. The
//      bagpiper avatar stands on the focused planet. Arrows cycle the
//      orbit, Enter zooms in.
//   2. WORLD   — Per-world map. A pseudo-3D tilted plane with the
//      level nodes laid out as glowing pads on a winding path. The
//      bagpiper walks (top-down with a slight perspective tilt) using
//      WASD / Arrows. Walking onto a node + Enter starts the level.
//
// Both views drive the canvas (no DOM screen overlay) so they share
// the same game-loop dispatch as `playing` and `builder`. The state
// flag `GS === 'worldmap'` selects this module's tick/draw.
//
// Back navigation:
//   WORLD  ─── ESC ──▶ GALAXY
//   GALAXY ─── ESC ──▶ s-title  (classic DOM title screen)
//
// Classic fallback: localStorage 'pogl_classic_menu' === '1' makes
// the PLAY button drop straight into the original s-worldselect grid.
// ──────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Mutable view state ──────────────────────────────────────────
  // view  : 'galaxy' | 'world'
  // gIdx  : index into the visible-category list (galaxy view)
  // wIdx  : world index (0-based) once a category has been entered
  // gAng  : galaxy rotation angle (smoothly approaches gIdx target)
  // avatar: {x, y, vx, vy, facing, frame} — used in world view
  // nodes : level nodes laid out for the current world map
  // hover : index of node the avatar is touching (or -1)
  let view = 'galaxy';
  let gIdx = 0;
  let wIdx = 0;
  let subIdx = 0;       // subworld inside the currently focused category
  let gAng = 0;
  let gAngTarget = 0;
  let zoom = 1;
  let zoomTarget = 1;
  const avatar = { x: 0, y: 0, vx: 0, vy: 0, facing: 1, frame: 0, walk: 0 };
  let nodes = [];
  let hover = -1;
  let stars = [];        // background starfield (parallax dots)
  let particles = [];    // tiny ambient sparkles for the galaxy view
  let tickCount = 0;
  let mode = 'category'; // galaxy sub-mode: 'category' | 'world'
  let lastBuildSig = '';
  // Premium-world purchase confirm: first Enter on an affordable locked
  // premium world arms the buy; a second Enter within the window confirms.
  let _pendingBuyWorld = -1;
  let _pendingBuyTimer = 0;
  // ── Touch support ────────────────────────────────────────────────
  // walkTarget: a world-space point the avatar walks toward when the
  // player taps the world view (cleared as soon as the keyboard/pad
  // takes over). _touchUI: screen-space hit rects rebuilt every frame
  // by the draw routines so handlePointer() can test taps against the
  // BACK button and galaxy cycle arrows.
  let walkTarget = null;
  let _touchUI = { back: null, arrowL: null, arrowR: null, stick: null, run: null };
  // Virtual joystick (world view) + RUN button state.
  let _stick = { id: -1, dx: 0, dy: 0 };
  let _runBtn = { id: -1, down: false };
  // The on-screen BACK button + galaxy cycle arrows only render once
  // the player has actually touched the screen — on desktop (mouse +
  // keyboard) they'd just be clutter, since ESC / arrow keys work.
  let _touchUsed = false;
  try {
    window.addEventListener('touchstart', function () { _touchUsed = true; }, { passive: true, once: false });
  } catch (e) { }
  // ── World view (free-walk 3D overworld) state ────────────────────
  // The world view is a free-walk space: the avatar moves anywhere
  // on a wide themed environment, and 3D level islands sit nestled in
  // it. A camera follows the player. Walking near an island opens an
  // info card with stars/coins/embers/best-score from past clears.
  let islands = [];           // {idx, wx, wy, name, lvl, biome}
  let decorations = [];       // {type, wx, wy, scale, seed, variant}
  let critters = [];          // animated themed wildlife — see CRITTERS_BY_BIOME
  let nearbyIdx = -1;         // index of island the avatar is "in range" of
  let cameraX = 0;            // world-space camera position
  let cameraY = 0;
  let infoAlpha = 0;          // 0..1 fade-in of the info card
  let worldW = 0, worldH = 0; // overworld bounds in world units
  let activeBiome = null;     // current world's biome palette/spec
  // Legacy carousel state (kept declared so older code paths don't crash)
  let lvlIdx = 0;
  let lvlSlide = 0;
  let lvlSlideTarget = 0;

  // ── Layout constants ────────────────────────────────────────────
  // The canvas resizes with the viewport (scaleWrap mutates W=canvas.width).
  // We capture the live size each frame instead of hardcoding 960×540 so
  // the galaxy fills the whole window on widescreen monitors.
  let VIEW_W = 960, VIEW_H = 540;
  function _syncViewport(c) {
    const cw = (c && c.canvas) ? c.canvas.width : 960;
    const ch = (c && c.canvas) ? c.canvas.height : 540;
    if (cw > 0) VIEW_W = cw;
    if (ch > 0) VIEW_H = ch;
  }
  const AVATAR_SPEED = 3.2;
  const NODE_TOUCH_R = 44;
  // Planet orbit radius scales with the smaller viewport dimension
  function _orbitR() { return Math.min(VIEW_W, VIEW_H) * 0.32; }

  // ── Helpers ─────────────────────────────────────────────────────
  function _u(id, name) {
    const a = (typeof window !== 'undefined') ? window[id] : null;
    return a;
  }
  function _worlds() { return (typeof WORLDS !== 'undefined' && WORLDS) || window.WORLDS || []; }
  function _stars() { return (typeof levelStars !== 'undefined' && levelStars) || window.levelStars || {}; }
  function _accessible(w) { return (typeof isWorldAccessible === 'function') ? isWorldAccessible(w) : (window.isWorldAccessible ? window.isWorldAccessible(w) : true); }
  function _worldPrice(w) { return (typeof worldPrice === 'function') ? worldPrice(w) : (window.worldPrice ? window.worldPrice(w) : null); }
  function _isPremium(w) { return (typeof isWorldPremium === 'function') ? isWorldPremium(w) : (window.isWorldPremium ? window.isWorldPremium(w) : false); }
  // A locked premium world the player can currently afford to unlock early.
  function _premiumBuyable(w) {
    if (!_isPremium(w) || _accessible(w)) return false;
    const p = _worldPrice(w);
    return !!(p && window.GameWallet && window.GameWallet.canAfford(p.coins || 0, p.embers || 0));
  }
  function _unlocked(w) { return (typeof getWorldUnlocked === 'function') ? getWorldUnlocked(w) : (window.getWorldUnlocked ? window.getWorldUnlocked(w) : 1); }
  function _classicMenu() { try { return localStorage.getItem('pogl_classic_menu') === '1'; } catch (e) { return false; } }

  // Snap-to-target helper (LERP without overshoot)
  function approach(cur, tgt, rate) {
    const d = tgt - cur;
    if (Math.abs(d) < 0.001) return tgt;
    return cur + d * rate;
  }

  // ── BIOMES ───────────────────────────────────────────────────────
  // Each world resolves to one biome that drives:
  //   • sky gradient (top→bottom)
  //   • ground tile colors (two-tone)
  //   • accent for surface texture (grass tufts / dust motes / etc.)
  //   • decoration list (which props get scattered across the world)
  //   • path stones color (the trail between level islands)
  //   • particle (drifting overlay: petals / snow / embers / dust …)
  const BIOMES = {
    highland: {
      sky: ['#5a8acc', '#2a4a78'],
      ground: ['#3a6a3a', '#2a5028'],
      accent: '#88c870',
      water: '#3a6a8a',
      decor: ['pine', 'rock', 'flower', 'sheep'],
      pathStone: '#a89a7a',
      particle: { color: '#ddffcc', shape: 'pollen', count: 24 },
    },
    cherry: {
      sky: ['#ffc8e0', '#aa6088'],
      ground: ['#6a3a52', '#3a1a28'],
      accent: '#ffb0d8',
      water: '#aa4070',
      decor: ['cherryTree', 'lantern', 'rock', 'flower'],
      pathStone: '#d088a0',
      particle: { color: '#ffb0d8', shape: 'petal', count: 30 },
    },
    forest: {
      sky: ['#5aa050', '#1a3a20'],
      ground: ['#2a4a2a', '#13251a'],
      accent: '#88aa6a',
      water: '#2a5040',
      decor: ['tree', 'mushroom', 'rock', 'fern'],
      pathStone: '#7a8a5a',
      particle: { color: '#88ff88', shape: 'leaf', count: 20 },
    },
    frozen: {
      sky: ['#bcd0e8', '#3a5a8a'],
      ground: ['#d8e8f0', '#7a92a8'],
      accent: '#ffffff',
      water: '#88aacc',
      decor: ['snowyTree', 'iceCrystal', 'snowPile', 'rock'],
      pathStone: '#c8d4e0',
      particle: { color: '#ffffff', shape: 'snow', count: 36 },
    },
    desert: {
      sky: ['#ffaa66', '#aa5544'],
      ground: ['#d8a060', '#a8743c'],
      accent: '#ffd080',
      water: '#aa6030',
      decor: ['cactus', 'palm', 'rock', 'dune'],
      pathStone: '#aa7a40',
      particle: { color: '#ffd080', shape: 'dust', count: 22 },
    },
    volcanic: {
      sky: ['#aa3030', '#3a1010'],
      ground: ['#4a2020', '#1a0808'],
      accent: '#ff6040',
      water: '#aa3010',
      decor: ['lavaRock', 'magmaCrack', 'obsidian'],
      pathStone: '#3a1a14',
      particle: { color: '#ff7040', shape: 'ember', count: 36 },
    },
    haunted: {
      sky: ['#3a1a4a', '#0a0510'],
      ground: ['#1a1020', '#0a0510'],
      accent: '#8060a0',
      water: '#3a204a',
      decor: ['deadTree', 'tombstone', 'rock', 'lantern'],
      pathStone: '#3a2a4a',
      particle: { color: '#9988ff', shape: 'wisp', count: 18 },
    },
    shadow: {
      sky: ['#3a1a3a', '#000'],
      ground: ['#1a0a1a', '#0a0508'],
      accent: '#604070',
      water: '#2a103a',
      decor: ['shadowSpike', 'voidOrb', 'rock'],
      pathStone: '#3a2a4a',
      particle: { color: '#a080ff', shape: 'wisp', count: 16 },
    },
    cyber: {
      sky: ['#3a0a4a', '#0a0a2a'],
      ground: ['#1a0a2a', '#0a0518'],
      accent: '#ff40c8',
      water: '#1a3a8a',
      decor: ['neonSign', 'antenna', 'crystal'],
      pathStone: '#ff40c8',
      particle: { color: '#a080ff', shape: 'spark', count: 30 },
    },
    coralreef: {
      sky: ['#88c8e0', '#2a5070'],
      ground: ['#3a8aaa', '#1a4866'],
      accent: '#ffa0c0',
      water: '#2a8acc',
      decor: ['coral', 'kelp', 'shell', 'rock'],
      pathStone: '#a0c0d8',
      particle: { color: '#88e0ff', shape: 'bubble', count: 28 },
    },
    cosmic: {
      sky: ['#3a1a6a', '#0a0518'],
      ground: ['#1a0a3a', '#0a0518'],
      accent: '#a080ff',
      water: '#2a1a5a',
      decor: ['asteroid', 'crystal', 'starCluster'],
      pathStone: '#5a3a8a',
      particle: { color: '#ffffff', shape: 'star', count: 40 },
    },
    steampunk: {
      sky: ['#aa7a40', '#3a2010'],
      ground: ['#3a2818', '#1a1208'],
      accent: '#ffb060',
      water: '#603020',
      decor: ['gear', 'pipe', 'cog', 'rock'],
      pathStone: '#8a6030',
      particle: { color: '#ffb060', shape: 'ember', count: 20 },
    },
    crystal: {
      sky: ['#3a6aaa', '#0a1a3a'],
      ground: ['#1a2a4a', '#0a1228'],
      accent: '#80c8ff',
      water: '#2a4a8a',
      decor: ['crystal', 'iceCrystal', 'rock'],
      pathStone: '#5a8acc',
      particle: { color: '#88c8ff', shape: 'spark', count: 28 },
    },
    citadel: {
      sky: ['#88aaff', '#3a5a88'],
      ground: ['#6a5a3a', '#3a2a1a'],
      accent: '#ffd060',
      water: '#3a5a88',
      decor: ['stonePillar', 'banner', 'rock', 'tower'],
      pathStone: '#aa9070',
      particle: { color: '#ffffff', shape: 'cloud', count: 12 },
    },
    blueprint: {
      sky: ['#1a3a8a', '#0a1a4a'],
      ground: ['#1a3a8a', '#0a1a4a'],
      accent: '#88c8ff',
      water: '#1a3a8a',
      decor: ['gear', 'antenna', 'crystal'],
      pathStone: '#88c8ff',
      particle: { color: '#88c8ff', shape: 'spark', count: 18 },
    },
    heaven: {
      sky: ['#5fa6e6', '#cfe4f4'],
      ground: ['#d8e2f0', '#9aa8c8'],
      accent: '#ffe9a0',
      water: '#88b8e0',
      decor: ['cloudTuft', 'stonePillar', 'flower', 'cloudTuft'],
      pathStone: '#f0e6c0',
      particle: { color: '#ffffff', shape: 'cloud', count: 16 },
    },
  };

  // ── CRITTERS ─────────────────────────────────────────────────────
  // Animated living things scattered across each overworld so the
  // map feels alive. Each biome lists a few critter specs; the layout
  // pass scatters instances and the tick pass animates them.
  //   behavior 'fly'   — cruises horizontally, wraps the region, bobs
  //   behavior 'hop'   — ground critter, wanders home in little hops
  //   behavior 'drift' — floats slowly in a lazy lissajous around home
  //   behavior 'dart'  — like drift but faster + wider (fish / sparks)
  const CRITTERS_BY_BIOME = {
    highland: [{ t: 'bird', b: 'fly' }, { t: 'butterfly', b: 'fly', c: '#ffd24a' }, { t: 'rabbit', b: 'hop' }],
    cherry: [{ t: 'bird', b: 'fly' }, { t: 'butterfly', b: 'fly', c: '#ff8ad0' }],
    forest: [{ t: 'bird', b: 'fly' }, { t: 'firefly', b: 'drift', c: '#aaff66' }, { t: 'rabbit', b: 'hop' }],
    frozen: [{ t: 'bird', b: 'fly', c: '#dde8f0' }, { t: 'rabbit', b: 'hop', c: '#f4f8ff' }],
    desert: [{ t: 'bird', b: 'fly', c: '#5a4030' }, { t: 'beetle', b: 'hop' }],
    volcanic: [{ t: 'emberMote', b: 'drift' }, { t: 'bat', b: 'fly' }],
    haunted: [{ t: 'ghost', b: 'drift' }, { t: 'bat', b: 'fly' }, { t: 'firefly', b: 'drift', c: '#9988ff' }],
    shadow: [{ t: 'ghost', b: 'drift', c: 'rgba(190,160,235,0.6)' }, { t: 'bat', b: 'fly' }],
    cyber: [{ t: 'drone', b: 'fly' }, { t: 'firefly', b: 'drift', c: '#ff40c8' }],
    coralreef: [{ t: 'fish', b: 'dart', c: '#ffb347' }, { t: 'fish', b: 'dart', c: '#5ad0ff' }, { t: 'jellyfish', b: 'drift' }],
    cosmic: [{ t: 'firefly', b: 'drift', c: '#ffffff' }, { t: 'emberMote', b: 'drift', c: '#a080ff' }],
    steampunk: [{ t: 'steamPuff', b: 'drift' }, { t: 'bird', b: 'fly', c: '#3a2a1a' }],
    crystal: [{ t: 'bat', b: 'fly', c: '#5a7aaa' }, { t: 'firefly', b: 'drift', c: '#88c8ff' }],
    citadel: [{ t: 'bird', b: 'fly' }, { t: 'butterfly', b: 'fly', c: '#ffe070' }],
    blueprint: [{ t: 'drone', b: 'fly', c: '#88c8ff' }],
    heaven: [{ t: 'bird', b: 'fly', c: '#ffffff' }, { t: 'cloudSheep', b: 'drift' }, { t: 'butterfly', b: 'fly', c: '#fff0b0' }],
  };

  // Map a level/world theme name → biome key
  function _biomeForWorld(wd) {
    if (!wd) return 'highland';
    // Hardcoded by world name (handles the canonical campaign)
    const name = (wd.name || '').toUpperCase();
    if (name.indexOf('MISTY') >= 0) return 'highland';
    if (name.indexOf('HAUNT') >= 0) return 'haunted';
    if (name.indexOf('CRYSTAL') >= 0) return 'crystal';
    if (name.indexOf('SKY CITADEL') >= 0) return 'citadel';
    if (name.indexOf('LEGACY') >= 0) return 'highland';
    if (name.indexOf('CLEVER') >= 0) return 'cosmic';
    if (name.indexOf('INFERNO') >= 0) return 'volcanic';
    if (name.indexOf('FROST') >= 0) return 'frozen';
    if (name.indexOf('SHADOW') >= 0) return 'shadow';
    if (name.indexOf('NEON') >= 0) return 'cyber';
    if (name.indexOf('CORAL') >= 0) return 'coralreef';
    if (name.indexOf('BRASS') >= 0) return 'steampunk';
    if (name.indexOf('HOLLOW') >= 0) return 'haunted';
    if (name.indexOf('STARFALL') >= 0) return 'cosmic';
    if (name.indexOf('DUNE') >= 0) return 'desert';
    if (name.indexOf('VEILED') >= 0) return 'forest';
    if (name.indexOf('PETAL') >= 0) return 'cherry';
    if (name.indexOf('CELESTIAL') >= 0 || name.indexOf('ASCENT') >= 0
      || name.indexOf('HEAVEN') >= 0 || name.indexOf('SKY') >= 0) return 'heaven';
    // Fallback: peek at the first level's theme
    const lv = wd.levels && wd.levels[0];
    if (lv && lv.theme && BIOMES[lv.theme]) return lv.theme;
    return 'highland';
  }
  function _biome(wd) {
    return BIOMES[_biomeForWorld(wd)] || BIOMES.highland;
  }

  // ── Category collection ─────────────────────────────────────────
  // The galaxy view shows one planet per category, mirroring how the
  // DOM world-select groups things. Order follows the legacy grid.
  function _collectCategories() {
    const out = [];
    const ws = _worlds();

    // OG WORLD — worlds with category 'og' (or first 5 by default)
    const og = ws.map((w, i) => ({ w, i })).filter(x => x.w && (x.w.category === 'og' || (x.w.category == null && x.i < 5)));
    if (og.length > 0) {
      out.push({
        key: 'og',
        name: 'OG WORLD',
        emoji: '🏰',
        color: '#f5c518',
        glow: '#f5c51866',
        worlds: og,
      });
    }
    // NEW LEVELS
    const nw = ws.map((w, i) => ({ w, i })).filter(x => x.w && x.w.category === 'new');
    if (nw.length > 0) {
      out.push({
        key: 'new',
        name: 'NEW LEVELS',
        emoji: '🌟',
        color: '#cf80ff',
        glow: '#cf80ff66',
        worlds: nw,
      });
    }
    // EXPANSION
    const ex = ws.map((w, i) => ({ w, i })).filter(x => x.w && x.w.category === 'expansion');
    if (ex.length > 0) {
      out.push({
        key: 'expansion',
        name: 'EXPANSION',
        emoji: '🌌',
        color: '#5ad8ff',
        glow: '#5ad8ff66',
        worlds: ex,
      });
    }
    // THE SUNKEN ROAD — new galaxy (worlds 20-29)
    const sk = ws.map((w, i) => ({ w, i })).filter(x => x.w && x.w.category === 'sunken');
    if (sk.length > 0) {
      out.push({
        key: 'sunken',
        name: 'THE SUNKEN ROAD',
        emoji: '🌊',
        color: '#2ec8e0',
        glow: '#2ec8e066',
        worlds: sk,
      });
    }
    // THE ASCENT BEYOND — new galaxy (worlds 30-39)
    const ac = ws.map((w, i) => ({ w, i })).filter(x => x.w && x.w.category === 'ascent');
    if (ac.length > 0) {
      out.push({
        key: 'ascent',
        name: 'THE ASCENT BEYOND',
        emoji: '☄️',
        color: '#b88aff',
        glow: '#b88aff66',
        worlds: ac,
      });
    }
    // THE PRISM DIMENSION — the 3D platformer levels (Highland Prism)
    const pd = ws.map((w, i) => ({ w, i })).filter(x => x.w && x.w.category === '3d');
    if (pd.length > 0) {
      out.push({
        key: '3d',
        name: 'THE PRISM DIMENSION',
        emoji: '💠',
        color: '#b06bff',
        glow: '#b06bff66',
        worlds: pd,
      });
    }
    // GENERATED (only if it has any rolls) — sits before TUTORIAL
    // so the galaxy order reads OG → NEW → EXPANSION → GENERATED →
    // TUTORIAL from left to right.
    const gn = ws.map((w, i) => ({ w, i })).filter(x => x.w && x.w.category === 'generated' && x.w.levels && x.w.levels.length > 0);
    if (gn.length > 0) {
      out.push({
        key: 'generated',
        name: 'GENERATED',
        emoji: '🎲',
        color: '#ff8a6e',
        glow: '#ff8a6e66',
        worlds: gn,
      });
    }
    // TUTORIAL
    const tu = ws.map((w, i) => ({ w, i })).filter(x => x.w && x.w.category === 'tutorial');
    if (tu.length > 0) {
      out.push({
        key: 'tutorial',
        name: 'TUTORIAL',
        emoji: '📐',
        color: '#88c8ff',
        glow: '#88c8ff66',
        worlds: tu,
      });
    }
    return out;
  }

  // ── Galaxy-view state sync for a given world ────────────────────
  // Sets mode / gIdx / subIdx / orbit angle so the galaxy view shows
  // the right tier when we back out of world `w`:
  //   • single-world galaxy (e.g. Tutorial) → the all-galaxies ring
  //     with that galaxy focused.
  //   • multi-world galaxy → that galaxy's world sub-orbit, with `w`
  //     focused.
  function _syncGalaxyToWorld(w) {
    const cats = _collectCategories();
    for (let i = 0; i < cats.length; i++) {
      const idx = cats[i].worlds.findIndex(x => x.i + 1 === w);
      if (idx < 0) continue;
      gIdx = i;
      if (cats[i].worlds.length <= 1) {
        mode = 'category';
        subIdx = 0;
      } else {
        mode = 'world';
        subIdx = idx;
      }
      const n = (mode === 'category') ? cats.length : cats[i].worlds.length;
      const fi = (mode === 'category') ? gIdx : subIdx;
      // Orbit places planet i at ang = gAng - i*step, so focusing fi
      // at the front-centre needs gAng = π/2 + fi*step.
      gAngTarget = Math.PI / 2 + fi * (Math.PI * 2 / Math.max(1, n));
      gAng = gAngTarget;
      return;
    }
    // World not found in any galaxy — fall back to the galaxy ring.
    mode = 'category'; gIdx = 0; subIdx = 0;
    gAngTarget = Math.PI / 2; gAng = gAngTarget;
  }

  // ── Starfield init ──────────────────────────────────────────────
  // Generates stars in a normalized [0..1] space so the field stays
  // distributed evenly when the canvas resizes mid-session.
  function _initStars() {
    stars = [];
    for (let i = 0; i < 220; i++) {
      stars.push({
        nx: Math.random(),                // normalized 0..1
        ny: Math.random(),
        z: 0.3 + Math.random() * 0.7,    // parallax depth
        s: 0.5 + Math.random() * 1.6,    // size
        ph: Math.random() * Math.PI * 2, // twinkle phase
      });
    }
  }

  // ── World-map node layout ───────────────────────────────────────
  // Lay levels along a gentle S-curve so it feels like a path on a
  // tilted plane. Stored as NORMALIZED (0..1) coordinates so the
  // layout adapts when the canvas resizes; we project to pixels at
  // draw time. Used by the world view.
  function _layoutNodes(world) {
    nodes = [];
    if (!world || !world.levels) return;
    const n = world.levels.length;
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5;
      // S-curve: x linear left→right, y a sine bob
      const nx = 0.14 + t * 0.72;
      const ny = 0.55 + Math.sin(t * Math.PI * 1.6) * 0.18;
      nodes.push({ nx, ny, x: 0, y: 0, idx: i, name: world.levels[i].name || ('L' + (i + 1)) });
    }
  }
  function _projectNodes() {
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = nodes[i].nx * VIEW_W;
      nodes[i].y = nodes[i].ny * VIEW_H;
    }
  }

  // ── Public API ──────────────────────────────────────────────────
  function open() {
    if (_classicMenu()) {
      // User opted out — show the original DOM world-select grid.
      if (typeof UI !== 'undefined' && UI.showScreen) UI.showScreen('s-worldselect');
      return;
    }
    // Hide every DOM screen so the canvas owns the viewport
    try {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const hud = document.getElementById('hud'); if (hud) hud.style.display = 'none';
    } catch (e) { }
    view = 'galaxy';
    mode = 'category';
    gIdx = 0;
    wIdx = 0;
    subIdx = 0;
    gAng = 0;
    gAngTarget = 0;
    zoom = 0.6; zoomTarget = 1;
    _initStars();
    window.GS = 'worldmap';
    // Keep the menu loop playing across title→worldmap transitions.
    // startMenuMusic is idempotent so if it's already up this just
    // re-targets the slider-driven volume.
    try { if (typeof window.startMenuMusic === 'function') window.startMenuMusic(); } catch (e) { }
  }

  // ── Open the worldmap directly INTO a specific world, with the
  // avatar positioned next to the island for the level the player
  // just played. Used by the in-game "LEVEL SELECT" buttons so the
  // player returns to where they were instead of back at the galaxy
  // top.
  function openAtLevel(worldIdx1, levelIdx1) {
    if (_classicMenu()) {
      if (typeof UI !== 'undefined' && UI.showScreen) UI.showScreen('s-worldselect');
      return;
    }
    const ws = _worlds();
    const w = (worldIdx1 | 0);
    const wd = ws[w - 1];
    if (!wd || !wd.levels || wd.levels.length === 0) {
      // Fall back to the regular open() if the world is invalid
      open();
      return;
    }
    try {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const hud = document.getElementById('hud'); if (hud) hud.style.display = 'none';
    } catch (e) { }
    // Resolve which galaxy tier the back-navigation (ESC → galaxy)
    // should return to. Single-world galaxies drop to the all-
    // galaxies ring; multi-world galaxies show their world sub-orbit.
    _syncGalaxyToWorld(w);
    zoom = 1; zoomTarget = 1;
    _initStars();
    // Enter the world view immediately.
    wIdx = w;
    _enterWorldMap(w);
    // Now reposition the avatar near the SPECIFIC level they were on.
    const lvlIdx0 = Math.max(0, Math.min(islands.length - 1, (levelIdx1 | 0) - 1));
    const isl = islands[lvlIdx0];
    if (isl) {
      avatar.x = isl.wx;
      avatar.y = isl.wy + 140;   // stand just south of the island
      cameraX = avatar.x;
      cameraY = avatar.y;
      // Force the proximity detector to immediately surface the info
      // card for the level we just came from.
      nearbyIdx = lvlIdx0;
      infoAlpha = 1;
    }
    window.GS = 'worldmap';
    try { if (typeof window.startMenuMusic === 'function') window.startMenuMusic(); } catch (e) { }
  }

  function close() {
    window.GS = 'title';
    try {
      if (typeof UI !== 'undefined' && UI.showScreen) UI.showScreen('s-title');
    } catch (e) { }
    // Roll a fresh random demo background. Without this, if the
    // user paused mid-level (or finished one) and bounced to title
    // via the worldmap, the title canvas would show the previously-
    // played level frozen in place from where the demo was last
    // ticked (updateBgNpc doesn't run while GS = 'paused' / 'worldmap').
    try { if (typeof initBgState === 'function') initBgState(); } catch (e) { }
  }

  // ── Galaxy view: tick ───────────────────────────────────────────
  function _tickGalaxy() {
    const K = window.K || {};
    const JP = window.JP || {};
    const cats = _collectCategories();
    if (cats.length === 0) { return; }

    // Source list depends on mode: category list vs worlds inside one cat
    const list = (mode === 'category') ? cats : cats[gIdx].worlds;
    if (list.length === 0) return;

    // Cycle selection with Left/Right. The orbit spins so that
    // → advances forward through the list (OG → NEW → EXPANSION →
    // GENERATED → TUTORIAL); ← steps back. So from OG, pressing →
    // lands on NEW, not the wrapped-around last galaxy.
    if (JP['ArrowLeft'] || JP['KeyA']) {
      if (mode === 'category') gIdx = (gIdx - 1 + cats.length) % cats.length;
      else subIdx = (subIdx - 1 + list.length) % list.length;
      _pendingBuyWorld = -1;
      try { if (window.sfx) window.sfx('coin'); } catch (e) { }
    }
    if (JP['ArrowRight'] || JP['KeyD']) {
      if (mode === 'category') gIdx = (gIdx + 1) % cats.length;
      else subIdx = (subIdx + 1) % list.length;
      _pendingBuyWorld = -1;
      try { if (window.sfx) window.sfx('coin'); } catch (e) { }
    }
    if (_pendingBuyTimer > 0) _pendingBuyTimer--;
    if (_pendingBuyTimer <= 0) _pendingBuyWorld = -1;
    // Drill in (shared with the tap path — keeps premium-buy logic in one place)
    if (JP['Enter'] || JP['Space'] || JP['NumpadEnter']) {
      _galaxyDrillIn();
    }
    // Back
    if (JP['Escape']) {
      if (mode === 'world') { mode = 'category'; subIdx = 0; }
      else close();
    }

    // Smoothly approach the target angle. The orbit places planet i
    // at ang = gAng - i*step (see _drawGalaxy), so for the focused
    // entry to sit at the front-centre (ang = π/2) we need
    // gAng = π/2 + focusedIdx*step.
    const targetCount = list.length;
    gAngTarget = Math.PI / 2 + ((mode === 'category') ? gIdx : subIdx) * (Math.PI * 2 / Math.max(1, targetCount));
    // Take the short way around the circle
    while (gAngTarget - gAng > Math.PI) gAng += Math.PI * 2;
    while (gAng - gAngTarget > Math.PI) gAng -= Math.PI * 2;
    gAng = approach(gAng, gAngTarget, 0.15);
    zoom = approach(zoom, zoomTarget, 0.1);
    tickCount++;
  }

  function _enterWorldMap(world1) {
    const ws = _worlds();
    const wd = ws[world1 - 1];
    if (!wd || !wd.levels) return;
    view = 'world';
    _layoutIslands(wd);
    // Spawn the avatar near the first island
    if (islands.length > 0) {
      avatar.x = islands[0].wx;
      avatar.y = islands[0].wy + 140;
    } else {
      avatar.x = 0; avatar.y = 0;
    }
    avatar.vx = 0; avatar.vy = 0; avatar.facing = 1; avatar.frame = 0; avatar.walk = 0;
    cameraX = avatar.x;
    cameraY = avatar.y;
    nearbyIdx = -1;
    infoAlpha = 0;
    walkTarget = null;
    try { if (window.sfx) window.sfx('powerup'); } catch (e) { }
  }

  // ── Path shapes — eight distinct world layouts ──────────────────
  // Each world picks a path STYLE (cycled by world index) so the
  // trail between levels reads differently world-to-world: a gentle
  // serpentine, an outward spiral, a sweeping arc, a sharp zigzag, a
  // diagonal staircase, a closed loop, a tall sine wave, or grouped
  // clusters. A seeded RNG varies the exact parameters so two worlds
  // sharing a style still differ.
  function _pathPositions(n, wIdx, rng) {
    const styles = ['serpentine', 'spiral', 'arc', 'zigzag', 'staircase', 'loop', 'wave', 'clusters'];
    const style = styles[((wIdx - 1) % styles.length + styles.length) % styles.length];
    const pts = [];
    if (n <= 0) return pts;
    if (n === 1) { pts.push({ x: 320, y: 320 }); return pts; }

    if (style === 'serpentine') {
      let x = 320, y = 320, angle = (rng() - 0.5) * 0.9;
      const STEP = 400 + rng() * 150, PERP = 180 + rng() * 150;
      for (let i = 0; i < n; i++) {
        const turn = (rng() - 0.5) * 1.6;
        angle = angle * 0.5 + turn;
        x += Math.cos(angle) * STEP;
        const yw = Math.sin(i * 0.6 + wIdx * 0.7) * PERP;
        y += Math.sin(angle) * STEP * 0.5 + (yw - (i > 0 ? Math.sin((i - 1) * 0.6 + wIdx * 0.7) * PERP : 0));
        pts.push({ x, y });
      }
    } else if (style === 'spiral') {
      const turns = 1.15 + rng() * 0.8;
      const step = (Math.PI * 2 * turns) / Math.max(1, n - 1);
      const a0 = rng() * Math.PI * 2;
      for (let i = 0; i < n; i++) {
        const r = 150 + i * (90 + rng() * 30);
        const a = a0 + i * step;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.72 });
      }
    } else if (style === 'arc') {
      const R = 520 + rng() * 260;
      const spanA = 1.0 + rng() * 1.4;
      const dir = rng() < 0.5 ? 1 : -1;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const a = -spanA + t * spanA * 2;
        pts.push({ x: Math.sin(a) * R, y: dir * Math.cos(a) * R * 0.55 });
      }
    } else if (style === 'zigzag') {
      const dx = 360 + rng() * 150, band = 320 + rng() * 180;
      for (let i = 0; i < n; i++) {
        pts.push({ x: i * dx, y: (i % 2) * band + (rng() - 0.5) * 90 });
      }
    } else if (style === 'staircase') {
      const dx = 340 + rng() * 130, dy = (260 + rng() * 150) * (rng() < 0.5 ? -1 : 1);
      for (let i = 0; i < n; i++) {
        pts.push({ x: i * dx + (rng() - 0.5) * 90, y: i * dy + (rng() - 0.5) * 90 });
      }
    } else if (style === 'loop') {
      const R = 440 + rng() * 220;
      const a0 = rng() * Math.PI * 2;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * Math.PI * 2;
        pts.push({ x: Math.cos(a) * R, y: Math.sin(a) * R * 0.66 });
      }
    } else if (style === 'wave') {
      const dx = 380 + rng() * 150, amp = 300 + rng() * 200, freq = 0.6 + rng() * 0.6;
      for (let i = 0; i < n; i++) {
        pts.push({ x: i * dx, y: Math.sin(i * freq) * amp });
      }
    } else { // clusters — groups of ~3 levels separated by long hops
      const per = 3;
      const gap = 760 + rng() * 320;
      for (let i = 0; i < n; i++) {
        const cl = Math.floor(i / per), loc = i % per;
        const ccx = cl * gap + (rng() - 0.5) * 120;
        const ccy = Math.sin(cl * 1.3 + wIdx) * 320 + (rng() - 0.5) * 120;
        pts.push({
          x: ccx + (loc - 1) * 170 + (rng() - 0.5) * 90,
          y: ccy + (loc % 2 ? 130 : -130) + (rng() - 0.5) * 80,
        });
      }
    }
    // Light per-island jitter so even structured styles feel organic.
    for (let i = 0; i < pts.length; i++) {
      pts[i].x += (rng() - 0.5) * 60;
      pts[i].y += (rng() - 0.5) * 60;
    }
    return pts;
  }

  // ── Island layout — places each level along the world's path ────
  // The path style varies per world (see _pathPositions) so adjacent
  // worlds feel structurally different, not just re-themed.
  function _layoutIslands(wd) {
    islands = [];
    activeBiome = _biome(wd);
    if (!wd || !wd.levels) { worldW = 0; worldH = 0; return; }
    const n = wd.levels.length;
    const rng = _seedRng(wIdx, 9001);
    const pts = _pathPositions(n, wIdx, rng);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      const wx = pts[i].x, wy = pts[i].y;
      islands.push({
        idx: i,
        wx, wy,
        name: wd.levels[i].name || ('LEVEL ' + (i + 1)),
        lvl: wd.levels[i],
        seed: (wIdx * 100 + i),
      });
      if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy; if (wy > maxY) maxY = wy;
    }
    // Normalize so leftmost island sits at wx ≈ 200, top at wy ≈ 200
    const dx = 200 - minX, dy = 200 - minY;
    for (const isl of islands) { isl.wx += dx; isl.wy += dy; }
    worldW = (maxX - minX) + 400;
    worldH = (maxY - minY) + 400;
    // Now scatter environment decorations across the world
    _layoutDecorations(wd);
    _layoutCritters(wd);
  }

  // ── Critters — scatter animated wildlife through the world ──────
  function _layoutCritters(wd) {
    critters = [];
    if (!activeBiome) return;
    const spec = CRITTERS_BY_BIOME[_biomeForWorld(wd)];
    if (!spec || !spec.length) return;
    const rng = _seedRng(wIdx, 7707);
    const PAD = 900;
    const regionW = worldW + PAD * 2;
    const regionH = worldH + PAD * 2;
    // Sparser than decorations — critters are eye-catching, so a
    // moderate count keeps the world lively without feeling busy.
    const count = Math.max(12, Math.min(46, ((regionW * regionH) / 90000) | 0));
    for (let i = 0; i < count; i++) {
      const s = spec[(rng() * spec.length) | 0];
      const wx = rng() * regionW - PAD;
      const wy = rng() * regionH - PAD;
      critters.push({
        type: s.t, behavior: s.b, color: s.c || null,
        wx, wy, homeX: wx, homeY: wy, tx: wx, ty: wy,
        vx: (rng() < 0.5 ? -1 : 1) * (0.6 + rng() * 1.1),
        phase: rng() * Math.PI * 2,
        seed: (rng() * 1e9) | 0,
        facing: rng() < 0.5 ? -1 : 1,
        scale: 0.8 + rng() * 0.55,
        alt: (s.b === 'fly') ? (54 + rng() * 130)
          : (s.b === 'drift') ? (28 + rng() * 64) : 0,
        idle: (rng() * 50) | 0,
      });
    }
  }

  // Per-frame critter animation. Position is derived from simple
  // closed-form motion so there's no physics/collision bookkeeping.
  function _tickCritters() {
    if (!critters.length) return;
    const PAD = 1040;
    const minX = -PAD, maxX = worldW + PAD;
    for (let i = 0; i < critters.length; i++) {
      const cr = critters[i];
      cr.phase += 0.05;
      if (cr.behavior === 'fly') {
        cr.wx += cr.vx;
        cr.facing = cr.vx >= 0 ? 1 : -1;
        if (cr.wx < minX) cr.wx = maxX;
        else if (cr.wx > maxX) cr.wx = minX;
        cr.wy = cr.homeY + Math.sin(cr.phase * 0.6) * 26;
      } else if (cr.behavior === 'hop') {
        const dx = cr.tx - cr.wx, dy = cr.ty - cr.wy;
        const d = Math.hypot(dx, dy);
        if (d < 6 || cr.idle > 0) {
          if (cr.idle <= 0) cr.idle = 24 + ((cr.seed % 70));
          cr.idle--;
          if (cr.idle === 0) {
            const a = Math.random() * Math.PI * 2;
            const r = 26 + Math.random() * 130;
            cr.tx = cr.homeX + Math.cos(a) * r;
            cr.ty = cr.homeY + Math.sin(a) * r;
          }
        } else {
          const sp = 0.95;
          cr.wx += dx / d * sp;
          cr.wy += dy / d * sp;
          cr.facing = dx >= 0 ? 1 : -1;
        }
      } else { // drift / dart
        const dart = cr.behavior === 'dart';
        const R = dart ? 78 : 42;
        const sp = dart ? 1.7 : 0.85;
        const px = Math.cos(cr.phase * 0.7 * sp);
        cr.wx = cr.homeX + px * R;
        cr.wy = cr.homeY + Math.sin(cr.phase * 1.1 * sp) * R * 0.6;
        cr.facing = px >= 0 ? 1 : -1;
      }
    }
  }

  // ── Decorations — scatter themed props through the world ────────
  // Density scales with world size so big worlds feel full. We avoid
  // dropping props on top of islands or the path. The placement
  // region extends well past the level bounds so when the camera
  // pans to the edge of the world, the player still sees a populated
  // landscape rather than empty ground.
  function _layoutDecorations(wd) {
    decorations = [];
    if (!activeBiome || !activeBiome.decor) return;
    const rng = _seedRng(wIdx, 5505);
    const types = activeBiome.decor;
    // Extended placement region — pad ~960 in every direction so the
    // viewport always shows decorations even at the world's edges.
    const PAD = 1100;
    const regionW = worldW + PAD * 2;
    const regionH = worldH + PAD * 2;
    // Density scales with the EXTENDED region area. Roughly 1 prop
    // per ~14000 sq px → 60-ish for a small world, 280-ish for big.
    const target = Math.max(80, Math.min(320, ((regionW * regionH) / 14000) | 0));
    for (let i = 0; i < target; i++) {
      let wx = 0, wy = 0, ok = false;
      for (let tries = 0; tries < 6; tries++) {
        wx = rng() * regionW - PAD;
        wy = rng() * regionH - PAD;
        ok = true;
        for (const isl of islands) {
          if (Math.hypot(isl.wx - wx, isl.wy - wy) < 160) { ok = false; break; }
        }
        // Also avoid placing on top of an existing prop (rough check
        // against the last few so we don't get clumps).
        const recent = Math.min(8, decorations.length);
        for (let r = decorations.length - recent; r < decorations.length; r++) {
          const d = decorations[r];
          if (Math.hypot(d.wx - wx, d.wy - wy) < 36) { ok = false; break; }
        }
        if (ok) break;
      }
      if (!ok) continue;
      const type = types[(rng() * types.length) | 0];
      const scale = 0.55 + rng() * 0.6;
      decorations.push({
        type, wx, wy, scale,
        seed: (rng() * 1e9) | 0,
        variant: (rng() * 4) | 0,
      });
    }
  }

  // ── World view: tick (free-walk overworld) ──────────────────────
  // The avatar moves freely on a wide ground plane. The camera
  // follows. Walking near a level island sets nearbyIdx and fades
  // in the info card; Enter on that island plays it.
  function _tickWorld() {
    const K = window.K || {};
    const JP = window.JP || {};

    if (!islands.length) {
      if (JP['Escape']) view = 'galaxy';
      tickCount++;
      return;
    }

    // ── 8-direction walking ─────────────────────────────────────
    let dx = 0, dy = 0;
    if (K['ArrowLeft'] || K['KeyA']) dx -= 1;
    if (K['ArrowRight'] || K['KeyD']) dx += 1;
    if (K['ArrowUp'] || K['KeyW']) dy -= 1;
    if (K['ArrowDown'] || K['KeyS']) dy += 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    // Virtual joystick — overrides when no keyboard input is given.
    if (dx === 0 && dy === 0 && _stick.id >= 0) {
      const sm = Math.hypot(_stick.dx, _stick.dy);
      if (sm > 0.2) { dx = _stick.dx; dy = _stick.dy; walkTarget = null; }
    }
    // Touch walk-to: if no key/stick input, head toward the tapped point.
    if (dx !== 0 || dy !== 0) {
      walkTarget = null;
    } else if (walkTarget) {
      const tx = walkTarget.x - avatar.x, ty = walkTarget.y - avatar.y;
      const dist = Math.hypot(tx, ty);
      if (dist < 12) { walkTarget = null; }
      else { dx = tx / dist; dy = ty / dist; }
    }
    // Hold RUN (key, pad, or the on-screen RUN button) to sprint.
    const _running = _runBtn.down || (function () {
      try { return typeof window.kHeld === 'function' && window.kHeld('run'); }
      catch (e) { return false; }
    })();
    const speed = AVATAR_SPEED * 1.3 * (_running ? 2 : 1);
    avatar.vx = dx * speed;
    avatar.vy = dy * speed;
    avatar.x += avatar.vx;
    avatar.y += avatar.vy;
    // Clamp to world bounds with a generous margin so the player can
    // walk a bit out into the decorated surroundings before hitting
    // the invisible wall. Matches the decoration-placement buffer.
    const MARGIN = 600;
    if (avatar.x < -MARGIN) avatar.x = -MARGIN;
    if (avatar.x > worldW + MARGIN) avatar.x = worldW + MARGIN;
    if (avatar.y < -MARGIN) avatar.y = -MARGIN;
    if (avatar.y > worldH + MARGIN) avatar.y = worldH + MARGIN;
    if (dx !== 0) avatar.facing = (dx > 0) ? 1 : -1;
    if (dx !== 0 || dy !== 0) avatar.walk = (avatar.walk + (_running ? 0.30 : 0.18)) % (Math.PI * 2);

    // ── Camera follow (smooth lerp) ─────────────────────────────
    cameraX = approach(cameraX, avatar.x, 0.14);
    cameraY = approach(cameraY, avatar.y, 0.14);

    // ── Animate the world's wildlife ────────────────────────────
    _tickCritters();

    // ── Proximity: find closest island within trigger radius ────
    const PROX_R = 150;
    let bestI = -1, bestD = PROX_R * PROX_R;
    for (let i = 0; i < islands.length; i++) {
      const isl = islands[i];
      const dxn = isl.wx - avatar.x;
      const dyn = isl.wy + 40 - avatar.y; // island center is above the ground line
      const d2 = dxn * dxn + dyn * dyn;
      if (d2 < bestD) { bestD = d2; bestI = i; }
    }
    if (bestI !== nearbyIdx) {
      nearbyIdx = bestI;
      infoAlpha = 0;
      if (nearbyIdx >= 0) {
        try { if (window.sfx) window.sfx('coin'); } catch (e) { }
      }
    }
    // Fade info card based on proximity
    if (nearbyIdx >= 0) infoAlpha = Math.min(1, infoAlpha + 0.08);
    else infoAlpha = Math.max(0, infoAlpha - 0.12);

    // ── Enter → play nearby level ───────────────────────────────
    if ((JP['Enter'] || JP['Space'] || JP['NumpadEnter']) && nearbyIdx >= 0) {
      const w = wIdx;
      const l = nearbyIdx + 1;
      const accessible = _accessible(w);
      const unlockAll = (function () { try { return localStorage.getItem('pogl_unlock_all') === '1'; } catch (e) { return false; } })();
      const unlocked = _unlocked(w);
      if (accessible && (unlockAll || nearbyIdx < unlocked)) {
        try { if (window.stopMenuMusic) window.stopMenuMusic(); } catch (e) { }
        try { if (window.UI && window.UI.startGame) window.UI.startGame(w, l); } catch (e) { }
      } else {
        try { if (window.sfx) window.sfx('hit'); } catch (e) { }
      }
    }
    // ── F → edit nearby level (only in local edit mode) ────────
    if ((JP['KeyF'] || JP['F2']) && nearbyIdx >= 0) {
      const editOn = (typeof isLocalEditMode === 'function') ? isLocalEditMode() : false;
      if (editOn && window.UI && window.UI.editLevel) {
        try { window.UI.editLevel(wIdx, nearbyIdx + 1); }
        catch (e) { console.error('worldmap edit:', e); }
      }
    }
    if (JP['Escape']) {
      // Back out to the galaxy view. _syncGalaxyToWorld picks the
      // right tier — single-world galaxies (Tutorial) return to the
      // full all-galaxies ring, multi-world galaxies to their world
      // sub-orbit.
      _syncGalaxyToWorld(wIdx);
      view = 'galaxy';
    }

    tickCount++;
  }

  // ── Tick dispatch ───────────────────────────────────────────────
  function tick() {
    // Keep VIEW_W/VIEW_H tracking the live canvas size so clamp +
    // hover-detection math match what draw() ends up rendering.
    try {
      const cv = (typeof canvas !== 'undefined' && canvas) || (window.gameCanvas) || document.getElementById('gameCanvas');
      if (cv) {
        if (cv.width > 0) VIEW_W = cv.width;
        if (cv.height > 0) VIEW_H = cv.height;
      }
    } catch (e) { }
    if (view === 'galaxy') _tickGalaxy();
    else if (view === 'world') _tickWorld();
  }

  // ── Galaxy view: draw ───────────────────────────────────────────
  function _drawBg(c) {
    // Deep space gradient
    const g = c.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#050218');
    g.addColorStop(1, '#0a0530');
    c.fillStyle = g;
    c.fillRect(0, 0, VIEW_W, VIEW_H);
    // Parallax starfield (normalized coords → pixels at draw time)
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.6 + 0.4 * Math.sin(tickCount * 0.04 + s.ph);
      c.fillStyle = 'rgba(255,255,255,' + (tw * s.z).toFixed(2) + ')';
      c.fillRect((s.nx * VIEW_W) | 0, (s.ny * VIEW_H) | 0, s.s, s.s);
    }
    // Subtle nebula glow blobs
    for (let i = 0; i < 3; i++) {
      const cx = VIEW_W * (0.2 + 0.3 * i);
      const cy = VIEW_H * 0.5 + Math.sin(tickCount * 0.005 + i) * 40;
      const grad = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(VIEW_W, VIEW_H) * 0.25);
      grad.addColorStop(0, ['rgba(140,90,200,0.10)', 'rgba(90,160,200,0.08)', 'rgba(200,120,160,0.08)'][i]);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = grad;
      c.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  // ── Pixel diorama: a 3D-pixel slice of an actual level ──────────
  // Renders the level's terrain/items/enemies as a tilted floating
  // chunk. Used as the "planet" graphic for individual worlds (we
  // sample the first level for the world's diorama) and as the pad
  // graphic for each level node on the world map.
  //
  // Arguments:
  //   c       — CanvasRenderingContext2D
  //   cx,cy   — center of the diorama in screen space
  //   size    — overall pixel diameter of the diorama
  //   lvl     — level data object (platforms, coins, enemies, …)
  //   tint    — fallback fill if the level doesn't carry colors
  //   focused — selected state; if true we add a glow + faint halo
  function _drawLevelDiorama(c, cx, cy, size, lvl, tint, focused) {
    if (!lvl) {
      // Fallback: solid colored disc
      c.fillStyle = tint || '#445';
      c.beginPath();
      c.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
      c.fill();
      return;
    }
    const lvW = lvl.width || 2400;
    const lvH = lvl.height || 560;
    // Diorama dimensions — the level's aspect drives the box.
    const aspect = Math.min(2.0, Math.max(0.6, lvW / lvH));
    const boxW = size * Math.min(1, aspect / 1.6);
    const boxH = size * Math.min(1, 1.0 / aspect);
    const halfW = boxW / 2, halfH = boxH / 2;

    // Outer halo for focus
    if (focused) {
      const g = c.createRadialGradient(cx, cy, size * 0.3, cx, cy, size * 1.05);
      const glow = (tint || '#88c8ff') + '88';
      g.addColorStop(0, glow);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(cx - size, cy - size, size * 2, size * 2);
    }

    // Background back-plate — slightly larger, gives a 3D edge
    const bgCol = (lvl.bgColors && lvl.bgColors[1]) || tint || '#180a30';
    const bgTop = (lvl.bgColors && lvl.bgColors[0]) || '#050218';

    // Project a level point (lx, ly) to screen using a small skew
    // for pseudo-3D depth. Top of the level pushes left (sky recedes),
    // bottom of the level pushes right (ground comes forward).
    // Implemented as a saved canvas transform.
    c.save();
    c.translate(cx, cy);
    // Slight tilt — looking down at ~25°
    c.transform(1, 0.18, -0.32, 0.78, 0, 0);
    c.translate(-halfW, -halfH);
    // Back-plate gradient
    const bg = c.createLinearGradient(0, 0, 0, boxH);
    bg.addColorStop(0, bgTop);
    bg.addColorStop(1, bgCol);
    c.fillStyle = bg;
    c.fillRect(0, 0, boxW, boxH);

    // Scale level coords → diorama coords
    const sx = boxW / lvW;
    const sy = boxH / lvH;

    // ── Platforms ─────────────────────────────────────────────────
    // Draw each as a 3D-looking slab: dark front face + bright top
    // edge. Type-specific colors keep ice/lava/bounce readable.
    const plat = (lvl.platColors && lvl.platColors[3]) || '#666';
    const platHi = (lvl.platColors && lvl.platColors[4]) || '#bbb';
    const platDk = (lvl.platColors && lvl.platColors[1]) || '#222';
    if (lvl.platforms) {
      for (let i = 0; i < lvl.platforms.length; i++) {
        const p = lvl.platforms[i];
        if (!p) continue;
        const px = p.x * sx, py = p.y * sy;
        const pw = Math.max(1, p.w * sx);
        const ph = Math.max(1, p.h * sy);
        let col = plat, top = platHi;
        if (p.type === 'ice') { col = '#aac8d8'; top = '#e8f4ff'; }
        else if (p.type === 'lava') { col = '#a82820'; top = '#ff7040'; }
        else if (p.type === 'bounce') { col = '#206a8a'; top = '#40c8ff'; }
        else if (p.type === 'spike') { col = '#3a3a3a'; top = '#888'; }
        else if (p.type === 'ground') { col = platDk; top = plat; }
        else if (p.type === 'magnetic') { col = '#aa3a8a'; top = '#ff80c8'; }
        else if (p.type === 'grapplehook') { col = '#aa8a30'; top = '#ffd060'; }
        else if (p.type === 'soundwave') { col = '#3aaa66'; top = '#88ff88'; }
        c.fillStyle = col;
        c.fillRect(px, py, pw, ph);
        c.fillStyle = top;
        c.fillRect(px, py, pw, Math.max(1, Math.min(ph, 1.5)));
      }
    }
    // Spikes (some levels carry them separately)
    if (lvl.spikes) {
      c.fillStyle = '#ff5070';
      for (const sp of lvl.spikes) {
        if (!sp) continue;
        c.fillRect((sp.x * sx) | 0, (sp.y * sy) | 0, Math.max(1, (sp.w || 16) * sx), Math.max(1, (sp.h || 16) * sy));
      }
    }
    // Bounces
    if (lvl.bounces) {
      c.fillStyle = '#40c8ff';
      for (const b of lvl.bounces) {
        if (!b) continue;
        c.fillRect((b.x * sx) | 0, (b.y * sy) | 0, Math.max(1, (b.w || 16) * sx), Math.max(1, (b.h || 16) * sy));
      }
    }

    // ── Pickups / items ───────────────────────────────────────────
    // Drawn as bigger pixels so they read at thumbnail scale.
    function _dot(x, y, sz, fill) {
      c.fillStyle = fill;
      const s = Math.max(1.4, sz);
      c.fillRect((x * sx - s * 0.5) | 0, (y * sy - s * 0.5) | 0, s | 0 || 1, s | 0 || 1);
    }
    // Coins — gold
    if (lvl.coins) for (const it of lvl.coins) if (it) _dot(it.x, it.y, 2.2, '#f5d020');
    // Q-blocks — orange
    if (lvl.qblocks) for (const it of lvl.qblocks) if (it) _dot(it.x, it.y, 3, '#ffa030');
    // Cblocks — brown
    if (lvl.cblocks) for (const it of lvl.cblocks) if (it) _dot(it.x, it.y, 2.5, '#8a5030');
    // Spirit embers — cyan
    if (lvl.spiritEmbers) for (const e of lvl.spiritEmbers) if (e) _dot(e.x, e.y, 3, '#80f0ff');
    // Power-ups — magenta
    if (lvl.powerupItems) for (const p of lvl.powerupItems) if (p) _dot(p.x, p.y, 3, '#c060ff');
    // Trophies — gold star size
    if (lvl.trophies) for (const t of lvl.trophies) if (t) _dot(t.x, t.y, 3.4, '#ffe060');
    // MarsBar pieces — pink
    if (lvl.marsBarPieces) for (const m of lvl.marsBarPieces) if (m) _dot(m.x, m.y, 2.4, '#ff80a0');
    // Checkpoints — green
    if (lvl.checkpoints) for (const c2 of lvl.checkpoints) if (c2) _dot(c2.x, c2.y, 3, '#40ff80');

    // ── Enemies ───────────────────────────────────────────────────
    // Bigger pixel for higher-tier foes (v=99 boss is a 5px square).
    if (lvl.enemies) {
      for (const en of lvl.enemies) {
        if (!en) continue;
        const isBoss = (en.v === 99);
        const big = isBoss || (en.elite === 'true' || en.elite === true);
        _dot(en.x, en.y, big ? 4.5 : 2.6, isBoss ? '#ff2080' : '#ff5040');
      }
    }

    // ── Start + goal markers ──────────────────────────────────────
    if (lvl.startX != null) {
      _dot(lvl.startX, (lvl.startY != null ? lvl.startY : 300), 3, '#ffffff');
    }
    if (lvl.goalX != null) {
      _dot(lvl.goalX, (lvl.goalY != null ? lvl.goalY : 300), 4, '#00ff80');
    }

    // Subtle vignette to push edges back
    const vg = c.createRadialGradient(boxW / 2, boxH / 2, boxW * 0.2, boxW / 2, boxH / 2, boxW * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = vg;
    c.fillRect(0, 0, boxW, boxH);
    c.restore();

    // Border (drawn in screen space so it stays crisp)
    c.save();
    c.translate(cx, cy);
    c.strokeStyle = focused ? (tint || '#fff') : 'rgba(255,255,255,0.25)';
    c.lineWidth = focused ? 2.5 : 1.5;
    // Project the four corners through the same transform we used
    const corners = [
      [-halfW, -halfH], [halfW, -halfH], [halfW, halfH], [-halfW, halfH],
    ].map(([x, y]) => ({
      // transform: x' = x + (-0.32) * y, y' = 0.18*x + 0.78*y
      x: x + (-0.32) * y,
      y: 0.18 * x + 0.78 * y,
    }));
    c.beginPath();
    c.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 4; i++) c.lineTo(corners[i].x, corners[i].y);
    c.closePath();
    c.stroke();
    c.restore();
  }

  // Lighten (f>0) or darken (f<0) a hex color by lerping toward
  // white / black. |f| is the blend amount 0..1.
  function _shade(hex, f) {
    try {
      let h = String(hex).replace('#', '');
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      let r = parseInt(h.slice(0, 2), 16);
      let g = parseInt(h.slice(2, 4), 16);
      let b = parseInt(h.slice(4, 6), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
      const t = f < 0 ? 0 : 255, a = Math.min(1, Math.abs(f));
      const hx = (v) => ('0' + (Math.max(0, Math.min(255, v | 0))).toString(16)).slice(-2);
      return '#' + hx(r + (t - r) * a) + hx(g + (t - g) * a) + hx(b + (t - b) * a);
    } catch (e) { return hex; }
  }

  // ── Pixel-art planet sprites ────────────────────────────────────
  // Each world renders as a chunky, hand-shaded pixel-art planet that
  // matches the game's 32-bit sprite look: a quantised sphere whose
  // surface features (continents, lava seas, ice caps, craters, city
  // lights, gas bands, crystal facets…) are picked per theme.
  const PLANET_PAL = {
    highland:  { body: ['#7fc0ec','#4e93d2','#2f6ba8','#1d4a7c','#102f54'], feat: 'terran', land: '#52a046' },
    forest:    { body: ['#3f7d72','#2f6a64','#1e463a','#102824','#0a1a17'], feat: 'terran', land: '#5aa048' },
    cherry:    { body: ['#f6a8d4','#d97ab0','#b25890','#7e3c68','#4e2444'], feat: 'terran', land: '#ffe2f1' },
    citadel:   { body: ['#9cc8ee','#5a8cc0','#3f6a9c','#2a4a72','#182f4c'], feat: 'terran', land: '#d8b87a' },
    heaven:    { body: ['#cfeaff','#94c6ec','#6aa6d8','#4a82b8','#315f8e'], feat: 'terran', land: '#ffffff' },
    coralreef: { body: ['#7fe8ef','#3fb6cf','#2a8aab','#1c6280','#103f55'], feat: 'terran', land: '#ff9a78' },
    volcanic:  { body: ['#7a4a40','#5a352c','#3a221a','#241410','#120806'], feat: 'lava', glow: '#ffd23a', glow2: '#ff5e1e' },
    frozen:    { body: ['#ffffff','#d4e9f6','#aecfe4','#86a8c8','#5c7c9c'], feat: 'ice', cap: '#ffffff', crack: '#7fa8cc' },
    desert:    { body: ['#f4d68e','#dcb066','#c08f4a','#946730','#5e4020'], feat: 'desert',
                 craters: [[-0.34,-0.22,0.20],[0.30,0.10,0.16],[0.05,0.40,0.13],[-0.20,0.30,0.10]] },
    cosmic:    { body: ['#a98ce6','#6a4ab0','#4e3490','#34226a','#1e1248'], feat: 'gas', stripe: '#c4a8f4', stripe2: '#3a2270' },
    shadow:    { body: ['#6a5a7e','#43354f','#2f253a','#1e1728','#100b18'], feat: 'rock',
                 craters: [[-0.28,-0.30,0.18],[0.32,-0.06,0.15],[-0.06,0.34,0.16],[0.18,0.34,0.10]] },
    crystal:   { body: ['#5a86d8','#2f4f9c','#223a78','#172a56','#0e1a38'], feat: 'crystal', facet1: '#c6ecff', facet2: '#6fb4e4' },
    cyber:     { body: ['#3a2e66','#241c44','#1a1432','#120d24','#0a0718'], feat: 'city', light1: '#ff5cd0', light2: '#5cf0e0' },
    steampunk: { body: ['#7a5638','#503824','#3a281a','#261a10','#150e08'], feat: 'city', light1: '#ffc24a', light2: '#ff8a3a' },
    blueprint: { body: ['#5a86d4','#3a60a8','#2c4a86','#1e3460','#122140'], feat: 'gas', stripe: '#9cc4f0', stripe2: '#223a6a' },
    haunted:   { body: ['#5a4a74','#37294c','#261c38','#181024','#0c0816'], feat: 'spooky', mist: '#9a86d0' },
    _locked:   { body: ['#8a90a0','#5e6470','#43474f','#2c2f36','#181a20'], feat: 'rock',
                 craters: [[-0.26,-0.24,0.17],[0.28,0.04,0.15],[0.0,0.36,0.14]] },
  };

  // Returns { color, shadeDelta } for one surface cell of a planet.
  function _planetSurface(cfg, nx, ny, nz, ph) {
    const f = cfg.feat;
    if (f === 'terran') {
      const v = Math.sin(nx * 3.1 + ph + 1.3) + Math.sin(ny * 2.7 - 0.6)
              + Math.sin((nx * 2 - ny * 3) + ph) * 0.8;
      if (v > 0.45) return { color: cfg.land, shadeDelta: 0.05 };
      return { color: null, shadeDelta: -0.02 };
    }
    if (f === 'lava') {
      const v = Math.sin(nx * 5 + ny * 4 + ph) + Math.sin(nx * 3 - ny * 6 + ph * 1.3);
      if (v > 1.05) return { color: cfg.glow, shadeDelta: 0.7 };
      if (v > 0.45) return { color: cfg.glow2, shadeDelta: 0.35 };
      return { color: null, shadeDelta: 0 };
    }
    if (f === 'ice') {
      if (Math.abs(ny) > 0.6) return { color: cfg.cap, shadeDelta: 0.08 };
      const v = Math.sin(nx * 7 + ph) + Math.sin(ny * 5 - nx * 3);
      if (v > 1.2) return { color: cfg.crack, shadeDelta: -0.12 };
      return { color: null, shadeDelta: 0 };
    }
    if (f === 'desert' || f === 'rock') {
      let sd = (f === 'desert') ? Math.sin(ny * 8 + nx * 2 + ph) * 0.06 : 0;
      const cr = cfg.craters || [];
      for (let i = 0; i < cr.length; i++) {
        const dd = Math.hypot(nx - cr[i][0], ny - cr[i][1]);
        if (dd < cr[i][2]) { sd -= 0.22; if (dd > cr[i][2] * 0.6) sd += 0.4; }
      }
      if (f === 'rock') sd += (Math.sin(nx * 6 + ny * 5) > 1.2 ? 0.08 : 0);
      return { color: null, shadeDelta: sd };
    }
    if (f === 'gas') {
      const band = Math.sin(ny * 9 + Math.sin(nx * 2 + ph) * 0.6);
      if (band > 0.4) return { color: cfg.stripe, shadeDelta: 0.06 };
      if (band < -0.4) return { color: cfg.stripe2, shadeDelta: -0.06 };
      return { color: null, shadeDelta: 0 };
    }
    if (f === 'city') {
      const gx = Math.sin(nx * 13 + ny * 3 + ph), gy2 = Math.sin(ny * 13 - nx * 5);
      if (gx > 0.82 && gy2 > 0.6) return { color: cfg.light1, shadeDelta: 0.85 };
      if (gx * gy2 > 0.6) return { color: cfg.light2, shadeDelta: 0.55 };
      return { color: null, shadeDelta: -0.05 };
    }
    if (f === 'crystal') {
      const v = Math.sin(nx * 5 + ny * 6 + ph) + Math.sin((nx - ny) * 7);
      if (v > 1.25) return { color: cfg.facet1, shadeDelta: 0.4 };
      if (v > 0.3) return { color: cfg.facet2, shadeDelta: 0.12 };
      return { color: null, shadeDelta: 0 };
    }
    if (f === 'spooky') {
      const v = Math.sin(nx * 4 + Math.sin(ny * 3 + ph) * 2) + Math.sin(ny * 5 - nx * 2);
      if (v > 1.0) return { color: cfg.mist, shadeDelta: 0.2 };
      return { color: null, shadeDelta: -0.03 };
    }
    return { color: null, shadeDelta: 0 };
  }

  // Draw a planet as a quantised pixel-art sphere sprite.
  function _drawPlanetSprite(c, cx, cy, r, themeKey, focused) {
    const cfg = PLANET_PAL[themeKey] || PLANET_PAL.highland;
    const GRID = 26;
    const cell = (r * 2) / GRID;
    const ph = tickCount * 0.01;
    // Light from top-left.
    const lx = -0.55, ly = -0.58, lz = 0.6;
    for (let gy = 0; gy < GRID; gy++) {
      const ny = (gy + 0.5) / GRID * 2 - 1;
      for (let gx = 0; gx < GRID; gx++) {
        const nx = (gx + 0.5) / GRID * 2 - 1;
        const d2 = nx * nx + ny * ny;
        if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2);
        const surf = _planetSurface(cfg, nx, ny, nz, ph);
        let light = nx * lx + ny * ly + nz * lz + surf.shadeDelta;
        if (d2 > 0.78) light -= (d2 - 0.78) * 1.7;   // limb darkening
        let band;
        if (light > 0.86) band = 0;
        else if (light > 0.56) band = 1;
        else if (light > 0.26) band = 2;
        else if (light > -0.04) band = 3;
        else band = 4;
        const col = surf.color ? _shade(surf.color, (1.5 - band) * 0.16) : cfg.body[band];
        c.fillStyle = col;
        c.fillRect(Math.floor(cx - r + gx * cell), Math.floor(cy - r + gy * cell),
          Math.ceil(cell) + 1, Math.ceil(cell) + 1);
      }
    }
  }

  // ── Pixel-art theme motifs ──────────────────────────────────────
  // Each entry is a list of [gridX, gridY, gridW, gridH, color] cells
  // forming a chunky pixel-art emblem. Drawn subtly onto planets /
  // galaxy cores to convey a world's theme without using emoji.
  const _MOTIFS = {
    highland:  [[-3,2,6,2,'#2e5a2a'],[-2,0,4,2,'#6a6f7e'],[-1,-2,2,2,'#8b90a0'],[-1,-2,2,1,'#eef3f8']],
    volcanic:  [[-3,2,6,2,'#3a1c12'],[-2,0,4,2,'#5e2a1a'],[-1,-2,2,2,'#6e3422'],[-1,-2,2,1,'#ff8a3a'],[-3,1,1,1,'#ff5424'],[3,0,1,1,'#ff5424']],
    frozen:    [[-2,2,4,1,'#8fb6d4'],[-1,-2,2,4,'#d8ecfb'],[-1,-2,2,1,'#ffffff'],[2,-1,1,1,'#ffffff'],[-3,0,1,1,'#ffffff']],
    forest:    [[-1,2,2,2,'#5a3a22'],[-3,0,6,2,'#2f6a34'],[-2,-2,4,2,'#3b7d3e'],[-1,-4,2,2,'#48954e']],
    cherry:    [[-1,2,2,2,'#5a3a30'],[-3,-1,6,3,'#ffaad6'],[-2,-3,4,2,'#ffc6e6'],[3,1,1,1,'#ffd4ea'],[-3,2,1,1,'#ffd4ea']],
    desert:    [[-4,2,8,2,'#e3bd76'],[-1,-2,2,4,'#3f8c4d'],[-3,-1,2,1,'#3f8c4d'],[-3,-2,1,1,'#3f8c4d'],[2,0,2,1,'#3f8c4d'],[3,-1,1,1,'#3f8c4d']],
    haunted:   [[-2,-3,4,5,'#cbc4ec'],[-2,2,1,1,'#cbc4ec'],[0,2,1,1,'#cbc4ec'],[-1,-1,1,1,'#2a1a3a'],[1,-1,1,1,'#2a1a3a']],
    shadow:    [[-2,-3,4,6,'#4a3a5e'],[0,-3,3,6,'#0a0512'],[3,-2,1,1,'#b89ce8'],[-3,2,1,1,'#b89ce8']],
    crystal:   [[-1,-3,2,1,'#c6ecff'],[-2,-2,4,2,'#a3dbf6'],[-3,0,6,1,'#84c4ea'],[-2,1,4,1,'#a3dbf6'],[-1,2,2,1,'#c6ecff']],
    citadel:   [[-2,-1,4,4,'#d0bd8e'],[-2,-2,1,1,'#d0bd8e'],[0,-2,1,1,'#d0bd8e'],[1,-2,1,1,'#d0bd8e'],[-1,1,2,2,'#5e4c32']],
    cyber:     [[-2,-2,4,4,'#2c1c4e'],[-1,-1,2,2,'#ff46cc'],[-3,-1,1,1,'#8af0e0'],[2,-1,1,1,'#8af0e0'],[-3,1,1,1,'#8af0e0'],[2,1,1,1,'#8af0e0']],
    coralreef: [[-1,1,2,2,'#3f8fae'],[-3,-1,2,2,'#ff8eb4'],[1,-2,2,3,'#ff8eb4'],[-1,-3,2,2,'#ffa6c4']],
    cosmic:    [[-1,-3,2,6,'#fff2a6'],[-3,-1,6,2,'#fff2a6'],[-1,-1,2,2,'#ffffff']],
    steampunk: [[-2,-2,4,4,'#c48e44'],[-1,-1,2,2,'#3c2c1a'],[-1,-3,1,1,'#c48e44'],[-1,2,1,1,'#c48e44'],[-3,-1,1,1,'#c48e44'],[2,-1,1,1,'#c48e44']],
    blueprint: [[-3,-3,6,1,'#9fd0ff'],[-3,2,6,1,'#9fd0ff'],[-3,-3,1,6,'#9fd0ff'],[2,-3,1,6,'#9fd0ff'],[-1,-1,2,2,'#9fd0ff']],
    heaven:    [[-2,-3,4,1,'#ffe6a0'],[-3,-1,6,2,'#ffffff'],[-2,1,5,1,'#e9eff8']],
    locked:    [[-1,-3,1,3,'#7a818e'],[1,-3,1,3,'#7a818e'],[-1,-3,3,1,'#7a818e'],[-2,0,4,3,'#aab0bc'],[-1,1,2,1,'#454a55']],
    // Galaxy (category) emblems
    og:         [[-3,0,6,3,'#f2d274'],[-3,-1,1,1,'#f2d274'],[-1,-1,1,1,'#f2d274'],[1,-1,1,1,'#f2d274'],[-1,1,2,2,'#7c5c22']],
    new:        [[-1,-3,2,6,'#ffffff'],[-3,-1,6,2,'#ffffff'],[-1,-1,2,2,'#e8c8ff']],
    expansion:  [[-1,-1,2,2,'#bff0ff'],[-3,-3,1,1,'#bff0ff'],[2,-3,1,1,'#bff0ff'],[-3,2,1,1,'#bff0ff'],[2,2,1,1,'#bff0ff']],
    generated:  [[-3,-3,6,6,'#ff9a7e'],[-2,-2,1,1,'#3a1a12'],[1,-2,1,1,'#3a1a12'],[-1,-1,1,1,'#3a1a12'],[-2,1,1,1,'#3a1a12'],[1,1,1,1,'#3a1a12']],
    tutorial:   [[-1,-3,1,6,'#9fd0ff'],[0,-3,3,2,'#c6e6ff'],[0,-1,2,1,'#c6e6ff']],
  };

  // Draw a pixel-art motif centered on (cx,cy). `u` is the pixel-cell
  // size; `alpha` controls how subtly it sits on the surface.
  function _drawPixelMotif(c, key, cx, cy, u, alpha) {
    const m = _MOTIFS[key];
    if (!m) return;
    c.save();
    c.globalAlpha = (alpha == null) ? 1 : alpha;
    for (let i = 0; i < m.length; i++) {
      const r = m[i];
      c.fillStyle = r[4];
      c.fillRect(Math.round(cx + r[0] * u), Math.round(cy + r[1] * u),
        Math.max(1, Math.round(r[2] * u)), Math.max(1, Math.round(r[3] * u)));
    }
    c.globalAlpha = 1;
    c.restore();
  }

  // Twinkling particles orbiting a focused planet / galaxy.
  function _drawFocusParticles(c, cx, cy, rad, color) {
    c.save();
    const N = 12;
    for (let i = 0; i < N; i++) {
      const t = tickCount * 0.012 + i * (Math.PI * 2 / N);
      const orbit = rad * (1.04 + 0.13 * Math.sin(tickCount * 0.05 + i));
      const px = cx + Math.cos(t) * orbit;
      const py = cy + Math.sin(t) * orbit * 0.55;
      const tw = Math.sin(tickCount * 0.1 + i * 1.7);
      c.globalAlpha = Math.max(0, 0.35 + tw * 0.5);
      c.fillStyle = (i % 3 === 0) ? '#ffffff' : color;
      const s = 1.5 + Math.max(0, tw) * 1.7;
      c.fillRect(px - s / 2, py - s / 2, s, s);
    }
    c.globalAlpha = 1;
    c.restore();
  }

  // ── Spiral galaxy (top-tier categories) ─────────────────────────
  // Distinct from the planet sphere: a tilted spiral disc with a
  // bright central bulge and two slowly-rotating dust arms. Reads
  // immediately as "a whole galaxy" vs the smaller world planets
  // that orbit inside one.
  function _drawGalaxyDisc(c, cx, cy, r, color, glow, motifKey, label, focused, seed) {
    const rotation = tickCount * 0.004 + (seed || 0) * 0.7;
    // ── Outer halo glow (focus-only) ───────────────────────────
    if (focused) {
      const g = c.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
      g.addColorStop(0, glow);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
    }
    // ── Faint tilted disc (the galactic plane) ──────────────────
    c.save();
    c.translate(cx, cy);
    c.rotate(rotation * 0.3);
    c.scale(1, 0.35);   // 3:1 tilt
    const disc = c.createRadialGradient(0, 0, 0, 0, 0, r * 1.2);
    disc.addColorStop(0, color + 'cc');
    disc.addColorStop(0.55, color + '55');
    disc.addColorStop(1, color + '00');
    c.fillStyle = disc;
    c.beginPath();
    c.arc(0, 0, r * 1.2, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // ── Spiral arms — 2 (or 3 if focused) ───────────────────────
    c.save();
    c.translate(cx, cy);
    c.rotate(rotation);
    c.scale(1, 0.35);
    const armCount = focused ? 3 : 2;
    const dustPerArm = focused ? 70 : 45;
    for (let arm = 0; arm < armCount; arm++) {
      const armStart = (arm / armCount) * Math.PI * 2;
      for (let i = 0; i < dustPerArm; i++) {
        const t = i / dustPerArm;
        // log spiral: r = a * e^(b*theta) — here we go theta = t * 4π,
        // and the dust radius scales linearly with t (cleaner read).
        const theta = armStart + t * Math.PI * 3.4;
        const rr = r * 0.12 + t * r * 1.1;
        // Per-dot wobble for organic look (seeded with arm + i)
        const wob = (Math.sin(i * 1.61 + arm * 2.3) * 0.5 + 0.5) * 6;
        const px = Math.cos(theta) * rr + Math.cos(theta + Math.PI / 2) * wob;
        const py = Math.sin(theta) * rr + Math.sin(theta + Math.PI / 2) * wob;
        const sz = Math.max(2, Math.round((1 - t * 0.6) * 3.4));
        // Two-tone dust: inner arms bright (white), mid color, outer
        // shaded — drawn as chunky pixels to match the sprite look.
        c.fillStyle = (t < 0.22) ? '#ffffff' : (t < 0.55 ? color : _shade(color, -0.25));
        c.globalAlpha = Math.max(0.18, (1 - t * 0.8));
        c.fillRect(Math.round(px - sz / 2), Math.round(py - sz / 2), sz, sz);
      }
    }
    // Scattered star dust (random points across the disc)
    for (let i = 0; i < 30; i++) {
      const ang = (i * 2.394) % (Math.PI * 2);
      const rd = ((i * 17) % 100) / 100 * r * 1.1;
      const px = Math.cos(ang) * rd;
      const py = Math.sin(ang) * rd;
      const tw = 0.4 + 0.6 * Math.sin(tickCount * 0.08 + i);
      c.fillStyle = '#ffffff';
      c.globalAlpha = tw * 0.7;
      c.fillRect(px | 0, py | 0, 1.4, 1.4);
    }
    c.globalAlpha = 1;
    c.restore();
    // ── Central bulge (bright core) ────────────────────────────
    const bulge = c.createRadialGradient(cx, cy, 0, cx, cy, r * 0.4);
    bulge.addColorStop(0, '#ffffff');
    bulge.addColorStop(0.3, color);
    bulge.addColorStop(0.7, color + '88');
    bulge.addColorStop(1, color + '00');
    c.fillStyle = bulge;
    c.fillRect(cx - r * 0.5, cy - r * 0.5, r, r);
    // Twinkling particles orbiting the focused galaxy.
    if (focused) _drawFocusParticles(c, cx, cy, r * 1.5, color);
    // Label below
    if (label) {
      c.save();
      c.font = "10px 'Press Start 2P', monospace";
      c.textAlign = 'center';
      c.fillStyle = focused ? color : '#888';
      c.fillText(label, cx, cy + r * 1.3 + 22);
      c.restore();
    }
  }

  // ── World planet (second-tier) ──────────────────────────────────
  // A detailed pixel-art planet sprite (see _drawPlanetSprite) with a
  // soft atmosphere halo, a pixel-segment orbiting ring and — when
  // focused — twinkling particles. Locked worlds render as a cold
  // grey cratered rock with a pixel padlock.
  function _drawCategoryPlanet(c, cx, cy, r, color, glow, themeKey, label, focused, locked) {
    const spin = tickCount * 0.006;
    // ── Atmosphere halo ────────────────────────────────────────
    const haloR = r * (focused ? 1.9 : 1.45);
    const halo = c.createRadialGradient(cx, cy, r * 0.82, cx, cy, haloR);
    halo.addColorStop(0, (locked ? '#3a3a44' : color) + (focused ? '70' : '34'));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = halo;
    c.fillRect(cx - haloR, cy - haloR, haloR * 2, haloR * 2);

    // Orbiting particles for the focused world.
    if (focused && !locked) _drawFocusParticles(c, cx, cy, r * 1.32, color);

    // ── Orbiting ring — chunky pixel segments, back half first ─
    const ringR = r * 1.5;
    const ringN = 30;
    const ps = Math.max(2, r * 0.07);
    const _ringSeg = (front) => {
      for (let i = 0; i < ringN; i++) {
        const a = (i / ringN) * Math.PI * 2 + spin * 0.6;
        if ((Math.sin(a) >= 0) !== front) continue;
        const rx = cx + Math.cos(a) * ringR;
        const ry = cy + Math.sin(a) * ringR * 0.3;
        c.globalAlpha = (front ? 0.95 : 0.4) * (focused ? 1 : 0.7);
        c.fillStyle = (locked ? '#5a5a66' : _shade(color, front ? 0.25 : -0.1));
        c.fillRect(Math.round(rx - ps / 2), Math.round(ry - ps / 2), Math.ceil(ps), Math.ceil(ps));
      }
      c.globalAlpha = 1;
    };
    _ringSeg(false);   // back of the ring — behind the planet

    // ── Pixel-art planet sprite ────────────────────────────────
    _drawPlanetSprite(c, cx, cy, r, locked ? '_locked' : themeKey, focused);

    _ringSeg(true);    // front of the ring — over the planet

    // ── Locked padlock overlay ─────────────────────────────────
    if (locked) _drawPixelMotif(c, 'locked', cx, cy - r * 0.05, r * 0.17, 0.95);

    // Label below
    if (label) {
      c.save();
      c.font = "10px 'Press Start 2P', monospace";
      c.textAlign = 'center';
      c.fillStyle = focused ? color : '#888';
      c.fillText(label, cx, cy + r + 22);
      c.restore();
    }
  }

  function _drawGalaxy(c) {
    _syncViewport(c);
    _drawBg(c);
    const cats = _collectCategories();
    if (cats.length === 0) {
      c.fillStyle = '#888';
      c.font = "11px 'Press Start 2P', monospace";
      c.textAlign = 'center';
      c.fillText('NO WORLDS AVAILABLE', VIEW_W / 2, VIEW_H / 2);
      return;
    }
    const list = (mode === 'category') ? cats : cats[gIdx].worlds;
    const N = list.length;
    // Orbit center sits ABOVE screen center so the focused entry
    // (which lives at the front-bottom of the orbit ellipse, angle
    // π/2) lands roughly in the screen's vertical middle. The
    // vertical squash factor is 0.45 — applied below — so the orbit
    // is pulled up by orbitR * 0.45 * 0.5 to compensate.
    const orbitR = _orbitR();
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2 - orbitR * 0.2;

    // Draw orbit ring
    c.strokeStyle = 'rgba(255,255,255,0.08)';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(cx, cy, orbitR * zoom, 0, Math.PI * 2);
    c.stroke();

    // Title chrome
    c.save();
    c.font = "14px 'Press Start 2P', monospace";
    c.textAlign = 'center';
    c.fillStyle = '#f5c518';
    c.fillText(mode === 'category' ? '— SELECT A GALAXY —' : ('— ' + cats[gIdx].name + ' —'), VIEW_W / 2, 50);
    c.font = "8px 'Press Start 2P', monospace";
    c.fillStyle = '#888';
    c.fillText('← →  cycle    ENTER  select    ESC  back', VIEW_W / 2, 76);
    c.restore();

    // Sun in center — bagpiper avatar standing on it (gives the
    // player a tangible "you are here" anchor)
    const sunR = Math.min(48, orbitR * 0.18);
    const sunG = c.createRadialGradient(cx, cy, 0, cx, cy, sunR * 2.2);
    sunG.addColorStop(0, 'rgba(255,220,140,0.45)');
    sunG.addColorStop(1, 'rgba(255,180,80,0)');
    c.fillStyle = sunG;
    c.fillRect(cx - sunR * 2.5, cy - sunR * 2.5, sunR * 5, sunR * 5);
    c.fillStyle = '#ffd460';
    c.beginPath();
    c.arc(cx, cy, sunR, 0, Math.PI * 2);
    c.fill();
    // Player avatar standing on the sun (anchored slightly above)
    try {
      if (typeof drawBagpiper32 === 'function') {
        drawBagpiper32(c, cx - 16, cy - sunR - 26, true, (tickCount >> 4) & 1, 0, 0, 0, (tickCount >> 3) % 4, 'neutral');
      }
    } catch (e) { }

    // Sort planets by depth so back ones render behind. Index list
    // tagged with depth for stable selection regardless of draw order.
    // The i-term is SUBTRACTED so a higher index sits to the RIGHT of
    // the focused planet — pressing → then visibly pulls the next
    // galaxy in from the right.
    const planets = [];
    for (let i = 0; i < N; i++) {
      const ang = gAng - (i * Math.PI * 2 / N);
      const depth = (Math.sin(ang) + 1) * 0.5;  // 0 (far) → 1 (near)
      planets.push({ i, ang, depth });
    }
    planets.sort((a, b) => a.depth - b.depth);

    // Draw each planet around the orbit.
    for (let k = 0; k < planets.length; k++) {
      const { i, ang, depth } = planets[k];
      const px = cx + Math.cos(ang) * orbitR * zoom;
      const py = cy + Math.sin(ang) * orbitR * zoom * 0.45;
      const focused = (mode === 'category') ? (i === gIdx) : (i === subIdx);
      // Diorama size scales with depth so back planets feel further away.
      const baseSize = Math.min(VIEW_W, VIEW_H) * 0.22;
      const size = (focused ? baseSize * 1.25 : baseSize * 0.82) * (0.7 + depth * 0.6);
      const alpha = 0.55 + depth * 0.45;
      c.globalAlpha = alpha;
      // Sphere radius — half the "size" so the planet looks like a
      // 3D ball rather than a tilted card.
      const r = size * 0.45;
      if (mode === 'category') {
        // Top-tier "galaxies" — spiral dust discs, distinct from
        // the spherical world-planets one tier in. The focused
        // entry's NAME is handled by the centered detail panel at
        // the bottom of the screen, so don't repeat it under the
        // galaxy itself.
        const cat = list[i];
        const gr = r * 1.25;
        _drawGalaxyDisc(c, px, py, gr, cat.color, cat.glow, cat.key, '', focused, i);
      } else {
        // Second-tier "worlds" — spherical planets orbiting inside
        // the selected galaxy. Name also handled by the bottom panel.
        const w = list[i].w;
        const access = _accessible(list[i].i + 1);
        const tint = access ? (w.borderColor || '#f5c518') : '#555';
        const glow = access ? ((w.color || '#f5c518') + '88') : '#22222288';
        const motifKey = _biomeForWorld(w);
        _drawCategoryPlanet(c, px, py, r, tint, glow, motifKey, '', focused, !access);
      }
      c.globalAlpha = 1;
    }

    // Detail panel for focused entry — bottom of screen, centered
    let focusedEntry = (mode === 'category') ? cats[gIdx] : list[subIdx];
    if (focusedEntry) {
      c.save();
      const panelY = VIEW_H - 90;
      c.fillStyle = 'rgba(8,4,22,0.66)';
      c.fillRect(0, panelY, VIEW_W, 90);
      c.strokeStyle = 'rgba(255,255,255,0.12)';
      c.strokeRect(0, panelY, VIEW_W, 90);
      c.font = "12px 'Press Start 2P', monospace";
      c.textAlign = 'center';
      const midX = VIEW_W / 2;
      if (mode === 'category') {
        c.fillStyle = focusedEntry.color;
        c.fillText(focusedEntry.name, midX, panelY + 28);
        c.font = "8px 'Press Start 2P', monospace";
        c.fillStyle = '#bbb';
        const ws = focusedEntry.worlds;
        const totalLevels = ws.reduce((a, x) => a + ((x.w && x.w.levels) ? x.w.levels.length : 0), 0);
        const totalStars = ws.reduce((a, x) => {
          if (!x.w || !x.w.levels) return a;
          const wi = x.i + 1;
          return a + x.w.levels.reduce((b, _, li) => b + (_stars()[wi + '-' + (li + 1)] || 0), 0);
        }, 0);
        c.fillText(ws.length + ' WORLD' + (ws.length !== 1 ? 'S' : '') + ' · ' + totalLevels + ' LEVELS', midX, panelY + 52);
        c.fillText('★ ' + totalStars + '/' + (totalLevels * 3), midX, panelY + 72);
      } else {
        const w = focusedEntry.w;
        const wIdx1 = focusedEntry.i + 1;
        const access = _accessible(wIdx1);
        const premium = !access && _isPremium(wIdx1);
        c.fillStyle = access ? (w.borderColor || '#f5c518') : (premium ? '#ffd76a' : '#444');
        c.fillText(w.name || '???', midX, panelY + 28);
        c.font = "8px 'Press Start 2P', monospace";
        if (access) {
          c.fillStyle = '#bbb';
          c.fillText(w.desc || '', midX, panelY + 52);
        } else if (premium) {
          // Premium world: show the price and the buy affordance.
          const p = _worldPrice(wIdx1) || {};
          const priceStr = '\u{1FA99}' + (p.coins || 0) + (p.embers ? '  \u{1F525}' + p.embers : '');
          if (_pendingBuyWorld === wIdx1 && _pendingBuyTimer > 0) {
            c.fillStyle = '#9bff9b';
            c.fillText('PRESS ENTER TO CONFIRM  ' + priceStr, midX, panelY + 52);
          } else if (_premiumBuyable(wIdx1)) {
            c.fillStyle = '#ffd76a';
            c.fillText('UNLOCK EARLY  ' + priceStr + '  (ENTER)', midX, panelY + 52);
          } else {
            c.fillStyle = '#c98';
            c.fillText('PREMIUM  ' + priceStr + '  — NOT ENOUGH', midX, panelY + 52);
          }
        } else {
          c.fillStyle = '#666';
          c.fillText('LOCKED — CLEAR THE PRIOR WORLD', midX, panelY + 52);
        }
        if (access && w.levels) {
          const tot = w.levels.length;
          const got = w.levels.reduce((a, _, li) => a + (_stars()[wIdx1 + '-' + (li + 1)] || 0), 0);
          c.fillText('★ ' + got + '/' + (tot * 3) + ' · ' + tot + ' LEVEL' + (tot !== 1 ? 'S' : ''), midX, panelY + 72);
        }
      }
      c.restore();
    }
  }

  // ── World view: draw ────────────────────────────────────────────
  function _drawWorldBg(c, theme) {
    // Two-tone "tilted plane" sky/ground split
    const ws = _worlds();
    const wd = ws[wIdx - 1];
    const sky = (wd && wd.color) || '#1a2a44';
    const ground1 = '#1a3a4a';
    const ground2 = '#0a1820';

    const horizon = VIEW_H * 0.4;
    const skyG = c.createLinearGradient(0, 0, 0, horizon);
    skyG.addColorStop(0, '#050218');
    skyG.addColorStop(1, sky);
    c.fillStyle = skyG;
    c.fillRect(0, 0, VIEW_W, horizon);

    // Tilted ground plane
    const gg = c.createLinearGradient(0, horizon, 0, VIEW_H);
    gg.addColorStop(0, ground1);
    gg.addColorStop(1, ground2);
    c.fillStyle = gg;
    c.fillRect(0, horizon, VIEW_W, VIEW_H - horizon);

    // Perspective grid — receding lines toward a vanishing point at the top
    c.strokeStyle = 'rgba(255,255,255,0.05)';
    c.lineWidth = 1;
    const stepX = Math.max(60, VIEW_W / 16);
    const cols = Math.ceil(VIEW_W / stepX) + 4;
    for (let i = -cols; i <= cols; i++) {
      const x0 = VIEW_W / 2 + i * stepX;
      c.beginPath();
      c.moveTo(VIEW_W / 2, horizon);
      c.lineTo(x0, VIEW_H);
      c.stroke();
    }
    // Horizontal scan lines
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      const y = horizon + (VIEW_H - horizon) * Math.pow(t, 1.6);
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(VIEW_W, y);
      c.stroke();
    }

    // Stars in the sky band (normalized → pixel)
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const sx = s.nx * VIEW_W, sy = s.ny * VIEW_H;
      if (sy > horizon) continue;
      const tw = 0.5 + 0.5 * Math.sin(tickCount * 0.05 + s.ph);
      c.fillStyle = 'rgba(255,255,255,' + (tw * 0.7).toFixed(2) + ')';
      c.fillRect(sx | 0, sy | 0, s.s, s.s);
    }
  }

  // ── 3D ISOMETRIC LEVEL RENDERER ─────────────────────────────────
  // Render a level as a true isometric scene: platforms become 3D
  // extruded blocks, pickups float as tokens, enemies are squat
  // upright sprites. The whole scene is laid out in level-world
  // space and projected via standard 2:1 iso.
  //
  // Iso axes (right-handed):
  //   +X →  right    (in iso: right & down)
  //   +Y →  up       (in iso: straight up)
  //   +Z →  forward  (in iso: left & down)
  //
  // Level coords (lx, ly) map to (worldX, -worldY) so the level's
  // y=0 sits at the top of the scene. We extrude platforms along Z.
  // Nudge a hex color's brightness + warmth by a signed amount
  // (~-1..1). Used to give every level diorama a faintly unique
  // palette even when two levels share a theme.
  function _jitterColor(hex, amt) {
    try {
      let h = String(hex).replace('#', '');
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      let r = parseInt(h.slice(0, 2), 16);
      let g = parseInt(h.slice(2, 4), 16);
      let b = parseInt(h.slice(4, 6), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
      const d = amt * 30;
      const cl = (v) => Math.max(0, Math.min(255, v | 0));
      const hx = (v) => ('0' + cl(v).toString(16)).slice(-2);
      return '#' + hx(r + d) + hx(g + d * 0.55) + hx(b - d * 0.4);
    } catch (e) { return hex; }
  }

  function _isoProject(wx, wy, wz, scale, ox, oy) {
    // 2:1 isometric (cos30 ≈ 0.866, sin30 = 0.5)
    return {
      x: ox + (wx - wz) * scale * 0.866,
      y: oy + (wx + wz) * scale * 0.5 - wy * scale,
    };
  }

  // Draw a 3D extruded box in iso. Top, front and right faces.
  // Faces are drawn in painter's-algorithm order (back→front).
  function _drawIsoBox(c, wx, wy, wz, dx, dy, dz, scale, ox, oy, colTop, colSide, colDark) {
    // 8 corners
    const P = (x, y, z) => _isoProject(x, y, z, scale, ox, oy);
    // Bottom-back-left (BBL)…
    const x0 = wx, x1 = wx + dx;
    const y0 = wy, y1 = wy + dy;
    const z0 = wz, z1 = wz + dz;
    // Top face corners (y1)
    const ttl = P(x0, y1, z0);  // top-back-left
    const ttr = P(x1, y1, z0);  // top-back-right
    const tbr = P(x1, y1, z1);  // top-front-right
    const tbl = P(x0, y1, z1);  // top-front-left
    // Bottom-front corners for side faces
    const fbl = P(x0, y0, z1);
    const fbr = P(x1, y0, z1);
    const rbr = P(x1, y0, z0);

    // Right face (lighter side facing +x)
    c.fillStyle = colSide;
    c.beginPath();
    c.moveTo(ttr.x, ttr.y);
    c.lineTo(tbr.x, tbr.y);
    c.lineTo(fbr.x, fbr.y);
    c.lineTo(rbr.x, rbr.y);
    c.closePath();
    c.fill();

    // Front face (darker side facing +z / toward viewer-front)
    c.fillStyle = colDark;
    c.beginPath();
    c.moveTo(tbl.x, tbl.y);
    c.lineTo(tbr.x, tbr.y);
    c.lineTo(fbr.x, fbr.y);
    c.lineTo(fbl.x, fbl.y);
    c.closePath();
    c.fill();

    // Top face (brightest)
    c.fillStyle = colTop;
    c.beginPath();
    c.moveTo(ttl.x, ttl.y);
    c.lineTo(ttr.x, ttr.y);
    c.lineTo(tbr.x, tbr.y);
    c.lineTo(tbl.x, tbl.y);
    c.closePath();
    c.fill();

    // Edge outline for that crisp pixel-art read
    c.strokeStyle = 'rgba(0,0,0,0.45)';
    c.lineWidth = 1;
    c.stroke();
  }

  // Small iso "token" (a flattened cylinder) for coins / embers /
  // power-ups. Just two stacked ellipses + edge.
  function _drawIsoToken(c, wx, wy, wz, scale, ox, oy, color, size) {
    const top = _isoProject(wx, wy + size * 0.5, wz, scale, ox, oy);
    const bot = _isoProject(wx, wy, wz, scale, ox, oy);
    const r = size * scale * 0.55;
    c.save();
    // Body
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(top.x, top.y, r, r * 0.5, 0, 0, Math.PI * 2);
    c.fill();
    // Side
    c.fillStyle = color;
    c.globalAlpha = 0.75;
    c.beginPath();
    c.moveTo(top.x - r, top.y);
    c.lineTo(top.x - r, bot.y);
    c.lineTo(top.x + r, bot.y);
    c.lineTo(top.x + r, top.y);
    c.fill();
    c.globalAlpha = 1;
    // Top highlight
    c.fillStyle = '#ffffff88';
    c.beginPath();
    c.ellipse(top.x - r * 0.3, top.y - r * 0.15, r * 0.4, r * 0.15, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // Tiny upright sprite (an enemy as a 3D pawn).
  function _drawIsoEnemyPawn(c, wx, wy, wz, scale, ox, oy, color, isBoss) {
    const base = _isoProject(wx, wy, wz, scale, ox, oy);
    const sz = (isBoss ? 24 : 14) * scale * 0.6;
    c.save();
    // Shadow disc
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.beginPath();
    c.ellipse(base.x, base.y, sz * 0.7, sz * 0.3, 0, 0, Math.PI * 2);
    c.fill();
    // Body — vertical rectangle with rounded top
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(base.x - sz * 0.5, base.y);
    c.lineTo(base.x - sz * 0.5, base.y - sz * 1.2);
    c.lineTo(base.x + sz * 0.5, base.y - sz * 1.2);
    c.lineTo(base.x + sz * 0.5, base.y);
    c.fill();
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(base.x, base.y - sz * 1.2, sz * 0.5, sz * 0.4, 0, 0, Math.PI * 2);
    c.fill();
    // Eye dots
    c.fillStyle = '#fff';
    c.fillRect(base.x - sz * 0.22, base.y - sz * 1.3, sz * 0.18, sz * 0.18);
    c.fillRect(base.x + sz * 0.04, base.y - sz * 1.3, sz * 0.18, sz * 0.18);
    c.fillStyle = '#000';
    c.fillRect(base.x - sz * 0.18, base.y - sz * 1.26, sz * 0.1, sz * 0.1);
    c.fillRect(base.x + sz * 0.08, base.y - sz * 1.26, sz * 0.1, sz * 0.1);
    // Boss aura
    if (isBoss) {
      c.strokeStyle = '#ff408088';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(base.x, base.y, sz * 0.9, sz * 0.4, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }

  // Friendly ally pawn — a little dog (Mackenzie), so a level with a
  // companion reads as "you'll have help here".
  function _drawIsoAllyPawn(c, wx, wz, scale, ox, oy, baseY) {
    const b = _isoProject(wx, baseY, wz, scale, ox, oy);
    const s = 15 * scale * 0.6;
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.beginPath(); c.ellipse(b.x, b.y, s * 0.85, s * 0.32, 0, 0, Math.PI * 2); c.fill();
    // body
    c.fillStyle = '#d8a878';
    c.beginPath(); c.ellipse(b.x, b.y - s * 0.55, s * 0.68, s * 0.5, 0, 0, Math.PI * 2); c.fill();
    // tail
    c.strokeStyle = '#d8a878'; c.lineWidth = s * 0.26; c.lineCap = 'round';
    c.beginPath(); c.moveTo(b.x - s * 0.52, b.y - s * 0.6); c.lineTo(b.x - s * 0.95, b.y - s * 1.05); c.stroke();
    // head
    c.fillStyle = '#e0b486';
    c.beginPath(); c.arc(b.x + s * 0.42, b.y - s * 1.08, s * 0.44, 0, Math.PI * 2); c.fill();
    // ear (floppy)
    c.fillStyle = '#a87850';
    c.beginPath(); c.ellipse(b.x + s * 0.2, b.y - s * 1.12, s * 0.2, s * 0.4, 0.3, 0, Math.PI * 2); c.fill();
    // snout
    c.fillStyle = '#f0d8b8';
    c.beginPath(); c.arc(b.x + s * 0.7, b.y - s * 0.94, s * 0.2, 0, Math.PI * 2); c.fill();
    // eye + nose
    c.fillStyle = '#1a1410';
    c.fillRect(b.x + s * 0.36, b.y - s * 1.2, s * 0.13, s * 0.13);
    c.beginPath(); c.arc(b.x + s * 0.84, b.y - s * 0.94, s * 0.11, 0, Math.PI * 2); c.fill();
    // friendly heart bubble
    c.fillStyle = '#ff7aa8';
    const hb = b.y - s * 1.85 - Math.sin(tickCount * 0.08) * 2;
    c.fillRect(b.x - s * 0.04, hb, s * 0.16, s * 0.16);
    c.restore();
  }

  // Hazard / ability prop renderers. Each draws a small recognisable
  // 3D object on the island surface at (wx,baseY,wz) so the diorama
  // previews what the level holds (spikes, springs, ice, grapple,
  // wind, magnet, lava).
  function _drawIsoSpikeProp(c, wx, wz, scale, ox, oy, baseY) {
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * 17;
      const bl = _isoProject(wx + o - 8, baseY, wz, scale, ox, oy);
      const br = _isoProject(wx + o + 8, baseY, wz, scale, ox, oy);
      const tp = _isoProject(wx + o, baseY + 40, wz, scale, ox, oy);
      c.fillStyle = '#c8ccd2';
      c.beginPath(); c.moveTo(bl.x, bl.y); c.lineTo(br.x, br.y); c.lineTo(tp.x, tp.y); c.closePath(); c.fill();
      c.fillStyle = '#888e96';
      c.beginPath();
      c.moveTo((bl.x + br.x) / 2, (bl.y + br.y) / 2); c.lineTo(br.x, br.y); c.lineTo(tp.x, tp.y);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();
    }
  }
  function _drawIsoSpringProp(c, wx, wz, scale, ox, oy, baseY) {
    _drawIsoBox(c, wx - 17, baseY, wz - 13, 34, 13, 26, scale, ox, oy, '#5ad8ff', '#2a8ab0', '#155a78');
    const top = _isoProject(wx, baseY + 13, wz, scale, ox, oy);
    const bob = (Math.sin(tickCount * 0.13) * 0.5 + 0.5) * 9;
    c.strokeStyle = '#cdf2ff'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < 2; i++) {
      const y = top.y - 13 - i * 12 - bob;
      c.beginPath();
      c.moveTo(top.x - 9, y + 6); c.lineTo(top.x, y); c.lineTo(top.x + 9, y + 6);
      c.stroke();
    }
  }
  function _drawIsoIceProp(c, wx, wz, scale, ox, oy, baseY) {
    const shards = [[0, 40, 9], [-13, 27, 7], [13, 29, 7]];
    for (let i = 0; i < shards.length; i++) {
      const o = shards[i][0], hgt = shards[i][1], wdt = shards[i][2];
      const bl = _isoProject(wx + o - wdt, baseY, wz, scale, ox, oy);
      const br = _isoProject(wx + o + wdt, baseY, wz, scale, ox, oy);
      const tp = _isoProject(wx + o, baseY + hgt, wz, scale, ox, oy);
      c.fillStyle = '#bfe8ff';
      c.beginPath(); c.moveTo(bl.x, bl.y); c.lineTo(tp.x, tp.y); c.lineTo(br.x, br.y); c.closePath(); c.fill();
      c.fillStyle = '#7fc0e8';
      c.beginPath();
      c.moveTo((bl.x + br.x) / 2, (bl.y + br.y) / 2); c.lineTo(br.x, br.y); c.lineTo(tp.x, tp.y);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; c.stroke();
    }
  }
  function _drawIsoGrappleProp(c, wx, wz, scale, ox, oy, baseY) {
    _drawIsoBox(c, wx - 4, baseY, wz - 4, 8, 46, 8, scale, ox, oy, '#9a7a44', '#6a5430', '#3a2c18');
    const top = _isoProject(wx, baseY + 52, wz, scale, ox, oy);
    c.strokeStyle = '#e8c860'; c.lineWidth = 3.4; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(top.x, top.y - 4);
    c.arc(top.x + 7, top.y, 7, Math.PI, Math.PI * 0.25, false);
    c.stroke();
  }
  function _drawIsoWindProp(c, wx, wz, scale, ox, oy, baseY) {
    const cen = _isoProject(wx, baseY + 32, wz, scale, ox, oy);
    c.strokeStyle = '#cfe8ff'; c.lineWidth = 2.6; c.lineCap = 'round';
    const rot = tickCount * 0.06;
    for (let i = 0; i < 3; i++) {
      c.globalAlpha = 0.85 - i * 0.22;
      c.beginPath();
      c.arc(cen.x, cen.y, 7 + i * 7, rot + i, rot + i + Math.PI * 1.25);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  function _drawIsoMagnetProp(c, wx, wz, scale, ox, oy, baseY) {
    const p = _isoProject(wx, baseY + 40 + Math.sin(tickCount * 0.06) * 5, wz, scale, ox, oy);
    const g = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 17);
    g.addColorStop(0, '#ffaad8'); g.addColorStop(1, '#ff408000');
    c.fillStyle = g;
    c.beginPath(); c.arc(p.x, p.y, 17, 0, Math.PI * 2); c.fill();
    // horseshoe magnet
    c.strokeStyle = '#e8506a'; c.lineWidth = 5;
    c.beginPath(); c.arc(p.x, p.y - 1, 7, Math.PI, 0, false); c.stroke();
    c.lineWidth = 5; c.lineCap = 'butt';
    c.beginPath();
    c.moveTo(p.x - 7, p.y - 1); c.lineTo(p.x - 7, p.y + 6);
    c.moveTo(p.x + 7, p.y - 1); c.lineTo(p.x + 7, p.y + 6);
    c.stroke();
    c.fillStyle = '#dfe4ea';
    c.fillRect(p.x - 9, p.y + 5, 4, 3);
    c.fillRect(p.x + 5, p.y + 5, 4, 3);
  }
  function _drawIsoLavaProp(c, wx, wz, scale, ox, oy, baseY) {
    const p = _isoProject(wx, baseY + 2, wz, scale, ox, oy);
    const rr = 24 * scale * 0.7;
    c.save();
    c.fillStyle = '#ff5020';
    c.beginPath(); c.ellipse(p.x, p.y, rr, rr * 0.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd060';
    c.globalAlpha = 0.4 + 0.3 * Math.sin(tickCount * 0.12);
    c.beginPath(); c.ellipse(p.x, p.y, rr * 0.55, rr * 0.27, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
    const bb = Math.abs(Math.sin(tickCount * 0.09));
    c.fillStyle = '#ff8030';
    c.beginPath(); c.arc(p.x + rr * 0.25, p.y - 2 - bb * 7, 2.6, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  // ── Per-level deterministic RNG ─────────────────────────────────
  // A small Mulberry32 PRNG seeded from (worldIdx, levelIdx) so each
  // diorama is unique but stable across renders. The same level
  // always looks the same; neighbouring levels look obviously
  // different.
  function _seedRng(w, l) {
    let s = ((w | 0) * 73856093 ^ (l | 0) * 19349663 ^ ((w | 0) + 1) * 83492791) >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── Iconic 3D level diorama ─────────────────────────────────────
  // The diorama is built from a per-level *spec* (driven by the
  // level's own data + a deterministic seed) so every level reads
  // differently. We vary:
  //   • Island silhouette: square, long, narrow, terraced, peak
  //   • Riser layout:      pillar, tower, staircase, scatter, twin
  //   • Riser count:       scales with platform count (1..5)
  //   • Featured platform type → colors + accent feature
  //   • Enemy count + tier  (0..3 pawns, boss inflates one)
  //   • Token set           — only what the level actually has
  //   • Sky decoration     — petals / snow / embers / starfield
  //   • Camera yaw          — small per-level rotation so the
  //                           silhouette reads from a fresh angle
  function _draw3DLevelScene(c, lvl, cx, cy, w, h, focused, wIdx1, lvlIdx0, opts) {
    if (!lvl) return;
    opts = opts || {};
    const inWorld = !!opts.inWorld;
    c.save();
    // When rendering as a worldmap island we skip the rectangular
    // frame entirely so the diorama floats in the overworld with no
    // blue square behind it. Standalone callers (e.g. the legacy
    // showcase) still get the framed view.
    if (!inWorld) {
      c.beginPath();
      c.rect(cx - w / 2, cy - h / 2, w, h);
      c.clip();
    }

    // ── 1. Build the per-level spec ────────────────────────────
    const rng = _seedRng(wIdx1 || 1, lvlIdx0 || 0);
    const nPlats = (lvl.platforms || []).length;
    const nEnemies = (lvl.enemies || []).length;
    const nCoins = (lvl.coins || []).length;
    const nEmbers = (lvl.spiritEmbers || []).length;
    const nPows = (lvl.powerupItems || []).length;
    const nTrop = (lvl.trophies || []).length;
    const hasBoss = (lvl.enemies || []).some(e => e && e.v === 99);
    const hasElite = (lvl.enemies || []).some(e => e && (e.elite === 'true' || e.elite === true));

    // Featured special platform type (drives a single accent block)
    let feature = null;
    if (lvl.platforms) {
      for (const p of lvl.platforms) {
        if (!p || !p.type || p.type === 'ground') continue;
        if (['ice', 'lava', 'bounce', 'magnetic', 'grapplehook', 'soundwave', 'spike'].indexOf(p.type) >= 0) {
          feature = p.type; break;
        }
      }
    }

    // Island silhouette — one of 8 archetypes. Level shape biases the
    // pick, but the seed always gets a say so two same-shaped levels
    // still read differently.
    const lvW = lvl.width || 2400, lvH = lvl.height || 560;
    let silhouette;
    if (lvW > lvH * 4) silhouette = (rng() < 0.6) ? 'long' : 'plateau';
    else if (lvH > 700) silhouette = (rng() < 0.6) ? 'peak' : 'spire';
    else if (nPlats > 20) silhouette = (rng() < 0.6) ? 'terraced' : 'square';
    else if (nPlats < 8) silhouette = (rng() < 0.6) ? 'narrow' : 'twin';
    else silhouette = ['square', 'twin', 'terraced', 'narrow', 'long', 'peak', 'plateau', 'spire'][(rng() * 8) | 0];

    // Riser layout pattern — seven variants, picked by seed
    const layouts = ['pillar', 'tower', 'staircase', 'scatter', 'twin', 'arch', 'ring'];
    const layoutKey = layouts[(rng() * layouts.length) | 0];
    const riserCount = Math.max(1, Math.min(5, Math.round(nPlats / 4)));

    // ── 2. Sky / background ────────────────────────────────────
    // In-world islands skip the background rectangle so the overworld
    // shows through behind them — no blue squares around the islands.
    if (!inWorld) {
      const bgTop = (lvl.bgColors && lvl.bgColors[0]) || '#0a0530';
      const bgBot = (lvl.bgColors && lvl.bgColors[1]) || '#1a1040';
      const skyG = c.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
      skyG.addColorStop(0, bgTop);
      skyG.addColorStop(1, bgBot);
      c.fillStyle = skyG;
      c.fillRect(cx - w / 2, cy - h / 2, w, h);

      // Stars: cosmic levels + a faint scattering anywhere with skyStars
      if (lvl.skyStars) {
        c.fillStyle = '#ffffff';
        const starCount = 18 + ((rng() * 18) | 0);
        for (let i = 0; i < starCount; i++) {
          const sx = (cx - w / 2) + ((i * 173 + (rng() * 100 | 0)) % w);
          const sy = (cy - h / 2) + ((i * 97 + (rng() * 50 | 0)) % (h * 0.55));
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(tickCount * 0.04 + i));
          c.globalAlpha = tw * 0.7;
          c.fillRect(sx, sy, 1.5, 1.5);
        }
        c.globalAlpha = 1;
      }
    } else {
      // Still pull the per-level RNG forward so the seed sequence
      // matches the standalone path — keeps risers/layout identical.
      if (lvl.skyStars) {
        const starCount = 18 + ((rng() * 18) | 0);
        for (let i = 0; i < starCount; i++) { rng(); rng(); }
      }
    }

    // ── 3. Sky decoration — falling theme particles ─────────────
    // Determine particle style by theme/weather. Each level gets a
    // unique drift pattern via the seed.
    const theme = lvl.theme || lvl._bgTheme || '';
    const weather = lvl.weather || '';
    let particle = null;
    if (theme === 'cherry') particle = { color: '#ffb0d8', count: 14, shape: 'petal' };
    else if (theme === 'forest') particle = { color: '#88ff88', count: 10, shape: 'leaf' };
    else if (theme === 'volcanic' || theme === 'inferno') particle = { color: '#ff7040', count: 16, shape: 'ember' };
    else if (theme === 'frozen' || theme === 'frost' || weather === 'snow') particle = { color: '#ddeeff', count: 18, shape: 'snow' };
    else if (theme === 'desert' || theme === 'dune') particle = { color: '#ffd080', count: 10, shape: 'dust' };
    else if (theme === 'cosmic' || theme === 'cyber') particle = { color: '#a080ff', count: 12, shape: 'spark' };
    else if (theme === 'shadow' || theme === 'haunted') particle = { color: '#9988ff', count: 8, shape: 'wisp' };
    else if (theme === 'coralreef' || theme === 'ocean') particle = { color: '#80c8ff', count: 12, shape: 'bubble' };
    if (particle && !inWorld) {
      for (let i = 0; i < particle.count; i++) {
        const baseX = (cx - w / 2) + (rng() * w);
        const speed = 0.3 + rng() * 1.0;
        const fall = (tickCount * speed + i * 23) % (h + 30);
        const px = baseX + Math.sin(tickCount * 0.02 + i) * 8;
        const py = (cy - h / 2) - 15 + fall;
        c.fillStyle = particle.color;
        c.globalAlpha = 0.55 + 0.4 * Math.sin(tickCount * 0.05 + i);
        if (particle.shape === 'petal' || particle.shape === 'leaf' || particle.shape === 'dust') {
          c.beginPath();
          c.ellipse(px, py, 3, 1.5, (tickCount * 0.01 + i) % Math.PI, 0, Math.PI * 2);
          c.fill();
        } else if (particle.shape === 'snow' || particle.shape === 'spark' || particle.shape === 'bubble') {
          c.beginPath();
          c.arc(px, py, particle.shape === 'spark' ? 1.3 : 2, 0, Math.PI * 2);
          c.fill();
        } else if (particle.shape === 'ember') {
          c.fillRect(px - 1, py - 1, 2, 2);
        } else if (particle.shape === 'wisp') {
          c.beginPath();
          c.ellipse(px, py, 6, 2, (tickCount * 0.02 + i) % Math.PI, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.globalAlpha = 1;
    }

    // ── 4. Island dimensions by silhouette ─────────────────────
    // Numbers are in arbitrary "world units" used by the iso projection.
    let iW = 200, iD = 200, iH = 32;
    if (silhouette === 'long') { iW = 280; iD = 130; iH = 28; }
    else if (silhouette === 'narrow') { iW = 130; iD = 280; iH = 30; }
    else if (silhouette === 'peak') { iW = 180; iD = 180; iH = 80; }
    else if (silhouette === 'terraced') { iW = 220; iD = 220; iH = 36; }
    else if (silhouette === 'twin') { iW = 240; iD = 160; iH = 30; }
    else if (silhouette === 'plateau') { iW = 300; iD = 175; iH = 20; }
    else if (silhouette === 'spire') { iW = 122; iD = 122; iH = 116; }
    // else 'square' → defaults
    // Per-level aspect jitter — ±13% so no two footprints are identical.
    iW *= 0.87 + rng() * 0.26;
    iD *= 0.87 + rng() * 0.26;
    iH *= 0.9 + rng() * 0.2;

    // Iso projection — scale to fit the box
    const slabW = (iW + iD) * 0.866 + 40;
    const slabH = (iW + iD) * 0.5 + iH + 140;
    const scale = Math.min(w / slabW, h / slabH) * 0.85;
    const ox = cx;
    const oy = cy + iH * scale * 0.5;

    // Per-level camera tilt — a small 2D rotation so every diorama is
    // viewed from its own slightly different angle. Paired with the
    // outer c.save()/c.restore() so it's automatically undone.
    const diTilt = (rng() - 0.5) * 0.22;
    c.translate(ox, oy);
    c.rotate(diTilt);
    c.translate(-ox, -oy);

    // ── 5. Theme colors ────────────────────────────────────────
    // Each level nudges its base palette by a unique seeded amount so
    // two same-theme levels never render with an identical island.
    const colJit = (rng() - 0.5) * 1.1;
    const platTop = _jitterColor((lvl.platColors && lvl.platColors[4]) || '#bbb', colJit);
    const platMid = _jitterColor((lvl.platColors && lvl.platColors[3]) || '#666', colJit);
    const platDark = _jitterColor((lvl.platColors && lvl.platColors[1]) || '#222', colJit);
    const accent = lvl.accentColor || '#ffd54a';
    const accent2 = lvl.accentColor2 || accent;

    // ── 6. Island base ─────────────────────────────────────────
    _drawIsoBox(c, -iW / 2, 0, -iD / 2, iW, iH, iD, scale, ox, oy, platTop, platMid, platDark);

    // Terraced silhouette: a slightly taller second tier on top.
    if (silhouette === 'terraced') {
      const t2W = iW * 0.55, t2D = iD * 0.55, t2H = 18;
      _drawIsoBox(c, -t2W / 2 - 16, iH, -t2D / 2 + 12, t2W, t2H, t2D, scale, ox, oy, platTop, platMid, platDark);
    }
    // Peak silhouette: a pointy stepped pyramid base (3 stacked layers).
    if (silhouette === 'peak') {
      _drawIsoBox(c, -iW * 0.36, iH, -iD * 0.36, iW * 0.72, iH * 0.6, iD * 0.72, scale, ox, oy, platTop, platMid, platDark);
      _drawIsoBox(c, -iW * 0.22, iH * 1.6, -iD * 0.22, iW * 0.44, iH * 0.5, iD * 0.44, scale, ox, oy, platTop, platMid, platDark);
    }

    // Surface decoration tufts — color + density per theme
    const tuftCount = (theme === 'highland' || theme === 'forest' || theme === 'cherry') ? 12 : (theme === 'frozen' || theme === 'frost') ? 8 : 6;
    for (let i = 0; i < tuftCount; i++) {
      const tx = -iW / 2 + rng() * iW;
      const tz = -iD / 2 + rng() * iD;
      const top = _isoProject(tx, iH, tz, scale, ox, oy);
      c.fillStyle = (i % 2 ? accent : accent2) + '99';
      c.beginPath();
      c.ellipse(top.x, top.y, 3 + rng() * 2, 1.5, 0, 0, Math.PI * 2);
      c.fill();
    }

    // Compute the highest top-Y so we know where to plant the flag
    const baseTopY = (silhouette === 'peak') ? iH * 1.6 + iH * 0.5 : (silhouette === 'terraced' ? iH + 18 : iH);
    const items = [];

    // ── 7. LEVEL SCENE — a 3D vignette of what the level holds ──
    // Rather than abstract blocks, the diorama stages the level's
    // actual cast on the themed island: enemy & boss pawns, a dog
    // ally when one is present, and recognisable 3D props for every
    // hazard / ability the level uses (spikes, springs, ice, grapple
    // posts, wind swirls, magnets, lava) plus its collectibles. One
    // glance at the island previews what you're walking into.

    // What's in the level?
    const enemiesArr = (lvl.enemies || []).filter(e => e && typeof e.x === 'number');
    const bossN = enemiesArr.filter(e => e.v === 99).length;
    const normN = enemiesArr.length - bossN;
    const hasAlly = !!(lvl.allies && lvl.allies.length);
    const platTypes = {};
    for (const p of (lvl.platforms || [])) {
      if (p && p.type && p.type !== 'ground') platTypes[p.type] = true;
    }
    const hasSpikes  = (lvl.spikes  || []).length > 0;
    const hasBounceP = (lvl.bounces || []).length > 0 || !!platTypes.bounce;

    // Prioritised prop list — the cast first (boss / enemies / ally),
    // then hazard & ability props, then collectible tokens.
    const sceneProps = [];
    if (bossN > 0) sceneProps.push({ kind: 'boss' });
    for (let i = 0; i < Math.min(3, normN); i++) {
      sceneProps.push({ kind: 'enemy', elite: hasElite && i === 0 });
    }
    if (hasAlly) sceneProps.push({ kind: 'ally' });
    if (hasSpikes)             sceneProps.push({ kind: 'spikes' });
    if (hasBounceP)            sceneProps.push({ kind: 'spring' });
    if (platTypes.ice)         sceneProps.push({ kind: 'ice' });
    if (platTypes.lava)        sceneProps.push({ kind: 'lava' });
    if (platTypes.grapplehook) sceneProps.push({ kind: 'grapple' });
    if (platTypes.windtunnel)  sceneProps.push({ kind: 'wind' });
    if (platTypes.magnetic)    sceneProps.push({ kind: 'magnet' });
    if (nCoins  > 0) sceneProps.push({ kind: 'token', color: '#f5d020', size: 14 });
    if (nEmbers > 0) sceneProps.push({ kind: 'token', color: '#80f0ff', size: 18 });
    if (nPows   > 0) sceneProps.push({ kind: 'token', color: '#c060ff', size: 20 });
    if (nTrop   > 0) sceneProps.push({ kind: 'token', color: '#ffe060', size: 22 });

    // Surface slots — spread across the island top so props don't
    // overlap; the goal flag owns the back of the island.
    const SLOTS = [
      { x: -0.30, z: -0.06 }, { x: 0.04, z: -0.16 }, { x: 0.32, z: -0.04 },
      { x: -0.34, z:  0.22 }, { x: 0.00, z:  0.14 }, { x: 0.34, z:  0.20 },
      { x: -0.16, z:  0.40 }, { x: 0.22, z:  0.42 },
    ];

    // ── 8. Goal flag — at the back of the island ───────────────
    items.push({
      depth: -iD * 0.34 - 50,
      draw: () => {
        const fz = -iD * 0.34, fx = 0;
        const top = _isoProject(fx, baseTopY + 66, fz, scale, ox, oy);
        const bot = _isoProject(fx, baseTopY,      fz, scale, ox, oy);
        c.strokeStyle = '#fff'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(bot.x, bot.y); c.lineTo(top.x, top.y); c.stroke();
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(top.x, top.y, 2.5, 0, Math.PI * 2); c.fill();
        const wave = Math.sin(tickCount * 0.12) * 4;
        c.fillStyle = accent;
        c.beginPath();
        c.moveTo(top.x, top.y);
        c.lineTo(top.x + 22 + wave, top.y + 8);
        c.lineTo(top.x, top.y + 16);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.stroke();
      },
    });

    // ── 9. Stage every prop into a slot ────────────────────────
    for (let i = 0; i < sceneProps.length && i < SLOTS.length; i++) {
      const prop = sceneProps[i];
      const px = SLOTS[i].x * iW;
      const pz = SLOTS[i].z * iD;
      const depth = px + pz + 100;
      if (prop.kind === 'boss') {
        items.push({ depth: depth + 40, draw: () => _drawIsoEnemyPawn(c, px, baseTopY, pz, scale, ox, oy, '#ff2080', true) });
      } else if (prop.kind === 'enemy') {
        const ecol = prop.elite ? '#ffa030' : '#ff5040';
        items.push({ depth: depth, draw: () => _drawIsoEnemyPawn(c, px, baseTopY, pz, scale, ox, oy, ecol, false) });
      } else if (prop.kind === 'ally') {
        items.push({ depth: depth, draw: () => _drawIsoAllyPawn(c, px, pz, scale, ox, oy, baseTopY) });
      } else if (prop.kind === 'spikes') {
        items.push({ depth: depth, draw: () => _drawIsoSpikeProp(c, px, pz, scale, ox, oy, baseTopY) });
      } else if (prop.kind === 'spring') {
        items.push({ depth: depth, draw: () => _drawIsoSpringProp(c, px, pz, scale, ox, oy, baseTopY) });
      } else if (prop.kind === 'ice') {
        items.push({ depth: depth, draw: () => _drawIsoIceProp(c, px, pz, scale, ox, oy, baseTopY) });
      } else if (prop.kind === 'lava') {
        items.push({ depth: depth - 60, draw: () => _drawIsoLavaProp(c, px, pz, scale, ox, oy, baseTopY) });
      } else if (prop.kind === 'grapple') {
        items.push({ depth: depth, draw: () => _drawIsoGrappleProp(c, px, pz, scale, ox, oy, baseTopY) });
      } else if (prop.kind === 'wind') {
        items.push({ depth: depth, draw: () => _drawIsoWindProp(c, px, pz, scale, ox, oy, baseTopY) });
      } else if (prop.kind === 'magnet') {
        items.push({ depth: depth + 200, draw: () => _drawIsoMagnetProp(c, px, pz, scale, ox, oy, baseTopY) });
      } else if (prop.kind === 'token') {
        const pc = prop.color, ps = prop.size, pi = i;
        items.push({
          depth: depth + 500,
          draw: () => {
            const fl = Math.sin(tickCount * 0.08 + pi) * 4;
            _drawIsoToken(c, px, baseTopY + 44 + fl, pz, scale, ox, oy, pc, ps);
          },
        });
      }
    }

    // Paint back-to-front
    items.sort((a, b) => a.depth - b.depth);
    for (const it of items) it.draw();

    c.restore();
  }

  function _drawNodes(c) {
    // (Legacy stub — the new world view no longer uses node pads.
    //  Kept here so any external caller from older builds doesn't crash.)
    const ws = _worlds();
    const wd = ws[wIdx - 1];
    if (!wd) return;
    const unlocked = _unlocked(wIdx);
    const unlockAll = (function () { try { return localStorage.getItem('pogl_unlock_all') === '1'; } catch (e) { return false; } })();

    // Path connecting nodes
    if (nodes.length > 1) {
      c.save();
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 4;
      c.setLineDash([8, 6]);
      c.beginPath();
      c.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < nodes.length; i++) {
        // Quadratic curve via midpoint for a smoother snake
        const mx = (nodes[i - 1].x + nodes[i].x) / 2;
        const my = (nodes[i - 1].y + nodes[i].y) / 2 - 12;
        c.quadraticCurveTo(mx, my, nodes[i].x, nodes[i].y);
      }
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }

    // Nodes — each pad is a pixel diorama of that specific level
    const nodeSize = Math.min(VIEW_W, VIEW_H) * 0.16;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const locked = !unlockAll && i >= unlocked;
      const stars = _stars()[wIdx + '-' + (i + 1)] || 0;
      const focus = (i === hover);
      const baseColor = locked ? '#444' : (wd.borderColor || '#f5c518');
      const lvl = wd.levels && wd.levels[i];
      // Ground shadow
      c.save();
      c.translate(n.x, n.y + nodeSize * 0.35);
      c.scale(1, 0.32);
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.beginPath();
      c.arc(0, 0, nodeSize * 0.55, 0, Math.PI * 2);
      c.fill();
      c.restore();
      // Diorama
      if (locked) {
        // Locked pads stay generic — don't spoil what the level looks like.
        c.save();
        c.translate(n.x, n.y);
        c.fillStyle = '#1a1a2a';
        c.fillRect(-nodeSize * 0.4, -nodeSize * 0.3, nodeSize * 0.8, nodeSize * 0.6);
        c.strokeStyle = '#333';
        c.lineWidth = 2;
        c.strokeRect(-nodeSize * 0.4, -nodeSize * 0.3, nodeSize * 0.8, nodeSize * 0.6);
        c.font = (nodeSize * 0.4 | 0) + 'px serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('🔒', 0, 2);
        c.restore();
      } else {
        _drawLevelDiorama(c, n.x, n.y, nodeSize, lvl, baseColor, focus);
      }
      // Label
      c.save();
      c.textAlign = 'center';
      c.font = "8px 'Press Start 2P', monospace";
      c.fillStyle = locked ? '#666' : baseColor;
      c.fillText(locked ? '???' : ('W' + wIdx + '-' + (i + 1)), n.x, n.y + nodeSize * 0.55);
      // Star count
      c.font = "7px 'Press Start 2P', monospace";
      c.fillStyle = locked ? '#444' : '#f5c518';
      c.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), n.x, n.y - nodeSize * 0.55);
      // Name under (only on hover)
      if (focus && !locked) {
        c.font = "8px 'Press Start 2P', monospace";
        c.fillStyle = '#fff';
        const nm = (n.name || '').substring(0, 28);
        c.fillText(nm, n.x, n.y + nodeSize * 0.55 + 16);
      }
      c.restore();
    }
  }

  function _drawAvatar(c) {
    try {
      if (typeof drawBagpiper32 !== 'function') return;
      // 32×32 sprite, anchor feet roughly at avatar.y
      const ox = (avatar.x - 16) | 0;
      const oy = (avatar.y - 24) | 0;
      // Subtle shadow disk on the ground beneath the feet
      c.save();
      c.translate(avatar.x, avatar.y + 6);
      c.scale(1, 0.4);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.beginPath();
      c.arc(0, 0, 10, 0, Math.PI * 2);
      c.fill();
      c.restore();
      const moving = (Math.abs(avatar.vx) > 0.05 || Math.abs(avatar.vy) > 0.05);
      const walkFrame = moving ? ((tickCount >> 2) % 4) : 0;
      drawBagpiper32(c, ox, oy, avatar.facing > 0, (tickCount >> 4) & 1, 0, 0, 0, walkFrame, 'neutral');
    } catch (e) { }
  }

  // ── World view (level showcase) ─────────────────────────────────
  // Renders the focused level as a big 3D iso scene in the upper
  // portion of the screen, with a flanking pair of smaller previews
  // (prev / next level) at the sides. The avatar walks on a 3D
  // ground plane in the foreground. ←/→ cycle the focus level; the
  // current selection slides in horizontally for a smooth transition.
  // ── World view: draw (free-walk overworld) ──────────────────────
  // Camera-follow 3D space. Each level is an island floating in
  // world units; we transform island world coords → screen coords
  // via (wx - cameraX + VIEW_W/2, wy - cameraY + VIEW_H/2). Islands
  // are depth-sorted by world Y so closer ones overlap the ones
  // behind them. The avatar gets the same transform.
  function _drawWorld(c) {
    _syncViewport(c);
    _drawOverworldBg(c);
    const ws = _worlds();
    const wd = ws[wIdx - 1] || {};
    const editOn = (typeof isLocalEditMode === 'function') ? isLocalEditMode() : false;

    const unlocked = _unlocked(wIdx);
    const unlockAll = (function () { try { return localStorage.getItem('pogl_unlock_all') === '1'; } catch (e) { return false; } })();
    const lvlAccessible = (i) => unlockAll || i < unlocked;

    // ── World-to-screen transform ──────────────────────────────
    const camX = cameraX - VIEW_W / 2;
    const camY = cameraY - VIEW_H / 2;
    const s2w = (wx, wy) => ({ x: wx - camX, y: wy - camY });

    // ── Themed stepping-stone path between consecutive islands ──
    // Stones use the biome's pathStone color so the trail blends
    // into the environment (cobblestone for highland, lily pads for
    // coral, lava-tile for volcanic, etc.).
    const biome = activeBiome || _biome(wd);
    if (islands.length > 1) {
      c.save();
      const stoneCol = biome.pathStone || '#cccccc';
      // Generate stone positions along each segment
      for (let i = 1; i < islands.length; i++) {
        const a = islands[i - 1], b = islands[i];
        const dxn = b.wx - a.wx, dyn = b.wy - a.wy;
        const seg = Math.hypot(dxn, dyn);
        const stones = Math.max(3, Math.min(10, Math.floor(seg / 80)));
        for (let s = 1; s < stones; s++) {
          const t = s / stones;
          // Curved interpolation with perpendicular wobble for organic feel
          const wobble = Math.sin(t * Math.PI) * 18 * ((i % 2) ? 1 : -1);
          const nx = -dyn / seg, ny = dxn / seg;
          const wx = a.wx + dxn * t + nx * wobble;
          const wy = a.wy + dyn * t + ny * wobble;
          const p = s2w(wx, wy);
          if (p.x < -30 || p.x > VIEW_W + 30 || p.y < -20 || p.y > VIEW_H + 20) continue;
          // Shadow
          c.fillStyle = 'rgba(0,0,0,0.35)';
          c.beginPath();
          c.ellipse(p.x, p.y + 3, 12, 5, 0, 0, Math.PI * 2);
          c.fill();
          // Stone disc
          c.fillStyle = stoneCol;
          c.beginPath();
          c.ellipse(p.x, p.y, 11, 5, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#ffffff33';
          c.beginPath();
          c.ellipse(p.x - 3, p.y - 1, 4, 1.5, 0, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
    }

    // ── Build a unified depth-sorted draw list ──────────────────
    // Decorations + islands + avatar all share Y as their depth key.
    // Items with smaller wy render first (farther back).
    const ISLAND_SIZE = 220;
    const drawList = [];
    for (let i = 0; i < islands.length; i++) {
      const isl = islands[i];
      drawList.push({ kind: 'island', wy: isl.wy, ref: isl, idx: i });
    }
    for (let i = 0; i < decorations.length; i++) {
      drawList.push({ kind: 'decor', wy: decorations[i].wy, ref: decorations[i] });
    }
    for (let i = 0; i < critters.length; i++) {
      // Flyers sort by a point near the ground beneath them so they
      // don't pop in front of tall props they're cruising behind.
      drawList.push({ kind: 'critter', wy: critters[i].wy, ref: critters[i] });
    }
    drawList.push({ kind: 'avatar', wy: avatar.y });
    drawList.sort((a, b) => a.wy - b.wy);

    for (const item of drawList) {
      if (item.kind === 'avatar') {
        _drawWorldAvatar(c, s2w);
        continue;
      }
      if (item.kind === 'decor') {
        const d = item.ref;
        const p = s2w(d.wx, d.wy);
        // Cull props well off-screen
        if (p.x < -120 || p.x > VIEW_W + 120 || p.y < -160 || p.y > VIEW_H + 60) continue;
        _drawDecoration(c, d, p.x, p.y);
        continue;
      }
      if (item.kind === 'critter') {
        const cr = item.ref;
        const p = s2w(cr.wx, cr.wy);
        if (p.x < -90 || p.x > VIEW_W + 90 || p.y < -240 || p.y > VIEW_H + 80) continue;
        _drawCritter(c, cr, p.x, p.y);
        continue;
      }
      // island
      const isl = item.ref, idx = item.idx;
      const center = s2w(isl.wx, isl.wy);
      if (center.x < -ISLAND_SIZE || center.x > VIEW_W + ISLAND_SIZE
        || center.y < -ISLAND_SIZE || center.y > VIEW_H + ISLAND_SIZE) continue;
      const locked = !lvlAccessible(idx);
      _drawIsland(c, center.x, center.y, ISLAND_SIZE, isl, idx, locked, (idx === nearbyIdx), wd);
    }

    // ── Title bar (drawn on top of everything) ────────────────
    c.save();
    c.fillStyle = 'rgba(8,4,22,0.66)';
    c.fillRect(0, 0, VIEW_W, 56);
    c.font = (Math.min(18, Math.max(11, VIEW_W * 0.014)) | 0) + "px 'Press Start 2P', monospace";
    c.textAlign = 'center';
    c.fillStyle = wd.borderColor || '#f5c518';
    c.fillText('— ' + (wd.name || '???') + ' —', VIEW_W / 2, 30);
    c.font = "7px 'Press Start 2P', monospace";
    c.fillStyle = '#888';
    const helpLine = editOn
      ? 'WASD / Arrows  walk    SHIFT  run    ENTER  play    F  EDIT    ESC  back'
      : 'WASD / Arrows  walk    SHIFT  run    ENTER  play near level    ESC  back';
    c.fillText(helpLine, VIEW_W / 2, 48);
    c.restore();

    // ── Mini-map (top-right): a tiny overview ─────────────────
    _drawMiniMap(c, wd);

    // ── Info card for the nearby island ───────────────────────
    if (nearbyIdx >= 0 && infoAlpha > 0) {
      _drawInfoCard(c, islands[nearbyIdx], wd, editOn);
    }
  }

  // ── Overworld background: themed top-down landscape ────────────
  // The overworld is a top-down flat plane viewed from above. There
  // is NO horizon line — the player can walk in any direction and
  // the ground extends forever. Layers:
  //   1. Ground gradient over the entire viewport (subtle vertical
  //      shading for depth).
  //   2. Camera-relative tiled ground texture covering everything.
  //   3. Camera-LOCKED sky atmosphere overlay (clouds / sun / stars)
  //      painted at low alpha across the top portion — purely
  //      decorative, doesn't represent a real "above the world".
  //   4. Drifting theme particles (petals / snow / embers / etc.).
  function _drawOverworldBg(c) {
    const ws = _worlds();
    const wd = ws[wIdx - 1] || {};
    const biome = activeBiome || _biome(wd);
    const sky = biome.sky;
    const ground = biome.ground;
    const accent = biome.accent;

    // ── 1. Base fill — vertical gradient hinting at distance ──
    // Top of viewport gets a slight lift (mixed with sky[0]) so the
    // ground feels like it recedes; bottom is the darker ground[1].
    const baseG = c.createLinearGradient(0, 0, 0, VIEW_H);
    baseG.addColorStop(0, sky[1]);
    baseG.addColorStop(0.4, ground[0]);
    baseG.addColorStop(1, ground[1]);
    c.fillStyle = baseG;
    c.fillRect(0, 0, VIEW_W, VIEW_H);

    // ── 2. Tiled ground texture covering the ENTIRE viewport ──
    // Tile coords are in world space — the visible window is just
    // whatever overlaps the camera. There's no horizon split, so the
    // ground extends to the top of the screen too.
    const tileSize = 60;
    const camX = cameraX - VIEW_W / 2;
    const camY = cameraY - VIEW_H / 2;
    const startTX = Math.floor(camX / tileSize) - 1;
    const endTX = startTX + Math.ceil(VIEW_W / tileSize) + 3;
    const startTY = Math.floor(camY / tileSize) - 1;
    const endTY = startTY + Math.ceil(VIEW_H / tileSize) + 3;

    for (let ty = startTY; ty <= endTY; ty++) {
      for (let tx = startTX; tx <= endTX; tx++) {
        const sx = (tx * tileSize) - camX;
        const sy = (ty * tileSize) - camY;
        // Hash tile coords for variation
        const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
        const v = (h % 100);
        // Two-tone checkered with noise overlay
        c.fillStyle = (v > 50) ? ground[0] : ground[1];
        c.globalAlpha = 0.6 + (v / 100) * 0.35;
        c.fillRect(sx, sy, tileSize + 1, tileSize + 1);
        // Accent dots (sparse) — grass tufts / pebbles / sand grains
        if (v > 82) {
          c.fillStyle = accent;
          c.globalAlpha = 0.55;
          const dx = ((h >> 4) % (tileSize - 8));
          const dy = ((h >> 12) % (tileSize - 8));
          c.fillRect(sx + dx, sy + dy, 3, 3);
          if (v > 92) {
            c.fillRect(sx + dx + 4, sy + dy + 2, 2, 2);
            c.fillRect(sx + dx - 3, sy + dy + 3, 2, 2);
          }
        }
        c.globalAlpha = 1;
      }
    }

    // ── 3. Camera-locked atmospheric overlay at the top ──────
    // A short sky-tinted band at the top of the viewport with the
    // theme's cloud / sun / star decorations. Acts like an overhead
    // canopy — visible in every direction the player walks, but
    // doesn't bound the world.
    const atmosH = Math.min(VIEW_H * 0.32, 180);
    const atmosG = c.createLinearGradient(0, 0, 0, atmosH);
    atmosG.addColorStop(0, sky[0] + 'cc');
    atmosG.addColorStop(1, sky[0] + '00');
    c.fillStyle = atmosG;
    c.fillRect(0, 0, VIEW_W, atmosH);
    const themeKey = _biomeForWorld(wd);
    _drawSkyDecor(c, themeKey, accent, atmosH);

    // ── 4. Drifting theme particles (camera-locked) ──────────
    _drawAmbientParticles(c, biome);
  }

  // ── Theme-specific sky decoration (clouds / sun / aurora etc.) ──
  function _drawSkyDecor(c, themeKey, accent, horizon) {
    // Parallax based on camera so background drifts as the player walks
    const px = -cameraX * 0.05;
    const py = -cameraY * 0.02;
    if (themeKey === 'highland' || themeKey === 'cherry' || themeKey === 'forest' || themeKey === 'desert' || themeKey === 'citadel') {
      // Drifting fluffy clouds
      c.fillStyle = '#ffffffaa';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 167 + tickCount * 0.4 + px) % (VIEW_W + 200)) - 100;
        const cy = 40 + ((i * 53) % (horizon - 80));
        const r = 14 + (i % 3) * 6;
        c.globalAlpha = 0.55;
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        c.arc(cx + r, cy + 2, r * 0.7, 0, Math.PI * 2);
        c.arc(cx - r, cy + 3, r * 0.6, 0, Math.PI * 2);
        c.arc(cx + r / 2, cy - 5, r * 0.55, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
      // Sun disc (top-right)
      const sx = VIEW_W * 0.82 + px * 0.3;
      const sy = 70 + py;
      const sg = c.createRadialGradient(sx, sy, 4, sx, sy, 60);
      sg.addColorStop(0, '#fff8a0');
      sg.addColorStop(1, '#fff8a000');
      c.fillStyle = sg;
      c.fillRect(sx - 60, sy - 60, 120, 120);
      c.fillStyle = '#fff8a0';
      c.beginPath();
      c.arc(sx, sy, 16, 0, Math.PI * 2);
      c.fill();
    } else if (themeKey === 'frozen') {
      // Pale clouds + bigger moon
      c.fillStyle = '#ffffff99';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 215 + tickCount * 0.3 + px) % (VIEW_W + 200)) - 100;
        const cy = 50 + ((i * 71) % (horizon - 80));
        c.globalAlpha = 0.5;
        c.beginPath();
        c.arc(cx, cy, 22, 0, Math.PI * 2);
        c.arc(cx + 20, cy + 2, 16, 0, Math.PI * 2);
        c.arc(cx - 18, cy + 4, 14, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
      // Sun pale
      const sx = VIEW_W * 0.82, sy = 70;
      c.fillStyle = '#e0e8f4';
      c.beginPath();
      c.arc(sx, sy, 18, 0, Math.PI * 2);
      c.fill();
    } else if (themeKey === 'volcanic') {
      // Smoky volcanic clouds + glowing horizon
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 187 + tickCount * 0.3 + px) % (VIEW_W + 200)) - 100;
        const cy = 50 + ((i * 67) % (horizon - 100));
        c.fillStyle = 'rgba(60,20,10,0.6)';
        c.beginPath();
        c.arc(cx, cy, 24, 0, Math.PI * 2);
        c.arc(cx + 20, cy + 4, 18, 0, Math.PI * 2);
        c.fill();
      }
      // Horizon ember glow
      const eg = c.createLinearGradient(0, horizon - 60, 0, horizon);
      eg.addColorStop(0, '#00000000');
      eg.addColorStop(1, '#ff602066');
      c.fillStyle = eg;
      c.fillRect(0, horizon - 60, VIEW_W, 60);
    } else if (themeKey === 'cosmic' || themeKey === 'cyber' || themeKey === 'shadow' || themeKey === 'haunted' || themeKey === 'crystal') {
      // Starfield + occasional shooting star
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 80; i++) {
        const hx = (i * 173 + (px * 12) | 0) % (VIEW_W * 2) - VIEW_W * 0.5;
        const hy = ((i * 97) % (horizon - 20));
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(tickCount * 0.04 + i));
        c.globalAlpha = tw * 0.85;
        c.fillRect(hx | 0, hy | 0, 1.5, 1.5);
      }
      c.globalAlpha = 1;
      // Aurora band for cosmic / crystal
      if (themeKey === 'cosmic' || themeKey === 'crystal') {
        const auroraY = 100 + Math.sin(tickCount * 0.02) * 10;
        const ag = c.createLinearGradient(0, auroraY, 0, auroraY + 50);
        ag.addColorStop(0, accent + '00');
        ag.addColorStop(0.5, accent + '66');
        ag.addColorStop(1, accent + '00');
        c.fillStyle = ag;
        c.fillRect(0, auroraY, VIEW_W, 50);
      }
    } else if (themeKey === 'coralreef') {
      // Light caustics
      c.strokeStyle = '#ffffff33';
      c.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const cx = (((i * 121 + tickCount * 0.6) % (VIEW_W + 80)) - 40);
        c.beginPath();
        c.moveTo(cx, 0);
        c.lineTo(cx + 30 + Math.sin(tickCount * 0.05 + i) * 12, horizon);
        c.stroke();
      }
      // Bubble streams
      for (let i = 0; i < 14; i++) {
        const bx = ((i * 71) % VIEW_W);
        const by = (horizon - ((tickCount * 0.8 + i * 47) % (horizon + 40)));
        c.fillStyle = '#ffffff66';
        c.beginPath();
        c.arc(bx, by, 1.6, 0, Math.PI * 2);
        c.fill();
      }
    } else if (themeKey === 'steampunk') {
      // Smoke plumes
      for (let i = 0; i < 3; i++) {
        const cx = (i * 280 + tickCount * 0.25 + px) % (VIEW_W + 200) - 100;
        for (let j = 0; j < 4; j++) {
          c.fillStyle = 'rgba(80,50,30,' + (0.45 - j * 0.08) + ')';
          c.beginPath();
          c.arc(cx, 40 + j * 20, 18 - j * 2, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
  }

  // ── Ambient particle field (petals / snow / embers / etc.) ──────
  function _drawAmbientParticles(c, biome) {
    const p = biome.particle;
    if (!p) return;
    for (let i = 0; i < p.count; i++) {
      const baseX = ((i * 311 + cameraX * 0.6) % (VIEW_W + 120)) - 60;
      const speed = 0.5 + ((i * 7) % 5) / 5;
      const fall = (tickCount * speed + i * 53) % (VIEW_H + 60);
      const x = baseX + Math.sin(tickCount * 0.02 + i) * 18;
      const y = -30 + fall;
      c.fillStyle = p.color;
      c.globalAlpha = 0.4 + 0.4 * Math.sin(tickCount * 0.05 + i);
      if (p.shape === 'petal' || p.shape === 'leaf' || p.shape === 'dust') {
        c.beginPath();
        c.ellipse(x, y, 4, 2, (i + tickCount * 0.01) % Math.PI, 0, Math.PI * 2);
        c.fill();
      } else if (p.shape === 'snow' || p.shape === 'bubble' || p.shape === 'spark') {
        c.beginPath();
        c.arc(x, y, p.shape === 'spark' ? 1.4 : 2.2, 0, Math.PI * 2);
        c.fill();
      } else if (p.shape === 'ember') {
        c.fillRect(x - 1, y - 1, 2, 2);
      } else if (p.shape === 'wisp') {
        c.beginPath();
        c.ellipse(x, y, 7, 2.5, (i + tickCount * 0.01) % Math.PI, 0, Math.PI * 2);
        c.fill();
      } else if (p.shape === 'star') {
        c.fillRect(x | 0, y | 0, 1.5, 1.5);
      } else if (p.shape === 'pollen') {
        c.beginPath();
        c.arc(x, y, 1.6, 0, Math.PI * 2);
        c.fill();
      } else if (p.shape === 'cloud') {
        c.beginPath();
        c.ellipse(x, y, 16, 4, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.globalAlpha = 1;
  }

  // ── Critter renderers — one tiny sprite per type, drawn centered
  // at the origin facing right. The dispatcher handles facing flip,
  // altitude, bob and the ground shadow.
  const _CRITTER_DRAW = {
    bird(c, flap, cr) {
      const col = cr.color || '#33333a';
      const wy = -flap * 3.5;
      c.strokeStyle = col;
      c.lineWidth = 2;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-8, wy);
      c.quadraticCurveTo(-3, -3, 0, 0);
      c.quadraticCurveTo(3, -3, 8, wy);
      c.stroke();
      c.fillStyle = col;
      c.beginPath();
      c.arc(0, 0, 1.7, 0, Math.PI * 2);
      c.fill();
    },
    butterfly(c, flap, cr) {
      const col = cr.color || '#ffd24a';
      const open = 2.4 + Math.abs(flap) * 4;
      c.fillStyle = col;
      c.beginPath(); c.ellipse(-open, -2, 3.4, 4, 0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(open, -2, 3.4, 4, -0.4, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.8;
      c.beginPath(); c.ellipse(-open * 0.8, 2.4, 2.6, 3, 0.3, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(open * 0.8, 2.4, 2.6, 3, -0.3, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      c.fillStyle = '#2a2230';
      c.fillRect(-0.8, -3.4, 1.6, 7.5);
    },
    rabbit(c, flap, cr) {
      const col = cr.color || '#c9b89a';
      c.fillStyle = col;
      c.beginPath(); c.ellipse(-1, 0, 4, 3, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(3.2, -2, 2.4, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(3, -3); c.rotate(-0.2);
      c.fillRect(-0.7, -5.5, 1.5, 6);
      c.rotate(0.45);
      c.fillRect(0.4, -5.5, 1.5, 6);
      c.restore();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(-5, -1, 1.7, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1a1410';
      c.fillRect(3.7, -2.7, 1, 1);
    },
    beetle(c, flap, cr) {
      const col = cr.color || '#3a7a4a';
      c.strokeStyle = '#15140f';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(-3, 1.5); c.lineTo(-5.5, 4);
      c.moveTo(0, 2.5); c.lineTo(0, 5.2);
      c.moveTo(3, 1.5); c.lineTo(5.5, 4);
      c.stroke();
      c.fillStyle = col;
      c.beginPath(); c.ellipse(0, 0, 4, 3.2, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.beginPath(); c.ellipse(-1.2, -1.2, 1.4, 1, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.4)';
      c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(0, -3); c.lineTo(0, 3); c.stroke();
    },
    firefly(c, flap, cr) {
      const col = cr.color || '#ffe070';
      const glow = 0.35 + 0.55 * Math.abs(flap);
      c.globalAlpha = glow * 0.5;
      c.fillStyle = col;
      c.beginPath(); c.arc(0, 0, 4.5, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      c.beginPath(); c.arc(0, 0, 1.7, 0, Math.PI * 2); c.fill();
    },
    bat(c, flap, cr) {
      const col = cr.color || '#2a2235';
      const wy = -flap * 4;
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-8, wy); c.lineTo(-5, 2); c.lineTo(-2, 1);
      c.lineTo(0, 3);
      c.lineTo(2, 1); c.lineTo(5, 2); c.lineTo(8, wy);
      c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-1.6, -1); c.lineTo(-2.6, -4); c.lineTo(-0.4, -1.6); c.fill();
      c.beginPath(); c.moveTo(1.6, -1); c.lineTo(2.6, -4); c.lineTo(0.4, -1.6); c.fill();
    },
    ghost(c, flap, cr) {
      const col = cr.color || 'rgba(226,229,255,0.74)';
      c.fillStyle = col;
      c.beginPath();
      c.arc(0, -2, 5, Math.PI, 0);
      c.lineTo(5, 3);
      c.quadraticCurveTo(3.6, 5.4, 2.2, 3);
      c.quadraticCurveTo(0.6, 5.4, -1, 3);
      c.quadraticCurveTo(-2.6, 5.4, -5, 3);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(40,30,62,0.82)';
      c.fillRect(-2.7, -3.4, 1.7, 2.4);
      c.fillRect(1, -3.4, 1.7, 2.4);
    },
    drone(c, flap, cr) {
      const col = cr.color || '#cfd8e0';
      c.strokeStyle = 'rgba(200,220,255,0.5)';
      c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(-6, -4); c.lineTo(6, -4); c.stroke();
      c.fillStyle = col;
      c.fillRect(-3, -3, 6, 5);
      c.fillStyle = '#2a3a5a';
      c.fillRect(-1.6, -2, 3.2, 2);
      c.fillStyle = (Math.abs(flap) > 0.4) ? '#ff5050' : '#5a1a1a';
      c.beginPath(); c.arc(0, 2.2, 1.4, 0, Math.PI * 2); c.fill();
    },
    fish(c, flap, cr) {
      const col = cr.color || '#5ad0ff';
      c.fillStyle = col;
      c.beginPath(); c.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2); c.fill();
      c.beginPath();
      c.moveTo(-4, 0);
      c.lineTo(-8, -3 + flap * 1.6);
      c.lineTo(-8, 3 + flap * 1.6);
      c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, -2.4); c.lineTo(2, -5); c.lineTo(3, -2); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(2.6, -0.6, 1.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1a1410';
      c.beginPath(); c.arc(3, -0.6, 0.6, 0, Math.PI * 2); c.fill();
    },
    jellyfish(c, flap, cr) {
      const col = cr.color || 'rgba(255,150,200,0.6)';
      c.fillStyle = col;
      c.beginPath();
      c.arc(0, -1, 5, Math.PI, 0);
      c.closePath(); c.fill();
      c.strokeStyle = col;
      c.lineWidth = 1.1;
      for (let t = -3; t <= 3; t += 2) {
        c.beginPath();
        c.moveTo(t, -1);
        c.quadraticCurveTo(t + Math.sin(flap + t) * 2, 3.5, t, 7.5);
        c.stroke();
      }
    },
    emberMote(c, flap, cr) {
      const col = cr.color || '#ff7a3a';
      const f = 0.5 + 0.5 * Math.abs(flap);
      c.globalAlpha = 0.35 * f;
      c.fillStyle = col;
      c.beginPath(); c.arc(0, 0, 5.2, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      c.fillStyle = '#fff2c0';
      c.beginPath(); c.arc(0, 0, 1.5 * f + 0.7, 0, Math.PI * 2); c.fill();
    },
    steamPuff(c, flap, cr) {
      const col = cr.color || '#dde0e8';
      const f = 0.6 + 0.4 * Math.abs(flap);
      c.globalAlpha = 0.5 * f;
      c.fillStyle = col;
      c.beginPath();
      c.arc(-2.6, 1, 3 * f, 0, Math.PI * 2);
      c.arc(2.6, 1, 3 * f, 0, Math.PI * 2);
      c.arc(0, -2, 3.7 * f, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    },
    cloudSheep(c, flap, cr) {
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(-4, 0.4, 3.6, 0, Math.PI * 2);
      c.arc(0, -2, 4.3, 0, Math.PI * 2);
      c.arc(4, 0.4, 3.6, 0, Math.PI * 2);
      c.arc(0, 2.2, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#9aa6c0';
      c.beginPath(); c.arc(3.4, 0.6, 2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2f2f44';
      c.fillRect(3, -0.2, 1, 1.1);
      c.fillRect(4.4, -0.2, 1, 1.1);
    },
  };

  function _drawCritter(c, cr, sx, sy) {
    const fast = (cr.behavior === 'fly' || cr.behavior === 'dart');
    const flap = Math.sin(cr.phase * (fast ? 7 : 4));
    const bob = Math.sin(cr.phase * (fast ? 3 : 2)) * (cr.behavior === 'fly' ? 3 : 2);
    let hopY = 0;
    if (cr.behavior === 'hop' && cr.idle <= 0) {
      hopY = -Math.abs(Math.sin(cr.phase * 5)) * 5;
    }
    const groundY = sy + 4;
    const drawY = sy - cr.alt + bob + hopY;
    // Ground shadow — smaller + fainter the higher the critter floats.
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.22)';
    const shS = cr.alt > 0 ? 0.6 : 1;
    c.beginPath();
    c.ellipse(sx, groundY, 7 * cr.scale * shS, 2.6 * cr.scale * shS, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.save();
    c.translate(sx, drawY);
    c.scale(cr.facing * cr.scale, cr.scale);
    (_CRITTER_DRAW[cr.type] || _CRITTER_DRAW.bird)(c, flap, cr);
    c.restore();
  }

  // ── Decoration renderers — one function per type. Each draws at
  // (sx, sy) which is the screen-projected base of the prop. The
  // base point is the prop's "footprint" on the ground; visuals
  // extend upward from there. Scale lets us vary size per-prop.
  function _drawDecoration(c, dec, sx, sy) {
    const s = dec.scale || 1;
    const variant = dec.variant || 0;
    switch (dec.type) {
      case 'pine': _decPine(c, sx, sy, s, variant); break;
      case 'tree': _decTree(c, sx, sy, s, variant); break;
      case 'snowyTree': _decPine(c, sx, sy, s, variant, true); break;
      case 'cherryTree': _decCherryTree(c, sx, sy, s, variant); break;
      case 'deadTree': _decDeadTree(c, sx, sy, s, variant); break;
      case 'palm': _decPalm(c, sx, sy, s, variant); break;
      case 'cactus': _decCactus(c, sx, sy, s, variant); break;
      case 'rock': _decRock(c, sx, sy, s, variant); break;
      case 'mushroom': _decMushroom(c, sx, sy, s, variant); break;
      case 'fern': _decFern(c, sx, sy, s, variant); break;
      case 'flower': _decFlower(c, sx, sy, s, variant); break;
      case 'sheep': _decSheep(c, sx, sy, s, variant); break;
      case 'iceCrystal':
      case 'crystal': _decCrystal(c, sx, sy, s, variant, dec.type === 'iceCrystal'); break;
      case 'snowPile': _decSnowPile(c, sx, sy, s, variant); break;
      case 'lavaRock': _decLavaRock(c, sx, sy, s, variant); break;
      case 'magmaCrack': _decMagmaCrack(c, sx, sy, s, variant); break;
      case 'obsidian': _decObsidian(c, sx, sy, s, variant); break;
      case 'tombstone': _decTombstone(c, sx, sy, s, variant); break;
      case 'lantern': _decLantern(c, sx, sy, s, variant); break;
      case 'shadowSpike': _decShadowSpike(c, sx, sy, s, variant); break;
      case 'voidOrb': _decVoidOrb(c, sx, sy, s, variant); break;
      case 'neonSign': _decNeonSign(c, sx, sy, s, variant); break;
      case 'antenna': _decAntenna(c, sx, sy, s, variant); break;
      case 'coral': _decCoral(c, sx, sy, s, variant); break;
      case 'kelp': _decKelp(c, sx, sy, s, variant); break;
      case 'shell': _decShell(c, sx, sy, s, variant); break;
      case 'asteroid': _decAsteroid(c, sx, sy, s, variant); break;
      case 'starCluster': _decStarCluster(c, sx, sy, s, variant); break;
      case 'gear': _decGear(c, sx, sy, s, variant); break;
      case 'pipe': _decPipe(c, sx, sy, s, variant); break;
      case 'cog': _decGear(c, sx, sy, s * 0.7, variant); break;
      case 'stonePillar': _decStonePillar(c, sx, sy, s, variant); break;
      case 'banner': _decBanner(c, sx, sy, s, variant); break;
      case 'tower': _decTower(c, sx, sy, s, variant); break;
      case 'dune': _decDune(c, sx, sy, s, variant); break;
      case 'cloudTuft': _decCloudTuft(c, sx, sy, s, variant); break;
      default: _decRock(c, sx, sy, s, variant); break;
    }
  }

  // Ground shadow under any prop
  function _propShadow(c, sx, sy, w) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath();
    c.ellipse(sx, sy, w, w * 0.35, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // Pine tree (highland / frozen w/ snow flag)
  function _decPine(c, sx, sy, s, variant, snowy) {
    _propShadow(c, sx, sy, 14 * s);
    const h = 56 * s;
    // Trunk
    c.fillStyle = '#5a3a20';
    c.fillRect(sx - 3 * s, sy - h * 0.25, 6 * s, h * 0.25);
    // Triangular layers
    const greens = snowy ? ['#88a88a', '#ffffff'] : ['#3a8a4a', '#1a5a2a'];
    for (let i = 0; i < 3; i++) {
      const layerY = sy - h * 0.25 - i * h * 0.22;
      const layerW = 22 * s - i * 5 * s;
      c.fillStyle = greens[i % 2];
      c.beginPath();
      c.moveTo(sx, layerY - h * 0.28);
      c.lineTo(sx + layerW, layerY);
      c.lineTo(sx - layerW, layerY);
      c.closePath();
      c.fill();
      if (snowy) {
        c.fillStyle = '#ffffff';
        c.fillRect(sx - layerW * 0.7, layerY - 2, layerW * 1.4, 2);
      }
    }
  }
  // Broadleaf tree (forest)
  function _decTree(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 18 * s);
    const h = 60 * s;
    c.fillStyle = '#5a3a20';
    c.fillRect(sx - 4 * s, sy - h * 0.4, 8 * s, h * 0.4);
    // Crown — 3 stacked circles
    c.fillStyle = '#3a8a3a';
    c.beginPath();
    c.arc(sx, sy - h * 0.7, 16 * s, 0, Math.PI * 2);
    c.arc(sx - 12 * s, sy - h * 0.55, 12 * s, 0, Math.PI * 2);
    c.arc(sx + 12 * s, sy - h * 0.55, 12 * s, 0, Math.PI * 2);
    c.fill();
    // Highlight
    c.fillStyle = '#6acc6a';
    c.beginPath();
    c.arc(sx - 6 * s, sy - h * 0.78, 6 * s, 0, Math.PI * 2);
    c.fill();
  }
  function _decCherryTree(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 18 * s);
    const h = 60 * s;
    c.fillStyle = '#5a3030';
    c.fillRect(sx - 4 * s, sy - h * 0.4, 8 * s, h * 0.4);
    c.fillStyle = '#ffb0d8';
    c.beginPath();
    c.arc(sx, sy - h * 0.7, 16 * s, 0, Math.PI * 2);
    c.arc(sx - 12 * s, sy - h * 0.55, 12 * s, 0, Math.PI * 2);
    c.arc(sx + 12 * s, sy - h * 0.55, 12 * s, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffe0ec';
    c.beginPath();
    c.arc(sx - 5 * s, sy - h * 0.78, 5 * s, 0, Math.PI * 2);
    c.fill();
    // Falling petals around it
    for (let i = 0; i < 4; i++) {
      const px = sx + Math.sin(tickCount * 0.04 + i + sx) * 18 * s;
      const py = sy - h * 0.3 + ((tickCount * 0.6 + i * 17 + sx) % (h * 0.3));
      c.fillStyle = '#ffb0d8aa';
      c.beginPath();
      c.ellipse(px, py, 2 * s, 1 * s, (tickCount * 0.02 + i) % Math.PI, 0, Math.PI * 2);
      c.fill();
    }
  }
  function _decDeadTree(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 12 * s);
    const h = 58 * s;
    c.strokeStyle = '#3a2030';
    c.lineWidth = 4 * s;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + Math.sin(variant) * 3, sy - h);
    c.stroke();
    // Branches
    c.lineWidth = 2.5 * s;
    c.beginPath();
    c.moveTo(sx, sy - h * 0.55);
    c.lineTo(sx - 14 * s, sy - h * 0.72);
    c.moveTo(sx, sy - h * 0.7);
    c.lineTo(sx + 12 * s, sy - h * 0.85);
    c.moveTo(sx - 6 * s, sy - h * 0.4);
    c.lineTo(sx - 16 * s, sy - h * 0.48);
    c.stroke();
  }
  function _decPalm(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 16 * s);
    const h = 70 * s;
    c.fillStyle = '#6a4a20';
    c.fillRect(sx - 3 * s, sy - h, 6 * s, h);
    // Fronds — 5 rotating
    c.fillStyle = '#3a8a3a';
    const top = sy - h;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + variant;
      const ex = sx + Math.cos(a) * 22 * s;
      const ey = top + Math.sin(a) * 12 * s - 4;
      c.beginPath();
      c.ellipse(ex, ey, 14 * s, 4 * s, a, 0, Math.PI * 2);
      c.fill();
    }
    // Coconuts
    c.fillStyle = '#5a3020';
    c.beginPath();
    c.arc(sx + 4 * s, top + 4, 3 * s, 0, Math.PI * 2);
    c.arc(sx - 4 * s, top + 4, 3 * s, 0, Math.PI * 2);
    c.fill();
  }
  function _decCactus(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 10 * s);
    const h = 46 * s;
    c.fillStyle = '#3a8a4a';
    c.fillRect(sx - 6 * s, sy - h, 12 * s, h);
    // Arms
    c.fillRect(sx - 14 * s, sy - h * 0.65, 8 * s, h * 0.45);
    c.fillRect(sx - 14 * s, sy - h * 0.65, 4 * s, h * 0.15);  // top stub left
    c.fillRect(sx + 6 * s, sy - h * 0.55, 8 * s, h * 0.5);
    // Spines
    c.fillStyle = '#fff8';
    for (let i = 0; i < 5; i++) {
      c.fillRect(sx - 5 * s, sy - h + i * h / 5, 1, 2);
      c.fillRect(sx + 4 * s, sy - h + i * h / 5, 1, 2);
    }
  }
  function _decRock(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 16 * s);
    c.fillStyle = '#6a6a78';
    c.beginPath();
    c.ellipse(sx, sy - 8 * s, 18 * s, 12 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#8a8a98';
    c.beginPath();
    c.ellipse(sx - 4 * s, sy - 12 * s, 8 * s, 4 * s, 0, 0, Math.PI * 2);
    c.fill();
  }
  function _decMushroom(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 10 * s);
    const h = 24 * s;
    // Stalk
    c.fillStyle = '#e8d8b0';
    c.fillRect(sx - 3 * s, sy - h * 0.5, 6 * s, h * 0.5);
    // Cap
    c.fillStyle = (variant & 1) ? '#cc3030' : '#aa3060';
    c.beginPath();
    c.ellipse(sx, sy - h * 0.55, 12 * s, 6 * s, 0, Math.PI, Math.PI * 2);
    c.fill();
    // Spots
    c.fillStyle = '#ffffff';
    c.fillRect(sx - 5 * s, sy - h * 0.6, 2 * s, 2 * s);
    c.fillRect(sx + 3 * s, sy - h * 0.7, 2 * s, 2 * s);
  }
  function _decFern(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 10 * s);
    c.strokeStyle = '#4a8a4a';
    c.lineWidth = 2 * s;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + ((i - 2) / 4) * 1.2;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx + Math.cos(a) * 16 * s, sy + Math.sin(a) * 16 * s);
      c.stroke();
    }
  }
  function _decFlower(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 6 * s);
    // Stem
    c.strokeStyle = '#3a7a4a';
    c.lineWidth = 1.5 * s;
    c.beginPath();
    c.moveTo(sx, sy); c.lineTo(sx, sy - 14 * s);
    c.stroke();
    // Petals
    const colors = ['#ff80a0', '#ffd060', '#a080ff', '#88ddff'];
    const col = colors[variant % colors.length];
    c.fillStyle = col;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      c.beginPath();
      c.arc(sx + Math.cos(a) * 3 * s, sy - 14 * s + Math.sin(a) * 3 * s, 3 * s, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#ffe060';
    c.beginPath();
    c.arc(sx, sy - 14 * s, 2 * s, 0, Math.PI * 2);
    c.fill();
  }
  function _decSheep(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 14 * s);
    c.fillStyle = '#e8e0d0';
    c.beginPath();
    c.ellipse(sx, sy - 10 * s, 14 * s, 8 * s, 0, 0, Math.PI * 2);
    c.fill();
    // Head
    c.fillStyle = '#3a3030';
    c.beginPath();
    c.arc(sx + 12 * s, sy - 11 * s, 4 * s, 0, Math.PI * 2);
    c.fill();
    // Legs
    c.fillStyle = '#3a3030';
    c.fillRect(sx - 8 * s, sy - 4 * s, 2 * s, 4 * s);
    c.fillRect(sx + 6 * s, sy - 4 * s, 2 * s, 4 * s);
  }
  function _decCrystal(c, sx, sy, s, variant, icy) {
    _propShadow(c, sx, sy, 10 * s);
    const h = 36 * s;
    const col = icy ? '#a8e0ff' : '#a080ff';
    const colHi = icy ? '#ffffff' : '#d8c0ff';
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(sx, sy - h);
    c.lineTo(sx + 10 * s, sy - h * 0.4);
    c.lineTo(sx + 5 * s, sy);
    c.lineTo(sx - 5 * s, sy);
    c.lineTo(sx - 10 * s, sy - h * 0.4);
    c.closePath();
    c.fill();
    c.fillStyle = colHi;
    c.beginPath();
    c.moveTo(sx, sy - h);
    c.lineTo(sx + 4 * s, sy - h * 0.5);
    c.lineTo(sx, sy - h * 0.2);
    c.closePath();
    c.fill();
  }
  function _decSnowPile(c, sx, sy, s, variant) {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(sx, sy - 4 * s, 14 * s, 5 * s, 0, 0, Math.PI * 2);
    c.ellipse(sx - 8 * s, sy - 2 * s, 8 * s, 3 * s, 0, 0, Math.PI * 2);
    c.fill();
  }
  function _decLavaRock(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 16 * s);
    c.fillStyle = '#2a0808';
    c.beginPath();
    c.ellipse(sx, sy - 10 * s, 18 * s, 12 * s, 0, 0, Math.PI * 2);
    c.fill();
    // Glowing cracks
    c.fillStyle = '#ff6020';
    c.fillRect(sx - 6 * s, sy - 10 * s, 14 * s, 1.5);
    c.fillRect(sx - 4 * s, sy - 14 * s, 6 * s, 1);
  }
  function _decMagmaCrack(c, sx, sy, s, variant) {
    c.fillStyle = '#1a0404';
    c.beginPath();
    c.ellipse(sx, sy - 2 * s, 22 * s, 5 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ff6020';
    c.beginPath();
    c.ellipse(sx, sy - 2 * s, 16 * s, 3 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffd060';
    c.beginPath();
    c.ellipse(sx - 3 * s, sy - 2 * s, 8 * s, 1.5, 0, 0, Math.PI * 2);
    c.fill();
  }
  function _decObsidian(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 10 * s);
    c.fillStyle = '#1a0a1a';
    c.beginPath();
    c.moveTo(sx, sy - 30 * s);
    c.lineTo(sx + 9 * s, sy - 12 * s);
    c.lineTo(sx + 4 * s, sy);
    c.lineTo(sx - 4 * s, sy);
    c.lineTo(sx - 9 * s, sy - 12 * s);
    c.closePath();
    c.fill();
    c.fillStyle = '#3a1a3a';
    c.fillRect(sx - 1, sy - 28 * s, 2, 12 * s);
  }
  function _decTombstone(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 12 * s);
    c.fillStyle = '#6a6a78';
    c.beginPath();
    c.moveTo(sx - 9 * s, sy);
    c.lineTo(sx - 9 * s, sy - 18 * s);
    c.arc(sx, sy - 18 * s, 9 * s, Math.PI, 0);
    c.lineTo(sx + 9 * s, sy);
    c.closePath();
    c.fill();
    c.fillStyle = '#3a3a48';
    c.font = (10 * s) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('R.I.P', sx, sy - 12 * s);
  }
  function _decLantern(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 8 * s);
    const h = 30 * s;
    c.fillStyle = '#3a2a1a';
    c.fillRect(sx - 1, sy - h, 2, h);  // pole
    // Lantern body
    c.fillStyle = '#ffaa30';
    const flicker = 1 + Math.sin(tickCount * 0.3 + variant) * 0.08;
    c.beginPath();
    c.ellipse(sx, sy - h + 4, 6 * s * flicker, 7 * s * flicker, 0, 0, Math.PI * 2);
    c.fill();
    // Glow
    const g = c.createRadialGradient(sx, sy - h + 4, 2, sx, sy - h + 4, 24 * s);
    g.addColorStop(0, 'rgba(255,170,48,0.5)');
    g.addColorStop(1, 'rgba(255,170,48,0)');
    c.fillStyle = g;
    c.fillRect(sx - 30 * s, sy - h - 20 * s, 60 * s, 50 * s);
  }
  function _decShadowSpike(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 8 * s);
    c.fillStyle = '#1a0a2a';
    c.beginPath();
    c.moveTo(sx, sy - 38 * s);
    c.lineTo(sx + 6 * s, sy);
    c.lineTo(sx - 6 * s, sy);
    c.closePath();
    c.fill();
    c.fillStyle = '#3a1a4a';
    c.fillRect(sx - 1, sy - 36 * s, 2, 30 * s);
  }
  function _decVoidOrb(c, sx, sy, s, variant) {
    const h = sy - 26 * s + Math.sin(tickCount * 0.05 + variant) * 4;
    const g = c.createRadialGradient(sx, h, 2, sx, h, 18 * s);
    g.addColorStop(0, '#a080ff');
    g.addColorStop(1, '#a080ff00');
    c.fillStyle = g;
    c.fillRect(sx - 20 * s, h - 20 * s, 40 * s, 40 * s);
    c.fillStyle = '#a080ff';
    c.beginPath();
    c.arc(sx, h, 6 * s, 0, Math.PI * 2);
    c.fill();
  }
  function _decNeonSign(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 14 * s);
    const h = 50 * s;
    c.fillStyle = '#3a2a4a';
    c.fillRect(sx - 1, sy - h, 2, h);  // pole
    const colors = ['#ff40c8', '#40c8ff', '#88ff40', '#ffd040'];
    const col = colors[variant % colors.length];
    c.fillStyle = col;
    c.fillRect(sx - 14 * s, sy - h - 4, 28 * s, 18 * s);
    // Glow
    c.shadowColor = col;
    c.shadowBlur = 8;
    c.fillRect(sx - 14 * s, sy - h - 4, 28 * s, 18 * s);
    c.shadowBlur = 0;
    c.fillStyle = '#fff';
    c.fillRect(sx - 8 * s, sy - h + 2, 16 * s, 8 * s);
  }
  function _decAntenna(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 8 * s);
    const h = 70 * s;
    c.strokeStyle = '#aac';
    c.lineWidth = 2 * s;
    c.beginPath();
    c.moveTo(sx - 6 * s, sy);
    c.lineTo(sx, sy - h);
    c.lineTo(sx + 6 * s, sy);
    c.stroke();
    c.beginPath();
    c.moveTo(sx - 3 * s, sy - h * 0.4);
    c.lineTo(sx + 3 * s, sy - h * 0.4);
    c.stroke();
    // Blinking light
    c.fillStyle = (tickCount % 60 < 30) ? '#ff4040' : '#400';
    c.fillRect(sx - 2, sy - h - 4, 4, 4);
  }
  function _decCoral(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 12 * s);
    const colors = ['#ffa0c0', '#ff80a0', '#c060c0'];
    c.fillStyle = colors[variant % colors.length];
    for (let i = 0; i < 4; i++) {
      const bx = sx + (i - 1.5) * 6 * s;
      const bh = 20 * s + Math.abs(Math.sin(i + variant)) * 14 * s;
      c.fillRect(bx, sy - bh, 4 * s, bh);
      c.beginPath();
      c.arc(bx + 2 * s, sy - bh, 4 * s, 0, Math.PI * 2);
      c.fill();
    }
  }
  function _decKelp(c, sx, sy, s, variant) {
    c.strokeStyle = '#3a7a4a';
    c.lineWidth = 3 * s;
    const wobble = Math.sin(tickCount * 0.03 + variant);
    c.beginPath();
    c.moveTo(sx, sy);
    c.quadraticCurveTo(sx + wobble * 12, sy - 30 * s, sx + wobble * 18, sy - 50 * s);
    c.stroke();
    c.lineWidth = 2 * s;
    c.beginPath();
    c.moveTo(sx + 6 * s, sy);
    c.quadraticCurveTo(sx + 6 * s + wobble * 14, sy - 25 * s, sx + 6 * s + wobble * 20, sy - 40 * s);
    c.stroke();
  }
  function _decShell(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 8 * s);
    c.fillStyle = '#ffe0c8';
    c.beginPath();
    c.ellipse(sx, sy - 5 * s, 10 * s, 8 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#cc9070';
    c.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      c.beginPath();
      c.ellipse(sx, sy - 5 * s, 10 * s - i * 2, 8 * s - i * 1.5, 0, 0, Math.PI);
      c.stroke();
    }
  }
  function _decAsteroid(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 18 * s);
    c.fillStyle = '#4a3a5a';
    c.beginPath();
    c.ellipse(sx, sy - 12 * s, 18 * s, 14 * s, variant, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3a2a4a';
    c.beginPath();
    c.arc(sx - 4 * s, sy - 14 * s, 4 * s, 0, Math.PI * 2);
    c.arc(sx + 6 * s, sy - 10 * s, 3 * s, 0, Math.PI * 2);
    c.fill();
  }
  function _decStarCluster(c, sx, sy, s, variant) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + variant * 0.3;
      const r = 8 * s + (i % 3) * 4 * s;
      const px = sx + Math.cos(a) * r;
      const py = sy - 20 * s + Math.sin(a) * r;
      c.fillStyle = '#fff';
      c.globalAlpha = 0.6 + 0.4 * Math.sin(tickCount * 0.05 + i + variant);
      c.fillRect(px | 0, py | 0, 2, 2);
    }
    c.globalAlpha = 1;
  }
  function _decGear(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 12 * s);
    const cy = sy - 20 * s;
    const r = 14 * s;
    const teeth = 10;
    c.fillStyle = '#8a6030';
    c.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2 + tickCount * 0.01;
      const rr = (i & 1) ? r * 1.15 : r;
      c.lineTo(sx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
    c.fillStyle = '#3a2010';
    c.beginPath();
    c.arc(sx, cy, r * 0.45, 0, Math.PI * 2);
    c.fill();
  }
  function _decPipe(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 14 * s);
    c.fillStyle = '#6a5040';
    c.fillRect(sx - 10 * s, sy - 30 * s, 20 * s, 30 * s);
    c.fillStyle = '#3a2818';
    c.fillRect(sx - 12 * s, sy - 32 * s, 24 * s, 4 * s);
  }
  function _decStonePillar(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 12 * s);
    c.fillStyle = '#aa9070';
    c.fillRect(sx - 8 * s, sy - 50 * s, 16 * s, 50 * s);
    c.fillStyle = '#7a6048';
    c.fillRect(sx - 10 * s, sy - 54 * s, 20 * s, 4 * s);
    c.fillRect(sx - 10 * s, sy - 4 * s, 20 * s, 4 * s);
  }
  function _decBanner(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 6 * s);
    c.strokeStyle = '#5a4030';
    c.lineWidth = 2 * s;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx, sy - 50 * s);
    c.stroke();
    const wave = Math.sin(tickCount * 0.08 + variant) * 4;
    const colors = ['#aa3030', '#3060aa', '#3a8a3a'];
    c.fillStyle = colors[variant % colors.length];
    c.beginPath();
    c.moveTo(sx, sy - 50 * s);
    c.lineTo(sx + 20 * s + wave, sy - 44 * s);
    c.lineTo(sx, sy - 30 * s);
    c.closePath();
    c.fill();
  }
  function _decTower(c, sx, sy, s, variant) {
    _propShadow(c, sx, sy, 16 * s);
    c.fillStyle = '#7a6048';
    c.fillRect(sx - 12 * s, sy - 60 * s, 24 * s, 60 * s);
    // Battlements
    c.fillRect(sx - 14 * s, sy - 64 * s, 4 * s, 8 * s);
    c.fillRect(sx - 4 * s, sy - 64 * s, 4 * s, 8 * s);
    c.fillRect(sx + 6 * s, sy - 64 * s, 4 * s, 8 * s);
    c.fillRect(sx + 10 * s, sy - 64 * s, 4 * s, 8 * s);
    // Window
    c.fillStyle = '#2a1810';
    c.fillRect(sx - 3 * s, sy - 30 * s, 6 * s, 10 * s);
  }
  function _decDune(c, sx, sy, s, variant) {
    c.fillStyle = '#d8a060';
    c.beginPath();
    c.ellipse(sx, sy - 6 * s, 40 * s, 10 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffd080';
    c.beginPath();
    c.ellipse(sx - 6 * s, sy - 10 * s, 24 * s, 4 * s, 0, 0, Math.PI * 2);
    c.fill();
  }
  // Heaven biome — a low fluffy cloud puff resting on the ground.
  function _decCloudTuft(c, sx, sy, s, variant) {
    const bob = Math.sin(tickCount * 0.04 + variant) * 2;
    const y = sy - 8 * s + bob;
    c.fillStyle = 'rgba(255,255,255,0.92)';
    c.beginPath();
    c.arc(sx, y, 14 * s, 0, Math.PI * 2);
    c.arc(sx + 13 * s, y + 3 * s, 10 * s, 0, Math.PI * 2);
    c.arc(sx - 13 * s, y + 4 * s, 9 * s, 0, Math.PI * 2);
    c.arc(sx + 5 * s, y - 8 * s, 9 * s, 0, Math.PI * 2);
    c.fill();
    // Soft golden underside
    c.fillStyle = 'rgba(255,233,160,0.45)';
    c.beginPath();
    c.ellipse(sx, y + 7 * s, 18 * s, 4 * s, 0, 0, Math.PI * 2);
    c.fill();
  }

  // ── Pixel-art content icons for level sprites ───────────────────
  // Detailed flat icons; gridY 0 = the icon's base (so it stands on
  // the grass). Same chunky pixel-art style as the planets. Each
  // enemy family has its own sprite so a level's cast reads clearly.
  const _LVL_ICONS = {
    foe: [[-3,-6,6,5,'#e0463a'],[-3,-7,2,1,'#e0463a'],[1,-7,2,1,'#e0463a'],
          [-2,-5,2,2,'#ffffff'],[1,-5,2,2,'#ffffff'],[-1,-5,1,1,'#1a1018'],[2,-5,1,1,'#1a1018'],
          [-2,-2,4,1,'#7a1c18'],[-3,-1,2,1,'#a82e26'],[1,-1,2,1,'#a82e26']],
    jumper: [[-2,-6,4,5,'#3fc05a'],[-2,-7,4,1,'#5ad878'],[-2,-4,1,1,'#10301a'],[1,-4,1,1,'#10301a'],
             [-3,-1,2,1,'#2a8a3e'],[1,-1,2,1,'#2a8a3e'],
             [-1,-9,2,1,'#9affb0'],[-2,-8,1,1,'#9affb0'],[1,-8,1,1,'#9affb0']],
    shooter: [[-3,-7,5,6,'#ff8a2a'],[-2,-6,1,1,'#2a1408'],[0,-6,1,1,'#2a1408'],
              [2,-6,4,2,'#6a6f7e'],[5,-6,1,2,'#3a3e48'],
              [-3,-1,2,1,'#c0641a'],[0,-1,2,1,'#c0641a']],
    charger: [[-2,-7,4,6,'#3fd0e0'],[-1,-6,1,1,'#0a2a30'],[0,-6,1,1,'#0a2a30'],
              [-3,-1,2,1,'#2090a0'],[1,-1,2,1,'#2090a0'],
              [-6,-6,2,1,'#bff4fa'],[-6,-4,3,1,'#bff4fa'],[-6,-2,2,1,'#bff4fa']],
    shield: [[-1,-7,4,6,'#9aa4c0'],[0,-6,1,1,'#1a2030'],[2,-6,1,1,'#1a2030'],
             [0,-1,3,1,'#5a6480'],
             [-5,-7,3,6,'#d4b84a'],[-4,-6,1,4,'#fff0a0'],[-5,-7,3,1,'#f0e0a0']],
    rhythm: [[-3,-6,5,5,'#9a6ad0'],[-2,-5,1,1,'#1a1030'],[0,-5,1,1,'#1a1030'],
             [-3,-1,2,1,'#6a3aa0'],[0,-1,2,1,'#6a3aa0'],
             [2,-10,1,5,'#fff0a0'],[2,-6,2,2,'#fff0a0']],
    creep: [[-3,-7,6,5,'#7a5aa0'],[-3,-7,6,1,'#9a7ac0'],
            [-3,-2,2,1,'#7a5aa0'],[0,-2,1,1,'#7a5aa0'],[2,-2,1,1,'#7a5aa0'],
            [-2,-5,2,2,'#1a1030'],[1,-5,2,2,'#1a1030']],
    turret: [[-4,-2,8,2,'#5a6470'],[-3,-2,1,1,'#7a8694'],[2,-2,1,1,'#7a8694'],
             [-3,-6,6,4,'#7a8694'],[-3,-6,6,1,'#98a4b2'],
             [-2,-5,1,1,'#1a2028'],[1,-5,1,1,'#1a2028'],
             [2,-6,5,2,'#444c58'],[6,-6,1,2,'#2a2e36']],
    teleporter: [[-2,-7,4,6,'#b060e0'],[-1,-6,1,1,'#ffffff'],[0,-6,1,1,'#ffffff'],
                 [-3,-1,2,1,'#7a30a0'],[1,-1,2,1,'#7a30a0'],
                 [-5,-8,1,1,'#e0a0ff'],[4,-4,1,1,'#e0a0ff'],[-5,-3,1,1,'#e0a0ff'],[3,-9,1,1,'#e0a0ff']],
    berserker: [[-3,-7,6,6,'#ff6420'],[-5,-6,1,2,'#ff6420'],[4,-6,1,2,'#ff6420'],
                [-3,-9,1,2,'#ff6420'],[2,-9,1,2,'#ff6420'],[-1,-10,1,1,'#ff8a3a'],
                [-2,-5,2,2,'#ffe24a'],[1,-5,2,2,'#ffe24a'],[-1,-5,1,1,'#1a0a06'],[2,-5,1,1,'#1a0a06'],
                [-3,-1,2,1,'#c04010'],[1,-1,2,1,'#c04010']],
    boss: [[-5,-10,10,9,'#c0306a'],[-5,-12,3,2,'#c0306a'],[2,-12,3,2,'#c0306a'],
           [-4,-8,3,3,'#ffe24a'],[1,-8,3,3,'#ffe24a'],[-3,-7,1,1,'#1a0a14'],[2,-7,1,1,'#1a0a14'],
           [-4,-4,8,2,'#7a1c44'],[-3,-4,1,1,'#ffffff'],[-1,-4,1,1,'#ffffff'],[1,-4,1,1,'#ffffff'],[3,-4,1,1,'#ffffff'],
           [-5,-1,3,1,'#7a1c44'],[2,-1,3,1,'#7a1c44']],
    ally: [[-4,-4,6,4,'#d8a878'],[1,-8,5,5,'#e0b486'],[1,-10,2,2,'#a87850'],
           [5,-6,2,2,'#f0d8b8'],[3,-7,1,1,'#1a1410'],[6,-6,1,1,'#1a1410'],
           [-5,-4,1,3,'#c89868'],[-3,-1,1,1,'#b08858'],[1,-1,1,1,'#b08858']],
    spikes: [[-5,-1,10,1,'#9aa0ac'],[-5,-2,1,1,'#aab0bc'],[-4,-3,1,1,'#e8ecf0'],[-3,-2,1,1,'#aab0bc'],
             [-2,-2,1,1,'#aab0bc'],[-1,-3,1,1,'#e8ecf0'],[0,-2,1,1,'#aab0bc'],
             [1,-2,1,1,'#aab0bc'],[2,-3,1,1,'#e8ecf0'],[3,-2,1,1,'#aab0bc']],
    spring: [[-4,-1,8,1,'#2a8ab0'],[-4,-2,8,1,'#5ad8ff'],
             [-3,-4,1,1,'#7ce4ff'],[2,-4,1,1,'#7ce4ff'],[-1,-5,1,1,'#7ce4ff'],[0,-3,1,1,'#7ce4ff'],
             [-4,-7,8,2,'#bff0ff'],[-4,-7,8,1,'#ffffff']],
    ice: [[-2,-9,3,8,'#bfe8ff'],[-4,-5,2,5,'#8fc8e8'],[1,-4,3,4,'#9ed8f4'],
          [-2,-9,3,1,'#ffffff'],[-4,-5,1,1,'#ffffff'],[2,-4,1,1,'#e6f6ff']],
    lava: [[-5,-1,10,1,'#ff5424'],[-4,-2,8,1,'#ff8a3a'],
           [-2,-3,1,1,'#ffd23a'],[-4,-3,1,1,'#ffb03a'],[3,-3,1,1,'#ffb03a'],[0,-4,1,1,'#fff0a0']],
    grapple: [[-1,-9,2,9,'#8a6a3c'],[-1,-9,2,1,'#a8884a'],[-1,-6,2,1,'#6a4e28'],
              [0,-11,4,1,'#e8c860'],[3,-10,1,2,'#e8c860'],[2,-9,1,1,'#e8c860'],[0,-10,1,1,'#fff0a0']],
    wind: [[-5,-6,6,1,'#cfe8ff'],[1,-6,1,1,'#9fc8e8'],[2,-7,1,1,'#9fc8e8'],
           [-5,-4,7,1,'#cfe8ff'],[3,-4,1,1,'#9fc8e8'],
           [-5,-2,5,1,'#cfe8ff'],[1,-2,1,1,'#9fc8e8']],
    magnet: [[-4,-7,3,6,'#e8506a'],[2,-7,3,6,'#e8506a'],[-4,-9,9,2,'#e8506a'],
             [-4,-1,3,1,'#dfe4ea'],[2,-1,3,1,'#dfe4ea'],[-3,-8,1,1,'#ff8a9a']],
    coin: [[-3,-7,6,7,'#f5d020'],[-3,-7,6,1,'#fff2a0'],[-1,-6,2,5,'#fff6c0'],
           [-3,-1,6,1,'#c8a818'],[1,-6,1,1,'#ffffff']],
    ember: [[-2,-8,4,8,'#80f0ff'],[-3,-5,1,3,'#5ad0e8'],[2,-5,1,3,'#5ad0e8'],
            [-2,-8,2,2,'#d8fbff'],[-1,-3,1,1,'#aef2ff'],[0,-6,1,1,'#ffffff']],
  };
  function _stampIcon(c, key, sx, sy, u) {
    const m = _LVL_ICONS[key];
    if (!m) return;
    for (let i = 0; i < m.length; i++) {
      const r = m[i];
      c.fillStyle = r[4];
      c.fillRect(Math.round(sx + r[0] * u), Math.round(sy + r[1] * u),
        Math.max(1, Math.round(r[2] * u)), Math.max(1, Math.round(r[3] * u)));
    }
  }
  function _drawLevelFlag(c, sx, sy, u, accent) {
    c.fillStyle = '#e8e8f0';
    c.fillRect(Math.round(sx - u * 0.3), Math.round(sy - u * 6), Math.max(2, Math.round(u * 0.6)), Math.round(u * 6));
    const ww = Math.sin(tickCount * 0.13) * u * 0.9;
    const rows = [[0, 3], [1, 4], [2, 2]];
    for (let i = 0; i < rows.length; i++) {
      c.fillStyle = (i === 1) ? _shade(accent, 0.18) : accent;
      c.fillRect(Math.round(sx + u * 0.3), Math.round(sy - u * 6 + rows[i][0] * u),
        Math.max(2, Math.round(rows[i][1] * u + ww)), Math.ceil(u));
    }
  }

  // Stamp a small, animated copy of an ACTUAL in-game sprite onto a
  // level island — so the cast is instantly recognisable. `u` is the
  // island cell size; the 32-px sprite is scaled to a few cells. The
  // sprite is anchored centre-x / feet at (sx, sy).
  function _stampGameSprite(c, kind, v, sx, sy, u, frame) {
    c.save();
    c.translate(sx, sy);
    const fe = {
      v: v, hp: 6, maxHp: 6, facingRight: true, elite: false,
      _teleState: 'idle', _teleCd: 0, _turretTele: 0, _turretBurst: 0, _frenzy: false,
    };
    try {
      if (kind === 'turret' && window.drawTurret32) {
        const s = u * 0.13; c.scale(s, s); c.translate(-16, -42);
        window.drawTurret32(c, 0, 0, fe, frame);
      } else if (kind === 'teleporter' && window.drawTeleporter32) {
        const s = u * 0.13; c.scale(s, s); c.translate(-16, -42);
        window.drawTeleporter32(c, 0, 0, fe, frame);
      } else if (kind === 'berserker' && window.drawBerserker32) {
        const s = u * 0.13; c.scale(s, s); c.translate(-16, -42);
        window.drawBerserker32(c, 0, 0, fe, frame);
      } else if (kind === 'summoner' && window.drawSummonerBoss) {
        const s = u * 0.16; c.scale(s, s); c.translate(-16, -44);
        window.drawSummonerBoss(c, 0, 0, fe, frame);
      } else if (kind === 'juggernaut' && window.drawJuggernautBoss) {
        const s = u * 0.16; c.scale(s, s); c.translate(-16, -44);
        window.drawJuggernautBoss(c, 0, 0, fe, frame);
      } else if (kind === 'worldboss' && typeof drawBoss === 'function') {
        const s = u * 0.2; c.scale(s, s); c.translate(-24, -52);
        drawBoss(c, 0, 0, 12, 12, frame, 1, 'neutral');
      } else if (kind === 'drumboss' && typeof drawDrum32 === 'function') {
        const s = u * 0.2; c.scale(s, s); c.translate(-16, -42);
        drawDrum32(c, 0, 0, { v: 0, elite: true }, 6, 6, frame, 'neutral');
      } else if (kind === 'ally' && window.drawMackenzie) {
        const s = u * 0.13; c.scale(s, s); c.translate(-18, -38);
        window.drawMackenzie(c, 0, 0, true, {
          moving: true, tongueFrame: (frame * 0.1) % 1, tailFrame: frame * 0.25,
          walkFrame: (frame >> 3) % 4, sitting: false, bigEyes: true,
        });
      } else if (kind === 'player' && window.drawBagpiper32) {
        const s = u * 0.13; c.scale(s, s); c.translate(-16, -42);
        window.drawBagpiper32(c, 0, 0, true, (frame >> 4) & 1, 0, 0, 0, (frame >> 3) % 4, 'neutral');
      } else if (typeof drawDrum32 === 'function') {
        const s = u * 0.13; c.scale(s, s); c.translate(-16, -42);
        drawDrum32(c, 0, 0, v, 6, 6, frame, 'neutral');
      }
    } catch (e) { }
    c.restore();
  }

  // Island archetypes — the dominant shape of each level sprite.
  // Cycled by (world + level) so a single world's levels never share
  // a silhouette: a rounded mesa, a tall spire, a flat plateau, a
  // tilted slab, a jagged crag, stepped terraces.
  //   hw    half-width      pk    peak height
  //   flat  0=domed 1=flat  slope diagonal tilt
  //   jag   surface noise   bot   underside depth
  //   terr  stepped tiers
  const _ISLAND_ARCHES = [
    { hw: 0.86, pk: 0.34, flat: 0.00, slope: 0.00, jag: 0.05, bot: 1.05, terr: false },
    { hw: 0.54, pk: 0.74, flat: 0.00, slope: 0.00, jag: 0.05, bot: 1.55, terr: false },
    { hw: 0.93, pk: 0.15, flat: 0.86, slope: 0.00, jag: 0.03, bot: 0.66, terr: false },
    { hw: 0.80, pk: 0.40, flat: 0.00, slope: 0.36, jag: 0.05, bot: 1.00, terr: false },
    { hw: 0.88, pk: 0.30, flat: 0.18, slope: -0.14, jag: 0.18, bot: 1.20, terr: false },
    { hw: 0.90, pk: 0.28, flat: 0.50, slope: 0.00, jag: 0.05, bot: 0.86, terr: true },
  ];

  // ── Pixel-art level sprite ──────────────────────────────────────
  // Each level renders as a chunky pixel-art floating island in the
  // same quantised style as the planets. To keep every level visibly
  // distinct it varies: the island ARCHETYPE (shape), a per-level
  // jittered palette, a content-driven surface treatment (charred /
  // snowy / mossy), and the cast staged on top — enemy / boss / ally
  // figures, hazard & ability icons, a goal flag.
  function _drawLevelSprite(c, lvl, cx, cy, size, focused, wIdx1, lvlIdx0, locked) {
    if (!lvl) return;
    const rng = _seedRng(wIdx1 || 1, lvlIdx0 || 0);
    const pc = (lvl.platColors && lvl.platColors.length >= 5)
      ? lvl.platColors : ['#2a3a1a', '#3a5228', '#4a7a38', '#5a9a48', '#6ab858'];
    // Per-level palette jitter so a world's levels don't share a hue.
    const jit = (rng() - 0.5) * 2.0;
    const J = (h) => _jitterColor(h, jit);
    let grass = [J(pc[4]), J(pc[3]), J(pc[2]), _shade(J(pc[2]), -0.3)];
    let rock = [J(pc[1]), J(pc[0]), _shade(J(pc[0]), -0.34), _shade(J(pc[0]), -0.6)];

    // Content-driven surface treatment.
    const theme = (lvl.theme || lvl._bgTheme || '') + '';
    const platTypes = {};
    for (const p of (lvl.platforms || [])) {
      if (p && p.type && p.type !== 'ground') platTypes[p.type] = true;
    }
    let surfFeat = 'grass';
    if (platTypes.lava || /volcan|inferno/i.test(theme)) surfFeat = 'lava';
    else if (platTypes.ice || /frost|froze/i.test(theme) || lvl.weather === 'snow') surfFeat = 'snow';
    else if (/shadow|haunt|hollow|void/i.test(theme)) surfFeat = 'ash';
    if (surfFeat === 'snow') grass = ['#f1f6fc', '#d3e2ef', '#abc3d8', '#7e98b0'];
    else if (surfFeat === 'lava') grass = [_shade(grass[1], -0.18), _shade(grass[2], -0.28), _shade(grass[3], -0.2), '#1c130e'];
    else if (surfFeat === 'ash') grass = [_shade(grass[0], -0.3), _shade(grass[1], -0.35), _shade(grass[2], -0.4), '#15121c'];

    if (locked) {
      grass = ['#6a6f7e', '#4e525d', '#383b44', '#26282f'];
      rock = ['#43464f', '#303239', '#212329', '#14151a'];
    }
    const accent = lvl.accentColor || '#ffd54a';

    const W = size * 0.82;
    const half = W / 2;
    const oy = cy - size * 0.04;
    const GRID = 26;
    const cell = W / GRID;
    const SX = (nx) => cx + nx * half;
    const SY = (ny) => oy + ny * half;

    // ── Archetype-driven silhouette ───────────────────────────
    const A = _ISLAND_ARCHES[((wIdx1 || 0) + (lvlIdx0 || 0)) % _ISLAND_ARCHES.length];
    const hw = A.hw + (rng() - 0.5) * 0.06;
    const ba = rng() * 6.28, bb = 1.6 + rng() * 3, bc = rng() * 6.28;
    const botBias = (rng() - 0.5) * 0.3;
    const surfY = (nx) => {
      const r = Math.max(-1, Math.min(1, nx / hw));
      const dome = Math.sqrt(Math.max(0, 1 - r * r));
      const flatS = Math.abs(r) < 0.66 ? 1 : Math.max(0, (1 - Math.abs(r)) / 0.34);
      const shape = dome * (1 - A.flat) + flatS * A.flat;
      let y = -0.22 - A.pk * shape + A.slope * r;
      y += Math.sin(r * bb + ba) * A.jag + Math.sin(r * 9 + bc) * A.jag * 0.4;
      if (A.terr) y = Math.round(y * 6) / 6;
      return y;
    };
    const botY = (nx) => {
      const t = Math.max(0, 1 - Math.abs(nx) / hw);
      return 0.2 + A.bot * Math.pow(t, 0.7) + Math.sin(nx * 3 + bc) * 0.07 + botBias * t;
    };

    // ── Island body cells ─────────────────────────────────────
    const gyN = Math.round(GRID * 1.55);
    for (let gy = 0; gy < gyN; gy++) {
      const ny = (gy + 0.5) / GRID * 2 - 1.0;
      for (let gx = 0; gx < GRID; gx++) {
        const nx = (gx + 0.5) / GRID * 2 - 1.0;
        if (Math.abs(nx) > hw) continue;
        const gs = surfY(nx), bo = botY(nx);
        if (ny < gs || ny > bo) continue;
        const relTop = ny - gs;
        let ramp, s, col = null;
        if (relTop < 0.2) {
          ramp = grass;
          s = 0.72 - nx * 0.5 - relTop * 1.7 + Math.sin(nx * 11 + gy * 1.3) * 0.12;
        } else {
          ramp = rock;
          const relBot = relTop / Math.max(0.1, bo - gs);
          s = 0.78 - nx * 0.42 - relBot * 0.72 + Math.sin(nx * 8 - gy) * 0.13;
          // Lava levels glow with molten veins in the underside rock.
          if (surfFeat === 'lava' && !locked
            && Math.sin(nx * 13 + gy * 1.7 + bc) + Math.sin(ny * 9 + ba) > 1.5) {
            col = (Math.sin(gy + bc) > 0) ? '#ff7a2a' : '#ffc73a';
          }
        }
        if (!col) {
          const idx = s > 0.62 ? 0 : s > 0.3 ? 1 : s > -0.05 ? 2 : 3;
          col = ramp[idx];
        }
        c.fillStyle = col;
        c.fillRect(Math.floor(SX(nx) - cell / 2 - 0.5), Math.floor(SY(ny) - cell / 2 - 0.5),
          Math.ceil(cell) + 1, Math.ceil(cell) + 1);
      }
    }

    if (locked) {
      _drawPixelMotif(c, 'locked', cx, oy - size * 0.04, cell * 1.6, 0.96);
      return;
    }

    // Accent surface specks.
    c.globalAlpha = 0.7;
    for (let i = 0; i < 5; i++) {
      const nx = (rng() - 0.5) * hw * 1.6;
      c.fillStyle = (surfFeat === 'snow') ? '#ffffff' : accent;
      c.fillRect(Math.round(SX(nx)), Math.round(SY(surfY(nx) + 0.05)),
        Math.max(2, Math.round(cell * 0.6)), Math.max(2, Math.round(cell * 0.6)));
    }
    c.globalAlpha = 1;

    // ── Stage the level's cast ────────────────────────────────
    // Drawn with the ACTUAL in-game sprites (scaled down + animated)
    // so each figure is instantly recognisable. A boss level shows
    // ONLY the boss; otherwise 1-3 enemies plus hazard/item icons.
    const enemiesArr = (lvl.enemies || []).filter(e => e && typeof e.x === 'number');
    const isBossV = (v) => (v === 6 || v === 97 || v === 98 || v === 99);
    const frame = tickCount;

    // Boss level → stage only the boss, big and centred.
    let bossKind = null;
    for (const e of enemiesArr) {
      if (!isBossV(e.v)) continue;
      bossKind = (e.v === 6) ? 'worldboss' : (e.v === 99) ? 'drumboss'
        : (e.v === 98) ? 'summoner' : 'juggernaut';
      break;
    }
    if (bossKind) {
      const bnx = (rng() - 0.5) * 0.14;
      const bbob = Math.sin(tickCount * 0.07) * cell * 0.5;
      _stampGameSprite(c, bossKind, 0, SX(bnx), SY(surfY(bnx)) + cell * 0.5 - bbob, cell * 1.15, frame);
      const fnx0 = hw * 0.62;
      _drawLevelFlag(c, SX(fnx0), SY(surfY(fnx0)) + cell * 0.42, cell, accent);
      return;
    }

    // Non-boss → 1-3 distinct enemies (seeded count), plus the dog
    // ally if the level has one. Only real game sprites are staged —
    // no abstract hazard/collectible icons.
    const distinctV = [];
    for (const e of enemiesArr) {
      if (distinctV.indexOf(e.v) < 0) distinctV.push(e.v);
    }
    const enemyShow = Math.min(distinctV.length, 1 + Math.floor(rng() * 3));
    const staged = [];
    for (let i = 0; i < enemyShow; i++) {
      const v = distinctV[i];
      const k = (v === 12) ? 'turret' : (v === 13) ? 'teleporter'
        : (v === 14) ? 'berserker' : 'enemy';
      staged.push({ kind: k, v: v });
    }
    if (lvl.allies && lvl.allies.length) staged.push({ kind: 'ally', v: 0 });
    // Enemy-free level (puzzle / platforming) — stage the bagpiper so
    // the island is never bare.
    if (staged.length === 0) staged.push({ kind: 'player', v: 0 });

    // Scatter across the surface at varied x, height and size so the
    // staged cast doesn't read as a flat row.
    const lo = -hw * 0.6, hi = hw * 0.46;
    const span = hi - lo;
    const slotN = staged.length;
    for (let i = 0; i < slotN; i++) {
      const it = staged[i];
      const nx = (slotN === 1)
        ? (rng() - 0.5) * hw * 0.5
        : lo + ((i + 0.5) / slotN) * span + (rng() - 0.5) * (span / slotN) * 1.0;
      const gs = surfY(nx);
      const lift = (rng() < 0.5) ? rng() * cell * 2.4 : 0;
      const bob = Math.sin(tickCount * 0.08 + i * 1.3) * cell * 0.22;
      const baseY = SY(gs) + cell * 0.4 - bob - lift;
      const su = cell * (0.88 + rng() * 0.34);
      _stampGameSprite(c, it.kind, it.v, SX(nx), baseY, su, frame);
    }

    // ── Goal flag, planted on the right of the island ─────────
    const fnx = hw * 0.62;
    _drawLevelFlag(c, SX(fnx), SY(surfY(fnx)) + cell * 0.42, cell, accent);
  }

  // ── Single island in the overworld ──────────────────────────────
  // Renders the level diorama at world-space (cx, cy) at the given
  // pixel `size`. Adds a floating-island pedestal under it + a label
  // tab + a soft glow when the player is nearby.
  function _drawIsland(c, cx, cy, size, isl, idx, locked, isNearby, wd) {
    // Floating bob — gentle so the islands don't feel static.
    const bob = Math.sin(tickCount * 0.04 + idx * 0.7) * 4;
    cy = cy + bob;

    // Drop shadow on the ground (large dim ellipse)
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.beginPath();
    c.ellipse(cx, cy + size * 0.32, size * 0.45, size * 0.12, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Pulsing glow when nearby
    if (isNearby) {
      const pulse = 1 + 0.06 * Math.sin(tickCount * 0.18);
      const g = c.createRadialGradient(cx, cy, size * 0.25, cx, cy, size * 0.7 * pulse);
      g.addColorStop(0, (wd.borderColor || '#f5c518') + '55');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(cx - size, cy - size, size * 2, size * 2);
    }

    // Render the pixel-art level sprite — slightly inflated when the
    // player is nearby so it pops. Locked levels render as a cold
    // grey rock with a pixel padlock.
    const drawSize = size * (isNearby ? 1.08 : 1);
    _drawLevelSprite(c, isl.lvl, cx, cy, drawSize, isNearby, wIdx, idx, locked);

    // Number tab above the island
    const tabY = cy - size * 0.55 - 18;
    const tabW = 70;
    const tabH = 22;
    c.save();
    c.fillStyle = isNearby ? (wd.borderColor || '#f5c518') : 'rgba(8,4,22,0.78)';
    c.strokeStyle = wd.borderColor || '#f5c518';
    c.lineWidth = 1.5;
    c.fillRect(cx - tabW / 2, tabY - tabH / 2, tabW, tabH);
    c.strokeRect(cx - tabW / 2, tabY - tabH / 2, tabW, tabH);
    c.font = "9px 'Press Start 2P', monospace";
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = isNearby ? '#0a0418' : (wd.borderColor || '#f5c518');
    c.fillText('W' + wIdx + '-' + (idx + 1), cx, tabY);
    c.restore();

    // Star count tucked under the tab
    if (!locked) {
      const starCount = _stars()[wIdx + '-' + (idx + 1)] || 0;
      c.save();
      c.font = "9px 'Press Start 2P', monospace";
      c.textAlign = 'center';
      c.fillStyle = '#f5c518';
      c.fillText('★'.repeat(starCount) + '☆'.repeat(3 - starCount), cx, tabY + 18);
      c.restore();
    }
  }

  // Player avatar in the overworld (uses the same bagpiper sprite).
  function _drawWorldAvatar(c, s2w) {
    try {
      if (typeof drawBagpiper32 !== 'function') return;
      const p = s2w(avatar.x, avatar.y);
      const ox = (p.x - 16) | 0;
      const oy = (p.y - 24) | 0;
      // Ground shadow
      c.save();
      c.translate(p.x, p.y + 8);
      c.scale(1, 0.35);
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.beginPath();
      c.arc(0, 0, 12, 0, Math.PI * 2);
      c.fill();
      c.restore();
      const moving = (Math.abs(avatar.vx) > 0.05 || Math.abs(avatar.vy) > 0.05);
      const walkFrame = moving ? ((tickCount >> 2) % 4) : 0;
      drawBagpiper32(c, ox, oy, avatar.facing > 0, (tickCount >> 4) & 1, 0, 0, 0, walkFrame, 'neutral');
    } catch (e) { }
  }

  // ── Mini-map (top-right corner) ─────────────────────────────────
  // Pixel overview of the overworld so the player knows where they
  // are. Islands appear as dots in the world's accent color; the
  // avatar is a bright cyan dot.
  function _drawMiniMap(c, wd) {
    const mmW = 120, mmH = 80;
    const mmX = VIEW_W - mmW - 12;
    const mmY = 60;
    c.save();
    c.fillStyle = 'rgba(8,4,22,0.7)';
    c.strokeStyle = (wd.borderColor || '#f5c518') + '88';
    c.lineWidth = 1.5;
    c.fillRect(mmX, mmY, mmW, mmH);
    c.strokeRect(mmX, mmY, mmW, mmH);
    if (worldW > 0 && worldH > 0) {
      const sx = mmW / (worldW + 200);
      const sy = mmH / (worldH + 200);
      const off = 100;
      // Islands
      for (let i = 0; i < islands.length; i++) {
        const isl = islands[i];
        const px = mmX + (isl.wx + off) * sx;
        const py = mmY + (isl.wy + off) * sy;
        c.fillStyle = (i === nearbyIdx) ? '#fff' : (wd.borderColor || '#f5c518');
        c.beginPath();
        c.arc(px, py, (i === nearbyIdx) ? 3 : 2, 0, Math.PI * 2);
        c.fill();
      }
      // Avatar
      const ax = mmX + (avatar.x + off) * sx;
      const ay = mmY + (avatar.y + off) * sy;
      c.fillStyle = '#88e8ff';
      c.beginPath();
      c.arc(ax, ay, 2.5, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // ── Info card — pops up when player is near an island ───────────
  // Shows level name, stars, best score / coins / embers / time /
  // deaths from previous clears. Smooth fade controlled by infoAlpha.
  function _drawInfoCard(c, isl, wd, editOn) {
    const key = wIdx + '-' + (isl.idx + 1);
    const stars = _stars()[key] || 0;
    const bests = (typeof window !== 'undefined' && window.levelBests) ? (window.levelBests[key] || {}) : {};
    const cleared = stars > 0 || (bests.clears | 0) > 0;
    const unlocked = _unlocked(wIdx);
    const unlockAll = (function () { try { return localStorage.getItem('pogl_unlock_all') === '1'; } catch (e) { return false; } })();
    const locked = !unlockAll && isl.idx >= unlocked;

    const cardW = Math.min(380, VIEW_W * 0.42);
    const cardH = locked ? 88 : 168;
    const cardX = VIEW_W - cardW - 14;
    const cardY = VIEW_H - cardH - 14;

    c.save();
    c.globalAlpha = infoAlpha;
    // Glass card
    c.fillStyle = 'rgba(8,4,22,0.86)';
    c.strokeStyle = (wd.borderColor || '#f5c518');
    c.lineWidth = 2;
    c.fillRect(cardX, cardY, cardW, cardH);
    c.strokeRect(cardX, cardY, cardW, cardH);
    // Header bar
    c.fillStyle = (wd.borderColor || '#f5c518');
    c.fillRect(cardX, cardY, cardW, 26);
    c.font = "10px 'Press Start 2P', monospace";
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillStyle = '#0a0418';
    c.fillText('W' + wIdx + '-' + (isl.idx + 1), cardX + 12, cardY + 13);
    c.textAlign = 'right';
    c.fillText(cleared ? '✓ CLEARED' : (locked ? '🔒 LOCKED' : 'NEW'), cardX + cardW - 12, cardY + 13);
    // Level name
    c.textAlign = 'left';
    c.font = "9px 'Press Start 2P', monospace";
    c.fillStyle = '#fff';
    const name = (isl.name || '').toString().substring(0, 28);
    c.fillText(name, cardX + 12, cardY + 44);
    if (locked) {
      c.font = "8px 'Press Start 2P', monospace";
      c.fillStyle = '#aaa';
      c.fillText('CLEAR THE PRIOR LEVEL', cardX + 12, cardY + 68);
      c.restore();
      return;
    }
    // Stars
    c.font = "12px 'Press Start 2P', monospace";
    c.fillStyle = '#f5c518';
    c.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), cardX + 12, cardY + 68);
    // Bests grid (2 cols × 3 rows)
    c.font = "7px 'Press Start 2P', monospace";
    // Ember denominator is the level's ACTUAL ember count (some
    // levels carry only 1 or 2) — not a hardcoded /3.
    const _emberTotal = (isl.lvl && Array.isArray(isl.lvl.spiritEmbers))
      ? isl.lvl.spiritEmbers.length : 3;
    const labels = [
      ['BEST SCORE', (bests.score != null) ? bests.score.toLocaleString() : '—'],
      ['COINS', (bests.coins != null) ? bests.coins : '—'],
      ['EMBERS', (_emberTotal === 0)
        ? '—'
        : ((bests.embers != null ? bests.embers : 0) + '/' + _emberTotal)],
      ['BEST TIME', (bests.time != null) ? (bests.time.toFixed(1) + 's') : '—'],
      ['DEATHS', (bests.deaths != null) ? bests.deaths : '—'],
      ['CLEARS', (bests.clears != null) ? bests.clears : '0'],
    ];
    const colW = (cardW - 24) / 2;
    for (let i = 0; i < labels.length; i++) {
      const col = i % 2;
      const row = (i / 2) | 0;
      const lx = cardX + 12 + col * colW;
      const ly = cardY + 90 + row * 22;
      c.fillStyle = '#888';
      c.fillText(labels[i][0], lx, ly);
      c.fillStyle = '#fff';
      c.font = "9px 'Press Start 2P', monospace";
      c.fillText(String(labels[i][1]), lx, ly + 12);
      c.font = "7px 'Press Start 2P', monospace";
    }
    // Hint at the bottom
    c.fillStyle = (wd.borderColor || '#f5c518');
    c.textAlign = 'center';
    c.font = "7px 'Press Start 2P', monospace";
    const hint = editOn ? '▶ ENTER  PLAY        F  EDIT' : '▶ ENTER  PLAY';
    c.fillText(hint, cardX + cardW / 2, cardY + cardH - 9);
    c.restore();
  }

  // ── Touch controls ──────────────────────────────────────────────
  // An on-screen BACK button (both views) and big cycle arrows
  // (galaxy view) so the worldmap is fully playable by touch. Hit
  // rects are stashed in _touchUI for handlePointer().
  function _drawTouchBtn(c, r, label, glyph) {
    c.save();
    c.fillStyle = 'rgba(8,4,22,0.78)';
    c.strokeStyle = 'rgba(255,255,255,0.28)';
    c.lineWidth = 2;
    c.fillRect(r.x, r.y, r.w, r.h);
    c.strokeRect(r.x, r.y, r.w, r.h);
    c.fillStyle = '#f5c518';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    if (glyph) {
      c.font = (Math.min(34, r.h * 0.6) | 0) + "px sans-serif";
      c.fillText(glyph, r.x + r.w / 2, r.y + r.h / 2 + 1);
    } else {
      c.font = "9px 'Press Start 2P', monospace";
      c.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
    }
    c.restore();
  }

  // Read the device safe-area insets (notch / rounded corners) in
  // canvas pixels, so the touch UI never lands under a notch.
  function _safeInset() {
    try {
      const cs = getComputedStyle(document.documentElement);
      const p = (v) => { const n = parseFloat(cs.getPropertyValue(v)); return isFinite(n) ? n : 0; };
      return { l: p('--game-safe-left'), r: p('--game-safe-right'),
               t: p('--game-safe-top'), b: p('--game-safe-bottom') };
    } catch (e) { return { l: 0, r: 0, t: 0, b: 0 }; }
  }

  // Compute the touch-UI hit rects for the current view/size. Kept
  // separate from drawing so handlePointer() can lay them out even on
  // the very first touch (before the next draw frame paints them).
  // Everything is inset from the screen edges + safe area so nothing
  // gets clipped on notched phones.
  function _layoutTouchUI(isGalaxy) {
    const si = _safeInset();
    const M = 20;
    _touchUI.back = { x: M + si.l, y: M + si.t, w: 92, h: 36 };
    if (isGalaxy) {
      const aw = 58, ah = 104;
      const ay = (VIEW_H - ah) / 2;
      _touchUI.arrowL = { x: M + si.l, y: ay, w: aw, h: ah };
      _touchUI.arrowR = { x: VIEW_W - aw - M - si.r, y: ay, w: aw, h: ah };
      _touchUI.stick = null;
      _touchUI.run = null;
    } else {
      _touchUI.arrowL = null;
      _touchUI.arrowR = null;
      // Movement joystick on the lower-left, RUN button lower-right.
      const sr = Math.min(70, VIEW_H * 0.16);
      _touchUI.stick = { cx: M + si.l + sr, cy: VIEW_H - M - si.b - sr, r: sr };
      const rr = Math.min(54, VIEW_H * 0.12);
      _touchUI.run = { cx: VIEW_W - M - si.r - rr, cy: VIEW_H - M - si.b - rr, r: rr };
    }
  }

  function _updateStick(cx, cy) {
    const s = _touchUI.stick;
    if (!s) return;
    let dx = cx - s.cx, dy = cy - s.cy;
    const d = Math.hypot(dx, dy);
    if (d > s.r) { dx = dx / d * s.r; dy = dy / d * s.r; }
    _stick.dx = dx / s.r;
    _stick.dy = dy / s.r;
  }

  function _drawTouchControls(c, isGalaxy) {
    _layoutTouchUI(isGalaxy);
    // BACK button — top-left corner, clear of the centered titles.
    _drawTouchBtn(c, _touchUI.back, 'BACK', null);
    if (isGalaxy) {
      // Big cycle arrows hugging the left/right edges, vertically centered.
      _drawTouchBtn(c, _touchUI.arrowL, null, '◀');
      _drawTouchBtn(c, _touchUI.arrowR, null, '▶');
      return;
    }
    // ── World view: virtual joystick + RUN button ──────────────
    c.save();
    const s = _touchUI.stick;
    if (s) {
      c.fillStyle = 'rgba(8,4,22,0.5)';
      c.strokeStyle = 'rgba(255,255,255,0.3)';
      c.lineWidth = 2;
      c.beginPath(); c.arc(s.cx, s.cy, s.r, 0, Math.PI * 2); c.fill(); c.stroke();
      const kx = s.cx + _stick.dx * s.r * 0.62;
      const ky = s.cy + _stick.dy * s.r * 0.62;
      c.fillStyle = (_stick.id >= 0) ? 'rgba(140,200,255,0.9)' : 'rgba(200,210,240,0.6)';
      c.beginPath(); c.arc(kx, ky, s.r * 0.44, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
    }
    const r = _touchUI.run;
    if (r) {
      c.fillStyle = _runBtn.down ? 'rgba(30,60,30,0.82)' : 'rgba(8,4,22,0.6)';
      c.strokeStyle = _runBtn.down ? 'rgba(140,220,80,0.9)' : 'rgba(255,255,255,0.32)';
      c.lineWidth = 2;
      c.beginPath(); c.arc(r.cx, r.cy, r.r, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#f5c518';
      c.font = (Math.min(12, r.r * 0.34) | 0) + "px 'Press Start 2P', monospace";
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('RUN', r.cx, r.cy + 1);
    }
    c.restore();
  }

  // Shared "drill in" action — used by ENTER key, gamepad, and a tap
  // on the focused galaxy/world planet.
  function _galaxyDrillIn() {
    const cats = _collectCategories();
    if (!cats.length) return;
    const list = (mode === 'category') ? cats : cats[gIdx].worlds;
    if (mode === 'category') {
      if (cats[gIdx].worlds.length === 1) {
        wIdx = cats[gIdx].worlds[0].i + 1;
        _enterWorldMap(wIdx);
      } else {
        mode = 'world';
        subIdx = 0;
        try { if (window.sfx) window.sfx('checkpoint'); } catch (e) { }
      }
    } else {
      const entry = list[subIdx];
      const w1 = entry ? entry.i + 1 : -1;
      if (entry && _accessible(w1)) {
        wIdx = w1;
        _enterWorldMap(w1);
        _pendingBuyWorld = -1;
      } else if (entry && _premiumBuyable(w1)) {
        // Two-step confirm so a stray tap/press never spends currency.
        if (_pendingBuyWorld === w1 && _pendingBuyTimer > 0) {
          if (typeof purchaseWorld === 'function' && purchaseWorld(w1)) {
            _pendingBuyWorld = -1;
            try { if (window.sfx) window.sfx('castle'); } catch (e) { }
            wIdx = w1;
            _enterWorldMap(w1);
          }
        } else {
          _pendingBuyWorld = w1;
          _pendingBuyTimer = 200;
          try { if (window.sfx) window.sfx('checkpoint'); } catch (e) { }
        }
      } else {
        try { if (window.sfx) window.sfx('hit'); } catch (e) { }
      }
    }
  }

  // Pointer/tap routing. cx/cy are canvas-space coordinates. `type`
  // is 'down' | 'move' | 'up'; `id` is the pointer id (so multiple
  // fingers — joystick + RUN — track independently).
  function handlePointer(cx, cy, type, id) {
    type = type || 'down';
    if (id == null) id = 0;
    _layoutTouchUI(view === 'galaxy');

    // ── MOVE — drag the active joystick ────────────────────────
    if (type === 'move') {
      if (view === 'world' && _stick.id === id) _updateStick(cx, cy);
      return;
    }
    // ── UP — release joystick / RUN held by this finger ────────
    if (type === 'up') {
      if (_stick.id === id) { _stick.id = -1; _stick.dx = 0; _stick.dy = 0; }
      if (_runBtn.id === id) { _runBtn.id = -1; _runBtn.down = false; }
      return;
    }

    // ── DOWN ───────────────────────────────────────────────────
    // World view: joystick / RUN zones claim the touch first.
    if (view === 'world' && _touchUsed) {
      const s = _touchUI.stick;
      if (s && Math.hypot(cx - s.cx, cy - s.cy) < s.r * 1.7 && _stick.id < 0) {
        _stick.id = id;
        _updateStick(cx, cy);
        walkTarget = null;
        return;
      }
      const r = _touchUI.run;
      if (r && Math.hypot(cx - r.cx, cy - r.cy) < r.r * 1.3) {
        _runBtn.id = id;
        _runBtn.down = true;
        return;
      }
    }
    // BACK button works in either view — only when the on-screen
    // touch UI is actually visible (i.e. the player has touched the
    // screen). On desktop the buttons aren't drawn, so a mouse click
    // in the corner must NOT trigger an invisible hit zone.
    const b = _touchUsed ? _touchUI.back : null;
    if (b && cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
      if (view === 'world') {
        _syncGalaxyToWorld(wIdx);
        view = 'galaxy';
      } else if (mode === 'world') {
        mode = 'category'; subIdx = 0;
      } else {
        close();
      }
      try { if (window.sfx) window.sfx('coin'); } catch (e) { }
      return;
    }
    if (view === 'galaxy') {
      const cats = _collectCategories();
      if (!cats.length) return;
      const list = (mode === 'category') ? cats : cats[gIdx].worlds;
      const N = list.length;
      // Cycle arrows — only when the touch UI is visible (see BACK above).
      const aL = _touchUsed ? _touchUI.arrowL : null;
      const aR = _touchUsed ? _touchUI.arrowR : null;
      if (aL && cx >= aL.x && cx <= aL.x + aL.w && cy >= aL.y && cy <= aL.y + aL.h) {
        if (mode === 'category') gIdx = (gIdx - 1 + N) % N; else subIdx = (subIdx - 1 + N) % N;
        try { if (window.sfx) window.sfx('coin'); } catch (e) { }
        return;
      }
      if (aR && cx >= aR.x && cx <= aR.x + aR.w && cy >= aR.y && cy <= aR.y + aR.h) {
        if (mode === 'category') gIdx = (gIdx + 1) % N; else subIdx = (subIdx + 1) % N;
        try { if (window.sfx) window.sfx('coin'); } catch (e) { }
        return;
      }
      // Tap a planet — focus it, or drill in if already focused.
      const orbitR = _orbitR();
      const ccx = VIEW_W / 2;
      const ccy = VIEW_H / 2 - orbitR * 0.2;
      const baseSize = Math.min(VIEW_W, VIEW_H) * 0.22;
      const curFocus = (mode === 'category') ? gIdx : subIdx;
      let best = -1, bestD = 1e9;
      for (let i = 0; i < N; i++) {
        const ang = gAng - (i * Math.PI * 2 / N);
        const depth = (Math.sin(ang) + 1) * 0.5;
        const px = ccx + Math.cos(ang) * orbitR * zoom;
        const py = ccy + Math.sin(ang) * orbitR * zoom * 0.45;
        const size = ((i === curFocus) ? baseSize * 1.25 : baseSize * 0.82) * (0.7 + depth * 0.6);
        const hitR = size * 0.55;
        const d = Math.hypot(cx - px, cy - py);
        if (d < hitR && d < bestD) { bestD = d; best = i; }
      }
      if (best >= 0) {
        if (best === curFocus) {
          _galaxyDrillIn();
        } else {
          if (mode === 'category') gIdx = best; else subIdx = best;
          try { if (window.sfx) window.sfx('coin'); } catch (e) { }
        }
      }
      return;
    }
    if (view === 'world') {
      if (!islands.length) return;
      // Convert tap → world-space.
      const camX = cameraX - VIEW_W / 2;
      const camY = cameraY - VIEW_H / 2;
      const wx = cx + camX, wy = cy + camY;
      // Tap an island — enter if accessible & already nearby, else walk to it.
      const unlocked = _unlocked(wIdx);
      const unlockAll = (function () { try { return localStorage.getItem('pogl_unlock_all') === '1'; } catch (e) { return false; } })();
      let hitIsl = -1, hitD = 130 * 130;
      for (let i = 0; i < islands.length; i++) {
        const isl = islands[i];
        const dxn = isl.wx - wx, dyn = (isl.wy + 40) - wy;
        const d2 = dxn * dxn + dyn * dyn;
        if (d2 < hitD) { hitD = d2; hitIsl = i; }
      }
      if (hitIsl >= 0) {
        const isl = islands[hitIsl];
        if (hitIsl === nearbyIdx) {
          const accessible = _accessible(wIdx);
          if (accessible && (unlockAll || hitIsl < unlocked)) {
            try { if (window.stopMenuMusic) window.stopMenuMusic(); } catch (e) { }
            try { if (window.UI && window.UI.startGame) window.UI.startGame(wIdx, hitIsl + 1); } catch (e) { }
          } else {
            try { if (window.sfx) window.sfx('hit'); } catch (e) { }
          }
          return;
        }
        // Walk toward the island so proximity opens its info card.
        walkTarget = { x: isl.wx, y: isl.wy + 120 };
        return;
      }
      // Empty tap — walk toward the point.
      walkTarget = { x: wx, y: wy };
      return;
    }
  }

  // ── Wallet readout ───────────────────────────────────────────────
  // Small spendable-currency pill in the top-centre of both views, so
  // the player always sees what they have to spend in the shop.
  function _drawWalletReadout(c) {
    if (!window.GameWallet) return;
    const coins = GameWallet.getCoins();
    const embers = GameWallet.getEmbers();
    const txt = '\u{1FA99} ' + coins + '    \u{1F525} ' + embers;
    c.save();
    c.font = '12px "Press Start 2P", monospace';
    c.textBaseline = 'middle';
    const tw = c.measureText(txt).width;
    const padX = 14, h = 26;
    const w = tw + padX * 2;
    const safe = _safeInset();
    const x = (VIEW_W - w) / 2;
    const y = 10 + (safe.t || 0);
    c.globalAlpha = 0.78;
    c.fillStyle = 'rgba(4,3,18,0.7)';
    if (c.roundRect) { c.beginPath(); c.roundRect(x, y, w, h, 10); c.fill(); }
    else c.fillRect(x, y, w, h);
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(245,197,24,0.45)';
    c.lineWidth = 1;
    if (c.roundRect) { c.stroke(); } else c.strokeRect(x, y, w, h);
    c.textAlign = 'left';
    c.fillStyle = '#ffe27a';
    c.fillText(txt, x + padX, y + h / 2 + 1);
    c.restore();
  }

  function draw(c) {
    if (view === 'galaxy') { _drawGalaxy(c); if (_touchUsed) _drawTouchControls(c, true); }
    else if (view === 'world') { _drawWorld(c); if (_touchUsed) _drawTouchControls(c, false); }
    _drawWalletReadout(c);
  }

  // ── Expose ──────────────────────────────────────────────────────
  window.GameWorldMap = {
    open, openAtLevel, close, tick, draw, handlePointer,
    // expose state so the inline gameLoop can branch on it
    get view() { return view; },
    set view(v) { view = v; },
    get gIdx() { return gIdx; },
    get wIdx() { return wIdx; },
    // Force a layout rebuild (called from UI if WORLDS mutates)
    invalidate() {
      lastBuildSig = ''; if (view === 'world') {
        const ws = _worlds(); _layoutNodes(ws[wIdx - 1]);
      }
    },
  };
})();
