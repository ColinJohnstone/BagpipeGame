// levels/tutorial.js
// ──────────────────────────────────────────────────────────────────
// TUTORIAL DOJO — long blueprint-themed walk-through. Teaches every
// core mechanic in single-purpose levels. Exposes window.LEVELS_TUTORIAL.
// ──────────────────────────────────────────────────────────────────

(function () {
    // ── Helpers ──────────────────────────────────────────
    // Compact level builder — fills in blueprint-theme defaults so each level
    // definition can stay focused on the geometry that teaches one mechanic.
    const tut = (overrides) => Object.assign({
      theme: 'blueprint',
      bgColors: ['#0a1f4a', '#0e2a6a'],
      platColors: ['#10254a', '#143560', '#1c5090', '#3478c8', '#88c8ff'],
      accentColor: '#88c8ff', accentColor2: '#cfe6ff',
      skyStars: false, misty: false,
      height: 560, voidFloor: false, voidY: 460,
      weather: 'none',
      startX: 60, startY: 380,
      goalY: 310,
      timePar: 200, timeGold: 120,
      platforms: [], icePlats: [], bounces: [], movingPlats: [], switches: [],
      spikes: [], coins: [], qblocks: [], cblocks: [], trophies: [],
      powerupItems: [], enemies: [], checkpoints: [], spiritEmbers: [],
      marsBarPieces: [], signs: [], highlights: [],
    }, overrides);
    // Auto-size signs so 11-px tutorial text always fits.
    // Press Start 2P at 11px ≈ 9.6 px / glyph; pad by 24 px.
    const sgn = (x, y, title, lines, opts = {}) => {
      const longest = (lines || []).reduce((m, l) => Math.max(m, String(l).length), title ? String(title).length : 0);
      const autoW = Math.max(220, Math.min(440, longest * 10 + 24));
      const linesN = (lines || []).length;
      return Object.assign({
        x, y,
        w: opts.w || autoW,
        h: opts.h || (linesN * 18 + (title ? 32 : 14)),
        title, lines,
        align: opts.align || 'left',
        color: opts.color || '#e8f6ff',
      }, opts);
    };
    const arr = (x, y, label, color) => ({ type: 'arrow', x, y, label, color: color || '#ffd54a' });
    const arrU = (x, y, label, color) => ({ type: 'arrow-up', x, y, label, color: color || '#ffd54a' });
    const arrL = (x, y, label, color) => ({ type: 'arrow-left', x, y, label, color: color || '#ffd54a' });
    const arrR = (x, y, label, color) => ({ type: 'arrow-right', x, y, label, color: color || '#ffd54a' });
    const cir = (x, y, r, color) => ({ type: 'circle', x, y, r: r || 18, color: color || '#ffd54a' });
    const box = (x, y, w, h, color) => ({ type: 'box', x, y, w, h, color: color || '#ffd54a' });

    const levels = [];

    // ════════════════════════════════════════════════════════════════
    //  L01  MOVE & JUMP
    // ════════════════════════════════════════════════════════════════
    levels.push(tut({
      name: 'MOVE', width: 1600, goalX: 1500,
      platforms: [
        { x: 0, y: 450, w: 600, h: 60, type: 'ground' },
        { x: 740, y: 450, w: 860, h: 60, type: 'ground' },
      ],
      coins: [{ x: 200, y: 410 }, { x: 400, y: 410 }, { x: 900, y: 410 }, { x: 1200, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 01', ['PRESS  ←  OR  →', 'TO MOVE.', '', 'PRESS  Z  TO JUMP.']),
        sgn(620, 220, '', ['JUMP THE GAP →'], { w: 240, h: 50 }),
      ],
      highlights: [arrU(670, 470, 'JUMP'), arrR(140, 410, '', '#88ff88')],
    }));

    // L02  DOUBLE JUMP — wider gap, two jumps
    levels.push(tut({
      name: 'DOUBLE JUMP', width: 1800, goalX: 1700,
      platforms: [
        { x: 0, y: 450, w: 600, h: 60, type: 'ground' },
        { x: 920, y: 450, w: 880, h: 60, type: 'ground' },
      ],
      coins: [{ x: 770, y: 250 }, { x: 1100, y: 410 }, { x: 1300, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 02', ['JUMP, THEN PRESS', 'JUMP AGAIN MID-AIR', 'FOR A DOUBLE JUMP.']),
        sgn(620, 220, '', ['WIDE GAP — JUMP', 'TWICE TO CROSS!'], { w: 280, h: 70 }),
      ],
      highlights: [arrU(760, 470, 'JUMP × 2'), cir(920, 430, 24, '#88ff88')],
    }));

    // L03  AIM UP
    levels.push(tut({
      name: 'AIM UP', width: 1600, goalX: 1500, height: 700, voidY: 600,
      platforms: [
        { x: 0, y: 590, w: 1600, h: 60, type: 'ground' },
        { x: 700, y: 180, w: 100, h: 18, type: 'breakshot', _id: 'l3a1' },
        { x: 700, y: 148, w: 100, h: 18, type: 'breakshot', _id: 'l3a2' },
        { x: 1100, y: 350, w: 30, h: 240 },
        { x: 1100, y: 220, w: 30, h: 130, type: 'breakshot', _id: 'l3a3' },
      ],
      coins: [{ x: 740, y: 130 }, { x: 1300, y: 550 }],
      signs: [
        sgn(60, 350, 'LESSON 03 · AIM UP', [
          'HOLD  SPACE  THEN', 'PRESS  Q  TO SHOOT', 'STRAIGHT UP.',
          '', 'BREAK THE BLOCKS ↑',
        ]),
      ],
      highlights: [arrU(750, 230, 'AIM UP', '#ffaa44'), cir(750, 165, 60, '#ffaa44')],
    }));

    // L04  AIM DOWN
    levels.push(tut({
      name: 'AIM DOWN', width: 1800, goalX: 1700, height: 760, voidY: 720,
      platforms: [
        { x: 0, y: 450, w: 720, h: 60, type: 'ground' },
        { x: 0, y: 690, w: 1800, h: 60, type: 'ground' },
        { x: 1300, y: 450, w: 500, h: 60, type: 'ground' },
      ],
      enemies: [
        { x: 880, y: 648, v: 0, hp: 2, elite: 'false' },
        { x: 1080, y: 648, v: 0, hp: 2, elite: 'false' },
      ],
      coins: [{ x: 600, y: 410 }, { x: 1000, y: 650 }, { x: 1500, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 04 · AIM DOWN', [
          'JUMP THE GAP. WHILE', 'FALLING: DOUBLE-TAP',
          'AND HOLD SPACE,', 'THEN PRESS  Q.',
          '', 'CLEAR THE FOES BELOW ↓',
        ], { w: 360 }),
      ],
      highlights: [arr(900, 600, 'SHOOT DOWN', '#ff8844'), cir(980, 660, 28, '#ff8844')],
    }));

    // L05  SHOOT
    levels.push(tut({
      name: 'SHOOT', width: 1800, goalX: 1700,
      platforms: [
        { x: 0, y: 450, w: 1800, h: 60, type: 'ground' },
        { x: 700, y: 432, w: 80, h: 18, type: 'breakshot', _id: 'l5b1' },
        { x: 700, y: 400, w: 80, h: 18, type: 'breakshot', _id: 'l5b2' },
        { x: 700, y: 368, w: 80, h: 18, type: 'breakshot', _id: 'l5b3' },
        { x: 700, y: 336, w: 80, h: 18, type: 'breakshot', _id: 'l5b4' },
      ],
      coins: [{ x: 300, y: 410 }, { x: 1100, y: 410 }, { x: 1400, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 05 · SHOOT', [
          'PRESS  Q  TO SHOOT.', 'HOLD  Q  TO',
          'AUTO-FIRE.', '', 'BREAK THE WALL →',
        ]),
      ],
      highlights: [box(700, 336, 80, 132, '#ff5544'), arrR(640, 380, 'SHOOT', '#ff5544')],
    }));

    // L06  BAGPIPE 2 BOUNCE — hidden alcove
    levels.push(tut({
      name: 'BAGPIPE 2 · BOUNCE', width: 1800, goalX: 1700,
      platforms: [
        { x: 0, y: 450, w: 1800, h: 60, type: 'ground' },
        { x: 600, y: 200, w: 700, h: 18 },
        { x: 1000, y: 280, w: 18, h: 170 },
        { x: 1300, y: 280, w: 18, h: 170 },
        { x: 1000, y: 410, w: 318, h: 18 },
      ],
      coins: [
        { x: 1100, y: 350 }, { x: 1160, y: 350 }, { x: 1220, y: 350 },
        { x: 300, y: 410 },
      ],
      enemies: [{ x: 1140, y: 368, v: 4, hp: 2, elite: 'false' }],
      signs: [
        sgn(60, 200, 'LESSON 06 · BAGPIPE 2', [
          'PRESS  2  FOR BOUNCE', 'BAGPIPE.',
          '', 'SHOTS RICOCHET — HIT', 'THE HIDDEN ALCOVE →',
        ], { w: 360 }),
      ],
      highlights: [box(1018, 280, 282, 130, '#44ffcc'), arrR(960, 340, 'BOUNCE IN', '#44ffcc')],
    }));

    // L07  BAGPIPE 3 PIERCING
    levels.push(tut({
      name: 'BAGPIPE 3 · PIERCING', width: 1800, goalX: 1700,
      platforms: [{ x: 0, y: 450, w: 1800, h: 60, type: 'ground' }],
      enemies: [
        { x: 700, y: 408, v: 0, hp: 1, elite: 'false' },
        { x: 800, y: 408, v: 0, hp: 1, elite: 'false' },
        { x: 900, y: 408, v: 0, hp: 1, elite: 'false' },
        { x: 1000, y: 408, v: 0, hp: 1, elite: 'false' },
        { x: 1100, y: 408, v: 0, hp: 1, elite: 'false' },
      ],
      coins: [{ x: 300, y: 410 }, { x: 1500, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 07 · BAGPIPE 3', [
          'PRESS  3  FOR PIERCING.',
          '', 'ONE SHOT PUNCHES', 'THROUGH EVERY FOE',
          'IN A LINE.',
        ], { w: 360 }),
      ],
      highlights: [box(680, 380, 480, 80, '#ff88ff'), arrR(620, 420, 'PIERCE', '#ff88ff')],
    }));

    // L08  BAGPIPE 4 CHARGE
    levels.push(tut({
      name: 'BAGPIPE 4 · CHARGE', width: 1800, goalX: 1700,
      platforms: [
        { x: 0, y: 450, w: 1800, h: 60, type: 'ground' },
        { x: 700, y: 432, w: 60, h: 18, type: 'breakshot', _id: 'l8c1' },
        { x: 700, y: 400, w: 60, h: 18, type: 'breakshot', _id: 'l8c2' },
        { x: 700, y: 368, w: 60, h: 18, type: 'breakshot', _id: 'l8c3' },
        { x: 700, y: 336, w: 60, h: 18, type: 'breakshot', _id: 'l8c4' },
        { x: 700, y: 304, w: 60, h: 18, type: 'breakshot', _id: 'l8c5' },
        { x: 700, y: 272, w: 60, h: 18, type: 'breakshot', _id: 'l8c6' },
      ],
      coins: [{ x: 300, y: 410 }, { x: 1100, y: 410 }, { x: 1400, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 08 · BAGPIPE 4', [
          'PRESS  4  FOR CHARGE.',
          '', 'HOLD  Q  TO CHARGE.',
          'RELEASE FOR A BIG', 'SHOT THAT BREAKS',
          'THICK WALLS.',
        ], { w: 360 }),
      ],
      highlights: [box(700, 272, 60, 196, '#ff8800'), arrR(640, 360, 'HOLD Q', '#ff8800')],
    }));

    // L09  BAGPIPE 5 PORTAL
    levels.push(tut({
      name: 'BAGPIPE 5 · PORTAL', width: 2200, goalX: 2100,
      platforms: [
        { x: 0, y: 450, w: 700, h: 60, type: 'ground' },
        { x: 700, y: 100, w: 60, h: 410 },
        { x: 1200, y: 450, w: 1000, h: 60, type: 'ground' },
        { x: 900, y: 280, w: 200, h: 18 },
      ],
      coins: [{ x: 300, y: 410 }, { x: 950, y: 240 }, { x: 1500, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 09 · BAGPIPE 5', [
          'PRESS  5  FOR PORTAL.',
          '', 'SHOOT — A PORTAL', 'OPENS WHERE THE',
          'NOTE LANDS.', 'WALK INTO IT.',
        ], { w: 360 }),
      ],
      highlights: [arrU(950, 320, 'PORTAL', '#8866ff'), box(700, 100, 60, 410, '#8866ff')],
    }));

    // L10  SKIRL BLAST
    levels.push(tut({
      name: 'SKIRL BLAST', width: 1800, goalX: 1700,
      platforms: [{ x: 0, y: 450, w: 1800, h: 60, type: 'ground' }],
      enemies: [
        { x: 760, y: 408, v: 4, hp: 2, elite: 'false' },
        { x: 820, y: 408, v: 4, hp: 2, elite: 'false' },
        { x: 880, y: 408, v: 4, hp: 2, elite: 'false' },
        { x: 940, y: 408, v: 4, hp: 2, elite: 'false' },
        { x: 1000, y: 408, v: 4, hp: 2, elite: 'false' },
      ],
      coins: [{ x: 300, y: 410 }, { x: 1400, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 10 · SKIRL', [
          'PRESS  W  FOR SKIRL.',
          '', 'A SHOCKWAVE THAT',
          'STRIPS SHIELDS AND', 'KNOCKS BACK FOES.',
        ], { w: 360 }),
      ],
      highlights: [box(740, 380, 320, 80, '#22ccff'), arrR(700, 420, 'PRESS W', '#22ccff')],
    }));

    // L11  HIGHLAND CHARGE
    levels.push(tut({
      name: 'HIGHLAND CHARGE', width: 2000, goalX: 1900,
      platforms: [
        { x: 0, y: 450, w: 700, h: 60, type: 'ground' },
        { x: 1120, y: 450, w: 880, h: 60, type: 'ground' },
      ],
      powerupItems: [{ x: 1140, y: 416, type: 'chargerefresh' }],
      coins: [{ x: 300, y: 410 }, { x: 1400, y: 410 }, { x: 1700, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 11 · CHARGE', [
          'PRESS  E  FOR HIGHLAND', 'CHARGE — A FAST DASH.',
          '', 'JUMP, THEN PRESS  E', 'TO FLY ACROSS.',
        ], { w: 360 }),
      ],
      highlights: [arrR(900, 360, 'DASH'), box(700, 440, 420, 60, '#ff7733')],
    }));

    // L12  DRONE WAVE
    levels.push(tut({
      name: 'DRONE WAVE', width: 1900, goalX: 1800,
      platforms: [
        { x: 0, y: 450, w: 1900, h: 60, type: 'ground' },
        { x: 720, y: 320, w: 90, h: 18 }, { x: 880, y: 260, w: 90, h: 18 },
        { x: 1040, y: 320, w: 90, h: 18 }, { x: 1200, y: 260, w: 90, h: 18 },
      ],
      enemies: [
        { x: 740, y: 280, v: 0, hp: 2, elite: 'false' },
        { x: 900, y: 220, v: 0, hp: 2, elite: 'false' },
        { x: 1060, y: 280, v: 0, hp: 2, elite: 'false' },
        { x: 1220, y: 220, v: 0, hp: 2, elite: 'false' },
      ],
      coins: [{ x: 300, y: 410 }, { x: 1500, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 12 · DRONE', [
          'PRESS  R  FOR DRONE', 'WAVE — A SPREAD',
          'OF NOTES.', '',
          'STAND BELOW THE LINE,', 'PRESS  R.',
        ], { w: 360 }),
      ],
      highlights: [arrU(1000, 350, 'PRESS R', '#cc88ff'), box(720, 200, 580, 160, '#cc88ff')],
    }));

    // L13  PARRY
    levels.push(tut({
      name: 'PARRY', width: 1800, goalX: 1700,
      platforms: [
        { x: 0, y: 450, w: 1800, h: 60, type: 'ground' },
        { x: 700, y: 320, w: 100, h: 18 }, { x: 1100, y: 320, w: 100, h: 18 },
      ],
      enemies: [
        { x: 720, y: 280, v: 3, hp: 2, elite: 'false' },
        { x: 1120, y: 280, v: 3, hp: 2, elite: 'false' },
      ],
      coins: [{ x: 300, y: 410 }, { x: 900, y: 410 }, { x: 1500, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 13 · PARRY', [
          'PRESS  D  TO PARRY.',
          '', 'TIME IT WHEN A SHOT', 'IS NEAR — REFLECTS',
          'BACK AT THE FIRER.',
        ], { w: 360 }),
      ],
      highlights: [cir(740, 290, 22, '#88ff88'), cir(1140, 290, 22, '#88ff88')],
    }));

    // L14  ITEMS
    const itemRow = [
      ['rapid', 'RAPID', '#ff4488'], ['big', 'BIG', '#44ffcc'],
      ['bomb', 'BOMB', '#ff8800'], ['drum', 'DRUM', '#ff4400'],
      ['invincible', 'STAR', '#ffd700'], ['chargerefresh', 'CHRG', '#ff8844'],
      ['extrajump', 'JUMP+', '#88aaff'], ['shield', 'SHIELD', '#7fff00'],
      ['heal', 'HEAL', '#ff4488'],
    ];
    const ipPlats = [], ipPickups = [], ipHighlights = [];
    for (let i = 0; i < itemRow.length; i++) {
      const [type, label, color] = itemRow[i];
      const x = 320 + i * 280;
      ipPlats.push({ x, y: 380, w: 100, h: 18 });
      ipPickups.push({ x: x + 10, y: 358, type });
      ipHighlights.push(arrU(x + 50, 328, label, color));
    }
    const itW = 320 + itemRow.length * 280 + 320;
    levels.push(tut({
      name: 'ITEMS', width: itW, goalX: itW - 100,
      platforms: [{ x: 0, y: 450, w: itW, h: 60, type: 'ground' }, ...ipPlats],
      powerupItems: ipPickups,
      qblocks: [{ x: 100, y: 320 }],
      cblocks: [{ x: 200, y: 320 }],
      trophies: [{ x: itW - 220, y: 412 }],
      coins: [{ x: 50, y: 410 }, { x: itW - 50, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 14 · ITEMS', [
          'WALK OVER EACH', 'PICKUP TO TEST IT.',
        ]),
      ],
      highlights: [
        ...ipHighlights,
        cir(115, 320, 22, '#ffd54a'),
        cir(215, 320, 22, '#ffaa44'),
        cir(itW - 205, 422, 26, '#ffd700'),
      ],
    }));

    // L15  PLATFORMS — must USE each
    levels.push(tut({
      name: 'PLATFORMS', width: 3400, goalX: 3300,
      platforms: [
        { x: 0, y: 450, w: 280, h: 60, type: 'ground' },
        { x: 740, y: 380, w: 160, h: 18, type: 'oneway' },
        { x: 700, y: 280, w: 240, h: 18 },
        { x: 1080, y: 320, w: 160, h: 18, type: 'soundwave' },
        { x: 1280, y: 280, w: 100, h: 18 },
        { x: 1440, y: 320, w: 80, h: 18, type: 'crumble' },
        { x: 1540, y: 320, w: 80, h: 18, type: 'crumble' },
        { x: 1640, y: 320, w: 80, h: 18, type: 'crumble' },
        { x: 1820, y: 432, w: 80, h: 18, type: 'breakshot', _id: 'l15brk1' },
        { x: 1820, y: 400, w: 80, h: 18, type: 'breakshot', _id: 'l15brk2' },
        { x: 1820, y: 368, w: 80, h: 18, type: 'breakshot', _id: 'l15brk3' },
        { x: 1820, y: 336, w: 80, h: 18, type: 'breakshot', _id: 'l15brk4' },
        { x: 1820, y: 304, w: 80, h: 18, type: 'breakshot', _id: 'l15brk5' },
        { x: 2200, y: 100, w: 60, h: 350 },
        { x: 2400, y: 450, w: 1000, h: 60, type: 'ground' },
      ],
      icePlats: [{ x: 280, y: 450, w: 460, h: 60 }],
      bounces: [{ x: 2080, y: 432, w: 100, h: 14 }],
      movingPlats: [{ x: 2900, y: 320, x2: 3200, y2: 320, w: 110, h: 14, speed: 1.6 }],
      coins: [
        { x: 360, y: 410 }, { x: 540, y: 410 }, { x: 800, y: 240 },
        { x: 1310, y: 240 }, { x: 1480, y: 280 }, { x: 1580, y: 280 }, { x: 1680, y: 280 },
        { x: 2120, y: 200 }, { x: 3000, y: 280 }, { x: 3250, y: 410 },
      ],
      signs: [
        sgn(60, 200, 'LESSON 15 · PLATFORMS', [
          'EVERY PLATFORM TYPE.', 'USE EACH TO ADVANCE.',
        ]),
      ],
      highlights: [
        arrR(360, 470, 'ICE — SLIPPERY', '#88ddff'),
        arrU(820, 410, 'JUMP THROUGH', '#88ff88'),
        arrU(1160, 350, 'SHOOT IT', '#22ccaa'),
        arrR(1430, 350, 'RACE!', '#cc8800'),
        box(1820, 304, 80, 164, '#66ccff'),
        arrR(1760, 380, 'SHOOT', '#66ccff'),
        arrU(2130, 460, 'BOUNCE OVER', '#00ff88'),
        arrR(2880, 350, 'RIDE IT', '#5aaeff'),
      ],
    }));

    // L16  VERTICAL CLIMB — tall level
    levels.push(tut({
      name: 'VERTICAL', width: 1200, height: 1300, voidY: 1240,
      goalX: 1080, goalY: 100,
      startX: 60, startY: 1180,
      platforms: [
        { x: 0, y: 1240, w: 1200, h: 60, type: 'ground' },
        { x: 220, y: 1140, w: 140, h: 18, type: 'oneway' },
        { x: 460, y: 1080, w: 140, h: 18, type: 'oneway' },
        { x: 700, y: 1020, w: 140, h: 18, type: 'oneway' },
        { x: 200, y: 820, w: 140, h: 18 },
        { x: 480, y: 720, w: 140, h: 18 },
        { x: 760, y: 620, w: 140, h: 18 },
        { x: 200, y: 380, w: 140, h: 18 },
        { x: 1040, y: 200, w: 160, h: 60, type: 'ground' },
      ],
      bounces: [{ x: 460, y: 1222, w: 100, h: 14 }],
      movingPlats: [{ x: 500, y: 500, x2: 900, y2: 320, w: 110, h: 14, speed: 1.4 }],
      powerupItems: [{ x: 240, y: 798, type: 'extrajump' }],
      coins: [
        { x: 290, y: 1100 }, { x: 530, y: 1040 }, { x: 770, y: 980 },
        { x: 270, y: 780 }, { x: 550, y: 680 }, { x: 830, y: 580 },
        { x: 270, y: 340 }, { x: 700, y: 360 },
      ],
      signs: [
        sgn(60, 1080, 'LESSON 16 · CLIMB', [
          'CLIMB UPWARD.', 'USE EVERY MOVE',
          'YOU LEARNED.',
        ]),
        sgn(380, 920, '', ['BOUNCE UP ↑'], { w: 220, h: 50 }),
        sgn(380, 480, '', ['RIDE THE PLATFORM'], { w: 280, h: 50 }),
      ],
      highlights: [
        arrU(290, 1170, '', '#88ff88'),
        arrU(510, 1235, 'BOUNCE!', '#00ff88'),
        arrU(290, 820, 'JUMP+ ITEM', '#88aaff'),
        arrU(560, 410, 'TOP', '#ffd54a'),
      ],
    }));

    // L17  TRAPS — switches + spikes
    levels.push(tut({
      name: 'TRAPS', width: 2000, goalX: 1900,
      platforms: [
        { x: 0, y: 450, w: 600, h: 60, type: 'ground' },
        { x: 880, y: 450, w: 1120, h: 60, type: 'ground' },
        { x: 600, y: 380, w: 90, h: 18 },
        { x: 740, y: 340, w: 90, h: 18 },
        { x: 880, y: 380, w: 90, h: 18 },
        { x: 1100, y: 400, w: 60, h: 18, type: 'switchA', switchGroup: 'A' },
        { x: 1240, y: 400, w: 60, h: 18, type: 'switchB', switchGroup: 'A' },
        { x: 1380, y: 400, w: 60, h: 18, type: 'switchA', switchGroup: 'A' },
      ],
      switches: [{ x: 1500, y: 410, w: 24, h: 24, switchGroup: 'A' }],
      spikes: [{ x: 600, y: 434, w: 280, h: 20, rotation: 0 }],
      coins: [{ x: 300, y: 410 }, { x: 770, y: 300 }, { x: 1700, y: 410 }],
      signs: [
        sgn(60, 200, 'LESSON 17 · TRAPS', [
          'SPIKES HURT — JUMP', 'OVER OR USE THE',
          'PLATFORMS ABOVE.', '',
          'STEP ON SWITCHES TO', 'TOGGLE 🔴 ↔ 🔵.',
        ], { w: 360 }),
      ],
      highlights: [
        box(600, 430, 280, 24, '#ff5544'),
        arrU(740, 320, 'OVER!', '#88ff88'),
        arr(1500, 380, 'JUMP HERE', '#88ddff'),
      ],
    }));

    // L18  ROSTER — every enemy
    levels.push(tut({
      name: 'ROSTER', width: 2600, goalX: 2500,
      platforms: [{ x: 0, y: 450, w: 2600, h: 60, type: 'ground' }],
      enemies: [
        { x: 380, y: 408, v: 0, hp: 2, elite: 'false' },
        { x: 700, y: 408, v: 1, hp: 2, elite: 'false' },
        { x: 1020, y: 408, v: 3, hp: 2, elite: 'false' },
        { x: 1340, y: 408, v: 4, hp: 2, elite: 'false' },
        { x: 1660, y: 408, v: 7, hp: 2, elite: 'false' },
        { x: 1980, y: 408, v: 6, hp: 2, elite: 'false' },
      ],
      coins: [{ x: 200, y: 410 }, { x: 2300, y: 410 }],
      spiritEmbers: [{ x: 2400, y: 200, collected: false, idx: 0 }],
      signs: [
        sgn(60, 200, 'LESSON 18 · FOES', [
          'CLEAR EVERY ENEMY', 'TO REACH THE GATE.',
        ]),
      ],
      highlights: [
        arrU(380, 380, 'DRUM'), arrU(700, 380, 'JUMPER'),
        arrU(1020, 380, 'SHOOTER'), arrU(1340, 380, 'SHIELDED'),
        arrU(1660, 380, 'SILENCER'), arrU(1980, 380, 'SPLITTER'),
      ],
    }));
  window.LEVELS_TUTORIAL = levels;
})();
