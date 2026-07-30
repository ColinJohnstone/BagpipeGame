// levels/world-10-shadow-crucible.js
// ──────────────────────────────────────────────────────────────────
// World 10 · SHADOW CRUCIBLE — collectibles + enemy variety, plus
// the final gauntlet for the NEW LEVELS category.
// ──────────────────────────────────────────────────────────────────

(function () {
  const BG = ['#05000f', '#100020'];
  const PC = ['#080010', '#12001e', '#220040', '#3a0060', '#9030e0'];
  const base = (overrides) => Object.assign({
    bgColors: BG, platColors: PC, accentColor: '#9030e0', accentColor2: '#cc44ff',
    skyStars: true, misty: false, height: 560, voidFloor: false, voidY: 460,
    weather: 'none', startX: 60, startY: 380, goalY: 310,
    timePar: 280, timeGold: 180,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  window.LEVELS_W10 = [
    // L1 SILENT STEPS — silencer enemies, no abilities
    base({
      name: 'SILENT STEPS', width: 2400, goalX: 2300,
      platforms: [
        { x: 0,    y: 450, w: 2400, h: 60, type: 'ground' },
        { x: 220,  y: 380, w: 100, h: 18 }, { x: 380,  y: 320, w: 100, h: 18 },
        { x: 540,  y: 380, w: 100, h: 18 }, { x: 800,  y: 320, w: 100, h: 18 },
        { x: 1000, y: 280, w: 100, h: 18 }, { x: 1200, y: 320, w: 100, h: 18 },
        { x: 1400, y: 380, w: 100, h: 18 }, { x: 1600, y: 320, w: 100, h: 18 },
        { x: 1800, y: 280, w: 100, h: 18 }, { x: 2000, y: 320, w: 100, h: 18 },
      ],
      enemies: [
        { x: 460,  y: 408, v: 7, hp: 2, elite: 'false' },
        { x: 920,  y: 408, v: 7, hp: 2, elite: 'false' },
        { x: 1500, y: 408, v: 7, hp: 2, elite: 'false' },
        { x: 1900, y: 408, v: 7, hp: 2, elite: 'false' },
      ],
      coins: [
        { x: 260,  y: 340 }, { x: 580,  y: 340 }, { x: 1040, y: 240 },
        { x: 1640, y: 280 }, { x: 2040, y: 280 }, { x: 2200, y: 410 },
      ],
      spiritEmbers: [{ x: 1040, y: 100, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'SILENT STEPS',
        lines: ['🤫 SILENCERS DISABLE', 'YOUR ABILITIES.', '', 'JUMP. SLIP PAST.'],
        color: '#aaaaff' }],
    }),

    // L2 TWIN'S MIRROR — shadow twins (v=11), positioning matters
    base({
      name: "TWIN'S MIRROR", width: 2600, goalX: 2500,
      platforms: [
        { x: 0,    y: 450, w: 2600, h: 60, type: 'ground' },
        { x: 600,  y: 320, w: 200,  h: 18 },
        { x: 1100, y: 280, w: 200,  h: 18 },
        { x: 1600, y: 320, w: 200,  h: 18 },
        { x: 2100, y: 280, w: 200,  h: 18 },
      ],
      enemies: [
        { x: 700,  y: 280, v: 11, hp: 3, elite: 'false' },
        { x: 1200, y: 240, v: 11, hp: 3, elite: 'false' },
        { x: 1700, y: 280, v: 11, hp: 3, elite: 'false' },
        { x: 2200, y: 240, v: 11, hp: 3, elite: 'false' },
      ],
      coins: [
        { x: 300,  y: 410 }, { x: 700,  y: 280 }, { x: 1200, y: 240 },
        { x: 1700, y: 280 }, { x: 2200, y: 240 }, { x: 2400, y: 410 },
      ],
      spiritEmbers: [{ x: 1300, y: 80, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: "TWIN'S MIRROR",
        lines: ['👤 TWINS COPY YOUR MOVES.', 'POSITION FIRST,', 'STRIKE SECOND.'],
        color: '#cc44ff' }],
    }),

    // L3 EMBER HUNT — three hidden spirit embers
    base({
      name: 'EMBER HUNT', width: 3200, goalX: 3100,
      platforms: [
        { x: 0,    y: 450, w: 3200, h: 60, type: 'ground' },
        { x: 300,  y: 380, w: 80,  h: 18 }, { x: 200,  y: 320, w: 80,  h: 18 },
        { x: 300,  y: 260, w: 80,  h: 18 }, { x: 200,  y: 200, w: 80,  h: 18 },
        { x: 1000, y: 380, w: 200, h: 18, type: 'oneway' },
        { x: 1080, y: 440, w: 50,  h: 12 },
        { x: 2400, y: 432, w: 80,  h: 14 },
        { x: 2700, y: 280, w: 100, h: 18 },
        { x: 2900, y: 200, w: 100, h: 18 },
      ],
      bounces: [{ x: 2400, y: 432, w: 80, h: 14 }],
      coins: [{ x: 300, y: 410 }, { x: 1500, y: 410 }, { x: 2200, y: 410 }, { x: 3000, y: 410 }],
      spiritEmbers: [
        { x: 240,  y: 160, collected: false, idx: 0 },
        { x: 1080, y: 422, collected: false, idx: 1 },
        { x: 2940, y: 160, collected: false, idx: 2 },
      ],
      signs: [{ x: 60, y: 200, w: 320, title: 'EMBER HUNT',
        lines: ['THREE 🔥 EMBERS HIDE.', 'EXPLORE EVERY NOOK.'], color: '#ff8822' }],
    }),

    // L4 MARS BAR HEIST — collect all 5 to unseal the castle
    base({
      name: 'MARS BAR HEIST', width: 3600, goalX: 3500,
      platforms: [
        { x: 0,    y: 450, w: 3600, h: 60, type: 'ground' },
        { x: 300,  y: 360, w: 100,  h: 18 }, { x: 500,  y: 300, w: 100,  h: 18 },
        { x: 900,  y: 380, w: 100,  h: 18 }, { x: 1200, y: 320, w: 100,  h: 18 },
        { x: 1600, y: 280, w: 100,  h: 18 }, { x: 1900, y: 360, w: 100,  h: 18 },
        { x: 2300, y: 300, w: 100,  h: 18 }, { x: 2600, y: 380, w: 100,  h: 18 },
        { x: 3000, y: 320, w: 100,  h: 18 }, { x: 3300, y: 260, w: 100,  h: 18 },
      ],
      marsBarPieces: [
        { x: 540,  y: 280, collected: false, idx: 0 },
        { x: 1240, y: 300, collected: false, idx: 1 },
        { x: 1940, y: 340, collected: false, idx: 2 },
        { x: 2640, y: 360, collected: false, idx: 3 },
        { x: 3340, y: 240, collected: false, idx: 4 },
      ],
      enemies: [
        { x: 700,  y: 408, v: 0, hp: 2, elite: 'false' },
        { x: 1500, y: 408, v: 3, hp: 2, elite: 'false' },
        { x: 2200, y: 408, v: 4, hp: 2, elite: 'false' },
        { x: 2900, y: 408, v: 1, hp: 2, elite: 'false' },
      ],
      coins: [{ x: 200, y: 410 }, { x: 1100, y: 410 }, { x: 2000, y: 410 }, { x: 3200, y: 410 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'MARS BAR HEIST',
        lines: ['🍫 GRAB ALL 5 PIECES.', 'CASTLE STAYS SEALED', 'UNTIL EVERY ONE IS YOURS.'],
        color: '#c8642a' }],
    }),

    // L5 THE FINAL CRUCIBLE — all foes, all tools, one path
    base({
      name: 'THE FINAL CRUCIBLE', width: 3800, goalX: 3700,
      platforms: [
        { x: 0,    y: 450, w: 3800, h: 60, type: 'ground' },
        { x: 300,  y: 380, w: 100,  h: 18 },
        { x: 500,  y: 320, w: 100,  h: 18 },
        { x: 1100, y: 380, w: 100,  h: 18 },
        { x: 1300, y: 320, w: 100,  h: 18 },
        { x: 1900, y: 360, w: 120,  h: 18, type: 'crumble' },
        { x: 2100, y: 320, w: 120,  h: 18, type: 'crumble' },
        { x: 2400, y: 380, w: 100,  h: 18, type: 'oneway' },
        { x: 2900, y: 380, w: 80,   h: 18, type: 'breakshot', _id: 'w10l5b1' },
        { x: 2900, y: 348, w: 80,   h: 18, type: 'breakshot', _id: 'w10l5b2' },
        { x: 2900, y: 316, w: 80,   h: 18, type: 'breakshot', _id: 'w10l5b3' },
      ],
      spikes: [{ x: 1500, y: 434, w: 220, h: 20, rotation: 0, spikeType: 'static' }],
      bounces: [{ x: 1480, y: 432, w: 60, h: 14 }],
      enemies: [
        { x: 400,  y: 408, v: 0,  hp: 2, elite: 'false' },
        { x: 800,  y: 408, v: 1,  hp: 2, elite: 'false' },
        { x: 1200, y: 408, v: 3,  hp: 2, elite: 'false' },
        { x: 1800, y: 408, v: 4,  hp: 2, elite: 'false' },
        { x: 2300, y: 408, v: 7,  hp: 2, elite: 'false' },
        { x: 2700, y: 408, v: 11, hp: 3, elite: 'false' },
        { x: 3300, y: 408, v: 0,  hp: 3, elite: 'true'  },
        // BOSS: 3-phase, telegraphed attacks. Defeating it auto-completes
        // the level — no need to walk further. (v: 99, hp: 30, 64x64.)
        { x: 3520, y: 384, v: 99, hp: 30, w: 64, h: 64, elite: 'false' },
      ],
      trophies: [{ x: 2200, y: 410, collected: false }],
      powerupItems: [{ x: 1700, y: 380, type: 'shield' }, { x: 3100, y: 380, type: 'heal' }],
      coins: [
        { x: 200,  y: 410 }, { x: 1000, y: 410 }, { x: 2000, y: 410 },
        { x: 2600, y: 410 }, { x: 3200, y: 410 }, { x: 3500, y: 410 },
      ],
      spiritEmbers: [{ x: 1900, y: 280, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: 'THE FINAL CRUCIBLE',
        lines: ['ALL FOES.', 'ALL TOOLS.', 'ONE PATH.'], color: '#cc44ff' }],
    }),
  ];
})();
