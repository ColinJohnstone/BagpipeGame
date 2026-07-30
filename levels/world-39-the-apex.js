// levels/world-39-the-apex.js
window.LEVELS_W39 = [
  // ============================================================
  // L1 — INTRO: gentle climb, teach the ascent (oneway + bounce)
  // ============================================================
  {
    name: "GATES OF THE CITADEL",
    width: 2400,
    goalX: 2280,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#1a1530", "#3a3060"],
    platColors: ["#2a2440", "#46406a", "#6a6094", "#9a8fc4", "#cdbff0"],
    accentColor: "#ffe27a",
    accentColor2: "#8fd3ff",
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: "citadel", weather: "storm",
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0, y: 450, w: 2400, h: 60, type: "ground" },
      { x: 360, y: 400, w: 180, h: 16 },
      { x: 620, y: 350, w: 160, h: 16 },
      { x: 860, y: 320, w: 140, h: 16, type: "oneway" },
      { x: 1080, y: 360, w: 160, h: 16 },
      { x: 1320, y: 320, w: 140, h: 16, type: "oneway" },
      { x: 1560, y: 290, w: 160, h: 16 },
      { x: 1820, y: 330, w: 180, h: 16 },
      { x: 2080, y: 380, w: 160, h: 16 },
      { x: 2200, y: 410, w: 200, h: 40 }
    ],
    icePlats: [],
    bounces: [{ x: 480, y: 420, w: 80, h: 24, rotation: 0 }],
    movingPlats: [],
    switches: [],
    spikes: [],
    coins: [
      { x: 420, y: 370 }, { x: 690, y: 320 }, { x: 920, y: 290 },
      { x: 1150, y: 330 }, { x: 1390, y: 290 }, { x: 1630, y: 260 },
      { x: 1890, y: 300 }, { x: 2140, y: 350 }, { x: 510, y: 360 },
      { x: 1560, y: 230 }
    ],
    qblocks: [{ x: 1080, y: 280 }],
    cblocks: [],
    trophies: [],
    powerupItems: [{ x: 1560, y: 250, type: "heal" }],
    enemies: [
      { x: 700, y: 408, v: 0, hp: 2, elite: "false" },
      { x: 1140, y: 318, v: 1, hp: 2, elite: "false" },
      { x: 1880, y: 288, v: 0, hp: 2, elite: "false" }
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 880, y: 280, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 120, y: 390, w: 200, title: "THE ASCENT BEYOND", lines: ["The citadel rises above", "the storm. Climb upward.", "DOUBLE-JUMP and use", "bounce pads to rise."], color: "#ffe27a" }],
    highlights: []
  },

  // ============================================================
  // L2 — DEVELOP: moving plats + conveyors carry you up
  // ============================================================
  {
    name: "STORMWIND TERRACES",
    width: 2700,
    goalX: 2580,
    goalY: 300,
    startX: 60, startY: 380,
    bgColors: ["#161228", "#342a58"],
    platColors: ["#241f3c", "#423a64", "#665c90", "#988cc0", "#c8bbee"],
    accentColor: "#ffe27a",
    accentColor2: "#8fd3ff",
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: "citadel", weather: "storm",
    timePar: 225, timeGold: 150,
    platforms: [
      { x: 0, y: 450, w: 700, h: 60, type: "ground" },
      { x: 360, y: 390, w: 160, h: 16, type: "conveyor", dir: 1, speed: 2 },
      { x: 760, y: 400, w: 180, h: 16 },
      { x: 1020, y: 360, w: 140, h: 16, type: "conveyor", dir: 1, speed: 2 },
      { x: 1320, y: 320, w: 160, h: 16, type: "oneway" },
      { x: 1700, y: 360, w: 160, h: 16 },
      { x: 1960, y: 320, w: 140, h: 16, type: "conveyor", dir: -1, speed: 1.5 },
      { x: 2280, y: 350, w: 160, h: 16 },
      { x: 2480, y: 390, w: 220, h: 60, type: "ground" }
    ],
    icePlats: [],
    bounces: [{ x: 1180, y: 420, w: 80, h: 24, rotation: 0 }],
    movingPlats: [
      { x: 1480, y: 300, x2: 1660, y2: 300, w: 120, h: 16, speed: 1.5 },
      { x: 2120, y: 380, x2: 2120, y2: 260, w: 120, h: 16, speed: 1.4 }
    ],
    switches: [],
    spikes: [
      { x: 940, y: 426, w: 80, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 420, y: 360 }, { x: 580, y: 410 }, { x: 820, y: 370 },
      { x: 1080, y: 330 }, { x: 1380, y: 290 }, { x: 1560, y: 270 },
      { x: 1760, y: 330 }, { x: 2020, y: 290 }, { x: 2120, y: 230 },
      { x: 2340, y: 320 }, { x: 2540, y: 360 }
    ],
    qblocks: [{ x: 1320, y: 280 }],
    cblocks: [{ x: 760, y: 360, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1320, y: 250, type: "rapid" }],
    enemies: [
      { x: 500, y: 408, v: 1, hp: 2, elite: "false" },
      { x: 820, y: 358, v: 0, hp: 3, elite: "false" },
      { x: 1380, y: 278, v: 3, hp: 3, elite: "false" },
      { x: 2300, y: 308, v: 1, hp: 3, elite: "false" }
    ],
    checkpoints: [{ x: 1180, y: 410, activated: false }],
    spiritEmbers: [{ x: 2120, y: 210, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ============================================================
  // L3 — TWIST: combine windtunnel lifts + grapple + timed plats
  // ============================================================
  {
    name: "THE THUNDERSPIRE",
    width: 2900,
    goalX: 2780,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#120f24", "#2e2650"],
    platColors: ["#201b38", "#3e365e", "#62588a", "#9286ba", "#c4b7ea"],
    accentColor: "#ffe27a",
    accentColor2: "#8fd3ff",
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: "citadel", weather: "storm",
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0, y: 450, w: 560, h: 60, type: "ground" },
      { x: 320, y: 390, w: 140, h: 16 },
      { x: 560, y: 240, w: 80, h: 200, type: "windtunnel", lift: 1.0 },
      { x: 700, y: 280, w: 140, h: 16 },
      { x: 940, y: 250, w: 140, h: 16, type: "timed", period: 180, _id: "t1" },
      { x: 1180, y: 300, w: 140, h: 16 },
      { x: 1400, y: 260, w: 24, h: 24, type: "grapplehook" },
      { x: 1560, y: 320, w: 160, h: 16 },
      { x: 1800, y: 220, w: 80, h: 200, type: "windtunnel", lift: 1.0 },
      { x: 1940, y: 260, w: 140, h: 16, type: "timed", period: 200, _id: "t2" },
      { x: 2180, y: 310, w: 150, h: 16 },
      { x: 2400, y: 270, w: 24, h: 24, type: "grapplehook" },
      { x: 2560, y: 320, w: 160, h: 16 },
      { x: 2700, y: 410, w: 200, h: 40 }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      { x: 1180, y: 300, x2: 1380, y2: 300, w: 120, h: 16, speed: 1.6 }
    ],
    switches: [],
    spikes: [
      { x: 840, y: 426, w: 90, h: 24, rotation: 0, spikeType: "static" },
      { x: 1720, y: 426, w: 70, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 380, y: 360 }, { x: 600, y: 320 }, { x: 600, y: 260 },
      { x: 770, y: 250 }, { x: 1010, y: 220 }, { x: 1250, y: 270 },
      { x: 1460, y: 230 }, { x: 1640, y: 290 }, { x: 1840, y: 300 },
      { x: 1840, y: 240 }, { x: 2010, y: 230 }, { x: 2250, y: 280 },
      { x: 2630, y: 290 }
    ],
    qblocks: [{ x: 700, y: 230 }],
    cblocks: [{ x: 1560, y: 280, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1010, y: 200, type: "extrajump" }, { x: 2180, y: 270, type: "shield" }],
    enemies: [
      { x: 380, y: 408, v: 2, hp: 3, elite: "false" },
      { x: 770, y: 238, v: 4, hp: 3, elite: "false" },
      { x: 1240, y: 258, v: 3, hp: 4, elite: "false" },
      { x: 1620, y: 278, v: 5, hp: 4, elite: "false" },
      { x: 2240, y: 268, v: 4, hp: 4, elite: "false" }
    ],
    checkpoints: [{ x: 1180, y: 260, activated: false }],
    spiritEmbers: [{ x: 560, y: 200, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ============================================================
  // L4 — CHALLENGE: dense vertical gauntlet, all mechanics
  // ============================================================
  {
    name: "VERTIGO OF THE GODS",
    width: 3100,
    goalX: 2980,
    goalY: 300,
    startX: 60, startY: 380,
    bgColors: ["#0e0c1e", "#281f48"],
    platColors: ["#1c1834", "#3a325a", "#5e5486", "#8e82b6", "#c0b3e6"],
    accentColor: "#ffe27a",
    accentColor2: "#8fd3ff",
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: "citadel", weather: "storm",
    timePar: 258, timeGold: 172,
    platforms: [
      { x: 0, y: 450, w: 520, h: 60, type: "ground" },
      { x: 300, y: 390, w: 130, h: 16 },
      { x: 500, y: 350, w: 120, h: 16, type: "oneway" },
      { x: 700, y: 310, w: 120, h: 16 },
      { x: 900, y: 350, w: 120, h: 16, type: "conveyor", dir: 1, speed: 2.5 },
      { x: 1140, y: 320, w: 120, h: 16 },
      { x: 1320, y: 240, w: 80, h: 200, type: "windtunnel", lift: 1.0 },
      { x: 1460, y: 280, w: 130, h: 16, type: "timed", period: 170, _id: "t1" },
      { x: 1680, y: 330, w: 24, h: 24, type: "grapplehook" },
      { x: 1840, y: 360, w: 130, h: 16 },
      { x: 2060, y: 310, w: 120, h: 16, type: "crumble", _id: "c1" },
      { x: 2280, y: 270, w: 120, h: 16, type: "crumble", _id: "c2" },
      { x: 2500, y: 320, w: 130, h: 16 },
      { x: 2740, y: 280, w: 130, h: 16, type: "oneway" },
      { x: 2900, y: 390, w: 200, h: 60, type: "ground" }
    ],
    icePlats: [
      { x: 1140, y: 320, w: 0, h: 0 }
    ],
    bounces: [
      { x: 640, y: 420, w: 80, h: 24, rotation: 0 },
      { x: 2640, y: 290, w: 80, h: 24, rotation: 0 }
    ],
    movingPlats: [
      { x: 1840, y: 360, x2: 1840, y2: 240, w: 120, h: 16, speed: 1.6 },
      { x: 2380, y: 380, x2: 2540, y2: 380, w: 110, h: 16, speed: 1.7 }
    ],
    switches: [],
    spikes: [
      { x: 820, y: 426, w: 80, h: 24, rotation: 0, spikeType: "static" },
      { x: 1060, y: 426, w: 80, h: 24, rotation: 0, spikeType: "static" },
      { x: 2180, y: 426, w: 90, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 360, y: 360 }, { x: 560, y: 320 }, { x: 760, y: 280 },
      { x: 960, y: 320 }, { x: 1190, y: 290 }, { x: 1360, y: 220 },
      { x: 1520, y: 250 }, { x: 1740, y: 300 }, { x: 1900, y: 330 },
      { x: 2120, y: 280 }, { x: 2340, y: 240 }, { x: 2560, y: 290 },
      { x: 2800, y: 250 }, { x: 1360, y: 280 }
    ],
    qblocks: [{ x: 700, y: 270 }],
    cblocks: [{ x: 1460, y: 240, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1360, y: 200, type: "invincible" }, { x: 2500, y: 280, type: "heal" }],
    enemies: [
      { x: 360, y: 408, v: 2, hp: 3, elite: "false" },
      { x: 760, y: 268, v: 5, hp: 4, elite: "false" },
      { x: 1190, y: 278, v: 7, hp: 5, elite: "false" },
      { x: 1520, y: 238, v: 4, hp: 4, elite: "false" },
      { x: 1900, y: 318, v: 8, hp: 5, elite: "false" },
      { x: 2560, y: 278, v: 5, hp: 5, elite: "false" },
      { x: 2800, y: 238, v: 11, hp: 5, elite: "false" }
    ],
    checkpoints: [{ x: 1140, y: 280, activated: false }, { x: 2060, y: 270, activated: false }],
    spiritEmbers: [{ x: 1320, y: 210, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ============================================================
  // L5 — FINALE: vertical climb to the summit + MEGA BOSS
  // ============================================================
  {
    name: "THE EYE AT THE SUMMIT",
    width: 3300,
    goalX: 3180,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#0a0818", "#241b44"],
    platColors: ["#181430", "#363056", "#5a5082", "#8a7eb2", "#fce6a0"],
    accentColor: "#ffe27a",
    accentColor2: "#8fd3ff",
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: "citadel", weather: "storm",
    timePar: 275, timeGold: 183,
    platforms: [
      { x: 0, y: 450, w: 520, h: 60, type: "ground" },
      { x: 320, y: 390, w: 130, h: 16 },
      { x: 540, y: 350, w: 120, h: 16, type: "oneway" },
      { x: 740, y: 310, w: 120, h: 16, type: "conveyor", dir: 1, speed: 2.5 },
      { x: 980, y: 280, w: 120, h: 16, type: "timed", period: 180, _id: "t1" },
      { x: 1200, y: 330, w: 24, h: 24, type: "grapplehook" },
      { x: 1360, y: 290, w: 120, h: 16 },
      { x: 1560, y: 240, w: 80, h: 200, type: "windtunnel", lift: 1.0 },
      { x: 1700, y: 280, w: 130, h: 16 },
      { x: 1920, y: 250, w: 120, h: 16, type: "crumble", _id: "c1" },
      { x: 2140, y: 300, w: 130, h: 16 },
      { x: 2360, y: 260, w: 120, h: 16, type: "oneway" },
      { x: 2580, y: 320, w: 130, h: 16 },
      // summit arena floor for the boss
      { x: 2760, y: 410, w: 560, h: 50, type: "ground" },
      { x: 2860, y: 330, w: 120, h: 16 },
      { x: 3080, y: 330, w: 120, h: 16 }
    ],
    icePlats: [],
    bounces: [
      { x: 660, y: 420, w: 80, h: 24, rotation: 0 },
      { x: 2700, y: 380, w: 80, h: 24, rotation: 0 }
    ],
    movingPlats: [
      { x: 1700, y: 280, x2: 1700, y2: 180, w: 120, h: 16, speed: 1.6 },
      { x: 2240, y: 380, x2: 2380, y2: 380, w: 110, h: 16, speed: 1.7 }
    ],
    switches: [],
    spikes: [
      { x: 860, y: 426, w: 80, h: 24, rotation: 0, spikeType: "static" },
      { x: 1460, y: 426, w: 80, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 380, y: 360 }, { x: 600, y: 320 }, { x: 800, y: 280 },
      { x: 1040, y: 250 }, { x: 1260, y: 300 }, { x: 1420, y: 260 },
      { x: 1600, y: 280 }, { x: 1760, y: 250 }, { x: 1980, y: 220 },
      { x: 2200, y: 270 }, { x: 2420, y: 230 }, { x: 2640, y: 290 },
      { x: 2900, y: 300 }, { x: 3120, y: 300 }
    ],
    qblocks: [{ x: 1360, y: 250 }],
    cblocks: [{ x: 2140, y: 260, hits: 3 }],
    trophies: [{ x: 3170, y: 280, collected: false }],
    powerupItems: [
      { x: 1040, y: 230, type: "heal" },
      { x: 2580, y: 280, type: "invincible" },
      { x: 2820, y: 370, type: "rapid" }
    ],
    enemies: [
      { x: 380, y: 408, v: 2, hp: 3, elite: "false" },
      { x: 800, y: 268, v: 5, hp: 4, elite: "false" },
      { x: 1380, y: 246, v: 4, hp: 4, elite: "false" },
      { x: 1760, y: 238, v: 8, hp: 5, elite: "false" },
      { x: 2200, y: 258, v: 11, hp: 5, elite: "false" },
      { x: 2580, y: 278, v: 7, hp: 5, elite: "false" },
      // MEGA BOSS at the summit
      { x: 3020, y: 346, v: 99, hp: 44, w: 64, h: 64, elite: "false" }
    ],
    checkpoints: [{ x: 1360, y: 250, activated: false }, { x: 2580, y: 280, activated: false }],
    spiritEmbers: [{ x: 1560, y: 200, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 2780, y: 350, w: 200, title: "THE APEX", lines: ["The Eye awaits.", "Defeat it and ascend", "beyond the cosmos."], color: "#ffe27a" }],
    highlights: []
  }
];
