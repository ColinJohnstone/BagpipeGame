// levels/world-38-starfall-causeway.js
// ──────────────────────────────────────────────────────────────────
// World 38 · STARFALL CAUSEWAY — cosmic theme, meteor weather.
// Signature: GRAPPLEHOOK swings across star-voids while meteors rain.
// Galaxy "THE ASCENT BEYOND": a vertical climb from surface to cosmos.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W38 = [

  // ════════════════════════════════════════════════════════════════
  // L1 — INTRO: teach the grapple swing over a small void. Gentle.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'FIRST SWING SKYWARD',
    width: 2400, goalX: 2280, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#040124', '#120a4a'],
    platColors: ['#070326', '#160a3c', '#2c1a72', '#6240d2', '#d8b0ff'],
    accentColor: '#c08aff', accentColor2: '#7a4ee0',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'cosmic', weather: 'meteor',
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0,    y: 450, w: 760,  h: 60, type: 'ground' },
      { x: 360,  y: 372, w: 140,  h: 16 },
      { x: 620,  y: 320, w: 130,  h: 16 },
      // first grapple node over a modest gap
      { x: 900,  y: 232, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1040, y: 388, w: 200, h: 18 },
      { x: 1320, y: 336, w: 140, h: 16 },
      // second grapple node
      { x: 1560, y: 224, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1720, y: 384, w: 200, h: 18 },
      { x: 1980, y: 332, w: 150, h: 16 },
      // goal landing
      { x: 2200, y: 410, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [],
    coins: [
      { x: 360, y: 340 }, { x: 460, y: 340 },
      { x: 640, y: 288 }, { x: 720, y: 288 },
      { x: 900, y: 290 }, { x: 900, y: 200 },
      { x: 1080, y: 356 }, { x: 1180, y: 356 },
      { x: 1340, y: 304 },
      { x: 1560, y: 290 }, { x: 1560, y: 192 },
      { x: 1760, y: 352 }, { x: 1860, y: 352 },
      { x: 2010, y: 300 },
    ],
    qblocks: [{ x: 1040, y: 300 }],
    cblocks: [], trophies: [],
    powerupItems: [{ x: 1720, y: 340, type: 'heal' }],
    enemies: [
      { x: 420, y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1100, y: 346, v: 1, hp: 2, elite: 'false' },
      { x: 2260, y: 368, v: 0, hp: 2, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 900, y: 150, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 180, y: 372, w: 150, title: 'GRAPPLE', lines: ['Hold to fire a hook at', 'glowing nodes. Swing', 'across the star-void!'], color: '#c08aff' },
    ],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L2 — DEVELOP: a true voidFloor stretch, chained swing nodes.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'CHAIN OF FALLING STARS',
    width: 2700, goalX: 2580, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#050130', '#0e0a52'],
    platColors: ['#060228', '#150a40', '#2e1a7c', '#6644dc', '#dcb6ff'],
    accentColor: '#c08aff', accentColor2: '#8a5ef0',
    skyStars: true, height: 560, voidFloor: true, voidY: 470,
    theme: 'cosmic', weather: 'meteor',
    timePar: 225, timeGold: 150,
    platforms: [
      { x: 0,    y: 450, w: 520,  h: 60, type: 'ground' },
      { x: 360,  y: 372, w: 120,  h: 16 },
      // launch pad
      { x: 560,  y: 380, w: 120,  h: 18 },
      // grapple chain over the void
      { x: 760,  y: 240, w: 24,  h: 24, type: 'grapplehook' },
      { x: 980,  y: 230, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1140, y: 376, w: 150, h: 18 },
      { x: 1380, y: 232, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1560, y: 360, w: 140, h: 18 },
      { x: 1780, y: 222, w: 24,  h: 24, type: 'grapplehook' },
      { x: 2000, y: 226, w: 24,  h: 24, type: 'grapplehook' },
      { x: 2160, y: 360, w: 150, h: 18 },
      { x: 2380, y: 320, w: 130, h: 16 },
      // goal landing
      { x: 2520, y: 410, w: 180, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [],
    movingPlats: [
      { x: 1240, y: 300, x2: 1380, y2: 300, w: 90, h: 16, speed: 1.4 },
    ],
    switches: [],
    spikes: [],
    coins: [
      { x: 360, y: 340 },
      { x: 560, y: 348 },
      { x: 760, y: 300 }, { x: 870, y: 280 },
      { x: 980, y: 300 },
      { x: 1140, y: 344 }, { x: 1240, y: 268 },
      { x: 1380, y: 300 },
      { x: 1560, y: 328 },
      { x: 1780, y: 290 }, { x: 1890, y: 270 },
      { x: 2000, y: 294 },
      { x: 2160, y: 328 }, { x: 2400, y: 288 },
    ],
    qblocks: [],
    cblocks: [{ x: 1560, y: 280, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 2160, y: 320, type: 'extrajump' }],
    enemies: [
      { x: 420, y: 408, v: 1, hp: 2, elite: 'false' },
      { x: 1180, y: 334, v: 4, hp: 3, elite: 'false' },
      { x: 2200, y: 318, v: 0, hp: 3, elite: 'false' },
      { x: 2560, y: 368, v: 3, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1140, y: 330, activated: false }],
    spiritEmbers: [{ x: 1980, y: 150, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L3 — TWIST: combine swings with meteor-timed crumble & moving plats.
  // Rising staircase of swings — the ascent begins in earnest.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'ASCENT THROUGH THE STORM',
    width: 2900, goalX: 2780, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#06013a', '#100a5c'],
    platColors: ['#07022c', '#160c46', '#321c86', '#6e4ae6', '#e0bcff'],
    accentColor: '#c08aff', accentColor2: '#9866ff',
    skyStars: true, height: 560, voidFloor: true, voidY: 480,
    theme: 'cosmic', weather: 'meteor',
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0,    y: 450, w: 480,  h: 60, type: 'ground' },
      { x: 360,  y: 380, w: 120,  h: 16 },
      { x: 540,  y: 320, w: 110,  h: 16 },
      // swing up onto a crumble ledge
      { x: 760,  y: 240, w: 24,  h: 24, type: 'grapplehook' },
      { x: 900,  y: 332, w: 120, h: 18, type: 'crumble', _id: 'w38l3c1' },
      { x: 1120, y: 290, w: 110, h: 16 },
      { x: 1320, y: 220, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1480, y: 300, w: 120, h: 18, type: 'crumble', _id: 'w38l3c2' },
      // moving platform bridges a wide void
      { x: 1820, y: 200, w: 24,  h: 24, type: 'grapplehook' },
      { x: 2020, y: 280, w: 120, h: 18 },
      { x: 2240, y: 196, w: 24,  h: 24, type: 'grapplehook' },
      { x: 2420, y: 260, w: 120, h: 16 },
      { x: 2620, y: 320, w: 130, h: 16 },
      // goal landing higher up
      { x: 2700, y: 410, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [],
    movingPlats: [
      { x: 1620, y: 270, x2: 1780, y2: 270, w: 100, h: 16, speed: 1.6 },
      { x: 2060, y: 240, x2: 2200, y2: 200, w: 90,  h: 16, speed: 1.5 },
    ],
    switches: [],
    spikes: [
      { x: 1120, y: 266, w: 110, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 360, y: 348 }, { x: 540, y: 288 },
      { x: 760, y: 300 }, { x: 900, y: 300 },
      { x: 1120, y: 200 }, { x: 1320, y: 280 },
      { x: 1480, y: 268 },
      { x: 1670, y: 238 }, { x: 1820, y: 270 },
      { x: 2020, y: 248 }, { x: 2130, y: 200 },
      { x: 2240, y: 264 }, { x: 2420, y: 228 },
      { x: 2620, y: 288 },
    ],
    qblocks: [{ x: 2020, y: 200 }],
    cblocks: [],
    trophies: [],
    powerupItems: [
      { x: 540, y: 280, type: 'shield' },
      { x: 2420, y: 220, type: 'invincible' },
    ],
    enemies: [
      { x: 400, y: 408, v: 2, hp: 3, elite: 'false' },
      { x: 1140, y: 248, v: 8, hp: 3, elite: 'false' },
      { x: 2040, y: 238, v: 4, hp: 4, elite: 'false' },
      { x: 2440, y: 218, v: 5, hp: 4, elite: 'false' },
      { x: 2760, y: 368, v: 3, hp: 4, elite: 'false' },
    ],
    checkpoints: [{ x: 1120, y: 248, activated: false }],
    spiritEmbers: [{ x: 1320, y: 150, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L4 — CHALLENGE: tall vertical climb, dense swings + magnets + spikes.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'GRAVITY OF DISTANT SUNS',
    width: 3000, goalX: 2880, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#07013e', '#130a64'],
    platColors: ['#08022e', '#180c4a', '#36208e', '#724eea', '#e6c2ff'],
    accentColor: '#c08aff', accentColor2: '#a672ff',
    skyStars: true, height: 560, voidFloor: true, voidY: 490,
    theme: 'cosmic', weather: 'meteor',
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0,    y: 450, w: 440,  h: 60, type: 'ground' },
      { x: 340,  y: 376, w: 110,  h: 16 },
      { x: 520,  y: 312, w: 100,  h: 16 },
      // swing burst up
      { x: 720,  y: 232, w: 24,  h: 24, type: 'grapplehook' },
      { x: 880,  y: 300, w: 110, h: 18 },
      // magnetic node pulls you across a void
      { x: 1080, y: 248, w: 32,  h: 32, type: 'magnetic', radius: 150, pull: 0.7 },
      { x: 1260, y: 290, w: 110, h: 18 },
      { x: 1460, y: 210, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1620, y: 280, w: 110, h: 16, type: 'crumble', _id: 'w38l4c1' },
      { x: 1840, y: 196, w: 24,  h: 24, type: 'grapplehook' },
      { x: 2000, y: 262, w: 110, h: 18 },
      { x: 2200, y: 184, w: 24,  h: 24, type: 'grapplehook' },
      { x: 2380, y: 252, w: 100, h: 16 },
      { x: 2600, y: 300, w: 110, h: 16 },
      { x: 2780, y: 250, w: 100, h: 16 },
      // goal landing
      { x: 2820, y: 410, w: 180, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [
      { x: 600, y: 432, w: 80, h: 18, rotation: 0 },
    ],
    movingPlats: [
      { x: 920,  y: 230, x2: 1080, y2: 230, w: 90, h: 16, speed: 1.7 },
      { x: 2440, y: 220, x2: 2600, y2: 200, w: 90, h: 16, speed: 1.8 },
    ],
    switches: [],
    spikes: [
      { x: 880,  y: 276, w: 110, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2000, y: 238, w: 110, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 340, y: 344 }, { x: 520, y: 280 },
      { x: 720, y: 290 }, { x: 1000, y: 200 },
      { x: 1080, y: 200 }, { x: 1260, y: 258 },
      { x: 1460, y: 270 }, { x: 1620, y: 248 },
      { x: 1730, y: 220 }, { x: 1840, y: 256 },
      { x: 2000, y: 230 }, { x: 2200, y: 244 },
      { x: 2380, y: 220 }, { x: 2600, y: 268 },
      { x: 2780, y: 218 },
    ],
    qblocks: [{ x: 1260, y: 200 }],
    cblocks: [{ x: 2380, y: 200, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 880, y: 240, type: 'rapid' },
      { x: 2600, y: 260, type: 'heal' },
    ],
    enemies: [
      { x: 380, y: 408, v: 2, hp: 3, elite: 'false' },
      { x: 900, y: 258, v: 4, hp: 4, elite: 'false' },
      { x: 1280, y: 248, v: 7, hp: 5, elite: 'false' },
      { x: 2020, y: 220, v: 12, hp: 4, elite: 'false' },
      { x: 2400, y: 210, v: 5, hp: 5, elite: 'false' },
      { x: 2860, y: 368, v: 14, hp: 5, elite: 'false' },
    ],
    checkpoints: [
      { x: 1260, y: 248, activated: false },
      { x: 2380, y: 210, activated: false },
    ],
    spiritEmbers: [{ x: 1840, y: 130, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L5 — FINALE: climactic vertical set-piece, swing gauntlet to a
  // summoner mini-boss at the cosmic summit.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'SUMMIT OF THE STARFALL',
    width: 3200, goalX: 3080, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#08003e', '#160a70'],
    platColors: ['#09022e', '#1a0c50', '#3a2298', '#7852f0', '#ecc8ff'],
    accentColor: '#c08aff', accentColor2: '#b47eff',
    skyStars: true, height: 560, voidFloor: true, voidY: 500,
    theme: 'cosmic', weather: 'meteor',
    timePar: 267, timeGold: 178,
    platforms: [
      { x: 0,    y: 450, w: 420,  h: 60, type: 'ground' },
      { x: 320,  y: 372, w: 110,  h: 16 },
      { x: 500,  y: 308, w: 100,  h: 16 },
      // first swing chain, rising
      { x: 700,  y: 230, w: 24,  h: 24, type: 'grapplehook' },
      { x: 900,  y: 220, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1060, y: 300, w: 110, h: 18, type: 'crumble', _id: 'w38l5c1' },
      { x: 1280, y: 210, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1460, y: 280, w: 110, h: 18 },
      // wide void crossing — moving plat + swing
      { x: 1860, y: 196, w: 24,  h: 24, type: 'grapplehook' },
      { x: 2040, y: 262, w: 110, h: 18 },
      { x: 2260, y: 184, w: 24,  h: 24, type: 'grapplehook' },
      { x: 2440, y: 250, w: 110, h: 16 },
      // boss arena platform
      { x: 2640, y: 360, w: 380, h: 18 },
      // goal perch above the arena
      { x: 3000, y: 410, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [
      { x: 2700, y: 342, w: 80, h: 18, rotation: 0 },
    ],
    movingPlats: [
      { x: 1620, y: 240, x2: 1820, y2: 220, w: 100, h: 16, speed: 1.8 },
      { x: 2540, y: 220, x2: 2640, y2: 280, w: 90,  h: 16, speed: 1.6 },
    ],
    switches: [],
    spikes: [
      { x: 1460, y: 256, w: 110, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2040, y: 238, w: 110, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 320, y: 340 }, { x: 500, y: 276 },
      { x: 700, y: 290 }, { x: 800, y: 270 },
      { x: 900, y: 290 },
      { x: 1060, y: 268 }, { x: 1280, y: 270 },
      { x: 1460, y: 248 },
      { x: 1720, y: 200 }, { x: 1860, y: 256 },
      { x: 2040, y: 230 }, { x: 2260, y: 244 },
      { x: 2440, y: 218 }, { x: 2700, y: 328 },
      { x: 2850, y: 328 },
    ],
    qblocks: [{ x: 2640, y: 290 }],
    cblocks: [{ x: 2900, y: 290, hits: 3 }],
    trophies: [{ x: 1060, y: 240, collected: false }],
    powerupItems: [
      { x: 500, y: 268, type: 'invincible' },
      { x: 2440, y: 210, type: 'big' },
      { x: 2820, y: 320, type: 'heal' },
    ],
    enemies: [
      { x: 360, y: 408, v: 2, hp: 3, elite: 'false' },
      { x: 1080, y: 258, v: 8, hp: 4, elite: 'false' },
      { x: 1480, y: 238, v: 4, hp: 4, elite: 'false' },
      { x: 2060, y: 220, v: 7, hp: 5, elite: 'false' },
      { x: 2460, y: 206, v: 13, hp: 5, elite: 'false' },
      // summoner mini-boss in the arena
      { x: 2820, y: 296, v: 98, hp: 40, elite: 'false', w: 64, h: 64 },
    ],
    checkpoints: [
      { x: 1060, y: 268, activated: false },
      { x: 2640, y: 328, activated: false },
    ],
    spiritEmbers: [{ x: 2260, y: 120, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

];
