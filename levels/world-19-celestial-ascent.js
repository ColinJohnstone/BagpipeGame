// levels/world-19-celestial-ascent.js
// ──────────────────────────────────────────────────────────────────
// World 19 · CELESTIAL ASCENT — heaven theme, vertical climbs.
// Five tall, multi-section upward-movement levels. Every level is a
// vertical shaft: the player spawns at the bottom and must climb to
// a goal at the very top using bounce pads, air drafts (windtunnels),
// grapple hooks, magnetic anchors and moving cloud-lifts.
//
// The climbing platforms are all ONE-WAY cloud platforms — the
// player can jump UP through them from below and land on top, so a
// missed jump never wedges you under a ceiling. They're tinted with
// a pale sky/cloud palette via the per-platform `colors` array.
// Only the ground floor stays a solid platform.
//
// Reference reach values (so the gaps stay clearable):
//   • single jump      ≈ 110 px up
//   • double jump      ≈ 200 px up
//   • bounce pad       ≈ 260 px up (1.5× jump force)
//   • windtunnel       — continuous lift; rises the full column
//   • grapple hook     — snaps you to an anchor within 540 px
// ──────────────────────────────────────────────────────────────────

(function () {
  // Pale cloud palette for the one-way platforms — [soil, body,
  // mid, top, arrow]. The renderer uses index 1 (body), 3 (top +
  // hatch tint) and 4 (up-arrow chevrons).
  const SKY1WAY = ['#9aa8c8', '#c4cfe4', '#e6ecf6', '#f6f1de', '#ffe9a0'];
  // One-way cloud platform helper.
  const ow = (x, y, w, h) => ({ x, y, w, h, type: 'oneway', colors: SKY1WAY });
  // Grapple-hook anchor helper.
  const hook = (x, y) => ({ x, y, w: 24, h: 24, type: 'grapplehook' });
  // Windtunnel (air-draft column) helper.
  const draft = (x, y, w, h, lift) => ({ x, y, w, h, type: 'windtunnel', lift: lift || 1.05 });

  const base = (overrides) => Object.assign({
    bgColors: ['#5fa6e6', '#cfe4f4'],
    platColors: ['#9aa8c8', '#c4cfe4', '#e6ecf6', '#f6f1de', '#ffe9a0'],
    accentColor: '#ffe9a0', accentColor2: '#ffffff',
    skyStars: false, misty: true, voidFloor: false,
    theme: 'heaven', weather: 'none',
    timePar: 400, timeGold: 270,
    platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
    spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
    powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
    marsBarPieces: [], signs: [], highlights: [],
  }, overrides);

  window.LEVELS_W19 = [

    // ════════════════════════════════════════════════════════════
    // L1 · FIRST ASCENT — a long bounce-pad climb (3 stages)
    // ════════════════════════════════════════════════════════════
    base({
      name: 'SKY FIRST ASCENT',
      width: 960, height: 2520, voidY: 2460,
      startX: 80, startY: 2320, goalX: 470, goalY: 110,
      timePar: 420, timeGold: 280,
      platforms: [
        { x: 0, y: 2400, w: 960, h: 60, type: 'ground' },
        // ── Stage 1 — gentle intro steps ──
        ow(560, 2270, 180, 18),
        ow(180, 2140, 180, 18),
        ow(560, 2010, 180, 18),
        // ── Stage 2 — bounce gauntlet ──
        ow(150, 1750, 190, 18),   // bounce gap
        ow(470, 1630, 170, 18),
        ow(740, 1530, 160, 18),   // side branch (ember alcove)
        ow(180, 1490, 180, 18),
        ow(440, 1230, 200, 18),   // bounce gap
        ow(110, 1090, 180, 18),
        ow(500,  970, 170, 18),
        // ── Stage 3 — final climb ──
        ow(220,  710, 210, 18),   // bounce gap
        ow(560,  580, 180, 18),
        ow(150,  440, 190, 18),
        ow(420,  190, 340, 22),   // goal platform — bounce gap
      ],
      bounces: [
        { x: 600, y: 1996, w: 110, h: 14 },   // on 2010
        { x: 210, y: 1476, w: 120, h: 14 },   // on 1490
        { x: 540, y:  956, w: 110, h: 14 },   // on 970
        { x: 190, y:  426, w: 120, h: 14 },   // on 440
      ],
      coins: [
        { x: 630, y: 2230 }, { x: 250, y: 2100 }, { x: 630, y: 1970 },
        { x: 220, y: 1710 }, { x: 540, y: 1590 }, { x: 250, y: 1450 },
        { x: 520, y: 1190 }, { x: 180, y: 1050 }, { x: 560, y: 930 },
        { x: 300, y: 670 },  { x: 630, y: 540 },  { x: 220, y: 400 },
        { x: 470, y: 150 },
      ],
      qblocks: [{ x: 250, y: 2090 }, { x: 560, y: 920 }],
      checkpoints: [{ x: 240, y: 1490 }, { x: 520, y: 970 }],
      spiritEmbers: [
        { x: 800, y: 1490, collected: false, idx: 0 },   // side-branch alcove
        { x: 300, y: 660,  collected: false, idx: 1 },
      ],
      powerupItems: [
        { x: 560, y: 1970, type: 'extrajump', collected: false },
        { x: 620, y: 540,  type: 'shield',    collected: false },
      ],
      enemies: [
        { x: 240, y: 2100, v: 3,  hp: 3, elite: 'false' },
        { x: 520, y: 1590, v: 3,  hp: 3, elite: 'false' },
        { x: 180, y: 1050, v: 12, hp: 6, elite: 'false' },
        { x: 600, y: 540,  v: 3,  hp: 3, elite: 'false' },
      ],
      signs: [{ x: 70, y: 2240, w: 380, title: 'FIRST ASCENT',
        lines: ['☁ JUMP UP THROUGH CLOUDS.', 'BOUNCE PADS LAUNCH HIGH —', 'CLIMB ALL THREE STAGES.'],
        color: '#ffe9a0' }],
    }),

    // ════════════════════════════════════════════════════════════
    // L2 · DRAFT RIDER — windtunnel chains + cloud-lifts
    // ════════════════════════════════════════════════════════════
    base({
      name: 'SKY DRAFT RIDER',
      width: 1000, height: 2760, voidY: 2700,
      startX: 80, startY: 2560, goalX: 500, goalY: 110,
      timePar: 460, timeGold: 320,
      platforms: [
        { x: 0, y: 2640, w: 1000, h: 60, type: 'ground' },
        // ── Draft 1 ──
        draft(140, 2080, 110, 560, 1.0),
        ow(110, 2040, 210, 18),
        ow(380, 1940, 170, 18),
        // ── Draft 2 — set right, longer ──
        draft(620, 1380, 110, 560, 1.05),
        ow(560, 1860, 200, 18),
        ow(600, 1340, 220, 18),
        // ── Mid section — hop across with a moving cloud-lift ──
        ow(300, 1240, 170, 18),
        ow(120, 1120, 180, 18),
        // ── Draft 3 ──
        draft(440, 620, 110, 480, 1.1),
        ow(380, 1080, 200, 18),
        ow(400, 580, 210, 18),
        // ── Draft 4 — final lift ──
        draft(720, 200, 110, 360, 1.12),
        ow(660, 540, 200, 18),
        ow(360, 190, 320, 22),    // goal platform
      ],
      movingPlats: [
        { x: 300, y: 1640, x2: 620, y2: 1500, w: 120, h: 14, speed: 1.5 },
      ],
      coins: [
        { x: 195, y: 2360 }, { x: 195, y: 2160 }, { x: 200, y: 2000 },
        { x: 460, y: 1900 }, { x: 675, y: 1640 }, { x: 675, y: 1440 },
        { x: 690, y: 1300 }, { x: 380, y: 1200 }, { x: 200, y: 1080 },
        { x: 495, y: 880 },  { x: 495, y: 680 },  { x: 490, y: 540 },
        { x: 775, y: 380 },  { x: 500, y: 150 },
      ],
      qblocks: [{ x: 460, y: 1900 }, { x: 480, y: 540 }],
      checkpoints: [{ x: 620, y: 1340 }, { x: 420, y: 580 }],
      spiritEmbers: [
        { x: 195, y: 2200, collected: false, idx: 0 },
        { x: 690, y: 1280, collected: false, idx: 1 },
      ],
      powerupItems: [
        { x: 380, y: 1900, type: 'shield',      collected: false },
        { x: 660, y: 500,  type: 'chargerefresh', collected: false },
      ],
      enemies: [
        { x: 380, y: 1900, v: 4,  hp: 4, elite: 'false' },
        { x: 600, y: 1300, v: 13, hp: 3, elite: 'false' },
        { x: 380, y: 1040, v: 4,  hp: 4, elite: 'false' },
        { x: 660, y: 500,  v: 13, hp: 3, elite: 'false' },
      ],
      signs: [{ x: 70, y: 2470, w: 400, title: 'DRAFT RIDER',
        lines: ['🌬 RIDE THE RISING DRAFTS.', 'HOLD JUMP TO STEER OUT', 'ONTO THE CLOUD LEDGES.'],
        color: '#ffffff' }],
    }),

    // ════════════════════════════════════════════════════════════
    // L3 · HOOK & SOAR — long grapple-hook chains
    // ════════════════════════════════════════════════════════════
    base({
      name: 'SKY HOOK AND SOAR',
      width: 1000, height: 2960, voidY: 2900,
      startX: 80, startY: 2760, goalX: 500, goalY: 110,
      timePar: 480, timeGold: 330,
      platforms: [
        { x: 0, y: 2840, w: 1000, h: 60, type: 'ground' },
        ow(150, 2660, 190, 18),
        // ── Hook chain 1 ──
        hook(420, 2520),
        hook(640, 2340),
        ow(540, 2200, 180, 18),
        hook(320, 2060),
        ow(120, 1920, 190, 18),
        // ── Rest ledge + side branch ──
        ow(420, 1820, 170, 18),
        ow(760, 1740, 170, 18),   // side branch — ember
        // ── Hook chain 2 ──
        hook(560, 1620),
        hook(340, 1440),
        ow(160, 1300, 190, 18),
        hook(440, 1160),
        ow(620, 1020, 180, 18),
        // ── Hook chain 3 ──
        hook(380, 880),
        hook(180, 700),
        ow(380, 580, 190, 18),
        hook(620, 440),
        hook(420, 260),
        ow(320, 200, 340, 22),    // goal platform
      ],
      coins: [
        { x: 230, y: 2620 }, { x: 480, y: 2440 }, { x: 620, y: 2160 },
        { x: 200, y: 1880 }, { x: 480, y: 1780 }, { x: 600, y: 1560 },
        { x: 240, y: 1260 }, { x: 680, y: 980 },  { x: 440, y: 820 },
        { x: 240, y: 640 },  { x: 460, y: 540 },  { x: 660, y: 380 },
        { x: 500, y: 150 },
      ],
      qblocks: [{ x: 200, y: 1870 }, { x: 660, y: 970 }],
      checkpoints: [{ x: 460, y: 1820 }, { x: 660, y: 1020 }],
      spiritEmbers: [
        { x: 820, y: 1700, collected: false, idx: 0 },   // side-branch alcove
        { x: 240, y: 640,  collected: false, idx: 1 },
      ],
      powerupItems: [
        { x: 540, y: 2160, type: 'chargerefresh', collected: false },
        { x: 160, y: 1260, type: 'shield',        collected: false },
        { x: 380, y: 540,  type: 'extrajump',     collected: false },
      ],
      enemies: [
        { x: 230, y: 2620, v: 3,  hp: 3, elite: 'false' },
        { x: 540, y: 2160, v: 4,  hp: 4, elite: 'false' },
        { x: 420, y: 1780, v: 12, hp: 6, elite: 'false' },
        { x: 160, y: 1260, v: 3,  hp: 3, elite: 'false' },
        { x: 620, y: 980,  v: 4,  hp: 4, elite: 'false' },
        { x: 380, y: 540,  v: 12, hp: 6, elite: 'true'  },
      ],
      signs: [{ x: 70, y: 2570, w: 400, title: 'HOOK & SOAR',
        lines: ['🪝 PRESS DRONE (R) TO HOOK', 'THE NEAREST ANCHOR. RELEASE', 'INTO THE NEXT — CHAIN UP!'],
        color: '#88ccff' }],
    }),

    // ════════════════════════════════════════════════════════════
    // L4 · CLOUDBREAK — every upward tool, branching gauntlet
    // ════════════════════════════════════════════════════════════
    base({
      name: 'SKY CLOUDBREAK',
      width: 1080, height: 3160, voidY: 3100,
      startX: 80, startY: 2960, goalX: 540, goalY: 110,
      timePar: 540, timeGold: 380,
      platforms: [
        { x: 0, y: 3040, w: 1080, h: 60, type: 'ground' },
        // ── Section A — bounce ──
        ow(540, 2900, 180, 18),
        ow(180, 2760, 190, 18),
        ow(520, 2520, 200, 18),   // bounce gap
        // ── Section B — windtunnel ──
        draft(720, 2040, 110, 480, 1.08),
        ow(660, 2480, 210, 18),
        ow(700, 2000, 220, 18),
        // ── Section C — magnetic crossing ──
        { x: 440, y: 1880, w: 32, h: 32, type: 'magnetic', radius: 170, pull: 0.85 },
        ow(200, 1780, 190, 18),
        { x: 120, y: 1660, w: 32, h: 32, type: 'magnetic', radius: 170, pull: 0.85 },
        ow(420, 1560, 190, 18),
        // ── Section D — grapple chain ──
        hook(640, 1420),
        hook(420, 1240),
        ow(180, 1100, 200, 18),
        // ── Section E — moving-lift + bounce finish ──
        ow(540, 980, 180, 18),
        ow(180, 740, 200, 18),    // bounce gap
        ow(560, 600, 180, 18),
        hook(360, 440),
        ow(560, 300, 170, 18),
        ow(360, 200, 360, 22),    // goal platform
      ],
      bounces: [
        { x: 560, y: 2506, w: 120, h: 14 },   // on 2520
        { x: 220, y:  726, w: 130, h: 14 },   // on 740
      ],
      movingPlats: [
        { x: 760, y: 1340, x2: 1000, y2: 1180, w: 120, h: 14, speed: 1.6 },
      ],
      spikes: [
        { x: 360, y: 1546, w: 120, h: 16, rotation: 0, spikeType: 'static' },  // hazard tile mid-Section C
      ],
      coins: [
        { x: 610, y: 2860 }, { x: 250, y: 2720 }, { x: 590, y: 2480 },
        { x: 790, y: 2300 }, { x: 790, y: 2100 }, { x: 480, y: 1840 },
        { x: 260, y: 1740 }, { x: 480, y: 1520 }, { x: 600, y: 1360 },
        { x: 250, y: 1060 }, { x: 600, y: 940 },  { x: 260, y: 700 },
        { x: 620, y: 560 },  { x: 600, y: 260 },  { x: 540, y: 150 },
      ],
      qblocks: [{ x: 790, y: 2090 }, { x: 250, y: 1050 }],
      cblocks: [{ x: 600, y: 930 }],
      checkpoints: [
        { x: 700, y: 2000 },
        { x: 200, y: 1100 },
      ],
      spiritEmbers: [
        { x: 790, y: 2300, collected: false, idx: 0 },
        { x: 480, y: 1500, collected: false, idx: 1 },
        { x: 600, y: 260,  collected: false, idx: 2 },
      ],
      powerupItems: [
        { x: 660, y: 2440, type: 'shield',        collected: false },
        { x: 420, y: 1520, type: 'extrajump',     collected: false },
        { x: 540, y: 940,  type: 'chargerefresh', collected: false },
      ],
      enemies: [
        { x: 250, y: 2720, v: 14, hp: 6, elite: 'false' },
        { x: 660, y: 2440, v: 4,  hp: 4, elite: 'false' },
        { x: 200, y: 1740, v: 13, hp: 3, elite: 'false' },
        { x: 420, y: 1520, v: 12, hp: 6, elite: 'false' },
        { x: 600, y: 940,  v: 14, hp: 6, elite: 'false' },
        { x: 560, y: 560,  v: 13, hp: 3, elite: 'true'  },
      ],
      signs: [{ x: 70, y: 2880, w: 420, title: 'CLOUDBREAK',
        lines: ['☁ BOUNCE · DRAFT · MAGNET ·', 'HOOK · LIFT — FIVE SECTIONS,', 'EVERY TOOL. MIND THE SPIKES.'],
        color: '#ffe9a0' }],
    }),

    // ════════════════════════════════════════════════════════════
    // L5 · THE PEARLY GATE — the great finale climb + gatekeeper boss
    // ════════════════════════════════════════════════════════════
    base({
      name: 'SKY THE PEARLY GATE',
      width: 1120, height: 3560, voidY: 3500,
      startX: 80, startY: 3360, goalX: 560, goalY: 130,
      timePar: 620, timeGold: 440,
      platforms: [
        { x: 0, y: 3440, w: 1120, h: 60, type: 'ground' },
        // ── Trial 1 — bounce ascent ──
        ow(560, 3300, 190, 18),
        ow(200, 3160, 200, 18),
        ow(560, 2900, 210, 18),   // bounce gap
        // ── Trial 2 — windtunnel + moving lift ──
        draft(760, 2420, 110, 500, 1.1),
        ow(700, 2860, 220, 18),
        ow(740, 2380, 220, 18),
        ow(440, 2260, 190, 18),
        // ── Trial 3 — grapple chain ──
        hook(640, 2120),
        hook(420, 1940),
        ow(180, 1800, 200, 18),
        hook(460, 1660),
        hook(680, 1480),
        ow(560, 1340, 200, 18),
        // ── Trial 4 — magnetic + bounce ──
        { x: 320, y: 1220, w: 32, h: 32, type: 'magnetic', radius: 180, pull: 0.9 },
        ow(140, 1120, 200, 18),
        ow(460, 1000, 200, 18),   // bounce gap
        // ── Mid-boss approach platform ──
        ow(220, 760, 240, 18),
        // ── Boss arena — wide ledge ──
        ow(360, 540, 520, 24),
        // ── Final gate steps ──
        ow(420, 360, 200, 18),
        ow(460, 220, 320, 22),    // goal platform — the Pearly Gate
      ],
      bounces: [
        { x: 600, y: 2886, w: 120, h: 14 },   // on 2900
        { x: 500, y:  986, w: 130, h: 14 },   // on 1000
      ],
      movingPlats: [
        { x: 200, y: 2680, x2: 480, y2: 2540, w: 130, h: 14, speed: 1.6 },
        { x: 700, y: 980,  x2: 980,  y2: 820, w: 130, h: 14, speed: 1.8 },
      ],
      spikes: [
        { x: 300, y: 1786, w: 120, h: 16, rotation: 0, spikeType: 'static' },
        { x: 620, y: 1326, w: 120, h: 16, rotation: 0, spikeType: 'static' },
      ],
      coins: [
        { x: 630, y: 3260 }, { x: 270, y: 3120 }, { x: 640, y: 2860 },
        { x: 810, y: 2640 }, { x: 810, y: 2440 }, { x: 510, y: 2220 },
        { x: 600, y: 2040 }, { x: 250, y: 1760 }, { x: 620, y: 1420 },
        { x: 260, y: 1080 }, { x: 540, y: 960 },  { x: 300, y: 720 },
        { x: 500, y: 320 },  { x: 560, y: 170 },
      ],
      qblocks: [{ x: 810, y: 2430 }, { x: 260, y: 1070 }],
      cblocks: [{ x: 540, y: 950 }],
      trophies: [{ x: 290, y: 720, collected: false }],
      checkpoints: [
        { x: 740, y: 2380 },
        { x: 560, y: 1340 },
        { x: 480, y: 540 },
      ],
      spiritEmbers: [
        { x: 810, y: 2640, collected: false, idx: 0 },
        { x: 250, y: 1760, collected: false, idx: 1 },
        { x: 500, y: 320,  collected: false, idx: 2 },
      ],
      powerupItems: [
        { x: 440, y: 2220, type: 'shield',        collected: false },
        { x: 180, y: 1760, type: 'chargerefresh', collected: false },
        { x: 320, y: 720,  type: 'heal',          collected: false },
        { x: 560, y: 500,  type: 'shield',        collected: false },
      ],
      enemies: [
        { x: 270, y: 3120, v: 14, hp: 6, elite: 'false' },
        { x: 700, y: 2820, v: 12, hp: 6, elite: 'false' },
        { x: 440, y: 2220, v: 4,  hp: 4, elite: 'false' },
        { x: 180, y: 1760, v: 14, hp: 6, elite: 'true'  },
        { x: 560, y: 1300, v: 13, hp: 3, elite: 'false' },
        { x: 460, y:  960, v: 12, hp: 6, elite: 'true'  },
        // BOSS — the Gatekeeper, on the wide arena ledge
        { x: 560, y:  476, v: 98, hp: 44, w: 64, h: 64, elite: 'false' },
      ],
      signs: [{ x: 70, y: 3270, w: 440, title: 'THE PEARLY GATE',
        lines: ['👼 FOUR TRIALS, THEN THE', 'GATEKEEPER. CLIMB EVERY', 'CLOUD — ASCEND TO THE GATE.'],
        color: '#ffffff' }],
    }),

  ];
})();
