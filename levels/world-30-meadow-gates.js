// levels/world-30-meadow-gates.js
window.LEVELS_W30 = [
  // ===================== L1: SUNRISE FOOTHOLDS =====================
  {
    name: "SUNRISE FOOTHOLDS",
    width: 2200,
    goalX: 2080,
    goalY: 360,
    startX: 60, startY: 380,
    bgColors: ["#bfe9ff", "#eafbe0"],
    platColors: ["#3f7a32", "#4f9a3f", "#62b54e", "#7fd36a", "#a8e88f"],
    accentColor: "#ffe27a",
    accentColor2: "#f6a94c",
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: "highland", weather: "none",
    timePar: 183, timeGold: 122,
    platforms: [
      { x: 0, y: 450, w: 2200, h: 60, type: "ground" },
      { x: 360, y: 392, w: 160, h: 16 },
      { x: 620, y: 350, w: 150, h: 16 },
      { x: 900, y: 388, w: 180, h: 16, type: "oneway" },
      { x: 1180, y: 350, w: 150, h: 16, type: "oneway" },
      { x: 1440, y: 392, w: 160, h: 16 },
      { x: 1700, y: 356, w: 160, h: 16 },
      { x: 1960, y: 410, w: 220, h: 16 }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [],
    coins: [
      { x: 410, y: 360 }, { x: 440, y: 360 },
      { x: 680, y: 318 },
      { x: 980, y: 356 }, { x: 1010, y: 356 },
      { x: 1240, y: 318 },
      { x: 1500, y: 360 },
      { x: 1760, y: 324 },
      { x: 1280, y: 250 }
    ],
    qblocks: [{ x: 900, y: 300 }],
    cblocks: [],
    trophies: [],
    powerupItems: [],
    enemies: [
      { x: 760, y: 408, v: 0, hp: 2, elite: "false" },
      { x: 1500, y: 408, v: 1, hp: 2, elite: "false" }
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 1280, y: 220, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 120, y: 388, w: 150, title: "WELCOME", lines: ["Hold to run.", "Jump, then jump", "again for a", "double jump.", "Climb the gates!"], color: "#7fd36a" },
      { x: 870, y: 340, w: 150, title: "ONEWAY", lines: ["Faded ledges let", "you pass up", "from below."], color: "#62b54e" }
    ],
    highlights: []
  },

  // ===================== L2: TERRACED PASTURE =====================
  {
    name: "TERRACED PASTURE",
    width: 2500,
    goalX: 2380,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#b6e6ff", "#e6f9da"],
    platColors: ["#3f7a32", "#4f9a3f", "#62b54e", "#7fd36a", "#a8e88f"],
    accentColor: "#ffe27a",
    accentColor2: "#f6a94c",
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: "highland", weather: "none",
    timePar: 208, timeGold: 139,
    platforms: [
      { x: 0, y: 450, w: 2500, h: 60, type: "ground" },
      { x: 300, y: 400, w: 160, h: 16 },
      { x: 540, y: 350, w: 150, h: 16, type: "oneway" },
      { x: 780, y: 300, w: 150, h: 16, type: "oneway" },
      { x: 1020, y: 350, w: 150, h: 16 },
      { x: 1280, y: 400, w: 160, h: 16 },
      { x: 1540, y: 350, w: 140, h: 16, type: "oneway" },
      { x: 1780, y: 300, w: 140, h: 16, type: "oneway" },
      { x: 2020, y: 350, w: 150, h: 16 },
      { x: 2280, y: 410, w: 220, h: 16 }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 1140, y: 426, w: 110, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 360, y: 368 },
      { x: 600, y: 318 },
      { x: 840, y: 268 }, { x: 870, y: 268 },
      { x: 1080, y: 318 },
      { x: 1340, y: 368 },
      { x: 1600, y: 318 },
      { x: 1840, y: 268 }, { x: 1870, y: 268 },
      { x: 2080, y: 318 },
      { x: 790, y: 200 }
    ],
    qblocks: [{ x: 1280, y: 350 }],
    cblocks: [{ x: 1020, y: 300, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 540, y: 312, type: "extrajump" }],
    enemies: [
      { x: 480, y: 408, v: 1, hp: 2, elite: "false" },
      { x: 1080, y: 308, v: 0, hp: 2, elite: "false" },
      { x: 1340, y: 408, v: 1, hp: 3, elite: "false" },
      { x: 2080, y: 308, v: 3, hp: 3, elite: "false" }
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 790, y: 170, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 120, y: 388, w: 150, title: "TERRACES", lines: ["Step up the", "terraces.", "Spikes below —", "stay on top."], color: "#7fd36a" }
    ],
    highlights: []
  },

  // ===================== L3: WINDMILL CROSSING =====================
  {
    name: "WINDMILL CROSSING",
    width: 2800,
    goalX: 2680,
    goalY: 330,
    startX: 60, startY: 380,
    bgColors: ["#a9e0ff", "#dff6cf"],
    platColors: ["#3a7330", "#4c923c", "#5fb04a", "#7ace66", "#a3e58a"],
    accentColor: "#ffd86a",
    accentColor2: "#ef9a3c",
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: "highland", weather: "none",
    timePar: 233, timeGold: 156,
    platforms: [
      { x: 0, y: 450, w: 900, h: 60, type: "ground" },
      { x: 300, y: 392, w: 150, h: 16 },
      { x: 560, y: 344, w: 140, h: 16, type: "oneway" },
      { x: 820, y: 320, w: 120, h: 16 },
      { x: 1100, y: 360, w: 130, h: 16 },
      { x: 1480, y: 360, w: 130, h: 16 },
      { x: 1740, y: 312, w: 130, h: 16, type: "oneway" },
      { x: 2000, y: 360, w: 130, h: 16 },
      { x: 2300, y: 408, w: 160, h: 16 },
      { x: 2560, y: 420, w: 240, h: 16 }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      { x: 980, y: 400, x2: 1280, y2: 400, w: 110, h: 16, speed: 1.5 },
      { x: 1620, y: 360, x2: 1620, y2: 240, w: 110, h: 16, speed: 1.4 }
    ],
    switches: [],
    spikes: [
      { x: 1180, y: 426, w: 200, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 360, y: 360 },
      { x: 620, y: 312 },
      { x: 860, y: 288 },
      { x: 1130, y: 320 },
      { x: 1300, y: 360 }, { x: 1330, y: 360 },
      { x: 1530, y: 320 },
      { x: 1790, y: 280 },
      { x: 2050, y: 320 },
      { x: 2360, y: 368 },
      { x: 820, y: 200 }
    ],
    qblocks: [{ x: 820, y: 272 }],
    cblocks: [{ x: 2000, y: 312, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1740, y: 274, type: "heal" }],
    enemies: [
      { x: 420, y: 408, v: 1, hp: 2, elite: "false" },
      { x: 820, y: 278, v: 0, hp: 2, elite: "false" },
      { x: 1530, y: 318, v: 3, hp: 3, elite: "false" },
      { x: 2050, y: 318, v: 1, hp: 3, elite: "false" },
      { x: 2600, y: 378, v: 5, hp: 4, elite: "false" }
    ],
    checkpoints: [{ x: 1100, y: 318, activated: false }],
    spiritEmbers: [{ x: 820, y: 170, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 120, y: 388, w: 150, title: "CROSSING", lines: ["Ride the moving", "platforms.", "Mind the spike", "trench below."], color: "#7ace66" }
    ],
    highlights: []
  },

  // ===================== L4: THE RISING GATE =====================
  {
    name: "THE RISING GATE",
    width: 2700,
    goalX: 2580,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#9ad6ff", "#d4f0c2"],
    platColors: ["#356b2c", "#478837", "#5aa845", "#74c660", "#9fe184"],
    accentColor: "#ffd25a",
    accentColor2: "#ec8f34",
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: "highland", weather: "none",
    timePar: 225, timeGold: 150,
    platforms: [
      { x: 0, y: 450, w: 600, h: 60, type: "ground" },
      { x: 340, y: 392, w: 130, h: 16 },
      { x: 560, y: 340, w: 120, h: 16, type: "oneway" },
      { x: 760, y: 290, w: 120, h: 16 },
      { x: 980, y: 240, w: 120, h: 16, type: "oneway" },
      { x: 1200, y: 300, w: 120, h: 16 },
      { x: 1440, y: 360, w: 120, h: 16 },
      { x: 1700, y: 310, w: 120, h: 16, type: "oneway" },
      { x: 1920, y: 260, w: 120, h: 16 },
      { x: 2160, y: 320, w: 130, h: 16 },
      { x: 2440, y: 410, w: 260, h: 16 }
    ],
    icePlats: [],
    bounces: [
      { x: 1260, y: 434, w: 90, h: 16, rotation: 0 }
    ],
    movingPlats: [
      { x: 1080, y: 200, x2: 1080, y2: 320, w: 100, h: 16, speed: 1.6 }
    ],
    switches: [],
    spikes: [
      { x: 640, y: 426, w: 120, h: 24, rotation: 0, spikeType: "static" },
      { x: 1480, y: 426, w: 200, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 400, y: 360 },
      { x: 600, y: 308 },
      { x: 810, y: 258 },
      { x: 1030, y: 208 },
      { x: 1250, y: 268 },
      { x: 1490, y: 328 },
      { x: 1750, y: 278 },
      { x: 1970, y: 228 }, { x: 2000, y: 228 },
      { x: 2210, y: 288 },
      { x: 980, y: 150 }
    ],
    qblocks: [{ x: 760, y: 242 }],
    cblocks: [{ x: 2160, y: 272, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1200, y: 252, type: "shield" }],
    enemies: [
      { x: 760, y: 248, v: 0, hp: 3, elite: "false" },
      { x: 1200, y: 258, v: 3, hp: 3, elite: "false" },
      { x: 1920, y: 218, v: 4, hp: 3, elite: "false" },
      { x: 2200, y: 278, v: 5, hp: 4, elite: "false" },
      { x: 2500, y: 368, v: 1, hp: 4, elite: "false" }
    ],
    checkpoints: [{ x: 1200, y: 258, activated: false }],
    spiritEmbers: [{ x: 980, y: 120, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 120, y: 388, w: 150, title: "RISE", lines: ["The gate climbs.", "Use the bounce", "pad to reach", "high ledges."], color: "#74c660" }
    ],
    highlights: []
  },

  // ===================== L5: GATE OF THE ASCENT =====================
  {
    name: "GATE OF THE ASCENT",
    width: 3000,
    goalX: 2880,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#8fcdff", "#cdeeba"],
    platColors: ["#2f6126", "#418032", "#54a040", "#6fc05b", "#9bdd80"],
    accentColor: "#ffcf52",
    accentColor2: "#e98730",
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: "highland", weather: "none",
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0, y: 450, w: 560, h: 60, type: "ground" },
      { x: 320, y: 392, w: 120, h: 16 },
      { x: 540, y: 344, w: 120, h: 16, type: "oneway" },
      { x: 760, y: 300, w: 120, h: 16 },
      { x: 1000, y: 350, w: 120, h: 16 },
      { x: 1240, y: 300, w: 120, h: 16, type: "oneway" },
      { x: 1460, y: 250, w: 120, h: 16 },
      { x: 1700, y: 300, w: 120, h: 16, type: "oneway" },
      { x: 1940, y: 350, w: 120, h: 16 },
      { x: 2200, y: 300, w: 120, h: 16, type: "oneway" },
      { x: 2420, y: 250, w: 120, h: 16 },
      { x: 2660, y: 320, w: 120, h: 16 },
      { x: 2760, y: 410, w: 240, h: 16 }
    ],
    icePlats: [],
    bounces: [
      { x: 880, y: 434, w: 90, h: 16, rotation: 0 }
    ],
    movingPlats: [
      { x: 1560, y: 250, x2: 1560, y2: 130, w: 100, h: 16, speed: 1.5 },
      { x: 2520, y: 250, x2: 2660, y2: 320, w: 110, h: 16, speed: 1.6 }
    ],
    switches: [],
    spikes: [
      { x: 620, y: 426, w: 120, h: 24, rotation: 0, spikeType: "static" },
      { x: 2040, y: 426, w: 150, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 380, y: 360 },
      { x: 580, y: 312 },
      { x: 810, y: 268 },
      { x: 1050, y: 318 },
      { x: 1290, y: 268 },
      { x: 1510, y: 218 }, { x: 1540, y: 218 },
      { x: 1750, y: 268 },
      { x: 1990, y: 318 },
      { x: 2250, y: 268 },
      { x: 2470, y: 218 },
      { x: 2710, y: 288 },
      { x: 1610, y: 100 }
    ],
    qblocks: [{ x: 760, y: 252 }],
    cblocks: [{ x: 1940, y: 302, hits: 3 }],
    trophies: [{ x: 2710, y: 250, collected: false }],
    powerupItems: [
      { x: 1000, y: 302, type: "heal" },
      { x: 2420, y: 202, type: "invincible" }
    ],
    enemies: [
      { x: 760, y: 258, v: 1, hp: 3, elite: "false" },
      { x: 1240, y: 258, v: 3, hp: 3, elite: "false" },
      { x: 1460, y: 208, v: 4, hp: 4, elite: "false" },
      { x: 1940, y: 308, v: 5, hp: 4, elite: "false" },
      { x: 2200, y: 258, v: 7, hp: 5, elite: "false" },
      { x: 2660, y: 278, v: 5, hp: 5, elite: "false" }
    ],
    checkpoints: [
      { x: 1000, y: 308, activated: false },
      { x: 1940, y: 308, activated: false }
    ],
    spiritEmbers: [{ x: 1610, y: 70, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 120, y: 388, w: 150, title: "THE GATE", lines: ["The final gate", "to the ascent.", "Climb true and", "claim the prize!"], color: "#6fc05b" }
    ],
    highlights: []
  }
];
