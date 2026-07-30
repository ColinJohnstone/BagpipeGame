// levels/world-31-thornwild-canopy.js
// ──────────────────────────────────────────────────────────────────
// World 31 · THORNWILD CANOPY 🌿 — a vertical forest climb from the
// roots up into the treetops. Signature mechanic: GRAPPLEHOOK swings
// between canopy nodes plus MAGNETIC anchors that pull you up through
// the leaves. Day/night cycle. The arc rises level by level toward
// the cosmos beyond the canopy.
//
// Reach reference (GRAV 0.52, jump -13, double jump):
//   single jump  ≈ 150 up    double jump ≈ 250 up
//   bounce pad   ≈ 260 up    magnetic anchor pulls within radius
//   grapple node snaps/swings you toward it
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W31 = [

  // ════════════════════════════════════════════════════════════════
  // L1 · ROOTS OF THE THORNWILD — intro: teach the grapple node.
  // Gentle, mostly horizontal with a first taste of upward swing.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'ROOTS OF THE THORNWILD',
    width: 2400,
    goalX: 2280, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#16361f', '#3a7a48'],
    platColors: ['#1d3a25', '#2e5e3a', '#4ea86a', '#7fd092', '#cfeed7'],
    accentColor: '#4ea86a', accentColor2: '#ffd76a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'daynight',
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0, y: 450, w: 2400, h: 60, type: 'ground' },
      { x: 360, y: 360, w: 160, h: 16 },
      { x: 620, y: 300, w: 140, h: 16 },
      { x: 980, y: 330, w: 160, h: 16 },
      { x: 1280, y: 280, w: 150, h: 16 },
      { x: 1560, y: 340, w: 160, h: 16 },
      { x: 1840, y: 300, w: 150, h: 16 },
      { x: 2120, y: 350, w: 200, h: 18 },
      // grapple swing nodes (24x24)
      { x: 820, y: 200, w: 24, h: 24, type: 'grapplehook' },
      { x: 1140, y: 180, w: 24, h: 24, type: 'grapplehook' },
      { x: 1700, y: 190, w: 24, h: 24, type: 'grapplehook' },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 760, y: 426, w: 80, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1440, y: 426, w: 80, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 360, y: 330 }, { x: 440, y: 330 },
      { x: 620, y: 270 }, { x: 820, y: 150 },
      { x: 980, y: 300 }, { x: 1140, y: 130 },
      { x: 1280, y: 250 }, { x: 1560, y: 310 },
      { x: 1700, y: 140 }, { x: 1840, y: 270 },
      { x: 2120, y: 320 }, { x: 2200, y: 320 },
    ],
    qblocks: [{ x: 480, y: 300 }],
    cblocks: [],
    trophies: [],
    powerupItems: [{ x: 1280, y: 230, type: 'heal' }],
    enemies: [
      { x: 410, y: 318, v: 1, hp: 2, elite: 'false' },
      { x: 1010, y: 288, v: 1, hp: 2, elite: 'false' },
      { x: 1600, y: 298, v: 2, hp: 2, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 1140, y: 90, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 200, y: 380, w: 180, title: 'THE CANOPY CALLS',
        lines: ['Leap to a glowing NODE', 'to grapple-swing up.', 'Climb the Thornwild!'],
        color: '#4ea86a' },
    ],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L2 · TANGLED BOUGHS — develop: chain swings, add magnetic anchors.
  // More vertical, longer gaps bridged by nodes.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'TANGLED BOUGHS',
    width: 2700,
    goalX: 2580, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#13311c', '#356b42'],
    platColors: ['#1d3a25', '#2e5e3a', '#4ea86a', '#7fd092', '#cfeed7'],
    accentColor: '#4ea86a', accentColor2: '#ffd76a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'daynight',
    timePar: 225, timeGold: 150,
    platforms: [
      { x: 0, y: 450, w: 2700, h: 60, type: 'ground' },
      { x: 320, y: 380, w: 140, h: 16 },
      { x: 560, y: 310, w: 120, h: 16 },
      { x: 900, y: 340, w: 140, h: 16 },
      { x: 1180, y: 270, w: 130, h: 16 },
      { x: 1480, y: 320, w: 140, h: 16 },
      { x: 1760, y: 250, w: 130, h: 16 },
      { x: 2080, y: 300, w: 150, h: 16 },
      { x: 2360, y: 240, w: 140, h: 16 },
      { x: 2500, y: 360, w: 200, h: 18 },
      // magnetic anchors (32x32) pull the player up
      { x: 700, y: 180, w: 32, h: 32, type: 'magnetic', radius: 150, pull: 0.7 },
      { x: 2240, y: 150, w: 32, h: 32, type: 'magnetic', radius: 150, pull: 0.7 },
      // grapple nodes
      { x: 760, y: 200, w: 24, h: 24, type: 'grapplehook' },
      { x: 1040, y: 160, w: 24, h: 24, type: 'grapplehook' },
      { x: 1340, y: 180, w: 24, h: 24, type: 'grapplehook' },
      { x: 1620, y: 150, w: 24, h: 24, type: 'grapplehook' },
      { x: 1920, y: 170, w: 24, h: 24, type: 'grapplehook' },
    ],
    icePlats: [],
    bounces: [{ x: 460, y: 430, w: 80, h: 20, rotation: 0 }],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 1020, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1640, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 320, y: 350 }, { x: 560, y: 280 },
      { x: 700, y: 130 }, { x: 900, y: 310 },
      { x: 1040, y: 110 }, { x: 1180, y: 240 },
      { x: 1340, y: 130 }, { x: 1480, y: 290 },
      { x: 1620, y: 100 }, { x: 1760, y: 220 },
      { x: 1920, y: 120 }, { x: 2080, y: 270 },
      { x: 2360, y: 210 }, { x: 2540, y: 330 },
    ],
    qblocks: [{ x: 640, y: 280 }],
    cblocks: [{ x: 1200, y: 230, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1480, y: 290, type: 'extrajump' }],
    enemies: [
      { x: 360, y: 338, v: 1, hp: 2, elite: 'false' },
      { x: 920, y: 298, v: 3, hp: 3, elite: 'false' },
      { x: 1500, y: 278, v: 2, hp: 3, elite: 'false' },
      { x: 2100, y: 258, v: 4, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1180, y: 230, activated: false }],
    spiritEmbers: [{ x: 700, y: 130, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L3 · THE TWISTING VINE — twist: combine swings + moving boughs +
  // bounce. Steeper vertical staircase.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'THE TWISTING VINE',
    width: 2800,
    goalX: 2680, goalY: 300,
    startX: 60, startY: 380,
    bgColors: ['#10301a', '#2f6440'],
    platColors: ['#1d3a25', '#2e5e3a', '#4ea86a', '#7fd092', '#cfeed7'],
    accentColor: '#4ea86a', accentColor2: '#ffd76a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'daynight',
    timePar: 233, timeGold: 155,
    platforms: [
      { x: 0, y: 450, w: 2800, h: 60, type: 'ground' },
      { x: 300, y: 370, w: 130, h: 16 },
      { x: 540, y: 300, w: 120, h: 16 },
      { x: 1000, y: 320, w: 140, h: 16 },
      { x: 1280, y: 260, w: 120, h: 16 },
      { x: 1820, y: 290, w: 130, h: 16 },
      { x: 2100, y: 230, w: 130, h: 16 },
      { x: 2380, y: 280, w: 130, h: 16 },
      { x: 2580, y: 340, w: 220, h: 18 },
      // magnetic anchors
      { x: 780, y: 160, w: 32, h: 32, type: 'magnetic', radius: 160, pull: 0.7 },
      { x: 1560, y: 150, w: 32, h: 32, type: 'magnetic', radius: 160, pull: 0.7 },
      // grapple nodes
      { x: 700, y: 190, w: 24, h: 24, type: 'grapplehook' },
      { x: 880, y: 170, w: 24, h: 24, type: 'grapplehook' },
      { x: 1420, y: 180, w: 24, h: 24, type: 'grapplehook' },
      { x: 1680, y: 160, w: 24, h: 24, type: 'grapplehook' },
      { x: 1960, y: 170, w: 24, h: 24, type: 'grapplehook' },
      { x: 2240, y: 150, w: 24, h: 24, type: 'grapplehook' },
    ],
    icePlats: [],
    bounces: [
      { x: 620, y: 430, w: 80, h: 20, rotation: 0 },
      { x: 1700, y: 430, w: 80, h: 20, rotation: 0 },
    ],
    movingPlats: [
      { x: 660, y: 380, x2: 660, y2: 240, w: 110, h: 16, speed: 1.4 },
      { x: 1480, y: 360, x2: 1700, y2: 360, w: 120, h: 16, speed: 1.5 },
    ],
    switches: [],
    spikes: [
      { x: 880, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1300, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2020, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 300, y: 340 }, { x: 540, y: 270 },
      { x: 700, y: 140 }, { x: 880, y: 120 },
      { x: 1000, y: 290 }, { x: 1280, y: 230 },
      { x: 1420, y: 130 }, { x: 1680, y: 110 },
      { x: 1820, y: 260 }, { x: 1960, y: 120 },
      { x: 2100, y: 200 }, { x: 2240, y: 100 },
      { x: 2380, y: 250 }, { x: 2640, y: 310 },
    ],
    qblocks: [{ x: 1000, y: 270 }],
    cblocks: [{ x: 1820, y: 240, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1280, y: 220, type: 'shield' }],
    enemies: [
      { x: 320, y: 328, v: 2, hp: 3, elite: 'false' },
      { x: 1020, y: 278, v: 3, hp: 3, elite: 'false' },
      { x: 1840, y: 248, v: 5, hp: 4, elite: 'false' },
      { x: 2110, y: 188, v: 4, hp: 3, elite: 'false' },
      { x: 2400, y: 238, v: 2, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1280, y: 220, activated: false }],
    spiritEmbers: [{ x: 880, y: 80, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L4 · CANOPY GAUNTLET — challenge: dense swing chains, fallaway
  // boughs, tougher enemies. Tall and demanding.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'CANOPY GAUNTLET',
    width: 3000,
    goalX: 2880, goalY: 300,
    startX: 60, startY: 380,
    bgColors: ['#0d2a16', '#2a5c38'],
    platColors: ['#1d3a25', '#2e5e3a', '#4ea86a', '#7fd092', '#cfeed7'],
    accentColor: '#4ea86a', accentColor2: '#ffd76a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'daynight',
    timePar: 250, timeGold: 166,
    platforms: [
      { x: 0, y: 450, w: 3000, h: 60, type: 'ground' },
      { x: 280, y: 360, w: 120, h: 16 },
      { x: 520, y: 290, w: 110, h: 16 },
      { x: 980, y: 320, w: 120, h: 16 },
      { x: 1260, y: 260, w: 110, h: 16 },
      { x: 1560, y: 300, w: 120, h: 16 },
      { x: 2020, y: 280, w: 120, h: 16 },
      { x: 2300, y: 230, w: 120, h: 16 },
      { x: 2600, y: 280, w: 120, h: 16 },
      { x: 2780, y: 340, w: 220, h: 18 },
      { x: 740, y: 340, w: 110, h: 16, type: 'fallaway', _id: 'f1' },
      { x: 1760, y: 280, w: 110, h: 16, type: 'fallaway', _id: 'f2' },
      // magnetic anchors
      { x: 640, y: 150, w: 32, h: 32, type: 'magnetic', radius: 160, pull: 0.7 },
      { x: 1440, y: 140, w: 32, h: 32, type: 'magnetic', radius: 160, pull: 0.7 },
      { x: 2440, y: 130, w: 32, h: 32, type: 'magnetic', radius: 160, pull: 0.7 },
      // grapple nodes
      { x: 680, y: 180, w: 24, h: 24, type: 'grapplehook' },
      { x: 860, y: 160, w: 24, h: 24, type: 'grapplehook' },
      { x: 1140, y: 170, w: 24, h: 24, type: 'grapplehook' },
      { x: 1380, y: 180, w: 24, h: 24, type: 'grapplehook' },
      { x: 1660, y: 160, w: 24, h: 24, type: 'grapplehook' },
      { x: 1900, y: 170, w: 24, h: 24, type: 'grapplehook' },
      { x: 2160, y: 150, w: 24, h: 24, type: 'grapplehook' },
      { x: 2480, y: 160, w: 24, h: 24, type: 'grapplehook' },
    ],
    icePlats: [],
    bounces: [
      { x: 440, y: 430, w: 80, h: 20, rotation: 0 },
      { x: 1660, y: 430, w: 80, h: 20, rotation: 0 },
      { x: 2240, y: 430, w: 80, h: 20, rotation: 0 },
    ],
    movingPlats: [
      { x: 1080, y: 360, x2: 1080, y2: 220, w: 110, h: 16, speed: 1.5 },
      { x: 2060, y: 360, x2: 2280, y2: 300, w: 110, h: 16, speed: 1.6 },
    ],
    switches: [],
    spikes: [
      { x: 880, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1340, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1920, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2500, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 280, y: 330 }, { x: 520, y: 260 },
      { x: 640, y: 110 }, { x: 860, y: 120 },
      { x: 980, y: 290 }, { x: 1140, y: 130 },
      { x: 1260, y: 230 }, { x: 1440, y: 100 },
      { x: 1560, y: 270 }, { x: 1660, y: 120 },
      { x: 1900, y: 130 }, { x: 2020, y: 250 },
      { x: 2160, y: 110 }, { x: 2300, y: 200 },
      { x: 2440, y: 90 }, { x: 2600, y: 250 },
    ],
    qblocks: [{ x: 980, y: 270 }],
    cblocks: [{ x: 1560, y: 250, hits: 3 }, { x: 2300, y: 180, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 1260, y: 210, type: 'invincible' },
      { x: 2020, y: 230, type: 'heal' },
    ],
    enemies: [
      { x: 300, y: 318, v: 2, hp: 3, elite: 'false' },
      { x: 1000, y: 278, v: 3, hp: 3, elite: 'false' },
      { x: 1280, y: 218, v: 7, hp: 5, elite: 'false' },
      { x: 1580, y: 258, v: 5, hp: 4, elite: 'false' },
      { x: 2040, y: 238, v: 4, hp: 4, elite: 'false' },
      { x: 2320, y: 188, v: 8, hp: 4, elite: 'false' },
      { x: 2620, y: 238, v: 2, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1560, y: 250, activated: false }],
    spiritEmbers: [{ x: 1440, y: 90, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L5 · THE ASCENT BEYOND — finale: climactic vertical set-piece up
  // through the highest boughs into the cosmos, ending in a mini-boss.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'THE ASCENT BEYOND',
    width: 3200,
    goalX: 3080, goalY: 300,
    startX: 60, startY: 380,
    bgColors: ['#0a2412', '#1f4a8a'],
    platColors: ['#1d3a25', '#2e5e3a', '#4ea86a', '#7fd092', '#cfeed7'],
    accentColor: '#4ea86a', accentColor2: '#ffd76a',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'daynight',
    timePar: 266, timeGold: 177,
    platforms: [
      { x: 0, y: 450, w: 3200, h: 60, type: 'ground' },
      { x: 260, y: 360, w: 120, h: 16 },
      { x: 500, y: 290, w: 110, h: 16 },
      { x: 760, y: 330, w: 110, h: 16 },
      { x: 1180, y: 300, w: 120, h: 16 },
      { x: 1460, y: 250, w: 110, h: 16 },
      { x: 1980, y: 280, w: 120, h: 16 },
      { x: 2260, y: 230, w: 110, h: 16 },
      { x: 2540, y: 260, w: 120, h: 16 },
      { x: 2820, y: 300, w: 120, h: 16 },
      { x: 3000, y: 360, w: 200, h: 18 },
      { x: 1040, y: 320, w: 100, h: 16, type: 'fallaway', _id: 'g1' },
      { x: 2120, y: 250, w: 100, h: 16, type: 'fallaway', _id: 'g2' },
      // magnetic anchors — the great updraft chain
      { x: 600, y: 150, w: 32, h: 32, type: 'magnetic', radius: 160, pull: 0.7 },
      { x: 1320, y: 130, w: 32, h: 32, type: 'magnetic', radius: 160, pull: 0.7 },
      { x: 1840, y: 140, w: 32, h: 32, type: 'magnetic', radius: 160, pull: 0.7 },
      { x: 2680, y: 130, w: 32, h: 32, type: 'magnetic', radius: 160, pull: 0.7 },
      // grapple nodes
      { x: 660, y: 180, w: 24, h: 24, type: 'grapplehook' },
      { x: 900, y: 160, w: 24, h: 24, type: 'grapplehook' },
      { x: 1080, y: 170, w: 24, h: 24, type: 'grapplehook' },
      { x: 1280, y: 160, w: 24, h: 24, type: 'grapplehook' },
      { x: 1560, y: 170, w: 24, h: 24, type: 'grapplehook' },
      { x: 1740, y: 160, w: 24, h: 24, type: 'grapplehook' },
      { x: 2040, y: 170, w: 24, h: 24, type: 'grapplehook' },
      { x: 2360, y: 160, w: 24, h: 24, type: 'grapplehook' },
      { x: 2620, y: 170, w: 24, h: 24, type: 'grapplehook' },
    ],
    icePlats: [],
    bounces: [
      { x: 380, y: 430, w: 80, h: 20, rotation: 0 },
      { x: 1640, y: 430, w: 80, h: 20, rotation: 0 },
      { x: 2440, y: 430, w: 80, h: 20, rotation: 0 },
    ],
    movingPlats: [
      { x: 980, y: 380, x2: 980, y2: 230, w: 110, h: 16, speed: 1.6 },
      { x: 1660, y: 360, x2: 1880, y2: 300, w: 110, h: 16, speed: 1.7 },
      { x: 2360, y: 380, x2: 2360, y2: 230, w: 110, h: 16, speed: 1.6 },
    ],
    switches: [],
    spikes: [
      { x: 640, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1340, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1900, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2580, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 260, y: 330 }, { x: 500, y: 260 },
      { x: 600, y: 110 }, { x: 760, y: 300 },
      { x: 900, y: 120 }, { x: 1080, y: 130 },
      { x: 1180, y: 270 }, { x: 1320, y: 90 },
      { x: 1460, y: 220 }, { x: 1560, y: 130 },
      { x: 1740, y: 120 }, { x: 1840, y: 100 },
      { x: 1980, y: 250 }, { x: 2040, y: 130 },
      { x: 2260, y: 200 }, { x: 2360, y: 120 },
      { x: 2540, y: 230 }, { x: 2620, y: 130 },
      { x: 2680, y: 90 }, { x: 2820, y: 270 },
    ],
    qblocks: [{ x: 760, y: 280 }],
    cblocks: [{ x: 1180, y: 250, hits: 3 }, { x: 2540, y: 210, hits: 3 }],
    trophies: [{ x: 1320, y: 80, collected: false }],
    powerupItems: [
      { x: 1460, y: 200, type: 'invincible' },
      { x: 1980, y: 230, type: 'heal' },
      { x: 2820, y: 250, type: 'shield' },
    ],
    enemies: [
      { x: 280, y: 318, v: 2, hp: 3, elite: 'false' },
      { x: 780, y: 288, v: 3, hp: 4, elite: 'false' },
      { x: 1200, y: 258, v: 7, hp: 5, elite: 'false' },
      { x: 1480, y: 208, v: 5, hp: 4, elite: 'false' },
      { x: 2000, y: 238, v: 13, hp: 5, elite: 'false' },
      { x: 2280, y: 188, v: 8, hp: 5, elite: 'false' },
      { x: 2840, y: 258, v: 4, hp: 4, elite: 'false' },
      // mini-boss guarding the path to the cosmos
      { x: 3010, y: 386, v: 97, hp: 40, w: 64, h: 64, elite: 'false' },
    ],
    checkpoints: [
      { x: 1180, y: 250, activated: false },
      { x: 2260, y: 200, activated: false },
    ],
    spiritEmbers: [{ x: 1840, y: 60, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

];
