// levels/world-09-frost-gauntlet.js
// ──────────────────────────────────────────────────────────────────
// World 9 · FROST GAUNTLET — frozen theme, weather/aim mechanics.
// Each level pivots on a specific weather effect or aim mode.
// ──────────────────────────────────────────────────────────────────

(function () {
  const BG = ['#05101f', '#0a1c3a'];
  const PC = ['#0c1628', '#182440', '#1e4070', '#3070a0', '#80c8ff'];
  const base = (overrides) => Object.assign({
    bgColors: BG, platColors: PC, accentColor: '#80c8ff', accentColor2: '#cfe6ff',
    skyStars: true, misty: true, height: 560, voidFloor: false, voidY: 460,
    weather: 'none', startX: 60, startY: 380, goalY: 310,
    timePar: 260, timeGold: 160,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  window.LEVELS_W9 = [
    // L1 LOW GRAVITY — moon weather, far-apart vertical platforms
    base({
      name: 'LOW GRAVITY', width: 1800, goalX: 1700, height: 720, voidY: 680,
      weather: 'moon',
      platforms: [
        { x: 0,    y: 680, w: 360, h: 60, type: 'ground' },
        { x: 200,  y: 540, w: 100, h: 18 },
        { x: 460,  y: 420, w: 100, h: 18 },
        { x: 720,  y: 300, w: 100, h: 18 },
        { x: 980,  y: 180, w: 100, h: 18 },
        { x: 1240, y: 300, w: 100, h: 18 },
        { x: 1500, y: 420, w: 100, h: 18 },
        { x: 1700, y: 680, w: 100, h: 60, type: 'ground' },
      ],
      coins: [
        { x: 240,  y: 500 }, { x: 500,  y: 380 }, { x: 760,  y: 260 },
        { x: 1020, y: 140 }, { x: 1280, y: 260 }, { x: 1540, y: 380 },
        { x: 1730, y: 640 },
      ],
      spiritEmbers: [{ x: 1020, y: 60, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 480, w: 320, title: 'LOW GRAVITY',
        lines: ['LOW GRAVITY HANGTIME.', 'JUMPS REACH MUCH HIGHER.'], color: '#88ddff' }],
    }),

    // L2 STORM PASSAGE — tornado wind shoves you between platforms
    base({
      name: 'STORM PASSAGE', width: 2800, goalX: 2700, weather: 'tornado',
      platforms: [
        { x: 0,    y: 450, w: 320, h: 60, type: 'ground' },
        { x: 480,  y: 380, w: 70,  h: 18 },
        { x: 700,  y: 380, w: 70,  h: 18 },
        { x: 920,  y: 320, w: 70,  h: 18 },
        { x: 1140, y: 320, w: 70,  h: 18 },
        { x: 1360, y: 380, w: 70,  h: 18 },
        { x: 1580, y: 380, w: 70,  h: 18 },
        { x: 1800, y: 320, w: 70,  h: 18 },
        { x: 2020, y: 320, w: 70,  h: 18 },
        { x: 2240, y: 380, w: 70,  h: 18 },
        { x: 2460, y: 380, w: 70,  h: 18 },
        { x: 2640, y: 450, w: 160, h: 60, type: 'ground' },
      ],
      coins: [
        { x: 510,  y: 340 }, { x: 950,  y: 280 }, { x: 1390, y: 340 },
        { x: 1830, y: 280 }, { x: 2270, y: 340 }, { x: 2700, y: 410 },
      ],
      spiritEmbers: [{ x: 1500, y: 100, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'STORM PASSAGE',
        lines: ['WIND PUSHES YOU.', 'TIME YOUR JUMPS WITH', 'THE GUSTS.'], color: '#88ddff' }],
    }),

    // L3 GLACIER PORTAL — bagpipe 5 portals across walled sections
    base({
      name: 'GLACIER PORTAL', width: 2800, goalX: 2700,
      platforms: [
        { x: 0,    y: 450, w: 600, h: 60, type: 'ground' },
        { x: 600,  y: 100, w: 50,  h: 350 },
        { x: 1100, y: 450, w: 600, h: 60, type: 'ground' },
        { x: 1700, y: 100, w: 50,  h: 350 },
        { x: 2200, y: 450, w: 600, h: 60, type: 'ground' },
        { x: 800,  y: 280, w: 200, h: 18 },
        { x: 1900, y: 280, w: 200, h: 18 },
      ],
      coins: [
        { x: 300,  y: 410 }, { x: 880,  y: 240 }, { x: 1400, y: 410 },
        { x: 1980, y: 240 }, { x: 2500, y: 410 },
      ],
      spiritEmbers: [{ x: 880, y: 200, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'GLACIER PORTAL',
        lines: ['PRESS  5  FOR PORTAL.', 'SHOOT THROUGH THE WALL,', 'WALK INTO THE PORTAL.'],
        color: '#8866ff' }],
    }),

    // L4 SOUNDWAVE LAKE — ice floor + soundwave platforms across void
    base({
      name: 'SOUNDWAVE LAKE', width: 2400, goalX: 2300,
      platforms: [
        { x: 0,    y: 450, w: 320, h: 60, type: 'ground' },
        { x: 2200, y: 450, w: 200, h: 60, type: 'ground' },
        { x: 420,  y: 360, w: 130, h: 18, type: 'soundwave', _id: 'w9l4s1' },
        { x: 620,  y: 320, w: 130, h: 18, type: 'soundwave', _id: 'w9l4s2' },
        { x: 820,  y: 280, w: 130, h: 18, type: 'soundwave', _id: 'w9l4s3' },
        { x: 1040, y: 320, w: 130, h: 18, type: 'soundwave', _id: 'w9l4s4' },
        { x: 1260, y: 360, w: 130, h: 18, type: 'soundwave', _id: 'w9l4s5' },
        { x: 1480, y: 320, w: 130, h: 18, type: 'soundwave', _id: 'w9l4s6' },
        { x: 1700, y: 280, w: 130, h: 18, type: 'soundwave', _id: 'w9l4s7' },
        { x: 1920, y: 320, w: 130, h: 18, type: 'soundwave', _id: 'w9l4s8' },
      ],
      icePlats: [{ x: 320, y: 450, w: 1880, h: 60 }],
      coins: [
        { x: 470,  y: 320 }, { x: 870,  y: 240 }, { x: 1290, y: 320 },
        { x: 1730, y: 240 }, { x: 1970, y: 280 },
      ],
      spiritEmbers: [{ x: 870, y: 100, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'SOUNDWAVE LAKE',
        lines: ['ICE IS SLIPPERY.', 'SHOOT THE TILES TO', 'MAKE FOOTING.'], color: '#22ccaa' }],
    }),

    // L5 AURORA SUMMIT — vertical mix of moon + ice + soundwave + bounce
    base({
      name: 'AURORA SUMMIT', width: 1600, height: 1300, voidY: 1240,
      weather: 'moon', startX: 60, startY: 1180, goalX: 1440, goalY: 100,
      platforms: [
        { x: 0,    y: 1240, w: 1600, h: 60, type: 'ground' },
        { x: 240,  y: 1100, w: 130,  h: 18, type: 'soundwave', _id: 'w9l5s1' },
        { x: 480,  y: 1000, w: 130,  h: 18, type: 'soundwave', _id: 'w9l5s2' },
        { x: 240,  y: 820,  w: 200,  h: 18 },
        { x: 720,  y: 700,  w: 200,  h: 18 },
        { x: 1320, y: 200,  w: 280,  h: 60, type: 'ground' },
      ],
      icePlats: [{ x: 1000, y: 480, w: 360, h: 18 }],
      bounces: [{ x: 480, y: 802, w: 100, h: 14 }],
      movingPlats: [{ x: 600, y: 360, x2: 1200, y2: 220, w: 110, h: 14, speed: 1.5 }],
      powerupItems: [{ x: 280, y: 798, type: 'extrajump' }],
      coins: [
        { x: 300,  y: 1060 }, { x: 540,  y: 960 }, { x: 320,  y: 780 },
        { x: 800,  y: 660  }, { x: 1100, y: 440 }, { x: 1400, y: 160 },
      ],
      spiritEmbers: [{ x: 1450, y: 100, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 1080, w: 320, title: 'AURORA SUMMIT',
        lines: ['EVERYTHING.', 'TO THE TOP.'], color: '#88ddff' }],
    }),
  ];
})();
