// levels/world-37-the-hollowing.js
window.LEVELS_W37 = [
  // ============ L1: INTRO — teach SILENCER, gentle ascent ============
  {
    name: "WHISPERS IN THE FOG",
    width: 2400,
    goalX: 2280,
    goalY: 340,
    startX: 60, startY: 380,
    bgColors: ["#1a1426", "#0d0a14"],
    platColors: ["#2a2438", "#3a3450", "#4f4670", "#6a5c95", "#9a7ad0"],
    accentColor: "#9a7ad0",
    accentColor2: "#c8b0f0",
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: "shadow", weather: "fog",
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0, y: 450, w: 2400, h: 60, type: "ground" },
      { x: 320, y: 380, w: 160, h: 16 },
      { x: 560, y: 320, w: 150, h: 16 },
      { x: 820, y: 360, w: 180, h: 16 },
      { x: 1080, y: 300, w: 150, h: 16 },
      { x: 1300, y: 250, w: 140, h: 16 },
      { x: 1520, y: 320, w: 160, h: 16 },
      { x: 1780, y: 360, w: 170, h: 16 },
      { x: 2020, y: 300, w: 150, h: 16 },
      { x: 2220, y: 410, w: 180, h: 18 }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 1000, y: 426, w: 80, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 380, y: 350 }, { x: 620, y: 290 }, { x: 880, y: 330 },
      { x: 1140, y: 270 }, { x: 1360, y: 220 }, { x: 1580, y: 290 },
      { x: 1840, y: 330 }, { x: 2080, y: 270 },
      { x: 460, y: 410 }, { x: 1300, y: 180 }
    ],
    qblocks: [{ x: 720, y: 280 }],
    cblocks: [],
    trophies: [],
    powerupItems: [
      { x: 1080, y: 260, type: "heal" }
    ],
    enemies: [
      { x: 850, y: 318, v: 10, hp: 3, elite: "false" },
      { x: 1540, y: 278, v: 0, hp: 2, elite: "false" },
      { x: 1810, y: 318, v: 10, hp: 3, elite: "false" }
    ],
    checkpoints: [],
    spiritEmbers: [
      { x: 1360, y: 200, collected: false, idx: 0 }
    ],
    marsBarPieces: [],
    signs: [
      { x: 200, y: 380, w: 180, title: "SILENCERS", lines: ["The hollow ones mute", "your bagpipes near.", "Strike fast, climb on."], color: "#9a7ad0" }
    ],
    highlights: []
  },

  // ============ L2: DEVELOP — teleporters, more vertical ============
  {
    name: "THE FADING STAIR",
    width: 2600,
    goalX: 2480,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#181228", "#0a0712"],
    platColors: ["#28223a", "#383052", "#504574", "#6e5e9c", "#a888e0"],
    accentColor: "#9a7ad0",
    accentColor2: "#c8b0f0",
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: "shadow", weather: "fog",
    timePar: 216, timeGold: 144,
    platforms: [
      { x: 0, y: 450, w: 700, h: 60, type: "ground" },
      { x: 760, y: 410, w: 140, h: 16, type: "oneway" },
      { x: 960, y: 360, w: 150, h: 16 },
      { x: 1180, y: 300, w: 140, h: 16 },
      { x: 1100, y: 220, w: 130, h: 16 },
      { x: 1340, y: 250, w: 150, h: 16 },
      { x: 1560, y: 320, w: 160, h: 16 },
      { x: 1560, y: 200, w: 140, h: 16, type: "oneway" },
      { x: 1820, y: 360, w: 160, h: 16 },
      { x: 2040, y: 300, w: 140, h: 16 },
      { x: 2240, y: 240, w: 150, h: 16 },
      { x: 2420, y: 410, w: 180, h: 18 }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      { x: 1380, y: 400, x2: 1380, y2: 160, w: 90, h: 16, speed: 1.4 }
    ],
    switches: [],
    spikes: [
      { x: 820, y: 426, w: 100, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 400, y: 410 }, { x: 1020, y: 330 }, { x: 1240, y: 270 },
      { x: 1160, y: 190 }, { x: 1410, y: 220 }, { x: 1630, y: 290 },
      { x: 1880, y: 330 }, { x: 2100, y: 270 }, { x: 2300, y: 210 },
      { x: 1620, y: 170 }
    ],
    qblocks: [{ x: 960, y: 320 }],
    cblocks: [{ x: 1180, y: 260, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 1820, y: 320, type: "rapid" }
    ],
    enemies: [
      { x: 1000, y: 318, v: 13, hp: 3, elite: "false" },
      { x: 1400, y: 208, v: 10, hp: 3, elite: "false" },
      { x: 1600, y: 278, v: 13, hp: 4, elite: "false" },
      { x: 2080, y: 258, v: 0, hp: 3, elite: "false" }
    ],
    checkpoints: [],
    spiritEmbers: [
      { x: 1160, y: 170, collected: false, idx: 0 }
    ],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ============ L3: TWIST — twins + teleporters combine, wide+vertical ============
  {
    name: "MIRROR OF THE LOST",
    width: 2900,
    goalX: 2780,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#15101f", "#080610"],
    platColors: ["#262036", "#36304e", "#4c4270", "#685a98", "#a684de"],
    accentColor: "#9a7ad0",
    accentColor2: "#c8b0f0",
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: "shadow", weather: "fog",
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0, y: 450, w: 560, h: 60, type: "ground" },
      { x: 640, y: 390, w: 150, h: 16 },
      { x: 880, y: 340, w: 140, h: 16 },
      { x: 760, y: 260, w: 130, h: 16, type: "oneway" },
      { x: 1080, y: 300, w: 150, h: 16 },
      { x: 1300, y: 350, w: 160, h: 16 },
      { x: 1540, y: 290, w: 140, h: 16 },
      { x: 1420, y: 200, w: 130, h: 16 },
      { x: 1740, y: 240, w: 150, h: 16 },
      { x: 1980, y: 320, w: 160, h: 16 },
      { x: 2200, y: 270, w: 140, h: 16 },
      { x: 2420, y: 220, w: 150, h: 16 },
      { x: 2620, y: 300, w: 150, h: 16 },
      { x: 2720, y: 410, w: 180, h: 18 }
    ],
    icePlats: [],
    bounces: [
      { x: 1180, y: 434, w: 70, h: 16, rotation: 0 }
    ],
    movingPlats: [
      { x: 2240, y: 400, x2: 2240, y2: 180, w: 90, h: 16, speed: 1.6 }
    ],
    switches: [],
    spikes: [
      { x: 1460, y: 426, w: 80, h: 24, rotation: 0, spikeType: "static" },
      { x: 1980, y: 426, w: 100, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 700, y: 360 }, { x: 940, y: 310 }, { x: 1140, y: 270 },
      { x: 1360, y: 320 }, { x: 1600, y: 260 }, { x: 1480, y: 170 },
      { x: 1800, y: 210 }, { x: 2040, y: 290 }, { x: 2260, y: 240 },
      { x: 2480, y: 190 }, { x: 820, y: 230 }, { x: 2680, y: 270 }
    ],
    qblocks: [{ x: 1080, y: 260 }],
    cblocks: [{ x: 1740, y: 200, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 1300, y: 310, type: "invincible" },
      { x: 2420, y: 180, type: "extrajump" }
    ],
    enemies: [
      { x: 900, y: 298, v: 11, hp: 3, elite: "false" },
      { x: 1120, y: 258, v: 11, hp: 3, elite: "false" },
      { x: 1560, y: 248, v: 13, hp: 4, elite: "false" },
      { x: 1780, y: 198, v: 10, hp: 4, elite: "false" },
      { x: 2020, y: 278, v: 11, hp: 4, elite: "false" },
      { x: 2640, y: 258, v: 13, hp: 4, elite: "false" }
    ],
    checkpoints: [
      { x: 1300, y: 310, activated: false }
    ],
    spiritEmbers: [
      { x: 820, y: 200, collected: false, idx: 0 }
    ],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ============ L4: CHALLENGE — dense gauntlet, all three foes ============
  {
    name: "THE LIMINAL VOID",
    width: 3100,
    goalX: 2980,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#120d1c", "#06040c"],
    platColors: ["#221c32", "#322a4a", "#48406c", "#645694", "#a482dc"],
    accentColor: "#9a7ad0",
    accentColor2: "#d0b8f8",
    skyStars: true, height: 560, voidFloor: true, voidY: 470,
    theme: "shadow", weather: "fog",
    timePar: 258, timeGold: 172,
    platforms: [
      { x: 0, y: 450, w: 380, h: 60, type: "ground" },
      { x: 460, y: 400, w: 130, h: 16 },
      { x: 660, y: 340, w: 140, h: 16 },
      { x: 880, y: 290, w: 130, h: 16, type: "oneway" },
      { x: 1080, y: 350, w: 140, h: 16 },
      { x: 1300, y: 300, w: 130, h: 16 },
      { x: 1180, y: 220, w: 120, h: 16 },
      { x: 1520, y: 260, w: 140, h: 16 },
      { x: 1740, y: 320, w: 140, h: 16 },
      { x: 1960, y: 270, w: 130, h: 16 },
      { x: 2180, y: 210, w: 130, h: 16 },
      { x: 2400, y: 280, w: 140, h: 16 },
      { x: 2620, y: 230, w: 130, h: 16 },
      { x: 2820, y: 310, w: 140, h: 16 },
      { x: 2920, y: 410, w: 180, h: 18 }
    ],
    icePlats: [],
    bounces: [
      { x: 1620, y: 434, w: 70, h: 16, rotation: 0 }
    ],
    movingPlats: [
      { x: 580, y: 410, x2: 760, y2: 410, w: 90, h: 16, speed: 1.5 },
      { x: 2280, y: 380, x2: 2280, y2: 160, w: 90, h: 16, speed: 1.7 }
    ],
    switches: [],
    spikes: [
      { x: 1300, y: 276, w: 80, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 520, y: 370 }, { x: 720, y: 310 }, { x: 940, y: 260 },
      { x: 1140, y: 320 }, { x: 1360, y: 270 }, { x: 1240, y: 190 },
      { x: 1580, y: 230 }, { x: 1800, y: 290 }, { x: 2020, y: 240 },
      { x: 2240, y: 180 }, { x: 2460, y: 250 }, { x: 2680, y: 200 },
      { x: 2880, y: 280 }, { x: 1620, y: 380 }
    ],
    qblocks: [{ x: 660, y: 300 }],
    cblocks: [{ x: 1520, y: 220, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 880, y: 250, type: "shield" },
      { x: 1960, y: 230, type: "drum" }
    ],
    enemies: [
      { x: 680, y: 298, v: 10, hp: 4, elite: "false" },
      { x: 1100, y: 308, v: 11, hp: 4, elite: "false" },
      { x: 1320, y: 258, v: 13, hp: 4, elite: "false" },
      { x: 1540, y: 218, v: 11, hp: 4, elite: "false" },
      { x: 1760, y: 278, v: 13, hp: 5, elite: "false" },
      { x: 2200, y: 168, v: 10, hp: 5, elite: "false" },
      { x: 2420, y: 238, v: 11, hp: 4, elite: "false" },
      { x: 2840, y: 268, v: 13, hp: 5, elite: "false" }
    ],
    checkpoints: [
      { x: 1300, y: 290, activated: false }
    ],
    spiritEmbers: [
      { x: 1240, y: 160, collected: false, idx: 0 }
    ],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ============ L5: FINALE — vertical climb + boss summoner set-piece ============
  {
    name: "ASCENT OF THE HOLLOW KING",
    width: 3000,
    goalX: 2880,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#0e0a18", "#040308"],
    platColors: ["#1e1830", "#2e2648", "#443a68", "#605290", "#b090f0"],
    accentColor: "#9a7ad0",
    accentColor2: "#e0c8ff",
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: "shadow", weather: "fog",
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0, y: 450, w: 500, h: 60, type: "ground" },
      { x: 580, y: 390, w: 140, h: 16 },
      { x: 780, y: 330, w: 130, h: 16 },
      { x: 980, y: 280, w: 130, h: 16 },
      { x: 1180, y: 230, w: 130, h: 16 },
      { x: 1380, y: 290, w: 140, h: 16 },
      { x: 1600, y: 240, w: 130, h: 16 },
      { x: 1800, y: 300, w: 140, h: 16 },
      { x: 2020, y: 250, w: 130, h: 16 },
      { x: 2240, y: 200, w: 140, h: 16 },
      { x: 2460, y: 360, w: 300, h: 18 },
      { x: 2820, y: 410, w: 180, h: 18 }
    ],
    icePlats: [],
    bounces: [
      { x: 880, y: 434, w: 70, h: 16, rotation: 0 }
    ],
    movingPlats: [
      { x: 1480, y: 400, x2: 1480, y2: 180, w: 90, h: 16, speed: 1.6 }
    ],
    switches: [],
    spikes: [
      { x: 1080, y: 426, w: 90, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 640, y: 360 }, { x: 840, y: 300 }, { x: 1040, y: 250 },
      { x: 1240, y: 200 }, { x: 1440, y: 260 }, { x: 1660, y: 210 },
      { x: 1860, y: 270 }, { x: 2080, y: 220 }, { x: 2300, y: 170 },
      { x: 2560, y: 320 }, { x: 2660, y: 320 }, { x: 1240, y: 160 }
    ],
    qblocks: [{ x: 980, y: 240 }],
    cblocks: [{ x: 1600, y: 200, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 780, y: 290, type: "heal" },
      { x: 2240, y: 160, type: "invincible" },
      { x: 2500, y: 320, type: "rapid" }
    ],
    enemies: [
      { x: 800, y: 288, v: 10, hp: 4, elite: "false" },
      { x: 1000, y: 238, v: 11, hp: 4, elite: "false" },
      { x: 1400, y: 248, v: 13, hp: 5, elite: "false" },
      { x: 1820, y: 258, v: 11, hp: 5, elite: "false" },
      { x: 2260, y: 158, v: 13, hp: 5, elite: "false" },
      { x: 2580, y: 296, v: 98, hp: 42, w: 64, h: 64, elite: "false" }
    ],
    checkpoints: [
      { x: 1380, y: 280, activated: false }
    ],
    spiritEmbers: [
      { x: 1240, y: 130, collected: false, idx: 0 }
    ],
    marsBarPieces: [],
    signs: [],
    highlights: []
  }
];
