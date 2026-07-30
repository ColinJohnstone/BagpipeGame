// src/wallet.js
// ──────────────────────────────────────────────────────────────────
// Persistent spendable wallet — Phase 1 of the "Highland Market" 1.0
// economy update.
//
// The game already tracks two earn-able things per level:
//   • coins   — picked up in-level, previously only rolled into score
//               and the lifetime `coinsCollected` achievement stat.
//   • embers  — 3 hidden spirit embers per level, previously only a
//               collectible gimmick.
//
// Neither had a SINK. This module turns them into real currencies:
//   • COINS  = soft currency. Banked in full on every level clear, so
//              replaying a level keeps paying out (grind-friendly).
//   • EMBERS = premium currency. Only NEW embers count — we remember
//              how many embers a given level has ever banked, so you
//              can't farm the same ember twice. Total ember income from
//              a level is therefore capped at that level's ember count.
//
// IMPORTANT: this wallet is SEPARATE from GameStats.coinsCollected.
//   `coinsCollected` is a monotonic lifetime counter that gates
//   achievements + cosmetic unlocks — it must never be decremented.
//   The wallet balance below is the spendable pool and DOES go down
//   when you buy things in the shop (Phase 2).
//
// Persisted to localStorage under `pogl_wallet_v1`. Old saves with no
// wallet key start at zero; nothing else migrates.
//
// API (window.GameWallet):
//   getCoins() / getEmbers()        — current spendable balances
//   getState()                      — shallow copy of the whole record
//   earnCoins(n) / earnEmbers(n)    — add currency, returns amount added
//   canAfford(coins, embers)        — boolean
//   spend(coins, embers)            — atomic debit; returns true if paid
//   bankClear(key, coins, embers)   — call on level-clear; returns
//                                     { coins, embers } actually banked
//   onChange(fn) / offChange(fn)    — subscribe to balance changes
//   reset()                         — wipe wallet (debug)
// ──────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const LS_KEY = 'pogl_wallet_v1';

  const DEFAULT = {
    coins: 0,          // spendable soft currency
    embers: 0,         // spendable premium currency
    bankedEmbers: {},  // levelKey → embers already banked (anti-farm)
  };

  function _load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return _clone(DEFAULT);
      const p = JSON.parse(raw);
      if (p && typeof p === 'object') {
        return {
          coins:  Math.max(0, p.coins | 0),
          embers: Math.max(0, p.embers | 0),
          bankedEmbers: (p.bankedEmbers && typeof p.bankedEmbers === 'object') ? p.bankedEmbers : {},
        };
      }
    } catch (e) { /* ignore */ }
    return _clone(DEFAULT);
  }
  function _clone(o) { return JSON.parse(JSON.stringify(o)); }

  let _w = _load();

  function _save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_w)); }
    catch (e) { /* localStorage full / disabled */ }
  }

  // ── Change subscribers ───────────────────────────────────────────
  // The HUD / title / worldmap subscribe so a readout updates the
  // instant currency moves (earn, spend, bank).
  const _subs = new Set();
  function _emit() {
    for (const fn of _subs) {
      try { fn(getState()); } catch (e) { /* never let a bad listener break a sale */ }
    }
  }
  function onChange(fn)  { if (typeof fn === 'function') _subs.add(fn); }
  function offChange(fn) { _subs.delete(fn); }

  // ── Reads ────────────────────────────────────────────────────────
  function getCoins()  { return _w.coins  | 0; }
  function getEmbers() { return _w.embers | 0; }
  function getState()  { return { coins: _w.coins | 0, embers: _w.embers | 0 }; }

  // ── Earns ────────────────────────────────────────────────────────
  function earnCoins(n) {
    const add = Math.max(0, Math.floor(+n || 0));
    if (add > 0) { _w.coins += add; _save(); _emit(); }
    return add;
  }
  function earnEmbers(n) {
    const add = Math.max(0, Math.floor(+n || 0));
    if (add > 0) { _w.embers += add; _save(); _emit(); }
    return add;
  }

  // ── Spends ───────────────────────────────────────────────────────
  function canAfford(coins, embers) {
    return (_w.coins | 0) >= Math.max(0, coins | 0) &&
           (_w.embers | 0) >= Math.max(0, embers | 0);
  }
  /** Atomic debit. Returns true only if the whole price was paid. */
  function spend(coins, embers) {
    const c = Math.max(0, coins | 0);
    const e = Math.max(0, embers | 0);
    if (!canAfford(c, e)) return false;
    _w.coins -= c;
    _w.embers -= e;
    _save();
    _emit();
    // Track lifetime coin spend for the BIG SPENDER achievement.
    try { if (c > 0 && window.GameStats && GameStats.recordSpend) GameStats.recordSpend(c); }
    catch (err) { /* ignore */ }
    return true;
  }

  // ── Bank on level clear ──────────────────────────────────────────
  // Coins: always banked in full (grind-friendly soft currency).
  // Embers: only the amount that exceeds what this level has ever
  //   banked before, so the same hidden ember can't be farmed twice.
  //   We track the high-water mark per level key in bankedEmbers.
  // Returns the amounts ACTUALLY credited, so the complete screen can
  // show an honest "+N banked".
  function bankClear(levelKey, coinsThisRun, embersThisRun) {
    const c = Math.max(0, Math.floor(+coinsThisRun || 0));
    const eRun = Math.max(0, Math.floor(+embersThisRun || 0));
    const key = String(levelKey || '');

    const prevEmbers = key ? (_w.bankedEmbers[key] | 0) : 0;
    const newEmbers = Math.max(0, eRun - prevEmbers);

    let dirty = false;
    if (c > 0) { _w.coins += c; dirty = true; }
    if (newEmbers > 0) { _w.embers += newEmbers; dirty = true; }
    // Raise the high-water mark even if newEmbers === 0 is a no-op;
    // only bump it upward so a worse run never lowers it.
    if (key && eRun > prevEmbers) { _w.bankedEmbers[key] = eRun; dirty = true; }

    if (dirty) { _save(); _emit(); }
    return { coins: c, embers: newEmbers };
  }

  function reset() { _w = _clone(DEFAULT); _save(); _emit(); }

  window.GameWallet = {
    getCoins, getEmbers, getState,
    earnCoins, earnEmbers,
    canAfford, spend,
    bankClear,
    onChange, offChange,
    reset,
  };
})();
