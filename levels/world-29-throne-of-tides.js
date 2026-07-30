// levels/world-29-throne-of-tides.js
// ──────────────────────────────────────────────────────────────────
// World 29 · THRONE OF TIDES — citadel theme, storm weather. 👑
// Signature: a CULMINATING GAUNTLET of the whole galaxy's mechanics
// (conveyors, crumble, soundwave reveals, windtunnels, grapple, ice,
// switches, timed phases) inside a storm-lashed sea fortress, ending
// L5 in a MEGA-BOSS throne-room fight.
// Palette: storm-steel blue stone, lightning-cyan accents.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W29 = [

  // ── L1: STORMBREAK GATES (intro — teach the fortress: conveyors + crumble) ──
  {
    name: 'STORMBREAK GATES',
    width: 2400, goalX: 2280, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#0a1424', '#1c3a64'],
    platColors: ['#0c1626', '#1a2c48', '#2e4e7a', '#2e7ad0', '#9fd4ff'],
    accentColor: '#2e7ad0', accentColor2: '#ffd24a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'citadel', weather: 'storm',
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0,    y: 450, w: 560, h: 60, type: 'ground' },
      { x: 1180, y: 450, w: 360, h: 60, type: 'ground' },
      { x: 1980, y: 450, w: 420, h: 60, type: 'ground' },
      // intro ledges
      { x: 360,  y: 360, w: 140, h: 18 },
      // conveyor belt run over the moat (teach conveyors)
      { x: 600,  y: 410, w: 200, h: 18, type: 'conveyor', dir: 1, speed: 2.0 },
      { x: 860,  y: 360, w: 120, h: 18 },
      { x: 1040, y: 410, w: 140, h: 18, type: 'conveyor', dir: 1, speed: 2.0 },
      // crumble stepping stones (teach crumble)
      { x: 1560, y: 400, w: 90,  h: 18, type: 'crumble', _id: 'w29l1c1' },
      { x: 1720, y: 360, w: 90,  h: 18, type: 'crumble', _id: 'w29l1c2' },
      { x: 1880, y: 410, w: 90,  h: 18, type: 'crumble', _id: 'w29l1c3' },
      // goal platform
      { x: 2200, y: 360, w: 160, h: 18 },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 560,  y: 470, w: 620, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1540, y: 470, w: 440, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 400, y: 320 }, { x: 450, y: 320 },
      { x: 660, y: 370 }, { x: 740, y: 370 },
      { x: 880, y: 320 }, { x: 1080, y: 370 },
      { x: 1240, y: 410 }, { x: 1300, y: 410 },
      { x: 1580, y: 360 }, { x: 1740, y: 320 }, { x: 1900, y: 370 },
      { x: 2240, y: 320 },
    ],
    qblocks: [{ x: 1200, y: 300 }],
    cblocks: [],
    trophies: [],
    powerupItems: [{ x: 360, y: 320, type: 'rapid' }],
    enemies: [
      { x: 1260, y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1400, y: 408, v: 1, hp: 2, elite: 'false' },
      { x: 2060, y: 408, v: 2, hp: 3, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 880, y: 320, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 60, y: 220, w: 380, title: 'THRONE OF TIDES',
      lines: ['⚡ THE STORM FORTRESS TESTS ALL.', 'BELTS CARRY YOU — STONES CRUMBLE.', 'KEEP MOVING. THE THRONE WAITS.'],
      color: '#2e7ad0' }],
    highlights: [],
  },

  // ── L2: TEMPEST RAMPARTS (develop — windtunnels + soundwave reveals) ──
  {
    name: 'TEMPEST RAMPARTS',
    width: 2800, goalX: 2680, goalY: 330,
    startX: 60, startY: 380,
    bgColors: ['#0a1424', '#1c3a64'],
    platColors: ['#0c1626', '#1a2c48', '#2e4e7a', '#2e7ad0', '#9fd4ff'],
    accentColor: '#2e7ad0', accentColor2: '#ffd24a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'citadel', weather: 'storm',
    timePar: 233, timeGold: 156,
    platforms: [
      { x: 0,    y: 450, w: 420, h: 60, type: 'ground' },
      { x: 980,  y: 450, w: 300, h: 60, type: 'ground' },
      { x: 1780, y: 450, w: 280, h: 60, type: 'ground' },
      { x: 2480, y: 450, w: 320, h: 60, type: 'ground' },
      // windtunnel lift up to the rampart walk
      { x: 460,  y: 250, w: 200, h: 18 },
      { x: 700,  y: 320, w: 120, h: 18 },
      // soundwave reveal bridge across the first gap (shoot to cross)
      { x: 560,  y: 410, w: 110, h: 18, type: 'soundwave', _id: 'w29l2s1' },
      { x: 760,  y: 410, w: 110, h: 18, type: 'soundwave', _id: 'w29l2s2' },
      // upper rampart
      { x: 1080, y: 330, w: 140, h: 18 },
      { x: 1300, y: 300, w: 120, h: 18 },
      // soundwave gap two
      { x: 1480, y: 380, w: 110, h: 18, type: 'soundwave', _id: 'w29l2s3' },
      { x: 1640, y: 380, w: 110, h: 18, type: 'soundwave', _id: 'w29l2s4' },
      // descent steps
      { x: 1880, y: 360, w: 120, h: 18 },
      { x: 2080, y: 320, w: 120, h: 18 },
      { x: 2280, y: 360, w: 120, h: 18 },
      // goal platform
      { x: 2540, y: 420, w: 200, h: 18 },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 420,  y: 470, w: 560, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1280, y: 470, w: 500, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2060, y: 470, w: 420, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 500, y: 210 }, { x: 560, y: 210 }, { x: 620, y: 210 },
      { x: 600, y: 370 }, { x: 800, y: 370 },
      { x: 1120, y: 290 }, { x: 1340, y: 260 },
      { x: 1520, y: 340 }, { x: 1680, y: 340 },
      { x: 1920, y: 320 }, { x: 2120, y: 280 }, { x: 2320, y: 320 },
      { x: 2600, y: 380 },
    ],
    qblocks: [{ x: 1080, y: 290 }],
    cblocks: [{ x: 460, y: 200, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 2080, y: 280, type: 'drum' }],
    enemies: [
      { x: 1100, y: 288, v: 4, hp: 3, elite: 'false' },
      { x: 1820, y: 408, v: 3, hp: 3, elite: 'false' },
      { x: 2560, y: 408, v: 2, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1080, y: 290, activated: false }],
    spiritEmbers: [{ x: 700, y: 280, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 60, y: 220, w: 360, title: 'RAMPARTS',
      lines: ['🌀 RIDE THE UPDRAFT WIND.', 'SHOOT TO CONJURE THE', 'INVISIBLE STORM-BRIDGES.'],
      color: '#2e7ad0' }],
    highlights: [],
  },

  // ── L3: TWIN-GATE LOCKS (twist — switch puzzle + ice + grapple) ──
  {
    name: 'TWIN-GATE LOCKS',
    width: 3000, goalX: 2880, goalY: 340,
    startX: 60, startY: 380,
    bgColors: ['#0a1424', '#1c3a64'],
    platColors: ['#0c1626', '#1a2c48', '#2e4e7a', '#2e7ad0', '#9fd4ff'],
    accentColor: '#2e7ad0', accentColor2: '#ffd24a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'citadel', weather: 'storm',
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0,    y: 450, w: 460, h: 60, type: 'ground' },
      { x: 1080, y: 450, w: 280, h: 60, type: 'ground' },
      { x: 1980, y: 450, w: 260, h: 60, type: 'ground' },
      { x: 2640, y: 450, w: 360, h: 60, type: 'ground' },
      // ice approach
      { x: 700,  y: 360, w: 120, h: 18 },
      // switch puzzle — red solid OFF, blue solid ON, alternate to climb
      { x: 520,  y: 380, w: 120, h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 880,  y: 320, w: 120, h: 18, type: 'switchB', switchGroup: 'A' },
      { x: 1080, y: 260, w: 120, h: 18, type: 'switchA', switchGroup: 'A' },
      // grapple swing over the wide chasm
      { x: 1480, y: 200, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1760, y: 200, w: 24,  h: 24, type: 'grapplehook' },
      { x: 1880, y: 360, w: 120, h: 18 },
      // second switch bank past the chasm
      { x: 2160, y: 360, w: 120, h: 18, type: 'switchB', switchGroup: 'A' },
      { x: 2360, y: 300, w: 120, h: 18, type: 'switchA', switchGroup: 'A' },
      { x: 2560, y: 360, w: 120, h: 18, type: 'switchB', switchGroup: 'A' },
      // goal platform
      { x: 2800, y: 400, w: 200, h: 18 },
    ],
    icePlats: [
      { x: 1180, y: 360, w: 180, h: 18 },
      { x: 2240, y: 450, w: 0,   h: 0 },
    ],
    bounces: [],
    movingPlats: [],
    switches: [
      { x: 320, y: 410 },
      { x: 2080, y: 410 },
    ],
    spikes: [
      { x: 460,  y: 470, w: 620, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1360, y: 470, w: 620, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2240, y: 470, w: 400, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 540, y: 340 }, { x: 720, y: 320 },
      { x: 900, y: 280 }, { x: 1100, y: 220 },
      { x: 1480, y: 160 }, { x: 1620, y: 150 }, { x: 1760, y: 160 },
      { x: 1900, y: 320 },
      { x: 2180, y: 320 }, { x: 2380, y: 260 }, { x: 2580, y: 320 },
      { x: 2840, y: 360 },
    ],
    qblocks: [{ x: 1900, y: 300 }],
    cblocks: [],
    trophies: [{ x: 1620, y: 110, collected: false }],
    powerupItems: [{ x: 700, y: 320, type: 'shield' }],
    enemies: [
      { x: 1100, y: 408, v: 5, hp: 4, elite: 'false' },
      { x: 1880, y: 318, v: 7, hp: 4, elite: 'false' },
      { x: 2000, y: 408, v: 4, hp: 4, elite: 'false' },
      { x: 2680, y: 408, v: 3, hp: 4, elite: 'false' },
    ],
    checkpoints: [{ x: 1080, y: 220, activated: false }],
    spiritEmbers: [{ x: 1620, y: 150, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 60, y: 220, w: 380, title: 'TWIN GATES',
      lines: ['🔵🔴 FLIP THE GATE-SWITCH:', 'RED STONES VANISH, BLUE APPEAR.', 'GRAPPLE THE STORM-CHASM.'],
      color: '#2e7ad0' }],
    highlights: [],
  },

  // ── L4: THE DROWNED GAUNTLET (challenge — timed + crumble + conveyor + wind) ──
  {
    name: 'THE DROWNED GAUNTLET',
    width: 3200, goalX: 3080, goalY: 340,
    startX: 60, startY: 380,
    bgColors: ['#0a1424', '#1c3a64'],
    platColors: ['#0c1626', '#1a2c48', '#2e4e7a', '#2e7ad0', '#9fd4ff'],
    accentColor: '#2e7ad0', accentColor2: '#ffd24a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'citadel', weather: 'storm',
    timePar: 267, timeGold: 178,
    platforms: [
      { x: 0,    y: 450, w: 420, h: 60, type: 'ground' },
      { x: 1180, y: 450, w: 240, h: 60, type: 'ground' },
      { x: 2060, y: 450, w: 240, h: 60, type: 'ground' },
      { x: 2900, y: 450, w: 300, h: 60, type: 'ground' },
      // timed-phase pillars over first pit
      { x: 520,  y: 400, w: 100, h: 18, type: 'timed', period: 180, _id: 'w29l4t1' },
      { x: 700,  y: 360, w: 100, h: 18, type: 'timed', period: 200, _id: 'w29l4t2' },
      { x: 880,  y: 400, w: 100, h: 18, type: 'timed', period: 180, _id: 'w29l4t3' },
      { x: 1040, y: 360, w: 100, h: 18 },
      // conveyor + crumble combo
      { x: 1440, y: 400, w: 200, h: 18, type: 'conveyor', dir: -1, speed: 2.2 },
      { x: 1700, y: 360, w: 90,  h: 18, type: 'crumble', _id: 'w29l4c1' },
      { x: 1860, y: 400, w: 90,  h: 18, type: 'crumble', _id: 'w29l4c2' },
      { x: 2020, y: 360, w: 110, h: 18 },
      // windtunnel vertical to high crossing
      { x: 2360, y: 320, w: 120, h: 18 },
      { x: 2560, y: 280, w: 120, h: 18, type: 'fallaway', _id: 'w29l4f1' },
      { x: 2740, y: 320, w: 120, h: 18 },
      // goal platform
      { x: 3000, y: 400, w: 200, h: 18 },
    ],
    icePlats: [
      { x: 2200, y: 360, w: 120, h: 18 },
    ],
    bounces: [
      { x: 1080, y: 420, w: 80, h: 18, rotation: 0 },
    ],
    movingPlats: [
      { x: 2320, y: 450, x2: 2320, y2: 250, w: 90, h: 18, speed: 1.6 },
    ],
    switches: [],
    spikes: [
      { x: 420,  y: 470, w: 760, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1420, y: 470, w: 640, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2300, y: 470, w: 600, h: 24, rotation: 0, spikeType: 'static' },
    ],
    windPlats: [],
    coins: [
      { x: 560, y: 360 }, { x: 740, y: 320 }, { x: 920, y: 360 },
      { x: 1080, y: 320 },
      { x: 1500, y: 360 }, { x: 1740, y: 320 }, { x: 1900, y: 360 },
      { x: 2240, y: 320 }, { x: 2400, y: 280 }, { x: 2600, y: 240 },
      { x: 2780, y: 280 },
      { x: 3040, y: 360 },
    ],
    qblocks: [{ x: 2060, y: 320 }],
    cblocks: [{ x: 1040, y: 300, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 1200, y: 400, type: 'invincible' },
      { x: 2060, y: 320, type: 'heal' },
    ],
    enemies: [
      { x: 1220, y: 408, v: 8, hp: 4, elite: 'false' },
      { x: 1300, y: 408, v: 5, hp: 4, elite: 'false' },
      { x: 2080, y: 408, v: 9, hp: 4, elite: 'false' },
      { x: 2360, y: 278, v: 12, hp: 5, elite: 'false' },
      { x: 2940, y: 408, v: 14, hp: 5, elite: 'false' },
    ],
    checkpoints: [
      { x: 1180, y: 420, activated: false },
      { x: 2060, y: 420, activated: false },
    ],
    spiritEmbers: [{ x: 2600, y: 200, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 60, y: 220, w: 380, title: 'THE GAUNTLET',
      lines: ['💀 EVERYTHING AT ONCE NOW.', 'TIMED STONES, BELTS, CRUMBLE.', 'THE THRONE IS BEYOND.'],
      color: '#2e7ad0' }],
    highlights: [],
  },

  // ── L5: THRONE OF TIDES (finale — gauntlet ascent + MEGA-BOSS) ──
  {
    name: 'THRONE OF TIDES',
    width: 3000, goalX: 2880, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#08101e', '#16305a'],
    platColors: ['#0c1626', '#1a2c48', '#2e4e7a', '#2e7ad0', '#9fd4ff'],
    accentColor: '#2e7ad0', accentColor2: '#ffd24a',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'citadel', weather: 'storm',
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0,    y: 450, w: 520, h: 60, type: 'ground' },
      { x: 1120, y: 450, w: 280, h: 60, type: 'ground' },
      // soundwave + crumble approach gauntlet
      { x: 600,  y: 400, w: 110, h: 18, type: 'soundwave', _id: 'w29l5s1' },
      { x: 780,  y: 360, w: 100, h: 18, type: 'crumble', _id: 'w29l5c1' },
      { x: 940,  y: 400, w: 110, h: 18, type: 'soundwave', _id: 'w29l5s2' },
      // conveyor rampart up
      { x: 1440, y: 400, w: 200, h: 18, type: 'conveyor', dir: 1, speed: 2.0 },
      { x: 1700, y: 360, w: 140, h: 18 },
      { x: 1900, y: 320, w: 140, h: 18 },
      // throne-room arena floor
      { x: 2160, y: 450, w: 840, h: 60, type: 'ground' },
      // arena flanking ledges for dodging the boss
      { x: 2260, y: 340, w: 140, h: 18 },
      { x: 2760, y: 340, w: 140, h: 18 },
      // throne / goal pedestal
      { x: 2800, y: 450, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [
      { x: 1340, y: 420, w: 80, h: 18, rotation: 0 },
    ],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 520,  y: 470, w: 600, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1400, y: 470, w: 760, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 640, y: 360 }, { x: 800, y: 320 }, { x: 980, y: 360 },
      { x: 1200, y: 410 }, { x: 1300, y: 410 },
      { x: 1500, y: 360 }, { x: 1740, y: 320 }, { x: 1940, y: 280 },
      { x: 2300, y: 300 }, { x: 2500, y: 410 }, { x: 2700, y: 300 },
      { x: 2860, y: 410 },
    ],
    qblocks: [{ x: 1120, y: 300 }],
    cblocks: [],
    trophies: [{ x: 1940, y: 270, collected: false }],
    powerupItems: [
      { x: 1120, y: 410, type: 'big' },
      { x: 2180, y: 410, type: 'rapid' },
      { x: 2200, y: 300, type: 'heal' },
    ],
    enemies: [
      { x: 1140, y: 408, v: 7, hp: 5, elite: 'false' },
      { x: 1700, y: 318, v: 4, hp: 5, elite: 'false' },
      { x: 1900, y: 278, v: 11, hp: 5, elite: 'false' },
      // THE MEGA-BOSS — King of the storm throne
      { x: 2520, y: 386, v: 99, hp: 40, w: 64, h: 64, elite: 'true' },
    ],
    checkpoints: [{ x: 2160, y: 420, activated: false }],
    spiritEmbers: [{ x: 1940, y: 230, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 60, y: 220, w: 380, title: 'THE THRONE',
      lines: ['👑 THE TIDE-KING AWAITS.', 'CLIMB THE STORM, THEN', 'BREAK HIS REIGN. FINISH IT.'],
      color: '#ffd24a' }],
    highlights: [],
  },

];
