// levels/world-20-tidewatch-cliffs.js
// ──────────────────────────────────────────────────────────────────
// World 20 · TIDEWATCH CLIFFS — coralreef theme, tide weather.
// Signature: MOVING-PLATFORM TIMING over the surf. Ferry across tidal
// gaps; rising-tide rhythm. Coastal cliffs.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W20 = [

  // ── L1: TIDE-FERRY SHALLOWS (intro — teach moving-platform timing) ──
  {
    name: 'TIDE-FERRY SHALLOWS',
    width: 2400, goalX: 2280, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#04222e', '#0a4a5e'],
    platColors: ['#03161c', '#06303a', '#0e5260', '#1f8a98', '#7ef0e0'],
    accentColor: '#36c8e0', accentColor2: '#ff9a72',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 200, timeGold: 134,
    platforms: [
      { x: 0,    y: 450, w: 560, h: 60, type: 'ground' },
      { x: 940,  y: 450, w: 360, h: 60, type: 'ground' },
      { x: 1680, y: 450, w: 320, h: 60, type: 'ground' },
      { x: 2120, y: 450, w: 280, h: 60, type: 'ground' },
      // resting cliff ledges
      { x: 380,  y: 360, w: 140, h: 18 },
      { x: 1000, y: 360, w: 140, h: 18 },
      { x: 1740, y: 360, w: 140, h: 18 },
      // goal landing
      { x: 2200, y: 450, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      // ferry across first surf gap (560 -> 940)
      { x: 600, y: 410, x2: 880, y2: 410, w: 110, h: 18, speed: 1.4 },
      // ferry across second gap (1300 -> 1680)
      { x: 1340, y: 410, x2: 1620, y2: 410, w: 110, h: 18, speed: 1.5 },
    ],
    switches: [],
    spikes: [
      { x: 560,  y: 470, w: 380, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1300, y: 470, w: 380, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2000, y: 470, w: 120, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 420, y: 320 }, { x: 470, y: 320 },
      { x: 700, y: 380 }, { x: 780, y: 380 },
      { x: 1040, y: 320 }, { x: 1090, y: 320 },
      { x: 1440, y: 380 }, { x: 1520, y: 380 },
      { x: 1780, y: 320 }, { x: 1830, y: 320 },
      { x: 2180, y: 410 },
    ],
    qblocks: [{ x: 1000, y: 280 }],
    cblocks: [],
    trophies: [],
    powerupItems: [],
    enemies: [
      { x: 1020, y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 2160, y: 408, v: 1, hp: 2, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 380, y: 320, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 60, y: 220, w: 360, title: 'TIDE-FERRY',
      lines: ['🌊 SURF GAPS ARE DEADLY.', 'RIDE THE MOVING FERRY', 'PLATFORMS ACROSS. TIME IT.'],
      color: '#36c8e0' }],
    highlights: [],
  },

  // ── L2: CLIFFSIDE CROSSINGS (develop — chained ferries + verticals) ──
  {
    name: 'CLIFFSIDE CROSSINGS',
    width: 2800, goalX: 2680, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#04222e', '#0a4a5e'],
    platColors: ['#03161c', '#06303a', '#0e5260', '#1f8a98', '#7ef0e0'],
    accentColor: '#36c8e0', accentColor2: '#ff9a72',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 233, timeGold: 156,
    platforms: [
      { x: 0,    y: 450, w: 420, h: 60, type: 'ground' },
      { x: 1120, y: 450, w: 240, h: 60, type: 'ground' },
      { x: 1900, y: 450, w: 240, h: 60, type: 'ground' },
      // ascending cliff steps after the long ferry crossing
      { x: 460,  y: 380, w: 120, h: 18 },
      { x: 640,  y: 320, w: 120, h: 18 },
      { x: 1420, y: 380, w: 120, h: 18 },
      { x: 1600, y: 320, w: 120, h: 18 },
      { x: 1740, y: 260, w: 120, h: 18 },
      // upper cliff shelf leading to goal
      { x: 2200, y: 400, w: 140, h: 18 },
      { x: 2400, y: 360, w: 140, h: 18 },
      { x: 2600, y: 410, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      // long surf crossing, two staggered ferries (640 cliff -> 1120 ground)
      { x: 820,  y: 360, x2: 820,  y2: 360, w: 100, h: 18, speed: 1.4 }, // static-ish anchor mid
      { x: 760,  y: 300, x2: 1040, y2: 300, w: 100, h: 18, speed: 1.6 },
      // crossing from cliff top (1740) down/across to 1900 ground
      { x: 1860, y: 320, x2: 1860, y2: 410, w: 110, h: 18, speed: 1.3 },
      // crossing the wide final gap (2140 -> 2200)
      { x: 2150, y: 400, x2: 2150, y2: 320, w: 100, h: 18, speed: 1.5 },
    ],
    switches: [],
    spikes: [
      { x: 420,  y: 470, w: 700, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1360, y: 470, w: 540, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2140, y: 470, w: 460, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 500, y: 340 }, { x: 680, y: 280 },
      { x: 800, y: 260 }, { x: 880, y: 260 },
      { x: 1180, y: 410 }, { x: 1240, y: 410 },
      { x: 1460, y: 340 }, { x: 1640, y: 280 }, { x: 1780, y: 220 },
      { x: 2240, y: 360 }, { x: 2440, y: 320 },
      { x: 2660, y: 370 },
    ],
    qblocks: [{ x: 1740, y: 220 }],
    cblocks: [{ x: 1180, y: 360, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1140, y: 400, type: 'rapid' }],
    enemies: [
      { x: 1180, y: 408, v: 1, hp: 3, elite: 'false' },
      { x: 1740, y: 218, v: 3, hp: 3, elite: 'false' },
      { x: 1960, y: 408, v: 4, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1180, y: 400, activated: false }],
    spiritEmbers: [{ x: 880, y: 220, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ── L3: SURGE CHANNEL (twist — windtunnel surf + conveyors + ferries) ──
  {
    name: 'SURGE CHANNEL',
    width: 3000, goalX: 2880, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#04222e', '#0a4a5e'],
    platColors: ['#03161c', '#06303a', '#0e5260', '#1f8a98', '#7ef0e0'],
    accentColor: '#36c8e0', accentColor2: '#ff9a72',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0,    y: 450, w: 380, h: 60, type: 'ground' },
      { x: 900,  y: 450, w: 220, h: 60, type: 'ground' },
      { x: 1600, y: 450, w: 220, h: 60, type: 'ground' },
      { x: 2360, y: 450, w: 240, h: 60, type: 'ground' },
      // conveyor belts pushing toward the gaps (drift you onto ferries)
      { x: 380,  y: 400, w: 200, h: 16, type: 'conveyor', dir: 1, speed: 2.2 },
      { x: 1120, y: 400, w: 200, h: 16, type: 'conveyor', dir: 1, speed: 2.4 },
      // landing shelves
      { x: 1380, y: 340, w: 120, h: 18 },
      { x: 1900, y: 360, w: 120, h: 18 },
      { x: 2120, y: 320, w: 120, h: 18 },
      // upper run to goal
      { x: 2640, y: 380, w: 140, h: 18 },
      { x: 2800, y: 410, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      // ferry across channel 1 (conveyor flings you, catch the ferry)
      { x: 620,  y: 400, x2: 860,  y2: 400, w: 110, h: 18, speed: 1.7 },
      // ferry across channel 2
      { x: 1340, y: 400, x2: 1340, y2: 340, w: 100, h: 18, speed: 1.5 },
      // vertical ferry rising on the tide
      { x: 1660, y: 410, x2: 1660, y2: 280, w: 100, h: 18, speed: 1.4 },
      // diagonal ferry across the widest surf gap (1820 -> 2360)
      { x: 2000, y: 300, x2: 2240, y2: 380, w: 110, h: 18, speed: 1.6 },
    ],
    switches: [],
    spikes: [
      { x: 380,  y: 470, w: 520, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1120, y: 470, w: 480, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1820, y: 470, w: 540, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 440, y: 360 }, { x: 520, y: 360 },
      { x: 700, y: 360 }, { x: 780, y: 360 },
      { x: 960, y: 410 }, { x: 1180, y: 360 }, { x: 1260, y: 360 },
      { x: 1420, y: 300 }, { x: 1660, y: 260 },
      { x: 1940, y: 320 }, { x: 2160, y: 280 },
      { x: 2680, y: 340 }, { x: 2860, y: 370 },
    ],
    qblocks: [{ x: 2120, y: 280 }],
    cblocks: [],
    trophies: [{ x: 1660, y: 240, collected: false }],
    powerupItems: [{ x: 960, y: 410, type: 'shield' }],
    enemies: [
      { x: 960, y: 408, v: 5, hp: 3, elite: 'false' },
      { x: 1620, y: 408, v: 4, hp: 3, elite: 'false' },
      { x: 2400, y: 408, v: 8, hp: 4, elite: 'false' },
    ],
    checkpoints: [{ x: 960, y: 400, activated: false }],
    spiritEmbers: [{ x: 1380, y: 300, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ── L4: HIGH-TIDE GAUNTLET (challenge — dense ferry timing + hazards) ──
  {
    name: 'HIGH-TIDE GAUNTLET',
    width: 3200, goalX: 3080, goalY: 300,
    startX: 60, startY: 380,
    bgColors: ['#03202c', '#093f52'],
    platColors: ['#03161c', '#06303a', '#0e5260', '#1f8a98', '#7ef0e0'],
    accentColor: '#36c8e0', accentColor2: '#ff7a52',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 266, timeGold: 178,
    platforms: [
      { x: 0,    y: 450, w: 320, h: 60, type: 'ground' },
      { x: 880,  y: 450, w: 180, h: 60, type: 'ground' },
      { x: 1640, y: 450, w: 180, h: 60, type: 'ground' },
      { x: 2380, y: 450, w: 180, h: 60, type: 'ground' },
      // small mid-air rest shelves
      { x: 600,  y: 360, w: 100, h: 18 },
      { x: 1320, y: 340, w: 110, h: 18 },
      { x: 2080, y: 340, w: 110, h: 18 },
      // climbing cliff to goal
      { x: 2620, y: 400, w: 120, h: 18 },
      { x: 2800, y: 350, w: 120, h: 18 },
      { x: 2980, y: 400, w: 220, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [
      { x: 2560, y: 432, w: 80, h: 18, rotation: 0 },
    ],
    movingPlats: [
      // gap 1: two staggered ferries (320 -> 880)
      { x: 420,  y: 400, x2: 420,  y2: 320, w: 90, h: 18, speed: 1.6 },
      { x: 660,  y: 360, x2: 820,  y2: 400, w: 100, h: 18, speed: 1.8 },
      // gap 2: fast horizontal ferry (1060 -> 1640)
      { x: 1140, y: 410, x2: 1420, y2: 410, w: 100, h: 18, speed: 2.0 },
      { x: 1440, y: 360, x2: 1600, y2: 360, w: 90, h: 18, speed: 1.7 },
      // gap 3: vertical tide ferry (1820 -> 2380)
      { x: 1900, y: 410, x2: 1900, y2: 300, w: 90, h: 18, speed: 1.5 },
      { x: 2160, y: 320, x2: 2320, y2: 400, w: 100, h: 18, speed: 1.9 },
    ],
    switches: [],
    spikes: [
      { x: 320,  y: 470, w: 560, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1060, y: 470, w: 580, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1820, y: 470, w: 560, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2560, y: 470, w: 420, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 460, y: 360 }, { x: 620, y: 320 },
      { x: 700, y: 320 }, { x: 920, y: 410 },
      { x: 1240, y: 370 }, { x: 1360, y: 300 },
      { x: 1480, y: 320 }, { x: 1680, y: 410 },
      { x: 1940, y: 320 }, { x: 2120, y: 300 },
      { x: 2240, y: 360 }, { x: 2660, y: 360 }, { x: 2840, y: 310 },
    ],
    qblocks: [{ x: 1320, y: 300 }],
    cblocks: [{ x: 920, y: 360, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 2080, y: 300, type: 'invincible' }],
    enemies: [
      { x: 920,  y: 408, v: 5, hp: 4, elite: 'false' },
      { x: 1660, y: 408, v: 7, hp: 5, elite: 'false' },
      { x: 2400, y: 408, v: 4, hp: 4, elite: 'false' },
      { x: 1320, y: 298, v: 3, hp: 4, elite: 'false' },
    ],
    checkpoints: [
      { x: 920,  y: 400, activated: false },
      { x: 1680, y: 400, activated: false },
    ],
    spiritEmbers: [{ x: 2080, y: 300, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ── L5: TIDEWATCH SUMMIT (finale — vertical set-piece + mini-boss) ──
  {
    name: 'TIDEWATCH SUMMIT',
    width: 3000, goalX: 2880, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#02192a', '#0a3a58'],
    platColors: ['#03141c', '#06303a', '#0e5260', '#1f8a98', '#7ef0e0'],
    accentColor: '#36c8e0', accentColor2: '#ff6a4a',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0,    y: 450, w: 460, h: 60, type: 'ground' },
      { x: 1080, y: 450, w: 220, h: 60, type: 'ground' },
      // vertical climbing cliff (set-piece)
      { x: 1340, y: 390, w: 120, h: 18 },
      { x: 1180, y: 320, w: 120, h: 18 },
      { x: 1360, y: 250, w: 120, h: 18 },
      { x: 1200, y: 180, w: 120, h: 18 },
      { x: 1400, y: 120, w: 140, h: 18 },
      // high ridge run
      { x: 1620, y: 160, w: 140, h: 18 },
      { x: 1840, y: 200, w: 140, h: 18 },
      { x: 2060, y: 250, w: 140, h: 18 },
      // boss arena floor
      { x: 2260, y: 450, w: 480, h: 60, type: 'ground' },
      // goal ledge
      { x: 2780, y: 410, w: 220, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [
      { x: 480, y: 432, w: 80, h: 18, rotation: 0 },
    ],
    movingPlats: [
      // ferry across opening surf (460 -> 1080)
      { x: 600,  y: 400, x2: 880,  y2: 400, w: 110, h: 18, speed: 1.6 },
      { x: 900,  y: 360, x2: 1040, y2: 400, w: 100, h: 18, speed: 1.8 },
      // descend the ridge to the boss arena (2200 -> 2260)
      { x: 2200, y: 300, x2: 2200, y2: 420, w: 110, h: 18, speed: 1.4 },
      // final ferry to goal across the last gap (2740 -> 2780)
      { x: 2680, y: 410, x2: 2680, y2: 320, w: 100, h: 18, speed: 1.5 },
    ],
    switches: [],
    spikes: [
      { x: 460,  y: 470, w: 620, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1300, y: 470, w: 960, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 520, y: 390 }, { x: 720, y: 360 }, { x: 940, y: 320 },
      { x: 1400, y: 350 }, { x: 1240, y: 280 }, { x: 1420, y: 210 },
      { x: 1260, y: 140 }, { x: 1460, y: 80 },
      { x: 1680, y: 120 }, { x: 1900, y: 160 }, { x: 2120, y: 210 },
      { x: 2860, y: 370 },
    ],
    qblocks: [{ x: 1400, y: 80 }],
    cblocks: [{ x: 2360, y: 360, hits: 3 }],
    trophies: [{ x: 1460, y: 60, collected: false }],
    powerupItems: [
      { x: 2300, y: 410, type: 'heal' },
      { x: 1080, y: 400, type: 'big' },
    ],
    enemies: [
      { x: 1100, y: 408, v: 5, hp: 4, elite: 'false' },
      { x: 1620, y: 118, v: 3, hp: 4, elite: 'false' },
      { x: 2060, y: 208, v: 4, hp: 5, elite: 'false' },
      // mini-boss in the arena
      { x: 2520, y: 386, v: 97, hp: 36, elite: 'false', w: 64, h: 64 },
    ],
    checkpoints: [
      { x: 1180, y: 400, activated: false },
      { x: 2300, y: 400, activated: false },
    ],
    spiritEmbers: [{ x: 1260, y: 140, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

];
