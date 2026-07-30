// src/sprites.js
// ──────────────────────────────────────────────────────────────────
// Sprite/character module — Phase 4 of the module split.
//
// Owns:
//   - PLAYER_CUSTOM (mutable user-config object) + load/save helpers
//   - HAT_VARIANTS / FACE_VARIANTS / BEARD_VARIANTS / SOCK_VARIANTS /
//     SHOE_VARIANTS — keyed style maps the customizer iterates over
//   - SKIN_PRESETS / JACKET_PRESETS / STOCKING_PRESETS / SPORRAN_PRESETS
//   - _shadeHex, _playerColors (memoized), _bagpipeAccent,
//     _effectiveBpType — palette derivation helpers
//   - drawBagpiper32 + drawBagpiperAimUp / AimDown / Crouched
//     (the four poses used by the engine + the customizer preview)
//
// Engine state read via window:
//   - window.player._portalNext  (portal-arming swirl color)
//
// The customizer UI in the inline HTML script reads PLAYER_CUSTOM,
// the *_VARIANTS maps, and the *_PRESETS arrays directly — so each
// of those is mirrored as a bare window global too. PLAYER_CUSTOM is
// a single object whose identity is preserved across load/save/reset
// (everything uses Object.assign in-place), so `window.PLAYER_CUSTOM`
// stays a live reference.
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  // ═══════════════════════════════════════════════════════════════
  //  PLAYER CUSTOMIZATION SYSTEM
  // ═══════════════════════════════════════════════════════════════
  //
  // The player's appearance is driven by `PLAYER_CUSTOM`, a global
  // object loaded from localStorage at startup. Each part has a list
  // of named preset variants defined in *_VARIANTS maps below.
  //
  // To add a new option:
  //   1. Add a new entry to the matching *_VARIANTS map (a function
  //      that draws on top of the head/feet/etc. at the right pos).
  //   2. The customizer screen's category list auto-picks it up.
  //   3. Run the game and pick it from the customizer UI.

  /** @type {{hat:string,face:string,beard:string,beardColor:string,skin:string,jacket:string,jacketAccent:string,sporran:string,stockings:string,sockStyle:string,shoes:string,bagpipeType:number,bagpipeAccent:string}} */
  let PLAYER_CUSTOM = {
    hat:           'tam',          // see HAT_VARIANTS keys
    face:          'cheerful',     // see FACE_VARIANTS keys
    beard:         'full',         // see BEARD_VARIANTS keys ('clean' = shaven)
    beardColor:    '#8b3a14',      // beard tint (free hex)
    skin:          '#e8c8a0',      // hex
    jacket:        '#1a3a1a',      // jacket main colour
    jacketAccent:  '#0f2a14',      // jacket shadow / trim
    sporran:       '#5a3a18',      // front pouch
    stockings:     '#e8e8d8',      // socks main color
    sockStyle:     'short',        // 'short' (default — shoes visible) | 'tall' | 'argyle'
    shoes:         'ghillie',      // see SHOE_VARIANTS keys
    cape:          'none',         // see CAPE_VARIANTS keys ('none' = no cape)
    capeColor:     '#8b0000',      // cape primary tint (free hex, default crimson)
    bagpipeType:   0,              // 0 = use level's chosen type, 1-5 = player override
    bagpipeAccent: '',             // '' = use type's default accent, else hex override
  };
  const PLAYER_CUSTOM_LS_KEY = 'pogl_player_custom_v1';
  function _loadPlayerCustom() {
    try {
      const raw = localStorage.getItem(PLAYER_CUSTOM_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          PLAYER_CUSTOM = Object.assign(PLAYER_CUSTOM, parsed);
        }
      }
    } catch (e) { /* ignore — fall back to defaults */ }
    // ── Migration: 'beard' and 'mustache' used to be face accessories;
    // they're now their own slot. Move stale face values into the beard.
    if (PLAYER_CUSTOM.face === 'beard' || PLAYER_CUSTOM.face === 'mustache') {
      if (!PLAYER_CUSTOM.beard || PLAYER_CUSTOM.beard === 'full') {
        PLAYER_CUSTOM.beard = (PLAYER_CUSTOM.face === 'mustache') ? 'mustache' : 'full';
      }
      PLAYER_CUSTOM.face = 'cheerful';
    }
  }
  function _savePlayerCustom() {
    try { localStorage.setItem(PLAYER_CUSTOM_LS_KEY, JSON.stringify(PLAYER_CUSTOM)); }
    catch (e) { /* localStorage full / disabled — silently ignore */ }
  }
  _loadPlayerCustom();

  // ── HAT VARIANTS ────────────────────────────────────────────────
  // Drawn at the TOP of the head — coordinates are NEGATIVE Y (above
  // the sprite origin). Each variant receives:
  //   (px, breath, th)   — pixel helper, breath bob offset, theme
  // The original tam was drawn at x=5-27, y=-15..-2 — variants stay
  // in that bounding box so they look correct on every pose.
  // NOTE: `px` already adds the body-breath bob internally, so variant
  // y-coordinates are written WITHOUT adding `breath` themselves.
  const HAT_VARIANTS = {
    none: () => { /* bald */ },
    tam: (px, th) => {
      // Original tam o' shanter — themed.
      px(8,  -6, 16, 4, th.hc);
      px(7,  -8, 18, 5, th.hc);
      px(5,  -9, 22, 4, th.hc);
      for (let hx = 0; hx < 22; hx += 4) px(5 + hx, -8, 2, 4, th.hb);
      for (let hy = 0; hy < 4; hy += 2) px(5,  -9 + hy, 22, 1, th.hb);
      px(12, -13, 8, 5, th.tr);
      px(13, -14, 6, 3, th.pp);
      px(14, -15, 4, 2, '#fff8c0');
      px(8,  -7,  4, 3, th.tr);
      px(9,  -7,  2, 2, '#fff');
    },
    beanie: (px) => {
      px(6,  -8,  20, 4, '#5a1a1a');
      px(7,  -10, 18, 3, '#7a2a2a');
      px(9,  -12, 14, 2, '#7a2a2a');
      px(13, -14,  6, 2, '#e8d8b0');             // pom
      px(14, -15,  4, 1, '#fff8c0');
    },
    feathered: (px) => {
      // Tall Highland feathered bonnet.
      px(6, -10, 20, 5, '#0a0a0a');
      px(7, -12, 18, 3, '#1a1a1a');
      px(8, -13, 16, 2, '#1a1a1a');
      // Feather plume sticks way up.
      px(12, -19, 2, 7, '#e8e0c0');
      px(13, -21, 1, 9, '#f4ece0');
      px(14, -18, 1, 6, '#d8c898');
    },
    top: (px, th) => {
      // Top hat — formal silhouette.
      px(7,  -7, 18, 2, '#0a0a0a');              // brim
      px(10, -16, 12, 9, '#0a0a0a');             // tube
      px(10, -9, 12, 1, th.tr);                  // band
      px(10, -16, 12, 1, '#2a2a2a');             // top highlight
    },
    beret: (px) => {
      px(5, -8,  22, 4, '#2a1a4a');
      px(7, -10, 18, 3, '#4a2a8a');
      px(9, -11, 14, 2, '#5a3a9a');
      px(23, -10, 3, 2, '#1a0a3a');              // angled tilt
    },
    crown: (px) => {
      px(7, -8,  18, 3, '#c8a020');
      px(7, -11,  2, 3, '#f5d640');              // left spike
      px(23, -11, 2, 3, '#f5d640');              // right spike
      px(13, -12, 2, 4, '#f5d640');              // center spike
      px(14, -13, 2, 1, '#fff4a0');              // gem
      px(8, -7,   4, 2, '#ff8a8a');              // ruby inset
    },
    flatcap: (px) => {
      px(5, -7,  22, 3, '#5a4a30');
      px(7, -10, 18, 4, '#7a6a48');
      px(9, -11, 14, 2, '#9a8a68');
      px(25, -7,  3, 2, '#3a2a18');              // peaked brim
    },
    viking: (px) => {
      // Horned helm.
      px(7,  -10, 18, 6, '#7a7a7a');
      px(8,  -11, 16, 2, '#9a9a9a');
      px(4,  -12,  4, 4, '#e8d8b0');             // left horn
      px(24, -12,  4, 4, '#e8d8b0');             // right horn
      px(4,  -13,  2, 2, '#f4ece0');
      px(26, -13,  2, 2, '#f4ece0');
      px(15, -7,   2, 2, '#3a2a18');             // strap
    },
    pirate: (px) => {
      // Tricorne — black with skull patch.
      px(4,  -7, 24, 3, '#0a0a0a');              // wide brim
      px(8,  -10, 16, 3, '#0a0a0a');              // crown
      px(12, -12, 8, 2, '#0a0a0a');              // peak
      px(14, -8, 4, 2, '#fff');                  // skull patch
      px(14, -6, 1, 1, '#0a0a0a'); px(17, -6, 1, 1, '#0a0a0a');  // eye sockets
    },
    bandana: (px) => {
      // Knotted cloth wrap.
      px(7, -7, 18, 3, '#a02828');
      px(8, -8, 16, 2, '#c83a3a');
      px(22, -7, 4, 5, '#a02828');               // knot tail
      px(23, -6, 2, 3, '#c83a3a');
      for (let i = 0; i < 4; i++) px(9 + i * 4, -7, 1, 1, '#fff');  // dots
    },
    wizard: (px) => {
      // Tall pointed wizard hat.
      px(6,  -8, 20, 3, '#1a1a4a');               // wide brim
      px(11, -12, 10, 4, '#1a1a4a');              // base cone
      px(13, -16, 6, 4, '#1a1a4a');               // mid cone
      px(15, -20, 2, 4, '#1a1a4a');               // tip
      px(14, -10, 4, 1, '#ffd700');               // gold band
      px(15, -14, 1, 1, '#ffd700');               // star
      px(18, -16, 1, 1, '#fff');                  // sparkle
    },
    fez: (px) => {
      px(8, -10, 16, 6, '#a02828');
      px(8, -10, 16, 1, '#8b1a1a');
      px(14, -13, 4, 4, '#a02828');               // cylinder top
      px(13, -14, 6, 1, '#1a1a1a');               // band
      px(15, -16, 2, 2, '#1a1a1a');               // tassel root
      px(16, -16, 1, 4, '#ffd700');               // tassel
    },
    santa: (px) => {
      px(7, -10, 18, 4, '#c82a2a');
      px(7,  -7, 18, 2, '#fff');                  // fluffy band
      px(11, -13, 10, 3, '#c82a2a');
      px(14, -16,  6, 3, '#c82a2a');              // floppy top
      px(17, -17,  3, 2, '#fff');                 // pom
    },
    cowboy: (px) => {
      px(4,  -7, 24, 2, '#5a3a18');               // wide brim
      px(7,  -10, 18, 3, '#5a3a18');              // crown
      px(8,  -12, 16, 2, '#5a3a18');              // dome
      px(7,  -10, 18, 1, '#3a2418');              // crown shadow
      px(12, -13, 8, 1, '#3a2418');               // pinch
      px(14, -11, 4, 1, '#8b6914');               // band
    },
    halo: (px) => {
      // Floating gold ring above the head — no actual hat, just a ring.
      px(8,  -13, 16, 2, '#ffe680');              // top arc
      px(8,  -12, 1,  3, '#ffd24a');              // left edge
      px(23, -12, 1,  3, '#ffd24a');              // right edge
      px(9,  -10, 14, 1, '#ffd24a');              // bottom arc
      px(13, -14, 6,  1, '#fff8c0');              // top highlight
    },
    jester: (px) => {
      px(6, -10, 20, 4, '#a02a82');               // base
      px(7,  -7, 18, 2, '#7a1860');
      // Three colorful points with bells
      px(7,  -14, 4, 4, '#a02a82'); px(7,  -16, 2, 2, '#a02a82'); px(8,  -17, 2, 2, '#ffd66a');
      px(13, -16, 4, 4, '#2a8a44'); px(14, -18, 2, 2, '#2a8a44'); px(15, -19, 2, 2, '#ffd66a');
      px(20, -14, 4, 4, '#1a6acc'); px(21, -16, 2, 2, '#1a6acc'); px(22, -17, 2, 2, '#ffd66a');
    },
    catEars: (px) => {
      // Triangular cat ears on either side of the head + a thin band.
      px(7,  -8, 18, 2, '#5a3a4a');               // headband
      // Left ear
      px(7,  -11, 4, 3, '#3a1a2a');
      px(8,  -13, 2, 2, '#3a1a2a');
      px(9,  -14, 1, 1, '#3a1a2a');
      px(8,  -11, 2, 2, '#ff9ac0');               // inner pink
      // Right ear
      px(21, -11, 4, 3, '#3a1a2a');
      px(22, -13, 2, 2, '#3a1a2a');
      px(22, -14, 1, 1, '#3a1a2a');
      px(22, -11, 2, 2, '#ff9ac0');
    },
    headphones: (px) => {
      // Over-ear cans + headband arc
      px(8,  -10, 16, 2, '#1a1a2a');              // headband top
      px(6,   -8, 4, 7, '#1a1a2a');               // left ear cup
      px(22,  -8, 4, 7, '#1a1a2a');               // right ear cup
      px(7,   -7, 2, 5, '#3a3a4a');               // left cushion
      px(23,  -7, 2, 5, '#3a3a4a');               // right cushion
      px(6,   -6, 1, 1, '#88c8ff');               // left LED
      px(25,  -6, 1, 1, '#88c8ff');               // right LED
    },
    witch: (px) => {
      // Pointy witch hat with a buckle band
      px(6,  -7, 20, 3, '#1a0a2a');               // wide brim
      px(10, -10, 12, 3, '#1a0a2a');              // crown base
      px(12, -14, 8, 4, '#1a0a2a');               // mid cone
      px(14, -17, 4, 3, '#1a0a2a');               // top cone
      px(15, -19, 2, 2, '#1a0a2a');               // tip
      px(11, -10, 10, 1, '#ffd66a');              // buckle band
      px(15, -10, 2, 1, '#0a0418');               // buckle hole
    },
    hood: (px) => {
      // Cloak hood — covers most of the head, leaves face visible
      px(5,  -8, 22, 3, '#3a2018');               // hood mass
      px(6,  -11, 20, 3, '#3a2018');
      px(8,  -13, 16, 2, '#3a2018');
      px(7,  -9, 22, 1, '#5a3424');               // brow highlight
      // Inner shadow under the brim
      px(11, -7, 10, 1, '#0a0408');
    },
    bandana_blue: (px) => {
      // Pirate-style sky blue bandana with a knot tail
      px(7, -7, 18, 3, '#2a6acc');
      px(8, -8, 16, 2, '#3a7adc');
      px(22, -7, 4, 5, '#2a6acc');                // knot tail
      px(23, -6, 2, 3, '#3a7adc');
      for (let i = 0; i < 4; i++) px(9 + i * 4, -7, 1, 1, '#fff');
    },
    construction: (px) => {
      // Yellow hard hat
      px(7,  -8, 18, 3, '#ffaa00');
      px(9,  -11, 14, 3, '#ffaa00');
      px(11, -13, 10, 2, '#ffaa00');
      px(9,  -8, 18, 1, '#cc8800');                // brim shadow
      // Visor strap
      px(12, -10, 8, 1, '#ee9900');
    },
  };

  // ── FACE VARIANTS ──────────────────────────────────────────────
  // The base face (eyes/mouth) is drawn in the expression code
  // around y=5-12. These add on top. NOTE: beards now have their own
  // BEARD_VARIANTS slot below — keep this map for non-beard extras.
  const FACE_VARIANTS = {
    cheerful:  () => { /* default face stays as-is */ },
    serious:   () => { /* default face stays as-is */ },
    glasses: (px) => {
      // Eye whites span x=11..14 (left) and x=17..20 (right), y=4..7.
      // Draw two outlined lens frames over them + a bridge between.
      // Left lens — outline only, 4x4 over the eye:
      px(11, 4, 4, 1, '#1a1a1a');                 // top frame
      px(11, 7, 4, 1, '#1a1a1a');                 // bottom frame
      px(11, 5, 1, 2, '#1a1a1a');                 // left frame
      px(14, 5, 1, 2, '#1a1a1a');                 // right frame
      px(12, 4, 2, 1, '#cfe8ff');                 // top-lens reflection
      // Right lens:
      px(17, 4, 4, 1, '#1a1a1a');
      px(17, 7, 4, 1, '#1a1a1a');
      px(17, 5, 1, 2, '#1a1a1a');
      px(20, 5, 1, 2, '#1a1a1a');
      px(18, 4, 2, 1, '#cfe8ff');
      // Bridge across the nose between the two lenses
      px(15, 5, 2, 1, '#1a1a1a');
      // Stems going off to the ears
      px(10, 5, 1, 1, '#1a1a1a');
      px(21, 5, 1, 1, '#1a1a1a');
    },
    sunglasses: (px) => {
      // Filled-black aviator-style shades — fully cover both 4x4 eye
      // areas, with a small white highlight in each top-left corner.
      px(11, 4, 4, 4, '#0a0a0a');                 // left lens fill
      px(17, 4, 4, 4, '#0a0a0a');                 // right lens fill
      px(15, 5, 2, 1, '#0a0a0a');                 // bridge
      px(12, 4, 1, 1, '#cfe8ff');                 // left catchlight
      px(18, 4, 1, 1, '#cfe8ff');                 // right catchlight
      px(13, 4, 1, 1, '#3a3a4a');                 // left mid-glint
      px(19, 4, 1, 1, '#3a3a4a');                 // right mid-glint
      // Stems for that "actually wearable shades" silhouette
      px(10, 5, 1, 1, '#0a0a0a');
      px(21, 5, 1, 1, '#0a0a0a');
    },
    eyepatch: (px) => {
      // Covers the left eye + strap across the brow.
      px(11, 4, 4, 4, '#0a0a0a');                 // patch
      px(11, 4, 4, 1, '#2a1a08');                 // strap top
      px(10, 3, 14, 1, '#2a1a08');                // strap line
    },
    wink: (px) => {
      px(13, 7, 3, 1, '#1a1a1a');                // closed left eye
    },
    facepaint: (px) => {
      // Blue Scottish war stripes — slim vertical bars on the cheeks
      // BELOW the eyes (y=4..7) and on either side of the mouth row
      // (x=13..18 at y=9). Previous design painted over eyes + lips.
      const C = '#2a6acc';
      px(10, 8, 1, 5, C);   // left outer cheek bar
      px(12, 8, 1, 5, C);   // left inner cheek bar
      px(19, 8, 1, 5, C);   // right inner cheek bar
      px(21, 8, 1, 5, C);   // right outer cheek bar
      px(15, 2, 2, 2, C);   // forehead bridge stripe
    },
    facepaint_red: (px) => {
      const C = '#cc2a2a';
      px(10, 8, 1, 5, C);
      px(12, 8, 1, 5, C);
      px(19, 8, 1, 5, C);
      px(21, 8, 1, 5, C);
      px(15, 2, 2, 2, C);
    },
    facepaint_green: (px) => {
      // Tribal woad green — three horizontal slashes across the cheeks.
      const C = '#2aaa3a';
      px(9,  10, 4, 1, C);   // left lower slash
      px(9,  8,  3, 1, C);   // left upper slash
      px(19, 10, 4, 1, C);   // right lower slash
      px(20, 8,  3, 1, C);   // right upper slash
    },
    facepaint_white: (px) => {
      // Pale skull / tribal pattern — dots under each eye + chin patch.
      const C = '#f0f0f0';
      px(11, 8, 1, 1, C); px(13, 8, 1, 1, C);
      px(18, 8, 1, 1, C); px(20, 8, 1, 1, C);
      px(14, 11, 4, 2, C);   // chin patch
    },
    scar: (px) => {
      // Vertical scar across the right cheek.
      px(20, 4, 1, 5, '#a0382a');
      px(20, 4, 1, 1, '#fff');                    // highlight tip
    },
    thickbrow: (px) => {
      px(12, 4, 4, 1, '#3a1a08');
      px(17, 4, 4, 1, '#3a1a08');
    },
    freckles: (px) => {
      px(11, 7, 1, 1, '#8b4a2a'); px(13, 7, 1, 1, '#8b4a2a');
      px(18, 7, 1, 1, '#8b4a2a'); px(20, 7, 1, 1, '#8b4a2a');
      px(15, 6, 1, 1, '#8b4a2a');
    },
    monocle: (px) => {
      // Single circle around the right eye, with a chain dangling
      px(17, 4, 4, 1, '#1a1a1a');                 // top of frame
      px(17, 7, 4, 1, '#1a1a1a');                 // bottom of frame
      px(17, 5, 1, 2, '#1a1a1a');                 // left edge
      px(20, 5, 1, 2, '#1a1a1a');                 // right edge
      px(18, 5, 2, 1, '#cfe8ff');                 // reflection
      // Chain hanging
      px(21, 6, 1, 1, '#888');
      px(22, 7, 1, 1, '#888');
      px(22, 8, 1, 1, '#888');
    },
    cyber_visor: (px) => {
      // Cyberpunk-style horizontal visor covering both eyes — solid band
      px(11, 4, 10, 4, '#0a0418');                // dark base
      px(11, 5, 10, 2, '#ff3ed8');                // neon pink scanline
      px(11, 5, 10, 1, '#ff8fee');                // top highlight
      px(11, 4, 1, 4, '#222');                    // left frame
      px(20, 4, 1, 4, '#222');                    // right frame
    },
    eyeliner: (px) => {
      // Thin dark lash line above each eye
      px(11, 3, 4, 1, '#1a1a1a');                 // left lash
      px(17, 3, 4, 1, '#1a1a1a');                 // right lash
      px(14, 3, 1, 1, '#1a1a1a');                 // tail flick
      px(20, 3, 1, 1, '#1a1a1a');
    },
    blush: (px) => {
      // Soft pink blush on the cheeks
      px(10, 7, 2, 2, '#ffaab0');
      px(20, 7, 2, 2, '#ffaab0');
      px(10, 7, 1, 1, '#ffc8d0');                 // highlight
      px(21, 7, 1, 1, '#ffc8d0');
    },
    third_eye: (px) => {
      // Mystical third eye on the forehead
      px(14, 1, 4, 2, '#cfe8ff');                 // white
      px(15, 1, 2, 2, '#aa6aff');                 // iris
      px(15, 1, 1, 1, '#fff');                    // highlight
      px(13, 0, 6, 1, '#5a2080');                 // top eyelid
      px(13, 3, 6, 1, '#5a2080');                 // bottom eyelid
    },
  };

  // ── BEARD VARIANTS ──────────────────────────────────────────────
  // The base sprite no longer hard-bakes a beard. These draw on top
  // of the head/expression at the standard upright pose. The variant
  // signature is (px, c1, c2) where c1 is the main beard color and c2
  // is a darker shade (auto-derived from PLAYER_CUSTOM.beardColor).
  // 'clean' = no facial hair (pristine chin so face shines through).
  const BEARD_VARIANTS = {
    clean: () => { /* shaven */ },
    stubble: (px, c1) => {
      // A few scattered dots — light shadow effect.
      px(11, 11, 10, 1, c1 + '80');
      px(11, 12, 10, 1, c1 + '60');
      px(13, 9, 6, 1, '#5a2a00');                 // mouth shadow
    },
    mustache: (px, c1, c2) => {
      px(11, 8, 10, 2, c1); px(10, 8, 2, 1, c2); px(20, 8, 2, 1, c2);
      px(13, 9, 6, 1, '#5a2a00');                 // mouth
    },
    goatee: (px, c1, c2) => {
      px(13, 9, 6, 1, '#5a2a00');                 // mouth
      px(14, 10, 4, 3, c1);                       // chin patch
      px(15, 13, 2, 1, c2);                       // shadow
    },
    chinstrap: (px, c1) => {
      // Thin strip along the jawline only.
      px(10, 8, 2, 4, c1); px(20, 8, 2, 4, c1);   // side jaws
      px(11, 12, 10, 1, c1);                      // chin line
      px(13, 9, 6, 1, '#5a2a00');
    },
    vandyke: (px, c1, c2) => {
      // Mustache + pointy goatee.
      px(11, 8, 10, 1, c1); px(10, 8, 2, 1, c2); px(20, 8, 2, 1, c2);
      px(14, 10, 4, 3, c1);
      px(15, 13, 2, 2, c1);
      px(13, 9, 6, 1, '#5a2a00');
    },
    full: (px, c1, c2) => {
      // The classic Highlander — covers chin + cheeks + mustache.
      px(11, 8, 10, 2, c1); px(10, 8, 2, 1, c2); px(20, 8, 2, 1, c2);
      px(13, 9, 6, 1, '#5a2a00');
      px(10, 8, 12, 4, c1); px(11, 10, 10, 3, c2);
      for (let i = 0; i < 4; i++) px(11 + i * 3, 12, 2, 3, c1);
    },
    bushy: (px, c1, c2) => {
      // Bigger, fuller. Extends one row further down.
      px(10, 7, 12, 3, c1); px(9, 8, 1, 4, c1); px(22, 8, 1, 4, c1);
      px(13, 9, 6, 1, '#5a2a00');
      px(10, 9, 12, 5, c1); px(11, 11, 10, 3, c2);
      for (let i = 0; i < 5; i++) px(10 + i * 3, 13, 2, 3, c1);
    },
    muttonchops: (px, c1, c2) => {
      // Sideburns + mustache, but the chin stays clean.
      px(11, 8, 10, 1, c1); px(10, 8, 2, 1, c2); px(20, 8, 2, 1, c2);  // mustache
      px(9, 5, 2, 5, c1); px(21, 5, 2, 5, c1);                          // side
      px(10, 9, 1, 3, c1); px(21, 9, 1, 3, c1);                         // jaw
      px(13, 9, 6, 1, '#5a2a00');
    },
    handlebar: (px, c1, c2) => {
      // Long handlebar mustache — curls at the ends, big middle
      px(11, 8, 10, 1, c1);                       // base strip
      px(10, 7, 2, 2, c2);                        // left end curl
      px(20, 7, 2, 2, c2);                        // right end curl
      px(9,  8, 1, 1, c1);                        // left tail
      px(22, 8, 1, 1, c1);                        // right tail
      px(13, 9, 6, 1, '#5a2a00');
    },
    soul_patch: (px, c1) => {
      // Single tuft just below the lower lip
      px(15, 10, 2, 2, c1);
      px(13, 9, 6, 1, '#5a2a00');                 // mouth still visible
    },
    long: (px, c1, c2) => {
      // Extra-long Highland beard — extends below the chin
      px(11, 8, 10, 2, c1);
      px(10, 8, 2, 1, c2); px(20, 8, 2, 1, c2);
      px(13, 9, 6, 1, '#5a2a00');
      px(10, 8, 12, 6, c1);                       // full chin mass
      px(11, 11, 10, 5, c2);
      px(12, 16, 8, 2, c1);                       // extends down
      px(13, 18, 6, 1, c2);                       // tip
      for (let i = 0; i < 4; i++) px(11 + i * 3, 14, 2, 4, c1);
    },
    braided: (px, c1, c2) => {
      // Beard tied into a single braid below the chin
      px(11, 8, 10, 2, c1);
      px(10, 8, 2, 1, c2); px(20, 8, 2, 1, c2);
      px(13, 9, 6, 1, '#5a2a00');
      px(11, 10, 10, 3, c1);
      px(14, 13, 4, 2, c2);                       // braid neck
      px(15, 15, 2, 2, c1);                       // braid section 1
      px(15, 17, 2, 2, c2);                       // braid section 2
      px(15, 19, 2, 2, c1);                       // braid section 3
      px(14, 21, 4, 1, c2);                       // tie band
    },
  };

  // ── SOCK STYLE VARIANTS ─────────────────────────────────────────
  // Replaces the inline stocking block. Each variant receives:
  //   (pxL, leftLegOff, rightLegOff, sockColor, accentColor)
  // 'short' is the new default — stops well above the boot so the
  // shoe choice is visible at the ankle.
  const SOCK_VARIANTS = {
    short: (pxL, lLo, rLo, sock, acc) => {
      // 8 px tall — y=36..44. Shoes (y=46..50) stay fully visible.
      pxL(5, 36, 6, 8, sock, lLo); pxL(18, 36, 6, 8, sock, rLo);
      for (let i = 0; i < 2; i++) {
        const yy = 38 + i * 3;
        pxL(7, yy, 2, 2, acc, lLo); pxL(19, yy, 2, 2, acc, rLo);
      }
    },
    tall: (pxL, lLo, rLo, sock, acc) => {
      // Classic 12 px Highland kilt sock — covers the calf.
      pxL(5, 36, 6, 12, sock, lLo); pxL(18, 36, 6, 12, sock, rLo);
      for (let i = 0; i < 3; i++) {
        const yy = 38 + i * 4;
        pxL(7, yy, 2, 2, acc, lLo); pxL(19, yy, 2, 2, acc, rLo);
        pxL(6, yy + 1, 1, 1, acc, lLo); pxL(8, yy + 1, 1, 1, acc, lLo);
        pxL(18, yy + 1, 1, 1, acc, rLo); pxL(20, yy + 1, 1, 1, acc, rLo);
      }
    },
    argyle: (pxL, lLo, rLo, sock, acc) => {
      // Diamond argyle pattern, 10 px tall — y=36..46.
      pxL(5, 36, 6, 10, sock, lLo); pxL(18, 36, 6, 10, sock, rLo);
      // Diamond accents
      for (let i = 0; i < 2; i++) {
        const yy = 37 + i * 4;
        pxL(7, yy + 1, 2, 2, acc, lLo); pxL(19, yy + 1, 2, 2, acc, rLo);
        pxL(8, yy, 1, 1, acc, lLo); pxL(8, yy + 3, 1, 1, acc, lLo);
        pxL(20, yy, 1, 1, acc, rLo); pxL(20, yy + 3, 1, 1, acc, rLo);
      }
    },
    striped: (pxL, lLo, rLo, sock, acc) => {
      // Horizontal stripes alternating colors.
      pxL(5, 36, 6, 9, sock, lLo); pxL(18, 36, 6, 9, sock, rLo);
      for (let i = 0; i < 4; i++) {
        const yy = 36 + i * 2;
        pxL(5, yy, 6, 1, acc, lLo); pxL(18, yy, 6, 1, acc, rLo);
      }
    },
    'no-show': (pxL, lLo, rLo, sock) => {
      // Hides the sock entirely (uses skin tone from the closure caller's pc).
      // Caller supplies skin via `sock` argument when this variant is chosen.
      pxL(5, 42, 6, 4, sock, lLo); pxL(18, 42, 6, 4, sock, rLo);
    },
  };

  // ── SHOE VARIANTS ──────────────────────────────────────────────
  // Drawn at boot row (y=46-50). Uses pxL which adds leftLegOff /
  // rightLegOff for the alternating walk cycle.
  const SHOE_VARIANTS = {
    ghillie: (pxL, leftLegOff, rightLegOff) => {
      pxL(4,  46, 7, 3, '#3a2a18', leftLegOff);
      pxL(4,  48, 8, 2, '#1a0a04', leftLegOff);
      pxL(17, 46, 7, 3, '#3a2a18', rightLegOff);
      pxL(17, 48, 8, 2, '#1a0a04', rightLegOff);
      // Crossed laces
      pxL(6, 45, 1, 1, '#1a0a04', leftLegOff);
      pxL(8, 45, 1, 1, '#1a0a04', leftLegOff);
      pxL(19, 45, 1, 1, '#1a0a04', rightLegOff);
      pxL(21, 45, 1, 1, '#1a0a04', rightLegOff);
    },
    boot: (pxL, leftLegOff, rightLegOff) => {
      // Original heavy black boot — what the bagpiper had originally.
      pxL(4,  46, 7, 3, '#0d0700', leftLegOff);
      pxL(4,  48, 8, 2, '#1a0d00', leftLegOff);
      pxL(17, 46, 7, 3, '#0d0700', rightLegOff);
      pxL(17, 48, 8, 2, '#1a0d00', rightLegOff);
      pxL(6,  47, 2, 1, '#8b6914', leftLegOff);     // buckle
      pxL(19, 47, 2, 1, '#8b6914', rightLegOff);
    },
    sandal: (pxL, leftLegOff, rightLegOff) => {
      pxL(4,  48, 7, 2, '#8a5a30', leftLegOff);
      pxL(17, 48, 7, 2, '#8a5a30', rightLegOff);
      pxL(6,  46, 1, 3, '#5a3a18', leftLegOff);     // straps
      pxL(8,  46, 1, 3, '#5a3a18', leftLegOff);
      pxL(19, 46, 1, 3, '#5a3a18', rightLegOff);
      pxL(21, 46, 1, 3, '#5a3a18', rightLegOff);
    },
    sneaker: (pxL, leftLegOff, rightLegOff) => {
      pxL(4,  46, 7, 3, '#f0f0e8', leftLegOff);
      pxL(4,  48, 8, 2, '#1a1a1a', leftLegOff);      // sole
      pxL(17, 46, 7, 3, '#f0f0e8', rightLegOff);
      pxL(17, 48, 8, 2, '#1a1a1a', rightLegOff);
      pxL(4,  47, 7, 1, '#ff4a4a', leftLegOff);      // racing stripe
      pxL(17, 47, 7, 1, '#ff4a4a', rightLegOff);
    },
    barefoot: (pxL, leftLegOff, rightLegOff, skinCol) => {
      // Just feet — uses skin tone.
      const skin = skinCol || '#e8c8a0';
      pxL(4,  47, 7, 3, skin, leftLegOff);
      pxL(17, 47, 7, 3, skin, rightLegOff);
      pxL(4,  49, 7, 1, '#a89570', leftLegOff);     // shadow
      pxL(17, 49, 7, 1, '#a89570', rightLegOff);
    },
    kiltedclog: (pxL, leftLegOff, rightLegOff) => {
      pxL(4,  46, 7, 4, '#5a3a18', leftLegOff);
      pxL(4,  48, 8, 2, '#3a1a04', leftLegOff);
      pxL(17, 46, 7, 4, '#5a3a18', rightLegOff);
      pxL(17, 48, 8, 2, '#3a1a04', rightLegOff);
      pxL(6,  46, 3, 1, '#8a6a40', leftLegOff);
      pxL(19, 46, 3, 1, '#8a6a40', rightLegOff);
    },
    hightop: (pxL, leftLegOff, rightLegOff) => {
      // Basketball high-top — taller silhouette.
      pxL(4,  44, 7, 5, '#c8000a', leftLegOff);
      pxL(4,  48, 8, 2, '#1a1a1a', leftLegOff);    // sole
      pxL(17, 44, 7, 5, '#c8000a', rightLegOff);
      pxL(17, 48, 8, 2, '#1a1a1a', rightLegOff);
      pxL(4,  46, 7, 1, '#fff', leftLegOff);       // white stripe
      pxL(17, 46, 7, 1, '#fff', rightLegOff);
    },
    heels: (pxL, leftLegOff, rightLegOff) => {
      // Slim heel with arch.
      pxL(4,  47, 7, 2, '#1a0a0a', leftLegOff);
      pxL(8,  49, 2, 1, '#1a0a0a', leftLegOff);    // heel spike
      pxL(17, 47, 7, 2, '#1a0a0a', rightLegOff);
      pxL(21, 49, 2, 1, '#1a0a0a', rightLegOff);
      pxL(5, 46, 1, 1, '#a04040', leftLegOff);     // bow accent
      pxL(18, 46, 1, 1, '#a04040', rightLegOff);
    },
    armor: (pxL, leftLegOff, rightLegOff) => {
      // Greaves — metal foot armor.
      pxL(4,  45, 7, 5, '#888', leftLegOff);
      pxL(4,  49, 8, 1, '#444', leftLegOff);
      pxL(17, 45, 7, 5, '#888', rightLegOff);
      pxL(17, 49, 8, 1, '#444', rightLegOff);
      pxL(4,  45, 7, 1, '#bbb', leftLegOff);       // top highlight
      pxL(17, 45, 7, 1, '#bbb', rightLegOff);
      pxL(7,  47, 1, 1, '#ffd700', leftLegOff);    // rivets
      pxL(20, 47, 1, 1, '#ffd700', rightLegOff);
    },
    cowboy_boot: (pxL, leftLegOff, rightLegOff) => {
      pxL(4,  44, 7, 6, '#5a2a08', leftLegOff);
      pxL(4,  48, 8, 2, '#3a1804', leftLegOff);
      pxL(17, 44, 7, 6, '#5a2a08', rightLegOff);
      pxL(17, 48, 8, 2, '#3a1804', rightLegOff);
      pxL(4,  46, 7, 1, '#c8a020', leftLegOff);    // gold stitch
      pxL(17, 46, 7, 1, '#c8a020', rightLegOff);
    },
    running: (pxL, leftLegOff, rightLegOff) => {
      // Bright running shoes — neon-trim athletic look
      pxL(4,  46, 7, 3, '#222', leftLegOff);
      pxL(4,  48, 8, 2, '#fff', leftLegOff);       // white sole
      pxL(17, 46, 7, 3, '#222', rightLegOff);
      pxL(17, 48, 8, 2, '#fff', rightLegOff);
      pxL(5,  47, 5, 1, '#7fff7f', leftLegOff);    // neon stripe
      pxL(18, 47, 5, 1, '#7fff7f', rightLegOff);
      pxL(8,  46, 1, 1, '#ff66e0', leftLegOff);    // accent dot
      pxL(21, 46, 1, 1, '#ff66e0', rightLegOff);
    },
    snow_boot: (pxL, leftLegOff, rightLegOff) => {
      // Insulated winter boot — bulky, white fur cuff
      pxL(4,  44, 7, 6, '#3a3a48', leftLegOff);    // boot body
      pxL(4,  48, 8, 2, '#1a1a24', leftLegOff);    // sole
      pxL(4,  44, 7, 1, '#fff', leftLegOff);       // fur cuff
      pxL(17, 44, 7, 6, '#3a3a48', rightLegOff);
      pxL(17, 48, 8, 2, '#1a1a24', rightLegOff);
      pxL(17, 44, 7, 1, '#fff', rightLegOff);
      pxL(5,  47, 1, 1, '#88c8ff', leftLegOff);    // tiny ice highlight
      pxL(20, 47, 1, 1, '#88c8ff', rightLegOff);
    },
    roller_skates: (pxL, leftLegOff, rightLegOff) => {
      // Quad roller skates — 4 wheels per foot
      pxL(4,  46, 7, 2, '#cc1a1a', leftLegOff);    // red boot top
      pxL(4,  48, 8, 1, '#fff', leftLegOff);       // white sole/plate
      // Wheels — 2 per foot, dark with bright centers
      pxL(4,  49, 2, 1, '#222', leftLegOff);
      pxL(8,  49, 2, 1, '#222', leftLegOff);
      pxL(17, 46, 7, 2, '#cc1a1a', rightLegOff);
      pxL(17, 48, 8, 1, '#fff', rightLegOff);
      pxL(17, 49, 2, 1, '#222', rightLegOff);
      pxL(21, 49, 2, 1, '#222', rightLegOff);
    },
    geta: (pxL, leftLegOff, rightLegOff) => {
      // Japanese-style wooden geta with two cross supports
      pxL(4,  47, 7, 1, '#8a5a2a', leftLegOff);    // platform top
      pxL(4,  49, 7, 1, '#3a2010', leftLegOff);    // supports
      pxL(17, 47, 7, 1, '#8a5a2a', rightLegOff);
      pxL(17, 49, 7, 1, '#3a2010', rightLegOff);
      // Toe strap
      pxL(7,  46, 1, 1, '#cc1a1a', leftLegOff);
      pxL(20, 46, 1, 1, '#cc1a1a', rightLegOff);
    },
    slippers: (pxL, leftLegOff, rightLegOff) => {
      // Fluffy bed slippers
      pxL(4,  46, 7, 3, '#dda0c8', leftLegOff);
      pxL(4,  48, 8, 2, '#bb80a0', leftLegOff);
      pxL(17, 46, 7, 3, '#dda0c8', rightLegOff);
      pxL(17, 48, 8, 2, '#bb80a0', rightLegOff);
      // Fluffy puff on top
      pxL(6,  45, 3, 1, '#fff8f4', leftLegOff);
      pxL(19, 45, 3, 1, '#fff8f4', rightLegOff);
    },
  };

  // ── CAPE VARIANTS ──────────────────────────────────────────────
  // Cape draws BEHIND the body (called first in drawBagpiper32 after
  // the legs but before the torso). Each variant takes:
  //   (px, c1, c2)   where c1 is the cape main color, c2 a derived
  //   darker shade. The cape attaches around the shoulders (y=10) and
  //   falls to the lower-leg / kilt area (y=44). Default is 'none' so
  //   existing players who never opened the customizer get no cape.
  const CAPE_VARIANTS = {
    none: () => { /* no cape */ },
    classic: (px, c1, c2) => {
      // Trapezoidal cape — wide at shoulders, narrower at the hem
      px(2, 10, 28, 4, c1);                       // shoulder yoke
      px(3, 14, 26, 12, c1);                      // mid section
      px(4, 26, 24, 12, c1);                      // lower section
      px(5, 38, 22, 6, c1);                       // hem
      // Vertical shadow line down the center
      px(15, 12, 2, 32, c2);
      // Trim around the edges
      px(3, 13, 1, 12, c2); px(28, 13, 1, 12, c2);
      px(5, 43, 22, 1, c2);                       // hem shadow
    },
    royal: (px, c1, c2) => {
      // Royal cape — fur collar + gold trim
      px(2, 10, 28, 3, '#fff8f4');                // fur collar
      px(3, 13, 26, 12, c1);
      px(4, 25, 24, 13, c1);
      px(5, 38, 22, 7, c1);
      // Gold trim
      px(3, 13, 1, 25, '#ffd66a'); px(28, 13, 1, 25, '#ffd66a');
      px(5, 44, 22, 1, '#ffd66a');
      // Sheen down the middle
      px(15, 14, 2, 30, c2);
    },
    short: (px, c1, c2) => {
      // Short cape — only covers the upper back
      px(3, 10, 26, 3, c1);
      px(4, 13, 24, 8, c1);
      px(5, 21, 22, 3, c1);
      px(15, 12, 2, 11, c2);
      px(5, 23, 22, 1, c2);                       // hem shadow
    },
    tartan: (px, c1, c2) => {
      // Tartan/plaid pattern over the cape
      px(2, 10, 28, 4, c1);
      px(3, 14, 26, 24, c1);
      px(4, 38, 24, 6, c1);
      // Plaid stripes
      for (let y = 13; y < 44; y += 4) px(3, y, 26, 1, c2);
      for (let x = 5; x < 30; x += 6) px(x, 11, 1, 33, c2);
    },
    wings: (px, c1, c2) => {
      // Feathered wings — two large arcs spreading off the back
      // Left wing
      px(-2, 12, 6, 14, c1);
      px(-4, 14, 4, 10, c1);
      px(-1, 26, 5, 6, c2);
      // Right wing
      px(28, 12, 6, 14, c1);
      px(30, 14, 4, 10, c1);
      px(27, 26, 5, 6, c2);
      // Feather highlights
      px(-2, 13, 1, 12, '#fff');
      px(33, 13, 1, 12, '#fff');
    },
    ghost: (px, c1) => {
      // Translucent ghostly cape — wavy edges
      px(3, 10, 26, 28, c1 + 'a0');               // semi-transparent
      // Wavy hem
      for (let i = 0; i < 7; i++) {
        const wx = 3 + i * 4;
        px(wx, 38, 2, 2, c1 + 'c0');
        px(wx + 2, 39, 2, 1, c1 + '80');
      }
      // Floaty sparkles
      px(8, 16, 1, 1, '#fff');
      px(20, 22, 1, 1, '#fff');
      px(12, 32, 1, 1, '#fff');
    },
    scarf: (px, c1, c2) => {
      // Skinny long scarf hanging behind — not a full cape
      px(13, 10, 6, 3, c1);                       // collar
      px(14, 13, 4, 12, c1);                      // back drape
      px(13, 22, 6, 4, c1);                       // mid
      px(14, 26, 4, 14, c1);                      // long tail
      px(13, 38, 6, 4, c1);                       // tail end
      // Fringe at the bottom
      px(13, 42, 1, 2, c2); px(15, 42, 1, 2, c2);
      px(17, 42, 1, 2, c2); px(18, 42, 1, 2, c2);
    },
  };

  // ── SKIN TONE PRESETS ──────────────────────────────────────────
  const SKIN_PRESETS = [
    '#f4dab4', '#e8c8a0', '#d4a878', '#b88858', '#8a6038', '#5a3818',
  ];
  // ── JACKET COLOR PRESETS ───────────────────────────────────────
  const JACKET_PRESETS = [
    ['#1a3a1a', '#0f2a14'],   // forest green (default)
    ['#6b0000', '#4a0000'],   // crimson
    ['#1a1a4a', '#0a0a2a'],   // navy
    ['#4a1a00', '#2a0e00'],   // burgundy
    ['#1a4a3a', '#0a2a1f'],   // teal
    ['#4a2a00', '#2a1500'],   // brown
    ['#6a006a', '#3a003a'],   // purple
    ['#1a1a1a', '#0a0a0a'],   // black
  ];
  // ── STOCKING COLOR PRESETS ─────────────────────────────────────
  const STOCKING_PRESETS = [
    '#e8e8d8', '#f4ecc8', '#c8b890', '#8a7050',
    '#1a1a1a', '#6b0000', '#1a3a6b', '#3a3a3a',
  ];
  // ── SPORRAN COLOR PRESETS ──────────────────────────────────────
  const SPORRAN_PRESETS = [
    '#4a2a00', '#5a3a18', '#8b5a2a', '#2a1400',
    '#1a1a1a', '#4a0000', '#3a2a4a', '#c8a020',
  ];

  // ── Helper: derive the full palette the sprite needs from
  // PLAYER_CUSTOM (with sensible fallbacks). The sprite mixes
  // bagpipe-type theme colors (`th.jk`/`th.jd`) with player-chosen
  // skin / jacket / stockings / sporran. Skin shadows are derived
  // so swapping skin presets keeps the chin/ear shading coherent.
  function _shadeHex(hex, amt) {
    const s = (typeof hex === 'string' && hex[0] === '#') ? hex.slice(1) : 'd4a060';
    const n = parseInt(s.length === 3
      ? s[0]+s[0]+s[1]+s[1]+s[2]+s[2] : s, 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
    const g = Math.max(0, Math.min(255, ((n >>  8) & 255) + amt));
    const b = Math.max(0, Math.min(255, ( n        & 255) + amt));
    return '#' + (((r << 16) | (g << 8) | b) & 0xffffff).toString(16).padStart(6, '0');
  }
  // ── Memoized player palette ─────────────────────────────────────
  // _playerColors() is called by every sprite-draw pass (player + each
  // aim/crouch frame, often multiple times per game frame). The
  // computation does ~5 _shadeHex() calls — each with parseInt +
  // padStart + a stack of Math.min/max — plus allocates a fresh
  // result object. PLAYER_CUSTOM only mutates from the customizer
  // screen, so in gameplay every call should hit the cache.
  //
  // Cache key:
  //   • a "signature" string of the 6 mutable PLAYER_CUSTOM color
  //     fields. Cheap string concat (~10ns) vs the ~50µs raw compute.
  //   • the bagpipe-theme object identity (th) since jacket /
  //     jacketAccent fall through to th.jk / th.jd. At most 5 entries
  //     in the Map (one per bagpipe type).
  let _pcSig = '';
  const _pcCache = new Map();
  function _playerColors(th) {
    const sig = (PLAYER_CUSTOM.skin       || '') + '|' +
                (PLAYER_CUSTOM.sporran    || '') + '|' +
                (PLAYER_CUSTOM.beardColor || '') + '|' +
                (PLAYER_CUSTOM.jacket     || '') + '|' +
                (PLAYER_CUSTOM.jacketAccent || '') + '|' +
                (PLAYER_CUSTOM.stockings  || '');
    if (sig !== _pcSig) { _pcCache.clear(); _pcSig = sig; }
    let pc = _pcCache.get(th);
    if (pc) return pc;
    const skin      = PLAYER_CUSTOM.skin       || '#d4a060';
    const sporran   = PLAYER_CUSTOM.sporran    || '#4a2a00';
    const beard     = PLAYER_CUSTOM.beardColor || '#8b3a14';
    const stockings = PLAYER_CUSTOM.stockings  || '#e8e8d8';
    pc = {
      skin,
      skinDark:     _shadeHex(skin, -28),
      skinEar:      _shadeHex(skin, -20),
      jacket:       PLAYER_CUSTOM.jacket       || th.jk,
      jacketDark:   PLAYER_CUSTOM.jacketAccent || th.jd,
      stockings,
      stockingsDark: _shadeHex(stockings, -32),
      sporran,
      sporranLight: _shadeHex(sporran, 32),
      beard,
      beardDark:    _shadeHex(beard, -28),
    };
    _pcCache.set(th, pc);
    return pc;
  }
  // Resolve the player's chosen bagpipe accent (overrides theme accent)
  // when the bagpipe slot is being drawn. Empty string = use default.
  function _bagpipeAccent(th) {
    return (PLAYER_CUSTOM.bagpipeAccent && PLAYER_CUSTOM.bagpipeAccent[0] === '#')
      ? PLAYER_CUSTOM.bagpipeAccent
      : th.tr;
  }
  // Player can pin a specific bagpipe type via the customizer (1-5);
  // 0 / unset means honor whatever the caller passed in (level default).
  function _effectiveBpType(bpType) {
    const pinned = PLAYER_CUSTOM.bagpipeType | 0;
    return (pinned >= 1 && pinned <= 5) ? pinned : bpType;
  }

  function drawBagpiper32(c, ox, oy, facingRight, frame, shieldOn, chargeOn, bpType, walkFrame, expression) {
    c.save();
    if (!facingRight) {
      c.translate(ox * 2 + 32, 0);
      c.scale(-1, 1);
    }
    const X = ox, Y = oy;
    const _wf = walkFrame || 0;
    const bob = Math.round(Math.abs(Math.sin(_wf * 0.22)) * 2);
    const legPhase = Math.sin(_wf * 0.22);
    const leftLegOff = Math.round(legPhase * 2);
    const rightLegOff = -leftLegOff;
    const armSwing = Math.round(Math.sin(_wf * 0.22) * 1.5);
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y + bob, w, h); }
    function pxL(x, y, w, h, col, lo) { c.fillStyle = col; c.fillRect(X + x, Y + y + bob + lo, w, h); }

    // Per-bagpipe-type visual themes (player can override via customizer)
    const _bp = _effectiveBpType(bpType || 1);
    // jacket/arm color, trim, kilt primary, kilt secondary, kilt stripe, stocking stripe, hat color, hat band
    const _themes = [
      null, // 0 unused
      { jk: '#1a3a1a', jd: '#14301a', tr: '#c8a820', k1: '#8b0000', k2: '#1a1a6b', k3: '#c0000a', ss: '#1a5c2e', hc: '#1a5c2e', hb: '#0e4d7d', pp: '#c8a820' }, // 1 standard green/red
      { jk: '#1a1a4a', jd: '#10102e', tr: '#44ffcc', k1: '#2a006b', k2: '#44ffcc', k3: '#4a00aa', ss: '#44ffcc', hc: '#2a1a5a', hb: '#44ccaa', pp: '#44ffcc' }, // 2 double bounce purple/teal
      { jk: '#0a1e3a', jd: '#061422', tr: '#4488cc', k1: '#00204a', k2: '#4488cc', k3: '#002a6a', ss: '#4488cc', hc: '#0a2a4a', hb: '#4488cc', pp: '#88ccff' }, // 3 piercing navy/blue
      { jk: '#4a1800', jd: '#2e0e00', tr: '#ffd700', k1: '#5a1000', k2: '#ffd700', k3: '#8b2000', ss: '#ffa500', hc: '#3a1000', hb: '#ffd700', pp: '#ff8800' }, // 4 charge orange/gold
      { jk: '#1a0a3a', jd: '#100622', tr: '#8866ff', k1: '#1a0050', k2: '#8866ff', k3: '#2a0080', ss: '#ff66aa', hc: '#1a0a3a', hb: '#8866ff', pp: '#ff66aa' }, // 5 portal deep purple/pink
    ];
    const th = _themes[Math.min(_bp, 5)] || _themes[1];
    // Player-chosen palette (overrides bagpipe-theme jacket etc.).
    const pc = _playerColors(th);

    // Shoes — picked from SHOE_VARIANTS via PLAYER_CUSTOM.shoes.
    const _shoeFn = SHOE_VARIANTS[PLAYER_CUSTOM.shoes] || SHOE_VARIANTS.boot;
    _shoeFn(pxL, leftLegOff, rightLegOff, pc.skin);
    // Socks — picked from SOCK_VARIANTS; default 'short' keeps shoes visible.
    const _sockKey = PLAYER_CUSTOM.sockStyle || 'short';
    const _sockFn  = SOCK_VARIANTS[_sockKey] || SOCK_VARIANTS.short;
    _sockFn(pxL, leftLegOff, rightLegOff,
      _sockKey === 'no-show' ? pc.skin : pc.stockings, th.ss);
    // ── Cape — drawn BEFORE the kilt/jacket so everything else
    // renders on top of it (cape sits behind the player's body).
    // 'none' draws nothing.
    const _capeKey = PLAYER_CUSTOM.cape || 'none';
    const _capeFn = CAPE_VARIANTS[_capeKey] || CAPE_VARIANTS.none;
    const _capeC1 = (PLAYER_CUSTOM.capeColor && PLAYER_CUSTOM.capeColor[0] === '#')
      ? PLAYER_CUSTOM.capeColor : '#8b0000';
    const _capeC2 = _shadeHex(_capeC1, -32);
    _capeFn(px, _capeC1, _capeC2);
    // Top knee garter — always painted regardless of sock length.
    px(4, 36, 8, 2, th.tr); px(17, 36, 8, 2, th.tr);
    // Kilt — colors from theme
    for (let ky = 0; ky < 14; ky++) {
      for (let kx = 0; kx < 24; kx++) {
        const col = (kx % 8 < 2 || ky % 8 < 2) ? th.k1 : ((kx % 4 < 1 || ky % 4 < 1) ? th.k2 : th.k3);
        c.fillStyle = col; c.fillRect(X + 4 + kx, Y + 24 + ky + bob, 1, 1);
      }
    }
    for (let i = 0; i < 6; i++) px(4 + i * 4, 24, 1, 14, 'rgba(0,0,0,.2)');
    px(4, 23, 24, 3, '#2a1400');
    px(10, 23, 6, 3, '#4a2800'); px(12, 24, 2, 1, th.tr); px(11, 23, 4, 3, 'rgba(200,168,32,.3)');
    // Sporran (player-chosen color + derived highlight)
    px(11, 31, 10, 8, pc.sporran); px(12, 32, 8, 6, pc.sporranLight);
    px(11, 30, 10, 2, '#d4c898');
    for (let i = 0; i < 5; i++) px(11 + i * 2, 29, 1, 3, '#bbb090');
    px(12, 38, 2, 3, pc.sporran); px(16, 38, 2, 3, pc.sporran);
    px(11, 40, 2, 2, th.tr); px(17, 40, 2, 2, th.tr);
    // Jacket — player-chosen color, falls back to bagpipe theme
    px(5, 8, 22, 17, pc.jacket);
    px(5, 8, 4, 17, pc.jacketDark); px(23, 8, 4, 17, pc.jacketDark);
    px(5, 8, 22, 2, th.tr); px(5, 8, 2, 17, th.tr); px(25, 8, 2, 17, th.tr);
    for (let i = 0; i < 3; i++) { px(14, 10 + i * 5, 3, 3, '#666'); px(15, 11 + i * 5, 1, 1, '#aaa'); }
    px(12, 8, 8, 4, '#e8e8e8'); px(13, 9, 6, 3, '#fff'); px(13, 5, 6, 4, pc.skin);
    px(14, 8, 4, 7, '#1a1a1a'); px(15, 9, 2, 5, '#111');
    // Arms — themed (left arm swings opposite phase to right leg)
    pxL(0, 10, 7, 12, pc.jacket, -armSwing); pxL(0, 10, 2, 12, th.tr, -armSwing); pxL(0, 20, 7, 3, pc.skin, -armSwing);
    px(25, 10, 7, 12, pc.jacket); px(30, 10, 2, 12, th.tr); px(25, 18, 7, 5, pc.skin);
    // Bagpipes — distinct per type. Each type's prominent accent stripe
    // is sourced from _bagpipeAccent(th) so the customizer can override.
    const _bpAcc = _bagpipeAccent(th);
    if (_bp === 1) {
      // Type 1: Standard Highland Bagpipe
      px(-4, 6, 14, 12, '#6b2a0a'); px(-3, 7, 12, 10, '#8b3a14');
      px(-3, 8, 12, 2, _bpAcc); px(-3, 11, 12, 1, '#1a5c2e'); px(-3, 14, 12, 1, _bpAcc);
      px(-3, 0, 3, 8, '#4a2200'); px(-3, -1, 5, 2, '#2a1400'); px(1, 2, 3, 6, '#4a2200'); px(0, 1, 5, 2, '#2a1400');
      px(5, 0, 3, 7, '#4a2200'); px(4, -1, 5, 2, '#2a1400');
      px(-4, 3, 5, 2, '#888'); px(0, 5, 5, 2, '#888'); px(4, 3, 5, 2, '#888'); px(2, 4, 4, 4, '#4a2200');
      px(26, 14, 12, 3, '#3a1800'); px(28, 17, 3, 10, '#2a1000');
      for (let i = 0; i < 5; i++)px(29, 18 + i * 1.5 | 0, 1, 1, '#000'); px(27, 26, 5, 4, '#3a1800');
    } else if (_bp === 2) {
      // Type 2: Double Bounce — two chanters, one up-right one down-right
      px(-4, 6, 14, 12, '#4a1a6b'); px(-3, 7, 12, 10, '#6b2a9b'); // purple bag
      px(-3, 8, 12, 2, _bpAcc); px(-3, 11, 12, 1, '#2a2a6b'); px(-3, 14, 12, 1, _bpAcc);
      px(-3, 0, 3, 8, '#3a1a4a'); px(-3, -1, 5, 2, '#2a1040'); px(1, 2, 3, 6, '#3a1a4a'); px(0, 1, 5, 2, '#2a1040');
      px(5, 0, 3, 7, '#3a1a4a'); px(4, -1, 5, 2, '#2a1040');
      px(-4, 3, 5, 2, '#aa88ff'); px(0, 5, 5, 2, '#aa88ff'); px(4, 3, 5, 2, '#aa88ff'); px(2, 4, 4, 4, '#3a1a4a');
      // Upper chanter (45° up)
      px(26, 10, 14, 3, '#2a1a3a'); px(34, 6, 3, 8, '#1a0a2a'); px(33, 4, 4, 3, '#aa88ff');
      // Lower chanter (45° down)
      px(26, 18, 14, 3, '#2a1a3a'); px(34, 20, 3, 8, '#1a0a2a'); px(33, 26, 4, 3, '#aa88ff');
    } else if (_bp === 3) {
      // Type 3: Piercing — sleek long sniper pipe
      px(-4, 8, 12, 8, '#0a1a2a'); px(-3, 9, 10, 6, '#1a3a5a'); // dark blue bag
      px(-3, 9, 10, 2, _bpAcc); px(-3, 12, 10, 1, '#1a3a5a'); px(-3, 14, 10, 1, _bpAcc);
      px(-2, 3, 2, 7, '#0a1020'); px(2, 2, 2, 8, '#0a1020'); px(-2, 2, 4, 2, '#4488cc'); px(1, 1, 4, 2, '#4488cc');
      px(-4, 5, 5, 2, '#2266aa'); px(0, 5, 5, 2, '#2266aa'); px(3, 5, 4, 2, '#2266aa');
      // Long sleek piercing pipe
      px(26, 15, 24, 3, '#1a3a5a'); px(26, 15, 24, 1, '#4488cc'); // long barrel
      px(48, 14, 4, 5, '#0a1020'); px(50, 13, 2, 7, '#4488cc'); // scope/tip
      for (let i = 0; i < 6; i++)px(28 + i * 3, 16, 2, 1, '#4488cc'); // barrel markings
    } else if (_bp === 4) {
      // Type 4: Charge — big heavy power cannon bagpipe
      px(-6, 4, 18, 16, '#6b2a00'); px(-5, 5, 16, 14, '#a04010'); // large orange bag
      px(-5, 6, 16, 3, _bpAcc); px(-5, 10, 16, 1, '#8b2000'); px(-5, 14, 16, 2, _bpAcc);
      px(-4, -2, 4, 8, '#5a1a00'); px(-3, -3, 6, 3, '#4a1000'); px(1, 0, 3, 8, '#5a1a00'); px(0, -1, 5, 3, '#4a1000');
      px(5, -1, 3, 8, '#5a1a00'); px(4, -2, 5, 3, '#4a1000');
      px(-5, 3, 5, 3, '#ffd700'); px(0, 5, 5, 3, '#ffd700'); px(4, 3, 5, 3, '#ffd700');
      // Heavy cannon barrel
      px(26, 12, 16, 7, '#4a2200'); px(26, 13, 16, 5, '#7a3800'); // thick barrel
      px(40, 11, 6, 9, '#3a1400'); px(42, 10, 4, 11, '#2a0a00'); // barrel end
      for (let i = 0; i < 4; i++)px(28 + i * 3, 13, 2, 5, 'rgba(0,0,0,.3)'); // grooves
      // Charge glow
      c.globalAlpha = 0.3 + Math.sin(frame * .2) * .15;
      c.fillStyle = '#ff8800'; c.fillRect(X + 42, Y + 12 + bob, 8, 8); c.globalAlpha = 1;
    } else if (_bp === 5) {
      // Type 5: Portal — swirling mystical pipes
      px(-4, 6, 14, 12, '#1a0a3a'); px(-3, 7, 12, 10, '#3a1a5a'); // deep purple bag
      px(-3, 8, 12, 2, _bpAcc); px(-3, 11, 12, 1, '#1a0a3a'); px(-3, 14, 12, 1, '#ff66aa');
      px(-3, 0, 3, 8, '#2a1040'); px(-3, -1, 5, 2, '#1a0a2a'); px(1, 2, 3, 6, '#2a1040'); px(0, 1, 5, 2, '#1a0a2a');
      px(5, 0, 3, 7, '#2a1040'); px(4, -1, 5, 2, '#1a0a2a');
      px(-4, 3, 5, 2, '#8866ff'); px(0, 5, 5, 2, '#ff66aa'); px(4, 3, 5, 2, '#8866ff');
      // Portal pipe with swirl end
      px(26, 14, 12, 3, '#2a1040'); px(37, 12, 5, 7, '#3a1a5a'); // pipe + portal housing
      // Swirl color reflects which portal is armed (A/S keys toggle this
      // on the player object). Player can read this from across the
      // screen — purple = A queued, pink = B queued.
      const _portalArmedStd = (typeof window !== 'undefined' && window.player && window.player._portalNext) || 'A';
      const _swirlColStd = _portalArmedStd === 'A' ? '#8866ff' : '#ff66aa';
      const _swirlPulseStd = 0.7 + Math.abs(Math.sin(frame * 0.18)) * 0.3;
      c.globalAlpha = 0.85 * _swirlPulseStd; c.fillStyle = _swirlColStd;
      c.beginPath(); c.arc(X + 43, Y + 15 + bob, 5, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.55; c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(X + 43, Y + 15 + bob, 2, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      px(28, 17, 3, 10, '#2a1040');
    }
    // Head — player skin color drives the face fill + derived shadows
    px(10, 0, 12, 10, pc.skin); px(11, 7, 10, 3, pc.skinDark);
    px(9, 3, 2, 4, pc.skinEar); px(21, 3, 2, 4, pc.skinEar);
    px(11, 2, 4, 2, '#8b3a14'); px(17, 2, 4, 2, '#8b3a14');
    px(11, 4, 4, 4, '#fff'); px(17, 4, 4, 4, '#fff');
    px(12, 5, 2, 2, '#1a6080'); px(18, 5, 2, 2, '#1a6080');
    px(13, 5, 1, 2, '#000'); px(19, 5, 1, 2, '#000');
    px(13, 4, 1, 1, 'rgba(255,255,255,.7)'); px(19, 4, 1, 1, 'rgba(255,255,255,.7)');
    px(14, 6, 4, 2, '#b87040'); px(15, 7, 2, 2, '#8b5030');
    // Mouth/lip baseline — drawn BEFORE the expression so expressions can
    // overdraw it (e.g. 'hurt' grimace, 'surprised' O-mouth). Beard is
    // drawn AFTER the expression below so it always sits on top — a
    // bushy beard hides the lips, but eye expressions still come through.
    px(13, 9, 6, 1, '#5a2a00');

    // ── Expression overlay ──────────────────────────────────────────
    // Overdraw eyes / brow / mouth based on the current expression. The
    // base head above already drew a "neutral" face; everything here
    // replaces specific pixels rather than redrawing the whole head.
    //
    // Eye region:  L=(11..14,4..7)  R=(17..20,4..7)
    // Mouth strip: (13..18, 8..9)
    const _expr = expression || 'neutral';
    if (_expr === 'blink') {
      // Closed-eye slits — skin overdraw + a single dark lash line.
      px(11, 4, 4, 4, pc.skin); px(17, 4, 4, 4, pc.skin);
      px(11, 6, 4, 1, '#5a2a00'); px(17, 6, 4, 1, '#5a2a00');
    } else if (_expr === 'hurt') {
      // X-eyes + grimace. The teeth-line reads as "ow" without needing a
      // separate sprite swap.
      px(11, 4, 4, 4, pc.skin); px(17, 4, 4, 4, pc.skin);
      // Left X
      px(11, 4, 1, 1, '#3a1010'); px(14, 4, 1, 1, '#3a1010');
      px(12, 5, 2, 2, '#3a1010');
      px(11, 7, 1, 1, '#3a1010'); px(14, 7, 1, 1, '#3a1010');
      // Right X
      px(17, 4, 1, 1, '#3a1010'); px(20, 4, 1, 1, '#3a1010');
      px(18, 5, 2, 2, '#3a1010');
      px(17, 7, 1, 1, '#3a1010'); px(20, 7, 1, 1, '#3a1010');
      // Grimace teeth
      px(13, 9, 6, 1, '#f0e8c0');
      px(14, 9, 1, 1, '#3a1010'); px(16, 9, 1, 1, '#3a1010');
    } else if (_expr === 'surprised') {
      // Wide, fully-round eyes — overdraw with white then a small centered
      // pupil. Mouth opens into an "O".
      px(11, 4, 4, 4, '#fff'); px(17, 4, 4, 4, '#fff');
      px(12, 5, 2, 2, '#000'); px(18, 5, 2, 2, '#000');
      // Catchlight high
      px(12, 4, 1, 1, 'rgba(255,255,255,.9)'); px(18, 4, 1, 1, 'rgba(255,255,255,.9)');
      // O-mouth
      px(15, 9, 2, 1, '#3a1010'); px(15, 8, 2, 1, '#5a2020');
    } else if (_expr === 'focused') {
      // Narrow squint + lowered brow. Erases top + bottom rows of the
      // eye, leaving a thin pupil strip.
      px(11, 4, 4, 1, pc.skin); px(11, 7, 4, 1, pc.skin);
      px(17, 4, 4, 1, pc.skin); px(17, 7, 4, 1, pc.skin);
      // Re-emphasize the pupil slit
      px(12, 5, 2, 2, '#000'); px(18, 5, 2, 2, '#000');
      // Brow line just above each eye
      px(11, 3, 4, 1, '#5a2a00'); px(17, 3, 4, 1, '#5a2a00');
    } else if (_expr === 'determined') {
      // Slanted angry brows + gritted teeth. The slants point inward
      // (mirrored across the face) so the player reads as fierce/locked-in.
      px(11, 4, 4, 4, pc.skin); px(17, 4, 4, 4, pc.skin);
      // Left eye: pupils + angled brow
      px(13, 5, 2, 2, '#1a1a1a');
      px(11, 4, 1, 1, '#5a2a00'); px(12, 3, 1, 1, '#5a2a00');
      px(13, 3, 1, 1, '#5a2a00'); px(14, 3, 1, 1, '#3a1a00');
      // Right eye: mirror
      px(17, 5, 2, 2, '#1a1a1a');
      px(17, 3, 1, 1, '#3a1a00'); px(18, 3, 1, 1, '#5a2a00');
      px(19, 3, 1, 1, '#5a2a00'); px(20, 4, 1, 1, '#5a2a00');
      // Gritted teeth
      px(13, 9, 6, 1, '#f0e8c0');
      px(13, 9, 1, 1, '#3a1010'); px(15, 9, 1, 1, '#3a1010'); px(17, 9, 1, 1, '#3a1010');
    } else if (_expr === 'proud') {
      // Star-power face: rainbow sparkle pupils + a small smile. Cycles
      // with `frame` for that "I am invincible" shimmer.
      px(11, 4, 4, 4, '#fff'); px(17, 4, 4, 4, '#fff');
      const _hue = (frame * 8) % 360;
      c.fillStyle = `hsl(${_hue}, 100%, 55%)`;
      c.fillRect(X + 12, Y + 5 + bob, 2, 2);
      c.fillRect(X + 18, Y + 5 + bob, 2, 2);
      // Catchlight glints
      px(12, 4, 1, 1, '#fff8c0'); px(18, 4, 1, 1, '#fff8c0');
      // Smile (corners up)
      px(13, 9, 6, 1, '#5a2a00');
      px(13, 8, 1, 1, '#5a2a00'); px(18, 8, 1, 1, '#5a2a00');
    }
    // 'neutral' falls through with the default head above.

    // ── Beard (post-expression) — drawn on top of the mouth area so
    // mustaches/full beards remain visible regardless of the player's
    // expression. Eye-region expression overrides (blink/hurt/surprised
    // etc.) still come through because beards only touch y >= 8.
    const _beardKey = PLAYER_CUSTOM.beard || 'full';
    const _beardFn = BEARD_VARIANTS[_beardKey] || BEARD_VARIANTS.full;
    _beardFn(px, pc.beard, pc.beardDark);

    // ── Hat — pulled from HAT_VARIANTS keyed by PLAYER_CUSTOM.hat.
    //   `px` already adds the breath bob internally, so variants
    //   pass plain Y coordinates and don't add anything themselves.
    const _hatFn = HAT_VARIANTS[PLAYER_CUSTOM.hat] || HAT_VARIANTS.tam;
    _hatFn(px, th);
    // ── Face overlay — beard / glasses / paint applied on top of
    //   the expression head we just drew.
    const _faceFn = FACE_VARIANTS[PLAYER_CUSTOM.face];
    if (_faceFn) _faceFn(px);

    // Powers
    if (shieldOn) {
      c.globalAlpha = .3; c.fillStyle = '#7fff00'; c.fillRect(X - 6, Y - 16 + bob, 44, 72);
      c.globalAlpha = .1; c.fillRect(X - 10, Y - 20 + bob, 52, 80); c.globalAlpha = 1;
    }
    if (chargeOn) {
      c.globalAlpha = .5; c.fillStyle = '#ff6600'; c.fillRect(X - 12, Y + bob, 12, 50);
      c.globalAlpha = .25; c.fillRect(X - 22, Y + bob, 12, 50); c.globalAlpha = 1;
    }
    c.restore();
  }

  // ─── Aim-Up sprite: head tilted back, arm raised, chanter pointing up ──
  function drawBagpiperAimUp(c, ox, oy, facingRight, frame, shieldOn, chargeOn, bpType, walkFrame, expression) {
    c.save();
    if (!facingRight) { c.translate(ox * 2 + 32, 0); c.scale(-1, 1); }
    const X = ox, Y = oy;
    const bob = Math.round(Math.abs(Math.sin((walkFrame || 0) * 0.22)) * 2);
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y + bob, w, h); }
    const _bp = _effectiveBpType(bpType || 1);
    const _themes = [null,
      { jk: '#1a3a1a', jd: '#14301a', tr: '#c8a820', k1: '#8b0000', k2: '#1a1a6b', k3: '#c0000a', ss: '#1a5c2e', hc: '#1a5c2e', hb: '#0e4d7d', pp: '#c8a820' },
      { jk: '#1a1a4a', jd: '#10102e', tr: '#44ffcc', k1: '#2a006b', k2: '#44ffcc', k3: '#4a00aa', ss: '#44ffcc', hc: '#2a1a5a', hb: '#44ccaa', pp: '#44ffcc' },
      { jk: '#0a1e3a', jd: '#061422', tr: '#4488cc', k1: '#00204a', k2: '#4488cc', k3: '#002a6a', ss: '#4488cc', hc: '#0a2a4a', hb: '#4488cc', pp: '#88ccff' },
      { jk: '#4a1800', jd: '#2e0e00', tr: '#ffd700', k1: '#5a1000', k2: '#ffd700', k3: '#8b2000', ss: '#ffa500', hc: '#3a1000', hb: '#ffd700', pp: '#ff8800' },
      { jk: '#1a0a3a', jd: '#100622', tr: '#8866ff', k1: '#1a0050', k2: '#8866ff', k3: '#2a0080', ss: '#ff66aa', hc: '#1a0a3a', hb: '#8866ff', pp: '#ff66aa' },
    ];
    const th = _themes[Math.min(_bp, 5)] || _themes[1];
    const pc = _playerColors(th);
    // Shoes + Stockings — dispatch through SHOE_VARIANTS / SOCK_VARIANTS
    // so the player's customizer picks apply to the aiming poses too.
    // Those variants take a `pxL(x,y,w,h,col,lo)` 6-ary helper for the
    // leg-swing offset. The still poses don't swing, so we pass `px`
    // directly — it has the right name/arity for the first 5 args and
    // simply ignores the 6th. (Avoids allocating a wrapper closure
    // every frame while aiming.)
    {
      const _shoeFn = SHOE_VARIANTS[PLAYER_CUSTOM.shoes] || SHOE_VARIANTS.boot;
      _shoeFn(px, 0, 0, pc.skin);
      const _sockKey = PLAYER_CUSTOM.sockStyle || 'short';
      const _sockFn  = SOCK_VARIANTS[_sockKey] || SOCK_VARIANTS.short;
      _sockFn(px, 0, 0,
        _sockKey === 'no-show' ? pc.skin : pc.stockings, th.ss);
    }
    px(4, 36, 8, 2, th.tr); px(17, 36, 8, 2, th.tr);
    // Kilt
    for (let ky = 0; ky < 14; ky++) { for (let kx = 0; kx < 24; kx++) { const col = (kx % 8 < 2 || ky % 8 < 2) ? th.k1 : ((kx % 4 < 1 || ky % 4 < 1) ? th.k2 : th.k3); c.fillStyle = col; c.fillRect(X + 4 + kx, Y + 24 + ky + bob, 1, 1); } }
    for (let i = 0; i < 6; i++) px(4 + i * 4, 24, 1, 14, 'rgba(0,0,0,.2)');
    px(4, 23, 24, 3, '#2a1400'); px(10, 23, 6, 3, '#4a2800'); px(12, 24, 2, 1, th.tr); px(11, 23, 4, 3, 'rgba(200,168,32,.3)');
    // Sporran
    px(11, 31, 10, 8, pc.sporran); px(12, 32, 8, 6, pc.sporranLight); px(11, 30, 10, 2, '#d4c898');
    for (let i = 0; i < 5; i++) px(11 + i * 2, 29, 1, 3, '#bbb090');
    px(12, 38, 2, 3, pc.sporran); px(16, 38, 2, 3, pc.sporran); px(11, 40, 2, 2, th.tr); px(17, 40, 2, 2, th.tr);
    // Jacket
    px(5, 8, 22, 17, pc.jacket); px(5, 8, 4, 17, pc.jacketDark); px(23, 8, 4, 17, pc.jacketDark);
    px(5, 8, 22, 2, th.tr); px(5, 8, 2, 17, th.tr); px(25, 8, 2, 17, th.tr);
    for (let i = 0; i < 3; i++) { px(14, 10 + i * 5, 3, 3, '#666'); px(15, 11 + i * 5, 1, 1, '#aaa'); }
    px(12, 8, 8, 4, '#e8e8e8'); px(13, 9, 6, 3, '#fff'); px(13, 5, 6, 4, pc.skin);
    px(14, 8, 4, 7, '#1a1a1a'); px(15, 9, 2, 5, '#111');
    // Left arm
    px(0, 10, 7, 12, pc.jacket); px(0, 10, 2, 12, th.tr); px(0, 20, 7, 3, pc.skin);
    // Bagpipe bag (per type)
    if (_bp === 1) {
      px(-4, 6, 14, 12, '#6b2a0a'); px(-3, 7, 12, 10, '#8b3a14');
      px(-3, 8, 12, 2, th.tr); px(-3, 11, 12, 1, th.ss); px(-3, 14, 12, 1, th.tr);
      px(-3, 0, 3, 8, '#4a2200'); px(-3, -1, 5, 2, '#2a1400'); px(1, 2, 3, 6, '#4a2200'); px(0, 1, 5, 2, '#2a1400');
      px(5, 0, 3, 7, '#4a2200'); px(4, -1, 5, 2, '#2a1400');
      px(-4, 3, 5, 2, '#888'); px(0, 5, 5, 2, '#888'); px(4, 3, 5, 2, '#888'); px(2, 4, 4, 4, '#4a2200');
    } else if (_bp === 2) {
      px(-4, 6, 14, 12, '#4a1a6b'); px(-3, 7, 12, 10, '#6b2a9b');
      px(-3, 8, 12, 2, th.tr); px(-3, 11, 12, 1, '#2a2a6b'); px(-3, 14, 12, 1, th.tr);
      px(-3, 0, 3, 8, '#3a1a4a'); px(-3, -1, 5, 2, '#2a1040'); px(1, 2, 3, 6, '#3a1a4a'); px(0, 1, 5, 2, '#2a1040');
      px(5, 0, 3, 7, '#3a1a4a'); px(4, -1, 5, 2, '#2a1040');
      px(-4, 3, 5, 2, '#aa88ff'); px(0, 5, 5, 2, '#aa88ff'); px(4, 3, 5, 2, '#aa88ff'); px(2, 4, 4, 4, '#3a1a4a');
    } else if (_bp === 3) {
      px(-4, 8, 12, 8, '#0a1a2a'); px(-3, 9, 10, 6, '#1a3a5a');
      px(-3, 9, 10, 2, th.tr); px(-3, 12, 10, 1, '#1a3a5a'); px(-3, 14, 10, 1, th.tr);
      px(-2, 3, 2, 7, '#0a1020'); px(2, 2, 2, 8, '#0a1020'); px(-2, 2, 4, 2, th.tr); px(1, 1, 4, 2, th.tr);
      px(-4, 5, 5, 2, '#2266aa'); px(0, 5, 5, 2, '#2266aa'); px(3, 5, 4, 2, '#2266aa');
    } else if (_bp === 4) {
      px(-6, 4, 18, 16, '#6b2a00'); px(-5, 5, 16, 14, '#a04010');
      px(-5, 6, 16, 3, th.tr); px(-5, 10, 16, 1, '#8b2000'); px(-5, 14, 16, 2, th.tr);
      px(-4, -2, 4, 8, '#5a1a00'); px(-3, -3, 6, 3, '#4a1000'); px(1, 0, 3, 8, '#5a1a00'); px(0, -1, 5, 3, '#4a1000');
      px(5, -1, 3, 8, '#5a1a00'); px(4, -2, 5, 3, '#4a1000');
      px(-5, 3, 5, 3, th.tr); px(0, 5, 5, 3, th.tr); px(4, 3, 5, 3, th.tr);
    } else if (_bp === 5) {
      px(-4, 6, 14, 12, '#1a0a3a'); px(-3, 7, 12, 10, '#3a1a5a');
      px(-3, 8, 12, 2, th.tr); px(-3, 11, 12, 1, '#1a0a3a'); px(-3, 14, 12, 1, th.pp);
      px(-3, 0, 3, 8, '#2a1040'); px(-3, -1, 5, 2, '#1a0a2a'); px(1, 2, 3, 6, '#2a1040'); px(0, 1, 5, 2, '#1a0a2a');
      px(5, 0, 3, 7, '#2a1040'); px(4, -1, 5, 2, '#1a0a2a');
      px(-4, 3, 5, 2, th.tr); px(0, 5, 5, 2, th.pp); px(4, 3, 5, 2, th.tr); px(2, 4, 4, 4, '#2a1040');
    }
    // RIGHT ARM raised
    px(25, 4, 6, 14, pc.jacket); px(30, 4, 2, 14, th.tr); px(25, 4, 6, 5, pc.skin);
    // Chanter pointing UP (per type)
    if (_bp === 1) {
      px(27, -12, 3, 26, '#3a1800'); px(27, -14, 3, 3, '#2a1000');
      for (let i = 0; i < 5; i++) px(28, -12 + i * 4, 1, 2, '#000');
    } else if (_bp === 2) {
      px(24, -10, 2, 22, '#2a1a3a'); px(29, -14, 2, 22, '#2a1a3a');
      px(24, -12, 3, 3, '#aa88ff'); px(29, -16, 3, 3, '#aa88ff');
      for (let i = 0; i < 4; i++) { px(24, -10 + i * 5, 2, 2, th.tr); px(29, -14 + i * 5, 2, 2, th.tr); }
    } else if (_bp === 3) {
      px(27, -22, 2, 36, '#1a3a5a'); px(26, -24, 4, 4, '#0a1020'); px(27, -26, 2, 4, th.tr);
      for (let i = 0; i < 6; i++) px(27, -20 + i * 4, 2, 1, th.tr);
    } else if (_bp === 4) {
      px(25, -16, 6, 30, '#4a2200'); px(26, -17, 4, 30, '#7a3800');
      px(24, -18, 8, 5, '#3a1400'); px(25, -20, 6, 4, '#2a0a00');
      for (let i = 0; i < 4; i++) px(26, -14 + i * 5, 4, 2, 'rgba(0,0,0,.3)');
      c.globalAlpha = 0.35 + Math.sin(frame * .2) * .15;
      c.fillStyle = '#ff8800'; c.fillRect(X + 26, Y - 22 + bob, 4, 6); c.globalAlpha = 1;
    } else if (_bp === 5) {
      px(27, -12, 3, 26, '#2a1040');
      const _portalArmedUp = (typeof window !== 'undefined' && window.player && window.player._portalNext) || 'A';
      const _swirlColUp = _portalArmedUp === 'A' ? '#8866ff' : '#ff66aa';
      const _swirlPulseUp = 0.7 + Math.abs(Math.sin(frame * 0.18)) * 0.3;
      c.globalAlpha = 0.85 * _swirlPulseUp; c.fillStyle = _swirlColUp;
      c.beginPath(); c.arc(X + 28, Y - 14 + bob, 5, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.55; c.fillStyle = '#fff';
      c.beginPath(); c.arc(X + 28, Y - 14 + bob, 2, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    }
    // HEAD — tilted back, eyes looking up
    px(10, -2, 12, 10, pc.skin); px(11, 5, 10, 3, pc.skinDark);
    px(9, 1, 2, 4, pc.skinEar); px(21, 1, 2, 4, pc.skinEar);
    px(11, 0, 4, 2, '#8b3a14'); px(17, 0, 4, 2, '#8b3a14');
    px(11, 2, 4, 4, '#fff'); px(17, 2, 4, 4, '#fff');
    px(12, 2, 2, 2, '#1a6080'); px(18, 2, 2, 2, '#1a6080');
    px(13, 2, 1, 2, '#000'); px(19, 2, 1, 2, '#000');
    px(13, 2, 1, 1, 'rgba(255,255,255,.7)'); px(19, 2, 1, 1, 'rgba(255,255,255,.7)');
    px(14, 4, 4, 2, '#b87040'); px(15, 5, 2, 2, '#8b5030');
    // Beard — shifted -2 px because head is tilted back in this pose.
    {
      const _bk = PLAYER_CUSTOM.beard || 'full';
      const _bfn = BEARD_VARIANTS[_bk] || BEARD_VARIANTS.full;
      if (_bk === 'clean') px(13, 7, 6, 1, '#5a2a00');
      _bfn((x, y, w, h, col) => px(x, y - 2, w, h, col), pc.beard, pc.beardDark);
    }
    // Hat — defaulted base draw, overridden by HAT_VARIANTS if the
    // player picked a non-default. We pass a remapped `pxH` that
    // shifts hat coords -2 px to match the tilted-back head.
    {
      const _hatKey = PLAYER_CUSTOM.hat || 'tam';
      const _hfn = HAT_VARIANTS[_hatKey];
      if (_hfn) {
        _hfn((x, y, w, h, col) => px(x, y - 2, w, h, col), th);
      } else {
        // Legacy fallback — same hat painted by the inline code path.
        px(8, -8, 16, 4, th.hc); px(7, -10, 18, 5, th.hc); px(5, -11, 22, 4, th.hc);
        for (let hx = 0; hx < 22; hx += 4) px(5 + hx, -10, 2, 4, th.hb);
        for (let hy = 0; hy < 4; hy += 2) px(5, -11 + hy, 22, 1, th.hb);
        px(12, -15, 8, 5, th.tr); px(13, -16, 6, 3, th.pp); px(14, -17, 4, 2, '#fff8c0');
        px(8, -9, 4, 3, th.tr); px(9, -9, 2, 2, '#fff');
      }
    }
    // Face overlay — same FACE_VARIANTS as the standing pose, shifted
    // -2 px to match the tilted-back head's eye row.
    {
      const _faceFn = FACE_VARIANTS[PLAYER_CUSTOM.face];
      if (_faceFn) _faceFn((x, y, w, h, col) => px(x, y - 2, w, h, col));
    }
    if (shieldOn) { c.globalAlpha = .3; c.fillStyle = '#7fff00'; c.fillRect(X - 6, Y - 16 + bob, 44, 72); c.globalAlpha = .1; c.fillRect(X - 10, Y - 20 + bob, 52, 80); c.globalAlpha = 1; }
    if (chargeOn) { c.globalAlpha = .5; c.fillStyle = '#ff6600'; c.fillRect(X - 12, Y + bob, 12, 50); c.globalAlpha = .25; c.fillRect(X - 22, Y + bob, 12, 50); c.globalAlpha = 1; }
    c.restore();
  }

  // ─── Aim-Down sprite: head forward, arm down, chanter pointing down ──
  function drawBagpiperAimDown(c, ox, oy, facingRight, frame, shieldOn, chargeOn, bpType, walkFrame, expression) {
    c.save();
    if (!facingRight) { c.translate(ox * 2 + 32, 0); c.scale(-1, 1); }
    const X = ox, Y = oy;
    const bob = Math.round(Math.abs(Math.sin((walkFrame || 0) * 0.22)) * 2);
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y + bob, w, h); }
    const _bp = _effectiveBpType(bpType || 1);
    const _themes = [null,
      { jk: '#1a3a1a', jd: '#14301a', tr: '#c8a820', k1: '#8b0000', k2: '#1a1a6b', k3: '#c0000a', ss: '#1a5c2e', hc: '#1a5c2e', hb: '#0e4d7d', pp: '#c8a820' },
      { jk: '#1a1a4a', jd: '#10102e', tr: '#44ffcc', k1: '#2a006b', k2: '#44ffcc', k3: '#4a00aa', ss: '#44ffcc', hc: '#2a1a5a', hb: '#44ccaa', pp: '#44ffcc' },
      { jk: '#0a1e3a', jd: '#061422', tr: '#4488cc', k1: '#00204a', k2: '#4488cc', k3: '#002a6a', ss: '#4488cc', hc: '#0a2a4a', hb: '#4488cc', pp: '#88ccff' },
      { jk: '#4a1800', jd: '#2e0e00', tr: '#ffd700', k1: '#5a1000', k2: '#ffd700', k3: '#8b2000', ss: '#ffa500', hc: '#3a1000', hb: '#ffd700', pp: '#ff8800' },
      { jk: '#1a0a3a', jd: '#100622', tr: '#8866ff', k1: '#1a0050', k2: '#8866ff', k3: '#2a0080', ss: '#ff66aa', hc: '#1a0a3a', hb: '#8866ff', pp: '#ff66aa' },
    ];
    const th = _themes[Math.min(_bp, 5)] || _themes[1];
    const pc = _playerColors(th);
    // Shoes + Stockings — dispatch through SHOE_VARIANTS / SOCK_VARIANTS
    // so the player's customizer picks apply to the aiming poses too.
    // Those variants take a `pxL(x,y,w,h,col,lo)` 6-ary helper for the
    // leg-swing offset. The still poses don't swing, so we pass `px`
    // directly — it has the right name/arity for the first 5 args and
    // simply ignores the 6th. (Avoids allocating a wrapper closure
    // every frame while aiming.)
    {
      const _shoeFn = SHOE_VARIANTS[PLAYER_CUSTOM.shoes] || SHOE_VARIANTS.boot;
      _shoeFn(px, 0, 0, pc.skin);
      const _sockKey = PLAYER_CUSTOM.sockStyle || 'short';
      const _sockFn  = SOCK_VARIANTS[_sockKey] || SOCK_VARIANTS.short;
      _sockFn(px, 0, 0,
        _sockKey === 'no-show' ? pc.skin : pc.stockings, th.ss);
    }
    px(4, 36, 8, 2, th.tr); px(17, 36, 8, 2, th.tr);
    // Kilt
    for (let ky = 0; ky < 14; ky++) { for (let kx = 0; kx < 24; kx++) { const col = (kx % 8 < 2 || ky % 8 < 2) ? th.k1 : ((kx % 4 < 1 || ky % 4 < 1) ? th.k2 : th.k3); c.fillStyle = col; c.fillRect(X + 4 + kx, Y + 24 + ky + bob, 1, 1); } }
    for (let i = 0; i < 6; i++) px(4 + i * 4, 24, 1, 14, 'rgba(0,0,0,.2)');
    px(4, 23, 24, 3, '#2a1400'); px(10, 23, 6, 3, '#4a2800'); px(12, 24, 2, 1, th.tr); px(11, 23, 4, 3, 'rgba(200,168,32,.3)');
    // Sporran
    px(11, 31, 10, 8, pc.sporran); px(12, 32, 8, 6, pc.sporranLight); px(11, 30, 10, 2, '#d4c898');
    for (let i = 0; i < 5; i++) px(11 + i * 2, 29, 1, 3, '#bbb090');
    px(12, 38, 2, 3, pc.sporran); px(16, 38, 2, 3, pc.sporran); px(11, 40, 2, 2, th.tr); px(17, 40, 2, 2, th.tr);
    // Jacket
    px(5, 8, 22, 17, pc.jacket); px(5, 8, 4, 17, pc.jacketDark); px(23, 8, 4, 17, pc.jacketDark);
    px(5, 8, 22, 2, th.tr); px(5, 8, 2, 17, th.tr); px(25, 8, 2, 17, th.tr);
    for (let i = 0; i < 3; i++) { px(14, 10 + i * 5, 3, 3, '#666'); px(15, 11 + i * 5, 1, 1, '#aaa'); }
    px(12, 8, 8, 4, '#e8e8e8'); px(13, 9, 6, 3, '#fff'); px(13, 5, 6, 4, pc.skin);
    px(14, 8, 4, 7, '#1a1a1a'); px(15, 9, 2, 5, '#111');
    // Left arm
    px(0, 10, 7, 12, pc.jacket); px(0, 10, 2, 12, th.tr); px(0, 20, 7, 3, pc.skin);
    // Bagpipe bag (per type)
    if (_bp === 1) {
      px(-4, 6, 14, 12, '#6b2a0a'); px(-3, 7, 12, 10, '#8b3a14');
      px(-3, 8, 12, 2, th.tr); px(-3, 11, 12, 1, th.ss); px(-3, 14, 12, 1, th.tr);
      px(-3, 0, 3, 8, '#4a2200'); px(-3, -1, 5, 2, '#2a1400'); px(1, 2, 3, 6, '#4a2200'); px(0, 1, 5, 2, '#2a1400');
      px(5, 0, 3, 7, '#4a2200'); px(4, -1, 5, 2, '#2a1400');
      px(-4, 3, 5, 2, '#888'); px(0, 5, 5, 2, '#888'); px(4, 3, 5, 2, '#888'); px(2, 4, 4, 4, '#4a2200');
    } else if (_bp === 2) {
      px(-4, 6, 14, 12, '#4a1a6b'); px(-3, 7, 12, 10, '#6b2a9b');
      px(-3, 8, 12, 2, th.tr); px(-3, 11, 12, 1, '#2a2a6b'); px(-3, 14, 12, 1, th.tr);
      px(-3, 0, 3, 8, '#3a1a4a'); px(-3, -1, 5, 2, '#2a1040'); px(1, 2, 3, 6, '#3a1a4a'); px(0, 1, 5, 2, '#2a1040');
      px(5, 0, 3, 7, '#3a1a4a'); px(4, -1, 5, 2, '#2a1040');
      px(-4, 3, 5, 2, '#aa88ff'); px(0, 5, 5, 2, '#aa88ff'); px(4, 3, 5, 2, '#aa88ff'); px(2, 4, 4, 4, '#3a1a4a');
    } else if (_bp === 3) {
      px(-4, 8, 12, 8, '#0a1a2a'); px(-3, 9, 10, 6, '#1a3a5a');
      px(-3, 9, 10, 2, th.tr); px(-3, 12, 10, 1, '#1a3a5a'); px(-3, 14, 10, 1, th.tr);
      px(-2, 3, 2, 7, '#0a1020'); px(2, 2, 2, 8, '#0a1020'); px(-2, 2, 4, 2, th.tr); px(1, 1, 4, 2, th.tr);
      px(-4, 5, 5, 2, '#2266aa'); px(0, 5, 5, 2, '#2266aa'); px(3, 5, 4, 2, '#2266aa');
    } else if (_bp === 4) {
      px(-6, 4, 18, 16, '#6b2a00'); px(-5, 5, 16, 14, '#a04010');
      px(-5, 6, 16, 3, th.tr); px(-5, 10, 16, 1, '#8b2000'); px(-5, 14, 16, 2, th.tr);
      px(-4, -2, 4, 8, '#5a1a00'); px(-3, -3, 6, 3, '#4a1000'); px(1, 0, 3, 8, '#5a1a00'); px(0, -1, 5, 3, '#4a1000');
      px(5, -1, 3, 8, '#5a1a00'); px(4, -2, 5, 3, '#4a1000');
      px(-5, 3, 5, 3, th.tr); px(0, 5, 5, 3, th.tr); px(4, 3, 5, 3, th.tr);
    } else if (_bp === 5) {
      px(-4, 6, 14, 12, '#1a0a3a'); px(-3, 7, 12, 10, '#3a1a5a');
      px(-3, 8, 12, 2, th.tr); px(-3, 11, 12, 1, '#1a0a3a'); px(-3, 14, 12, 1, th.pp);
      px(-3, 0, 3, 8, '#2a1040'); px(-3, -1, 5, 2, '#1a0a2a'); px(1, 2, 3, 6, '#2a1040'); px(0, 1, 5, 2, '#1a0a2a');
      px(5, 0, 3, 7, '#2a1040'); px(4, -1, 5, 2, '#1a0a2a');
      px(-4, 3, 5, 2, th.tr); px(0, 5, 5, 2, th.pp); px(4, 3, 5, 2, th.tr); px(2, 4, 4, 4, '#2a1040');
    }
    // RIGHT ARM angled down
    px(25, 14, 6, 14, pc.jacket); px(30, 14, 2, 14, th.tr); px(25, 24, 6, 5, pc.skin);
    // Chanter pointing DOWN (per type)
    if (_bp === 1) {
      px(27, 24, 3, 26, '#3a1800'); px(27, 48, 3, 3, '#2a1000');
      for (let i = 0; i < 5; i++) px(28, 26 + i * 4, 1, 2, '#000');
    } else if (_bp === 2) {
      px(24, 26, 2, 22, '#2a1a3a'); px(29, 26, 2, 22, '#2a1a3a');
      px(24, 46, 3, 3, '#aa88ff'); px(29, 46, 3, 3, '#aa88ff');
      for (let i = 0; i < 4; i++) { px(24, 26 + i * 5, 2, 2, th.tr); px(29, 26 + i * 5, 2, 2, th.tr); }
    } else if (_bp === 3) {
      px(27, 24, 2, 36, '#1a3a5a'); px(26, 58, 4, 4, '#0a1020'); px(27, 60, 2, 4, th.tr);
      for (let i = 0; i < 6; i++) px(27, 26 + i * 4, 2, 1, th.tr);
    } else if (_bp === 4) {
      px(25, 24, 6, 30, '#4a2200'); px(26, 25, 4, 30, '#7a3800');
      px(24, 52, 8, 5, '#3a1400'); px(25, 54, 6, 4, '#2a0a00');
      for (let i = 0; i < 4; i++) px(26, 26 + i * 5, 4, 2, 'rgba(0,0,0,.3)');
      c.globalAlpha = 0.35 + Math.sin(frame * .2) * .15;
      c.fillStyle = '#ff8800'; c.fillRect(X + 26, Y + 56 + bob, 4, 6); c.globalAlpha = 1;
    } else if (_bp === 5) {
      px(27, 24, 3, 24, '#2a1040');
      const _portalArmedDn = (typeof window !== 'undefined' && window.player && window.player._portalNext) || 'A';
      const _swirlColDn = _portalArmedDn === 'A' ? '#8866ff' : '#ff66aa';
      const _swirlPulseDn = 0.7 + Math.abs(Math.sin(frame * 0.18)) * 0.3;
      c.globalAlpha = 0.85 * _swirlPulseDn; c.fillStyle = _swirlColDn;
      c.beginPath(); c.arc(X + 28, Y + 52 + bob, 5, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.55; c.fillStyle = '#fff';
      c.beginPath(); c.arc(X + 28, Y + 52 + bob, 2, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    }
    // HEAD — tilted forward, eyes looking down
    px(10, 2, 12, 10, pc.skin); px(11, 9, 10, 3, pc.skinDark);
    px(9, 5, 2, 4, pc.skinEar); px(21, 5, 2, 4, pc.skinEar);
    px(11, 4, 4, 2, '#8b3a14'); px(17, 4, 4, 2, '#8b3a14');
    px(11, 6, 4, 4, '#fff'); px(17, 6, 4, 4, '#fff');
    px(12, 8, 2, 2, '#1a6080'); px(18, 8, 2, 2, '#1a6080');
    px(13, 8, 1, 2, '#000'); px(19, 8, 1, 2, '#000');
    px(13, 7, 1, 1, 'rgba(255,255,255,.7)'); px(19, 7, 1, 1, 'rgba(255,255,255,.7)');
    px(14, 8, 4, 2, '#b87040'); px(15, 9, 2, 2, '#8b5030');
    // Beard — shifted +2 px because head is tilted forward.
    {
      const _bk = PLAYER_CUSTOM.beard || 'full';
      const _bfn = BEARD_VARIANTS[_bk] || BEARD_VARIANTS.full;
      if (_bk === 'clean') px(13, 11, 6, 1, '#5a2a00');
      _bfn((x, y, w, h, col) => px(x, y + 2, w, h, col), pc.beard, pc.beardDark);
    }
    // Hat — dispatch through HAT_VARIANTS with +2 Y offset so the
    // player's hat pick follows them into the aim-down pose.
    {
      const _hatKey = PLAYER_CUSTOM.hat || 'tam';
      const _hfn = HAT_VARIANTS[_hatKey];
      if (_hfn) {
        _hfn((x, y, w, h, col) => px(x, y + 2, w, h, col), th);
      } else {
        px(8, -4, 16, 4, th.hc); px(7, -6, 18, 5, th.hc); px(5, -7, 22, 4, th.hc);
        for (let hx = 0; hx < 22; hx += 4) px(5 + hx, -6, 2, 4, th.hb);
        for (let hy = 0; hy < 4; hy += 2) px(5, -7 + hy, 22, 1, th.hb);
        px(12, -11, 8, 5, th.tr); px(13, -12, 6, 3, th.pp); px(14, -13, 4, 2, '#fff8c0');
        px(8, -5, 4, 3, th.tr); px(9, -5, 2, 2, '#fff');
      }
    }
    // Face overlay — shifted +2 px to match the tilted-forward head.
    {
      const _faceFn = FACE_VARIANTS[PLAYER_CUSTOM.face];
      if (_faceFn) _faceFn((x, y, w, h, col) => px(x, y + 2, w, h, col));
    }
    if (shieldOn) { c.globalAlpha = .3; c.fillStyle = '#7fff00'; c.fillRect(X - 6, Y - 16 + bob, 44, 72); c.globalAlpha = .1; c.fillRect(X - 10, Y - 20 + bob, 52, 80); c.globalAlpha = 1; }
    if (chargeOn) { c.globalAlpha = .5; c.fillStyle = '#ff6600'; c.fillRect(X - 12, Y + bob, 12, 50); c.globalAlpha = .25; c.fillRect(X - 22, Y + bob, 12, 50); c.globalAlpha = 1; }
    c.restore();
  }

  // ─── Crouched / prone bagpiper ───────────────────────────────────────
  // Dedicated sprite for the crouch state. The piper lies belly-down
  // propped on his forearm, head raised, bagpipe held forward.
  //
  // Footprint: 50 wide × 32 tall — exactly one builder-grid block tall
  // (the level builder uses 32 px cells). Every visible pixel falls
  // inside [y=0, y=31] so the figure occupies precisely one block. The
  // boot soles are drawn at y=31 so they sit flush on the ground line
  // at y=32 (= player.y + CROUCH_PH). Nothing extends above the cell.
  //
  // Coordinate convention (facing right):
  //   x=0  back of the figure (boot heels)
  //   x=50 front (chanter tip)
  //   y=0  top of the cell (feather tip)
  //   y=32 ground line (one pixel below the lowest drawn pixel)
  function drawBagpiperCrouched(c, ox, oy, facingRight, frame, shieldOn, chargeOn, bpType, walkFrame, expression) {
    c.save();
    if (!facingRight) { c.translate(ox * 2 + 50, 0); c.scale(-1, 1); }
    const X = ox, Y = oy;
    // Subtle 1-px breath bob — head/chest only, legs stay planted.
    const breath = Math.round(Math.sin((walkFrame || frame || 0) * 0.06) * 0.5);
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y, w, h); }
    function pxB(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y + breath, w, h); }

    const _bp = _effectiveBpType(bpType || 1);
    const _themes = [null,
      { jk: '#1a3a1a', jd: '#14301a', tr: '#c8a820', k1: '#8b0000', k2: '#1a1a6b', k3: '#c0000a', ss: '#1a5c2e', hc: '#1a5c2e', hb: '#0e4d7d', pp: '#c8a820' },
      { jk: '#1a1a4a', jd: '#10102e', tr: '#44ffcc', k1: '#2a006b', k2: '#44ffcc', k3: '#4a00aa', ss: '#44ffcc', hc: '#2a1a5a', hb: '#44ccaa', pp: '#44ffcc' },
      { jk: '#0a1e3a', jd: '#061422', tr: '#4488cc', k1: '#00204a', k2: '#4488cc', k3: '#002a6a', ss: '#4488cc', hc: '#0a2a4a', hb: '#4488cc', pp: '#88ccff' },
      { jk: '#4a1800', jd: '#2e0e00', tr: '#ffd700', k1: '#5a1000', k2: '#ffd700', k3: '#8b2000', ss: '#ffa500', hc: '#3a1000', hb: '#ffd700', pp: '#ff8800' },
      { jk: '#1a0a3a', jd: '#100622', tr: '#8866ff', k1: '#1a0050', k2: '#8866ff', k3: '#2a0080', ss: '#ff66aa', hc: '#1a0a3a', hb: '#8866ff', pp: '#ff66aa' },
    ];
    const th = _themes[Math.min(_bp, 5)] || _themes[1];
    const pc = _playerColors(th);

    // Vertical bands (each row = 1 px):
    //   0–3   feather
    //   2–7   tam o' shanter
    //   7–14  head (face features y=9–13)
    //   13–19 jacket / torso lying flat
    //   15–19 forearm / hand propping head
    //   13–22 bagpipe bag + drones + chanter
    //   18–28 kilt
    //   23–29 stockings (overlapping kilt bottom)
    //   27–31 boots (sole row at y=31)

    // ── Boots — back end of figure. Sole at y=31 sits on the ground. ───
    px(0, 27, 7, 5, '#0d0700');                    // back boot body (rows 27–31)
    px(0, 31, 9, 1, '#1a0d00');                    // back boot sole (ground row)
    px(2, 28, 2, 1, '#8b6914');                    // buckle highlight
    px(6, 28, 6, 4, '#0d0700');                    // 2nd boot, slightly forward
    px(6, 31, 8, 1, '#1a0d00');                    // 2nd boot sole (ground row)

    // ── Stockings — flat, between boots and kilt. ─────────────────────
    px(8, 24, 14, 6, pc.stockings);
    px(8, 23, 14, 1, th.tr);
    // Argyle accent stripes
    for (let i = 0; i < 3; i++) {
      const sx = 10 + i * 4;
      px(sx, 25, 2, 1, th.ss);
      px(sx, 27, 2, 1, th.ss);
      px(sx + 1, 26, 1, 1, th.ss);
    }

    // ── Kilt — covers hips/upper thighs, lies flat. ───────────────────
    const kiltX = 14, kiltY = 19, kiltW = 22, kiltH = 9;
    for (let ky = 0; ky < kiltH; ky++) {
      for (let kx = 0; kx < kiltW; kx++) {
        const col = (kx % 8 < 2 || ky % 8 < 2) ? th.k1 : ((kx % 4 < 1 || ky % 4 < 1) ? th.k2 : th.k3);
        c.fillStyle = col;
        c.fillRect(X + kiltX + kx, Y + kiltY + ky, 1, 1);
      }
    }
    for (let i = 0; i < 5; i++) px(kiltX + 2 + i * 4, kiltY, 1, kiltH, 'rgba(0,0,0,.22)');
    // Belt
    px(14, 18, 22, 2, '#2a1400');
    px(22, 18, 6, 2, '#4a2800');
    px(24, 19, 2, 1, th.tr);
    // Kilt-bottom trim
    px(kiltX, kiltY + kiltH - 1, kiltW, 1, '#1a0d00');

    // ── Sporran — hangs off the hip toward the camera. ────────────────
    px(28, 17, 8, 5, pc.sporran);
    px(29, 18, 6, 3, pc.sporranLight);
    px(28, 16, 8, 2, '#d4c898');
    for (let i = 0; i < 4; i++) px(29 + i * 2, 15, 1, 2, '#bbb090');
    px(30, 21, 2, 1, th.tr); px(33, 21, 2, 1, th.tr);

    // ── Jacket / torso (breath bob). ──────────────────────────────────
    pxB(22, 13, 14, 6, pc.jacket);                 // jacket body (rows 13–18)
    pxB(22, 13, 14, 1, th.tr);                     // collar trim
    pxB(22, 18, 14, 1, pc.jacketDark);             // bottom shadow
    pxB(35, 13, 1, 6, th.tr);                      // front edge highlight
    for (let i = 0; i < 3; i++) pxB(28 + i * 2, 14, 1, 1, '#666');

    // ── Bagpipe (breath bob). Bag under armpit, drones over shoulder,
    // chanter sticking forward past the head as the sniping line. ─────
    pxB(36, 14, 10, 7, '#6b2a0a');
    pxB(36, 14, 10, 1, th.tr);
    pxB(36, 17, 10, 1, th.ss);
    pxB(36, 20, 10, 1, th.tr);
    // Drone pipes poking up just over the shoulder (stays inside cell)
    pxB(33, 9, 2, 5, '#4a2200');
    pxB(35, 9, 2, 4, '#4a2200');
    pxB(32, 8, 5, 2, '#2a1400');
    // Chanter forward
    pxB(44, 17, 6, 3, '#3a1800');
    pxB(46, 20, 4, 1, '#2a1000');
    for (let i = 0; i < 3; i++) pxB(45 + i, 18, 1, 1, '#000');

    // ── Forearm + hand (breath bob). Props the chin. ──────────────────
    pxB(34, 14, 8, 5, pc.jacket);
    pxB(34, 14, 8, 1, th.tr);
    pxB(40, 15, 5, 4, pc.skin);
    pxB(43, 15, 4, 3, pc.skinEar);

    // ── Head (breath bob). Y=7–14, face features at y=9–13. ───────────
    pxB(34, 7, 14, 8, pc.skin);                    // face base
    pxB(34, 13, 14, 2, pc.skinDark);               // jaw shadow
    pxB(33, 9, 2, 4, pc.skinEar);                  // ear (back of head)
    // Brow line above eyes
    pxB(40, 8, 7, 1, '#5a2a00');
    // Eyes (two-pixel whites + pupil)
    pxB(40, 9, 3, 3, '#fff');
    pxB(44, 9, 3, 3, '#fff');
    pxB(41, 10, 1, 1, '#1a6080'); pxB(42, 10, 1, 1, '#000');
    pxB(45, 10, 1, 1, '#1a6080'); pxB(46, 10, 1, 1, '#000');
    pxB(40, 9, 1, 1, 'rgba(255,255,255,.6)');
    pxB(44, 9, 1, 1, 'rgba(255,255,255,.6)');
    // Nose
    pxB(47, 10, 1, 2, pc.skinDark);
    // Mustache + beard — crouched face is sideways so we render it inline
    // with the player's beard color. 'clean' skips the beard mass entirely.
    {
      const _bk = PLAYER_CUSTOM.beard || 'full';
      if (_bk !== 'clean') {
        const _c1 = pc.beard, _c2 = pc.beardDark;
        if (_bk === 'mustache' || _bk === 'muttonchops' || _bk === 'vandyke') {
          pxB(38, 12, 9, 1, _c1);                     // mustache only
        } else if (_bk === 'goatee') {
          pxB(40, 13, 4, 2, _c1);                     // small chin patch
        } else if (_bk === 'stubble') {
          pxB(36, 13, 12, 1, _c2);                    // light shadow
        } else {
          // full / bushy / chinstrap — full mass
          pxB(38, 12, 9, 1, _c1);
          pxB(36, 13, 12, 1, _c1);
          pxB(35, 13, 1, 2, _c2); pxB(48, 13, 1, 2, _c2);
        }
      }
    }
    pxB(39, 14, 8, 1, '#5a2a00');                    // mouth shadow (always)

    // ── Tam o' Shanter — compressed into y=2–7, feather y=0–3. ────────
    // Everything fits inside the cell — no negative-y overflow.
    pxB(30, 4, 18, 3, th.hc);                      // brim band
    pxB(28, 2, 22, 3, th.hc);                      // dome edge
    pxB(31, 1, 16, 2, th.hc);                      // dome top
    pxB(33, 0, 12, 2, th.hc);                      // crown crest
    // Band check pattern
    for (let hx = 0; hx < 18; hx += 4) pxB(30 + hx, 4, 2, 3, th.hb);
    // Feather at the front of the hat — stays inside the cell
    pxB(42, 0, 2, 4, th.pp);                       // feather body
    pxB(43, 0, 1, 3, th.tr);                       // feather highlight
    pxB(42, 0, 1, 1, '#fff8c0');                   // feather tip
    // Front trim badge
    pxB(32, 5, 3, 2, th.tr);
    pxB(33, 5, 1, 1, '#fff');

    // ── Expression overlay (eye region 40–46, 9–11; mouth y=14). ──────
    const _expr = expression || 'neutral';
    if (_expr === 'blink') {
      pxB(40, 9, 3, 3, pc.skin); pxB(44, 9, 3, 3, pc.skin);
      pxB(40, 10, 3, 1, '#5a2a00'); pxB(44, 10, 3, 1, '#5a2a00');
    } else if (_expr === 'hurt') {
      pxB(40, 9, 3, 3, pc.skin); pxB(44, 9, 3, 3, pc.skin);
      pxB(40, 9, 1, 1, '#3a1010'); pxB(42, 9, 1, 1, '#3a1010');
      pxB(41, 10, 1, 1, '#3a1010');
      pxB(40, 11, 1, 1, '#3a1010'); pxB(42, 11, 1, 1, '#3a1010');
      pxB(44, 9, 1, 1, '#3a1010'); pxB(46, 9, 1, 1, '#3a1010');
      pxB(45, 10, 1, 1, '#3a1010');
      pxB(44, 11, 1, 1, '#3a1010'); pxB(46, 11, 1, 1, '#3a1010');
      pxB(39, 14, 8, 1, '#f0e8c0');
      pxB(41, 14, 1, 1, '#3a1010'); pxB(44, 14, 1, 1, '#3a1010');
    } else if (_expr === 'surprised') {
      pxB(40, 9, 3, 3, '#fff'); pxB(44, 9, 3, 3, '#fff');
      pxB(41, 10, 1, 1, '#000'); pxB(45, 10, 1, 1, '#000');
      pxB(42, 14, 2, 1, '#3a1010');
    } else if (_expr === 'focused') {
      pxB(40, 9, 3, 1, pc.skin); pxB(40, 11, 3, 1, pc.skin);
      pxB(44, 9, 3, 1, pc.skin); pxB(44, 11, 3, 1, pc.skin);
      pxB(41, 10, 1, 1, '#000'); pxB(45, 10, 1, 1, '#000');
      pxB(40, 8, 7, 1, '#5a2a00');
    } else if (_expr === 'determined') {
      pxB(40, 9, 3, 3, pc.skin); pxB(44, 9, 3, 3, pc.skin);
      pxB(41, 10, 1, 1, '#1a1a1a'); pxB(45, 10, 1, 1, '#1a1a1a');
      pxB(40, 7, 1, 1, '#5a2a00'); pxB(41, 8, 1, 1, '#5a2a00'); pxB(42, 8, 1, 1, '#3a1a00');
      pxB(44, 8, 1, 1, '#3a1a00'); pxB(45, 8, 1, 1, '#5a2a00'); pxB(46, 7, 1, 1, '#5a2a00');
      pxB(39, 14, 8, 1, '#f0e8c0');
      pxB(40, 14, 1, 1, '#3a1010'); pxB(42, 14, 1, 1, '#3a1010'); pxB(44, 14, 1, 1, '#3a1010');
    } else if (_expr === 'proud') {
      pxB(40, 9, 3, 3, '#fff'); pxB(44, 9, 3, 3, '#fff');
      const _hue = (frame * 8) % 360;
      c.fillStyle = `hsl(${_hue}, 100%, 55%)`;
      c.fillRect(X + 41, Y + 10 + breath, 1, 1);
      c.fillRect(X + 45, Y + 10 + breath, 1, 1);
      pxB(40, 9, 1, 1, '#fff8c0'); pxB(44, 9, 1, 1, '#fff8c0');
      pxB(39, 14, 8, 1, '#5a2a00');
    }

    // ── Powers ────────────────────────────────────────────────────────
    // Auras are intentionally allowed to extend outside the cell — they
    // are particle/glow effects, not part of the character silhouette.
    if (shieldOn) {
      c.globalAlpha = .3; c.fillStyle = '#7fff00';
      c.fillRect(X - 4, Y + 2, 58, 32);
      c.globalAlpha = .1;
      c.fillRect(X - 8, Y - 2, 66, 38);
      c.globalAlpha = 1;
    }
    if (chargeOn) {
      c.globalAlpha = .5; c.fillStyle = '#ff6600';
      c.fillRect(X - 10, Y + 14, 12, 14);
      c.globalAlpha = .25;
      c.fillRect(X - 20, Y + 16, 12, 12);
      c.globalAlpha = 1;
    }

    c.restore();
  }

  // ── Custom enemy sprites for v=12 / v=13 / v=14 ─────────────────
  // These render as distinctive pixel-art figures rather than the
  // generic drum. Used by both the gameplay render loop AND the
  // builder so a placed turret / teleporter / berserker looks the
  // same in the editor as it does in-game.

  // Shared HP bar above an enemy sprite. Mirrors the bar drawDrum32
  // paints (32×4, dark-red bg, bright-red fill) at y = ox-relative -8.
  // We draw it at world coords (no canvas-transform flip) so the bar
  // text reads correctly regardless of which way the enemy faces.
  function _drawEnemyHpBar(c, ox, oy, hp, maxHp, w) {
    if (!maxHp || hp >= maxHp) return;
    const bw = w || 32, x = ox | 0, y = (oy - 8) | 0;
    c.fillStyle = '#300';
    c.fillRect(x, y, bw, 4);
    c.fillStyle = '#e74c3c';
    c.fillRect(x, y, Math.max(1, Math.floor(bw * hp / maxHp)), 4);
    c.fillStyle = 'rgba(255,255,255,0.2)';
    c.fillRect(x, y, bw, 1);
  }

  // v=12 TURRET — riveted stone cannon with a glowing eye + barrel
  function drawTurret32(c, ox, oy, e, frame) {
    const X = ox, Y = oy;
    const facing = e.facingRight ? 1 : -1;
    const armed = (e._turretTele > 0) || (e._turretBurst > 0);
    const blink = (e._turretTele > 0) ? (e._turretTele % 6 < 3) : false;
    c.save();
    if (facing < 0) { c.translate(X * 2 + 32, 0); c.scale(-1, 1); }
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y, w, h); }
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.beginPath(); c.ellipse(X + 16, Y + 40, 14, 4, 0, 0, Math.PI * 2); c.fill();
    px(4, 12, 24, 24, '#5a5a6a');
    px(4, 12, 24, 3, '#7a7a8c');
    px(4, 33, 24, 3, '#3a3a4a');
    px(4, 12, 3, 24, '#4a4a5a');
    px(25, 12, 3, 24, '#6a6a7c');
    for (let i = 0; i < 4; i++) px(7 + i * 5, 14, 2, 2, '#2a2a3a');
    for (let i = 0; i < 4; i++) px(7 + i * 5, 30, 2, 2, '#1a1a28');
    c.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 6; i++) c.fillRect(X + 6 + i * 4, Y + 18 + (i % 2), 2, 2);
    px(10, 20, 12, 5, '#0a0a14');
    if (armed) {
      px(11, 21, 10, 3, '#ff8a3a');
      px(12, 22, 8, 1, '#ffd560');
      px(blink ? 13 : 15, 22, 2, 1, '#ffffff');
    } else {
      px(11, 22, 10, 1, '#882020');
      px(15, 22, 2, 1, '#ff5040');
    }
    px(28, 21, 6, 3, '#2a1a08');
    px(28, 24, 6, 3, '#1a1004');
    px(33, 22, 2, 4, armed ? '#ffaa50' : '#3a2a14');
    c.restore();
    // HP bar drawn AFTER restore so it sits in screen-space (not flipped)
    _drawEnemyHpBar(c, X, Y, (e.hp != null ? e.hp : 6), (e.maxHp || e.hp || 6), 32);
  }

  // v=13 TELEPORTER — hooded purple spirit, glowing eyes, wisp tail
  function drawTeleporter32(c, ox, oy, e, frame) {
    const X = ox, Y = oy;
    const facing = e.facingRight ? 1 : -1;
    const phaseAlpha = (e._teleState === 'vanish' || e._teleState === 'appear')
      ? Math.max(0, (e._teleCd || 0) / 22) : 1;
    const breathe = Math.sin(frame * 0.08) * 1;
    c.save();
    if (facing < 0) { c.translate(X * 2 + 32, 0); c.scale(-1, 1); }
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y + breathe, w, h); }
    c.globalAlpha = 0.35 * phaseAlpha;
    for (let i = 0; i < 6; i++) {
      const wx = 10 + (i * 3 + (frame >> 2)) % 14;
      const wy = 30 + ((frame + i * 5) % 8);
      c.fillStyle = '#a060ff';
      c.fillRect(X + wx, Y + wy, 2, 2);
    }
    c.globalAlpha = 0.85 * phaseAlpha;
    px(11, 10, 10, 22, '#2a1054');
    px(10, 12, 12, 18, '#3a1864');
    px(11, 30, 10, 2, '#5a2080');
    px(10, 6, 12, 8, '#1a0834');
    px(12, 4, 8, 4, '#2a1454');
    px(12, 8, 8, 6, '#000010');
    for (let i = 0; i < 4; i++) {
      c.fillStyle = '#5a2080';
      c.globalAlpha = (0.85 * phaseAlpha) * (1 - i * 0.2);
      c.fillRect(X + 12 + i, Y + 32 + i, 8 - i * 2, 1);
    }
    c.globalAlpha = phaseAlpha;
    const eyeGlow = 0.65 + 0.35 * Math.sin(frame * 0.18);
    c.fillStyle = '#ff66e0';
    c.globalAlpha = phaseAlpha * eyeGlow;
    c.fillRect(X + 13, Y + 11 + breathe, 2, 2);
    c.fillRect(X + 17, Y + 11 + breathe, 2, 2);
    c.globalAlpha = phaseAlpha;
    c.fillStyle = '#ffffff';
    c.fillRect(X + 13, Y + 11 + breathe, 1, 1);
    c.fillRect(X + 17, Y + 11 + breathe, 1, 1);
    if (!e._teleState || e._teleState === 'idle') {
      c.fillStyle = '#cc66ff';
      c.globalAlpha = 0.7 + 0.3 * Math.sin(frame * 0.2);
      c.fillRect(X + 14, Y + 0, 4, 1);
      c.fillRect(X + 15, Y - 1, 2, 1);
    }
    c.globalAlpha = 1;
    c.restore();
    // HP bar — skip while fully invisible/teleporting away
    if (e._teleState !== 'gone') {
      _drawEnemyHpBar(c, X, Y, (e.hp != null ? e.hp : 3), (e.maxHp || e.hp || 3), 32);
    }
  }

  // v=14 BERSERKER — bulky horned warrior, red eyes, frenzy glow
  function drawBerserker32(c, ox, oy, e, frame) {
    const X = ox, Y = oy;
    const facing = e.facingRight ? 1 : -1;
    const frenzy = !!e._frenzy;
    const stomp = Math.sin(frame * 0.18) * (frenzy ? 1.5 : 0.6);
    c.save();
    if (facing < 0) { c.translate(X * 2 + 32, 0); c.scale(-1, 1); }
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y + stomp, w, h); }
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.beginPath(); c.ellipse(X + 16, Y + 40, 13, 4, 0, 0, Math.PI * 2); c.fill();
    if (frenzy) {
      const auraR = 22 + Math.sin(frame * 0.3) * 3;
      const grad = c.createRadialGradient(X + 16, Y + 20, 4, X + 16, Y + 20, auraR);
      grad.addColorStop(0, 'rgba(255,40,40,0.45)');
      grad.addColorStop(1, 'rgba(255,40,40,0)');
      c.fillStyle = grad;
      c.fillRect(X - 8, Y - 4, 48, 48);
    }
    const bodyCol = frenzy ? '#7a1a18' : '#3a2018';
    const bodyHi  = frenzy ? '#aa3024' : '#5a3a28';
    const bodyDk  = frenzy ? '#4a0a08' : '#1a0a04';
    px(4, 18, 24, 18, bodyCol);
    px(4, 18, 24, 3, bodyHi);
    px(4, 33, 24, 3, bodyDk);
    px(2, 18, 4, 8, '#3a3030');
    px(2, 18, 4, 2, '#5a4848');
    px(26, 18, 4, 8, '#3a3030');
    px(26, 18, 4, 2, '#5a4848');
    px(0, 22, 4, 10, bodyCol);
    px(28, 22, 4, 10, bodyCol);
    px(0, 32, 4, 2, bodyDk);
    px(28, 32, 4, 2, bodyDk);
    c.fillStyle = '#ff8888';
    c.globalAlpha = 0.5;
    c.fillRect(X + 10, Y + 24 + stomp, 1, 6);
    c.fillRect(X + 14, Y + 22 + stomp, 1, 8);
    c.fillRect(X + 18, Y + 24 + stomp, 1, 6);
    c.globalAlpha = 1;
    px(8, 6, 16, 14, bodyHi);
    px(8, 6, 16, 3, '#2a1a0a');
    px(6, 4, 3, 5, '#dcc8a0');
    px(5, 2, 2, 3, '#dcc8a0');
    px(23, 4, 3, 5, '#dcc8a0');
    px(25, 2, 2, 3, '#dcc8a0');
    c.fillStyle = frenzy ? '#ff2020' : '#cc4040';
    c.globalAlpha = frenzy ? (0.75 + 0.25 * Math.sin(frame * 0.4)) : 0.85;
    c.fillRect(X + 11, Y + 11 + stomp, 3, 3);
    c.fillRect(X + 18, Y + 11 + stomp, 3, 3);
    c.globalAlpha = 1;
    c.fillStyle = '#f0e8c0';
    c.fillRect(X + 12, Y + 16 + stomp, 8, 2);
    c.fillStyle = '#2a1a0a';
    c.fillRect(X + 13, Y + 16 + stomp, 1, 2);
    c.fillRect(X + 15, Y + 16 + stomp, 1, 2);
    c.fillRect(X + 17, Y + 16 + stomp, 1, 2);
    c.fillRect(X + 19, Y + 16 + stomp, 1, 2);
    px(4, 30, 24, 2, '#1a0a04');
    px(14, 30, 4, 2, '#cc8800');
    c.restore();
    _drawEnemyHpBar(c, X, Y, (e.hp != null ? e.hp : 6), (e.maxHp || e.hp || 6), 32);
  }

  // ── Boss sprites for v=98 SUMMONER / v=97 JUGGERNAUT ────────────
  // Rendered at a 64×64 footprint (same as the v=99 mega-boss). Both
  // read e._bossTeleFrames for the wind-up flash.

  // v=98 SUMMONER — floating hooded conjurer with a glowing staff
  function drawSummonerBoss(c, ox, oy, e, frame) {
    const X = ox, Y = oy;
    const tele = (e._bossTeleFrames || 0) > 0;
    const bob = Math.sin(frame * 0.05) * 3;
    c.save();
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y + bob, w, h); }
    // Faint hover shadow on the ground
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath(); c.ellipse(X + 32, Y + 70, 22, 5, 0, 0, Math.PI * 2); c.fill();
    // Rotating summoning glyph under the boss
    c.save();
    c.translate(X + 32, Y + 58 + bob);
    c.strokeStyle = tele ? '#ff66e0' : '#7a3aaa';
    c.lineWidth = 2;
    c.rotate(frame * 0.02);
    c.strokeRect(-16, -16, 32, 32);
    c.rotate(Math.PI / 4);
    c.strokeRect(-12, -12, 24, 24);
    c.restore();
    // Robe body — tapered, flared at the base
    const robe = tele ? '#6a2a9a' : '#3a1864';
    const robeHi = tele ? '#9a5aca' : '#5a2884';
    px(18, 22, 28, 34, robe);
    px(14, 40, 36, 16, robe);
    px(18, 22, 28, 4, robeHi);
    // Wispy fading hem
    for (let i = 0; i < 5; i++) {
      c.fillStyle = robe;
      c.globalAlpha = 1 - i * 0.2;
      c.fillRect(X + 16 + i * 3, Y + 56 + i * 2 + bob, 32 - i * 6, 2);
    }
    c.globalAlpha = 1;
    // Hood
    px(20, 8, 24, 18, '#1a0834');
    px(24, 4, 16, 8, '#2a1454');
    px(24, 14, 16, 10, '#000010');
    // Glowing eyes
    c.fillStyle = '#ff66e0';
    c.globalAlpha = 0.6 + 0.4 * Math.sin(frame * 0.18);
    c.fillRect(X + 27, Y + 18 + bob, 4, 4);
    c.fillRect(X + 35, Y + 18 + bob, 4, 4);
    c.globalAlpha = 1;
    // Staff + orb
    px(48, 14, 3, 40, '#3a2a1a');
    c.fillStyle = tele ? '#ffaaff' : '#aa66ff';
    c.beginPath(); c.arc(X + 49, Y + 12 + bob, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.6;
    c.beginPath(); c.arc(X + 47, Y + 10 + bob, 2, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
    if (tele) {
      const pulse = 0.2 + 0.2 * Math.sin(frame * 0.5);
      c.fillStyle = 'rgba(255,68,255,' + pulse.toFixed(2) + ')';
      c.fillRect(X + 10, Y + 2 + bob, 48, 60);
    }
    c.restore();
    // HP shown via the big HUD boss bar (drawScene) — no per-sprite bar.
  }

  // v=97 JUGGERNAUT — heavy horned armored bruiser
  function drawJuggernautBoss(c, ox, oy, e, frame) {
    const X = ox, Y = oy;
    const tele = (e._bossTeleFrames || 0) > 0;
    const charging = (e._chargeFrames || 0) > 0;
    const stomp = Math.sin(frame * 0.2) * 1.5;
    c.save();
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y + stomp, w, h); }
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.beginPath(); c.ellipse(X + 32, Y + 64, 26, 6, 0, 0, Math.PI * 2); c.fill();
    const iron = tele ? '#cc6020' : '#5a4438';
    const ironHi = tele ? '#ff9040' : '#7a6048';
    const ironDk = '#2a1c14';
    // Legs
    px(12, 44, 14, 20, ironDk);
    px(38, 44, 14, 20, ironDk);
    // Torso
    px(8, 20, 48, 30, iron);
    px(8, 20, 48, 5, ironHi);
    px(8, 45, 48, 5, ironDk);
    px(8, 30, 48, 3, ironDk);
    px(8, 38, 48, 3, ironDk);
    // Pauldrons
    px(2, 18, 14, 14, '#3a3030');
    px(2, 18, 14, 3, '#5a4848');
    px(48, 18, 14, 14, '#3a3030');
    px(48, 18, 14, 3, '#5a4848');
    // Head
    px(20, 6, 24, 18, ironHi);
    px(20, 6, 24, 4, ironDk);
    // Horns
    px(14, 2, 6, 9, '#dcc8a0');
    px(11, -2, 4, 6, '#dcc8a0');
    px(44, 2, 6, 9, '#dcc8a0');
    px(49, -2, 4, 6, '#dcc8a0');
    // Glowing eye slit
    c.fillStyle = (tele || charging) ? '#ff3020' : '#aa3020';
    c.globalAlpha = (tele || charging) ? (0.7 + 0.3 * Math.sin(frame * 0.4)) : 0.85;
    c.fillRect(X + 24, Y + 13 + stomp, 16, 4);
    c.globalAlpha = 1;
    // Chest emblem
    c.fillStyle = '#cc8800';
    c.fillRect(X + 28, Y + 32 + stomp, 8, 8);
    if (tele) {
      const pulse = 0.25 + 0.25 * Math.sin(frame * 0.5);
      c.fillStyle = 'rgba(255,140,40,' + pulse.toFixed(2) + ')';
      c.fillRect(X + 2, Y - 2 + stomp, 60, 68);
    }
    c.restore();
    // HP shown via the big HUD boss bar (drawScene) — no per-sprite bar.
  }

  // v=15 CUTPURSE — hooded coin thief clutching a bulging coin sack
  // (the sack grows with e._stolen). Scurries faster while fleeing.
  function drawCutpurse32(c, ox, oy, e, frame) {
    const X = ox, Y = oy;
    const facing = e.facingRight ? 1 : -1;
    const fleeing = e._purseState === 'flee';
    const scurry = Math.sin(frame * (fleeing ? 0.5 : 0.3)) * 1.2;
    c.save();
    if (facing < 0) { c.translate(X * 2 + 32, 0); c.scale(-1, 1); }
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y, w, h); }
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.beginPath(); c.ellipse(X + 16, Y + 40, 11, 3, 0, 0, Math.PI * 2); c.fill();
    // legs mid-scurry
    px(10, 32 + Math.max(0, scurry), 5, 7, '#1a2a24');
    px(17, 32 + Math.max(0, -scurry), 5, 7, '#1a2a24');
    // cloak
    px(8, 14, 16, 20, '#1d4038');
    px(8, 14, 16, 3, '#2e5a4c');
    px(8, 31, 16, 3, '#0e2a22');
    // hood
    px(9, 6, 14, 12, '#143028');
    px(11, 4, 10, 4, '#1d4038');
    px(11, 10, 10, 5, '#05140f');
    // glinting eyes
    c.fillStyle = '#9af0c8';
    c.globalAlpha = 0.7 + 0.3 * Math.sin(frame * 0.25);
    c.fillRect(X + 13, Y + 12, 2, 2);
    c.fillRect(X + 17, Y + 12, 2, 2);
    c.globalAlpha = 1;
    // arm + coin sack (bulges with loot)
    px(20, 20, 6, 6, '#143028');
    const sack = Math.min(8, 4 + ((e._stolen | 0) / 6));
    c.fillStyle = '#7a5a2a';
    c.beginPath(); c.ellipse(X + 25, Y + 26, sack, sack * 0.9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5a3f1a'; c.fillRect(X + 23, Y + 19, 4, 2);
    c.fillStyle = '#ffd76a'; c.fillRect(X + 24, Y + 24, 2, 2);
    if ((e._stolen | 0) > 0) {
      c.globalAlpha = 0.6 + 0.4 * Math.sin(frame * 0.3);
      c.fillRect(X + 27, Y + 23, 1, 1);
      c.globalAlpha = 1;
    }
    c.restore();
    _drawEnemyHpBar(c, X, Y, (e.hp != null ? e.hp : 3), (e.maxHp || e.hp || 3), 32);
  }

  // v=96 COIN HOARDER — rotund coin-armored boss on a mound of gold,
  // crowned and grinning. Rendered at a 64×64 footprint like the other
  // mega-bosses; HP shown via the HUD boss bar. Flashes on wind-up.
  function drawCoinHoarderBoss(c, ox, oy, e, frame) {
    const X = ox, Y = oy;
    const tele = (e._bossTeleFrames || 0) > 0;
    const breathe = Math.sin(frame * 0.06) * 2;
    c.save();
    function px(x, y, w, h, col) { c.fillStyle = col; c.fillRect(X + x, Y + y + breathe, w, h); }
    // gold mound base
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath(); c.ellipse(X + 32, Y + 70, 30, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#caa12a';
    c.beginPath(); c.ellipse(X + 32, Y + 62, 30, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffe27a';
    for (let i = 0; i < 10; i++) {
      const cx2 = X + 8 + ((i * 6 + (frame >> 3)) % 48);
      const cy2 = Y + 56 + ((i * 7) % 10);
      c.fillRect(cx2, cy2, 3, 3);
    }
    // coin-armored body
    px(14, 22, 36, 34, '#b8881e');
    px(14, 22, 36, 5, '#ffd76a');
    px(14, 50, 36, 4, '#6e4f12');
    // belly emblem
    c.fillStyle = '#ffe27a';
    c.beginPath(); c.arc(X + 32, Y + 40 + breathe, 11, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b8881e'; c.font = 'bold 13px monospace'; c.textAlign = 'center';
    c.fillText('$', X + 32, Y + 45 + breathe);
    c.textAlign = 'left';
    // arms
    px(6, 28, 9, 16, '#a87a1a');
    px(49, 28, 9, 16, '#a87a1a');
    // head
    px(22, 8, 20, 16, '#caa12a');
    px(22, 8, 20, 4, '#ffd76a');
    // crown
    c.fillStyle = '#ffe27a';
    c.fillRect(X + 22, Y + 2 + breathe, 20, 4);
    c.fillRect(X + 23, Y - 2 + breathe, 3, 5);
    c.fillRect(X + 30, Y - 3 + breathe, 4, 6);
    c.fillRect(X + 38, Y - 2 + breathe, 3, 5);
    // eyes (red on wind-up) + grin
    c.fillStyle = tele ? '#ff5050' : '#3a2a08';
    c.fillRect(X + 27, Y + 14 + breathe, 4, 4);
    c.fillRect(X + 35, Y + 14 + breathe, 4, 4);
    c.fillStyle = '#3a2a08';
    c.fillRect(X + 27, Y + 20 + breathe, 12, 2);
    if (tele) {
      const pulse = 0.2 + 0.25 * Math.sin(frame * 0.5);
      c.fillStyle = 'rgba(255,215,106,' + pulse.toFixed(2) + ')';
      c.fillRect(X + 6, Y - 4 + breathe, 56, 66);
    }
    c.restore();
  }

  // ── Exports ────────────────────────────────────────────────────
  window.GameSprites = {
    drawBagpiper32, drawBagpiperAimUp, drawBagpiperAimDown, drawBagpiperCrouched,
    drawTurret32, drawTeleporter32, drawBerserker32, drawCutpurse32,
    drawSummonerBoss, drawJuggernautBoss, drawCoinHoarderBoss,
    get PLAYER_CUSTOM() { return PLAYER_CUSTOM; },
    HAT_VARIANTS, FACE_VARIANTS, BEARD_VARIANTS, SOCK_VARIANTS, SHOE_VARIANTS, CAPE_VARIANTS,
    SKIN_PRESETS, JACKET_PRESETS, STOCKING_PRESETS, SPORRAN_PRESETS,
    _shadeHex, _playerColors, _bagpipeAccent, _effectiveBpType,
    _loadPlayerCustom, _savePlayerCustom,
  };
  // Bare-global mirror for back-compat with the customizer UI + engine.
  window.PLAYER_CUSTOM        = PLAYER_CUSTOM;
  window.HAT_VARIANTS         = HAT_VARIANTS;
  window.FACE_VARIANTS        = FACE_VARIANTS;
  window.BEARD_VARIANTS       = BEARD_VARIANTS;
  window.SOCK_VARIANTS        = SOCK_VARIANTS;
  window.SHOE_VARIANTS        = SHOE_VARIANTS;
  window.CAPE_VARIANTS        = CAPE_VARIANTS;
  window.SKIN_PRESETS         = SKIN_PRESETS;
  window.JACKET_PRESETS       = JACKET_PRESETS;
  window.STOCKING_PRESETS     = STOCKING_PRESETS;
  window.SPORRAN_PRESETS      = SPORRAN_PRESETS;
  window.drawBagpiper32       = drawBagpiper32;
  window.drawBagpiperAimUp    = drawBagpiperAimUp;
  window.drawBagpiperAimDown  = drawBagpiperAimDown;
  window.drawBagpiperCrouched = drawBagpiperCrouched;
  window.drawTurret32         = drawTurret32;
  window.drawTeleporter32     = drawTeleporter32;
  window.drawBerserker32      = drawBerserker32;
  window.drawCutpurse32       = drawCutpurse32;
  window.drawSummonerBoss     = drawSummonerBoss;
  window.drawJuggernautBoss   = drawJuggernautBoss;
  window.drawCoinHoarderBoss  = drawCoinHoarderBoss;
  window._savePlayerCustom    = _savePlayerCustom;
  window._loadPlayerCustom    = _loadPlayerCustom;
})();
