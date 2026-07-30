// levels/world-26-frostbound-vault.js
// ──────────────────────────────────────────────────────────────────
// World 26 · FROSTBOUND VAULT — frozen treasury.
// Signature: ICE slides launch you off BOUNCE pads; BREAKSHOT ice walls
// seal vault chambers (5 shots to shatter). Slide, spring, and break in.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W26 = [

  // ════════════════════════════════════════════════════════════════
  // L1 · FROZEN ANTECHAMBER — teach ice + bounce, gentle.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'FROZEN ANTECHAMBER',
    width: 2400, goalX: 2280, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#06121f', '#0d2342'],
    platColors: ['#0c1628', '#182440', '#23507f', '#3a86c0', '#a9e2ff'],
    accentColor: '#7fd8ff', accentColor2: '#d6f1ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'frozen', weather: 'snow',
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0,    y: 450, w: 2400, h: 60, type: 'ground' },
      { x: 360,  y: 380, w: 160, h: 18 },
      { x: 760,  y: 360, w: 120, h: 18 },
      { x: 1480, y: 360, w: 140, h: 18 },
      { x: 1740, y: 320, w: 120, h: 18 },
      { x: 2080, y: 380, w: 140, h: 18 },
    ],
    icePlats: [
      { x: 980,  y: 420, w: 360, h: 30 },
      { x: 1900, y: 420, w: 180, h: 30 },
    ],
    bounces: [
      { x: 1360, y: 420, w: 80, h: 30, rotation: 0 },
    ],
    movingPlats: [],
    switches: [],
    spikes: [],
    coins: [
      { x: 400, y: 340 }, { x: 460, y: 340 }, { x: 800, y: 320 },
      { x: 1060, y: 390 }, { x: 1180, y: 390 }, { x: 1300, y: 390 },
      { x: 1400, y: 320 }, { x: 1400, y: 270 }, { x: 1400, y: 220 },
      { x: 1540, y: 320 }, { x: 1780, y: 280 }, { x: 2120, y: 340 },
    ],
    qblocks: [{ x: 760, y: 280 }],
    cblocks: [],
    trophies: [],
    powerupItems: [],
    enemies: [
      { x: 1040, y: 378, v: 0, hp: 2, elite: 'false' },
      { x: 1540, y: 318, v: 1, hp: 2, elite: 'false' },
      { x: 2120, y: 408, v: 0, hp: 2, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 1740, y: 270, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 80, y: 380, w: 320, title: 'FROSTBOUND VAULT',
        lines: ['ICE IS SLICK — SLIDE INTO', 'SPRING PADS TO FLY HIGH.'], color: '#7fd8ff' },
    ],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L2 · GLACIER LANDING — develop: ice runs chained to bounces, first breakshot wall.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'GLACIER LANDING',
    width: 2700, goalX: 2580, goalY: 340,
    startX: 60, startY: 380,
    bgColors: ['#06121f', '#0d2342'],
    platColors: ['#0c1628', '#182440', '#23507f', '#3a86c0', '#a9e2ff'],
    accentColor: '#7fd8ff', accentColor2: '#d6f1ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'frozen', weather: 'snow',
    timePar: 225, timeGold: 150,
    platforms: [
      { x: 0,    y: 450, w: 700, h: 60, type: 'ground' },
      { x: 980,  y: 400, w: 120, h: 18 },
      { x: 1700, y: 360, w: 140, h: 18 },
      { x: 1980, y: 300, w: 120, h: 18 },
      // breakshot ice wall blocking the vault chamber
      { x: 2260, y: 330, w: 30, h: 120, type: 'breakshot', _id: 'w2wall1' },
      { x: 2360, y: 420, w: 340, h: 90, type: 'ground' },
    ],
    icePlats: [
      { x: 700,  y: 450, w: 280, h: 30 },
      { x: 1180, y: 420, w: 320, h: 30 },
      { x: 1840, y: 420, w: 140, h: 30 },
    ],
    bounces: [
      { x: 1500, y: 420, w: 80, h: 30, rotation: 0 },
      { x: 2120, y: 420, w: 80, h: 30, rotation: 0 },
    ],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 1580, y: 440, w: 120, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 300, y: 410 }, { x: 800, y: 410 }, { x: 1020, y: 360 },
      { x: 1260, y: 380 }, { x: 1380, y: 380 }, { x: 1540, y: 320 },
      { x: 1540, y: 270 }, { x: 1740, y: 320 }, { x: 2020, y: 260 },
      { x: 2160, y: 320 }, { x: 2160, y: 260 }, { x: 2450, y: 380 },
      { x: 2520, y: 380 },
    ],
    qblocks: [{ x: 980, y: 320 }],
    cblocks: [{ x: 1980, y: 220, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1700, y: 320, type: 'rapid' }],
    enemies: [
      { x: 400,  y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1240, y: 388, v: 5, hp: 3, elite: 'false' },
      { x: 1740, y: 318, v: 3, hp: 3, elite: 'false' },
      { x: 2460, y: 378, v: 1, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1180, y: 380, activated: false }],
    spiritEmbers: [{ x: 1980, y: 250, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 700, y: 380, w: 300, title: 'BREAK IN',
        lines: ['ICE WALLS NEED 5 SHOTS', 'TO SHATTER OPEN.'], color: '#7fd8ff' },
    ],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L3 · MIRROR TREASURY — twist: ice + bounce + breakshot + crumble combine.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'MIRROR TREASURY',
    width: 2900, goalX: 2780, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#06121f', '#0d2342'],
    platColors: ['#0c1628', '#182440', '#23507f', '#3a86c0', '#a9e2ff'],
    accentColor: '#7fd8ff', accentColor2: '#d6f1ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'frozen', weather: 'snow',
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0,    y: 450, w: 520, h: 60, type: 'ground' },
      { x: 760,  y: 390, w: 100, h: 18 },
      { x: 1040, y: 340, w: 100, h: 18, type: 'crumble', _id: 'w3c1' },
      { x: 1280, y: 300, w: 100, h: 18, type: 'crumble', _id: 'w3c2' },
      { x: 1520, y: 360, w: 120, h: 18 },
      // ice wall sealing the mirror vault
      { x: 1820, y: 230, w: 30, h: 130, type: 'breakshot', _id: 'w3wall1' },
      { x: 1900, y: 360, w: 160, h: 18 },
      { x: 2240, y: 320, w: 120, h: 18 },
      { x: 2560, y: 400, w: 340, h: 110, type: 'ground' },
    ],
    icePlats: [
      { x: 520,  y: 450, w: 240, h: 30 },
      { x: 1640, y: 420, w: 180, h: 30 },
      { x: 2360, y: 420, w: 200, h: 30 },
    ],
    bounces: [
      { x: 860,  y: 420, w: 80, h: 30, rotation: 0 },
      { x: 1760, y: 420, w: 80, h: 30, rotation: 0 },
    ],
    movingPlats: [
      { x: 2060, y: 360, x2: 2240, y2: 280, w: 90, h: 18, speed: 1.4 },
    ],
    switches: [],
    spikes: [
      { x: 1140, y: 440, w: 140, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 300, y: 410 }, { x: 600, y: 410 }, { x: 800, y: 350 },
      { x: 1080, y: 300 }, { x: 1320, y: 260 }, { x: 1560, y: 320 },
      { x: 1700, y: 360 }, { x: 1700, y: 300 }, { x: 1940, y: 320 },
      { x: 2120, y: 300 }, { x: 2280, y: 280 }, { x: 2420, y: 380 },
      { x: 2640, y: 360 }, { x: 2720, y: 360 },
    ],
    qblocks: [{ x: 1520, y: 280 }],
    cblocks: [{ x: 1900, y: 280, hits: 3 }],
    trophies: [{ x: 1280, y: 240, collected: false }],
    powerupItems: [{ x: 760, y: 310, type: 'big' }],
    enemies: [
      { x: 350,  y: 408, v: 1, hp: 3, elite: 'false' },
      { x: 760,  y: 348, v: 3, hp: 3, elite: 'false' },
      { x: 1560, y: 318, v: 4, hp: 3, elite: 'false' },
      { x: 1980, y: 318, v: 5, hp: 4, elite: 'false' },
      { x: 2640, y: 358, v: 7, hp: 4, elite: 'false' },
    ],
    checkpoints: [{ x: 1520, y: 320, activated: false }],
    spiritEmbers: [{ x: 1280, y: 250, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L4 · SHATTERED RESERVE — challenge: dense breakshot maze + long ice runs.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'SHATTERED RESERVE',
    width: 3100, goalX: 2980, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#06121f', '#0d2342'],
    platColors: ['#0c1628', '#182440', '#23507f', '#3a86c0', '#a9e2ff'],
    accentColor: '#7fd8ff', accentColor2: '#d6f1ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'frozen', weather: 'snow',
    timePar: 258, timeGold: 172,
    platforms: [
      { x: 0,    y: 450, w: 460, h: 60, type: 'ground' },
      { x: 700,  y: 380, w: 120, h: 18 },
      { x: 980,  y: 340, w: 110, h: 18 },
      // first breakshot gate
      { x: 1220, y: 250, w: 30, h: 130, type: 'breakshot', _id: 'w4wall1' },
      { x: 1300, y: 360, w: 140, h: 18 },
      { x: 1620, y: 320, w: 120, h: 18 },
      // stacked breakshot wall (two segments) over a spike pit
      { x: 1980, y: 240, w: 30, h: 110, type: 'breakshot', _id: 'w4wall2' },
      { x: 1980, y: 360, w: 30, h: 90,  type: 'breakshot', _id: 'w4wall3' },
      { x: 2080, y: 350, w: 130, h: 18 },
      { x: 2400, y: 300, w: 120, h: 18 },
      { x: 2980, y: 400, w: 120, h: 110, type: 'ground' },
    ],
    icePlats: [
      { x: 460,  y: 450, w: 240, h: 30 },
      { x: 1440, y: 420, w: 180, h: 30 },
      { x: 2520, y: 420, w: 260, h: 30 },
    ],
    bounces: [
      { x: 1100, y: 420, w: 80, h: 30, rotation: 0 },
      { x: 1900, y: 420, w: 80, h: 30, rotation: 0 },
      { x: 2780, y: 420, w: 80, h: 30, rotation: 0 },
    ],
    movingPlats: [
      { x: 2620, y: 320, x2: 2860, y2: 320, w: 90, h: 18, speed: 1.6 },
    ],
    switches: [],
    spikes: [
      { x: 2010, y: 440, w: 70,  h: 24, rotation: 0, spikeType: 'static' },
      { x: 2520, y: 440, w: 100, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 280, y: 410 }, { x: 560, y: 410 }, { x: 740, y: 340 },
      { x: 1020, y: 300 }, { x: 1140, y: 390 }, { x: 1140, y: 340 },
      { x: 1360, y: 320 }, { x: 1660, y: 280 }, { x: 1940, y: 390 },
      { x: 1940, y: 340 }, { x: 2120, y: 310 }, { x: 2440, y: 260 },
      { x: 2640, y: 280 }, { x: 2820, y: 380 }, { x: 3010, y: 360 },
    ],
    qblocks: [{ x: 1300, y: 280 }, { x: 2400, y: 220 }],
    cblocks: [{ x: 1620, y: 240, hits: 3 }],
    trophies: [{ x: 1660, y: 240, collected: false }],
    powerupItems: [{ x: 700, y: 300, type: 'shield' }, { x: 2400, y: 220, type: 'rapid' }],
    enemies: [
      { x: 300,  y: 408, v: 1, hp: 3, elite: 'false' },
      { x: 740,  y: 338, v: 3, hp: 4, elite: 'false' },
      { x: 1360, y: 318, v: 5, hp: 4, elite: 'false' },
      { x: 1660, y: 278, v: 4, hp: 4, elite: 'false' },
      { x: 2120, y: 308, v: 7, hp: 5, elite: 'false' },
      { x: 2440, y: 258, v: 9, hp: 4, elite: 'false' },
    ],
    checkpoints: [
      { x: 700, y: 340, activated: false },
      { x: 1620, y: 280, activated: false },
    ],
    spiritEmbers: [{ x: 2080, y: 290, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L5 · THE CORE VAULT — finale: vertical breakshot ascent, bounce launches, mini-boss.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'THE CORE VAULT',
    width: 3300, goalX: 3180, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#06121f', '#0d2342'],
    platColors: ['#0c1628', '#182440', '#23507f', '#3a86c0', '#a9e2ff'],
    accentColor: '#7fd8ff', accentColor2: '#d6f1ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'frozen', weather: 'snow',
    timePar: 275, timeGold: 183,
    platforms: [
      { x: 0,    y: 450, w: 540, h: 60, type: 'ground' },
      { x: 780,  y: 380, w: 120, h: 18 },
      { x: 1060, y: 330, w: 110, h: 18 },
      // breakshot vault door 1
      { x: 1320, y: 230, w: 30, h: 140, type: 'breakshot', _id: 'w5wall1' },
      { x: 1400, y: 350, w: 130, h: 18 },
      // bounce-launch vertical set-piece
      { x: 1700, y: 360, w: 120, h: 18 },
      { x: 1700, y: 220, w: 120, h: 18 },
      { x: 1900, y: 110, w: 140, h: 18 },
      { x: 2160, y: 200, w: 120, h: 18 },
      // breakshot vault door 2 (stacked wall over the core)
      { x: 2420, y: 180, w: 30, h: 120, type: 'breakshot', _id: 'w5wall2' },
      { x: 2420, y: 320, w: 30, h: 90,  type: 'breakshot', _id: 'w5wall3' },
      { x: 2500, y: 300, w: 160, h: 18 },
      // boss arena
      { x: 2760, y: 400, w: 540, h: 110, type: 'ground' },
    ],
    icePlats: [
      { x: 540,  y: 450, w: 240, h: 30 },
      { x: 1530, y: 420, w: 170, h: 30 },
      { x: 2280, y: 250, w: 140, h: 24 },
    ],
    bounces: [
      { x: 1180, y: 420, w: 80, h: 30, rotation: 0 },
      { x: 1700, y: 320, w: 80, h: 30, rotation: 0 },
      { x: 2660, y: 420, w: 80, h: 30, rotation: 0 },
    ],
    movingPlats: [
      { x: 1900, y: 110, x2: 1900, y2: 110, w: 1, h: 1, speed: 1.0 },
    ],
    switches: [],
    spikes: [
      { x: 1530, y: 440, w: 170, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 280, y: 410 }, { x: 640, y: 410 }, { x: 820, y: 340 },
      { x: 1100, y: 290 }, { x: 1240, y: 380 }, { x: 1440, y: 310 },
      { x: 1740, y: 320 }, { x: 1740, y: 180 }, { x: 1960, y: 70 },
      { x: 2200, y: 160 }, { x: 2320, y: 210 }, { x: 2560, y: 260 },
      { x: 2900, y: 360 }, { x: 3060, y: 360 }, { x: 3160, y: 360 },
    ],
    qblocks: [{ x: 1900, y: 50 }],
    cblocks: [{ x: 2500, y: 220, hits: 3 }],
    trophies: [{ x: 1960, y: 50, collected: false }],
    powerupItems: [
      { x: 1060, y: 290, type: 'invincible' },
      { x: 2660, y: 320, type: 'heal' },
    ],
    enemies: [
      { x: 340,  y: 408, v: 1, hp: 4, elite: 'false' },
      { x: 820,  y: 338, v: 3, hp: 4, elite: 'false' },
      { x: 1440, y: 308, v: 5, hp: 5, elite: 'false' },
      { x: 2200, y: 158, v: 4, hp: 5, elite: 'false' },
      { x: 2560, y: 258, v: 11, hp: 5, elite: 'false' },
      { x: 3000, y: 336, v: 99, hp: 42, elite: 'false', w: 64, h: 64 },
    ],
    checkpoints: [
      { x: 780, y: 340, activated: false },
      { x: 1700, y: 320, activated: false },
      { x: 2500, y: 260, activated: false },
    ],
    spiritEmbers: [{ x: 1900, y: 60, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

];
