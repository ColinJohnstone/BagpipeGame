// levels/world-3d-prism.js
// ──────────────────────────────────────────────────────────────────
// THE PRISM DIMENSION — the 3D platformer levels (Highland Prism).
// Each level runs in the Three.js 3D mode (see src/three/dimension.js).
// A `biome` field selects the block textures / sky / decorations.
// Exposes window.LEVELS_W3D.
// ──────────────────────────────────────────────────────────────────

(function () {
  window.LEVELS_W3D = [
    {
      "name": "PRISM SUMMIT",
      "biome": "grass",
      "width": 1600,
      "mode3d": true,
      "bgColors": ["#2a4a7a", "#4f83bd"],
      "skyStars": false,
      "platColors": ["#274d1c", "#356a26", "#4a8f33", "#5cb040", "#74d155"],
      "voidFloor": true,
      "voidY": 760,
      "startX": 60,
      "startY": 360,
      "platforms": [
        { "x": 0, "y": 470, "w": 420, "h": 170, "zc": 0, "zd": 160 },
        { "x": 560, "y": 450, "w": 240, "h": 30, "zc": 0, "zd": 130 },
        { "x": 900, "y": 415, "w": 240, "h": 30, "zc": 0, "zd": 130 },
        { "x": 1220, "y": 435, "w": 130, "h": 26, "zc": 0, "zd": 95, "kind": "bounce" },
        { "x": 1430, "y": 320, "w": 260, "h": 30, "zc": 0, "zd": 150 },
        { "x": 1780, "y": 315, "w": 240, "h": 30, "zc": 0, "zd": 140 },
        { "x": 2080, "y": 310, "w": 360, "h": 30, "zc": 0, "zd": 160 },
        { "x": 2500, "y": 290, "w": 420, "h": 70, "zc": 0, "zd": 200 },
        { "x": 980, "y": 380, "w": 150, "h": 24, "zc": -240, "zd": 80, "move": { "axis": "z", "dist": 90, "speed": 0.03 } }
      ],
      "spikes": [
        { "x": 2200, "y": 310 }, { "x": 2245, "y": 310 }, { "x": 2290, "y": 310 }
      ],
      "coins": [
        { "x": 160, "y": 440 }, { "x": 300, "y": 440 },
        { "x": 620, "y": 420 }, { "x": 740, "y": 420 },
        { "x": 960, "y": 385 }, { "x": 1080, "y": 385 },
        { "x": 1250, "y": 360 }, { "x": 1250, "y": 280 },
        { "x": 1500, "y": 290 }, { "x": 1620, "y": 290 },
        { "x": 1850, "y": 285 }, { "x": 2120, "y": 280 },
        { "x": 2245, "y": 240 }, { "x": 2560, "y": 250 }, { "x": 2700, "y": 250 },
        { "x": 1010, "y": 350, "z": -240 }, { "x": 1010, "y": 350, "z": -300 }
      ],
      "enemies": [
        { "x": 960, "y": 383, "v": 0, "hp": 3 },
        { "x": 1830, "y": 283, "v": 1, "hp": 3 },
        { "x": 2560, "y": 258, "v": 0, "hp": 4 }
      ],
      "powerupItems": [
        { "x": 1500, "y": 290, "type": "heal" }
      ],
      "spiritEmbers": [
        { "x": 1010, "y": 320, "z": -270, "collected": false, "idx": 0 },
        { "x": 2245, "y": 236, "collected": false, "idx": 1 }
      ],
      "signs": [
        { "x": 40, "y": 360, "w": 340, "title": "PRISM SUMMIT", "lines": ["FOLLOW THE COINS TO THE CASTLE.", "BOUNCE PADS LAUNCH YOU UP.", "MIND THE SPIKES!"], "color": "#8ec7ff" }
      ],
      "goalX": 2660,
      "goalY": 170,
      "timePar": 200,
      "timeGold": 140
    },
    {
      "name": "THE UNFOLDING",
      "biome": "grass",
      "width": 4900,
      "bgColors": ["#274a78", "#5088c0"],
      "skyStars": false,
      "platColors": ["#274d1c", "#356a26", "#4a8f33", "#5cb040", "#74d155"],
      "voidFloor": true,
      "voidY": 620,
      "startX": 60,
      "startY": 380,
      "rifts": [
        { "x": 980,  "dir": "to3d" },
        { "x": 2280, "dir": "to2d" },
        { "x": 3260, "dir": "to3d" },
        { "x": 4300, "dir": "to2d" }
      ],
      "platforms": [
        { "x": 0, "y": 470, "w": 1000, "h": 140 },
        { "x": 280, "y": 400, "w": 110, "h": 18 },
        { "x": 470, "y": 348, "w": 110, "h": 18 },
        { "x": 670, "y": 398, "w": 110, "h": 18 },

        { "x": 1000, "y": 470, "w": 1280, "h": 140 },
        { "x": 1150, "y": 250, "w": 60, "h": 230, "zc": 0, "zd": 46 },
        { "x": 1560, "y": 405, "w": 150, "h": 18, "zc": 105, "zd": 70 },
        { "x": 1820, "y": 405, "w": 150, "h": 18, "zc": -105, "zd": 70 },

        { "x": 2280, "y": 470, "w": 200, "h": 140 },
        { "x": 2520, "y": 415, "w": 120, "h": 18, "zc": -120, "zd": 50 },
        { "x": 2710, "y": 388, "w": 120, "h": 18, "zc": 115, "zd": 50 },
        { "x": 2900, "y": 415, "w": 120, "h": 18, "zc": -120, "zd": 50 },
        { "x": 3080, "y": 445, "w": 160, "h": 18, "zc": 0, "zd": 60 },
        { "x": 3240, "y": 470, "w": 480, "h": 140 },

        { "x": 3760, "y": 442, "w": 120, "h": 18, "zc": 115, "zd": 62 },
        { "x": 3900, "y": 442, "w": 120, "h": 18, "zc": -115, "zd": 62 },
        { "x": 4040, "y": 470, "w": 860, "h": 140 }
      ],
      "coins": [
        { "x": 320, "y": 372 }, { "x": 505, "y": 320 }, { "x": 710, "y": 370 },
        { "x": 900, "y": 430 },
        { "x": 1300, "y": 430 }, { "x": 1625, "y": 378 }, { "x": 1885, "y": 378 },
        { "x": 2130, "y": 430 },
        { "x": 2560, "y": 388 }, { "x": 2750, "y": 360 }, { "x": 2940, "y": 388 },
        { "x": 3140, "y": 418 },
        { "x": 3450, "y": 430 }, { "x": 3620, "y": 430 },
        { "x": 3820, "y": 415 }, { "x": 3960, "y": 415 },
        { "x": 4260, "y": 430 }, { "x": 4460, "y": 430 }
      ],
      "enemies": [
        { "x": 640, "y": 438, "v": 0, "hp": 3 },
        { "x": 1650, "y": 438, "v": 0, "hp": 3 },
        { "x": 4160, "y": 438, "v": 0, "hp": 3 },
        { "x": 4260, "y": 438, "v": 1, "hp": 3 },
        { "x": 4360, "y": 438, "v": 0, "hp": 3 }
      ],
      "spiritEmbers": [
        { "x": 1690, "y": 360, "collected": false, "idx": 0 },
        { "x": 2760, "y": 330, "collected": false, "idx": 1 },
        { "x": 3980, "y": 388, "collected": false, "idx": 2 }
      ],
      "signs": [
        { "x": 60, "y": 300, "w": 360, "title": "THE UNFOLDING",
          "lines": ["THE WORLD FOLDS BETWEEN 2D & 3D", "AT THE PRISM RIFTS.", "SAME LEVEL — DIFFERENT DIMENSION."], "color": "#8ec7ff" },
        { "x": 1000, "y": 320, "w": 340, "title": "3D — WALK AROUND",
          "lines": ["THIS WALL BLOCKS THE FLAT PATH.", "IN 3D, STEP SIDEWAYS (A/D)", "TO GET AROUND IT."], "color": "#b06bff" },
        { "x": 2280, "y": 330, "w": 360, "title": "2D — PROJECTION BRIDGE",
          "lines": ["THESE ISLANDS SIT AT DIFFERENT", "DEPTHS — ONLY THE FLAT 2D VIEW", "LINES THEM UP INTO A PATH."], "color": "#5cb040" }
      ],
      "goalX": 4600,
      "goalY": 330,
      "timePar": 300,
      "timeGold": 220
    },
    {
      "name": "THE HIGH ROAD",
      "biome": "sky",
      "width": 3200,
      "mode3d": true,
      "bgColors": ["#243f6e", "#4b7fb8"],
      "skyStars": false,
      "platColors": ["#2a4d1c", "#3a6a26", "#508f33", "#63b040", "#7bd155"],
      "voidFloor": true,
      "voidY": 800,
      "startX": 120,
      "startY": 360,
      "platforms": [
        { "x": 0, "y": 480, "w": 440, "h": 180, "zc": 0, "zd": 200 },

        { "x": 760, "y": 480, "w": 420, "h": 180, "zc": 0, "zd": 200 },

        { "x": 1180, "y": 480, "w": 320, "h": 180, "zc": 0, "zd": 200 },
        { "x": 1230, "y": 236, "w": 340, "h": 30, "zc": 0, "zd": 170 },

        { "x": 1640, "y": 250, "w": 480, "h": 44, "zc": 0, "zd": 240 },

        { "x": 2160, "y": 300, "w": 130, "h": 24, "zc": -130, "zd": 75 },
        { "x": 2350, "y": 262, "w": 130, "h": 24, "zc": 120, "zd": 75 },
        { "x": 2540, "y": 222, "w": 130, "h": 24, "zc": -90, "zd": 75 },
        { "x": 2730, "y": 186, "w": 150, "h": 24, "zc": 70, "zd": 85 },

        { "x": 2940, "y": 168, "w": 380, "h": 70, "zc": 0, "zd": 210 }
      ],
      "coins": [
        { "x": 160, "y": 448, "z": 0 }, { "x": 300, "y": 448, "z": -120 },
        { "x": 560, "y": 400, "z": 0 }, { "x": 640, "y": 380, "z": 0 },
        { "x": 900, "y": 448, "z": 120 }, { "x": 1040, "y": 448, "z": -120 },
        { "x": 1300, "y": 300, "z": 0 }, { "x": 1400, "y": 206, "z": 0 },
        { "x": 1720, "y": 220, "z": -160 }, { "x": 1860, "y": 220, "z": 160 },
        { "x": 2160, "y": 268, "z": -130 }, { "x": 2350, "y": 230, "z": 120 },
        { "x": 2540, "y": 190, "z": -90 }, { "x": 2730, "y": 154, "z": 70 },
        { "x": 3020, "y": 132, "z": 0 }, { "x": 3120, "y": 132, "z": -110 }
      ],
      "enemies": [
        { "x": 300, "y": 448, "v": 0, "hp": 3 },
        { "x": 1560, "y": 214, "v": 0, "hp": 3 },
        { "x": 1700, "y": 214, "v": 1, "hp": 3 },
        { "x": 1820, "y": 214, "v": 0, "hp": 3 },
        { "x": 1760, "y": 214, "v": 14, "hp": 4 }
      ],
      "powerupItems": [
        { "x": 1180, "y": 448, "type": "heal" }
      ],
      "spiritEmbers": [
        { "x": 1400, "y": 206, "collected": false, "idx": 0 },
        { "x": 2350, "y": 230, "collected": false, "idx": 1 },
        { "x": 3120, "y": 132, "collected": false, "idx": 2 }
      ],
      "signs": [
        { "x": 60, "y": 360, "w": 340, "title": "THE HIGH ROAD", "lines": ["A 3D GAUNTLET.", "USE EVERY ABILITY.", "SEE CONTROLS TOP-LEFT."], "color": "#8ec7ff" },
        { "x": 470, "y": 360, "w": 300, "title": "DASH THE GAP", "lines": ["TOO WIDE TO JUMP.", "SPRINT + E TO CHARGE ACROSS."], "color": "#ffd27f" },
        { "x": 1180, "y": 360, "w": 320, "title": "HOOK UP", "lines": ["THAT LEDGE IS TOO HIGH.", "PRESS H TO HOOK-SHOT UP."], "color": "#ffe08a" },
        { "x": 1640, "y": 150, "w": 320, "title": "SKIRL THE CROWD", "lines": ["DRUMS AHEAD.", "PRESS F FOR A SHOCKWAVE."], "color": "#9fe0ff" }
      ],
      "goalX": 3080,
      "goalY": 40,
      "timePar": 320,
      "timeGold": 230
    },
    {
      "name": "GLACIER RUN",
      "biome": "ice",
      "width": 3300,
      "mode3d": true,
      "bgColors": ["#3a5a86", "#7fb4dc"],
      "skyStars": false,
      "platColors": ["#8fc4dc", "#a9d8ec", "#bfe6f5", "#d6f2ff", "#eaffff"],
      "voidFloor": true,
      "voidY": 800,
      "startX": 60,
      "startY": 360,
      "platforms": [
        { "x": 0, "y": 470, "w": 420, "h": 170, "zc": 0, "zd": 160 },
        { "x": 560, "y": 445, "w": 230, "h": 30, "zc": 0, "zd": 130 },
        { "x": 880, "y": 415, "w": 230, "h": 30, "zc": 0, "zd": 130 },
        { "x": 1200, "y": 435, "w": 130, "h": 26, "zc": 0, "zd": 95, "kind": "bounce" },
        { "x": 1400, "y": 320, "w": 250, "h": 30, "zc": 0, "zd": 150 },
        { "x": 1760, "y": 315, "w": 240, "h": 30, "zc": 0, "zd": 140 },
        { "x": 2060, "y": 305, "w": 360, "h": 30, "zc": 0, "zd": 160 },
        { "x": 2500, "y": 285, "w": 420, "h": 70, "zc": 0, "zd": 200 },
        { "x": 980, "y": 380, "w": 150, "h": 24, "zc": 250, "zd": 80, "move": { "axis": "z", "dist": 90, "speed": 0.028 } }
      ],
      "spikes": [
        { "x": 2180, "y": 305 }, { "x": 2225, "y": 305 }, { "x": 2270, "y": 305 }
      ],
      "coins": [
        { "x": 160, "y": 440 }, { "x": 300, "y": 440 },
        { "x": 620, "y": 415 }, { "x": 940, "y": 385 },
        { "x": 1230, "y": 360 }, { "x": 1230, "y": 280 },
        { "x": 1480, "y": 290 }, { "x": 1830, "y": 285 },
        { "x": 2120, "y": 275 }, { "x": 2225, "y": 235 },
        { "x": 2560, "y": 245 }, { "x": 2700, "y": 245 },
        { "x": 1010, "y": 350, "z": 250 }, { "x": 1010, "y": 350, "z": 300 }
      ],
      "enemies": [
        { "x": 940, "y": 383, "v": 1, "hp": 3 },
        { "x": 1810, "y": 283, "v": 5, "hp": 3 },
        { "x": 2560, "y": 253, "v": 1, "hp": 4 }
      ],
      "powerupItems": [ { "x": 1480, "y": 290, "type": "heal" } ],
      "spiritEmbers": [
        { "x": 1010, "y": 320, "z": 270, "collected": false, "idx": 0 },
        { "x": 2225, "y": 231, "collected": false, "idx": 1 }
      ],
      "signs": [
        { "x": 40, "y": 360, "w": 340, "title": "GLACIER RUN", "lines": ["FOLLOW THE COINS UP.", "BOUNCE THE ICE PADS,", "HOP THE FROST SPIKES."], "color": "#bfe6f5" }
      ],
      "goalX": 2660,
      "goalY": 165,
      "timePar": 210,
      "timeGold": 150
    },
    {
      "name": "EMBERFALL",
      "biome": "lava",
      "width": 3300,
      "mode3d": true,
      "bgColors": ["#6a2418", "#d06a34"],
      "skyStars": false,
      "platColors": ["#3a2b2b", "#4a3636", "#553c3c", "#6a4a4a", "#7d5a5a"],
      "voidFloor": true,
      "voidY": 820,
      "startX": 60,
      "startY": 360,
      "platforms": [
        { "x": 0, "y": 470, "w": 420, "h": 170, "zc": 0, "zd": 160 },
        { "x": 430, "y": 600, "w": 640, "h": 120, "zc": 0, "zd": 200, "kind": "lava" },
        { "x": 560, "y": 440, "w": 160, "h": 26, "zc": 0, "zd": 120 },
        { "x": 820, "y": 420, "w": 160, "h": 26, "zc": 0, "zd": 120 },
        { "x": 1060, "y": 400, "w": 250, "h": 30, "zc": 0, "zd": 150 },
        { "x": 1380, "y": 420, "w": 130, "h": 26, "zc": 0, "zd": 95, "kind": "bounce" },
        { "x": 1580, "y": 310, "w": 250, "h": 30, "zc": 0, "zd": 150 },
        { "x": 1830, "y": 600, "w": 540, "h": 120, "zc": 0, "zd": 200, "kind": "lava" },
        { "x": 1920, "y": 320, "w": 150, "h": 26, "zc": 0, "zd": 110 },
        { "x": 2140, "y": 310, "w": 150, "h": 26, "zc": 0, "zd": 110 },
        { "x": 2360, "y": 300, "w": 320, "h": 30, "zc": 0, "zd": 150 },
        { "x": 2740, "y": 280, "w": 400, "h": 70, "zc": 0, "zd": 200 }
      ],
      "spikes": [
        { "x": 2470, "y": 300 }, { "x": 2515, "y": 300 }
      ],
      "coins": [
        { "x": 160, "y": 440 }, { "x": 300, "y": 440 },
        { "x": 620, "y": 410 }, { "x": 880, "y": 390 },
        { "x": 1160, "y": 370 }, { "x": 1410, "y": 360 }, { "x": 1410, "y": 280 },
        { "x": 1680, "y": 280 }, { "x": 1990, "y": 290 }, { "x": 2210, "y": 280 },
        { "x": 2460, "y": 250 }, { "x": 2800, "y": 240 }, { "x": 2920, "y": 240 }
      ],
      "enemies": [
        { "x": 1120, "y": 368, "v": 0, "hp": 3 },
        { "x": 1640, "y": 278, "v": 4, "hp": 3 },
        { "x": 2420, "y": 268, "v": 0, "hp": 4 }
      ],
      "powerupItems": [ { "x": 1060, "y": 370, "type": "heal" } ],
      "spiritEmbers": [
        { "x": 1680, "y": 246, "collected": false, "idx": 0 },
        { "x": 2920, "y": 206, "collected": false, "idx": 1 }
      ],
      "signs": [
        { "x": 40, "y": 360, "w": 360, "title": "EMBERFALL", "lines": ["CROSS THE LAVA ON THE STONES.", "DON'T TOUCH THE GLOWING ROCK!", "BOUNCE PAST THE PITS."], "color": "#ffb060" }
      ],
      "goalX": 2900,
      "goalY": 160,
      "timePar": 230,
      "timeGold": 165
    }
  ];
})();
