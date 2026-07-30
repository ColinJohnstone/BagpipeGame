// src/unlocks.js
// ──────────────────────────────────────────────────────────────────
// Cosmetic-unlock system.
//
// Some hat / beard / shoe / bagpipe variants and color presets are
// locked behind achievements (from src/stats.js) or specific level
// completions (from levelStars). The customizer UI in src/ui.js asks
// `GameUnlocks.isUnlocked(slot, key)` and `GameUnlocks.lockHint(slot,
// key)` to decide whether to render a chip as active or grayed-out.
//
// The "starter" set is everything that was available before this system
// existed — those stay free. New / cool variants are gated behind
// achievements to give the customizer long-term progression.
//
// Unlocks are evaluated lazily on read (we check the underlying
// condition every time isUnlocked is called) so there's no cache to
// invalidate. We also push toast notifications when previously-locked
// items first cross the threshold — that happens in `_reevaluate()`,
// which src/stats.js calls after every achievement unlock + we also
// call it on level-clear from ui.js.
// ──────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const LS_KEY = 'pogl_unlocks_seen_v1';
  const CHEAT_KEY = 'pogl_unlock_all_v1';
  const BUY_KEY = 'pogl_unlock_buy_v1';   // cosmetics bought with coins in the shop

  // Coins charged to buy a locked cosmetic outright (the shop's alternate
  // path to the achievement gate). Keyed by slot; sensible per-slot prices.
  const SHOP_PRICE = {
    hat: 400, beard: 300, face: 350, shoes: 300, sockStyle: 220, bagpipeType: 700,
  };
  function _priceFor(slot) { return SHOP_PRICE[slot] || 350; }

  // "Unlock all cosmetics" master switch. Settings → toggle. When ON,
  // every isUnlocked() call returns true regardless of stats — useful
  // for trying outfits before earning them, or showing off the full
  // wardrobe in screenshots.
  let _unlockAll = false;
  try { _unlockAll = localStorage.getItem(CHEAT_KEY) === '1'; } catch (e) { /* ignore */ }

  // Cosmetics the player bought with coins. Map of `slot:key` → 1.
  let _bought = {};
  try {
    const raw = localStorage.getItem(BUY_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === 'object') _bought = p; }
  } catch (e) { /* ignore */ }
  function _saveBought() { try { localStorage.setItem(BUY_KEY, JSON.stringify(_bought)); } catch (e) {} }
  function _isBought(slot, key) { return !!_bought[slot + ':' + key]; }

  // ── Catalog ──────────────────────────────────────────────────────
  // condition: function(s) → boolean
  //   s.isAchv(id) → achievement unlocked?
  //   s.starsAt(world, level) → star count (0-3) for that level
  //   s.stat(name) → raw counter value
  //
  // hint:      one-line teaser shown when the user hovers a locked chip.
  //
  // Slot / key naming matches the keys used in src/sprites.js'
  // *_VARIANTS / *_PRESETS objects. Anything NOT in this catalog is
  // assumed to be free (no unlock required).
  const CATALOG = [
    // Hats
    { slot: 'hat', key: 'viking',    label: 'VIKING HORNS', hint: 'Clear 250 enemies (BATTLE-HARDENED)',
      condition: s => s.isAchv('kills_250') },
    { slot: 'hat', key: 'wizard',    label: 'WIZARD HAT',   hint: 'Collect 500 coins (TREASURE HOARDER)',
      condition: s => s.isAchv('coins_500') },
    { slot: 'hat', key: 'crown',     label: 'CROWN',        hint: 'Collect 2,000 coins (KING\'S RANSOM)',
      condition: s => s.isAchv('coins_2000') },
    { slot: 'hat', key: 'pirate',    label: 'PIRATE',       hint: '3-star clear 5 levels (PERFECTIONIST)',
      condition: s => s.isAchv('perfect_5') },
    { slot: 'hat', key: 'santa',     label: 'SANTA',        hint: 'Clear 75 levels (HIGHLAND HERO)',
      condition: s => s.isAchv('clear_75') },
    { slot: 'hat', key: 'cowboy',    label: 'COWBOY',       hint: 'Run 50,000 px (CROSS-COUNTRY)',
      condition: s => s.isAchv('dist_50k') },
    { slot: 'hat', key: 'fez',       label: 'FEZ',          hint: 'Clear 25 levels (JOURNEYMAN PIPER)',
      condition: s => s.isAchv('clear_25') },

    // Beards
    { slot: 'beard', key: 'bushy',       label: 'BUSHY BEARD',   hint: 'Clear 50 enemies (FIRST BLOOD)',
      condition: s => s.isAchv('kills_50') },
    { slot: 'beard', key: 'vandyke',     label: 'VANDYKE',       hint: 'Fire 1,000 notes (NOTE STORM)',
      condition: s => s.isAchv('shots_1000') },
    { slot: 'beard', key: 'muttonchops', label: 'MUTTONCHOPS',   hint: '3-star clear 25 levels (GOLDEN PIPER)',
      condition: s => s.isAchv('perfect_25') },

    // Faces
    { slot: 'face', key: 'sunglasses',  label: 'SUNGLASSES',  hint: 'Defeat 1,000 enemies (LEGEND OF THE GLEN)',
      condition: s => s.isAchv('kills_1000') },
    { slot: 'face', key: 'eyepatch',    label: 'EYEPATCH',    hint: 'Clear a level without dying (HEAD HIGH)',
      condition: s => s.isAchv('survive_1') },
    { slot: 'face', key: 'scar',        label: 'BATTLE SCAR', hint: 'Clear 250 enemies (BATTLE-HARDENED)',
      condition: s => s.isAchv('kills_250') },

    // Shoes
    { slot: 'shoes', key: 'armor',        label: 'GREAVES',      hint: 'Defeat 250 enemies (BATTLE-HARDENED)',
      condition: s => s.isAchv('kills_250') },
    { slot: 'shoes', key: 'cowboy_boot',  label: 'COWBOY BOOTS', hint: 'Run 50,000 px (CROSS-COUNTRY)',
      condition: s => s.isAchv('dist_50k') },
    { slot: 'shoes', key: 'heels',        label: 'HEELS',        hint: 'Collect 500 coins (TREASURE HOARDER)',
      condition: s => s.isAchv('coins_500') },
    { slot: 'shoes', key: 'hightop',      label: 'HIGH-TOPS',    hint: 'Jump 500 times (SPRING-LOADED)',
      condition: s => s.isAchv('jumps_500') },

    // Sock styles
    { slot: 'sockStyle', key: 'argyle',  label: 'ARGYLE',       hint: 'Clear 25 levels (JOURNEYMAN PIPER)',
      condition: s => s.isAchv('clear_25') },
    { slot: 'sockStyle', key: 'striped', label: 'STRIPED',      hint: '3-star clear 5 levels (PERFECTIONIST)',
      condition: s => s.isAchv('perfect_5') },

    // Bagpipes — types 4 + 5 are unlockable. The type pin (PLAYER_CUSTOM.bagpipeType)
    // is gated on its catalog entry below; tab 0 (Auto) is always free.
    { slot: 'bagpipeType', key: '4',   label: 'CHARGE BAGPIPE',  hint: 'Fire 1,000 notes (NOTE STORM)',
      condition: s => s.isAchv('shots_1000') },
    { slot: 'bagpipeType', key: '5',   label: 'PORTAL BAGPIPE',  hint: 'Clear 75 levels (HIGHLAND HERO)',
      condition: s => s.isAchv('clear_75') },
  ];

  function _statsAdapter() {
    const S = window.GameStats;
    return {
      isAchv: id => S ? S.isUnlocked(id) : false,
      stat:   k  => S ? (S.getStats()[k] | 0) : 0,
      starsAt: (w, l) => (window.levelStars || {})[w + '-' + l] | 0,
    };
  }

  function _entry(slot, key) {
    return CATALOG.find(c => c.slot === slot && String(c.key) === String(key));
  }

  /** Is the given customizer chip available? Unknown keys default to free. */
  function isUnlocked(slot, key) {
    if (_unlockAll) return true;  // cheat: every cosmetic is open
    const e = _entry(slot, key);
    if (!e) return true;  // not in catalog → free
    if (_isBought(slot, key)) return true;  // bought outright in the shop
    try { return !!e.condition(_statsAdapter()); }
    catch (err) { return false; }
  }

  // ── Shop purchase path ───────────────────────────────────────────
  // A locked cosmetic can be bought outright with coins instead of
  // grinding its achievement. Returns the coin price, or 0 if it's not
  // a gated catalog item (already free).
  function priceOf(slot, key) {
    const e = _entry(slot, key);
    return e ? _priceFor(slot) : 0;
  }
  /** Locked-by-achievement, not yet bought → can be offered in the shop. */
  function isPurchasable(slot, key) {
    const e = _entry(slot, key);
    if (!e) return false;
    if (_isBought(slot, key)) return false;
    try { return !e.condition(_statsAdapter()); }   // still locked → offer it
    catch (err) { return true; }
  }
  function isBought(slot, key) { return _isBought(slot, key); }
  /** Spend coins to unlock a cosmetic. Returns true on success. */
  function purchase(slot, key) {
    if (!isPurchasable(slot, key)) return false;
    const price = priceOf(slot, key);
    if (!window.GameWallet || !window.GameWallet.spend(price, 0)) return false;
    _bought[slot + ':' + key] = 1;
    _saveBought();
    return true;
  }
  function setUnlockAll(v) {
    _unlockAll = !!v;
    try { localStorage.setItem(CHEAT_KEY, _unlockAll ? '1' : '0'); } catch (e) { /* ignore */ }
  }
  function isUnlockAll() { return _unlockAll; }
  function lockHint(slot, key) {
    const e = _entry(slot, key);
    return e ? e.hint : null;
  }

  // ── Toast on first cross-the-threshold ───────────────────────────
  // We persist a set of "seen unlocked" entries; if an entry first
  // transitions to unlocked since last check, fire a toast. Called by
  // src/stats.js after every achievement unlock + by ui.js after a
  // level clear (in case the unlock keys off levelStars rather than an
  // achievement).
  function _loadSeen() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return {};
      const p = JSON.parse(raw);
      return (p && typeof p === 'object') ? p : {};
    } catch (e) { return {}; }
  }
  function _saveSeen(s) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  let _seen = _loadSeen();
  function _reevaluate() {
    let dirty = false;
    for (const e of CATALOG) {
      const id = e.slot + ':' + e.key;
      const nowOk = (() => { try { return !!e.condition(_statsAdapter()); } catch { return false; } })();
      if (nowOk && !_seen[id]) {
        _seen[id] = Date.now();
        dirty = true;
        if (window.GameStats && typeof window.GameStats.toast === 'function') {
          window.GameStats.toast(
            `<div style="font-size:9px;color:#88c8ff;margin-bottom:4px;">🎨 COSMETIC UNLOCKED</div>` +
            `<div style="color:#fff;font-size:7px;">${e.label}</div>` +
            `<div style="color:#aaa;font-size:6px;margin-top:3px;">Equip it in the customizer</div>`);
        }
      }
    }
    if (dirty) _saveSeen(_seen);
  }

  function getCatalog() { return CATALOG.slice(); }
  function resetSeen() { _seen = {}; _saveSeen(_seen); }

  window.GameUnlocks = {
    isUnlocked, lockHint, getCatalog, _reevaluate, resetSeen,
    setUnlockAll, isUnlockAll,
    priceOf, isPurchasable, isBought, purchase,
  };
})();
