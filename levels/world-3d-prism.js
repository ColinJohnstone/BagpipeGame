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
      "startX": 120,
      "startY": 380,
      "platforms": [
        { "x": 0, "y": 500, "w": 1520, "h": 240, "zc": 0, "zd": 430 },
        { "x": 180, "y": 402, "w": 210, "h": 26, "zc": -270, "zd": 110 },
        { "x": 470, "y": 360, "w": 200, "h": 26, "zc": 250, "zd": 110 },
        { "x": 520, "y": 404, "w": 190, "h": 26, "zc": -30, "zd": 100 },
        { "x": 860, "y": 336, "w": 220, "h": 26, "zc": 130, "zd": 120 },
        { "x": 880, "y": 392, "w": 180, "h": 26, "zc": -260, "zd": 100 },
        { "x": 1180, "y": 356, "w": 210, "h": 26, "zc": 290, "zd": 100 },
        { "x": 700, "y": 252, "w": 220, "h": 26, "zc": -120, "zd": 110 },
        { "x": 1040, "y": 300, "w": 180, "h": 24, "zc": -20, "zd": 95 },
        { "x": 1120, "y": 224, "w": 260, "h": 28, "zc": 30, "zd": 130 }
      ],
      "coins": [
        { "x": 320, "y": 470, "z": -260 }, { "x": 620, "y": 470, "z": 210 },
        { "x": 900, "y": 470, "z": -150 }, { "x": 1180, "y": 470, "z": 260 },
        { "x": 430, "y": 470, "z": 20 }, { "x": 760, "y": 470, "z": 300 },
        { "x": 260, "y": 372, "z": -270 }, { "x": 560, "y": 330, "z": 250 },
        { "x": 940, "y": 306, "z": 130 }, { "x": 1250, "y": 326, "z": 290 },
        { "x": 760, "y": 222, "z": -120 }, { "x": 1000, "y": 250, "z": -20 },
        { "x": 1180, "y": 194, "z": 30 }, { "x": 620, "y": 470, "z": -300 }
      ],
      "enemies": [
        { "x": 360, "y": 466, "v": 0, "hp": 3 },
        { "x": 640, "y": 466, "v": 1, "hp": 3 },
        { "x": 500, "y": 466, "v": 0, "hp": 3 },
        { "x": 980, "y": 466, "v": 14, "hp": 4 },
        { "x": 1120, "y": 466, "v": 0, "hp": 4 }
      ],
      "powerupItems": [
        { "x": 900, "y": 470, "type": "heal" }
      ],
      "spiritEmbers": [
        { "x": 760, "y": 222, "collected": false, "idx": 0 },
        { "x": 1180, "y": 194, "collected": false, "idx": 1 }
      ],
      "goalX": 1180,
      "goalY": 96,
      "timePar": 240,
      "timeGold": 170
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
    }
  ];
})();
