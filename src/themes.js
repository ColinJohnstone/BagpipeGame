// src/themes.js
// ──────────────────────────────────────────────────────────────────
// Theme palette tables + the helpers that pick / infer themes from a
// LevelData blob. Pure data + pure functions; no game state.
//
// Loaded as a plain <script> AFTER util.js (we use
// GameUtil.cleanThemeColor inside the helpers). Exports everything to
// `window.GameThemes` AND mirrors each binding as a bare window global
// so existing call sites in the main inline script continue to work
// unchanged. Once the rest of the codebase is namespaced we can drop
// the bare-global re-exports.
// ──────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const _gu = (typeof window !== 'undefined' && window.GameUtil) || {};
  const _cleanThemeColor = _gu.cleanThemeColor || function (c, fallback) {
    if (typeof c !== 'string') return fallback;
    if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
    if (/^#[0-9a-fA-F]{3}$/.test(c)) return c;
    return fallback;
  };

  // ── Platform-color palettes per theme. 5 entries from darkest "soil"
  //    to brightest "top edge"; the renderer picks indices for each
  //    layer of the platform stack.
  const THEMES_PC = {
    highland: ['#1a3010', '#243a18', '#3a7a28', '#4a9a32', '#5ab840'],
    volcanic: ['#1a0400', '#2e0800', '#5a1a00', '#7a2c00', '#ff4400'],
    frozen: ['#0c1628', '#182440', '#1e4070', '#3070a0', '#80c8ff'],
    shadow: ['#080010', '#12001e', '#220040', '#3a0060', '#9030e0'],
    desert: ['#2a1608', '#5a3214', '#9a6628', '#d69a42', '#ffd36a'],
    forest: ['#08160c', '#12301c', '#245c32', '#3f8a46', '#86d46a'],
    citadel: ['#151620', '#2a2d3a', '#555d70', '#8d96aa', '#d7b76a'],
    ocean: ['#051421', '#0b2c3d', '#126072', '#1fa0a8', '#84e0d0'],
    blueprint: ['#10254a', '#143560', '#1c5090', '#3478c8', '#88c8ff'],
    // ── Expansion-pack themes ────────────────────────────────────────
    castle: ['#16100c', '#2a1d16', '#4a3325', '#785238', '#a47650'],
    cosmic: ['#04031e', '#0e0a3a', '#241a6e', '#4a3aa8', '#7e6ad8'],
    cherry: ['#2a0c1a', '#4a1d2c', '#8a3a52', '#d068a0', '#ffb0d8'],
    steampunk: ['#1a1208', '#332210', '#5e3e1a', '#8a5a22', '#d4a04a'],
    cyber: ['#0a0220', '#180538', '#3a0a6a', '#5e1ab8', '#ff3ed8'],
    coralreef: ['#031a26', '#0a3a4a', '#2a7a8a', '#5cc8c0', '#ffb0a0'],
    halloween: ['#0e0610', '#1e0a22', '#3a1240', '#7a2a18', '#ff8a1f'],
    // Heaven / sky world — pale cloud platforms with gilded gold tops.
    heaven: ['#9aa8c8', '#c4cfe4', '#e6ecf6', '#f6f1de', '#ffe9a0'],
  };

  // ── Sky / background table per theme. `bg` is a 2-stop gradient,
  //    `stars` toggles the parallax starfield, `misty` enables the
  //    distant-fog layer, `accent`/`accent2` drive parallax decor.
  const THEMES_BG = {
    highland: { bg: ['#0d1b35', '#1a3050'], stars: true, misty: true, style: 'highland', accent: '#5a2080', accent2: '#d460ff', fog: '#aac0e0' },
    volcanic: { bg: ['#1a0500', '#350c00'], stars: false, misty: false, style: 'volcanic', accent: '#cc3300', accent2: '#ff6600', fog: '#ff4400' },
    frozen: { bg: ['#05101f', '#0a1c3a'], stars: true, misty: true, style: 'frozen', accent: '#4488cc', accent2: '#88ddff', fog: '#c0e0ff' },
    shadow: { bg: ['#05000f', '#100020'], stars: true, misty: false, style: 'shadow', accent: '#8800cc', accent2: '#cc44ff', fog: '#8020c0' },
    desert: { bg: ['#30170a', '#8a4a1a'], stars: false, misty: false, style: 'desert', accent: '#c46a18', accent2: '#ffe08a', fog: '#e2a654' },
    forest: { bg: ['#06120e', '#0f2d24'], stars: true, misty: true, style: 'forest', accent: '#2aa85f', accent2: '#b6ff70', fog: '#7bc99b' },
    citadel: { bg: ['#15182b', '#36445e'], stars: false, misty: false, style: 'citadel', accent: '#8aa0c8', accent2: '#f0c85a', fog: '#b8c8e8' },
    ocean: { bg: ['#03111f', '#063850'], stars: false, misty: true, style: 'ocean', accent: '#0aa0b0', accent2: '#86f0e0', fog: '#5ec8d8' },
    blueprint: { bg: ['#0a1f4a', '#0e2a6a'], stars: false, misty: false, style: 'blueprint', accent: '#88c8ff', accent2: '#cfe6ff', fog: '#cfe6ff' },
    // ── Expansion-pack themes ────────────────────────────────────────
    castle: { bg: ['#0a0608', '#1a1014'], stars: false, misty: true, style: 'castle', accent: '#aa6028', accent2: '#ff9a44', fog: '#5a4a40' },
    cosmic: { bg: ['#02011a', '#0a0640'], stars: true, misty: false, style: 'cosmic', accent: '#6a4ada', accent2: '#d6a8ff', fog: '#3a2a8a' },
    cherry: { bg: ['#1a0a14', '#3a1a28'], stars: true, misty: true, style: 'cherry', accent: '#ff6aa6', accent2: '#ffd0e8', fog: '#f0b8d8' },
    steampunk: { bg: ['#0e0a06', '#1e1610'], stars: false, misty: true, style: 'steampunk', accent: '#a47020', accent2: '#ffce5a', fog: '#8a6a40' },
    cyber: { bg: ['#02011a', '#100328'], stars: true, misty: false, style: 'cyber', accent: '#ff3ed8', accent2: '#3ad8ff', fog: '#6a18b0' },
    coralreef: { bg: ['#021420', '#053648'], stars: false, misty: true, style: 'coralreef', accent: '#ff8a6e', accent2: '#86e8d8', fog: '#5cc8c0' },
    halloween: { bg: ['#0a0410', '#1c0a18'], stars: true, misty: true, style: 'halloween', accent: '#ff7a18', accent2: '#aa3aff', fog: '#6a3a40' },
    // Heaven / sky world — bright dawn-blue sky fading to pale gold,
    // heavy cloud-fog layer, soft golden parallax decor.
    heaven: { bg: ['#5fa6e6', '#cfe4f4'], stars: false, misty: true, style: 'heaven', accent: '#ffe9a0', accent2: '#ffffff', fog: '#eef4fb' },
  };

  // ── Note projectile palettes ────────────────────────────────────────
  // Per-theme vibrant note colors. Each entry is [body, stem-shadow] so
  // the head and the rectangular stem read together but have depth.
  // pickNoteColor() returns one random pair per shoot event.
  const NOTE_PALETTES = {
    highland:  [['#ffd66a','#aa7c00'], ['#a8ff70','#3a8b22'], ['#ff8ad8','#a04280'], ['#88e8ff','#1a608c'], ['#ff7d4d','#a83a14']],
    volcanic:  [['#ffd66a','#aa7c00'], ['#ff8a3a','#7a2a00'], ['#fff8a8','#aa7030'], ['#ff5a3a','#8a1000'], ['#ffaa44','#aa4400']],
    frozen:    [['#88f0ff','#1a608c'], ['#c0e0ff','#3a6a90'], ['#a8ffd8','#1a8a5a'], ['#ffd66a','#aa7c00'], ['#ff8ad8','#a04280']],
    shadow:    [['#cc66ff','#5a1a8a'], ['#ff66e0','#7a1a78'], ['#88f0ff','#1a608c'], ['#fff0a0','#aa8800'], ['#a8ff70','#3a8b22']],
    desert:    [['#ffd66a','#aa7c00'], ['#ff9966','#8a3a14'], ['#ff8ad8','#a04280'], ['#88e8ff','#1a608c'], ['#ffeb88','#aa8030']],
    forest:    [['#a8ff70','#3a8b22'], ['#ffd66a','#aa7c00'], ['#ff8ad8','#a04280'], ['#88e8ff','#1a608c'], ['#fff0a0','#aa8800']],
    citadel:   [['#ffd66a','#aa7c00'], ['#88e8ff','#1a608c'], ['#ff6b3d','#7a1a00'], ['#a8ff70','#3a8b22'], ['#cc66ff','#5a1a8a']],
    ocean:     [['#88f0e0','#1a8a8a'], ['#a8ffd8','#1a8a5a'], ['#ffd66a','#aa7c00'], ['#ff8ad8','#a04280'], ['#88c8ff','#1f6d9a']],
    blueprint: [['#88c8ff','#1f6d9a'], ['#a8e8ff','#3a6a90'], ['#fff0a0','#aa8800'], ['#a8ffd8','#1a8a5a'], ['#ff8ad8','#a04280']],
    castle:    [['#ffae5e','#7a3a00'], ['#ffd66a','#aa7c00'], ['#ff6b3d','#7a1a00'], ['#c8a8a8','#5a3030'], ['#fff0a0','#aa8800']],
    cosmic:    [['#cc66ff','#5a1a8a'], ['#88e8ff','#1a608c'], ['#ffd66a','#aa7c00'], ['#ff8ad8','#a04280'], ['#a8a0ff','#3a3a8a']],
    cherry:    [['#ffb0d8','#a04280'], ['#ff7fd0','#9a2a80'], ['#fff0a0','#aa8800'], ['#a8ffd8','#1a8a5a'], ['#ffd66a','#aa7c00']],
    steampunk: [['#ffd66a','#aa7c00'], ['#ffae5e','#7a3a00'], ['#88c8ff','#1f6d9a'], ['#a8ff70','#3a8b22'], ['#fff8a8','#aa7030']],
    cyber:     [['#ff3ed8','#7a0080'], ['#3ad8ff','#0a608a'], ['#fff0a0','#aa8800'], ['#a8ff70','#3a8b22'], ['#cc66ff','#5a1a8a']],
    coralreef: [['#ff8a6e','#a83a14'], ['#86f0e0','#1a8a8a'], ['#ffd66a','#aa7c00'], ['#ff8ad8','#a04280'], ['#a8ffd8','#1a8a5a']],
    halloween: [['#ff8a1f','#7a3a00'], ['#aa3aff','#3a008a'], ['#ffd66a','#aa7c00'], ['#a8ff70','#3a8b22'], ['#fff0a0','#aa8800']],
  };

  // ── Helpers ─────────────────────────────────────────────────────────
  function pickNoteColor(ld) {
    const themeKey = inferThemeKey(ld, 'highland');
    const palette = NOTE_PALETTES[themeKey] || NOTE_PALETTES.highland;
    return palette[Math.floor(Math.random() * palette.length)];
  }

  function themePaletteFor(ld, p, themeKey) {
    const base = THEMES_PC[themeKey] || THEMES_PC.highland;
    const src = (p && p.colors) || (ld && ld.platColors) || base;
    return base.map((fallback, i) => _cleanThemeColor(src[i], fallback));
  }

  function sameColorArray(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length < b.length) return false;
    return b.every((color, i) => _cleanThemeColor(a[i]).toLowerCase() === _cleanThemeColor(color).toLowerCase());
  }

  function inferThemeKey(ld, fallback) {
    if (fallback === undefined) fallback = 'highland';
    const fb = THEMES_BG[fallback] ? fallback : 'highland';
    if (!ld) return fb;
    const explicit = String(ld._bgTheme || ld.theme || '').toLowerCase();
    if (THEMES_BG[explicit]) return explicit;

    const name = String(ld.name || '').toLowerCase();
    // Most-specific keywords first so a name like "castle dungeon" hits
    // the castle theme instead of the older citadel pattern.
    if (/(dungeon|crypt|catacomb|keep|cobble|torchlit)/.test(name)) return 'castle';
    if (/(cosmos|cosmic|nebula|starfield|space|galaxy|orbit|astral)/.test(name)) return 'cosmic';
    if (/(cherry|sakura|blossom|hanami)/.test(name)) return 'cherry';
    if (/(steam|brass|copper|cog|gear-?works|clockwork|industrial)/.test(name)) return 'steampunk';
    if (/(cyber|neon|chrome|night-?city|datastream|matrix)/.test(name)) return 'cyber';
    if (/(coral|reef|lagoon|atoll|aquatic|undersea)/.test(name)) return 'coralreef';
    if (/(halloween|haunt|spook|pumpkin|graveyard|witch)/.test(name)) return 'halloween';
    if (/(cinder|lava|ash|smoke|inferno|dragon|volcan|magma|ember)/.test(name)) return 'volcanic';
    if (/(snow|glacier|blizzard|ice|avalanche|frost|frozen)/.test(name)) return 'frozen';
    if (/(twilight|phantom|soul|shadow|demon|chaos|void|moor)/.test(name)) return 'shadow';
    if (/(heaven|celestial|cloud|sky|ascen|paradise|seraph|empyrean|aether)/.test(name)) return 'heaven';
    if (/(citadel|tower|castle|bell|buttress|throne|parapet)/.test(name)) return 'citadel';
    if (/(desert|dune|sand|oasis|mesa|canyon|sun)/.test(name)) return 'desert';
    if (/(forest|grove|wood|moss|root|canopy)/.test(name)) return 'forest';
    if (/(ocean|reef|tide|kelp|cove|loch|deep|current)/.test(name)) return 'ocean';
    if (/(tutorial|training|blueprint|workshop|test|drill|practice|drafting|notebook)/.test(name)) return 'blueprint';

    for (const key of Object.keys(THEMES_PC)) {
      if (sameColorArray(ld.platColors, THEMES_PC[key])) return key;
      if (sameColorArray(ld.bgColors, THEMES_BG[key].bg)) return key;
    }

    const colors = [
      ...(ld.bgColors || []),
      ...(ld.platColors || []),
      ld.accentColor,
      ld.accentColor2
    ].map(c => _cleanThemeColor(c).toLowerCase());
    const has = (...vals) => vals.some(v => colors.includes(v));
    if (has('#cc3300', '#ff6600', '#2a0e00', '#3a1800', '#1a0600')) return 'volcanic';
    if (has('#4488cc', '#88ddff', '#101a2a', '#1a2e4a', '#060c1a')) return 'frozen';
    if (has('#8800cc', '#cc44ff', '#0a0018', '#160028', '#080010')) return 'shadow';
    if (has('#3a2808', '#5a3e10', '#7a5418', '#1a1005', '#2a1a08')) return 'citadel';
    return fb;
  }

  function applyThemeToLevel(ld, key) {
    const themeKey = THEMES_BG[key] ? key : 'highland';
    const tb = THEMES_BG[themeKey];
    ld._bgTheme = themeKey;
    ld.bgColors = [...tb.bg];
    ld.skyStars = !!tb.stars;
    ld.misty = !!tb.misty;
    ld.platColors = [...(THEMES_PC[themeKey] || THEMES_PC.highland)];
    ld.accentColor = tb.accent;
    ld.accentColor2 = tb.accent2;
    return themeKey;
  }

  // ── Exports ─────────────────────────────────────────────────────────
  // Namespaced (preferred for future code):
  window.GameThemes = {
    THEMES_PC, THEMES_BG, NOTE_PALETTES,
    pickNoteColor, themePaletteFor, sameColorArray,
    inferThemeKey, applyThemeToLevel,
    cleanThemeColor: _cleanThemeColor,
  };
  // Bare-global mirror so existing inline-script call sites keep working
  // without rewriting hundreds of references. Drop this block once the
  // engine is fully namespaced.
  window.THEMES_PC        = THEMES_PC;
  window.THEMES_BG        = THEMES_BG;
  window.NOTE_PALETTES    = NOTE_PALETTES;
  window.pickNoteColor    = pickNoteColor;
  window.themePaletteFor  = themePaletteFor;
  window.sameColorArray   = sameColorArray;
  window.inferThemeKey    = inferThemeKey;
  window.applyThemeToLevel = applyThemeToLevel;
  window.cleanThemeColor  = _cleanThemeColor;
})();
