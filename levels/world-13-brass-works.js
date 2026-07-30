// levels/world-13-brass-works.js
// ──────────────────────────────────────────────────────────────────
// World 13 · BRASS WORKS — steampunk theme, sandstorm weather.
// Conveyor belts, timed tiles, fall-away tiles, rotating platforms.
// ──────────────────────────────────────────────────────────────────

(function () {
  const base = (overrides) => Object.assign({
    bgColors: ['#0e0a06', '#1e1610'],
    platColors: ['#1a0e04', '#2e1a08', '#5a3614', '#a47020', '#ffce5a'],
    accentColor: '#a47020', accentColor2: '#ffce5a',
    skyStars: false, misty: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'steampunk', weather: 'sandstorm',
    startX: 60, startY: 380, goalY: 310,
    timePar: 260, timeGold: 170,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  window.LEVELS_W13 = [
    // L1 GEAR BAZAAR — long conveyors against the sandstorm wind
    base({
      name: 'STEAM GEAR BAZAAR', width: 2600, goalX: 2500,
      platforms: [
        { x: 0,    y: 450, w: 2600, h: 60, type: 'ground' },
        { x: 240,  y: 380, w: 200,  h: 16, type: 'conveyor', dir:  1, speed: 2.2 },
        { x: 540,  y: 320, w: 200,  h: 16, type: 'conveyor', dir: -1, speed: 2.2 },
        { x: 840,  y: 380, w: 200,  h: 16, type: 'conveyor', dir:  1, speed: 2.6 },
        { x: 1140, y: 320, w: 200,  h: 16, type: 'conveyor', dir: -1, speed: 2.6 },
        { x: 1440, y: 380, w: 240,  h: 16, type: 'conveyor', dir:  1, speed: 3.0 },
        { x: 1760, y: 320, w: 240,  h: 16, type: 'conveyor', dir:  1, speed: 3.0 },
        { x: 2080, y: 360, w: 140,  h: 18 },
        { x: 2280, y: 300, w: 200,  h: 18 },
      ],
      coins: [
        { x: 280,  y: 340 }, { x: 580,  y: 280 }, { x: 880,  y: 340 },
        { x: 1180, y: 280 }, { x: 1480, y: 340 }, { x: 1800, y: 280 },
        { x: 2300, y: 260 },
      ],
      enemies: [
        { x: 1000, y: 408, v: 0, hp: 2, elite: 'false' },
        { x: 2000, y: 408, v: 3, hp: 2, elite: 'false' },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'GEAR BAZAAR',
        lines: ['🌪 SAND WIND PUSHES BACK.', 'BELTS HELP — IF YOU', 'TIME THE DIRECTION.'],
        color: '#ffce5a' }],
    }),

    // L2 CLOCKWORK ALLEY — timed & fallaway tiles
    base({
      name: 'STEAM CLOCKWORK ALLEY', width: 2800, goalX: 2700, timePar: 280, timeGold: 180,
      platforms: [
        { x: 0,    y: 450, w: 2800, h: 60, type: 'ground' },
        { x: 280,  y: 380, w: 100,  h: 18, type: 'timed',    period: 160, _id: 'w13l2t1' },
        { x: 440,  y: 360, w: 100,  h: 18, type: 'fallaway', _id: 'w13l2f1' },
        { x: 600,  y: 320, w: 100,  h: 18, type: 'timed',    period: 180, _id: 'w13l2t2' },
        { x: 760,  y: 320, w: 100,  h: 18, type: 'fallaway', _id: 'w13l2f2' },
        { x: 920,  y: 280, w: 100,  h: 18, type: 'timed',    period: 200, _id: 'w13l2t3' },
        { x: 1100, y: 280, w: 100,  h: 18, type: 'fallaway', _id: 'w13l2f3' },
        { x: 1280, y: 240, w: 100,  h: 18, type: 'timed',    period: 160, _id: 'w13l2t4' },
        { x: 1460, y: 280, w: 100,  h: 18, type: 'fallaway', _id: 'w13l2f4' },
        { x: 1640, y: 320, w: 100,  h: 18, type: 'timed',    period: 180, _id: 'w13l2t5' },
        { x: 1820, y: 320, w: 100,  h: 18, type: 'fallaway', _id: 'w13l2f5' },
        { x: 2000, y: 360, w: 120,  h: 18 },
        { x: 2200, y: 320, w: 120,  h: 18 },
        { x: 2420, y: 280, w: 280,  h: 18 },
      ],
      coins: [
        { x: 300,  y: 340 }, { x: 620,  y: 280 }, { x: 940,  y: 240 },
        { x: 1300, y: 200 }, { x: 1660, y: 280 }, { x: 2020, y: 320 },
        { x: 2440, y: 240 },
      ],
      enemies: [{ x: 2200, y: 278, v: 1, hp: 2, elite: 'false' }],
      spiritEmbers: [{ x: 1320, y: 160, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'CLOCKWORK ALLEY',
        lines: ['⏱ TIMED TILES BLINK.', '🍂 FALL-TILES DROP', 'WHEN YOU LAND. KEEP MOVING.'],
        color: '#a47020' }],
    }),

    // L3 PISTON SPIRAL — rotating platforms + conveyor finale
    base({
      name: 'STEAM PISTON SPIRAL', width: 2800, goalX: 2700, goalY: 200, timePar: 300, timeGold: 190,
      platforms: [
        { x: 0,    y: 450, w: 2800, h: 60, type: 'ground' },
        { x: 300,  y: 380, w: 120,  h: 18 },
        { x: 540,  y: 320, w: 80,   h: 16, type: 'rotating', cx: 600,  cy: 320, radius: 70, speed: 0.020, startAngle: 0,          _id: 'w13l3r1' },
        { x: 760,  y: 280, w: 80,   h: 16, type: 'rotating', cx: 820,  cy: 280, radius: 80, speed: 0.022, startAngle: Math.PI,    _id: 'w13l3r2' },
        { x: 1000, y: 240, w: 80,   h: 16, type: 'rotating', cx: 1060, cy: 240, radius: 90, speed: 0.026, startAngle: 0,          _id: 'w13l3r3' },
        { x: 1240, y: 220, w: 100,  h: 18 },
        { x: 1420, y: 280, w: 80,   h: 16, type: 'rotating', cx: 1480, cy: 280, radius: 80, speed: 0.024, startAngle: Math.PI / 2, _id: 'w13l3r4' },
        { x: 1660, y: 240, w: 80,   h: 16, type: 'rotating', cx: 1720, cy: 240, radius: 90, speed: 0.028, startAngle: 0,          _id: 'w13l3r5' },
        { x: 1900, y: 200, w: 100,  h: 18 },
        { x: 2080, y: 260, w: 240,  h: 16, type: 'conveyor', dir: 1, speed: 2.8 },
        { x: 2400, y: 220, w: 300,  h: 18 },
      ],
      coins: [
        { x: 340,  y: 340 }, { x: 600,  y: 260 }, { x: 820,  y: 220 },
        { x: 1060, y: 180 }, { x: 1480, y: 220 }, { x: 1720, y: 180 },
        { x: 2440, y: 180 },
      ],
      enemies: [
        { x: 1260, y: 218, v: 0, hp: 2, elite: 'false' },
        { x: 1920, y: 198, v: 0, hp: 3, elite: 'false' },
      ],
      spiritEmbers: [{ x: 1060, y: 120, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'PISTON SPIRAL',
        lines: ['⚙ ROTATING ARMS', 'CARRY YOU IN ARCS.', 'JUMP AT THE APEX.'],
        color: '#ffce5a' }],
    }),
  ];
})();
