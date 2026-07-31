// levels/world-06-new-levels.js
// ──────────────────────────────────────────────────────────────────
// World 6 · NEW LEVELS — bonus levels from W7+ expansion
// Exposes window.LEVELS_W6.
// ──────────────────────────────────────────────────────────────────

(function () {
  window.LEVELS_W6 = [
    {
      "name": "HIGHLAND CROSSING",
      "width": 3600,
      "bgColors": [
        "#0d1b35",
        "#1a3050"
      ],
      "skyStars": true,
      "misty": true,
      "platColors": [
        "#1a3010",
        "#243a18",
        "#3a7a28",
        "#4a9a32",
        "#5ab840"
      ],
      "voidFloor": false,
      "startX": 60,
      "startY": 380,
      "platforms": [
        {
          "x": 0,
          "y": 450,
          "w": 3600,
          "h": 60
        },
        {
          "x": 160,
          "y": 400,
          "w": 80,
          "h": 18
        },
        {
          "x": 280,
          "y": 360,
          "w": 80,
          "h": 18
        },
        {
          "x": 420,
          "y": 320,
          "w": 100,
          "h": 18
        },
        {
          "x": 550,
          "y": 380,
          "w": 120,
          "h": 18
        },
        {
          "x": 590,
          "y": 310,
          "w": 80,
          "h": 12,
          "type": "oneway"
        },
        {
          "x": 720,
          "y": 350,
          "w": 100,
          "h": 18
        },
        {
          "x": 860,
          "y": 370,
          "w": 90,
          "h": 18,
          "type": "crumble"
        },
        {
          "x": 980,
          "y": 350,
          "w": 90,
          "h": 18,
          "type": "crumble"
        },
        {
          "x": 1100,
          "y": 330,
          "w": 90,
          "h": 18,
          "type": "crumble"
        },
        {
          "x": 1220,
          "y": 360,
          "w": 140,
          "h": 18
        },
        {
          "x": 1230,
          "y": 344,
          "w": 60,
          "h": 12,
          "type": "oneway"
        },
        {
          "x": 1420,
          "y": 340,
          "w": 100,
          "h": 18
        },
        {
          "x": 1560,
          "y": 300,
          "w": 100,
          "h": 18
        },
        {
          "x": 1700,
          "y": 260,
          "w": 100,
          "h": 18
        },
        {
          "x": 1840,
          "y": 220,
          "w": 120,
          "h": 18
        },
        {
          "x": 2000,
          "y": 300,
          "w": 140,
          "h": 18,
          "type": "soundwave",
          "_id": "sw1"
        },
        {
          "x": 2180,
          "y": 260,
          "w": 120,
          "h": 18
        },
        {
          "x": 2180,
          "y": 200,
          "w": 120,
          "h": 12,
          "type": "oneway"
        },
        {
          "x": 2350,
          "y": 280,
          "w": 100,
          "h": 18,
          "type": "switchA",
          "switchGroup": "A"
        },
        {
          "x": 2350,
          "y": 200,
          "w": 100,
          "h": 18,
          "type": "switchA",
          "switchGroup": "A"
        },
        {
          "x": 2500,
          "y": 320,
          "w": 100,
          "h": 18
        },
        {
          "x": 2680,
          "y": 360,
          "w": 100,
          "h": 18
        },
        {
          "x": 2820,
          "y": 330,
          "w": 100,
          "h": 18
        },
        {
          "x": 2980,
          "y": 380,
          "w": 120,
          "h": 18
        },
        {
          "x": 3100,
          "y": 340,
          "w": 100,
          "h": 18
        },
        {
          "x": 3220,
          "y": 290,
          "w": 100,
          "h": 18
        },
        {
          "x": 3350,
          "y": 240,
          "w": 100,
          "h": 18
        },
        {
          "x": 3450,
          "y": 180,
          "w": 140,
          "h": 18
        }
      ],
      "icePlats": [
        {
          "x": 1840,
          "y": 200,
          "w": 80,
          "h": 12
        }
      ],
      "movingPlats": [
        {
          "x": 2620,
          "y": 340,
          "w": 80,
          "h": 14,
          "x1": 2620,
          "y1": 340,
          "x2": 2620,
          "y2": 200,
          "speed": 1.2,
          "_cx": 2620,
          "_cy": 340,
          "_t": 0
        }
      ],
      "switches": [
        {
          "x": 2460,
          "y": 320,
          "w": 22,
          "h": 22,
          "group": "A",
          "active": true
        }
      ],
      "enemies": [
        {
          "x": 350,
          "y": 410,
          "v": 0,
          "hp": 2,
          "vx": -1
        },
        {
          "x": 700,
          "y": 310,
          "v": 0,
          "hp": 2,
          "vx": 1
        },
        {
          "x": 1260,
          "y": 320,
          "v": 0,
          "hp": 2,
          "vx": -1
        },
        {
          "x": 1700,
          "y": 220,
          "v": 3,
          "hp": 3,
          "vx": 1
        },
        {
          "x": 2190,
          "y": 220,
          "v": 4,
          "hp": 2,
          "vx": -1
        },
        {
          "x": 2510,
          "y": 280,
          "v": 0,
          "hp": 2,
          "vx": 1
        },
        {
          "x": 2830,
          "y": 290,
          "v": 5,
          "hp": 4,
          "vx": -1
        },
        {
          "x": 3100,
          "y": 300,
          "v": 7,
          "hp": 5,
          "vx": 1
        },
        {
          "x": 3360,
          "y": 200,
          "v": 10,
          "hp": 3,
          "vx": -1
        }
      ],
      "coins": [
        {
          "x": 200,
          "y": 370
        },
        {
          "x": 310,
          "y": 330
        },
        {
          "x": 450,
          "y": 290
        },
        {
          "x": 600,
          "y": 350
        },
        {
          "x": 650,
          "y": 350
        },
        {
          "x": 740,
          "y": 320
        },
        {
          "x": 1230,
          "y": 310
        },
        {
          "x": 1260,
          "y": 310
        },
        {
          "x": 1290,
          "y": 310
        },
        {
          "x": 1570,
          "y": 270
        },
        {
          "x": 1720,
          "y": 230
        },
        {
          "x": 1860,
          "y": 190
        },
        {
          "x": 2030,
          "y": 270
        },
        {
          "x": 2070,
          "y": 270
        },
        {
          "x": 2210,
          "y": 230
        },
        {
          "x": 2510,
          "y": 290
        },
        {
          "x": 2860,
          "y": 300
        },
        {
          "x": 3230,
          "y": 260
        }
      ],
      "spikes": [
        {
          "x": 860,
          "y": 432,
          "w": 90,
          "h": 16,
          "spikeType": "static"
        },
        {
          "x": 2350,
          "y": 260,
          "w": 50,
          "h": 16,
          "spikeType": "popA"
        },
        {
          "x": 2420,
          "y": 260,
          "w": 50,
          "h": 16,
          "spikeType": "popB"
        }
      ],
      "bounces": [
        {
          "x": 1560,
          "y": 316,
          "w": 50,
          "h": 14,
          "rotation": 0
        },
        {
          "x": 3100,
          "y": 356,
          "w": 50,
          "h": 14,
          "rotation": 45
        }
      ],
      "qblocks": [
        {
          "x": 480,
          "y": 280,
          "hit": false
        },
        {
          "x": 1440,
          "y": 260,
          "hit": false
        },
        {
          "x": 2200,
          "y": 140,
          "hit": false
        }
      ],
      "checkpoints": [
        {
          "x": 1200,
          "y": 340,
          "activated": false
        },
        {
          "x": 2500,
          "y": 300,
          "activated": false
        }
      ],
      "spiritEmbers": [
        {
          "x": 595,
          "y": 278,
          "collected": false,
          "idx": 0
        },
        {
          "x": 1845,
          "y": 188,
          "collected": false,
          "idx": 1
        },
        {
          "x": 3225,
          "y": 258,
          "collected": false,
          "idx": 2
        }
      ],
      "powerupItems": [
        {
          "x": 900,
          "y": 300,
          "type": "rapid",
          "collected": false
        },
        {
          "x": 2050,
          "y": 230,
          "type": "invincible",
          "collected": false
        },
        {
          "x": 3110,
          "y": 308,
          "type": "extrajump",
          "collected": false
        }
      ],
      "marsBarPieces": [
        {
          "x": 600,
          "y": 355,
          "collected": false,
          "idx": 0
        },
        {
          "x": 1560,
          "y": 275,
          "collected": false,
          "idx": 1
        },
        {
          "x": 2040,
          "y": 270,
          "collected": false,
          "idx": 2
        },
        {
          "x": 2860,
          "y": 305,
          "collected": false,
          "idx": 3
        },
        {
          "x": 3395,
          "y": 210,
          "collected": false,
          "idx": 4
        }
      ],
      "goalX": 3480,
      "goalY": 100,
      "timePar": 220,
      "timeGold": 160
    },
    {
      "name": "LEVIATHAN RUN",
      "width": 5200,
      "voidFloor": true,
      "voidY": 470,
      "seaChase": {
        "speed": 2.58,
        "startX": -440,
        "camLead": 95,
        "killDist": 228
      },
      "bgColors": [
        "#010814",
        "#051830"
      ],
      "skyStars": false,
      "misty": false,
      "platColors": [
        "#0a2040",
        "#143060",
        "#1e4888",
        "#2860aa",
        "#3278cc"
      ],
      "startX": 130,
      "startY": 330,
      "platforms": [
        {
          "x": 0,
          "y": 360,
          "w": 400,
          "h": 18
        },
        {
          "x": 400,
          "y": 360,
          "w": 62,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g1a"
        },
        {
          "x": 462,
          "y": 360,
          "w": 58,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g1b"
        },
        {
          "x": 400,
          "y": 328,
          "w": 120,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g1c"
        },
        {
          "x": 400,
          "y": 296,
          "w": 120,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g1d"
        },
        {
          "x": 400,
          "y": 264,
          "w": 120,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g1e"
        },
        {
          "x": 400,
          "y": 232,
          "w": 120,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g1f"
        },
        {
          "x": 520,
          "y": 360,
          "w": 900,
          "h": 18
        },
        {
          "x": 1080,
          "y": 330,
          "w": 120,
          "h": 18
        },
        {
          "x": 1260,
          "y": 300,
          "w": 100,
          "h": 18
        },
        {
          "x": 1420,
          "y": 360,
          "w": 360,
          "h": 18
        },
        {
          "x": 1780,
          "y": 360,
          "w": 70,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g2a"
        },
        {
          "x": 1850,
          "y": 360,
          "w": 70,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g2b"
        },
        {
          "x": 1780,
          "y": 328,
          "w": 140,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g2c"
        },
        {
          "x": 1780,
          "y": 296,
          "w": 140,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g2d"
        },
        {
          "x": 1780,
          "y": 264,
          "w": 140,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g2e"
        },
        {
          "x": 1920,
          "y": 360,
          "w": 920,
          "h": 18
        },
        {
          "x": 2360,
          "y": 300,
          "w": 90,
          "h": 18
        },
        {
          "x": 2840,
          "y": 360,
          "w": 500,
          "h": 18
        },
        {
          "x": 3340,
          "y": 360,
          "w": 70,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g3a"
        },
        {
          "x": 3410,
          "y": 360,
          "w": 70,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g3b"
        },
        {
          "x": 3340,
          "y": 328,
          "w": 140,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g3c"
        },
        {
          "x": 3340,
          "y": 296,
          "w": 140,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g3d"
        },
        {
          "x": 3340,
          "y": 264,
          "w": 140,
          "h": 18,
          "type": "breakshot",
          "_id": "lr_g3e"
        },
        {
          "x": 3480,
          "y": 360,
          "w": 780,
          "h": 18
        },
        {
          "x": 4320,
          "y": 310,
          "w": 120,
          "h": 18
        },
        {
          "x": 4520,
          "y": 280,
          "w": 140,
          "h": 18
        },
        {
          "x": 4720,
          "y": 250,
          "w": 180,
          "h": 18
        },
        {
          "x": 4940,
          "y": 220,
          "w": 200,
          "h": 18
        }
      ],
      "movingPlats": [
        {
          "x": 2100,
          "y": 360,
          "w": 75,
          "h": 14,
          "x2": 2460,
          "y2": 300,
          "speed": 2.3,
          "_t": 0,
          "_dir": 1,
          "_cx": 2100,
          "_cy": 360
        },
        {
          "x": 3800,
          "y": 380,
          "w": 80,
          "h": 14,
          "x2": 4100,
          "y2": 300,
          "speed": 2.5,
          "_t": 0,
          "_dir": 1,
          "_cx": 3800,
          "_cy": 380
        }
      ],
      "bounces": [
        {
          "x": 340,
          "y": 356,
          "w": 52,
          "h": 14,
          "rotation": 0
        },
        {
          "x": 620,
          "y": 356,
          "w": 52,
          "h": 14,
          "rotation": 0
        },
        {
          "x": 1180,
          "y": 326,
          "w": 52,
          "h": 14,
          "rotation": 22
        },
        {
          "x": 1640,
          "y": 356,
          "w": 52,
          "h": 14,
          "rotation": 0
        },
        {
          "x": 2100,
          "y": 326,
          "w": 52,
          "h": 14,
          "rotation": 45
        },
        {
          "x": 2580,
          "y": 316,
          "w": 52,
          "h": 14,
          "rotation": 0
        },
        {
          "x": 3180,
          "y": 336,
          "w": 52,
          "h": 14,
          "rotation": 30
        },
        {
          "x": 3640,
          "y": 356,
          "w": 52,
          "h": 14,
          "rotation": 0
        },
        {
          "x": 4200,
          "y": 306,
          "w": 52,
          "h": 14,
          "rotation": 40
        },
        {
          "x": 4840,
          "y": 216,
          "w": 56,
          "h": 14,
          "rotation": 0
        }
      ],
      "enemies": [
        {
          "x": 1320,
          "y": 256,
          "v": 5,
          "hp": 5
        },
        {
          "x": 2380,
          "y": 316,
          "v": 5,
          "hp": 5
        },
        {
          "x": 4040,
          "y": 316,
          "v": 5,
          "hp": 6
        }
      ],
      "coins": [
        {
          "x": 280,
          "y": 310
        },
        {
          "x": 760,
          "y": 310
        },
        {
          "x": 1180,
          "y": 300
        },
        {
          "x": 1620,
          "y": 310
        },
        {
          "x": 2240,
          "y": 310
        },
        {
          "x": 3000,
          "y": 300
        },
        {
          "x": 3620,
          "y": 310
        },
        {
          "x": 4120,
          "y": 270
        },
        {
          "x": 5020,
          "y": 190
        }
      ],
      "qblocks": [
        {
          "x": 900,
          "y": 290,
          "hit": false
        },
        {
          "x": 2280,
          "y": 280,
          "hit": false
        },
        {
          "x": 3920,
          "y": 280,
          "hit": false
        }
      ],
      "checkpoints": [
        {
          "x": 1550,
          "y": 300,
          "activated": false
        },
        {
          "x": 3180,
          "y": 300,
          "activated": false
        }
      ],
      "spikes": [],
      "powerupItems": [
        {
          "x": 450,
          "y": 310,
          "type": "rapid",
          "collected": false
        },
        {
          "x": 980,
          "y": 290,
          "type": "chargerefresh",
          "collected": false
        },
        {
          "x": 2060,
          "y": 310,
          "type": "rapid",
          "collected": false
        },
        {
          "x": 3120,
          "y": 300,
          "type": "chargerefresh",
          "collected": false
        },
        {
          "x": 3660,
          "y": 280,
          "type": "extrajump",
          "collected": false
        },
        {
          "x": 4580,
          "y": 240,
          "type": "rapid",
          "collected": false
        }
      ],
      "spiritEmbers": [
        {
          "x": 860,
          "y": 290,
          "collected": false,
          "idx": 0
        },
        {
          "x": 2500,
          "y": 270,
          "collected": false,
          "idx": 1
        },
        {
          "x": 4180,
          "y": 260,
          "collected": false,
          "idx": 2
        }
      ],
      "goalX": 5080,
      "goalY": 120,
      "timePar": 200,
      "timeGold": 135
    },
    {
      "name": "SHADOW ECHO",
      "width": 3400,
      "bgColors": [
        "#0a0818",
        "#140830"
      ],
      "skyStars": true,
      "misty": true,
      "platColors": [
        "#1a0a2a",
        "#2a1040",
        "#3a1a5a",
        "#4a2280",
        "#5a2a9a"
      ],
      "voidFloor": false,
      "startX": 80,
      "startY": 380,
      "platforms": [
        {
          "x": 0,
          "y": 450,
          "w": 3400,
          "h": 60
        },
        {
          "x": 180,
          "y": 400,
          "w": 90,
          "h": 18
        },
        {
          "x": 360,
          "y": 360,
          "w": 100,
          "h": 18,
          "type": "crumble",
          "_id": "se_c1"
        },
        {
          "x": 520,
          "y": 320,
          "w": 100,
          "h": 18,
          "type": "crumble",
          "_id": "se_c2"
        },
        {
          "x": 700,
          "y": 380,
          "w": 140,
          "h": 18
        },
        {
          "x": 900,
          "y": 380,
          "w": 150,
          "h": 18,
          "type": "soundwave",
          "_id": "se_sw1"
        },
        {
          "x": 1120,
          "y": 330,
          "w": 90,
          "h": 12,
          "type": "oneway"
        },
        {
          "x": 1280,
          "y": 290,
          "w": 100,
          "h": 18
        },
        {
          "x": 1460,
          "y": 380,
          "w": 100,
          "h": 18,
          "type": "switchA",
          "switchGroup": "NX"
        },
        {
          "x": 1460,
          "y": 260,
          "w": 100,
          "h": 18,
          "type": "switchA",
          "switchGroup": "NX"
        },
        {
          "x": 1620,
          "y": 380,
          "w": 100,
          "h": 18,
          "type": "switchB",
          "switchGroup": "NX"
        },
        {
          "x": 1800,
          "y": 340,
          "w": 120,
          "h": 18
        },
        {
          "x": 2000,
          "y": 380,
          "w": 70,
          "h": 18,
          "type": "breakshot",
          "_id": "se_b1"
        },
        {
          "x": 2070,
          "y": 380,
          "w": 70,
          "h": 18,
          "type": "breakshot",
          "_id": "se_b2"
        },
        {
          "x": 2160,
          "y": 380,
          "w": 700,
          "h": 18
        },
        {
          "x": 2920,
          "y": 320,
          "w": 120,
          "h": 18
        },
        {
          "x": 3140,
          "y": 260,
          "w": 140,
          "h": 18
        }
      ],
      "icePlats": [
        {
          "x": 740,
          "y": 346,
          "w": 70,
          "h": 14
        }
      ],
      "movingPlats": [
        {
          "x": 2320,
          "y": 380,
          "w": 75,
          "h": 14,
          "x2": 2550,
          "y2": 300,
          "speed": 2,
          "_t": 0,
          "_dir": 1,
          "_cx": 2320,
          "_cy": 380
        }
      ],
      "switches": [
        {
          "x": 1540,
          "y": 320,
          "w": 26,
          "h": 26,
          "switchGroup": "NX",
          "_hit": false,
          "_hitTimer": 0
        }
      ],
      "bounces": [
        {
          "x": 400,
          "y": 396,
          "w": 52,
          "h": 14,
          "rotation": 0
        },
        {
          "x": 1860,
          "y": 336,
          "w": 52,
          "h": 14,
          "rotation": 40
        }
      ],
      "enemies": [
        {
          "x": 520,
          "y": 280,
          "v": 11,
          "hp": 52
        },
        {
          "x": 1380,
          "y": 250,
          "v": 3,
          "hp": 3
        },
        {
          "x": 2480,
          "y": 340,
          "v": 5,
          "hp": 5
        },
        {
          "x": 3000,
          "y": 220,
          "v": 8,
          "hp": 5
        }
      ],
      "coins": [
        {
          "x": 220,
          "y": 370
        },
        {
          "x": 420,
          "y": 330
        },
        {
          "x": 760,
          "y": 350
        },
        {
          "x": 980,
          "y": 350
        },
        {
          "x": 1200,
          "y": 300
        },
        {
          "x": 1360,
          "y": 250
        },
        {
          "x": 1720,
          "y": 310
        },
        {
          "x": 2040,
          "y": 350
        },
        {
          "x": 2380,
          "y": 350
        },
        {
          "x": 2760,
          "y": 290
        },
        {
          "x": 3180,
          "y": 230
        }
      ],
      "checkpoints": [
        {
          "x": 880,
          "y": 360,
          "activated": false
        },
        {
          "x": 2140,
          "y": 360,
          "activated": false
        }
      ],
      "spikes": [
        {
          "x": 1040,
          "y": 432,
          "w": 70,
          "h": 16,
          "spikeType": "static"
        }
      ],
      "qblocks": [
        {
          "x": 340,
          "y": 300,
          "hit": false
        },
        {
          "x": 1900,
          "y": 280,
          "hit": false
        }
      ],
      "spiritEmbers": [
        {
          "x": 540,
          "y": 278,
          "collected": false,
          "idx": 0
        },
        {
          "x": 1500,
          "y": 218,
          "collected": false,
          "idx": 1
        },
        {
          "x": 2700,
          "y": 288,
          "collected": false,
          "idx": 2
        }
      ],
      "powerupItems": [
        {
          "x": 800,
          "y": 330,
          "type": "rapid",
          "collected": false
        },
        {
          "x": 1700,
          "y": 290,
          "type": "chargerefresh",
          "collected": false
        },
        {
          "x": 2880,
          "y": 270,
          "type": "extrajump",
          "collected": false
        }
      ],
      "marsBarPieces": [
        {
          "x": 460,
          "y": 308,
          "collected": false,
          "idx": 0
        },
        {
          "x": 1320,
          "y": 248,
          "collected": false,
          "idx": 1
        },
        {
          "x": 2260,
          "y": 328,
          "collected": false,
          "idx": 2
        },
        {
          "x": 3040,
          "y": 218,
          "collected": false,
          "idx": 3
        },
        {
          "x": 3240,
          "y": 198,
          "collected": false,
          "idx": 4
        }
      ],
      "goalX": 3320,
      "goalY": 180,
      "timePar": 245,
      "timeGold": 178
    },
    {
      "name": "FRACTURED GATE",
      "width": 3600,
      "voidFloor": true,
      "voidY": 468,
      "bgColors": [
        "#050a14",
        "#081830"
      ],
      "skyStars": false,
      "misty": false,
      "platColors": [
        "#0a2040",
        "#143060",
        "#1e4888",
        "#2860aa",
        "#3278cc"
      ],
      "startX": 100,
      "startY": 340,
      "platforms": [
        {
          "x": 0,
          "y": 360,
          "w": 420,
          "h": 18
        },
        {
          "x": 420,
          "y": 360,
          "w": 65,
          "h": 18,
          "type": "breakshot",
          "_id": "fg_b1"
        },
        {
          "x": 485,
          "y": 360,
          "w": 65,
          "h": 18,
          "type": "breakshot",
          "_id": "fg_b2"
        },
        {
          "x": 420,
          "y": 328,
          "w": 130,
          "h": 18,
          "type": "breakshot",
          "_id": "fg_b3"
        },
        {
          "x": 420,
          "y": 296,
          "w": 130,
          "h": 18,
          "type": "breakshot",
          "_id": "fg_b4"
        },
        {
          "x": 550,
          "y": 360,
          "w": 850,
          "h": 18
        },
        {
          "x": 1480,
          "y": 320,
          "w": 100,
          "h": 18,
          "type": "crumble",
          "_id": "fg_c1"
        },
        {
          "x": 1620,
          "y": 300,
          "w": 100,
          "h": 18,
          "type": "crumble",
          "_id": "fg_c2"
        },
        {
          "x": 1760,
          "y": 360,
          "w": 520,
          "h": 18
        },
        {
          "x": 2320,
          "y": 360,
          "w": 120,
          "h": 18,
          "type": "soundwave",
          "_id": "fg_sw"
        },
        {
          "x": 2520,
          "y": 340,
          "w": 90,
          "h": 12,
          "type": "oneway"
        },
        {
          "x": 2680,
          "y": 300,
          "w": 100,
          "h": 18
        },
        {
          "x": 2860,
          "y": 360,
          "w": 100,
          "h": 18,
          "type": "switchA",
          "switchGroup": "FG"
        },
        {
          "x": 2860,
          "y": 240,
          "w": 100,
          "h": 18,
          "type": "switchB",
          "switchGroup": "FG"
        },
        {
          "x": 3020,
          "y": 360,
          "w": 420,
          "h": 18
        },
        {
          "x": 3280,
          "y": 300,
          "w": 140,
          "h": 18
        }
      ],
      "icePlats": [
        {
          "x": 1180,
          "y": 346,
          "w": 90,
          "h": 14
        },
        {
          "x": 1310,
          "y": 346,
          "w": 90,
          "h": 14
        }
      ],
      "movingPlats": [
        {
          "x": 1980,
          "y": 360,
          "w": 80,
          "h": 14,
          "x2": 2220,
          "y2": 300,
          "speed": 2.2,
          "_t": 0,
          "_dir": 1,
          "_cx": 1980,
          "_cy": 360
        }
      ],
      "switches": [
        {
          "x": 2780,
          "y": 320,
          "w": 26,
          "h": 26,
          "switchGroup": "FG",
          "_hit": false,
          "_hitTimer": 0
        }
      ],
      "bounces": [
        {
          "x": 680,
          "y": 356,
          "w": 52,
          "h": 14,
          "rotation": 0
        },
        {
          "x": 2100,
          "y": 356,
          "w": 52,
          "h": 14,
          "rotation": 50
        },
        {
          "x": 3160,
          "y": 336,
          "w": 52,
          "h": 14,
          "rotation": 0
        }
      ],
      "enemies": [
        {
          "x": 350,
          "y": 320,
          "v": 11,
          "hp": 55
        },
        {
          "x": 1200,
          "y": 280,
          "v": 4,
          "hp": 4
        },
        {
          "x": 2440,
          "y": 320,
          "v": 7,
          "hp": 6
        },
        {
          "x": 3180,
          "y": 260,
          "v": 10,
          "hp": 5
        }
      ],
      "coins": [
        {
          "x": 280,
          "y": 330
        },
        {
          "x": 720,
          "y": 330
        },
        {
          "x": 1040,
          "y": 310
        },
        {
          "x": 1540,
          "y": 290
        },
        {
          "x": 1840,
          "y": 330
        },
        {
          "x": 2380,
          "y": 330
        },
        {
          "x": 2760,
          "y": 280
        },
        {
          "x": 3080,
          "y": 330
        },
        {
          "x": 3380,
          "y": 270
        }
      ],
      "checkpoints": [
        {
          "x": 900,
          "y": 340,
          "activated": false
        },
        {
          "x": 2580,
          "y": 340,
          "activated": false
        }
      ],
      "spikes": [
        {
          "x": 1400,
          "y": 412,
          "w": 60,
          "h": 16,
          "spikeType": "popA"
        }
      ],
      "qblocks": [
        {
          "x": 900,
          "y": 260,
          "hit": false
        },
        {
          "x": 2400,
          "y": 280,
          "hit": false
        }
      ],
      "spiritEmbers": [
        {
          "x": 620,
          "y": 310,
          "collected": false,
          "idx": 0
        },
        {
          "x": 1900,
          "y": 320,
          "collected": false,
          "idx": 1
        },
        {
          "x": 3120,
          "y": 280,
          "collected": false,
          "idx": 2
        }
      ],
      "powerupItems": [
        {
          "x": 520,
          "y": 310,
          "type": "rapid",
          "collected": false
        },
        {
          "x": 1720,
          "y": 290,
          "type": "chargerefresh",
          "collected": false
        },
        {
          "x": 2920,
          "y": 310,
          "type": "invincible",
          "collected": false
        }
      ],
      "goalX": 3520,
      "goalY": 220,
      "timePar": 255,
      "timeGold": 185
    },
    {
      "name": "CADENCE SPIRE",
      "width": 3800,
      "bgColors": [
        "#0d1020",
        "#152040"
      ],
      "skyStars": true,
      "misty": true,
      "platColors": [
        "#1a3010",
        "#243a18",
        "#3a7a28",
        "#4a9a32",
        "#5ab840"
      ],
      "voidFloor": false,
      "startX": 70,
      "startY": 370,
      "platforms": [
        {
          "x": 0,
          "y": 450,
          "w": 3800,
          "h": 60
        },
        {
          "x": 200,
          "y": 400,
          "w": 100,
          "h": 18
        },
        {
          "x": 400,
          "y": 360,
          "w": 90,
          "h": 12,
          "type": "oneway"
        },
        {
          "x": 560,
          "y": 320,
          "w": 100,
          "h": 18
        },
        {
          "x": 740,
          "y": 400,
          "w": 130,
          "h": 18
        },
        {
          "x": 950,
          "y": 360,
          "w": 110,
          "h": 18,
          "type": "soundwave",
          "_id": "cs_sw1"
        },
        {
          "x": 1180,
          "y": 300,
          "w": 100,
          "h": 18
        },
        {
          "x": 1360,
          "y": 380,
          "w": 100,
          "h": 18,
          "type": "switchA",
          "switchGroup": "CS"
        },
        {
          "x": 1360,
          "y": 260,
          "w": 100,
          "h": 18,
          "type": "switchB",
          "switchGroup": "CS"
        },
        {
          "x": 1540,
          "y": 340,
          "w": 120,
          "h": 18
        },
        {
          "x": 1760,
          "y": 380,
          "w": 80,
          "h": 18,
          "type": "breakshot",
          "_id": "cs_bs1"
        },
        {
          "x": 1840,
          "y": 380,
          "w": 80,
          "h": 18,
          "type": "breakshot",
          "_id": "cs_bs2"
        },
        {
          "x": 1940,
          "y": 380,
          "w": 700,
          "h": 18
        },
        {
          "x": 2720,
          "y": 340,
          "w": 100,
          "h": 18,
          "type": "crumble",
          "_id": "cs_c1"
        },
        {
          "x": 2880,
          "y": 300,
          "w": 100,
          "h": 18,
          "type": "crumble",
          "_id": "cs_c2"
        },
        {
          "x": 3040,
          "y": 380,
          "w": 500,
          "h": 18
        },
        {
          "x": 3580,
          "y": 320,
          "w": 140,
          "h": 18
        }
      ],
      "icePlats": [
        {
          "x": 2140,
          "y": 346,
          "w": 100,
          "h": 14
        },
        {
          "x": 2280,
          "y": 346,
          "w": 100,
          "h": 14
        }
      ],
      "movingPlats": [
        {
          "x": 3200,
          "y": 380,
          "w": 80,
          "h": 14,
          "x2": 3450,
          "y2": 300,
          "speed": 2.3,
          "_t": 0,
          "_dir": 1,
          "_cx": 3200,
          "_cy": 380
        }
      ],
      "switches": [
        {
          "x": 1280,
          "y": 320,
          "w": 26,
          "h": 26,
          "switchGroup": "CS",
          "_hit": false,
          "_hitTimer": 0
        }
      ],
      "bounces": [
        {
          "x": 320,
          "y": 436,
          "w": 56,
          "h": 14,
          "rotation": 0
        },
        {
          "x": 1620,
          "y": 356,
          "w": 52,
          "h": 14,
          "rotation": 45
        },
        {
          "x": 3300,
          "y": 356,
          "w": 52,
          "h": 14,
          "rotation": 0
        }
      ],
      "enemies": [
        {
          "x": 480,
          "y": 280,
          "v": 11,
          "hp": 60
        },
        {
          "x": 1100,
          "y": 260,
          "v": 9,
          "hp": 5
        },
        {
          "x": 2060,
          "y": 340,
          "v": 5,
          "hp": 6
        },
        {
          "x": 2920,
          "y": 260,
          "v": 8,
          "hp": 6
        }
      ],
      "coins": [
        {
          "x": 240,
          "y": 370
        },
        {
          "x": 600,
          "y": 290
        },
        {
          "x": 820,
          "y": 370
        },
        {
          "x": 1040,
          "y": 330
        },
        {
          "x": 1260,
          "y": 270
        },
        {
          "x": 1480,
          "y": 310
        },
        {
          "x": 1820,
          "y": 350
        },
        {
          "x": 2480,
          "y": 350
        },
        {
          "x": 2840,
          "y": 270
        },
        {
          "x": 3240,
          "y": 350
        },
        {
          "x": 3520,
          "y": 290
        }
      ],
      "checkpoints": [
        {
          "x": 1000,
          "y": 380,
          "activated": false
        },
        {
          "x": 2400,
          "y": 380,
          "activated": false
        }
      ],
      "spikes": [
        {
          "x": 700,
          "y": 432,
          "w": 80,
          "h": 18,
          "spikeType": "static"
        },
        {
          "x": 2620,
          "y": 432,
          "w": 70,
          "h": 18,
          "spikeType": "static"
        }
      ],
      "qblocks": [
        {
          "x": 700,
          "y": 330,
          "hit": false
        },
        {
          "x": 2100,
          "y": 320,
          "hit": false
        },
        {
          "x": 3380,
          "y": 260,
          "hit": false
        }
      ],
      "spiritEmbers": [
        {
          "x": 880,
          "y": 330,
          "collected": false,
          "idx": 0
        },
        {
          "x": 1780,
          "y": 340,
          "collected": false,
          "idx": 1
        },
        {
          "x": 3160,
          "y": 340,
          "collected": false,
          "idx": 2
        }
      ],
      "powerupItems": [
        {
          "x": 520,
          "y": 350,
          "type": "rapid",
          "collected": false
        },
        {
          "x": 1640,
          "y": 330,
          "type": "drum",
          "collected": false
        },
        {
          "x": 2880,
          "y": 330,
          "type": "extrajump",
          "collected": false
        }
      ],
      "marsBarPieces": [
        {
          "x": 540,
          "y": 358,
          "collected": false,
          "idx": 0
        },
        {
          "x": 1520,
          "y": 338,
          "collected": false,
          "idx": 1
        },
        {
          "x": 2320,
          "y": 358,
          "collected": false,
          "idx": 2
        },
        {
          "x": 3080,
          "y": 358,
          "collected": false,
          "idx": 3
        },
        {
          "x": 3640,
          "y": 298,
          "collected": false,
          "idx": 4
        }
      ],
      "goalX": 3720,
      "goalY": 240,
      "timePar": 270,
      "timeGold": 198
    }
  ];
})();
