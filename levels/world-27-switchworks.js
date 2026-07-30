// levels/world-27-switchworks.js
// ──────────────────────────────────────────────────────────────────
// World 27 · THE SWITCHWORKS — a neon cyber lattice under lightning.
// Signature: SWITCH-A/B world flips. RED (switchA) platforms exist when
// the switch is OFF; BLUE (switchB) platforms exist when it is ON. Hit a
// switch to swap which half of the world is solid. Precision platforming:
// stand on red, flip, the blue path appears beneath your next step.
// Difficulty arc L1 intro -> L5 finale gauntlet.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W27 = [

  // ── L1 · POWER ON ─────────────────────────────────────────────────
  // Intro: teach the flip. Switch group 'A'. Start standing on solid
  // ground; every red/blue pair is gentle and clearly telegraphed.
  {
    name: 'POWER ON',
    width: 2400, goalX: 2300, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#0a0414', '#1c0a30'],
    platColors: ['#140a24', '#241038', '#4a1e7a', '#8a3ad8', '#c060ff'],
    accentColor: '#c060ff', accentColor2: '#50e8ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'cyber', weather: 'lightning',
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0,    y: 450, w: 2400, h: 60, type: 'ground' },
      { x: 280,  y: 390, w: 160,  h: 18 },
      { x: 520,  y: 350, w: 140,  h: 18 },
      // first red/blue pair: red is up high, blue lower. Flip to choose.
      { x: 740,  y: 320, w: 140,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 740,  y: 400, w: 140,  h: 18, type: 'switchB', switchGroup: 'A' },
      { x: 960,  y: 350, w: 160,  h: 18 },
      { x: 1200, y: 320, w: 140,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 1200, y: 400, w: 140,  h: 18, type: 'switchB', switchGroup: 'A' },
      { x: 1420, y: 360, w: 160,  h: 18 },
      { x: 1660, y: 330, w: 150,  h: 18 },
      { x: 1880, y: 360, w: 150,  h: 18 },
      { x: 2100, y: 400, w: 300,  h: 18 },
    ],
    icePlats: [], bounces: [], movingPlats: [],
    switches: [{ x: 470, y: 300 }, { x: 1130, y: 270 }],
    spikes: [],
    coins: [
      { x: 320, y: 360 }, { x: 560, y: 320 },
      { x: 780, y: 290 }, { x: 800, y: 290 },
      { x: 1000, y: 320 }, { x: 1240, y: 290 },
      { x: 1460, y: 330 }, { x: 1700, y: 300 },
      { x: 1920, y: 330 }, { x: 2160, y: 370 }, { x: 2240, y: 370 },
    ],
    qblocks: [{ x: 960, y: 280 }],
    cblocks: [],
    trophies: [],
    powerupItems: [],
    enemies: [
      { x: 600, y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1000, y: 308, v: 0, hp: 2, elite: 'false' },
      { x: 1480, y: 408, v: 1, hp: 2, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 1660, y: 280, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 80, y: 200, w: 380, title: 'THE SWITCHWORKS',
      lines: ['HIT A SWITCH TO FLIP THE WORLD.', 'RED TILES VANISH, BLUE APPEAR.', 'STEP CAREFULLY BETWEEN THEM.'],
      color: '#c060ff' }],
    highlights: [],
  },

  // ── L2 · ALTERNATING CURRENT ──────────────────────────────────────
  // Develop: a true red->flip->blue chain. You MUST flip mid-route to
  // continue. Two switch triggers along the way. Floor still present.
  {
    name: 'ALTERNATING CURRENT',
    width: 2700, goalX: 2600, goalY: 340,
    startX: 60, startY: 380,
    bgColors: ['#0a0414', '#200a36'],
    platColors: ['#140a24', '#241038', '#4a1e7a', '#8a3ad8', '#c060ff'],
    accentColor: '#c060ff', accentColor2: '#50e8ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'cyber', weather: 'lightning',
    timePar: 225, timeGold: 150,
    platforms: [
      { x: 0,    y: 450, w: 2700, h: 60, type: 'ground' },
      { x: 260,  y: 390, w: 150,  h: 18 },
      // switch is OFF at start -> red live. Walk reds...
      { x: 470,  y: 350, w: 140,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 690,  y: 320, w: 140,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 900,  y: 350, w: 130,  h: 18, type: 'switchA', switchGroup: 'A' },
      // hit switch ~1080 -> blues come alive ahead
      { x: 1120, y: 330, w: 140,  h: 18, type: 'switchB', switchGroup: 'A' },
      { x: 1340, y: 320, w: 140,  h: 18, type: 'switchB', switchGroup: 'A' },
      { x: 1560, y: 350, w: 140,  h: 18, type: 'switchB', switchGroup: 'A' },
      // neutral rest ledge
      { x: 1790, y: 370, w: 170,  h: 18 },
      // flip back to red for the climb (switch ~1980)
      { x: 2020, y: 340, w: 140,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 2240, y: 320, w: 140,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 2440, y: 380, w: 260,  h: 18 },
    ],
    icePlats: [], bounces: [], movingPlats: [],
    switches: [{ x: 1010, y: 270 }, { x: 1940, y: 290 }],
    spikes: [],
    coins: [
      { x: 300, y: 360 }, { x: 510, y: 320 }, { x: 730, y: 290 },
      { x: 940, y: 320 }, { x: 1160, y: 300 }, { x: 1380, y: 290 },
      { x: 1600, y: 320 }, { x: 1830, y: 340 },
      { x: 2060, y: 310 }, { x: 2280, y: 290 }, { x: 2500, y: 350 },
    ],
    qblocks: [{ x: 1790, y: 300 }],
    cblocks: [{ x: 1840, y: 300, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1790, y: 330, type: 'rapid' }],
    enemies: [
      { x: 700, y: 276, v: 1, hp: 2, elite: 'false' },
      { x: 1340, y: 276, v: 0, hp: 3, elite: 'false' },
      { x: 1830, y: 326, v: 3, hp: 3, elite: 'false' },
      { x: 2240, y: 276, v: 1, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1790, y: 320, activated: false }],
    spiritEmbers: [{ x: 1120, y: 270, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 1000, y: 180, w: 320, title: 'FLIP TO CONTINUE',
      lines: ['THE RED PATH ENDS HERE.', 'FLIP, AND THE BLUE BRIDGE', 'AHEAD TURNS SOLID.'],
      color: '#50e8ff' }],
    highlights: [],
  },

  // ── L3 · CROSSED WIRES ────────────────────────────────────────────
  // Twist: TWO independent switch groups (A and B-group) plus ice and a
  // conveyor. Manage which world you're in over a void section.
  {
    name: 'CROSSED WIRES',
    width: 2900, goalX: 2800, goalY: 340,
    startX: 60, startY: 380,
    bgColors: ['#08030f', '#1a0830'],
    platColors: ['#140a24', '#241038', '#4a1e7a', '#8a3ad8', '#c060ff'],
    accentColor: '#c060ff', accentColor2: '#50e8ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'cyber', weather: 'lightning',
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0,    y: 450, w: 760,  h: 60, type: 'ground' },
      { x: 240,  y: 390, w: 150,  h: 18 },
      { x: 470,  y: 350, w: 140,  h: 18 },
      // group A reds over the first void
      { x: 700,  y: 340, w: 130,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 900,  y: 320, w: 130,  h: 18, type: 'switchA', switchGroup: 'A' },
      // landing island
      { x: 1090, y: 360, w: 180,  h: 18 },
      // now flip group B (second switch). Blue bridge over second void.
      { x: 1340, y: 340, w: 130,  h: 18, type: 'switchB', switchGroup: 'B' },
      { x: 1540, y: 320, w: 130,  h: 18, type: 'switchB', switchGroup: 'B' },
      // slippery rest
      { x: 1980, y: 360, w: 200,  h: 18 },
      // group A reds again to climb
      { x: 2240, y: 330, w: 130,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 2450, y: 310, w: 130,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 2640, y: 380, w: 260,  h: 18 },
    ],
    icePlats: [{ x: 1730, y: 380, w: 200, h: 16 }],
    bounces: [],
    movingPlats: [
      { x: 1700, y: 300, x2: 1700, y2: 300, w: 100, h: 16, speed: 1.2 },
    ],
    switches: [
      { x: 600, y: 300 },   // toggles group A
      { x: 1250, y: 290 },  // toggles group B
      { x: 2160, y: 290 },  // toggles group A back
    ],
    spikes: [
      { x: 760, y: 440, w: 330, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1270, y: 440, w: 700, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 280, y: 360 }, { x: 510, y: 320 },
      { x: 740, y: 310 }, { x: 940, y: 290 },
      { x: 1130, y: 330 }, { x: 1380, y: 310 }, { x: 1580, y: 290 },
      { x: 1830, y: 350 }, { x: 2040, y: 330 },
      { x: 2280, y: 300 }, { x: 2490, y: 280 }, { x: 2700, y: 350 },
    ],
    qblocks: [{ x: 1090, y: 300 }],
    cblocks: [],
    trophies: [{ x: 2490, y: 260, collected: false }],
    powerupItems: [{ x: 1090, y: 320, type: 'shield' }],
    enemies: [
      { x: 470, y: 308, v: 1, hp: 3, elite: 'false' },
      { x: 1090, y: 318, v: 4, hp: 3, elite: 'false' },
      { x: 1980, y: 318, v: 5, hp: 4, elite: 'false' },
      { x: 2450, y: 268, v: 3, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1090, y: 320, activated: false }],
    spiritEmbers: [{ x: 1730, y: 330, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 80, y: 200, w: 340, title: 'TWO CIRCUITS',
      lines: ['RED AND BLUE NOW RUN', 'ON SEPARATE SWITCHES.', 'MIND WHICH ONE YOU FLIP.'],
      color: '#c060ff' }],
    highlights: [],
  },

  // ── L4 · SHORT FUSE ───────────────────────────────────────────────
  // Challenge: void floor. Precision flips over a deadly drop, timed
  // conveyor assists, mid-air switch hits. No safety net.
  {
    name: 'SHORT FUSE',
    width: 3100, goalX: 3000, goalY: 340,
    startX: 60, startY: 380,
    bgColors: ['#06020c', '#16062a'],
    platColors: ['#140a24', '#241038', '#4a1e7a', '#8a3ad8', '#c060ff'],
    accentColor: '#c060ff', accentColor2: '#50e8ff',
    skyStars: true, height: 560, voidFloor: true, voidY: 470,
    theme: 'cyber', weather: 'lightning',
    timePar: 258, timeGold: 172,
    platforms: [
      // launch pad
      { x: 0,    y: 420, w: 300,  h: 90, type: 'ground' },
      { x: 380,  y: 390, w: 140,  h: 18 },
      // red chain over the void (group A)
      { x: 580,  y: 360, w: 120,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 760,  y: 340, w: 120,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 940,  y: 360, w: 120,  h: 18, type: 'switchA', switchGroup: 'A' },
      // solid mid island with a switch
      { x: 1120, y: 380, w: 160,  h: 18 },
      // flip -> blue chain (group A) higher route
      { x: 1340, y: 350, w: 120,  h: 18, type: 'switchB', switchGroup: 'A' },
      { x: 1520, y: 320, w: 120,  h: 18, type: 'switchB', switchGroup: 'A' },
      { x: 1700, y: 350, w: 120,  h: 18, type: 'switchB', switchGroup: 'A' },
      // conveyor rest, pushes you toward next switch
      { x: 1900, y: 380, w: 200,  h: 16, type: 'conveyor', dir: 1, speed: 2.0 },
      // flip back to red (group A) for the final ascent
      { x: 2160, y: 350, w: 120,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 2340, y: 320, w: 120,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 2520, y: 300, w: 120,  h: 18, type: 'switchA', switchGroup: 'A' },
      // solid goal approach
      { x: 2720, y: 360, w: 160,  h: 18 },
      { x: 2920, y: 390, w: 180,  h: 18 },
    ],
    icePlats: [],
    bounces: [{ x: 320, y: 400, w: 60, h: 20, rotation: 0 }],
    movingPlats: [
      { x: 2100, y: 360, x2: 2160, y2: 360, w: 90, h: 16, speed: 1.4 },
    ],
    switches: [
      { x: 1170, y: 330 },  // group A flip 1
      { x: 1990, y: 330 },  // group A flip 2
    ],
    spikes: [],
    coins: [
      { x: 420, y: 360 }, { x: 620, y: 330 }, { x: 800, y: 310 },
      { x: 980, y: 330 }, { x: 1180, y: 350 },
      { x: 1380, y: 320 }, { x: 1560, y: 290 }, { x: 1740, y: 320 },
      { x: 1960, y: 350 }, { x: 2200, y: 320 },
      { x: 2380, y: 290 }, { x: 2560, y: 270 }, { x: 2780, y: 330 },
    ],
    qblocks: [{ x: 1120, y: 320 }],
    cblocks: [{ x: 2720, y: 300, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 1120, y: 340, type: 'extrajump' },
      { x: 2720, y: 320, type: 'heal' },
    ],
    enemies: [
      { x: 760, y: 298, v: 3, hp: 4, elite: 'false' },
      { x: 1120, y: 338, v: 7, hp: 5, elite: 'false' },
      { x: 1700, y: 308, v: 4, hp: 4, elite: 'false' },
      { x: 2340, y: 278, v: 5, hp: 5, elite: 'false' },
      { x: 2720, y: 318, v: 8, hp: 4, elite: 'false' },
    ],
    checkpoints: [{ x: 1120, y: 340, activated: false }],
    spiritEmbers: [{ x: 1900, y: 320, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 80, y: 190, w: 320, title: 'NO NET',
      lines: ['THE FLOOR IS GONE.', 'EVERY FLIP IS A LEAP', 'OF FAITH OVER THE VOID.'],
      color: '#50e8ff' }],
    highlights: [],
  },

  // ── L5 · MASTER BREAKER ───────────────────────────────────────────
  // Finale: void, dense flip gauntlet, two switch groups interleaved,
  // a mini-boss (juggernaut) on the final solid plateau.
  {
    name: 'MASTER BREAKER',
    width: 3400, goalX: 3300, goalY: 350,
    startX: 60, startY: 380,
    bgColors: ['#05010a', '#120524'],
    platColors: ['#140a24', '#241038', '#4a1e7a', '#8a3ad8', '#c060ff'],
    accentColor: '#c060ff', accentColor2: '#50e8ff',
    skyStars: true, height: 560, voidFloor: true, voidY: 470,
    theme: 'cyber', weather: 'lightning',
    timePar: 283, timeGold: 189,
    platforms: [
      { x: 0,    y: 420, w: 320,  h: 90, type: 'ground' },
      { x: 400,  y: 390, w: 130,  h: 18 },
      // GROUP A reds — opening run
      { x: 600,  y: 360, w: 110,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 780,  y: 340, w: 110,  h: 18, type: 'switchA', switchGroup: 'A' },
      // island + switch (flip to B-group blue)
      { x: 960,  y: 370, w: 150,  h: 18 },
      // GROUP B blues — interleaved descent/ascent
      { x: 1160, y: 350, w: 110,  h: 18, type: 'switchB', switchGroup: 'B' },
      { x: 1340, y: 330, w: 110,  h: 18, type: 'switchB', switchGroup: 'B' },
      { x: 1520, y: 350, w: 110,  h: 18, type: 'switchB', switchGroup: 'B' },
      // island + switch (flip A again)
      { x: 1700, y: 380, w: 150,  h: 18 },
      // GROUP A reds — high precision steps
      { x: 1900, y: 350, w: 100,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 2070, y: 320, w: 100,  h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 2240, y: 300, w: 100,  h: 18, type: 'switchA', switchGroup: 'A' },
      // bounce-assisted gap
      { x: 2420, y: 360, w: 140,  h: 18 },
      // GROUP B blues — final stretch
      { x: 2640, y: 340, w: 100,  h: 18, type: 'switchB', switchGroup: 'B' },
      { x: 2820, y: 330, w: 100,  h: 18, type: 'switchB', switchGroup: 'B' },
      // boss plateau (solid, goal here)
      { x: 3000, y: 410, w: 400,  h: 100, type: 'ground' },
    ],
    icePlats: [],
    bounces: [{ x: 2560, y: 380, w: 60, h: 20, rotation: 0 }],
    movingPlats: [
      { x: 2980, y: 320, x2: 3000, y2: 320, w: 100, h: 16, speed: 1.4 },
    ],
    switches: [
      { x: 880, y: 350 },   // flip B on
      { x: 1620, y: 360 },  // flip A on (for reds 1900+)
      { x: 2520, y: 340 },  // flip B on for final blues
    ],
    spikes: [],
    coins: [
      { x: 440, y: 360 }, { x: 640, y: 330 }, { x: 820, y: 310 },
      { x: 1000, y: 340 }, { x: 1200, y: 320 }, { x: 1380, y: 300 },
      { x: 1560, y: 320 }, { x: 1740, y: 350 },
      { x: 1940, y: 320 }, { x: 2110, y: 290 }, { x: 2280, y: 270 },
      { x: 2460, y: 330 }, { x: 2680, y: 310 }, { x: 2860, y: 300 },
      { x: 3100, y: 380 }, { x: 3180, y: 380 },
    ],
    qblocks: [{ x: 960, y: 310 }, { x: 1700, y: 320 }],
    cblocks: [{ x: 3060, y: 350, hits: 4 }],
    trophies: [{ x: 2240, y: 260, collected: false }],
    powerupItems: [
      { x: 1700, y: 340, type: 'invincible' },
      { x: 3100, y: 360, type: 'heal' },
    ],
    enemies: [
      { x: 780, y: 298, v: 3, hp: 4, elite: 'false' },
      { x: 1340, y: 288, v: 4, hp: 4, elite: 'false' },
      { x: 1700, y: 338, v: 14, hp: 6, elite: 'false' },
      { x: 2070, y: 278, v: 5, hp: 5, elite: 'false' },
      { x: 2820, y: 288, v: 8, hp: 5, elite: 'false' },
      { x: 3200, y: 346, v: 97, hp: 40, w: 64, h: 64, elite: 'false' },
    ],
    checkpoints: [
      { x: 960, y: 330, activated: false },
      { x: 1700, y: 340, activated: false },
    ],
    spiritEmbers: [{ x: 2240, y: 250, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 80, y: 190, w: 340, title: 'MASTER BREAKER',
      lines: ['BOTH CIRCUITS. ONE PATH.', 'FLIP CLEAN, LAND TRUE,', 'THEN BREAK THE GUARDIAN.'],
      color: '#c060ff' }],
    highlights: [],
  },

];
