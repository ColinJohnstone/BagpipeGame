// levels/world-15-starfall-void.js
// ──────────────────────────────────────────────────────────────────
// World 15 · STARFALL VOID — cosmic theme, meteor weather.
// L1-L3 are the gauntlet finale (rotating arms + magnets + grapples);
// L4-L6 are the Mackenzie showcase (companion / combat / mount).
// ──────────────────────────────────────────────────────────────────

(function () {
  const base = (overrides) => Object.assign({
    bgColors: ['#02011a', '#0a0640'],
    platColors: ['#06031a', '#100732', '#26146a', '#5e34c8', '#d6a8ff'],
    accentColor: '#6a4ada', accentColor2: '#d6a8ff',
    skyStars: true, misty: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'cosmic', weather: 'meteor',
    startX: 60, startY: 380, goalY: 300,
    timePar: 280, timeGold: 180,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  // Mackenzie spawn template — used by L4/L5/L6 showcase levels.
  const mackenzie = (x, y) => ({
    type: 'mackenzie', x, y, hp: 3, maxHp: 3,
    attached: false, riding: false, facingRight: true,
    vx: 0, vy: 0, onGround: false, _frame: 0, _tongue: 0,
    _tail: 0, _attackCd: 0, _invuln: 0, _dead: false,
    _heartCd: 0, _name: 'Mackenzie',
  });

  window.LEVELS_W15 = [
    // L1 NEBULA DRIFT — rotating arms above the void
    base({
      name: 'COSMIC NEBULA DRIFT', width: 2800, goalX: 2700,
      platforms: [
        { x: 0,    y: 450, w: 2800, h: 60, type: 'ground' },
        { x: 260,  y: 380, w: 120, h: 18 },
        { x: 480,  y: 320, w: 80,  h: 16, type: 'rotating', cx: 540,  cy: 320, radius: 80,  speed: 0.020, startAngle: 0,           _id: 'w15l1r1' },
        { x: 720,  y: 280, w: 80,  h: 16, type: 'rotating', cx: 780,  cy: 280, radius: 90,  speed: 0.022, startAngle: Math.PI,     _id: 'w15l1r2' },
        { x: 980,  y: 260, w: 100, h: 18 },
        { x: 1200, y: 280, w: 80,  h: 16, type: 'rotating', cx: 1260, cy: 280, radius: 90,  speed: 0.024, startAngle: Math.PI / 2, _id: 'w15l1r3' },
        { x: 1460, y: 240, w: 80,  h: 16, type: 'rotating', cx: 1520, cy: 240, radius: 100, speed: 0.026, startAngle: 0,           _id: 'w15l1r4' },
        { x: 1740, y: 260, w: 100, h: 18 },
        { x: 1960, y: 280, w: 80,  h: 16, type: 'rotating', cx: 2020, cy: 280, radius: 90,  speed: 0.024, startAngle: Math.PI,     _id: 'w15l1r5' },
        { x: 2220, y: 320, w: 120, h: 18 },
        { x: 2440, y: 280, w: 260, h: 18 },
      ],
      coins: [
        { x: 300,  y: 340 }, { x: 540,  y: 260 }, { x: 1020, y: 220 },
        { x: 1520, y: 180 }, { x: 1780, y: 220 }, { x: 2260, y: 280 },
        { x: 2480, y: 240 },
      ],
      enemies: [
        { x: 1000, y: 258, v: 0, hp: 2, elite: 'false' },
        { x: 2260, y: 318, v: 3, hp: 2, elite: 'false' },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'NEBULA DRIFT',
        lines: ['🪐 ARMS SPIN IN ARCS.', '☄ METEORS CRASH DOWN —', 'WATCH THE SHADOWS.'],
        color: '#d6a8ff' }],
    }),

    // L2 METEOR RUN — meteor weather, magnetic anchors
    base({
      name: 'METEOR COSMIC RUN', width: 3000, goalX: 2900, timePar: 300, timeGold: 190,
      platforms: [
        { x: 0,    y: 450, w: 3000, h: 60, type: 'ground' },
        { x: 260,  y: 380, w: 120, h: 18 },
        { x: 480,  y: 320, w: 32,  h: 32, type: 'magnetic', radius: 140, pull: 0.7 },
        { x: 600,  y: 320, w: 120, h: 18 },
        { x: 820,  y: 280, w: 32,  h: 32, type: 'magnetic', radius: 140, pull: 0.7 },
        { x: 940,  y: 280, w: 120, h: 18 },
        { x: 1160, y: 240, w: 32,  h: 32, type: 'magnetic', radius: 150, pull: 0.75 },
        { x: 1280, y: 240, w: 120, h: 18 },
        { x: 1500, y: 280, w: 120, h: 18 },
        { x: 1720, y: 240, w: 32,  h: 32, type: 'magnetic', radius: 150, pull: 0.8 },
        { x: 1840, y: 240, w: 120, h: 18 },
        { x: 2060, y: 280, w: 120, h: 18 },
        { x: 2280, y: 240, w: 32,  h: 32, type: 'magnetic', radius: 160, pull: 0.8 },
        { x: 2400, y: 240, w: 120, h: 18 },
        { x: 2620, y: 280, w: 280, h: 18 },
      ],
      coins: [
        { x: 300,  y: 340 }, { x: 640,  y: 280 }, { x: 980,  y: 240 },
        { x: 1320, y: 200 }, { x: 1860, y: 200 }, { x: 2440, y: 200 },
        { x: 2660, y: 240 },
      ],
      enemies: [
        { x: 1500, y: 278, v: 0, hp: 2, elite: 'false' },
        { x: 2080, y: 278, v: 3, hp: 2, elite: 'false' },
      ],
      spiritEmbers: [
        { x: 1180, y: 180, collected: false, idx: 0 },
        { x: 2300, y: 180, collected: false, idx: 1 },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'METEOR RUN',
        lines: ['🧲 ASTEROIDS PULL YOU.', '☄ MAGNETS HELP YOU', 'STAY ON THE ARC.'],
        color: '#6a4ada' }],
    }),

    // L3 ASTRAL SUMMIT — grapple ascent finale
    base({
      name: 'ASTRAL COSMIC SUMMIT', width: 3200, goalX: 3100, goalY: 140, timePar: 320, timeGold: 200,
      platforms: [
        { x: 0,    y: 450, w: 3200, h: 60, type: 'ground' },
        { x: 260,  y: 380, w: 120, h: 18 },
        { x: 500,  y: 280, w: 24,  h: 24, type: 'grapplehook' },
        { x: 620,  y: 340, w: 120, h: 18 },
        { x: 860,  y: 240, w: 24,  h: 24, type: 'grapplehook' },
        { x: 980,  y: 300, w: 120, h: 18 },
        { x: 1200, y: 200, w: 24,  h: 24, type: 'grapplehook' },
        { x: 1320, y: 260, w: 120, h: 18 },
        { x: 1500, y: 220, w: 80,  h: 16, type: 'rotating', cx: 1560, cy: 220, radius: 80, speed: 0.022, startAngle: 0, _id: 'w15l3r1' },
        { x: 1740, y: 180, w: 24,  h: 24, type: 'grapplehook' },
        { x: 1860, y: 240, w: 120, h: 18 },
        { x: 2080, y: 200, w: 32,  h: 32, type: 'magnetic', radius: 150, pull: 0.8 },
        { x: 2200, y: 200, w: 120, h: 18 },
        { x: 2420, y: 160, w: 24,  h: 24, type: 'grapplehook' },
        { x: 2540, y: 220, w: 120, h: 18 },
        { x: 2760, y: 140, w: 24,  h: 24, type: 'grapplehook' },
        { x: 2880, y: 200, w: 340, h: 18 },
      ],
      coins: [
        { x: 300,  y: 340 }, { x: 640,  y: 300 }, { x: 1000, y: 260 },
        { x: 1340, y: 220 }, { x: 1880, y: 200 }, { x: 2220, y: 160 },
        { x: 2900, y: 160 },
      ],
      enemies: [
        { x: 1340, y: 258, v: 0, hp: 3, elite: 'false' },
        { x: 2200, y: 198, v: 3, hp: 3, elite: 'false' },
        { x: 2880, y: 198, v: 0, hp: 4, elite: 'true' },
      ],
      trophies: [{ x: 1860, y: 200, collected: false }],
      powerupItems: [{ x: 2540, y: 220, type: 'shield' }],
      spiritEmbers: [
        { x: 1220, y: 120, collected: false, idx: 0 },
        { x: 2440, y: 80,  collected: false, idx: 1 },
        { x: 2780, y: 60,  collected: false, idx: 2 },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'ASTRAL SUMMIT',
        lines: ['THE FINAL ASCENT.', '🪝 HOOK · 🧲 MAGNET · 🪐 ARM —', 'EVERY TOOL, ONE PATH.'],
        color: '#d6a8ff' }],
    }),

    // ── Mackenzie showcase levels ────────────────────────────────────
    // Three levels that teach Mackenzie's three roles: companion who
    // fetches loot, fierce ally who attacks enemies, and mount that
    // lets you cover terrain you can't on foot.

    // L4 MEET MACKENZIE — pickup + fetch + follow. Light enemy
    // presence so the player can learn the basic mechanics safely.
    base({
      name: 'COSMIC MEET MACKENZIE', width: 2800, goalX: 2700, goalY: 300,
      timePar: 240, timeGold: 160,
      startX: 60, startY: 380,
      platforms: [
        { x: 0,    y: 450, w: 2800, h: 60, type: 'ground' },
        // Coin trails scattered around Mackenzie so she demos fetch.
        { x: 360,  y: 380, w: 120, h: 18 },
        { x: 560,  y: 320, w: 120, h: 18 },
        { x: 760,  y: 260, w: 120, h: 18 },
        { x: 1020, y: 320, w: 120, h: 18 },
        { x: 1240, y: 380, w: 140, h: 18 },
        { x: 1480, y: 320, w: 120, h: 18 },
        { x: 1700, y: 260, w: 120, h: 18 },
        { x: 1980, y: 320, w: 140, h: 18 },
        { x: 2240, y: 280, w: 140, h: 18 },
        { x: 2480, y: 340, w: 220, h: 18 },
      ],
      // Mackenzie sits a few platforms in so the player has to walk
      // up to her — that teaches "collide to befriend".
      allies: [mackenzie(340, 410)],
      // Dense coin fields placed slightly off the main path so
      // Mackenzie has to run + jump to grab them.
      coins: [
        { x: 400,  y: 340 }, { x: 440,  y: 340 }, { x: 600,  y: 280 },
        { x: 640,  y: 280 }, { x: 800,  y: 220 }, { x: 840,  y: 220 },
        { x: 1060, y: 280 }, { x: 1280, y: 340 }, { x: 1520, y: 280 },
        { x: 1740, y: 220 }, { x: 2020, y: 280 }, { x: 2280, y: 240 },
        { x: 2520, y: 300 }, { x: 2560, y: 300 }, { x: 2600, y: 300 },
        // High-up coin cluster — only her double jump can reach
        { x: 920,  y: 140 }, { x: 960,  y: 140 }, { x: 1000, y: 140 },
      ],
      powerupItems: [{ x: 1820, y: 220, type: 'shield' }],
      enemies: [
        { x: 1400, y: 408, v: 0, hp: 2, elite: 'false' },
        { x: 2100, y: 408, v: 3, hp: 2, elite: 'false' },
      ],
      signs: [
        { x: 60,  y: 220, w: 320, title: 'MEET MACKENZIE',
          lines: ['🐕 WALK INTO HER', 'TO BEFRIEND HER.', 'SHE WILL FETCH COINS!'],
          color: '#ffaad6' },
        { x: 900, y: 200, w: 280, title: 'UP HIGH',
          lines: ['HIGH COINS', 'NEED HER DOUBLE JUMP'],
          color: '#ffd76a' },
      ],
    }),

    // L5 SHEEPDOG SCRAP — combat showcase. Mackenzie attacks enemies
    // beside the player, demonstrates dodge (70% miss).
    base({
      name: 'COSMIC SHEEPDOG SCRAP', width: 2800, goalX: 2700, goalY: 300,
      timePar: 260, timeGold: 170,
      startX: 60, startY: 380,
      platforms: [
        { x: 0,    y: 450, w: 2800, h: 60, type: 'ground' },
        { x: 300,  y: 360, w: 140, h: 18 },
        { x: 540,  y: 300, w: 140, h: 18 },
        { x: 780,  y: 360, w: 140, h: 18 },
        { x: 1020, y: 300, w: 140, h: 18 },
        { x: 1300, y: 360, w: 180, h: 18 },
        { x: 1580, y: 300, w: 140, h: 18 },
        { x: 1820, y: 360, w: 140, h: 18 },
        { x: 2060, y: 300, w: 140, h: 18 },
        { x: 2320, y: 360, w: 180, h: 18 },
      ],
      allies: [mackenzie(180, 410)],
      // Enemy gauntlet — mix of patrol / charger / silencer so she
      // has variety to bark at.
      enemies: [
        { x: 500,  y: 408, v: 0, hp: 4, elite: 'false' },
        { x: 900,  y: 408, v: 1, hp: 4, elite: 'false' },
        { x: 1250, y: 408, v: 3, hp: 5, elite: 'false' },
        { x: 1650, y: 408, v: 4, hp: 5, elite: 'false' },
        { x: 2000, y: 408, v: 7, hp: 5, elite: 'false' },
        { x: 2400, y: 408, v: 0, hp: 6, elite: 'true' },
      ],
      coins: [
        { x: 340,  y: 320 }, { x: 580,  y: 260 }, { x: 820,  y: 320 },
        { x: 1060, y: 260 }, { x: 1340, y: 320 }, { x: 1620, y: 260 },
        { x: 1860, y: 320 }, { x: 2100, y: 260 }, { x: 2360, y: 320 },
      ],
      powerupItems: [
        { x: 1380, y: 320, type: 'heal' },
        { x: 2200, y: 260, type: 'shield' },
      ],
      signs: [{ x: 60, y: 220, w: 320, title: 'SHEEPDOG SCRAP',
        lines: ['SHE BARKS AT FOES', 'NEXT TO YOU.', '70% DODGE RATE!'],
        color: '#ffd76a' }],
    }),

    // L6 RIDE THE COMET — ride showcase. Big gaps require the
    // mount's triple jump + Highland Charge dash to clear.
    base({
      name: 'COSMIC RIDE THE COMET', width: 3400, goalX: 3300, goalY: 280,
      timePar: 320, timeGold: 210,
      startX: 60, startY: 380,
      platforms: [
        // Starting island — player + Mackenzie spawn together.
        { x: 0,    y: 450, w: 460, h: 60, type: 'ground' },
        // Wide gaps that need the mount's bigger jump.
        { x: 620,  y: 450, w: 200, h: 60, type: 'ground' },
        { x: 960,  y: 450, w: 200, h: 60, type: 'ground' },
        { x: 1300, y: 450, w: 200, h: 60, type: 'ground' },
        // Long stretch — Highland Charge while riding clears it.
        { x: 1620, y: 450, w: 600, h: 60, type: 'ground' },
        // Vertical climb section — triple jump shines here.
        { x: 1820, y: 380, w: 120, h: 18 },
        { x: 2020, y: 320, w: 120, h: 18 },
        { x: 2200, y: 260, w: 120, h: 18 },
        { x: 2020, y: 200, w: 120, h: 18 },
        { x: 1820, y: 140, w: 120, h: 18 },
        // Top corridor — high-altitude cruise
        { x: 1620, y: 120, w: 300, h: 18 },
        { x: 1920, y: 120, w: 300, h: 18 },
        // Big final gap that ONLY the mount can cross
        { x: 2380, y: 450, w: 200, h: 60, type: 'ground' },
        { x: 2800, y: 450, w: 600, h: 60, type: 'ground' },
      ],
      allies: [mackenzie(220, 410)],
      coins: [
        // Reward path for staying on her back
        { x: 500,  y: 410 }, { x: 700,  y: 410 }, { x: 1040, y: 410 },
        { x: 1380, y: 410 }, { x: 1700, y: 410 }, { x: 1860, y: 340 },
        { x: 2060, y: 280 }, { x: 2240, y: 220 }, { x: 2060, y: 160 },
        { x: 1860, y: 100 }, { x: 1660, y: 80  }, { x: 1960, y: 80  },
        { x: 2420, y: 410 }, { x: 2860, y: 410 }, { x: 3100, y: 410 },
      ],
      enemies: [
        // Strung along the top path so riders sprint past or smash through
        { x: 1700, y: 78,  v: 0, hp: 3, elite: 'false' },
        { x: 1960, y: 78,  v: 1, hp: 3, elite: 'false' },
        // Bottom guards
        { x: 1900, y: 408, v: 3, hp: 3, elite: 'false' },
        { x: 2900, y: 408, v: 0, hp: 4, elite: 'true' },
      ],
      powerupItems: [{ x: 1660, y: 80, type: 'shield' }],
      spiritEmbers: [
        { x: 720,  y: 410, collected: false, idx: 0 },  // wide-gap reward
        { x: 1880, y: 90,  collected: false, idx: 1 },  // top of climb
        { x: 3200, y: 410, collected: false, idx: 2 },  // final gap reward
      ],
      signs: [
        { x: 60,   y: 220, w: 340, title: 'RIDE THE COMET',
          lines: ['🐕 PRESS F NEAR HER', 'TO RIDE. TRIPLE JUMP', '+ HIGHLAND CHARGE!'],
          color: '#d6a8ff' },
        { x: 1640, y: 60,  w: 280, title: 'HIGH ROAD',
          lines: ['DASH ALONG THE TOP', 'FOR EMBER #2'],
          color: '#ffd76a' },
      ],
    }),
  ];
})();
