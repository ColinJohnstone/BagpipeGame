// levels/world-21-brackmarsh.js
// ──────────────────────────────────────────────────────────────────
// World 21 · BRACKMARSH — forest theme, fog weather. 🪻
// Signature: CRUMBLE + FALLAWAY footing over a sinking bog. Keep moving —
// the marsh swallows whatever you stand still on. Foggy wetland gauntlet.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W21 = [

  // ── L1 · SUNKEN BOARDWALK — gentle intro: rotting planks crumble ──
  {
    name: 'THE SUNKEN BOARDWALK',
    width: 2600, goalX: 2480, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#0a1410', '#1b3326'],
    platColors: ['#0c1a10', '#173021', '#2f5e3a', '#4f8a4c', '#8fcf6e'],
    accentColor: '#6a9a5a', accentColor2: '#bfe89a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'fog',
    timePar: 216, timeGold: 144,
    platforms: [
      { x: 0,    y: 450, w: 2600, h: 60, type: 'ground' },
      // gentle stepping planks; a few crumble to teach the mechanic
      { x: 260,  y: 390, w: 160, h: 18 },
      { x: 480,  y: 360, w: 150, h: 18, type: 'crumble', _id: 'l1c1' },
      { x: 700,  y: 360, w: 150, h: 18 },
      { x: 920,  y: 330, w: 150, h: 18, type: 'crumble', _id: 'l1c2' },
      { x: 1140, y: 330, w: 160, h: 18 },
      { x: 1380, y: 360, w: 150, h: 18, type: 'crumble', _id: 'l1c3' },
      { x: 1600, y: 360, w: 160, h: 18 },
      { x: 1830, y: 330, w: 150, h: 18, type: 'crumble', _id: 'l1c4' },
      { x: 2050, y: 330, w: 160, h: 18 },
      { x: 2270, y: 380, w: 150, h: 18 },
      { x: 2440, y: 420, w: 160, h: 18 },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [],
    coins: [
      { x: 300, y: 350 }, { x: 520, y: 320 }, { x: 740, y: 320 },
      { x: 960, y: 290 }, { x: 1180, y: 290 }, { x: 1420, y: 320 },
      { x: 1640, y: 320 }, { x: 1870, y: 290 }, { x: 2090, y: 290 },
      { x: 2310, y: 340 }, { x: 2480, y: 380 },
    ],
    qblocks: [{ x: 1140, y: 250 }],
    cblocks: [],
    trophies: [],
    powerupItems: [],
    enemies: [
      { x: 760, y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1640, y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1180, y: 288, v: 3, hp: 2, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 920, y: 290, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 60, y: 200, w: 360, title: 'THE BOG',
      lines: ['🪻 ROTTEN PLANKS CRUMBLE.', 'DO NOT LINGER —', 'KEEP MOVING FORWARD.'],
      color: '#bfe89a' }],
    highlights: [],
  },

  // ── L2 · QUAGMIRE STEPS — fallaway drops introduced + crumble combo ──
  {
    name: 'QUAGMIRE STEPS',
    width: 2800, goalX: 2680, goalY: 350,
    startX: 60, startY: 380,
    bgColors: ['#0a1410', '#1b3326'],
    platColors: ['#0c1a10', '#173021', '#2f5e3a', '#4f8a4c', '#8fcf6e'],
    accentColor: '#6a9a5a', accentColor2: '#bfe89a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'fog',
    timePar: 233, timeGold: 155,
    platforms: [
      { x: 0,    y: 450, w: 700, h: 60, type: 'ground' },
      // bog pit section 1: fallaway hops over a spike bog
      { x: 760,  y: 400, w: 130, h: 18, type: 'fallaway', _id: 'l2f1' },
      { x: 960,  y: 380, w: 130, h: 18, type: 'fallaway', _id: 'l2f2' },
      { x: 1160, y: 360, w: 140, h: 18 },
      { x: 1370, y: 340, w: 130, h: 18, type: 'crumble', _id: 'l2c1' },
      { x: 1570, y: 340, w: 140, h: 18 },
      // bog pit section 2
      { x: 1780, y: 380, w: 120, h: 18, type: 'fallaway', _id: 'l2f3' },
      { x: 1970, y: 360, w: 120, h: 18, type: 'fallaway', _id: 'l2f4' },
      { x: 2160, y: 340, w: 130, h: 18, type: 'crumble', _id: 'l2c2' },
      { x: 2360, y: 360, w: 140, h: 18 },
      { x: 2560, y: 400, w: 260, h: 18 },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [
      { x: 700, y: 510, w: 460, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1720, y: 510, w: 560, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 600, y: 400 }, { x: 820, y: 360 }, { x: 1020, y: 340 },
      { x: 1220, y: 320 }, { x: 1430, y: 300 }, { x: 1630, y: 300 },
      { x: 1840, y: 340 }, { x: 2030, y: 320 }, { x: 2220, y: 300 },
      { x: 2420, y: 320 }, { x: 2620, y: 360 },
    ],
    qblocks: [{ x: 1570, y: 260 }],
    cblocks: [{ x: 1160, y: 280, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 380, y: 408, type: 'rapid' }],
    enemies: [
      { x: 300, y: 408, v: 1, hp: 2, elite: 'false' },
      { x: 1160, y: 318, v: 3, hp: 3, elite: 'false' },
      { x: 2360, y: 318, v: 4, hp: 3, elite: 'false' },
      { x: 2640, y: 358, v: 0, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1570, y: 290, activated: false }],
    spiritEmbers: [{ x: 2160, y: 290, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 60, y: 210, w: 380, title: 'QUAGMIRE',
      lines: ['🪻 FALLAWAY TILES DROP', 'A MOMENT AFTER YOU TOUCH.', 'CROSS THE BOG FAST.'],
      color: '#bfe89a' }],
    highlights: [],
  },

  // ── L3 · TWIST · DRIFTWOOD & MIRE — conveyors + moving planks + crumble ──
  {
    name: 'DRIFTWOOD & MIRE',
    width: 3000, goalX: 2880, goalY: 350,
    startX: 60, startY: 380,
    bgColors: ['#0a1410', '#1b3326'],
    platColors: ['#0c1a10', '#173021', '#2f5e3a', '#4f8a4c', '#8fcf6e'],
    accentColor: '#6a9a5a', accentColor2: '#bfe89a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'fog',
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0,    y: 450, w: 560, h: 60, type: 'ground' },
      // conveyor drags you toward a crumble — keep momentum
      { x: 620,  y: 400, w: 200, h: 18, type: 'conveyor', dir: 1, speed: 2.0 },
      { x: 900,  y: 380, w: 130, h: 18, type: 'crumble', _id: 'l3c1' },
      { x: 1100, y: 360, w: 130, h: 18, type: 'fallaway', _id: 'l3f1' },
      { x: 1290, y: 340, w: 150, h: 18 },
      // moving driftwood ferries across a wide spike mire
      { x: 1520, y: 330, w: 150, h: 18, type: 'crumble', _id: 'l3c2' },
      { x: 1960, y: 330, w: 150, h: 18 },
      { x: 2160, y: 330, w: 130, h: 18, type: 'fallaway', _id: 'l3f2' },
      // reverse conveyor pushes you back — must out-run it
      { x: 2360, y: 350, w: 200, h: 18, type: 'conveyor', dir: -1, speed: 1.8 },
      { x: 2640, y: 360, w: 140, h: 18, type: 'crumble', _id: 'l3c3' },
      { x: 2820, y: 400, w: 180, h: 18 },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      { x: 1700, y: 330, x2: 1950, y2: 330, w: 120, h: 18, speed: 1.6 },
    ],
    switches: [],
    spikes: [
      { x: 1670, y: 510, w: 480, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 660, y: 360 }, { x: 760, y: 360 }, { x: 940, y: 340 },
      { x: 1140, y: 320 }, { x: 1340, y: 300 }, { x: 1560, y: 290 },
      { x: 1820, y: 290 }, { x: 2000, y: 290 }, { x: 2200, y: 290 },
      { x: 2420, y: 310 }, { x: 2680, y: 320 }, { x: 2860, y: 360 },
    ],
    qblocks: [{ x: 1290, y: 260 }],
    cblocks: [],
    trophies: [{ x: 1820, y: 250, collected: false }],
    powerupItems: [{ x: 1290, y: 300, type: 'big' }],
    enemies: [
      { x: 300, y: 408, v: 5, hp: 3, elite: 'false' },
      { x: 1290, y: 298, v: 8, hp: 3, elite: 'false' },
      { x: 1960, y: 288, v: 4, hp: 3, elite: 'false' },
      { x: 2820, y: 358, v: 7, hp: 4, elite: 'false' },
    ],
    checkpoints: [{ x: 1290, y: 300, activated: false }],
    spiritEmbers: [{ x: 2360, y: 290, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ── L4 · CHALLENGE · THE SWALLOWING DEEP — vertical climb, void below ──
  {
    name: 'THE SWALLOWING DEEP',
    width: 2900, goalX: 2780, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#080f0c', '#15281e'],
    platColors: ['#0c1a10', '#173021', '#2f5e3a', '#4f8a4c', '#8fcf6e'],
    accentColor: '#6a9a5a', accentColor2: '#bfe89a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'fog',
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0,    y: 450, w: 520, h: 60, type: 'ground' },
      // descending then climbing run of collapsing footing over spike bog
      { x: 580,  y: 400, w: 120, h: 18, type: 'crumble', _id: 'l4c1' },
      { x: 760,  y: 380, w: 120, h: 18, type: 'fallaway', _id: 'l4f1' },
      { x: 940,  y: 360, w: 120, h: 18, type: 'crumble', _id: 'l4c2' },
      { x: 1120, y: 360, w: 130, h: 18 },
      // vertical set-piece: zig-zag up, each tile collapses
      { x: 1300, y: 380, w: 120, h: 18, type: 'fallaway', _id: 'l4f2' },
      { x: 1300, y: 290, w: 120, h: 18, type: 'crumble', _id: 'l4c3' },
      { x: 1480, y: 230, w: 120, h: 18, type: 'fallaway', _id: 'l4f3' },
      { x: 1660, y: 280, w: 130, h: 18 },
      { x: 1860, y: 320, w: 120, h: 18, type: 'crumble', _id: 'l4c4' },
      { x: 2040, y: 340, w: 120, h: 18, type: 'fallaway', _id: 'l4f4' },
      { x: 2230, y: 320, w: 130, h: 18 },
      { x: 2430, y: 340, w: 120, h: 18, type: 'crumble', _id: 'l4c5' },
      { x: 2620, y: 360, w: 160, h: 18 },
      { x: 2760, y: 400, w: 140, h: 18 },
    ],
    icePlats: [],
    bounces: [
      { x: 1480, y: 410, w: 90, h: 18, rotation: 0 },
    ],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 520, y: 510, w: 760, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1800, y: 510, w: 600, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 620, y: 360 }, { x: 800, y: 340 }, { x: 980, y: 320 },
      { x: 1160, y: 320 }, { x: 1340, y: 250 }, { x: 1530, y: 190 },
      { x: 1710, y: 240 }, { x: 1900, y: 280 }, { x: 2080, y: 300 },
      { x: 2270, y: 280 }, { x: 2470, y: 300 }, { x: 2660, y: 320 },
    ],
    qblocks: [{ x: 1660, y: 200 }],
    cblocks: [{ x: 1120, y: 280, hits: 3 }],
    trophies: [{ x: 1530, y: 150, collected: false }],
    powerupItems: [{ x: 1120, y: 300, type: 'extrajump' }],
    enemies: [
      { x: 300, y: 408, v: 5, hp: 4, elite: 'false' },
      { x: 1120, y: 318, v: 3, hp: 4, elite: 'false' },
      { x: 1660, y: 238, v: 4, hp: 4, elite: 'false' },
      { x: 2230, y: 278, v: 14, hp: 5, elite: 'false' },
      { x: 2620, y: 318, v: 7, hp: 5, elite: 'false' },
    ],
    checkpoints: [
      { x: 1120, y: 320, activated: false },
      { x: 2230, y: 280, activated: false },
    ],
    spiritEmbers: [{ x: 1530, y: 110, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ── L5 · FINALE · HEART OF BRACKMARSH — gauntlet + mini-boss ──
  {
    name: 'HEART OF BRACKMARSH',
    width: 3300, goalX: 3180, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#060c09', '#122319'],
    platColors: ['#0c1a10', '#173021', '#2f5e3a', '#4f8a4c', '#8fcf6e'],
    accentColor: '#6a9a5a', accentColor2: '#d4ffae',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'fog',
    timePar: 275, timeGold: 183,
    platforms: [
      { x: 0,    y: 450, w: 560, h: 60, type: 'ground' },
      // gauntlet of collapsing footing over a long spike mire
      { x: 620,  y: 400, w: 120, h: 18, type: 'crumble', _id: 'l5c1' },
      { x: 800,  y: 380, w: 110, h: 18, type: 'fallaway', _id: 'l5f1' },
      { x: 970,  y: 360, w: 110, h: 18, type: 'crumble', _id: 'l5c2' },
      { x: 1140, y: 360, w: 120, h: 18, type: 'fallaway', _id: 'l5f2' },
      { x: 1320, y: 340, w: 130, h: 18 },
      { x: 1510, y: 360, w: 110, h: 18, type: 'crumble', _id: 'l5c3' },
      { x: 1680, y: 380, w: 110, h: 18, type: 'fallaway', _id: 'l5f3' },
      { x: 1850, y: 360, w: 120, h: 18, type: 'crumble', _id: 'l5c4' },
      // solid arena before boss
      { x: 2040, y: 360, w: 260, h: 18 },
      // boss island (solid, large)
      { x: 2400, y: 380, w: 420, h: 18 },
      // exit run after boss
      { x: 2900, y: 360, w: 130, h: 18, type: 'crumble', _id: 'l5c5' },
      { x: 3080, y: 420, w: 220, h: 18 },
    ],
    icePlats: [],
    bounces: [
      { x: 1320, y: 410, w: 90, h: 18, rotation: 0 },
    ],
    movingPlats: [
      { x: 2040, y: 250, x2: 2300, y2: 250, w: 120, h: 18, speed: 1.5 },
    ],
    switches: [],
    spikes: [
      { x: 560, y: 510, w: 1480, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 660, y: 360 }, { x: 840, y: 340 }, { x: 1010, y: 320 },
      { x: 1180, y: 320 }, { x: 1370, y: 300 }, { x: 1550, y: 320 },
      { x: 1720, y: 340 }, { x: 1890, y: 320 }, { x: 2100, y: 320 },
      { x: 2200, y: 320 }, { x: 2500, y: 340 }, { x: 2700, y: 340 },
      { x: 2960, y: 320 }, { x: 3120, y: 340 },
    ],
    qblocks: [{ x: 2040, y: 290 }, { x: 2240, y: 290 }],
    cblocks: [{ x: 2600, y: 280, hits: 3 }],
    trophies: [{ x: 2160, y: 180, collected: false }],
    powerupItems: [
      { x: 2080, y: 320, type: 'invincible' },
      { x: 2260, y: 320, type: 'heal' },
    ],
    enemies: [
      { x: 1320, y: 298, v: 8, hp: 4, elite: 'false' },
      { x: 2040, y: 318, v: 4, hp: 4, elite: 'false' },
      // mini-boss on the central island
      { x: 2580, y: 314, v: 97, hp: 38, w: 64, h: 64, elite: 'false' },
      { x: 3080, y: 376, v: 7, hp: 5, elite: 'false' },
    ],
    checkpoints: [
      { x: 1320, y: 300, activated: false },
      { x: 2200, y: 320, activated: false },
    ],
    spiritEmbers: [{ x: 2160, y: 140, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

];
