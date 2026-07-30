// levels/world-14-hollow-shivers.js
// ──────────────────────────────────────────────────────────────────
// World 14 · HOLLOW SHIVERS — halloween theme, day/night cycle.
// Fall-away tombs, magnetic cauldrons, grapple hook chains.
// ──────────────────────────────────────────────────────────────────

(function () {
  const base = (overrides) => Object.assign({
    bgColors: ['#0a0410', '#1c0a18'],
    platColors: ['#0a0408', '#1c0a14', '#3c1828', '#7a2a44', '#ff7a18'],
    accentColor: '#ff7a18', accentColor2: '#aa3aff',
    skyStars: true, misty: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'halloween', weather: 'daynight',
    startX: 60, startY: 380, goalY: 310,
    timePar: 260, timeGold: 170,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  window.LEVELS_W14 = [
    // L1 GRAVEYARD WALK — fallaway tombs under day/night cycle
    base({
      name: 'HAUNT GRAVEYARD WALK', width: 2600, goalX: 2500,
      platforms: [
        { x: 0,    y: 450, w: 2600, h: 60, type: 'ground' },
        { x: 280,  y: 380, w: 120, h: 18, type: 'fallaway', _id: 'w14l1f1' },
        { x: 460,  y: 340, w: 120, h: 18, type: 'fallaway', _id: 'w14l1f2' },
        { x: 640,  y: 300, w: 120, h: 18 },
        { x: 820,  y: 340, w: 120, h: 18, type: 'fallaway', _id: 'w14l1f3' },
        { x: 1000, y: 300, w: 120, h: 18, type: 'fallaway', _id: 'w14l1f4' },
        { x: 1200, y: 260, w: 120, h: 18 },
        { x: 1400, y: 300, w: 120, h: 18, type: 'fallaway', _id: 'w14l1f5' },
        { x: 1580, y: 340, w: 120, h: 18, type: 'fallaway', _id: 'w14l1f6' },
        { x: 1780, y: 300, w: 120, h: 18 },
        { x: 1980, y: 340, w: 140, h: 18, type: 'fallaway', _id: 'w14l1f7' },
        { x: 2180, y: 300, w: 140, h: 18 },
        { x: 2380, y: 260, w: 220, h: 18 },
      ],
      coins: [
        { x: 320,  y: 340 }, { x: 680,  y: 260 }, { x: 1040, y: 260 },
        { x: 1240, y: 220 }, { x: 1620, y: 300 }, { x: 2020, y: 300 },
        { x: 2420, y: 220 },
      ],
      enemies: [
        { x: 800,  y: 408, v: 3, hp: 2, elite: 'false' },
        { x: 1800, y: 408, v: 4, hp: 2, elite: 'false' },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'GRAVEYARD WALK',
        lines: ['🪦 TOMB SLABS CRUMBLE.', '🌗 NIGHT FALLS — KEEP', 'YOUR PACE STEADY.'],
        color: '#ff7a18' }],
    }),

    // L2 WITCH'S BREW — acidrain weather, magnetic cauldrons
    base({
      name: 'WITCH BREW HALLOWEEN', width: 2800, goalX: 2700, goalY: 240, timePar: 280, timeGold: 180,
      weather: 'acidrain',
      platforms: [
        { x: 0,    y: 450, w: 2800, h: 60, type: 'ground' },
        { x: 240,  y: 380, w: 120, h: 18 },
        { x: 460,  y: 340, w: 32,  h: 32, type: 'magnetic', radius: 130, pull: 0.65 },
        { x: 560,  y: 300, w: 120, h: 18 },
        { x: 780,  y: 260, w: 32,  h: 32, type: 'magnetic', radius: 130, pull: 0.65 },
        { x: 880,  y: 280, w: 120, h: 18 },
        { x: 1100, y: 240, w: 32,  h: 32, type: 'magnetic', radius: 140, pull: 0.7 },
        { x: 1200, y: 240, w: 120, h: 18 },
        { x: 1420, y: 280, w: 120, h: 18 },
        { x: 1620, y: 240, w: 32,  h: 32, type: 'magnetic', radius: 140, pull: 0.7 },
        { x: 1720, y: 240, w: 120, h: 18 },
        { x: 1940, y: 280, w: 120, h: 18 },
        { x: 2160, y: 240, w: 32,  h: 32, type: 'magnetic', radius: 150, pull: 0.75 },
        { x: 2260, y: 240, w: 120, h: 18 },
        { x: 2480, y: 280, w: 220, h: 18 },
      ],
      coins: [
        { x: 280,  y: 340 }, { x: 600,  y: 260 }, { x: 920,  y: 240 },
        { x: 1240, y: 200 }, { x: 1740, y: 200 }, { x: 2300, y: 200 },
        { x: 2520, y: 240 },
      ],
      enemies: [
        { x: 1450, y: 278, v: 3, hp: 2, elite: 'false' },
        { x: 1970, y: 278, v: 4, hp: 2, elite: 'false' },
      ],
      spiritEmbers: [{ x: 1120, y: 180, collected: false, idx: 0 }],
      signs: [{ x: 60, y: 200, w: 340, title: "WITCH'S BREW",
        lines: ['☢ ACID RAIN STINGS —', 'TAKE COVER UNDER LEDGES.', '🧲 CAULDRONS PULL YOU CLOSE.'],
        color: '#aa3aff' }],
    }),

    // L3 HAUNT BRIDGE — grapple hook chains across the chasm
    base({
      name: 'PUMPKIN HAUNT BRIDGE', width: 3000, goalX: 2900, goalY: 240, timePar: 300, timeGold: 200,
      platforms: [
        { x: 0,    y: 450, w: 600,  h: 60, type: 'ground' },
        { x: 700,  y: 280, w: 24,   h: 24, type: 'grapplehook' },
        { x: 820,  y: 360, w: 120,  h: 18 },
        { x: 1020, y: 220, w: 24,   h: 24, type: 'grapplehook' },
        { x: 1140, y: 320, w: 120,  h: 18 },
        { x: 1340, y: 180, w: 24,   h: 24, type: 'grapplehook' },
        { x: 1460, y: 280, w: 120,  h: 18 },
        { x: 1660, y: 160, w: 24,   h: 24, type: 'grapplehook' },
        { x: 1780, y: 240, w: 120,  h: 18 },
        { x: 1980, y: 140, w: 24,   h: 24, type: 'grapplehook' },
        { x: 2100, y: 220, w: 120,  h: 18 },
        { x: 2300, y: 320, w: 140,  h: 18, type: 'fallaway', _id: 'w14l3f1' },
        { x: 2480, y: 280, w: 140,  h: 18, type: 'fallaway', _id: 'w14l3f2' },
        { x: 2660, y: 240, w: 340,  h: 18 },
        { x: 2660, y: 450, w: 340,  h: 60, type: 'ground' },
      ],
      coins: [
        { x: 720,  y: 240 }, { x: 1040, y: 180 }, { x: 1360, y: 140 },
        { x: 1680, y: 120 }, { x: 2000, y: 100 }, { x: 2330, y: 280 },
        { x: 2700, y: 200 },
      ],
      enemies: [
        { x: 840,  y: 358, v: 0, hp: 2, elite: 'false' },
        { x: 1480, y: 278, v: 3, hp: 2, elite: 'false' },
        { x: 2680, y: 238, v: 0, hp: 3, elite: 'true' },
      ],
      spiritEmbers: [
        { x: 1700, y: 80,  collected: false, idx: 0 },
        { x: 2520, y: 220, collected: false, idx: 1 },
      ],
      signs: [{ x: 60, y: 200, w: 340, title: 'HAUNT BRIDGE',
        lines: ['🪝 THE NEAREST HOOK', 'GLOWS WHEN IN RANGE.', 'JUMP TO LET GO.'],
        color: '#ff7a18' }],
    }),
  ];
})();
