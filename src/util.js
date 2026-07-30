// src/util.js
// ──────────────────────────────────────────────────────────────────
// Pure helper functions extracted from index.html.
// These are the cleanest candidates for the first stage of the
// module split — they take arguments, return values, and don't
// mutate any game state.
//
// Loaded via a plain <script> tag (not type="module") so the file://
// protocol still works and inline onclick="…" handlers in the main
// HTML keep working. Functions are attached to `window.GameUtil`
// so the main script can call them without redeclaring.
//
// As more pure utilities get extracted, append them here. Anything
// that needs game state (player, ctx, camera, etc.) belongs in a
// future state.js / engine.js module instead.
// ──────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  /**
   * Standard AABB overlap test used everywhere in the game (collision,
   * pickup, etc.). Half-open intervals on the right/bottom so two
   * rectangles sharing an edge don't count as overlapping.
   * @param {number} ax @param {number} ay @param {number} aw @param {number} ah
   * @param {number} bx @param {number} by @param {number} bw @param {number} bh
   * @returns {boolean}
   */
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  /**
   * Clamp a value into [min, max].
   * @param {number} v @param {number} lo @param {number} hi
   * @returns {number}
   */
  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  /**
   * Linear interpolation. t is expected to be 0..1 but isn't clamped.
   * @param {number} a @param {number} b @param {number} t
   * @returns {number}
   */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /**
   * Convert HSL → RGB, all components 0..1. Returns [r, g, b] each 0..255.
   * Same math the game has used for rainbow/starInvincible effects.
   * @param {number} h @param {number} s @param {number} l
   * @returns {[number, number, number]}
   */
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  /**
   * Normalize a colour string. Accepts a `#rrggbb` hex, returns it
   * untouched; anything else falls back to the provided default.
   * Used by themes to validate per-level overrides.
   * @param {string|null|undefined} c
   * @param {string} fallback
   * @returns {string}
   */
  // Pre-compiled hex regexes (V8 caches inline literals already, but
  // pulling them to module scope makes the intent explicit and skips
  // the literal-table lookup on cold paths).
  const _hexRe6 = /^#[0-9a-fA-F]{6}$/;
  const _hexRe3 = /^#[0-9a-fA-F]{3}$/;
  function cleanThemeColor(c, fallback) {
    // Fast path — the overwhelmingly common case is an already-clean
    // 7-char `#rrggbb` hex literal coming from a theme palette. Hot
    // draw loops (background gradient, terrain, accents) hit this
    // dozens of times per frame, so skip the `.replace()` allocation
    // and the slow-path regex if the input is already valid.
    if (typeof c === 'string' && c.length === 7 && c.charCodeAt(0) === 35 /* '#' */ && _hexRe6.test(c)) return c;
    // Slow path — strip quotes, validate, fall back. Must always return
    // a string: callers chain `.toLowerCase()` without a fallback (see
    // sameColorArray / inferThemeKey).
    const stripped = String(c == null ? '' : c).replace(/['"]/g, '');
    if (_hexRe6.test(stripped) || _hexRe3.test(stripped)) return stripped;
    if (typeof fallback === 'string' && fallback.length) return fallback;
    return stripped || '#000';
  }

  // Expose the helpers. The main script reads from window.GameUtil so
  // we don't pollute the top-level namespace with generic names like
  // `clamp` that could collide with later additions.
  window.GameUtil = {
    overlap, clamp, lerp, hslToRgb, cleanThemeColor,
  };
})();
