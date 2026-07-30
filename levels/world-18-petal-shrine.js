// levels/world-18-petal-shrine.js
// ──────────────────────────────────────────────────────────────────
// World 18 · PETAL SHRINE — cherry theme, day/night cycle.
// Showcase for v=14 BERSERKER enemies. Calm patrol until HP drops
// below 50%, then they enter a red-aura frenzy and lunge harder.
// Mixed with magnetic anchors for floaty traversal.
// ──────────────────────────────────────────────────────────────────

(function () {
  const base = (overrides) => Object.assign({
    bgColors: ['#1a0a14', '#3a1a28'],
    platColors: ['#2a0c1a', '#4a1d2c', '#8a3a52', '#d068a0', '#ffb0d8'],
    accentColor: '#ff6aa6', accentColor2: '#ffd0e8',
    skyStars: true, misty: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'cherry', weather: 'daynight',
    startX: 60, startY: 380, goalY: 310,
    timePar: 280, timeGold: 180,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  window.LEVELS_W18 = [
    // L1 BLOSSOM BRIDGE — magnetic anchors + intro berserkers
    base({
      name: 'PETAL BLOSSOM BRIDGE', width: 2800, goalX: 2700,
      platforms: [
        { x: 0,    y: 450, w: 600,  h: 60, type: 'ground' },
        { x: 700,  y: 380, w: 120, h: 18 },
        { x: 880,  y: 340, w: 32,  h: 32, type: 'magnetic', radius: 140, pull: 0.7 },
        { x: 980,  y: 320, w: 120, h: 18 },
        { x: 1180, y: 280, w: 32,  h: 32, type: 'magnetic', radius: 140, pull: 0.7 },
        { x: 1280, y: 280, w: 120, h: 18 },
        { x: 1480, y: 240, w: 32,  h: 32, type: 'magnetic', radius: 150, pull: 0.75 },
        { x: 1580, y: 280, w: 120, h: 18 },
        { x: 1780, y: 320, w: 120, h: 18 },
        { x: 1980, y: 280, w: 120, h: 18 },
        { x: 2180, y: 320, w: 200, h: 18 },
        { x: 2440, y: 280, w: 360, h: 60, type: 'ground' },
      ],
      coins: [
        { x: 740,  y: 340 }, { x: 1020, y: 280 }, { x: 1320, y: 240 },
        { x: 1620, y: 240 }, { x: 1820, y: 280 }, { x: 2020, y: 240 },
        { x: 2220, y: 280 }, { x: 2520, y: 240 },
      ],
      enemies: [
        // Two berserkers — patrol calmly until you damage them
        { x: 1000, y: 288, v: 14, hp: 6, elite: 'false' },
        { x: 1820, y: 288, v: 14, hp: 6, elite: 'false' },
        { x: 2520, y: 248, v: 14, hp: 6, elite: 'false' },
      ],
      spiritEmbers: [{ x: 1320, y: 200, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'BLOSSOM BRIDGE',
        lines: ['🌸 BERSERKERS GO RED', 'AT HALF HP — THEY LUNGE.', 'FINISH THEM FAST.'],
        color: '#ff6aa6' }],
    }),

    // L2 PAGODA CLIMB — vertical climb with grapple hooks + berserkers
    base({
      name: 'PETAL PAGODA CLIMB', width: 1800, height: 1000, voidY: 940, goalY: 100,
      timePar: 280, timeGold: 200,
      platforms: [
        { x: 0,    y: 940, w: 1800, h: 60, type: 'ground' },
        { x: 240,  y: 800, w: 160, h: 18 },
        { x: 480,  y: 720, w: 24,  h: 24, type: 'grapplehook' },
        { x: 600,  y: 680, w: 160, h: 18 },
        { x: 840,  y: 600, w: 24,  h: 24, type: 'grapplehook' },
        { x: 960,  y: 560, w: 160, h: 18 },
        { x: 1200, y: 480, w: 24,  h: 24, type: 'grapplehook' },
        { x: 1320, y: 440, w: 160, h: 18 },
        { x: 1560, y: 360, w: 24,  h: 24, type: 'grapplehook' },
        { x: 1320, y: 300, w: 160, h: 18 },
        { x: 1080, y: 240, w: 160, h: 18 },
        { x: 840,  y: 180, w: 160, h: 18 },
        { x: 600,  y: 140, w: 280, h: 18 },
      ],
      coins: [
        { x: 280,  y: 760 }, { x: 640,  y: 640 }, { x: 1000, y: 520 },
        { x: 1360, y: 400 }, { x: 1360, y: 260 }, { x: 1120, y: 200 },
        { x: 880,  y: 140 }, { x: 700,  y: 100 },
      ],
      enemies: [
        // Berserkers on the climbing platforms — frenzy at half HP and
        // try to bull-rush you off the ledge
        { x: 280,  y: 768, v: 14, hp: 6, elite: 'false' },
        { x: 640,  y: 648, v: 14, hp: 6, elite: 'false' },
        { x: 1000, y: 528, v: 14, hp: 7, elite: 'false' },
        { x: 1360, y: 408, v: 14, hp: 7, elite: 'false' },
        { x: 1360, y: 268, v: 14, hp: 8, elite: 'true' },
      ],
      powerupItems: [{ x: 1120, y: 200, type: 'shield', collected: false }],
      spiritEmbers: [{ x: 880, y: 140, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 800, w: 320, title: 'PAGODA CLIMB',
        lines: ['🪝 GRAPPLE TO ASCEND.', 'KILL BERSERKERS QUICKLY', 'BEFORE THEY FRENZY.'],
        color: '#d068a0' }],
    }),

    // L3 THE LAST WARDEN — boss finale + berserker swarm
    base({
      name: 'PETAL THE LAST WARDEN', width: 3200, goalX: 3100, goalY: 220,
      timePar: 320, timeGold: 220,
      platforms: [
        { x: 0,    y: 450, w: 1300, h: 60, type: 'ground' },
        { x: 200,  y: 380, w: 140, h: 18 },
        { x: 420,  y: 320, w: 140, h: 18 },
        { x: 640,  y: 280, w: 140, h: 18 },
        { x: 860,  y: 320, w: 140, h: 18 },
        { x: 1080, y: 380, w: 140, h: 18 },
        // Boss arena
        { x: 1400, y: 450, w: 1800, h: 60, type: 'ground' },
        { x: 1600, y: 360, w: 80,  h: 18 },
        { x: 1900, y: 300, w: 80,  h: 18 },
        { x: 2200, y: 360, w: 80,  h: 18 },
        { x: 2500, y: 300, w: 80,  h: 18 },
        { x: 2800, y: 240, w: 240, h: 18 },
      ],
      coins: [
        { x: 240,  y: 340 }, { x: 460,  y: 280 }, { x: 680,  y: 240 },
        { x: 900,  y: 280 }, { x: 1120, y: 340 },
        { x: 1640, y: 320 }, { x: 1940, y: 260 }, { x: 2240, y: 320 },
        { x: 2540, y: 260 }, { x: 2840, y: 200 },
      ],
      enemies: [
        // Approach: 4 berserkers (calm) + 1 elite
        { x: 460,  y: 288, v: 14, hp: 6, elite: 'false' },
        { x: 900,  y: 288, v: 14, hp: 6, elite: 'false' },
        { x: 1100, y: 348, v: 14, hp: 8, elite: 'true'  },
        // Boss arena: more berserkers flanking
        { x: 1640, y: 328, v: 14, hp: 6, elite: 'false' },
        { x: 2240, y: 328, v: 14, hp: 6, elite: 'false' },
        // BOSS
        { x: 2100, y: 384, v: 99, hp: 30, w: 64, h: 64, elite: 'false' },
      ],
      powerupItems: [
        { x: 1500, y: 410, type: 'shield', collected: false },
        { x: 2700, y: 200, type: 'heal',   collected: false },
      ],
      spiritEmbers: [
        { x: 680,  y: 220, collected: false, idx: 0 },
        { x: 2840, y: 100, collected: false, idx: 1 },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'THE LAST WARDEN',
        lines: ['🌸 ALL FOES BLOOM RED.', 'KILL THEM CALM IF YOU CAN.', 'THE WARDEN GUARDS THE GATE.'],
        color: '#ffd0e8' }],
    }),
  ];
})();
