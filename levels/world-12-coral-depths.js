// levels/world-12-coral-depths.js
// ──────────────────────────────────────────────────────────────────
// World 12 · CORAL DEPTHS — coralreef theme, tide weather.
// Water + windtunnel + magnetic anchors.
// ──────────────────────────────────────────────────────────────────

(function () {
  const base = (overrides) => Object.assign({
    bgColors: ['#021420', '#053648'],
    platColors: ['#02181c', '#062a2a', '#0e4848', '#1c7878', '#86e8d8'],
    accentColor: '#ff8a6e', accentColor2: '#86e8d8',
    skyStars: false, misty: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'coralreef', weather: 'tide',
    startX: 60, startY: 380, goalY: 310,
    timePar: 260, timeGold: 160,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  window.LEVELS_W12 = [
    // L1 LAGOON DIVE
    base({
      name: 'CORAL LAGOON DIVE', width: 2600, goalX: 2500,
      platforms: [
        { x: 0,    y: 450, w: 480, h: 60, type: 'ground' },
        { x: 480,  y: 400, w: 520, h: 50, type: 'water' },
        { x: 1000, y: 450, w: 360, h: 60, type: 'ground' },
        { x: 1360, y: 400, w: 480, h: 50, type: 'water' },
        { x: 1840, y: 450, w: 760, h: 60, type: 'ground' },
        { x: 240,  y: 380, w: 120, h: 18 },
        { x: 600,  y: 320, w: 100, h: 18 },
        { x: 800,  y: 280, w: 100, h: 18 },
        { x: 1080, y: 360, w: 120, h: 18 },
        { x: 1240, y: 300, w: 100, h: 18 },
        { x: 1500, y: 320, w: 100, h: 18 },
        { x: 1700, y: 260, w: 100, h: 18 },
        { x: 1900, y: 360, w: 120, h: 18 },
        { x: 2100, y: 300, w: 100, h: 18 },
        { x: 2320, y: 340, w: 180, h: 18 },
      ],
      coins: [
        { x: 280,  y: 340 }, { x: 620,  y: 280 }, { x: 840,  y: 240 },
        { x: 1100, y: 320 }, { x: 1520, y: 280 }, { x: 1720, y: 220 },
        { x: 2340, y: 300 },
      ],
      enemies: [
        { x: 1100, y: 408, v: 3, hp: 2, elite: 'false' },
        { x: 2000, y: 408, v: 4, hp: 2, elite: 'false' },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'LAGOON DIVE',
        lines: ['🌊 WATER SLOWS YOU', 'BUT YOU CAN SWIM.', 'TIDE RISES — HURRY.'],
        color: '#86e8d8' }],
    }),

    // L2 ATOLL CURRENTS
    base({
      name: 'REEF ATOLL CURRENTS', width: 2800, goalX: 2700, goalY: 200, timePar: 260, timeGold: 170,
      platforms: [
        { x: 0,    y: 450, w: 420, h: 60,  type: 'ground' },
        { x: 420,  y: 380, w: 580, h: 70,  type: 'water' },
        { x: 500,  y: 240, w: 80,  h: 180, type: 'windtunnel', lift: 0.9 },
        { x: 480,  y: 200, w: 120, h: 18 },
        { x: 700,  y: 160, w: 100, h: 18 },
        { x: 1000, y: 450, w: 360, h: 60,  type: 'ground' },
        { x: 1360, y: 380, w: 520, h: 70,  type: 'water' },
        { x: 1440, y: 240, w: 80,  h: 180, type: 'windtunnel', lift: 0.95 },
        { x: 1420, y: 200, w: 120, h: 18 },
        { x: 1640, y: 140, w: 120, h: 18 },
        { x: 1880, y: 450, w: 920, h: 60,  type: 'ground' },
        { x: 1980, y: 360, w: 100, h: 18 },
        { x: 2180, y: 280, w: 100, h: 18 },
        { x: 2380, y: 220, w: 100, h: 18 },
        { x: 2600, y: 260, w: 200, h: 18 },
      ],
      coins: [
        { x: 530,  y: 320 }, { x: 720,  y: 120 }, { x: 1470, y: 320 },
        { x: 1660, y: 100 }, { x: 2000, y: 320 }, { x: 2400, y: 180 },
        { x: 2640, y: 220 },
      ],
      enemies: [
        { x: 720,  y: 138, v: 0, hp: 2, elite: 'false' },
        { x: 2400, y: 198, v: 0, hp: 3, elite: 'false' },
      ],
      spiritEmbers: [{ x: 730, y: 60, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'ATOLL CURRENTS',
        lines: ['BUBBLE COLUMNS HURL YOU UP.', 'CHAIN BUBBLES,', 'CROSS THE LAGOON.'],
        color: '#ff8a6e' }],
    }),

    // L3 PEARL MAGNET
    base({
      name: 'REEF PEARL MAGNET', width: 3000, goalX: 2900, timePar: 280, timeGold: 180,
      platforms: [
        { x: 0,    y: 450, w: 600, h: 60, type: 'ground' },
        { x: 600,  y: 410, w: 600, h: 60, type: 'water' },
        { x: 1200, y: 450, w: 360, h: 60, type: 'ground' },
        { x: 1560, y: 410, w: 600, h: 60, type: 'water' },
        { x: 2160, y: 450, w: 840, h: 60, type: 'ground' },
        { x: 280,  y: 360, w: 100, h: 18 },
        { x: 520,  y: 300, w: 100, h: 18 },
        { x: 760,  y: 240, w: 32,  h: 32, type: 'magnetic', radius: 140, pull: 0.7 },
        { x: 880,  y: 300, w: 120, h: 18 },
        { x: 1100, y: 360, w: 100, h: 18 },
        { x: 1320, y: 320, w: 100, h: 18 },
        { x: 1500, y: 240, w: 32,  h: 32, type: 'magnetic', radius: 140, pull: 0.7 },
        { x: 1640, y: 320, w: 120, h: 18 },
        { x: 1880, y: 240, w: 32,  h: 32, type: 'magnetic', radius: 150, pull: 0.8 },
        { x: 2020, y: 300, w: 120, h: 18 },
        { x: 2240, y: 360, w: 120, h: 18 },
        { x: 2480, y: 300, w: 120, h: 18 },
        { x: 2720, y: 260, w: 200, h: 18 },
      ],
      coins: [
        { x: 320,  y: 320 }, { x: 560,  y: 260 }, { x: 1340, y: 280 },
        { x: 1660, y: 280 }, { x: 2040, y: 260 }, { x: 2500, y: 260 },
        { x: 2760, y: 220 },
      ],
      enemies: [
        { x: 1320, y: 308, v: 3, hp: 2, elite: 'false' },
        { x: 2280, y: 408, v: 4, hp: 2, elite: 'false' },
      ],
      spiritEmbers: [
        { x: 780,  y: 180, collected: false, idx: 0 },
        { x: 1900, y: 180, collected: false, idx: 1 },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'PEARL MAGNET',
        lines: ['🧲 PEARLS TUG YOU IN.', 'AIM SLIGHTLY OFF —', 'THEY DO THE REST.'],
        color: '#86e8d8' }],
    }),
  ];
})();
