// levels/world-17-veiled-thicket.js
// ──────────────────────────────────────────────────────────────────
// World 17 · VEILED THICKET — forest theme, fog weather.
// Showcase for v=13 TELEPORTER enemies. Tree-spirits vanish and
// reappear near the player; you have to predict their re-entry.
// ──────────────────────────────────────────────────────────────────

(function () {
  const base = (overrides) => Object.assign({
    bgColors: ['#06120e', '#0f2d24'],
    platColors: ['#08160c', '#12301c', '#245c32', '#3f8a46', '#86d46a'],
    accentColor: '#2aa85f', accentColor2: '#b6ff70',
    skyStars: true, misty: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'forest', weather: 'fog',
    startX: 60, startY: 380, goalY: 310,
    timePar: 280, timeGold: 180,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  window.LEVELS_W17 = [
    // L1 GLADE PATROL — gentle intro to teleporters
    base({
      name: 'WOOD GLADE PATROL', width: 2600, goalX: 2500,
      platforms: [
        { x: 0,    y: 450, w: 2600, h: 60, type: 'ground' },
        { x: 240,  y: 380, w: 140, h: 18 },
        { x: 460,  y: 320, w: 140, h: 18 },
        { x: 680,  y: 280, w: 140, h: 18 },
        { x: 900,  y: 340, w: 140, h: 18 },
        { x: 1120, y: 300, w: 140, h: 18 },
        { x: 1340, y: 360, w: 140, h: 18 },
        { x: 1560, y: 300, w: 140, h: 18 },
        { x: 1780, y: 360, w: 140, h: 18 },
        { x: 2000, y: 300, w: 140, h: 18 },
        { x: 2220, y: 340, w: 200, h: 18 },
        { x: 2440, y: 280, w: 160, h: 18 },
      ],
      coins: [
        { x: 280,  y: 340 }, { x: 500,  y: 280 }, { x: 720,  y: 240 },
        { x: 940,  y: 300 }, { x: 1160, y: 260 }, { x: 1380, y: 320 },
        { x: 1600, y: 260 }, { x: 1820, y: 320 }, { x: 2040, y: 260 },
        { x: 2480, y: 240 },
      ],
      enemies: [
        { x: 700,  y: 248, v: 13, hp: 3, elite: 'false' },
        { x: 1160, y: 268, v: 13, hp: 3, elite: 'false' },
        { x: 1820, y: 328, v: 13, hp: 3, elite: 'false' },
        // Foreground patroller
        { x: 1500, y: 408, v: 0,  hp: 2, elite: 'false' },
      ],
      spiritEmbers: [{ x: 1160, y: 220, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'GLADE PATROL',
        lines: ['🌫 SPIRITS VANISH', 'AND REAPPEAR NEAR YOU.', 'WATCH THE PURPLE FLASH.'],
        color: '#b6ff70' }],
    }),

    // L2 ROOT MAZE — soundwave platforms + teleporters + silencers
    base({
      name: 'WOOD ROOT MAZE', width: 2800, goalX: 2700, timePar: 300, timeGold: 190,
      platforms: [
        { x: 0,    y: 450, w: 600,  h: 60, type: 'ground' },
        { x: 700,  y: 380, w: 130, h: 18, type: 'soundwave', _id: 'w17l2s1' },
        { x: 900,  y: 320, w: 130, h: 18, type: 'soundwave', _id: 'w17l2s2' },
        { x: 1100, y: 280, w: 130, h: 18, type: 'soundwave', _id: 'w17l2s3' },
        { x: 1300, y: 320, w: 130, h: 18, type: 'soundwave', _id: 'w17l2s4' },
        { x: 1500, y: 280, w: 130, h: 18, type: 'soundwave', _id: 'w17l2s5' },
        { x: 1700, y: 320, w: 130, h: 18, type: 'soundwave', _id: 'w17l2s6' },
        { x: 1900, y: 380, w: 130, h: 18 },
        { x: 2100, y: 320, w: 130, h: 18 },
        { x: 2300, y: 280, w: 140, h: 18 },
        { x: 2500, y: 320, w: 300, h: 60, type: 'ground' },
      ],
      coins: [
        { x: 750,  y: 340 }, { x: 940,  y: 280 }, { x: 1140, y: 240 },
        { x: 1340, y: 280 }, { x: 1540, y: 240 }, { x: 1740, y: 280 },
        { x: 1940, y: 340 }, { x: 2340, y: 240 }, { x: 2580, y: 280 },
      ],
      enemies: [
        // Teleporters appear and disappear as you traverse the soundwave path
        { x: 1140, y: 248, v: 13, hp: 3, elite: 'false' },
        { x: 1540, y: 248, v: 13, hp: 3, elite: 'false' },
        // Silencer adds tension — disables abilities
        { x: 1900, y: 348, v: 7,  hp: 2, elite: 'false' },
        { x: 2380, y: 248, v: 13, hp: 3, elite: 'false' },
      ],
      spiritEmbers: [
        { x: 1140, y: 200, collected: false, idx: 0 },
        { x: 2340, y: 200, collected: false, idx: 1 },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'ROOT MAZE',
        lines: ['🎵 SHOOT THE LEAF TILES', 'TO MATERIALIZE THEM.', 'PURPLE FOES TELEPORT.'],
        color: '#2aa85f' }],
    }),

    // L3 HEART OF THE WOOD — boss finale with dense teleporters
    base({
      name: 'WOOD HEART OF THE WOOD', width: 3200, goalX: 3100, goalY: 200,
      timePar: 320, timeGold: 210,
      platforms: [
        { x: 0,    y: 450, w: 1400, h: 60, type: 'ground' },
        { x: 240,  y: 380, w: 140, h: 18 },
        { x: 460,  y: 320, w: 140, h: 18 },
        { x: 680,  y: 280, w: 140, h: 18 },
        { x: 900,  y: 320, w: 140, h: 18 },
        { x: 1120, y: 380, w: 140, h: 18 },
        // Boss arena
        { x: 1500, y: 450, w: 1700, h: 60, type: 'ground' },
        { x: 1700, y: 360, w: 80,  h: 18 },
        { x: 2000, y: 320, w: 80,  h: 18 },
        { x: 2400, y: 360, w: 80,  h: 18 },
        { x: 2700, y: 320, w: 80,  h: 18 },
        { x: 2900, y: 240, w: 200, h: 18 },
      ],
      coins: [
        { x: 280,  y: 340 }, { x: 500,  y: 280 }, { x: 720,  y: 240 },
        { x: 940,  y: 280 }, { x: 1160, y: 340 },
        { x: 1740, y: 320 }, { x: 2040, y: 280 }, { x: 2440, y: 320 },
        { x: 2740, y: 280 }, { x: 2940, y: 200 },
      ],
      enemies: [
        // Approach: teleporters between every pad
        { x: 500,  y: 288, v: 13, hp: 3, elite: 'false' },
        { x: 900,  y: 288, v: 13, hp: 3, elite: 'false' },
        // Boss arena: dual teleporters flanking the boss
        { x: 1740, y: 328, v: 13, hp: 3, elite: 'false' },
        { x: 2440, y: 328, v: 13, hp: 3, elite: 'false' },
        { x: 2740, y: 288, v: 13, hp: 4, elite: 'true' },
        // BOSS
        { x: 2200, y: 384, v: 99, hp: 30, w: 64, h: 64, elite: 'false' },
      ],
      powerupItems: [
        { x: 1600, y: 410, type: 'shield', collected: false },
        { x: 2800, y: 200, type: 'heal',   collected: false },
      ],
      spiritEmbers: [
        { x: 700,  y: 200, collected: false, idx: 0 },
        { x: 2940, y: 100, collected: false, idx: 1 },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'HEART OF THE WOOD',
        lines: ['👤 SPIRITS DON\'T STAY STILL.', 'AIM WHERE THEY WILL BE.', 'THE WARDEN AWAITS.'],
        color: '#b6ff70' }],
    }),
  ];
})();
