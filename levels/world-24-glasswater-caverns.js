// levels/world-24-glasswater-caverns.js
// ──────────────────────────────────────────────────────────────────
// World 24 · GLASSWATER CAVERNS — coralreef theme, tide weather. 🫧
// Signature: WATER swim pools + WINDTUNNEL updrafts. Sink, swim, and
// ride bubble columns up flooded caverns.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W24 = [

  // ════════════════════════════════════════════════════════════════
  // L1 — INTRO: teach water pools + a single gentle updraft.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'TIDEPOOL SHALLOWS',
    width: 2600, goalX: 2480, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#031a26', '#06465c'],
    platColors: ['#03161a', '#073030', '#10504e', '#1f8480', '#8ef0e0'],
    accentColor: '#3aa8d0', accentColor2: '#8ef0e0',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 216, timeGold: 144,
    platforms: [
      { x: 0,    y: 450, w: 520, h: 60, type: 'ground' },
      { x: 520,  y: 400, w: 420, h: 50, type: 'water' },   // first wade pool
      { x: 940,  y: 450, w: 380, h: 60, type: 'ground' },
      { x: 1320, y: 400, w: 360, h: 50, type: 'water' },   // second pool
      { x: 1680, y: 450, w: 920, h: 60, type: 'ground' },
      // gentle footholds
      { x: 280,  y: 370, w: 120, h: 18 },
      { x: 640,  y: 330, w: 110, h: 18 },
      { x: 1020, y: 360, w: 130, h: 18 },
      { x: 1420, y: 320, w: 110, h: 18 },
      // single teaching updraft lifts you onto a high ledge
      { x: 1700, y: 250, w: 80,  h: 200, type: 'windtunnel', lift: 1.0 },
      { x: 1820, y: 280, w: 140, h: 18 },
      { x: 2040, y: 330, w: 130, h: 18 },
      { x: 2260, y: 390, w: 160, h: 18 },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [],
    coins: [
      { x: 300, y: 330 }, { x: 660, y: 290 }, { x: 760, y: 360 },
      { x: 1040, y: 320 }, { x: 1440, y: 280 }, { x: 1540, y: 360 },
      { x: 1740, y: 320 }, { x: 1740, y: 250 }, { x: 1740, y: 180 },
      { x: 1860, y: 240 }, { x: 2080, y: 290 }, { x: 2300, y: 350 },
    ],
    qblocks: [{ x: 1020, y: 280 }],
    cblocks: [],
    trophies: [],
    powerupItems: [{ x: 1860, y: 200, type: 'heal' }],
    enemies: [
      { x: 1060, y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1760, y: 408, v: 1, hp: 2, elite: 'false' },
      { x: 2300, y: 408, v: 3, hp: 2, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 760, y: 420, collected: false, idx: 0 }], // hidden in first pool
    marsBarPieces: [],
    signs: [{ x: 60, y: 200, w: 360, title: 'TIDEPOOL SHALLOWS',
      lines: ['🫧 WATER SLOWS YOU —', 'SINK IN, THEN SWIM UP.', 'BUBBLE COLUMNS LIFT YOU.'],
      color: '#8ef0e0' }],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L2 — DEVELOP: alternating swim pools and updraft columns.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'FLOODED GROTTO RUN',
    width: 2900, goalX: 2780, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#03161f', '#064254'],
    platColors: ['#03161a', '#073030', '#10504e', '#1f8480', '#8ef0e0'],
    accentColor: '#3aa8d0', accentColor2: '#8ef0e0',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0,    y: 450, w: 420, h: 60, type: 'ground' },
      { x: 420,  y: 390, w: 300, h: 60, type: 'water' },   // deep dive pool
      { x: 720,  y: 450, w: 260, h: 60, type: 'ground' },
      // first updraft over a gap
      { x: 1020, y: 250, w: 80,  h: 200, type: 'windtunnel', lift: 1.0 },
      { x: 1160, y: 270, w: 140, h: 18 },
      { x: 1360, y: 320, w: 130, h: 18 },
      { x: 1540, y: 390, w: 260, h: 50, type: 'water' },   // mid pool
      { x: 1800, y: 450, w: 240, h: 60, type: 'ground' },
      // second updraft, taller
      { x: 2080, y: 230, w: 80,  h: 220, type: 'windtunnel', lift: 1.05 },
      { x: 2220, y: 250, w: 140, h: 18 },
      { x: 2420, y: 300, w: 120, h: 18 },
      { x: 2620, y: 350, w: 280, h: 18 },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [
      { x: 980, y: 426, w: 40, h: 24, rotation: 0, spikeType: 'static' }, // small pit edge under updraft
    ],
    coins: [
      { x: 470, y: 350 }, { x: 570, y: 410 }, { x: 670, y: 350 },
      { x: 1060, y: 320 }, { x: 1060, y: 240 }, { x: 1060, y: 170 },
      { x: 1200, y: 230 }, { x: 1400, y: 280 },
      { x: 1620, y: 350 }, { x: 1720, y: 410 },
      { x: 2120, y: 300 }, { x: 2120, y: 220 }, { x: 2120, y: 150 },
      { x: 2260, y: 210 }, { x: 2460, y: 260 }, { x: 2680, y: 310 },
    ],
    qblocks: [{ x: 760, y: 360 }],
    cblocks: [{ x: 1360, y: 250, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1200, y: 190, type: 'rapid' }],
    enemies: [
      { x: 760, y: 408, v: 1, hp: 2, elite: 'false' },
      { x: 1200, y: 228, v: 4, hp: 3, elite: 'false' },
      { x: 1840, y: 408, v: 5, hp: 3, elite: 'false' },
      { x: 2640, y: 308, v: 3, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1820, y: 400, activated: false }],
    spiritEmbers: [{ x: 1660, y: 420, collected: false, idx: 0 }], // bottom of mid pool
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L3 — TWIST: combine updrafts with moving plats, conveyors and
  // an underwater spike floor you must swim over.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'GLASSWATER CONFLUENCE',
    width: 3100, goalX: 2980, goalY: 300,
    startX: 60, startY: 380,
    bgColors: ['#02141d', '#063e50'],
    platColors: ['#03161a', '#073030', '#10504e', '#1f8480', '#8ef0e0'],
    accentColor: '#3aa8d0', accentColor2: '#8ef0e0',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 258, timeGold: 172,
    platforms: [
      { x: 0,    y: 450, w: 380, h: 60, type: 'ground' },
      // conveyor belt feeds you toward first updraft
      { x: 380,  y: 410, w: 220, h: 18, type: 'conveyor', dir: 1, speed: 2.0 },
      { x: 640,  y: 250, w: 80,  h: 200, type: 'windtunnel', lift: 1.0 },
      { x: 780,  y: 260, w: 130, h: 18 },
      { x: 960,  y: 300, w: 120, h: 18 },
      // deep pool with a spike floor — swim over, don't sink onto spikes
      { x: 1100, y: 360, w: 420, h: 90, type: 'water' },
      { x: 1240, y: 330, w: 100, h: 18 },
      { x: 1420, y: 300, w: 110, h: 18 },
      { x: 1560, y: 450, w: 220, h: 60, type: 'ground' },
      // moving platform crosses a wide chasm
      { x: 1900, y: 330, w: 130, h: 18 },
      { x: 2200, y: 300, w: 120, h: 18 },
      // second updraft into upper coral shelf
      { x: 2360, y: 220, w: 80,  h: 230, type: 'windtunnel', lift: 1.05 },
      { x: 2500, y: 250, w: 140, h: 18 },
      { x: 2700, y: 300, w: 130, h: 18 },
      { x: 2880, y: 360, w: 220, h: 18 },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      { x: 1780, y: 400, x2: 1780, y2: 280, w: 110, h: 18, speed: 1.5 }, // up/down ferry over chasm
    ],
    switches: [],
    spikes: [
      { x: 1100, y: 426, w: 420, h: 24, rotation: 0, spikeType: 'static' }, // floor under the pool
    ],
    coins: [
      { x: 440, y: 370 }, { x: 540, y: 370 },
      { x: 680, y: 320 }, { x: 680, y: 240 }, { x: 680, y: 170 },
      { x: 820, y: 220 }, { x: 1000, y: 260 },
      { x: 1290, y: 300 }, { x: 1460, y: 270 },
      { x: 1830, y: 320 }, { x: 1950, y: 290 },
      { x: 2240, y: 260 },
      { x: 2400, y: 300 }, { x: 2400, y: 220 }, { x: 2400, y: 150 },
      { x: 2560, y: 210 }, { x: 2740, y: 260 },
    ],
    qblocks: [{ x: 960, y: 260 }],
    cblocks: [{ x: 1420, y: 260, hits: 3 }],
    trophies: [{ x: 2400, y: 110, collected: false }],
    powerupItems: [{ x: 1560, y: 410, type: 'shield' }],
    enemies: [
      { x: 800, y: 218, v: 4, hp: 3, elite: 'false' },
      { x: 1640, y: 408, v: 5, hp: 4, elite: 'false' },
      { x: 2240, y: 258, v: 3, hp: 3, elite: 'false' },
      { x: 2560, y: 208, v: 7, hp: 4, elite: 'false' },
      { x: 2920, y: 318, v: 4, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1600, y: 400, activated: false }],
    spiritEmbers: [{ x: 1320, y: 430, collected: false, idx: 0 }], // tucked above spikes inside pool
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L4 — CHALLENGE: vertical flooded shaft. Chain of updrafts and
  // water columns with timed and crumble platforms.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'THE DROWNED ASCENT',
    width: 3000, goalX: 2880, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#02101a', '#053848'],
    platColors: ['#03161a', '#073030', '#10504e', '#1f8480', '#8ef0e0'],
    accentColor: '#3aa8d0', accentColor2: '#8ef0e0',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0,    y: 450, w: 360, h: 60, type: 'ground' },
      { x: 360,  y: 380, w: 280, h: 70, type: 'water' },   // sink to start
      { x: 640,  y: 450, w: 200, h: 60, type: 'ground' },
      // vertical climb begins: updraft then crumble step
      { x: 880,  y: 250, w: 80,  h: 200, type: 'windtunnel', lift: 1.05 },
      { x: 1020, y: 270, w: 120, h: 18, type: 'crumble', _id: 'w24l4c1' },
      { x: 1200, y: 320, w: 120, h: 18 },
      // timed platform gates the next column
      { x: 1360, y: 270, w: 120, h: 18, type: 'timed', period: 180, _id: 'w24l4t1' },
      { x: 1520, y: 220, w: 80,  h: 230, type: 'windtunnel', lift: 1.05 },
      { x: 1660, y: 250, w: 120, h: 18 },
      { x: 1840, y: 300, w: 120, h: 18 },
      // mid platform over a deep pool
      { x: 2000, y: 360, w: 300, h: 90, type: 'water' },
      { x: 2120, y: 330, w: 100, h: 18 },
      { x: 2340, y: 450, w: 160, h: 60, type: 'ground' },
      // final updraft to the goal shelf
      { x: 2540, y: 230, w: 80,  h: 220, type: 'windtunnel', lift: 1.05 },
      { x: 2680, y: 260, w: 130, h: 18 },
      { x: 2840, y: 380, w: 160, h: 18 },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [
      { x: 2000, y: 426, w: 300, h: 24, rotation: 0, spikeType: 'static' }, // floor under deep pool
    ],
    coins: [
      { x: 420, y: 340 }, { x: 540, y: 400 },
      { x: 920, y: 320 }, { x: 920, y: 240 }, { x: 920, y: 160 },
      { x: 1060, y: 230 }, { x: 1240, y: 280 }, { x: 1400, y: 230 },
      { x: 1560, y: 300 }, { x: 1560, y: 220 }, { x: 1560, y: 150 },
      { x: 1700, y: 210 }, { x: 1880, y: 260 },
      { x: 2160, y: 300 },
      { x: 2580, y: 300 }, { x: 2580, y: 220 }, { x: 2580, y: 150 },
      { x: 2720, y: 220 },
    ],
    qblocks: [{ x: 1200, y: 280 }],
    cblocks: [{ x: 1840, y: 260, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 920, y: 130, type: 'extrajump' },
      { x: 2340, y: 410, type: 'heal' },
    ],
    enemies: [
      { x: 700, y: 408, v: 5, hp: 4, elite: 'false' },
      { x: 1240, y: 278, v: 4, hp: 3, elite: 'false' },
      { x: 1700, y: 208, v: 8, hp: 4, elite: 'false' },
      { x: 1880, y: 258, v: 7, hp: 5, elite: 'false' },
      { x: 2400, y: 408, v: 14, hp: 5, elite: 'false' },
      { x: 2720, y: 218, v: 4, hp: 4, elite: 'false' },
    ],
    checkpoints: [
      { x: 660, y: 400, activated: false },
      { x: 2360, y: 400, activated: false },
    ],
    spiritEmbers: [{ x: 2100, y: 430, collected: false, idx: 0 }], // bottom of final pool
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L5 — FINALE: climactic flooded cathedral. Dense gauntlet of
  // updrafts, swim chambers, moving ferries, ending in a mini-boss.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'CATHEDRAL OF THE DEEP TIDE',
    width: 3300, goalX: 3180, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#020c14', '#053040'],
    platColors: ['#03161a', '#073030', '#10504e', '#1f8480', '#8ef0e0'],
    accentColor: '#3aa8d0', accentColor2: '#8ef0e0',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 275, timeGold: 183,
    platforms: [
      { x: 0,    y: 450, w: 340, h: 60, type: 'ground' },
      // opening swim chamber
      { x: 340,  y: 380, w: 340, h: 70, type: 'water' },
      { x: 680,  y: 450, w: 200, h: 60, type: 'ground' },
      // updraft #1
      { x: 920,  y: 250, w: 80,  h: 200, type: 'windtunnel', lift: 1.05 },
      { x: 1060, y: 270, w: 120, h: 18 },
      { x: 1240, y: 320, w: 110, h: 18 },
      // conveyor over a spike-floored pool
      { x: 1380, y: 290, w: 200, h: 18, type: 'conveyor', dir: 1, speed: 2.2 },
      { x: 1600, y: 360, w: 320, h: 90, type: 'water' },
      { x: 1720, y: 330, w: 100, h: 18 },
      { x: 1960, y: 450, w: 180, h: 60, type: 'ground' },
      // updraft #2 into the boss arena approach
      { x: 2160, y: 230, w: 80,  h: 220, type: 'windtunnel', lift: 1.1 },
      { x: 2300, y: 260, w: 130, h: 18 },
      { x: 2500, y: 320, w: 130, h: 18 },
      // BOSS ARENA platform
      { x: 2700, y: 420, w: 460, h: 30, type: 'ground' },
      // final updraft to the goal shelf above the arena
      { x: 3000, y: 230, w: 80,  h: 200, type: 'windtunnel', lift: 1.05 },
      { x: 3120, y: 380, w: 180, h: 18 },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      { x: 2640, y: 280, x2: 2900, y2: 280, w: 110, h: 18, speed: 1.6 }, // ferry across arena gap
    ],
    switches: [],
    spikes: [
      { x: 1600, y: 426, w: 320, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 420, y: 340 }, { x: 540, y: 400 }, { x: 640, y: 340 },
      { x: 960, y: 320 }, { x: 960, y: 240 }, { x: 960, y: 160 },
      { x: 1120, y: 230 }, { x: 1300, y: 280 }, { x: 1480, y: 250 },
      { x: 1660, y: 320 },
      { x: 2200, y: 300 }, { x: 2200, y: 220 }, { x: 2200, y: 150 },
      { x: 2360, y: 220 }, { x: 2560, y: 280 },
      { x: 3040, y: 300 }, { x: 3040, y: 220 }, { x: 3040, y: 150 },
    ],
    qblocks: [{ x: 1240, y: 280 }, { x: 2500, y: 280 }],
    cblocks: [{ x: 1060, y: 230, hits: 3 }],
    trophies: [{ x: 2200, y: 110, collected: false }],
    powerupItems: [
      { x: 1960, y: 410, type: 'invincible' },
      { x: 2300, y: 220, type: 'rapid' },
      { x: 2730, y: 380, type: 'heal' },
    ],
    enemies: [
      { x: 760, y: 408, v: 5, hp: 4, elite: 'false' },
      { x: 1120, y: 228, v: 4, hp: 4, elite: 'false' },
      { x: 1300, y: 278, v: 8, hp: 4, elite: 'false' },
      { x: 2360, y: 218, v: 7, hp: 5, elite: 'false' },
      { x: 2560, y: 278, v: 13, hp: 4, elite: 'false' },
      // mini-boss: juggernaut in the cathedral arena
      { x: 2900, y: 356, v: 97, hp: 38, elite: 'false', w: 64, h: 64 },
    ],
    checkpoints: [
      { x: 700, y: 400, activated: false },
      { x: 1980, y: 400, activated: false },
    ],
    spiritEmbers: [{ x: 1700, y: 430, collected: false, idx: 0 }], // deep in the spiked pool
    marsBarPieces: [],
    signs: [{ x: 2700, y: 240, w: 360, title: 'CATHEDRAL OF THE DEEP TIDE',
      lines: ['🫧 THE TIDE GUARDIAN STIRS.', 'RIDE THE BUBBLES, STRIKE,', 'THEN ASCEND TO THE LIGHT.'],
      color: '#8ef0e0' }],
    highlights: [],
  },

];
