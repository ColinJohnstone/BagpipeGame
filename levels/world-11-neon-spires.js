// levels/world-11-neon-spires.js
// ──────────────────────────────────────────────────────────────────
// World 11 · NEON SPIRES — cyber theme, lightning weather.
// First externalised world. Loaded via a plain <script> tag so the
// file:// protocol still works (fetch would need a server). The data
// here is the *unbaked* level shape — the main game's level-init
// fills in any missing optional fields at startup.
//
// Pattern for extracting more worlds:
//   1. Copy the body of buildWorldNLevels() into a new file under
//      /levels/world-NN-name.js
//   2. Wrap it in window.LEVELS_W{NN} = [ … ];
//   3. Add <script src="levels/world-NN-name.js"></script> in the
//      HTML's <head> (BEFORE the main game script).
//   4. In the main script, replace the buildWorldNLevels() call with:
//        levels: (window.LEVELS_W11 || buildWorld11Levels())
//      That keeps a working fallback if the file fails to load.
//
// Once we finish the module split this becomes a clean ESM import.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W11 = [
  // ── L1 · CYBER DATA STREAM ───────────────────────────────────
  // Conveyor belts move you through the data flow.
  {
    name: 'CYBER DATA STREAM',
    width: 2600, goalX: 2500, goalY: 310,
    bgColors: ['#02011a', '#100328'],
    platColors: ['#080224', '#140540', '#280a70', '#4818b0', '#ff3ed8'],
    accentColor: '#ff3ed8', accentColor2: '#3ad8ff',
    skyStars: true, misty: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'cyber', weather: 'lightning',
    startX: 60, startY: 380, timePar: 240, timeGold: 150,
    platforms: [
      { x: 0,    y: 450, w: 2600, h: 60, type: 'ground' },
      { x: 280,  y: 380, w: 220,  h: 16, type: 'conveyor', dir:  1, speed: 2.0 },
      { x: 600,  y: 320, w: 100,  h: 18 },
      { x: 800,  y: 360, w: 220,  h: 16, type: 'conveyor', dir: -1, speed: 2.4 },
      { x: 1100, y: 300, w: 100,  h: 18 },
      { x: 1320, y: 340, w: 240,  h: 16, type: 'conveyor', dir:  1, speed: 2.6 },
      { x: 1660, y: 280, w: 100,  h: 18 },
      { x: 1860, y: 360, w: 260,  h: 16, type: 'conveyor', dir:  1, speed: 3.0 },
      { x: 2240, y: 300, w: 200,  h: 18 },
    ],
    coins: [
      { x: 320,  y: 340 }, { x: 620,  y: 280 }, { x: 1120, y: 260 },
      { x: 1680, y: 240 }, { x: 2260, y: 260 }, { x: 2450, y: 410 },
    ],
    enemies: [
      { x: 700,  y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1700, y: 408, v: 3, hp: 2, elite: 'false' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], highlights: [],
    signs: [{
      x: 60, y: 200, w: 340, title: 'CYBER DATA STREAM',
      lines: ['▶ BELTS PUSH YOU.', 'RIDE WITH THE FLOW', 'OR SLIDE BENEATH.'],
      color: '#3ad8ff',
    }],
  },

  // ── L2 · NEON STATIC SURGE ───────────────────────────────────
  // Windtunnels lift, lightning strikes if you linger.
  {
    name: 'NEON STATIC SURGE',
    width: 2400, goalX: 2300, goalY: 200,
    bgColors: ['#02011a', '#100328'],
    platColors: ['#080224', '#140540', '#280a70', '#4818b0', '#ff3ed8'],
    accentColor: '#ff3ed8', accentColor2: '#3ad8ff',
    skyStars: true, misty: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'cyber', weather: 'lightning',
    startX: 60, startY: 380, timePar: 220, timeGold: 140,
    platforms: [
      { x: 0,    y: 450, w: 2400, h: 60,  type: 'ground' },
      { x: 300,  y: 380, w: 100,  h: 18 },
      { x: 500,  y: 260, w: 80,   h: 200, type: 'windtunnel', lift: 0.95 },
      { x: 480,  y: 220, w: 120,  h: 18 },
      { x: 680,  y: 180, w: 100,  h: 18 },
      { x: 920,  y: 260, w: 80,   h: 200, type: 'windtunnel', lift: 0.95 },
      { x: 900,  y: 220, w: 120,  h: 18 },
      { x: 1100, y: 160, w: 120,  h: 18 },
      { x: 1340, y: 220, w: 100,  h: 18 },
      { x: 1560, y: 260, w: 80,   h: 200, type: 'windtunnel', lift: 1.05 },
      { x: 1540, y: 180, w: 140,  h: 18 },
      { x: 1760, y: 140, w: 120,  h: 18 },
      { x: 1960, y: 200, w: 120,  h: 18 },
      { x: 2200, y: 260, w: 200,  h: 18 },
    ],
    coins: [
      { x: 530,  y: 320 }, { x: 700,  y: 140 }, { x: 950,  y: 320 },
      { x: 1120, y: 120 }, { x: 1590, y: 320 }, { x: 1800, y: 100 },
      { x: 2240, y: 220 },
    ],
    enemies: [
      { x: 700,  y: 138, v: 0, hp: 2, elite: 'false' },
      { x: 1800, y: 98,  v: 0, hp: 2, elite: 'false' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], highlights: [],
    signs: [{
      x: 60, y: 200, w: 340, title: 'STATIC SURGE',
      lines: ['🌬 WIND TUBES LIFT YOU.', '⚡ DON\'T LINGER —', 'BOLTS CHASE STILL TARGETS.'],
      color: '#ff3ed8',
    }],
  },

  // ── L3 · NEON SPIRES ASCENT ──────────────────────────────────
  // Grapple-hook climb up the cyber spires.
  {
    name: 'NEON SPIRES ASCENT',
    width: 2800, goalX: 2700, goalY: 160,
    bgColors: ['#02011a', '#100328'],
    platColors: ['#080224', '#140540', '#280a70', '#4818b0', '#ff3ed8'],
    accentColor: '#ff3ed8', accentColor2: '#3ad8ff',
    skyStars: true, misty: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'cyber', weather: 'lightning',
    startX: 60, startY: 380, timePar: 280, timeGold: 180,
    platforms: [
      { x: 0,    y: 450, w: 2800, h: 60, type: 'ground' },
      { x: 240,  y: 380, w: 120,  h: 18 },
      { x: 460,  y: 320, w: 80,   h: 18 },
      { x: 600,  y: 220, w: 24,   h: 24, type: 'grapplehook' },
      { x: 720,  y: 280, w: 120,  h: 18 },
      { x: 920,  y: 200, w: 100,  h: 18 },
      { x: 1080, y: 140, w: 24,   h: 24, type: 'grapplehook' },
      { x: 1180, y: 240, w: 120,  h: 18 },
      { x: 1400, y: 180, w: 100,  h: 18 },
      { x: 1560, y: 120, w: 24,   h: 24, type: 'grapplehook' },
      { x: 1660, y: 220, w: 120,  h: 18 },
      { x: 1880, y: 280, w: 220,  h: 16, type: 'conveyor', dir: 1, speed: 2.4 },
      { x: 2160, y: 200, w: 100,  h: 18 },
      { x: 2300, y: 140, w: 24,   h: 24, type: 'grapplehook' },
      { x: 2440, y: 220, w: 100,  h: 18 },
      { x: 2620, y: 260, w: 180,  h: 18 },
    ],
    coins: [
      { x: 280,  y: 340 }, { x: 740,  y: 240 }, { x: 1200, y: 200 },
      { x: 1680, y: 180 }, { x: 2180, y: 160 }, { x: 2640, y: 220 },
    ],
    enemies: [
      { x: 1200, y: 198, v: 0, hp: 2, elite: 'false' },
      { x: 2460, y: 178, v: 3, hp: 2, elite: 'false' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], checkpoints: [],
    spiritEmbers: [{ x: 1100, y: 80, collected: false, idx: 0 }],
    marsBarPieces: [], highlights: [],
    signs: [{
      x: 60, y: 200, w: 340, title: 'NEON ASCENT',
      lines: ['🪝 HOOK LOCKS ON', 'TO THE NEAREST NODE.', 'JUMP TO RELEASE.'],
      color: '#3ad8ff',
    }],
  },
];
