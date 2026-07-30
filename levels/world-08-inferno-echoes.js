// levels/world-08-inferno-echoes.js
// ──────────────────────────────────────────────────────────────────
// World 8 · INFERNO ECHOES — volcanic combat-ability focus.
// Each level forces a different ability/bagpipe to actually clear.
// ──────────────────────────────────────────────────────────────────

(function () {
  const BG = ['#1a0500', '#350c00'];
  const PC = ['#1a0400', '#2e0800', '#5a1a00', '#7a2c00', '#ff4400'];
  const base = (overrides) => Object.assign({
    bgColors: BG, platColors: PC, accentColor: '#ff4400', accentColor2: '#ff8800',
    skyStars: false, misty: false, height: 560, voidFloor: false, voidY: 460,
    weather: 'none', startX: 60, startY: 380, goalY: 310,
    timePar: 240, timeGold: 150,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  // Programmatic breakshot wall (L2) — keep the same construction as
  // the inline builder so the level is identical.
  const w2Walls = [600, 950, 1300, 1650, 2000];
  const w2 = [];
  w2Walls.forEach((wx, i) => {
    for (let r = 0; r < 5; r++) w2.push({ x: wx, y: 432 - r * 32, w: 60, h: 18, type: 'breakshot', _id: 'w8l2_' + i + '_' + r });
  });

  window.LEVELS_W8 = [
    // L1 MAGMA STREAM — moving platforms across lava ground (spike floor)
    base({
      name: 'MAGMA STREAM', width: 3000, goalX: 2900,
      platforms: [
        { x: 0,    y: 450, w: 280, h: 60, type: 'ground' },
        { x: 2700, y: 450, w: 300, h: 60, type: 'ground' },
      ],
      spikes: [{ x: 280, y: 434, w: 2420, h: 24, rotation: 0, spikeType: 'static' }],
      movingPlats: [
        { x: 320,  y: 380, x2: 520,  y2: 380, w: 90, h: 14, speed: 1.4 },
        { x: 680,  y: 320, x2: 880,  y2: 320, w: 90, h: 14, speed: 1.6 },
        { x: 1040, y: 380, x2: 1240, y2: 380, w: 90, h: 14, speed: 1.4 },
        { x: 1400, y: 300, x2: 1600, y2: 300, w: 90, h: 14, speed: 1.7 },
        { x: 1760, y: 380, x2: 1960, y2: 380, w: 90, h: 14, speed: 1.4 },
        { x: 2120, y: 320, x2: 2320, y2: 320, w: 90, h: 14, speed: 1.6 },
        { x: 2480, y: 380, x2: 2680, y2: 380, w: 90, h: 14, speed: 1.4 },
      ],
      coins: [
        { x: 380,  y: 340 }, { x: 740,  y: 280 }, { x: 1100, y: 340 },
        { x: 1460, y: 260 }, { x: 1820, y: 340 }, { x: 2180, y: 280 },
        { x: 2540, y: 340 },
      ],
      spiritEmbers: [{ x: 1500, y: 200, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 320, title: 'MAGMA STREAM',
        lines: ['THE FLOOR IS LAVA.', 'RIDE THE PLATFORMS.'], color: '#ff8800' }],
    }),

    // L2 BURNING WALL — layered breakshot walls; auto-fire to chew through
    base({
      name: 'BURNING WALL', width: 2400, goalX: 2300,
      platforms: [{ x: 0, y: 450, w: 2400, h: 60, type: 'ground' }].concat(w2),
      coins: w2Walls.map(wx => ({ x: wx + 80, y: 410 })),
      spiritEmbers: [{ x: 1900, y: 280, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 320, title: 'BURNING WALL',
        lines: ['HOLD  Q  TO CHEW', 'THROUGH THE LAYERS.'], color: '#ff5544' }],
    }),

    // L3 CHARGE CHAINS — four 320-px voids with charge-refresh between
    base({
      name: 'CHARGE CHAINS', width: 3400, goalX: 3300,
      platforms: [
        { x: 0,    y: 450, w: 480, h: 60, type: 'ground' },
        { x: 800,  y: 450, w: 320, h: 60, type: 'ground' },
        { x: 1440, y: 450, w: 320, h: 60, type: 'ground' },
        { x: 2080, y: 450, w: 320, h: 60, type: 'ground' },
        { x: 2720, y: 450, w: 680, h: 60, type: 'ground' },
      ],
      powerupItems: [
        { x: 820,  y: 416, type: 'chargerefresh' },
        { x: 1460, y: 416, type: 'chargerefresh' },
        { x: 2100, y: 416, type: 'chargerefresh' },
      ],
      coins: [
        { x: 200,  y: 410 }, { x: 940,  y: 410 }, { x: 1580, y: 410 },
        { x: 2220, y: 410 }, { x: 3000, y: 410 },
      ],
      spiritEmbers: [{ x: 3200, y: 200, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'CHARGE CHAINS',
        lines: ['JUMP, THEN  E  TO DASH.', 'GRAB THE REFRESH', 'BETWEEN GAPS.'], color: '#ff8844' }],
    }),

    // L4 DRONE FORTRESS — three arena chambers with aerial enemies
    base({
      name: 'DRONE FORTRESS', width: 2800, goalX: 2700,
      platforms: [
        { x: 0,    y: 450, w: 2800, h: 60,  type: 'ground' },
        { x: 700,  y: 100, w: 30,   h: 350 },
        { x: 1500, y: 100, w: 30,   h: 350 },
        { x: 2300, y: 100, w: 30,   h: 350 },
        { x: 220,  y: 320, w: 80,   h: 18 },
        { x: 380,  y: 260, w: 80,   h: 18 },
        { x: 540,  y: 320, w: 80,   h: 18 },
        { x: 1020, y: 320, w: 80,   h: 18 },
        { x: 1180, y: 260, w: 80,   h: 18 },
        { x: 1340, y: 320, w: 80,   h: 18 },
        { x: 1820, y: 300, w: 80,   h: 18 },
        { x: 1980, y: 240, w: 80,   h: 18 },
        { x: 2140, y: 300, w: 80,   h: 18 },
      ],
      enemies: [
        { x: 240,  y: 280, v: 0, hp: 2, elite: 'false' },
        { x: 400,  y: 220, v: 0, hp: 2, elite: 'false' },
        { x: 560,  y: 280, v: 1, hp: 2, elite: 'false' },
        { x: 1040, y: 280, v: 0, hp: 2, elite: 'false' },
        { x: 1200, y: 220, v: 1, hp: 2, elite: 'false' },
        { x: 1360, y: 280, v: 0, hp: 2, elite: 'false' },
        { x: 1840, y: 260, v: 1, hp: 2, elite: 'false' },
        { x: 2000, y: 200, v: 0, hp: 2, elite: 'false' },
        { x: 2160, y: 260, v: 1, hp: 2, elite: 'false' },
      ],
      coins: [{ x: 400, y: 210 }, { x: 1200, y: 210 }, { x: 2000, y: 190 }, { x: 2500, y: 410 }],
      spiritEmbers: [{ x: 2600, y: 200, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 320, title: 'DRONE FORTRESS',
        lines: ['STAND BELOW THE LINE.', 'PRESS  R  TO SWEEP.'], color: '#cc88ff' }],
    }),

    // L5 INFERNO LADDER — vertical climb combining every prior mechanic
    base({
      name: 'INFERNO LADDER', width: 1600, height: 1400, voidY: 1340,
      startX: 60, startY: 1280, goalX: 1440, goalY: 80,
      platforms: [
        { x: 0,    y: 1340, w: 1600, h: 60, type: 'ground' },
        { x: 600,  y: 1180, w: 80,   h: 18, type: 'breakshot', _id: 'w8l5b1' },
        { x: 600,  y: 1148, w: 80,   h: 18, type: 'breakshot', _id: 'w8l5b2' },
        { x: 600,  y: 1116, w: 80,   h: 18, type: 'breakshot', _id: 'w8l5b3' },
        { x: 200,  y: 1000, w: 160,  h: 18 },
        { x: 700,  y: 920,  w: 160,  h: 18 },
        { x: 1200, y: 840,  w: 160,  h: 18 },
        { x: 200,  y: 640,  w: 100,  h: 18 },
        { x: 400,  y: 600,  w: 100,  h: 18 },
        { x: 600,  y: 640,  w: 100,  h: 18 },
        { x: 800,  y: 600,  w: 100,  h: 18 },
        { x: 1320, y: 200,  w: 280,  h: 60, type: 'ground' },
      ],
      movingPlats: [{ x: 600, y: 380, x2: 1200, y2: 220, w: 110, h: 14, speed: 1.5 }],
      bounces: [{ x: 760, y: 1322, w: 100, h: 14 }],
      powerupItems: [
        { x: 720,  y: 886, type: 'chargerefresh' },
        { x: 1220, y: 806, type: 'chargerefresh' },
      ],
      enemies: [
        { x: 220, y: 600, v: 0, hp: 2, elite: 'false' },
        { x: 420, y: 560, v: 1, hp: 2, elite: 'false' },
        { x: 620, y: 600, v: 0, hp: 2, elite: 'false' },
        { x: 820, y: 560, v: 1, hp: 2, elite: 'false' },
      ],
      coins: [
        { x: 800,  y: 1100 }, { x: 280,  y: 960 }, { x: 780,  y: 880 },
        { x: 1280, y: 800  }, { x: 500,  y: 560 }, { x: 1400, y: 160 },
      ],
      spiritEmbers: [{ x: 1450, y: 100, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 1180, w: 320, title: 'INFERNO LADDER',
        lines: ['EVERYTHING YOU LEARNED.', 'CLIMB.'], color: '#ff5544' }],
    }),
  ];
})();
