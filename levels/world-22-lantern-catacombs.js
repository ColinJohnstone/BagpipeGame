// levels/world-22-lantern-catacombs.js
// ──────────────────────────────────────────────────────────────────
// World 22 · LANTERN CATACOMBS 🏮 — halloween crypt, no weather.
// Signature mechanic: SOUNDWAVE reveal-platforms. Shoot to materialise
// footing across the dark between sparse lantern pools. Underground.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W22 = [

  // ════════════════════════════════════════════════════════════════
  // L1 — INTO THE LANTERN HALL (intro: teach soundwave reveal)
  // Gentle, mostly solid ground; a few soundwave gaps to learn the shot.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'INTO THE LANTERN HALL',
    width: 2400, goalX: 2280, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#0a0612', '#1a0e1f'],
    platColors: ['#0d0810', '#1e1218', '#3a2230', '#6e3a2a', '#d8902a'],
    accentColor: '#d8902a', accentColor2: '#a23aff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'halloween', weather: 'none',
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0,    y: 450, w: 2400, h: 60, type: 'ground' },
      // gentle steps up onto the first ledge
      { x: 300,  y: 390, w: 160, h: 18 },
      { x: 540,  y: 350, w: 140, h: 18 },
      // first soundwave gap — shoot to reveal the slab across the dark
      { x: 760,  y: 350, w: 120, h: 18, type: 'soundwave', _id: 'w22l1s1' },
      { x: 960,  y: 350, w: 160, h: 18 },
      // a lantern-lit solid rest
      { x: 1220, y: 320, w: 180, h: 18 },
      // two soundwave slabs in a row
      { x: 1480, y: 320, w: 110, h: 18, type: 'soundwave', _id: 'w22l1s2' },
      { x: 1680, y: 320, w: 110, h: 18, type: 'soundwave', _id: 'w22l1s3' },
      { x: 1880, y: 350, w: 160, h: 18 },
      { x: 2120, y: 390, w: 160, h: 18 },
      // goal landing
      { x: 2200, y: 450, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [],
    coins: [
      { x: 360, y: 350 }, { x: 600, y: 310 }, { x: 820, y: 310 },
      { x: 1020, y: 310 }, { x: 1280, y: 280 }, { x: 1540, y: 280 },
      { x: 1740, y: 280 }, { x: 1940, y: 310 }, { x: 2180, y: 350 },
    ],
    qblocks: [{ x: 980, y: 240 }],
    cblocks: [],
    trophies: [],
    powerupItems: [{ x: 1260, y: 270, type: 'rapid' }],
    enemies: [
      { x: 1000, y: 408, v: 0, hp: 2, elite: 'false' },
      { x: 1900, y: 308, v: 1, hp: 2, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 1680, y: 230, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 80, y: 230, w: 360, title: 'LANTERN HALL',
      lines: ['🏮 THE DARK HIDES THE PATH.', '🎵 SHOOT A SOUNDWAVE TO',
        'MATERIALISE FOOTING AHEAD.'],
      color: '#d8902a' }],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L2 — CRYPT OF ECHOES (develop: longer soundwave chains over pits)
  // Real spike pits now; soundwave slabs are the only way across.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'CRYPT OF ECHOES',
    width: 2700, goalX: 2580, goalY: 350,
    startX: 60, startY: 380,
    bgColors: ['#0a0612', '#1a0e1f'],
    platColors: ['#0d0810', '#1e1218', '#3a2230', '#6e3a2a', '#d8902a'],
    accentColor: '#d8902a', accentColor2: '#a23aff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'halloween', weather: 'none',
    timePar: 225, timeGold: 150,
    platforms: [
      { x: 0,    y: 450, w: 520, h: 60, type: 'ground' },
      // first spike pit, cross on a reveal slab
      { x: 380,  y: 380, w: 140, h: 18 },
      { x: 600,  y: 360, w: 110, h: 18, type: 'soundwave', _id: 'w22l2s1' },
      { x: 800,  y: 360, w: 150, h: 18 },
      // solid landing strip
      { x: 1020, y: 450, w: 360, h: 60, type: 'ground' },
      // staircase of reveal slabs climbing over a second pit
      { x: 1120, y: 380, w: 110, h: 18, type: 'soundwave', _id: 'w22l2s2' },
      { x: 1320, y: 340, w: 110, h: 18, type: 'soundwave', _id: 'w22l2s3' },
      { x: 1520, y: 300, w: 150, h: 18 },
      // descent + a crumble for variety
      { x: 1740, y: 330, w: 120, h: 18, type: 'crumble', _id: 'w22l2c1' },
      { x: 1940, y: 360, w: 120, h: 18, type: 'soundwave', _id: 'w22l2s4' },
      { x: 2140, y: 360, w: 140, h: 18 },
      // final reveal hop to goal ground
      { x: 2360, y: 380, w: 110, h: 18, type: 'soundwave', _id: 'w22l2s5' },
      { x: 2500, y: 450, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [
      { x: 520,  y: 440, w: 480, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1380, y: 440, w: 480, h: 24, rotation: 0, spikeType: 'static' },
      { x: 2280, y: 440, w: 200, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 420, y: 340 }, { x: 650, y: 320 }, { x: 850, y: 320 },
      { x: 1170, y: 340 }, { x: 1370, y: 300 }, { x: 1570, y: 260 },
      { x: 1790, y: 290 }, { x: 1990, y: 320 }, { x: 2190, y: 320 },
      { x: 2410, y: 340 },
    ],
    qblocks: [{ x: 1540, y: 230 }],
    cblocks: [{ x: 1080, y: 360, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 800, y: 300, type: 'big' }],
    enemies: [
      { x: 880,  y: 318, v: 1, hp: 2, elite: 'false' },
      { x: 1560, y: 258, v: 3, hp: 3, elite: 'false' },
      { x: 2180, y: 318, v: 4, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1180, y: 390, activated: false }],
    spiritEmbers: [{ x: 1740, y: 250, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L3 — TWIST: WHISPERING OSSUARY (soundwave + moving + conveyor)
  // Combine reveal slabs with a moving platform and a bone-belt conveyor.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'WHISPERING OSSUARY',
    width: 2900, goalX: 2780, goalY: 340,
    startX: 60, startY: 380,
    bgColors: ['#0a0612', '#1a0e1f'],
    platColors: ['#0d0810', '#1e1218', '#3a2230', '#6e3a2a', '#d8902a'],
    accentColor: '#d8902a', accentColor2: '#a23aff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'halloween', weather: 'none',
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0,    y: 450, w: 460, h: 60, type: 'ground' },
      { x: 320,  y: 380, w: 120, h: 18 },
      // reveal slab onto a conveyor that pushes you forward over a pit
      { x: 520,  y: 360, w: 110, h: 18, type: 'soundwave', _id: 'w22l3s1' },
      { x: 700,  y: 340, w: 200, h: 18, type: 'conveyor', dir: 1, speed: 2.0 },
      // catch ledge after the belt, then a reveal gap
      { x: 980,  y: 340, w: 130, h: 18 },
      { x: 1180, y: 320, w: 110, h: 18, type: 'soundwave', _id: 'w22l3s2' },
      // moving platform ferries across the wide chasm
      { x: 1380, y: 300, w: 130, h: 18 },
      // (moving plat defined below in movingPlats)
      { x: 1860, y: 300, w: 150, h: 18 },
      // reveal staircase climbing
      { x: 2080, y: 340, w: 110, h: 18, type: 'soundwave', _id: 'w22l3s3' },
      { x: 2280, y: 320, w: 110, h: 18, type: 'soundwave', _id: 'w22l3s4' },
      // reverse conveyor wall-walk down to goal
      { x: 2460, y: 360, w: 180, h: 18, type: 'conveyor', dir: -1, speed: 1.6 },
      { x: 2700, y: 430, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [],
    movingPlats: [
      { x: 1560, y: 300, x2: 1720, y2: 300, w: 120, h: 18, speed: 1.4 },
    ],
    switches: [],
    spikes: [
      { x: 460,  y: 440, w: 240, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1510, y: 440, w: 350, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 360, y: 340 }, { x: 560, y: 320 }, { x: 780, y: 300 },
      { x: 1020, y: 300 }, { x: 1220, y: 280 }, { x: 1620, y: 260 },
      { x: 1900, y: 260 }, { x: 2120, y: 300 }, { x: 2320, y: 280 },
      { x: 2520, y: 320 },
    ],
    qblocks: [{ x: 1420, y: 230 }],
    cblocks: [],
    trophies: [{ x: 1640, y: 200, collected: false }],
    powerupItems: [{ x: 980, y: 280, type: 'drum' }],
    enemies: [
      { x: 1020, y: 298, v: 5, hp: 3, elite: 'false' },
      { x: 1880, y: 258, v: 8, hp: 4, elite: 'false' },
      { x: 2480, y: 318, v: 4, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 980, y: 350, activated: false }],
    spiritEmbers: [{ x: 2280, y: 250, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L4 — CHALLENGE: GALLERY OF THE FORGOTTEN (dense reveal + timed)
  // Long reveal chains, timed phasing slabs, void floor section.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'GALLERY OF THE FORGOTTEN',
    width: 3100, goalX: 2980, goalY: 340,
    startX: 60, startY: 380,
    bgColors: ['#0a0612', '#1a0e1f'],
    platColors: ['#0d0810', '#1e1218', '#3a2230', '#6e3a2a', '#d8902a'],
    accentColor: '#d8902a', accentColor2: '#a23aff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'halloween', weather: 'none',
    timePar: 258, timeGold: 172,
    platforms: [
      { x: 0,    y: 450, w: 420, h: 60, type: 'ground' },
      { x: 300,  y: 390, w: 120, h: 18 },
      // reveal chain over first deep pit
      { x: 500,  y: 360, w: 100, h: 18, type: 'soundwave', _id: 'w22l4s1' },
      { x: 680,  y: 340, w: 100, h: 18, type: 'soundwave', _id: 'w22l4s2' },
      { x: 860,  y: 340, w: 140, h: 18 },
      // timed phasing slabs — shoot reveal between phases
      { x: 1080, y: 320, w: 120, h: 18, type: 'timed', period: 190, _id: 'w22l4t1' },
      { x: 1280, y: 320, w: 110, h: 18, type: 'soundwave', _id: 'w22l4s3' },
      { x: 1480, y: 300, w: 120, h: 18, type: 'timed', period: 200, _id: 'w22l4t2' },
      // mid solid rest with checkpoint
      { x: 1680, y: 340, w: 200, h: 18 },
      // long reveal staircase climbing high
      { x: 1920, y: 320, w: 100, h: 18, type: 'soundwave', _id: 'w22l4s4' },
      { x: 2100, y: 290, w: 100, h: 18, type: 'soundwave', _id: 'w22l4s5' },
      { x: 2280, y: 260, w: 100, h: 18, type: 'soundwave', _id: 'w22l4s6' },
      { x: 2460, y: 290, w: 120, h: 18 },
      // descent reveal hops to goal
      { x: 2660, y: 330, w: 100, h: 18, type: 'soundwave', _id: 'w22l4s7' },
      { x: 2840, y: 360, w: 120, h: 18 },
      { x: 2900, y: 430, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [
      { x: 420,  y: 440, w: 440, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1000, y: 440, w: 680, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1880, y: 440, w: 760, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 350, y: 350 }, { x: 540, y: 320 }, { x: 720, y: 300 },
      { x: 920, y: 300 }, { x: 1120, y: 280 }, { x: 1320, y: 280 },
      { x: 1520, y: 260 }, { x: 1740, y: 300 }, { x: 1960, y: 280 },
      { x: 2140, y: 250 }, { x: 2320, y: 220 }, { x: 2500, y: 250 },
      { x: 2700, y: 290 }, { x: 2880, y: 320 },
    ],
    qblocks: [{ x: 1740, y: 250 }],
    cblocks: [{ x: 1780, y: 250, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 1680, y: 270, type: 'rapid' }, { x: 2460, y: 220, type: 'shield' }],
    enemies: [
      { x: 880,  y: 298, v: 4, hp: 3, elite: 'false' },
      { x: 1700, y: 298, v: 5, hp: 4, elite: 'false' },
      { x: 1740, y: 298, v: 8, hp: 4, elite: 'false' },
      { x: 2480, y: 248, v: 12, hp: 4, elite: 'false' },
    ],
    checkpoints: [{ x: 1740, y: 300, activated: false }],
    spiritEmbers: [{ x: 2280, y: 200, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L5 — FINALE: HEART OF THE CATACOMBS (vertical set-piece + mini-boss)
  // Climb a pitch-black shaft of reveal slabs, then face a summoner.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'HEART OF THE CATACOMBS',
    width: 3000, goalX: 2880, goalY: 340,
    startX: 60, startY: 380,
    bgColors: ['#0a0612', '#1a0e1f'],
    platColors: ['#0d0810', '#1e1218', '#3a2230', '#6e3a2a', '#d8902a'],
    accentColor: '#d8902a', accentColor2: '#a23aff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'halloween', weather: 'none',
    timePar: 250, timeGold: 167,
    platforms: [
      { x: 0,    y: 450, w: 520, h: 60, type: 'ground' },
      // approach reveal hops
      { x: 360,  y: 390, w: 120, h: 18 },
      { x: 560,  y: 370, w: 100, h: 18, type: 'soundwave', _id: 'w22l5s1' },
      { x: 740,  y: 370, w: 140, h: 18 },
      // VERTICAL SHAFT — alternating reveal slabs climbing the dark
      { x: 920,  y: 350, w: 110, h: 18, type: 'soundwave', _id: 'w22l5s2' },
      { x: 1080, y: 290, w: 110, h: 18, type: 'soundwave', _id: 'w22l5s3' },
      { x: 920,  y: 230, w: 110, h: 18, type: 'soundwave', _id: 'w22l5s4' },
      { x: 1080, y: 170, w: 110, h: 18, type: 'soundwave', _id: 'w22l5s5' },
      // top of the shaft — solid bone gallery
      { x: 1260, y: 150, w: 240, h: 18 },
      // bridge across with reveal + crumble
      { x: 1560, y: 180, w: 110, h: 18, type: 'soundwave', _id: 'w22l5s6' },
      { x: 1760, y: 210, w: 120, h: 18, type: 'crumble', _id: 'w22l5c1' },
      { x: 1960, y: 250, w: 110, h: 18, type: 'soundwave', _id: 'w22l5s7' },
      // descend to the boss arena floor
      { x: 2140, y: 300, w: 140, h: 18 },
      { x: 2360, y: 360, w: 160, h: 18 },
      // BOSS ARENA — wide solid ground
      { x: 2540, y: 450, w: 460, h: 60, type: 'ground' },
      // goal pedestal
      { x: 2820, y: 430, w: 180, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [
      { x: 520,  y: 440, w: 220, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 400, y: 350 }, { x: 600, y: 330 }, { x: 800, y: 330 },
      { x: 960, y: 310 }, { x: 1120, y: 250 }, { x: 960, y: 190 },
      { x: 1120, y: 130 }, { x: 1340, y: 110 }, { x: 1600, y: 140 },
      { x: 1800, y: 170 }, { x: 2000, y: 210 }, { x: 2200, y: 260 },
      { x: 2420, y: 320 },
    ],
    qblocks: [{ x: 1340, y: 80 }],
    cblocks: [],
    trophies: [{ x: 1080, y: 110, collected: false }],
    powerupItems: [
      { x: 1380, y: 100, type: 'invincible' },
      { x: 2560, y: 390, type: 'heal' },
    ],
    enemies: [
      { x: 780,  y: 328, v: 3, hp: 3, elite: 'false' },
      { x: 1300, y: 108, v: 11, hp: 4, elite: 'false' },
      { x: 2160, y: 258, v: 13, hp: 4, elite: 'false' },
      // mini-boss summoner in the arena
      { x: 2700, y: 386, v: 98, hp: 34, w: 64, h: 64, elite: 'true' },
    ],
    checkpoints: [
      { x: 760, y: 380, activated: false },
      { x: 1300, y: 160, activated: false },
    ],
    spiritEmbers: [{ x: 1760, y: 160, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 540, y: 250, w: 360, title: 'THE HEART',
      lines: ['🏮 CLIMB THE BLACK SHAFT.', '🎵 EACH SLAB ANSWERS', 'YOUR SONG. THEN — THE END.'],
      color: '#d8902a' }],
    highlights: [],
  },

];
