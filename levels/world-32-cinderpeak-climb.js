// levels/world-32-cinderpeak-climb.js
window.LEVELS_W32 = [
  // ============================================================
  // L1 — EMBER FOOTHILLS (intro: teach the climb, gentle gaps)
  // ============================================================
  {
    name: 'EMBER FOOTHILLS',
    width: 2400,
    goalX: 2280,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#2a0d0a', '#5a1f12'],
    platColors: ['#3a1a12', '#6b2c18', '#94401f', '#c25a2a', '#ff7a3a'],
    accentColor: '#ffae42',
    accentColor2: '#ff4d2e',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'volcanic',
    weather: 'lightning',
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0, y: 450, w: 2400, h: 60, type: 'ground' },
      { x: 300, y: 380, w: 160, h: 16 },
      { x: 540, y: 320, w: 150, h: 16 },
      { x: 780, y: 380, w: 140, h: 16 },
      { x: 1000, y: 330, w: 150, h: 16 },
      { x: 1240, y: 280, w: 150, h: 16 },
      { x: 1480, y: 330, w: 150, h: 16 },
      { x: 1700, y: 280, w: 140, h: 16 },
      { x: 1920, y: 350, w: 150, h: 16 },
      { x: 2120, y: 410, w: 200, h: 16, type: 'oneway' },
      { x: 2200, y: 410, w: 200, h: 40 }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 900, y: 426, w: 60, h: 24, rotation: 0, spikeType: 'static' }
    ],
    coins: [
      { x: 320, y: 350 }, { x: 380, y: 350 }, { x: 560, y: 290 },
      { x: 620, y: 290 }, { x: 800, y: 350 }, { x: 1020, y: 300 },
      { x: 1260, y: 250 }, { x: 1500, y: 300 }, { x: 1720, y: 250 },
      { x: 1940, y: 320 }, { x: 1240, y: 180 }, { x: 2180, y: 380 }
    ],
    qblocks: [{ x: 540, y: 250 }],
    cblocks: [],
    trophies: [],
    powerupItems: [{ x: 1000, y: 290, type: 'heal' }],
    enemies: [
      { x: 700, y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1480, y: 288, v: 1, hp: 2, elite: 'false' },
      { x: 1500, y: 408, v: 0, hp: 2, elite: 'false' }
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 1240, y: 180, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 120, y: 380, w: 200, title: 'THE ASCENT BEGINS', lines: ['Jump, then jump again', 'in mid-air to DOUBLE JUMP.', 'Climb the peak. Always up.'], color: '#ff7a3a' }
    ],
    highlights: []
  },

  // ============================================================
  // L2 — CHARGE GAP RIDGE (develop: dash gaps + breakshot rock)
  // ============================================================
  {
    name: 'CHARGE GAP RIDGE',
    width: 2700,
    goalX: 2580,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#2d0e08', '#6b2410'],
    platColors: ['#3a1a12', '#6b2c18', '#94401f', '#c25a2a', '#ff7a3a'],
    accentColor: '#ffae42',
    accentColor2: '#ff4d2e',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'volcanic',
    weather: 'lightning',
    timePar: 225, timeGold: 150,
    platforms: [
      { x: 0, y: 450, w: 700, h: 60, type: 'ground' },
      { x: 280, y: 370, w: 140, h: 16 },
      { x: 500, y: 310, w: 140, h: 16 },
      // dash gap to a ridge
      { x: 760, y: 360, w: 200, h: 16 },
      { x: 1040, y: 360, w: 120, h: 16 },
      { x: 1240, y: 300, w: 140, h: 16 },
      { x: 1240, y: 220, w: 100, h: 16, type: 'breakshot', _id: 'b1' },
      { x: 1460, y: 250, w: 140, h: 16 },
      { x: 1680, y: 300, w: 140, h: 16 },
      { x: 1900, y: 250, w: 130, h: 16 },
      { x: 2120, y: 300, w: 130, h: 16 },
      { x: 2340, y: 350, w: 140, h: 16 },
      { x: 2500, y: 410, w: 200, h: 40 }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 700, y: 426, w: 60, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1160, y: 426, w: 70, h: 24, rotation: 0, spikeType: 'static' }
    ],
    coins: [
      { x: 300, y: 340 }, { x: 520, y: 280 }, { x: 800, y: 330 },
      { x: 860, y: 330 }, { x: 1060, y: 330 }, { x: 1260, y: 270 },
      { x: 1280, y: 180 }, { x: 1480, y: 220 }, { x: 1700, y: 270 },
      { x: 1920, y: 220 }, { x: 2140, y: 270 }, { x: 2360, y: 320 },
      { x: 980, y: 300 }
    ],
    qblocks: [{ x: 760, y: 300 }],
    cblocks: [{ x: 1040, y: 290, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1460, y: 210, type: 'rapid' }],
    enemies: [
      { x: 400, y: 408, v: 1, hp: 2, elite: 'false' },
      { x: 780, y: 318, v: 0, hp: 3, elite: 'false' },
      { x: 1680, y: 258, v: 3, hp: 3, elite: 'false' },
      { x: 2120, y: 258, v: 1, hp: 3, elite: 'false' }
    ],
    checkpoints: [{ x: 1040, y: 320, activated: false }],
    spiritEmbers: [{ x: 1280, y: 180, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ============================================================
  // L3 — MOLTEN SPIRES (twist: moving plats + bounce + rising)
  // ============================================================
  {
    name: 'MOLTEN SPIRES',
    width: 2900,
    goalX: 2780,
    goalY: 330,
    startX: 60, startY: 380,
    bgColors: ['#330f08', '#7a2810'],
    platColors: ['#3a1a12', '#6b2c18', '#94401f', '#c25a2a', '#ff7a3a'],
    accentColor: '#ffae42',
    accentColor2: '#ff4d2e',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'volcanic',
    weather: 'lightning',
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0, y: 450, w: 560, h: 60, type: 'ground' },
      { x: 300, y: 380, w: 140, h: 16 },
      { x: 560, y: 330, w: 130, h: 16 },
      { x: 820, y: 360, w: 120, h: 16, type: 'crumble', _id: 'c1' },
      { x: 1020, y: 310, w: 120, h: 16, type: 'crumble', _id: 'c2' },
      { x: 1380, y: 280, w: 140, h: 16 },
      { x: 1600, y: 230, w: 130, h: 16 },
      { x: 1820, y: 300, w: 120, h: 16 },
      { x: 2080, y: 250, w: 130, h: 16 },
      { x: 2300, y: 300, w: 130, h: 16 },
      { x: 2520, y: 350, w: 130, h: 16 },
      { x: 2700, y: 420, w: 200, h: 40 }
    ],
    icePlats: [],
    bounces: [
      { x: 1180, y: 420, w: 90, h: 24, rotation: 0 }
    ],
    movingPlats: [
      { x: 700, y: 300, x2: 700, y2: 200, w: 120, h: 16, speed: 1.4 },
      { x: 2080, y: 380, x2: 2080, y2: 250, w: 120, h: 16, speed: 1.5 }
    ],
    switches: [],
    spikes: [
      { x: 560, y: 426, w: 80, h: 24, rotation: 0, spikeType: 'static' },
      { x: 920, y: 426, w: 80, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1480, y: 426, w: 80, h: 24, rotation: 0, spikeType: 'static' }
    ],
    coins: [
      { x: 320, y: 350 }, { x: 580, y: 300 }, { x: 720, y: 250 },
      { x: 1020, y: 280 }, { x: 1180, y: 360 }, { x: 1400, y: 250 },
      { x: 1620, y: 200 }, { x: 1840, y: 270 }, { x: 2100, y: 220 },
      { x: 2320, y: 270 }, { x: 2540, y: 320 }, { x: 1600, y: 130 },
      { x: 840, y: 330 }
    ],
    qblocks: [{ x: 1380, y: 220 }],
    cblocks: [],
    trophies: [],
    powerupItems: [{ x: 1600, y: 190, type: 'big' }],
    enemies: [
      { x: 350, y: 408, v: 1, hp: 3, elite: 'false' },
      { x: 1380, y: 238, v: 4, hp: 3, elite: 'false' },
      { x: 1820, y: 258, v: 3, hp: 3, elite: 'false' },
      { x: 2300, y: 258, v: 5, hp: 4, elite: 'false' }
    ],
    checkpoints: [{ x: 1180, y: 390, activated: false }],
    spiritEmbers: [{ x: 1600, y: 130, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ============================================================
  // L4 — ERUPTION GAUNTLET (challenge: combine everything, tall)
  // ============================================================
  {
    name: 'ERUPTION GAUNTLET',
    width: 3100,
    goalX: 2980,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#3a1006', '#8a2e0e'],
    platColors: ['#3a1a12', '#6b2c18', '#94401f', '#c25a2a', '#ff7a3a'],
    accentColor: '#ffae42',
    accentColor2: '#ff4d2e',
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: 'volcanic',
    weather: 'lightning',
    timePar: 258, timeGold: 172,
    platforms: [
      { x: 0, y: 450, w: 480, h: 60, type: 'ground' },
      { x: 280, y: 370, w: 130, h: 16 },
      { x: 500, y: 320, w: 120, h: 16, type: 'fallaway', _id: 'f1' },
      { x: 700, y: 290, w: 120, h: 16, type: 'fallaway', _id: 'f2' },
      { x: 920, y: 320, w: 120, h: 16 },
      { x: 1100, y: 250, w: 110, h: 16 },
      { x: 1100, y: 170, w: 100, h: 16, type: 'breakshot', _id: 'b1' },
      { x: 1340, y: 280, w: 130, h: 16 },
      { x: 1560, y: 230, w: 120, h: 16, type: 'crumble', _id: 'c1' },
      { x: 1780, y: 290, w: 120, h: 16 },
      { x: 2000, y: 240, w: 120, h: 16 },
      { x: 2240, y: 300, w: 120, h: 16 },
      { x: 2460, y: 250, w: 120, h: 16 },
      { x: 2680, y: 300, w: 120, h: 16 },
      { x: 2900, y: 410, w: 200, h: 40 }
    ],
    icePlats: [],
    bounces: [
      { x: 1230, y: 420, w: 90, h: 24, rotation: 0 }
    ],
    movingPlats: [
      { x: 1340, y: 360, x2: 1560, y2: 360, w: 110, h: 16, speed: 1.6 },
      { x: 2240, y: 380, x2: 2240, y2: 250, w: 110, h: 16, speed: 1.7 }
    ],
    switches: [],
    spikes: [
      { x: 480, y: 426, w: 90, h: 24, rotation: 0, spikeType: 'static' },
      { x: 820, y: 426, w: 90, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1440, y: 426, w: 90, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1900, y: 426, w: 90, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2560, y: 426, w: 90, h: 24, rotation: 0, spikeType: 'static' }
    ],
    coins: [
      { x: 300, y: 340 }, { x: 520, y: 290 }, { x: 720, y: 260 },
      { x: 940, y: 290 }, { x: 1120, y: 220 }, { x: 1130, y: 130 },
      { x: 1360, y: 250 }, { x: 1580, y: 200 }, { x: 1800, y: 260 },
      { x: 2020, y: 210 }, { x: 2260, y: 270 }, { x: 2480, y: 220 },
      { x: 2700, y: 270 }, { x: 1450, y: 330 }
    ],
    qblocks: [{ x: 920, y: 260 }],
    cblocks: [{ x: 1340, y: 220, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 1100, y: 210, type: 'shield' },
      { x: 2000, y: 200, type: 'heal' }
    ],
    enemies: [
      { x: 300, y: 408, v: 1, hp: 3, elite: 'false' },
      { x: 920, y: 278, v: 3, hp: 3, elite: 'false' },
      { x: 1780, y: 248, v: 4, hp: 4, elite: 'false' },
      { x: 2000, y: 198, v: 5, hp: 4, elite: 'false' },
      { x: 2460, y: 208, v: 7, hp: 5, elite: 'false' },
      { x: 2680, y: 258, v: 3, hp: 4, elite: 'false' }
    ],
    checkpoints: [
      { x: 920, y: 350, activated: false },
      { x: 2000, y: 270, activated: false }
    ],
    spiritEmbers: [{ x: 1130, y: 130, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ============================================================
  // L5 — CINDERPEAK SUMMIT (finale: vertical set-piece + boss)
  // ============================================================
  {
    name: 'CINDERPEAK SUMMIT',
    width: 3000,
    goalX: 2880,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#420f04', '#a8350c'],
    platColors: ['#3a1a12', '#6b2c18', '#94401f', '#c25a2a', '#ff7a3a'],
    accentColor: '#ffd24a',
    accentColor2: '#ff3b1e',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'volcanic',
    weather: 'lightning',
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0, y: 450, w: 460, h: 60, type: 'ground' },
      { x: 260, y: 380, w: 120, h: 16 },
      { x: 460, y: 320, w: 120, h: 16, type: 'crumble', _id: 'c1' },
      { x: 660, y: 270, w: 120, h: 16 },
      { x: 660, y: 190, w: 100, h: 16, type: 'breakshot', _id: 'b1' },
      { x: 900, y: 300, w: 120, h: 16 },
      { x: 1140, y: 250, w: 120, h: 16 },
      { x: 1380, y: 300, w: 120, h: 16 },
      { x: 1600, y: 240, w: 120, h: 16 },
      { x: 1820, y: 300, w: 120, h: 16 },
      // boss arena ledge
      { x: 2040, y: 350, w: 360, h: 16 },
      { x: 2500, y: 300, w: 120, h: 16 },
      { x: 2700, y: 250, w: 120, h: 16 },
      { x: 2820, y: 410, w: 180, h: 40 }
    ],
    icePlats: [],
    bounces: [
      { x: 1020, y: 420, w: 90, h: 24, rotation: 0 }
    ],
    movingPlats: [
      { x: 1140, y: 380, x2: 1140, y2: 250, w: 110, h: 16, speed: 1.8 },
      { x: 1600, y: 380, x2: 1600, y2: 240, w: 110, h: 16, speed: 1.8 }
    ],
    switches: [],
    spikes: [
      { x: 460, y: 426, w: 90, h: 24, rotation: 0, spikeType: 'static' },
      { x: 900, y: 426, w: 90, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1380, y: 426, w: 100, h: 24, rotation: 0, spikeType: 'static' }
    ],
    coins: [
      { x: 280, y: 350 }, { x: 480, y: 290 }, { x: 680, y: 240 },
      { x: 690, y: 150 }, { x: 920, y: 270 }, { x: 1160, y: 220 },
      { x: 1400, y: 270 }, { x: 1620, y: 210 }, { x: 1840, y: 270 },
      { x: 2200, y: 320 }, { x: 2520, y: 270 }, { x: 2720, y: 220 },
      { x: 1020, y: 360 }
    ],
    qblocks: [{ x: 1820, y: 240 }],
    cblocks: [{ x: 660, y: 230, hits: 3 }],
    trophies: [{ x: 2880, y: 360, collected: false }],
    powerupItems: [
      { x: 1140, y: 210, type: 'invincible' },
      { x: 2060, y: 310, type: 'heal' }
    ],
    enemies: [
      { x: 260, y: 338, v: 1, hp: 3, elite: 'false' },
      { x: 900, y: 258, v: 3, hp: 4, elite: 'false' },
      { x: 1380, y: 258, v: 4, hp: 4, elite: 'false' },
      { x: 1820, y: 258, v: 5, hp: 5, elite: 'false' },
      { x: 2200, y: 306, v: 99, hp: 42, elite: 'false', w: 64, h: 64 }
    ],
    checkpoints: [
      { x: 900, y: 270, activated: false },
      { x: 2060, y: 320, activated: false }
    ],
    spiritEmbers: [{ x: 690, y: 150, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  }
];
