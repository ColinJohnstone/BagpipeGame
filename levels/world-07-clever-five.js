// levels/world-07-clever-five.js
// ──────────────────────────────────────────────────────────────────
// World 7 · THE CLEVER FIVE — 5 levels, each forces mastery of one
// new mechanic from the expansion pack (soundwaves, ice+bounce,
// switches, crumble, bounce-tower).
// Loaded by index.html via <script src> before the
// main game script. Falls back to buildWorld7Levels() if missing.
// ──────────────────────────────────────────────────────────────────

(function () {
  const BG = ['#0a0418', '#1c0830'];
  const PC = ['#1a0530', '#2a0d4a', '#4a1a78', '#7a3aaa', '#cf80ff'];
  const base = (overrides) => Object.assign({
    bgColors: BG, platColors: PC, accentColor: '#cf80ff', accentColor2: '#ffd54a',
    skyStars: true, misty: true, height: 560, voidFloor: false, voidY: 460,
    weather: 'none', startX: 60, startY: 380, goalY: 310,
    timePar: 240, timeGold: 150,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [],
  }, overrides);

  window.LEVELS_W7 = [
    // L1 ECHOES — soundwave platform ladder
    base({
      name: 'ECHOES', width: 1400, height: 920, voidY: 880, goalX: 1280, goalY: 100,
      startX: 60, startY: 820,
      platforms: [
        { x: 0, y: 880, w: 1400, h: 60, type: 'ground' },
        { x: 220, y: 760, w: 140, h: 18, type: 'soundwave', _id: 'w7l1s1' },
        { x: 460, y: 660, w: 140, h: 18, type: 'soundwave', _id: 'w7l1s2' },
        { x: 220, y: 560, w: 140, h: 18, type: 'soundwave', _id: 'w7l1s3' },
        { x: 460, y: 460, w: 140, h: 18, type: 'soundwave', _id: 'w7l1s4' },
        { x: 700, y: 380, w: 140, h: 18, type: 'soundwave', _id: 'w7l1s5' },
        { x: 940, y: 300, w: 140, h: 18, type: 'soundwave', _id: 'w7l1s6' },
        { x: 1180, y: 200, w: 220, h: 60, type: 'ground' },
      ],
      coins: [
        { x: 280, y: 720 }, { x: 520, y: 620 }, { x: 280, y: 520 },
        { x: 520, y: 420 }, { x: 760, y: 340 }, { x: 1000, y: 260 },
      ],
      spiritEmbers: [{ x: 80, y: 200, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 760, w: 320, title: 'ECHOES',
        lines: ['PLATFORMS APPEAR ONLY', 'WHEN YOU SHOOT THEM.', '', 'SHOOT UP — THEN JUMP.'],
        color: '#cf80ff' }],
      highlights: [
        { type: 'arrow-up', x: 290, y: 720, label: 'SHOOT', color: '#22ccaa' },
        { type: 'circle',   x: 530, y: 670, r: 70,        color: '#22ccaa' },
      ],
    }),

    // L2 GLACIAL DRIFT — ice slides into angled bounce pads
    base({
      name: 'GLACIAL DRIFT', width: 3400, goalX: 3300, weather: 'snow',
      bgColors: ['#03101f', '#06182f'],
      platColors: ['#0c1830', '#142848', '#1c4080', '#3478c8', '#88e0ff'],
      platforms: [
        { x: 0,    y: 450, w: 320, h: 60, type: 'ground' },
        { x: 1100, y: 450, w: 280, h: 60, type: 'ground' },
        { x: 2200, y: 450, w: 280, h: 60, type: 'ground' },
        { x: 3100, y: 450, w: 300, h: 60, type: 'ground' },
      ],
      icePlats: [
        { x: 320,  y: 450, w: 540, h: 60 },
        { x: 1380, y: 450, w: 540, h: 60 },
        { x: 2480, y: 450, w: 540, h: 60 },
      ],
      bounces: [
        { x: 860,  y: 432, w: 80, h: 14, rotation: -25 },
        { x: 1920, y: 432, w: 80, h: 14, rotation: -25 },
        { x: 3020, y: 432, w: 80, h: 14, rotation: -25 },
      ],
      coins: [
        { x: 600,  y: 410 }, { x: 1700, y: 410 }, { x: 2800, y: 410 },
        { x: 1000, y: 280 }, { x: 2100, y: 280 }, { x: 3200, y: 280 },
      ],
      spiritEmbers: [{ x: 1240, y: 200, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 320, title: 'GLACIAL DRIFT',
        lines: ['SLIDE ON ICE,', 'HIT THE BOUNCE PAD,', 'ARC OVER THE VOID.'],
        color: '#88e0ff' }],
      highlights: [{ type: 'arrow-right', x: 880, y: 410, label: 'ANGLE!', color: '#88e0ff' }],
    }),

    // L3 PARALLEL PATH — interlocking switch A/B paths
    base({
      name: 'PARALLEL PATH', width: 2400, goalX: 2300, height: 720, voidY: 680,
      platforms: [
        { x: 0,    y: 680, w: 400, h: 60, type: 'ground' },
        { x: 2200, y: 680, w: 200, h: 60, type: 'ground' },
        { x: 400,  y: 540, w: 100, h: 18, type: 'switchA', switchGroup: 'A' },
        { x: 540,  y: 480, w: 100, h: 18, type: 'switchB', switchGroup: 'A' },
        { x: 680,  y: 420, w: 100, h: 18, type: 'switchA', switchGroup: 'A' },
        { x: 820,  y: 360, w: 100, h: 18, type: 'switchB', switchGroup: 'A' },
        { x: 960,  y: 300, w: 100, h: 18, type: 'switchA', switchGroup: 'A' },
        { x: 1140, y: 480, w: 80,  h: 18 },
        { x: 1280, y: 540, w: 100, h: 18, type: 'switchB', switchGroup: 'A' },
        { x: 1420, y: 480, w: 100, h: 18, type: 'switchA', switchGroup: 'A' },
        { x: 1560, y: 420, w: 100, h: 18, type: 'switchB', switchGroup: 'A' },
        { x: 1700, y: 360, w: 100, h: 18, type: 'switchA', switchGroup: 'A' },
        { x: 1880, y: 540, w: 120, h: 18 },
        { x: 2040, y: 480, w: 100, h: 18, type: 'switchB', switchGroup: 'A' },
      ],
      switches: [
        { x: 1170, y: 460, w: 24, h: 24, switchGroup: 'A' },
        { x: 1900, y: 520, w: 24, h: 24, switchGroup: 'A' },
      ],
      coins: [
        { x: 450,  y: 510 }, { x: 590,  y: 450 }, { x: 730,  y: 390 },
        { x: 870,  y: 330 }, { x: 1010, y: 270 }, { x: 1610, y: 390 },
        { x: 1750, y: 330 }, { x: 2090, y: 450 },
      ],
      spiritEmbers: [{ x: 1010, y: 200, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 480, w: 320, title: 'PARALLEL PATH',
        lines: ['ONLY 🔴 OR 🔵 IS SOLID', 'AT ANY TIME.', '', 'JUMP THE SWITCHES TO', 'FLIP BETWEEN WORLDS.'],
        color: '#ff6688' }],
      highlights: [
        { type: 'arrow', x: 1180, y: 430, label: 'SWITCH', color: '#ff6688' },
        { type: 'arrow', x: 1912, y: 490, label: 'AGAIN',  color: '#ff6688' },
      ],
    }),

    // L4 COLLAPSING CAUSEWAY — crumble flow
    base({
      name: 'COLLAPSING CAUSEWAY', width: 3200, goalX: 3100,
      platforms: [
        { x: 0,    y: 450, w: 280, h: 60, type: 'ground' },
        { x: 320,  y: 380, w: 90,  h: 18, type: 'crumble' },
        { x: 440,  y: 360, w: 90,  h: 18, type: 'crumble' },
        { x: 560,  y: 340, w: 90,  h: 18, type: 'crumble' },
        { x: 680,  y: 320, w: 90,  h: 18, type: 'crumble' },
        { x: 800,  y: 300, w: 90,  h: 18, type: 'crumble' },
        { x: 920,  y: 320, w: 200, h: 18 },
        { x: 1180, y: 380, w: 90,  h: 18, type: 'crumble' },
        { x: 1300, y: 420, w: 90,  h: 18, type: 'crumble' },
        { x: 1420, y: 380, w: 90,  h: 18, type: 'crumble' },
        { x: 1540, y: 340, w: 90,  h: 18, type: 'crumble' },
        { x: 1660, y: 300, w: 90,  h: 18, type: 'crumble' },
        { x: 1180, y: 450, w: 700, h: 60, type: 'ground' },
        { x: 1900, y: 320, w: 100, h: 18, type: 'crumble' },
        { x: 2050, y: 280, w: 100, h: 18, type: 'crumble' },
        { x: 2200, y: 240, w: 100, h: 18, type: 'crumble' },
        { x: 2350, y: 200, w: 100, h: 18, type: 'crumble' },
        { x: 2500, y: 240, w: 100, h: 18, type: 'crumble' },
        { x: 2650, y: 280, w: 100, h: 18, type: 'crumble' },
        { x: 2800, y: 320, w: 100, h: 18, type: 'crumble' },
        { x: 2950, y: 450, w: 250, h: 60, type: 'ground' },
      ],
      coins: [
        { x: 360,  y: 340 }, { x: 600,  y: 300 }, { x: 840,  y: 260 },
        { x: 1340, y: 380 }, { x: 1580, y: 300 }, { x: 1700, y: 260 },
        { x: 2240, y: 200 }, { x: 2390, y: 160 }, { x: 2540, y: 200 },
      ],
      spiritEmbers: [{ x: 2390, y: 80, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'COLLAPSING CAUSEWAY',
        lines: ['EVERY STEP CRUMBLES.', 'KEEP MOVING.'], color: '#ff8844' }],
      highlights: [
        { type: 'arrow-right', x: 320,  y: 360, label: 'GO!',         color: '#ff8844' },
        { type: 'arrow-right', x: 1180, y: 360, label: 'KEEP GOING', color: '#ff8844' },
      ],
    }),

    // L5 BOUNCE BARRAGE — vertical bounce tower
    base({
      name: 'BOUNCE BARRAGE', width: 1600, height: 1400, voidY: 1340,
      startX: 60, startY: 1280, goalX: 1440, goalY: 80,
      platforms: [
        { x: 0,    y: 1340, w: 1600, h: 60, type: 'ground' },
        { x: 220,  y: 1100, w: 100,  h: 18 },
        { x: 740,  y: 980,  w: 100,  h: 18 },
        { x: 280,  y: 820,  w: 100,  h: 18 },
        { x: 800,  y: 660,  w: 100,  h: 18 },
        { x: 360,  y: 480,  w: 100,  h: 18 },
        { x: 880,  y: 320,  w: 100,  h: 18 },
        { x: 1320, y: 140,  w: 240,  h: 60, type: 'ground' },
      ],
      bounces: [
        { x: 740, y: 1322, w: 100, h: 14, rotation: -10 },
        { x: 220, y: 1082, w: 100, h: 14, rotation:  18 },
        { x: 740, y: 962,  w: 100, h: 14, rotation: -18 },
        { x: 280, y: 802,  w: 100, h: 14, rotation:  18 },
        { x: 800, y: 642,  w: 100, h: 14, rotation: -18 },
        { x: 360, y: 462,  w: 100, h: 14, rotation:  18 },
        { x: 880, y: 302,  w: 100, h: 14, rotation: -22 },
      ],
      coins: [
        { x: 270,  y: 1060 }, { x: 790, y: 940 }, { x: 330, y: 780 },
        { x: 850,  y: 620  }, { x: 410, y: 440 }, { x: 930, y: 280 },
        { x: 1380, y: 100  },
      ],
      spiritEmbers: [{ x: 1450, y: 100, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 1180, w: 320, title: 'BOUNCE BARRAGE',
        lines: ['EVERY PAD LAUNCHES YOU.', 'AIM YOUR LANDING.'], color: '#00ff88' }],
      highlights: [
        { type: 'arrow-up', x: 790,  y: 1280, label: 'BOUNCE!', color: '#00ff88' },
        { type: 'arrow-up', x: 1440, y: 200,  label: 'TOP',     color: '#ffd54a' },
      ],
    }),
  ];
})();
