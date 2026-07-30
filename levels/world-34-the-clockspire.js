// levels/world-34-the-clockspire.js
window.LEVELS_W34 = [
  // ===================== L1 — GEARWORKS GATE (intro) =====================
  {
    name: "GEARWORKS GATE",
    width: 2400,
    goalX: 2280,
    goalY: 360,
    startX: 60, startY: 380,
    bgColors: ["#2a2018", "#4a3a26"],
    platColors: ["#3a2c1c", "#5a4228", "#7a5e34", "#a07a40", "#d4a850"],
    accentColor: "#d4a850",
    accentColor2: "#7fb0c8",
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: "steampunk",
    weather: "none",
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0, y: 450, w: 2400, h: 60, type: "ground" },
      { x: 280, y: 380, w: 160, h: 16 },
      { x: 520, y: 320, w: 160, h: 16 },
      { x: 780, y: 380, w: 140, h: 16 },
      { x: 1040, y: 340, w: 160, h: 16, type: "timed", period: 180, _id: "t1" },
      { x: 1320, y: 320, w: 160, h: 16, type: "timed", period: 180, _id: "t2" },
      { x: 1580, y: 360, w: 160, h: 16 },
      { x: 1820, y: 300, w: 180, h: 16 },
      { x: 2080, y: 360, w: 160, h: 16 },
      { x: 2220, y: 450, w: 180, h: 60, type: "ground" }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [
      { x: 900, y: 426, w: 120, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 300, y: 340 }, { x: 360, y: 340 },
      { x: 560, y: 280 }, { x: 600, y: 280 },
      { x: 820, y: 340 },
      { x: 1100, y: 300 }, { x: 1380, y: 280 },
      { x: 1640, y: 320 }, { x: 1880, y: 260 },
      { x: 2140, y: 320 }
    ],
    qblocks: [{ x: 540, y: 220 }],
    cblocks: [],
    trophies: [],
    powerupItems: [{ x: 1880, y: 220, type: "heal" }],
    enemies: [
      { x: 800, y: 408, v: 0, hp: 2, elite: "false" },
      { x: 1620, y: 318, v: 1, hp: 2, elite: "false" },
      { x: 1880, y: 258, v: 0, hp: 2, elite: "false" }
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 540, y: 180, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [
      { x: 120, y: 380, w: 180, title: "TIMED COGS", lines: ["The amber plates blink", "in rhythm. Step when", "they appear, climb up!"], color: "#d4a850" }
    ],
    highlights: []
  },

  // ===================== L2 — THE TICKING STAIRS (develop) =====================
  {
    name: "THE TICKING STAIRS",
    width: 2600,
    goalX: 2480,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#241c16", "#46362a"],
    platColors: ["#352a1a", "#564026", "#785a32", "#9e783e", "#d4a850"],
    accentColor: "#d4a850",
    accentColor2: "#7fb0c8",
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: "steampunk",
    weather: "none",
    timePar: 217, timeGold: 144,
    platforms: [
      { x: 0, y: 450, w: 700, h: 60, type: "ground" },
      { x: 320, y: 370, w: 140, h: 16 },
      { x: 560, y: 320, w: 120, h: 16, type: "timed", period: 170, _id: "s1" },
      { x: 780, y: 360, w: 140, h: 16, type: "timed", period: 170, _id: "s2" },
      { x: 1000, y: 320, w: 140, h: 16, type: "timed", period: 200, _id: "s3" },
      { x: 1220, y: 280, w: 140, h: 16, type: "timed", period: 200, _id: "s4" },
      { x: 1440, y: 360, w: 160, h: 16 },
      { x: 1680, y: 310, w: 140, h: 16 },
      { x: 1900, y: 260, w: 140, h: 16, type: "timed", period: 190, _id: "s5" },
      { x: 2120, y: 320, w: 140, h: 16 },
      { x: 2340, y: 380, w: 160, h: 16 },
      { x: 2380, y: 450, w: 220, h: 60, type: "ground" }
    ],
    icePlats: [],
    bounces: [
      { x: 1480, y: 430, w: 80, h: 20, rotation: 0 }
    ],
    movingPlats: [
      { x: 1560, y: 200, x2: 1560, y2: 380, w: 120, h: 16, speed: 1.4 }
    ],
    switches: [],
    spikes: [
      { x: 700, y: 426, w: 80, h: 24, rotation: 0, spikeType: "static" },
      { x: 2000, y: 426, w: 100, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 340, y: 330 }, { x: 600, y: 280 },
      { x: 820, y: 320 }, { x: 1040, y: 280 },
      { x: 1260, y: 240 }, { x: 1500, y: 320 },
      { x: 1620, y: 160 }, { x: 1740, y: 270 },
      { x: 1940, y: 220 }, { x: 2160, y: 280 },
      { x: 2380, y: 340 }
    ],
    qblocks: [{ x: 1220, y: 200 }],
    cblocks: [{ x: 1040, y: 240, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1620, y: 120, type: "rapid" }],
    enemies: [
      { x: 360, y: 328, v: 1, hp: 2, elite: "false" },
      { x: 1480, y: 318, v: 5, hp: 3, elite: "false" },
      { x: 2140, y: 278, v: 3, hp: 3, elite: "false" },
      { x: 2380, y: 338, v: 0, hp: 2, elite: "false" }
    ],
    checkpoints: [{ x: 1440, y: 320, activated: false }],
    spiritEmbers: [{ x: 2160, y: 240, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ===================== L3 — ARMS OF THE SPIRE (twist) =====================
  {
    name: "ARMS OF THE SPIRE",
    width: 2800,
    goalX: 2680,
    goalY: 340,
    startX: 60, startY: 380,
    bgColors: ["#1f1812", "#42342a"],
    platColors: ["#312618", "#523e26", "#745632", "#9a743c", "#d4a850"],
    accentColor: "#d4a850",
    accentColor2: "#7fb0c8",
    skyStars: false, height: 560, voidFloor: false, voidY: 460,
    theme: "steampunk",
    weather: "none",
    timePar: 233, timeGold: 156,
    platforms: [
      { x: 0, y: 450, w: 600, h: 60, type: "ground" },
      { x: 300, y: 370, w: 140, h: 16 },
      { x: 520, y: 320, w: 120, h: 16 },
      { x: 700, y: 360, w: 56, h: 16, type: "rotating", cx: 730, cy: 330, radius: 64, speed: 0.022, startAngle: 0, _id: "a_r1" },
      { x: 880, y: 330, w: 150, h: 16, type: "timed", period: 180, _id: "a1" },
      { x: 1080, y: 360, w: 56, h: 16, type: "rotating", cx: 1110, cy: 330, radius: 64, speed: 0.024, startAngle: 3.14, _id: "a_r2" },
      { x: 1260, y: 300, w: 160, h: 16, type: "timed", period: 200, _id: "a2" },
      { x: 1480, y: 350, w: 56, h: 16, type: "rotating", cx: 1510, cy: 320, radius: 64, speed: 0.022, startAngle: 0, _id: "a_r3" },
      { x: 1660, y: 290, w: 160, h: 16 },
      { x: 1900, y: 340, w: 140, h: 16, type: "timed", period: 175, _id: "a3" },
      { x: 2120, y: 290, w: 140, h: 16 },
      { x: 2360, y: 330, w: 140, h: 16 },
      { x: 2560, y: 380, w: 160, h: 16 },
      { x: 2600, y: 450, w: 200, h: 60, type: "ground" }
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      { x: 2200, y: 220, x2: 2360, y2: 220, w: 110, h: 16, speed: 1.6 }
    ],
    switches: [],
    spikes: [
      { x: 600, y: 426, w: 100, h: 24, rotation: 0, spikeType: "static" },
      { x: 1140, y: 426, w: 120, h: 24, rotation: 0, spikeType: "static" },
      { x: 2020, y: 426, w: 100, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 320, y: 330 }, { x: 540, y: 280 },
      { x: 900, y: 290 }, { x: 1300, y: 260 },
      { x: 1700, y: 250 }, { x: 1720, y: 250 },
      { x: 1940, y: 300 }, { x: 2160, y: 250 },
      { x: 2280, y: 180 }, { x: 2400, y: 290 },
      { x: 2600, y: 340 }
    ],
    qblocks: [{ x: 1660, y: 230 }],
    cblocks: [{ x: 1900, y: 280, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 2280, y: 180, type: "invincible" }],
    enemies: [
      { x: 340, y: 328, v: 1, hp: 2, elite: "false" },
      { x: 1280, y: 258, v: 4, hp: 3, elite: "false" },
      { x: 1700, y: 248, v: 8, hp: 3, elite: "false" },
      { x: 2360, y: 288, v: 5, hp: 4, elite: "false" },
      { x: 2600, y: 338, v: 3, hp: 3, elite: "false" }
    ],
    checkpoints: [{ x: 1660, y: 250, activated: false }],
    spiritEmbers: [{ x: 540, y: 240, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ===================== L4 — THE GREAT ESCAPEMENT (challenge) =====================
  {
    name: "THE GREAT ESCAPEMENT",
    width: 3000,
    goalX: 2880,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#1c160f", "#3e3024"],
    platColors: ["#2c2114", "#4c3a24", "#6e5230", "#94703a", "#d4a850"],
    accentColor: "#d4a850",
    accentColor2: "#7fb0c8",
    skyStars: false, height: 560, voidFloor: true, voidY: 470,
    theme: "steampunk",
    weather: "none",
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0, y: 450, w: 420, h: 60, type: "ground" },
      { x: 360, y: 380, w: 120, h: 16 },
      { x: 560, y: 340, w: 130, h: 16, type: "timed", period: 170, _id: "e1" },
      { x: 740, y: 380, w: 56, h: 16, type: "rotating", cx: 770, cy: 350, radius: 60, speed: 0.022, startAngle: 0, _id: "e_r1" },
      { x: 920, y: 330, w: 140, h: 16, type: "timed", period: 190, _id: "e2" },
      { x: 1120, y: 380, w: 130, h: 16 },
      { x: 1320, y: 330, w: 56, h: 16, type: "rotating", cx: 1350, cy: 310, radius: 60, speed: 0.024, startAngle: 3.14, _id: "e_r2" },
      { x: 1500, y: 300, w: 140, h: 16, type: "timed", period: 200, _id: "e3" },
      { x: 1720, y: 350, w: 130, h: 16 },
      { x: 2080, y: 320, w: 180, h: 16, type: "timed", period: 180, _id: "e4" },
      { x: 2330, y: 240, w: 56, h: 16, type: "rotating", cx: 2360, cy: 240, radius: 60, speed: 0.022, startAngle: 0, _id: "e_r3" },
      { x: 2440, y: 320, w: 170, h: 16 },
      { x: 2700, y: 360, w: 140, h: 16 },
      { x: 2800, y: 450, w: 200, h: 60, type: "ground" }
    ],
    icePlats: [],
    bounces: [
      { x: 1760, y: 430, w: 80, h: 20, rotation: 0 }
    ],
    movingPlats: [
      { x: 1880, y: 380, x2: 2040, y2: 380, w: 110, h: 16, speed: 1.7 },
      { x: 2620, y: 200, x2: 2620, y2: 380, w: 110, h: 16, speed: 1.5 }
    ],
    switches: [],
    spikes: [
      { x: 1240, y: 366, w: 80, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 380, y: 340 }, { x: 600, y: 300 },
      { x: 960, y: 290 }, { x: 1160, y: 340 },
      { x: 1540, y: 260 }, { x: 1760, y: 310 },
      { x: 1940, y: 340 }, { x: 2120, y: 280 },
      { x: 2340, y: 200 }, { x: 2520, y: 280 },
      { x: 2660, y: 150 }, { x: 2740, y: 320 }
    ],
    qblocks: [{ x: 1500, y: 240 }],
    cblocks: [{ x: 2480, y: 260, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 1160, y: 300, type: "shield" },
      { x: 2660, y: 110, type: "extrajump" }
    ],
    enemies: [
      { x: 380, y: 338, v: 1, hp: 3, elite: "false" },
      { x: 1120, y: 338, v: 5, hp: 4, elite: "false" },
      { x: 1720, y: 308, v: 4, hp: 3, elite: "false" },
      { x: 2080, y: 278, v: 8, hp: 4, elite: "false" },
      { x: 2480, y: 278, v: 7, hp: 5, elite: "false" },
      { x: 2800, y: 408, v: 3, hp: 3, elite: "false" }
    ],
    checkpoints: [
      { x: 1120, y: 340, activated: false },
      { x: 2080, y: 280, activated: false }
    ],
    spiritEmbers: [{ x: 2340, y: 160, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  },

  // ===================== L5 — CROWN OF THE CLOCKSPIRE (finale) =====================
  {
    name: "CROWN OF THE CLOCKSPIRE",
    width: 3200,
    goalX: 3080,
    goalY: 320,
    startX: 60, startY: 380,
    bgColors: ["#181109", "#3a2c20"],
    platColors: ["#281d10", "#483620", "#6a4e2e", "#906c38", "#d4a850"],
    accentColor: "#d4a850",
    accentColor2: "#7fb0c8",
    skyStars: true, height: 560, voidFloor: true, voidY: 470,
    theme: "steampunk",
    weather: "none",
    timePar: 267, timeGold: 178,
    platforms: [
      { x: 0, y: 450, w: 460, h: 60, type: "ground" },
      { x: 380, y: 380, w: 120, h: 16 },
      { x: 580, y: 340, w: 130, h: 16, type: "timed", period: 165, _id: "c1" },
      { x: 760, y: 380, w: 56, h: 16, type: "rotating", cx: 790, cy: 350, radius: 60, speed: 0.022, startAngle: 0, _id: "c_r1" },
      { x: 940, y: 340, w: 140, h: 16, type: "timed", period: 185, _id: "c2" },
      { x: 1140, y: 300, w: 130, h: 16, type: "timed", period: 185, _id: "c3" },
      { x: 1340, y: 350, w: 56, h: 16, type: "rotating", cx: 1370, cy: 330, radius: 60, speed: 0.024, startAngle: 3.14, _id: "c_r2" },
      { x: 1500, y: 310, w: 150, h: 16 },
      { x: 1740, y: 270, w: 140, h: 16, type: "timed", period: 200, _id: "c4" },
      { x: 1960, y: 320, w: 56, h: 16, type: "rotating", cx: 1990, cy: 300, radius: 60, speed: 0.022, startAngle: 0, _id: "c_r3" },
      { x: 2140, y: 280, w: 140, h: 16, type: "timed", period: 190, _id: "c5" },
      { x: 2360, y: 320, w: 140, h: 16 },
      { x: 2820, y: 280, w: 140, h: 16 },
      { x: 3000, y: 360, w: 200, h: 16 },
      { x: 3000, y: 450, w: 200, h: 60, type: "ground" }
    ],
    icePlats: [],
    bounces: [
      { x: 2400, y: 430, w: 80, h: 20, rotation: 0 }
    ],
    movingPlats: [
      { x: 2560, y: 240, x2: 2740, y2: 240, w: 110, h: 16, speed: 1.8 },
      { x: 1620, y: 180, x2: 1620, y2: 380, w: 100, h: 16, speed: 1.6 }
    ],
    switches: [],
    spikes: [
      { x: 1040, y: 426, w: 100, h: 24, rotation: 0, spikeType: "static" },
      { x: 2260, y: 426, w: 100, h: 24, rotation: 0, spikeType: "static" }
    ],
    coins: [
      { x: 400, y: 340 }, { x: 620, y: 300 },
      { x: 980, y: 300 }, { x: 1180, y: 260 },
      { x: 1560, y: 270 }, { x: 1620, y: 140 },
      { x: 1780, y: 230 }, { x: 2180, y: 240 },
      { x: 2400, y: 280 }, { x: 2640, y: 200 },
      { x: 2860, y: 240 }, { x: 3060, y: 320 }
    ],
    qblocks: [{ x: 1740, y: 210 }],
    cblocks: [{ x: 2140, y: 220, hits: 3 }],
    trophies: [{ x: 3060, y: 300, collected: false }],
    powerupItems: [
      { x: 1620, y: 100, type: "heal" },
      { x: 2640, y: 160, type: "invincible" }
    ],
    enemies: [
      { x: 400, y: 338, v: 5, hp: 4, elite: "false" },
      { x: 1140, y: 258, v: 8, hp: 4, elite: "false" },
      { x: 1520, y: 268, v: 4, hp: 4, elite: "false" },
      { x: 2140, y: 238, v: 7, hp: 5, elite: "false" },
      { x: 2360, y: 278, v: 11, hp: 5, elite: "false" },
      { x: 2820, y: 238, v: 98, hp: 38, elite: "false", w: 64, h: 64 }
    ],
    checkpoints: [
      { x: 1140, y: 300, activated: false },
      { x: 2360, y: 320, activated: false }
    ],
    spiritEmbers: [{ x: 980, y: 260, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: []
  }
];
