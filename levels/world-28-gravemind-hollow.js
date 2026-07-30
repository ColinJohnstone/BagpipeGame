// levels/world-28-gravemind-hollow.js
// ──────────────────────────────────────────────────────────────────
// World 28 · GRAVEMIND HOLLOW 💀 — shadow theme, fog weather.
// Signature: TELEPORTER (v13) + SILENCER (v10) foes among ROTATING
// hazards. Read teleport rhythms, your abilities die near silencers,
// and spinning blades sweep the haunted hollow. Difficulty climbs L1→L5.
// ──────────────────────────────────────────────────────────────────

window.LEVELS_W28 = [

  // ════════════════════════════════════════════════════════════════
  // L1 — WHISPERS IN THE FOG (intro: meet the teleporter, gentle)
  // Mostly solid ground, one rotating hazard, a single teleporter to
  // learn its blink pattern. Wide footing, forgiving gaps.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'WHISPERS IN THE FOG',
    width: 2400, goalX: 2280, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#080610', '#181028'],
    platColors: ['#0a0814', '#16101f', '#2a2038', '#46365a', '#8a6acc'],
    accentColor: '#8a6acc', accentColor2: '#c0a0ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'shadow', weather: 'fog',
    timePar: 200, timeGold: 133,
    platforms: [
      { x: 0,    y: 450, w: 2400, h: 60, type: 'ground' },
      // gentle climb onto the first crypt ledge
      { x: 320,  y: 390, w: 180, h: 18 },
      { x: 580,  y: 350, w: 160, h: 18 },
      { x: 840,  y: 350, w: 160, h: 18 },
      // a small drop to ground, then a raised tomb slab
      { x: 1180, y: 380, w: 200, h: 18 },
      { x: 1460, y: 340, w: 180, h: 18 },
      { x: 1720, y: 340, w: 160, h: 18 },
      { x: 1960, y: 380, w: 180, h: 18 },
      // goal landing
      { x: 2180, y: 450, w: 220, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [
      { x: 1040, y: 426, w: 120, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 380, y: 350 }, { x: 620, y: 310 }, { x: 880, y: 310 },
      { x: 1220, y: 340 }, { x: 1500, y: 300 }, { x: 1760, y: 300 },
      { x: 2000, y: 340 }, { x: 2240, y: 410 },
    ],
    qblocks: [{ x: 880, y: 250 }],
    cblocks: [],
    trophies: [],
    powerupItems: [{ x: 1500, y: 260, type: 'rapid' }],
    enemies: [
      { x: 600, y: 308, v: 0, hp: 2, elite: 'false' },
      // first teleporter — blinks around the open ground, easy to read
      { x: 1300, y: 408, v: 13, hp: 3, elite: 'false' },
      { x: 1980, y: 338, v: 1, hp: 2, elite: 'false' },
    ],
    checkpoints: [],
    spiritEmbers: [{ x: 1720, y: 260, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 80, y: 230, w: 380, title: 'GRAVEMIND HOLLOW',
      lines: ['💀 THE DEAD WALK THE FOG.', '👁 TELEPORTERS BLINK — WATCH',
        'THEIR RHYTHM, STRIKE WHEN THEY LAND.'],
      color: '#8a6acc' }],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L2 — THE SILENT TOMBS (develop: meet the silencer + rotating blade)
  // Abilities suppressed near the silencer — you must pass it on foot.
  // First real rotating hazard sweeping a corridor.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'THE SILENT TOMBS',
    width: 2700, goalX: 2580, goalY: 360,
    startX: 60, startY: 380,
    bgColors: ['#080610', '#181028'],
    platColors: ['#0a0814', '#16101f', '#2a2038', '#46365a', '#8a6acc'],
    accentColor: '#8a6acc', accentColor2: '#c0a0ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'shadow', weather: 'fog',
    timePar: 225, timeGold: 150,
    platforms: [
      { x: 0,    y: 450, w: 2700, h: 60, type: 'ground' },
      { x: 300,  y: 380, w: 160, h: 18 },
      { x: 540,  y: 340, w: 150, h: 18 },
      { x: 780,  y: 320, w: 150, h: 18 },
      // ledge approach to the silencer corridor (no abilities here)
      { x: 1020, y: 360, w: 220, h: 18 },
      { x: 1320, y: 340, w: 160, h: 18 },
      // rotating blade sweeps this gap — time the jump
      { x: 1560, y: 340, w: 140, h: 18 },
      { x: 1820, y: 360, w: 180, h: 18 },
      { x: 2100, y: 340, w: 160, h: 18 },
      { x: 2340, y: 380, w: 160, h: 18 },
      { x: 2480, y: 450, w: 220, h: 60, type: 'ground' },
    ],
    icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [
      { x: 1700, y: 426, w: 120, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 360, y: 340 }, { x: 600, y: 300 }, { x: 840, y: 280 },
      { x: 1080, y: 320 }, { x: 1360, y: 300 }, { x: 1620, y: 300 },
      { x: 1880, y: 320 }, { x: 2140, y: 300 }, { x: 2400, y: 340 },
    ],
    qblocks: [{ x: 1100, y: 270 }],
    cblocks: [{ x: 1360, y: 230, hits: 3 }],
    trophies: [],
    powerupItems: [{ x: 2160, y: 250, type: 'shield' }],
    // rotating hazard between the mid platforms
    movingPlats: [],
    enemies: [
      { x: 580, y: 298, v: 1, hp: 2, elite: 'false' },
      // silencer sits in the corridor — abilities die nearby, pass on foot
      { x: 1110, y: 318, v: 10, hp: 3, elite: 'false' },
      { x: 1840, y: 318, v: 0, hp: 3, elite: 'false' },
      { x: 2120, y: 298, v: 13, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 1320, y: 290, activated: false }],
    spiritEmbers: [{ x: 780, y: 240, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 80, y: 230, w: 380, title: 'THE SILENT TOMBS',
      lines: ['🔇 SILENCERS SMOTHER YOUR POWER.', '🦶 NO SHOTS, NO TRICKS —',
        'PASS THEM ON YOUR FEET.'],
      color: '#8a6acc' }],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L3 — TWIST: SPINNING GRAVES (combine: rotating gauntlet + blink foes)
  // Rotating platforms AND a rotating hazard, teleporters blinking onto
  // your landings. Vertical-leaning middle section over a spike pit.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'SPINNING GRAVES',
    width: 2900, goalX: 2780, goalY: 350,
    startX: 60, startY: 380,
    bgColors: ['#070510', '#160e26'],
    platColors: ['#0a0814', '#16101f', '#2a2038', '#46365a', '#8a6acc'],
    accentColor: '#8a6acc', accentColor2: '#c0a0ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'shadow', weather: 'fog',
    timePar: 242, timeGold: 161,
    platforms: [
      { x: 0,    y: 450, w: 760, h: 60, type: 'ground' },
      { x: 300,  y: 380, w: 150, h: 18 },
      { x: 520,  y: 340, w: 140, h: 18 },
      // vertical climb over a spike pit (no ground here)
      { x: 760,  y: 360, w: 130, h: 18 },
      { x: 940,  y: 300, w: 130, h: 18 },
      { x: 1120, y: 250, w: 140, h: 18 },
      // top ledge, then rotating platforms orbit across the pit
      { x: 1360, y: 250, w: 140, h: 18 },
      { x: 1560, y: 280, w: 130, h: 18 },
      { x: 1800, y: 300, w: 140, h: 18 },
      // back to ground for a breather
      { x: 2040, y: 450, w: 320, h: 60, type: 'ground' },
      { x: 2160, y: 360, w: 160, h: 18 },
      { x: 2420, y: 330, w: 150, h: 18 },
      { x: 2660, y: 360, w: 160, h: 18 },
      { x: 2700, y: 450, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [],
    switches: [],
    spikes: [
      // pit beneath the vertical climb
      { x: 760, y: 426, w: 1280, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 340, y: 340 }, { x: 560, y: 300 }, { x: 800, y: 320 },
      { x: 980, y: 260 }, { x: 1160, y: 210 }, { x: 1400, y: 210 },
      { x: 1600, y: 240 }, { x: 1840, y: 260 }, { x: 2200, y: 320 },
      { x: 2460, y: 290 }, { x: 2700, y: 320 },
    ],
    qblocks: [{ x: 1160, y: 160 }],
    cblocks: [],
    trophies: [{ x: 1360, y: 190, collected: false }],
    powerupItems: [{ x: 2200, y: 300, type: 'extrajump' }],
    enemies: [
      { x: 380, y: 408, v: 1, hp: 3, elite: 'false' },
      // teleporter blinks onto the top ledges
      { x: 1140, y: 208, v: 13, hp: 4, elite: 'false' },
      { x: 1580, y: 238, v: 13, hp: 4, elite: 'false' },
      // silencer guards the breather ground
      { x: 2120, y: 408, v: 10, hp: 4, elite: 'false' },
      { x: 2440, y: 288, v: 0, hp: 3, elite: 'false' },
    ],
    checkpoints: [{ x: 2080, y: 400, activated: false }],
    spiritEmbers: [{ x: 940, y: 250, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L4 — CHALLENGE: THE GRINDING CRYPT (dense rotating + moving + blink)
  // Moving platforms cross spike chasms, rotating hazards sweep landings,
  // silencer + teleporters layered. Longest level; two checkpoints.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'THE GRINDING CRYPT',
    width: 3200, goalX: 3080, goalY: 350,
    startX: 60, startY: 380,
    bgColors: ['#060410', '#140c24'],
    platColors: ['#0a0814', '#16101f', '#2a2038', '#46365a', '#8a6acc'],
    accentColor: '#8a6acc', accentColor2: '#c0a0ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'shadow', weather: 'fog',
    timePar: 266, timeGold: 178,
    platforms: [
      { x: 0,    y: 450, w: 620, h: 60, type: 'ground' },
      { x: 300,  y: 380, w: 150, h: 18 },
      { x: 520,  y: 340, w: 140, h: 18 },
      // first spike chasm — moving platform carries you across
      { x: 940,  y: 330, w: 150, h: 18 },
      { x: 1160, y: 300, w: 140, h: 18 },
      // mid rest ground
      { x: 1340, y: 450, w: 300, h: 60, type: 'ground' },
      { x: 1420, y: 360, w: 150, h: 18 },
      { x: 1660, y: 330, w: 140, h: 18 },
      // second chasm with moving platform
      { x: 2060, y: 320, w: 150, h: 18 },
      { x: 2280, y: 300, w: 140, h: 18 },
      { x: 2500, y: 340, w: 160, h: 18 },
      { x: 2760, y: 360, w: 160, h: 18 },
      { x: 3000, y: 450, w: 200, h: 60, type: 'ground' },
    ],
    icePlats: [],
    bounces: [],
    movingPlats: [
      // crosses the first spike chasm (660 -> 940 gap)
      { x: 660, y: 360, x2: 920, y2: 360, w: 110, h: 18, speed: 1.6 },
      // crosses the second chasm (1800 -> 2060 gap)
      { x: 1820, y: 350, x2: 2060, y2: 320, w: 110, h: 18, speed: 1.8 },
    ],
    switches: [],
    spikes: [
      { x: 620, y: 426, w: 320, h: 24, rotation: 0, spikeType: 'static' },
      { x: 1800, y: 426, w: 260, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 340, y: 340 }, { x: 560, y: 300 }, { x: 760, y: 320 },
      { x: 980, y: 290 }, { x: 1200, y: 260 }, { x: 1460, y: 320 },
      { x: 1700, y: 290 }, { x: 1920, y: 310 }, { x: 2100, y: 280 },
      { x: 2320, y: 260 }, { x: 2540, y: 300 }, { x: 2800, y: 320 },
    ],
    qblocks: [{ x: 1480, y: 280 }],
    cblocks: [{ x: 2540, y: 240, hits: 3 }],
    trophies: [],
    powerupItems: [
      { x: 1420, y: 300, type: 'invincible' },
      { x: 2280, y: 240, type: 'heal' },
    ],
    enemies: [
      { x: 380, y: 408, v: 1, hp: 3, elite: 'false' },
      // silencer just before the first moving platform — disarms you
      { x: 560, y: 298, v: 10, hp: 4, elite: 'false' },
      { x: 1400, y: 408, v: 13, hp: 4, elite: 'false' },
      { x: 1520, y: 408, v: 5, hp: 4, elite: 'false' },
      // teleporters flanking the second chasm landings
      { x: 2300, y: 258, v: 13, hp: 5, elite: 'false' },
      { x: 2540, y: 298, v: 10, hp: 4, elite: 'false' },
      { x: 2780, y: 318, v: 0, hp: 4, elite: 'false' },
    ],
    checkpoints: [
      { x: 1360, y: 400, activated: false },
      { x: 2500, y: 290, activated: false },
    ],
    spiritEmbers: [{ x: 1160, y: 250, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [],
    highlights: [],
  },

  // ════════════════════════════════════════════════════════════════
  // L5 — FINALE: HEART OF THE GRAVEMIND (climactic vertical set-piece +
  // boss). Ascend a spiral of slabs over a void-spike abyss past blink
  // and silencer foes, then face the SUMMONER at the haunted summit.
  // ════════════════════════════════════════════════════════════════
  {
    name: 'HEART OF THE GRAVEMIND',
    width: 3000, goalX: 2880, goalY: 320,
    startX: 60, startY: 380,
    bgColors: ['#050308', '#120a20'],
    platColors: ['#0a0814', '#16101f', '#2a2038', '#46365a', '#8a6acc'],
    accentColor: '#8a6acc', accentColor2: '#c0a0ff',
    skyStars: true, height: 560, voidFloor: false, voidY: 460,
    theme: 'shadow', weather: 'fog',
    timePar: 250, timeGold: 166,
    platforms: [
      { x: 0,    y: 450, w: 700, h: 60, type: 'ground' },
      // opening gauntlet on solid-ish ground
      { x: 360,  y: 380, w: 160, h: 18 },
      { x: 600,  y: 350, w: 150, h: 18 },
      // the ascent begins — spiral of slabs over the spike abyss
      { x: 820,  y: 380, w: 140, h: 18 },
      { x: 1020, y: 330, w: 130, h: 18 },
      { x: 1220, y: 290, w: 130, h: 18 },
      { x: 1040, y: 240, w: 130, h: 18 },
      { x: 860,  y: 200, w: 130, h: 18 },
      { x: 1080, y: 160, w: 140, h: 18 },
      // summit approach platforms
      { x: 1320, y: 200, w: 150, h: 18 },
      { x: 1560, y: 240, w: 150, h: 18 },
      { x: 1800, y: 280, w: 160, h: 18 },
      { x: 2040, y: 320, w: 180, h: 18 },
      // pre-boss landing ground
      { x: 2280, y: 450, w: 720, h: 60, type: 'ground' },
      // boss arena ledges
      { x: 2400, y: 360, w: 160, h: 18 },
      { x: 2660, y: 360, w: 160, h: 18 },
      // goal castle platform
      { x: 2760, y: 410, w: 240, h: 18 },
    ],
    icePlats: [],
    bounces: [
      // a bounce to help recover from the spiral toward the summit
      { x: 1480, y: 420, w: 100, h: 18, rotation: 0 },
    ],
    movingPlats: [],
    switches: [],
    spikes: [
      // the abyss beneath the spiral
      { x: 760, y: 426, w: 1500, h: 24, rotation: 0, spikeType: 'static' },
    ],
    coins: [
      { x: 420, y: 340 }, { x: 640, y: 310 }, { x: 860, y: 340 },
      { x: 1060, y: 290 }, { x: 1260, y: 250 }, { x: 1080, y: 200 },
      { x: 900, y: 160 }, { x: 1120, y: 120 }, { x: 1360, y: 160 },
      { x: 1600, y: 200 }, { x: 1840, y: 240 }, { x: 2080, y: 280 },
      { x: 2440, y: 320 }, { x: 2700, y: 320 },
    ],
    qblocks: [{ x: 1360, y: 120 }],
    cblocks: [],
    trophies: [{ x: 860, y: 150, collected: false }],
    powerupItems: [
      { x: 2080, y: 270, type: 'big' },
      { x: 2440, y: 310, type: 'heal' },
    ],
    enemies: [
      { x: 420, y: 408, v: 1, hp: 4, elite: 'false' },
      // silencer at the base of the climb — strip power before the ascent
      { x: 620, y: 308, v: 10, hp: 5, elite: 'false' },
      { x: 1040, y: 198, v: 13, hp: 5, elite: 'false' },
      { x: 1320, y: 158, v: 13, hp: 5, elite: 'false' },
      { x: 1800, y: 238, v: 10, hp: 5, elite: 'false' },
      // the SUMMONER boss on the arena ground
      { x: 2560, y: 386, v: 98, w: 64, h: 64, hp: 40, elite: 'true' },
    ],
    checkpoints: [{ x: 2280, y: 400, activated: false }],
    spiritEmbers: [{ x: 1120, y: 110, collected: false, idx: 0 }],
    marsBarPieces: [],
    signs: [{ x: 80, y: 230, w: 380, title: 'HEART OF THE GRAVEMIND',
      lines: ['💀 CLIMB THE SPIRAL OF BONES.', '👹 THE SUMMONER WAITS ABOVE —',
        'END THE HAUNTING.'],
      color: '#c0a0ff' }],
    highlights: [],
  },

];
