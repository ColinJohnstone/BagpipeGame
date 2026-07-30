// levels/world-16-dune-embers.js
// ──────────────────────────────────────────────────────────────────
// World 16 · DUNE EMBERS — desert theme, sandstorm weather.
// Showcase for v=12 TURRET enemies. Stationary cannons fire 3-shot
// bursts at the player; you time your jumps around their telegraphs.
// ──────────────────────────────────────────────────────────────────

(function () {
  const base = (overrides) => Object.assign({
    bgColors: ['#30170a', '#8a4a1a'],
    platColors: ['#2a1608', '#5a3214', '#9a6628', '#d69a42', '#ffd36a'],
    accentColor: '#c46a18', accentColor2: '#ffe08a',
    skyStars: false, misty: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'desert', weather: 'sandstorm',
    startX: 60, startY: 380, goalY: 310,
    timePar: 260, timeGold: 170,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  window.LEVELS_W16 = [
    // L1 SAND GATE — gentle intro to turrets, mostly horizontal
    base({
      name: 'DUNE SAND GATE', width: 2600, goalX: 2500,
      platforms: [
        { x: 0,    y: 450, w: 2600, h: 60, type: 'ground' },
        { x: 280,  y: 380, w: 140, h: 18 },
        { x: 520,  y: 320, w: 140, h: 18 },
        { x: 760,  y: 380, w: 140, h: 18 },
        { x: 1000, y: 320, w: 140, h: 18 },
        { x: 1240, y: 260, w: 140, h: 18 },
        { x: 1480, y: 320, w: 140, h: 18 },
        { x: 1720, y: 380, w: 140, h: 18 },
        { x: 1960, y: 320, w: 140, h: 18 },
        { x: 2200, y: 260, w: 140, h: 18 },
        { x: 2400, y: 320, w: 200, h: 18 },
      ],
      coins: [
        { x: 320,  y: 340 }, { x: 560,  y: 280 }, { x: 800,  y: 340 },
        { x: 1040, y: 280 }, { x: 1280, y: 220 }, { x: 1520, y: 280 },
        { x: 1760, y: 340 }, { x: 2000, y: 280 }, { x: 2440, y: 280 },
      ],
      enemies: [
        // Turrets perched on platforms — fire 3-shot bursts every ~3 sec
        { x: 580,  y: 288, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        { x: 1300, y: 228, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        { x: 2020, y: 288, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        // A walking patroller for variety
        { x: 1200, y: 408, v: 0,  hp: 2, elite: 'false' },
      ],
      spiritEmbers: [{ x: 1320, y: 180, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'SAND GATE',
        lines: ['🌵 TURRETS FIRE 3 SHOTS', 'WHEN THEY FLASH ORANGE.', 'JUMP BETWEEN BURSTS.'],
        color: '#ffe08a' }],
    }),

    // L2 PILLARS OF WIND — vertical climb with windtunnels + turrets
    base({
      name: 'DUNE PILLARS OF WIND', width: 2400, height: 800, voidY: 740, goalY: 100,
      timePar: 280, timeGold: 190,
      platforms: [
        { x: 0,    y: 740, w: 2400, h: 60, type: 'ground' },
        // Wind columns lift the player up to the next platform
        { x: 240,  y: 380, w: 60,  h: 360, type: 'windtunnel', lift: 0.95 },
        { x: 720,  y: 280, w: 60,  h: 460, type: 'windtunnel', lift: 1.0 },
        { x: 1280, y: 200, w: 60,  h: 540, type: 'windtunnel', lift: 1.05 },
        { x: 1800, y: 160, w: 60,  h: 580, type: 'windtunnel', lift: 1.1 },
        // Landing platforms
        { x: 180,  y: 600, w: 180, h: 18 },
        { x: 420,  y: 540, w: 160, h: 18 },
        { x: 660,  y: 460, w: 180, h: 18 },
        { x: 900,  y: 400, w: 160, h: 18 },
        { x: 1140, y: 340, w: 180, h: 18 },
        { x: 1380, y: 280, w: 160, h: 18 },
        { x: 1620, y: 220, w: 180, h: 18 },
        { x: 1860, y: 160, w: 160, h: 18 },
        { x: 2100, y: 140, w: 280, h: 18 },
      ],
      coins: [
        { x: 220,  y: 560 }, { x: 460,  y: 500 }, { x: 700,  y: 420 },
        { x: 940,  y: 360 }, { x: 1180, y: 300 }, { x: 1420, y: 240 },
        { x: 1660, y: 180 }, { x: 1900, y: 120 }, { x: 2200, y: 100 },
      ],
      enemies: [
        // Turrets at landing pads — they fire just as you're descending
        { x: 480,  y: 508, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        { x: 960,  y: 368, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        { x: 1440, y: 248, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        { x: 1920, y: 128, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
      ],
      spiritEmbers: [{ x: 1660, y: 100, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 600, w: 320, title: 'PILLARS',
        lines: ['💨 WIND LIFTS YOU UP.', 'TURRETS GUARD EACH LEDGE.', 'TIME THE GAP.'],
        color: '#c46a18' }],
    }),

    // L3 BURIED CITADEL — boss finale with turrets + a v=99 boss
    base({
      name: 'DUNE BURIED CITADEL', width: 3200, goalX: 3100, goalY: 220,
      timePar: 320, timeGold: 210,
      platforms: [
        { x: 0,    y: 450, w: 1400, h: 60, type: 'ground' },
        // Pillar segments approaching the boss arena
        { x: 240,  y: 380, w: 120, h: 18 },
        { x: 460,  y: 320, w: 120, h: 18 },
        { x: 680,  y: 260, w: 120, h: 18 },
        { x: 900,  y: 320, w: 120, h: 18 },
        { x: 1120, y: 380, w: 120, h: 18 },
        // Boss arena — wide flat platform
        { x: 1500, y: 450, w: 1700, h: 60, type: 'ground' },
        // Cover pillars inside the boss arena
        { x: 1700, y: 380, w: 60,  h: 18 },
        { x: 2000, y: 320, w: 80,  h: 18 },
        { x: 2300, y: 380, w: 60,  h: 18 },
        { x: 2600, y: 320, w: 80,  h: 18 },
        { x: 2900, y: 280, w: 200, h: 18 },
      ],
      coins: [
        { x: 280,  y: 340 }, { x: 500,  y: 280 }, { x: 720,  y: 220 },
        { x: 940,  y: 280 }, { x: 1160, y: 340 },
        { x: 1740, y: 340 }, { x: 2040, y: 280 }, { x: 2340, y: 340 },
        { x: 2640, y: 280 }, { x: 2940, y: 240 },
      ],
      enemies: [
        // Approach gauntlet — turrets on each step
        { x: 280,  y: 348, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        { x: 720,  y: 228, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        { x: 1160, y: 348, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        // Boss arena guards
        { x: 1740, y: 348, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        { x: 2340, y: 348, v: 12, hp: 4, w: 28, h: 32, elite: 'false' },
        // BOSS — 3-phase, telegraphed attacks
        { x: 2200, y: 384, v: 99, hp: 30, w: 64, h: 64, elite: 'false' },
      ],
      powerupItems: [{ x: 1600, y: 410, type: 'shield', collected: false }],
      spiritEmbers: [
        { x: 700,  y: 220, collected: false, idx: 0 },
        { x: 2940, y: 100, collected: false, idx: 1 },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'BURIED CITADEL',
        lines: ['👑 CLEAR THE TURRETS,', 'THEN FACE THE WARDEN.', 'SHIELD HELPS NEAR THE GATE.'],
        color: '#ffe08a' }],
    }),
  ];
})();
