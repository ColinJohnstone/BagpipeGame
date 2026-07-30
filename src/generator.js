// src/generator.js
// ──────────────────────────────────────────────────────────────────
// Procedural level generator — Phase 5 of the module split.
//
// Templated level generator that stitches hand-authored encounters
// along a pacing curve. Output is plain JSON-safe LevelData consumed
// by the existing engine + builder pipeline.
//
// Pure: takes options (theme/weather/length/difficulty/terrains/seed)
// and returns a level. No engine state read or written. Theme palette
// lookups go through THEMES_PC / THEMES_BG, which are bare-window
// globals exposed by src/themes.js — load this AFTER themes.js.
//
// Test surface: test/test-generator.mjs sandboxes this module + the
// inline HTML body and calls buildRandomLevel() repeatedly for a
// winnability harness.
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  // ═══════════════════════════════════════════════════════════════
  //  LEVEL GENERATOR — procedural, Minecraft-style "fresh world"
  //  The user picks theme/weather/music/length/difficulty/terrains
  //  in s-generator, the rest is rolled by a seeded RNG so the same
  //  seed always produces the same level. Output goes into WORLDS[97]
  //  so the existing level loader / builder pipeline can consume it.
  // ═══════════════════════════════════════════════════════════════
  // ═════════════════════════════════════════════════════════════════════
  // TEMPLATED LEVEL GENERATOR — Phase 1
  // ─────────────────────────────────────────────────────────────────────
  // Replaces the noisy "place random platforms" approach with stitched
  // hand-authored encounters arranged along a pacing curve. Levels feel
  // intentional because the building blocks ARE intentional — each
  // template is a specific gameplay situation (a sniper gap, a precision
  // jump chain, a recovery beat), not a procedural blob.
  //
  // High-level flow per generation:
  //   1.  Resolve a pacing curve from (length, difficulty) → list of slots.
  //       Each slot has an intensity 0..1 and a category (intro / ramp /
  //       challenge / breather / climax / finale).
  //   2.  For every slot, pick a compatible template (intensity match,
  //       theme allowed, terrain budget, not the same template as the
  //       previous slot).
  //   3.  Instantiate each template at a running x-cursor, stitched on a
  //       shared ground rail. Templates own their internal geometry,
  //       enemies, hazards, and pickups.
  //   4.  Place start / goal / checkpoints / palette / metadata.
  //
  // The opt-in flag is opts.useTemplates === true. Old buildRandomLevel
  // stays untouched as the default until Phase 3 lands and we flip it.
  // ═════════════════════════════════════════════════════════════════════

  // ── Seeded RNG helper (matches buildRandomLevel's algorithm) ─────────
  function makeSeededRng(seedRaw) {
    const seedStr = String(seedRaw == null || seedRaw === '' ? Date.now() : seedRaw);
    let s = 0;
    for (let i = 0; i < seedStr.length; i++) s = ((s << 5) - s + seedStr.charCodeAt(i)) | 0;
    s = (s ^ 0x9E3779B9) >>> 0; if (!s) s = 1;
    const rng = () => {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    rng.seedStr = seedStr;
    rng.int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
    rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
    rng.chance = (p) => rng() < p;
    return rng;
  }

  // ── (Templated builder removed 2026-05-18) ─────────────────────
  // The templated mode lived here through Phase 5 but never produced
  // levels that played meaningfully differently from buildRandomLevel.
  // The "ENCOUNTER_TEMPLATES" catalog and pacing-curve stitching are
  // gone; if we want curated templates back, the cleaner approach is
  // to put hand-authored levels in /levels/ and tune the random
  // generator below to be more interesting on its own.


  function buildRandomLevel(opts) {
    const o = opts || {};
    const theme = o.theme || 'highland';
    const weather = o.weather || 'none';
    const music = o.music || '';
    const allowed = (o.terrains && o.terrains.length) ? o.terrains.slice() : ['normal'];
    const itemSet = (o.items && Array.isArray(o.items)) ? o.items.slice()
      : ['rapid', 'big', 'bomb', 'chargerefresh', 'extrajump', 'shield', 'heal', 'qblock', 'cblock'];
    const enemyVariantsAllowed = (o.enemyVariants && o.enemyVariants.length) ? o.enemyVariants.slice() : [0, 1, 3, 4];
    const length = o.length || 'medium';
    const diff = o.difficulty || 'medium';
    const shape = o.shape || 'mixed';                         // 'horizontal' | 'mixed' | 'vertical'
    const seedRaw = (o.seed == null || o.seed === '') ? Date.now() : o.seed;
    let s = 0;
    const seedStr = String(seedRaw);
    for (let i = 0; i < seedStr.length; i++) s = ((s << 5) - s + seedStr.charCodeAt(i)) | 0;
    s = (s ^ 0x9E3779B9) >>> 0; if (!s) s = 1;
    const rng = () => {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const ri = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];
    const has = (arr, v) => arr.indexOf(v) >= 0;

    // ── Level dimensions / shape ──────────────────────────────────────
    // Three shapes:
    //   horizontal — wide level, classic side-scroller, single tier of ground
    //   mixed      — wide AND tall; multi-tier ground with vertical climbs between
    //   vertical   — tall narrow tower; goal at the top, spawn at the bottom
    let W, H, voidY, start, goal;
    if (shape === 'vertical') {
      W = length === 'short' ? 1200 : length === 'long' ? 1600 : 1400;
      H = length === 'short' ? 1300 : length === 'long' ? 2200 : 1700;
      voidY = H - 60;
      start = { x: 60, y: voidY - 60 };
      goal = { x: W - 200, y: 80 };
    } else if (shape === 'mixed') {
      W = length === 'short' ? 2400 : length === 'long' ? 4400 : 3200;
      H = length === 'short' ? 800 : length === 'long' ? 1100 : 950;
      voidY = H - 60;
      start = { x: 60, y: voidY - 70 };
      goal = { x: W - 160, y: 200 };
    } else { // horizontal
      W = length === 'short' ? 2400 : length === 'long' ? 5200 : 3600;
      H = 560;
      voidY = 460;
      start = { x: 60, y: 380 };
      goal = { x: W - 120, y: 310 };
    }

    const platforms = [];
    const icePlats = [];
    const bounces = [];
    const movingPlats = [];
    const enemies = [];
    const coins = [];
    const qblocks = [];
    const cblocks = [];
    const trophies = [];
    const powerupItems = [];
    const checkpoints = [];
    const spiritEmbers = [];
    const spikes = [];

    // Helper that emits a platform of the given terrain type, sized + positioned at (cx, py, pw)
    const placeTerrain = (cx, py, pw, terrainType) => {
      if (terrainType === 'ice') icePlats.push({ x: cx, y: py, w: pw, h: 18 });
      else if (terrainType === 'bounce') {
        platforms.push({ x: cx - 6, y: py + 14, w: pw + 12, h: 12, type: 'ground' });
        bounces.push({ x: cx, y: py, w: pw, h: 14 });
      } else if (terrainType === 'moving') {
        const horiz = rng() < 0.5;
        const dist = ri(120, 240);
        movingPlats.push({
          x: cx, y: py, w: pw, h: 14, speed: 1.2 + rng() * 0.8,
          x2: cx + (horiz ? dist : 0),
          y2: py + (horiz ? 0 : -dist),
        });
      } else if (terrainType === 'oneway') platforms.push({ x: cx, y: py, w: pw, h: 14, type: 'oneway' });
      else if (terrainType === 'soundwave') platforms.push({ x: cx, y: py, w: pw, h: 18, type: 'soundwave', _id: 'gen_sw_' + cx + '_' + py });
      else if (terrainType === 'crumble') platforms.push({ x: cx, y: py, w: pw, h: 18, type: 'crumble', _id: 'gen_cr_' + cx + '_' + py });
      else if (terrainType === 'breakshot') platforms.push({ x: cx, y: py, w: pw, h: 18, type: 'breakshot', _id: 'gen_bs_' + cx + '_' + py });
      // ── New expansion-pack terrain types in the generator ────────
      else if (terrainType === 'conveyor') {
        platforms.push({ x: cx, y: py, w: pw, h: 16, type: 'conveyor', dir: rng() < 0.5 ? -1 : 1, speed: 1.4 + rng() * 0.6 });
      }
      else if (terrainType === 'timed') {
        platforms.push({ x: cx, y: py, w: pw, h: 18, type: 'timed', period: 150 + ri(0, 90), _id: 'gen_tm_' + cx + '_' + py });
      }
      else if (terrainType === 'fallaway') {
        platforms.push({ x: cx, y: py, w: pw, h: 18, type: 'fallaway', _id: 'gen_fa_' + cx + '_' + py });
      }
      else if (terrainType === 'magnetic') {
        // Smaller point block instead of a wide rail — magnets are
        // 1-tile pulls anchored on a normal walkway underneath.
        platforms.push({ x: cx + Math.max(0, (pw - 32) / 2), y: py - 28, w: 32, h: 32, type: 'magnetic', radius: 130, pull: 0.55 });
        platforms.push({ x: cx, y: py, w: pw, h: 18 });
      }
      else if (terrainType === 'windtunnel') {
        // Tall vertical column with optional ground at the base.
        platforms.push({ x: cx + Math.max(0, (pw - 60) / 2), y: py - 100, w: 60, h: 120, type: 'windtunnel', lift: 0.85 });
        platforms.push({ x: cx, y: py, w: pw, h: 18 });
      }
      else if (terrainType === 'rotating') {
        // Orbital platform centered on (cx, py).
        const radius = 60 + ri(0, 40);
        platforms.push({
          x: cx, y: py, w: Math.min(pw, 80), h: 16, type: 'rotating',
          cx: cx + pw / 2, cy: py, radius, speed: 0.012 + rng() * 0.018,
          startAngle: rng() * Math.PI * 2,
          _id: 'gen_rt_' + cx + '_' + py,
        });
      }
      else if (terrainType === 'water') {
        // Water trough with normal ground walls on each side so it
        // reads as a pool the player has to swim through.
        platforms.push({ x: cx, y: py, w: pw, h: 50, type: 'water' });
        platforms.push({ x: cx, y: py + 50, w: pw, h: 14 });
      }
      else if (terrainType === 'grapplehook') {
        // Drop a grapple anchor above a small normal platform.
        platforms.push({ x: cx + Math.max(0, (pw - 24) / 2), y: py - 70, w: 24, h: 24, type: 'grapplehook' });
        platforms.push({ x: cx, y: py, w: pw, h: 18 });
      }
      else platforms.push({ x: cx, y: py, w: pw, h: 18 });
    };

    // ── Ground floor — vertical shape gets just a small launch pad at the bottom ──
    if (shape === 'vertical') {
      platforms.push({ x: 0, y: voidY, w: W, h: 60, type: 'ground' });
    } else {
      const gapChance = diff === 'easy' ? 0.05 : diff === 'hard' ? 0.22 : 0.12;
      const groundY = shape === 'mixed' ? voidY - 60 : 450;
      let gx = 0;
      while (gx < W) {
        const segLen = Math.min(180 + ri(0, 320), W - gx);
        platforms.push({ x: gx, y: groundY, w: segLen, h: 60, type: 'ground' });
        gx += segLen;
        // Floor gap. Capped at 96px so it never exceeds the player's ~128px
        // max horizontal jump (the test harness samples at 32px columns, so
        // the old 70..150px range could register as a 160px unwinnable void).
        if (gx > 240 && gx < W - 240 && rng() < gapChance) gx += 50 + ri(0, 46);
      }
    }

    // ── Vertical climb generator: tall narrow level, platforms zig-zag upward ──
    if (shape === 'vertical') {
      // 14-22 climbing tiers spaced ~70-100 px apart vertically
      let py = voidY - 100, side = 1, lastX = 60;
      let tier = 0;
      while (py > 160 && tier < 30) {
        const pw = ri(100, 160);
        // Alternate sides (zig-zag) so the player must traverse left↔right while climbing
        const minX = 80, maxX = W - 80 - pw;
        let cx;
        if (side > 0) cx = lastX + ri(120, 220);
        else cx = lastX - ri(120, 220);
        cx = Math.max(minX, Math.min(maxX, cx));
        if (Math.abs(cx - lastX) < 80) side = -side, cx = side > 0 ? lastX + 140 : lastX - 140;
        cx = Math.max(minX, Math.min(maxX, cx));
        const t = pick(allowed);
        placeTerrain(cx, py, pw, t);
        // Coins on / above platform
        if (rng() < 0.55) coins.push({ x: cx + pw / 2 - 8, y: py - 28 });
        // Occasional ?-block above
        if (has(itemSet, 'qblock') && rng() < 0.08) qblocks.push({ x: cx + pw / 2 - 14, y: py - 56 });
        // Side flip — switch which way next platform goes most of the time
        if (rng() < 0.7) side = -side;
        lastX = cx;
        py -= ri(80, 110);
        tier++;
      }
      // Final goal landing
      platforms.push({ x: goal.x - 40, y: goal.y + 60, w: 200, h: 50, type: 'ground' });
    } else {
      // ── Horizontal / Mixed: sequence of "tiers" you can climb between ──────
      const groundY = shape === 'mixed' ? voidY - 60 : 450;
      const density = diff === 'easy' ? 0.5 : diff === 'hard' ? 0.32 : 0.42;
      const platMin = 80, platMax = 160;
      // Tier bands (top of allowed platform area, bottom of allowed area)
      const yMin = shape === 'mixed' ? 140 : 150;
      const yMax = groundY - 60;
      let cx = 200;
      let lastY = (yMin + yMax) * 0.5;
      // For 'mixed' shape, occasionally raise a tall column the player has to climb
      let nextStaircaseAt = shape === 'mixed' ? cx + ri(700, 1100) : Infinity;
      while (cx < W - 200) {
        // Build a vertical staircase of 4-6 platforms at this checkpoint
        if (cx >= nextStaircaseAt && shape === 'mixed') {
          const stairs = ri(4, 6);
          const stepX = cx, baseY = yMax;
          for (let s2 = 0; s2 < stairs; s2++) {
            const sx2 = stepX + (s2 % 2 ? 100 : -10) + s2 * 18;
            const sy = baseY - 70 - s2 * 70;
            const sw = 90;
            const t = pick(allowed);
            placeTerrain(sx2, sy, sw, t);
            if (rng() < 0.6) coins.push({ x: sx2 + sw / 2 - 8, y: sy - 28 });
          }
          cx += 180;
          nextStaircaseAt = cx + ri(900, 1500);
          lastY = baseY - 70 * stairs;
          continue;
        }
        if (rng() < density) {
          const dy = (rng() - 0.5) * 140;
          const py = Math.max(yMin, Math.min(yMax, lastY + dy));
          const pw = ri(platMin, platMax);
          const t = pick(allowed);
          placeTerrain(cx, py, pw, t);
          if (rng() < 0.55) {
            const cn = ri(1, 3);
            for (let k = 0; k < cn; k++) coins.push({ x: cx + 12 + k * 22, y: py - 30 });
          }
          if (has(itemSet, 'qblock') && rng() < 0.10) qblocks.push({ x: cx + pw / 2 - 14, y: py - 70 });
          if (has(itemSet, 'cblock') && rng() < 0.05) cblocks.push({ x: cx + pw / 2 - 14, y: py - 70, hits: 5, bumpTimer: 0 });
          lastY = py;
        }
        cx += ri(110, 200);
      }
      // Sometimes also raise the goal up high so the player ends on a climb
      if (shape === 'mixed' && rng() < 0.7) {
        // A small staircase up to the goal
        const baseY = groundY;
        for (let s2 = 0; s2 < 4; s2++) {
          placeTerrain(W - 380 + s2 * 70, baseY - 60 - s2 * 70, 110, pick(allowed));
        }
        goal.y = baseY - 60 * 4 - 40;
      }
    }

    // ── Enemies — only the variants the user enabled ─────────────────
    if (enemyVariantsAllowed.length > 0) {
      const enemyBase = diff === 'easy' ? 0.45 : diff === 'hard' ? 1.4 : 0.85;
      const enemyCount = Math.floor(((shape === 'vertical' ? H : W) / 600) * enemyBase);
      for (let i = 0; i < enemyCount; i++) {
        const ev = pick(enemyVariantsAllowed);
        const ehp = diff === 'hard' ? ri(2, 4) : diff === 'easy' ? 1 : ri(1, 3);
        let ex, ey;
        if (shape === 'vertical') {
          // Pick a platform to perch on — first non-ground platform in the array
          const candidates = platforms.filter(p => p.type !== 'ground' && p.w >= 80);
          if (!candidates.length) break;
          const cand = candidates[Math.floor(rng() * candidates.length)];
          ex = cand.x + cand.w / 2 - 16;
          ey = cand.y - 40;
        } else {
          ex = ri(360, W - 400);
          ey = (shape === 'mixed' ? voidY - 60 : 450) - 42;
        }
        enemies.push({ x: ex, y: ey, v: ev, hp: ehp, elite: 'false' });
      }
    }

    // ── Spikes on harder difficulties (horizontal/mixed only) ────────
    if (diff !== 'easy' && shape !== 'vertical') {
      const groundY = shape === 'mixed' ? voidY - 60 : 450;
      const spikeCount = diff === 'hard' ? ri(2, 4) : ri(0, 2);
      for (let i = 0; i < spikeCount; i++) {
        const sx = ri(500, W - 500);
        spikes.push({ x: sx, y: groundY - 16, w: 60 + ri(0, 40), h: 16, rotation: 0, spikeType: 'static' });
      }
    }

    // ── 3 spirit embers, scattered ───────────────────────────────────
    if (shape === 'vertical') {
      // Spread along the climb height
      for (let i = 0; i < 3; i++) {
        const yPick = voidY - 200 - i * Math.floor((H - 400) / 3) + ri(-40, 40);
        spiritEmbers.push({ x: ri(120, W - 120), y: yPick, collected: false, idx: i });
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const ex = 400 + i * Math.floor((W - 800) / 3) + ri(-80, 80);
        const ey = shape === 'mixed' ? ri(160, voidY - 100) : ri(150, 380);
        spiritEmbers.push({ x: ex, y: ey, collected: false, idx: i });
      }
    }

    // ── Powerup items — only the types the user enabled ──────────────
    const puTypes = itemSet.filter(t => ['rapid', 'big', 'bomb', 'drum', 'invincible', 'chargerefresh', 'extrajump', 'shield', 'heal'].indexOf(t) >= 0);
    if (puTypes.length > 0) {
      const puCount = ri(1, 3);
      for (let i = 0; i < puCount; i++) {
        let ex, ey;
        if (shape === 'vertical') { ex = ri(100, W - 100); ey = ri(160, voidY - 120); }
        else { ex = ri(400, W - 400); ey = shape === 'mixed' ? ri(180, voidY - 80) : ri(200, 410); }
        powerupItems.push({ x: ex, y: ey, type: pick(puTypes), collected: false });
      }
    }

    // ── Trophy ───────────────────────────────────────────────────────
    if (has(itemSet, 'trophy') && (length === 'long' || rng() < 0.3)) {
      let tx, ty;
      if (shape === 'vertical') { tx = ri(120, W - 120); ty = ri(160, voidY - 200); }
      else { tx = ri(600, W - 600); ty = ri(200, 380); }
      trophies.push({ x: tx, y: ty, collected: false });
    }

    // ── Checkpoints (one mid-way for short, two for medium/long) ─────
    if (shape === 'vertical') {
      const cy1 = voidY - Math.floor(H * 0.33);
      const cy2 = voidY - Math.floor(H * 0.66);
      if (length !== 'short') {
        checkpoints.push({ x: W / 2 - 9, y: cy1, activated: false });
        checkpoints.push({ x: W / 2 - 9, y: cy2, activated: false });
      }
    } else {
      const groundY = shape === 'mixed' ? voidY - 60 : 450;
      if (length !== 'short') {
        checkpoints.push({ x: Math.floor(W * 0.33), y: groundY - 8, activated: false });
        checkpoints.push({ x: Math.floor(W * 0.66), y: groundY - 8, activated: false });
      }
    }

    // ── Ambient wildlife — cows / sheep / chickens ───────────────────
    // Scatter a handful of non-damageable NPCs across walkable platforms
    // so the level feels populated. Vertical levels skip wildlife since
    // there's nowhere for a cow to graze coherently. Dimensions mirror
    // NPC_VARIANTS in the inline body (cow 36×32, sheep 30×28, chicken
    // 20×22) so the spawn y aligns feet on the platform surface.
    //
    // Gated on `opts.includeNpcs` (default ON for legacy callers; the UI
    // exposes a checkbox so users can turn it off for a pure platforming
    // run).
    const includeNpcs = (o.includeNpcs !== false);
    const npcs = [];
    if (includeNpcs && shape !== 'vertical') {
      const NPC_W_H = {
        cow:     { w: 36, h: 32 },
        sheep:   { w: 30, h: 28 },
        chicken: { w: 20, h: 22 },
      };
      const npcTypes = Object.keys(NPC_W_H);
      // Eligible platforms: wide, solid, above the void. Skip the tiny
      // floating ledges and the special types (water/bounce/spikes/…).
      const standables = platforms.filter(p =>
        p && p.w >= 90 && p.h >= 14 && p.y < voidY - 24 &&
        (p.type === 'ground' || p.type === undefined || p.type === null || p.type === 'normal' || p.type === 'oneway')
      );
      if (standables.length > 0) {
        const npcCount = ri(2, 5);
        for (let i = 0; i < npcCount; i++) {
          const pl = pick(standables);
          const type = pick(npcTypes);
          const dim = NPC_W_H[type];
          const ax = Math.floor(pl.x + 24 + rng() * Math.max(24, pl.w - 60));
          const ay = pl.y - dim.h - 1;
          npcs.push({ x: ax, y: ay, type });
        }
      }
    }

    // ── Mackenzie ally (~30% of generated levels) ────────────────────
    // Spawn her on the starting area so the player meets her right away.
    // Fields mirror the mackenzie() template in world-15-starfall-void.js
    // — engine\'s updateAllies / drawMackenzie expect exactly this shape.
    // Gated on `opts.includeMackenzie` (default ON) — even when allowed,
    // the 30% roll still applies, so disabling the UI toggle is the only
    // way to GUARANTEE no Mackenzie.
    const includeMackenzie = (o.includeMackenzie !== false);
    const allies = [];
    if (includeMackenzie && rng() < 0.30) {
      const ax = Math.max(start.x - 24, 20);
      const ay = (shape === 'vertical') ? (start.y + 20) : (voidY - 50);
      allies.push({
        type: 'mackenzie', x: ax, y: ay,
        hp: 3, maxHp: 3,
        attached: false, riding: false, facingRight: true,
        vx: 0, vy: 0, onGround: false,
        _frame: 0, _tongue: 0, _tail: 0,
        _attackCd: 0, _invuln: 0, _dead: false,
        _heartCd: 0, _name: 'Mackenzie',
      });
    }

    // ── Theme palette ────────────────────────────────────────────────
    const tb = THEMES_BG[theme] || THEMES_BG.highland;
    const pc = THEMES_PC[theme] || THEMES_PC.highland;

    return {
      name: 'GENERATED · ' + theme.toUpperCase() + ' · ' + shape.toUpperCase(),
      theme,
      width: W, height: H,
      bgColors: [...tb.bg],
      platColors: [...pc],
      accentColor: tb.accent, accentColor2: tb.accent2,
      skyStars: !!tb.stars,
      misty: !!tb.misty,
      voidFloor: false, voidY: voidY,
      startX: start.x, startY: start.y,
      goalX: goal.x, goalY: goal.y,
      timePar: 240, timeGold: 150,
      weather, music: music || null,
      platforms, icePlats, bounces, movingPlats, switches: [], spikes,
      coins, qblocks, cblocks, trophies, powerupItems, enemies,
      checkpoints, spiritEmbers, marsBarPieces: [],
      signs: [], highlights: [],
      npcs, allies,
      _seed: seedStr,
    };
  }

  // ── Exports ────────────────────────────────────────────────────
  window.GameGenerator = {
    buildRandomLevel,
    // Internal helper exposed for tests + tooling.
    makeSeededRng,
  };
  // Bare-global mirror — the existing inline call sites (the generator
  // form's GENERATE button + the test harness) call buildRandomLevel
  // by its bare name.
  window.buildRandomLevel = buildRandomLevel;
})();
