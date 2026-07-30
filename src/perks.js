// src/perks.js
// ──────────────────────────────────────────────────────────────────
// Perk system — Phase 2 of the "Highland Market" 1.0 economy update.
//
// Perks are PERMANENT, purchasable power-ups bought in the shop with
// the spendable wallet (src/wallet.js). By design (user call) they are
// pure power-ups — no trade-offs — so each tier strictly helps. They
// are balanced by PRICE, not by drawbacks.
//
// Ownership is a map of perkId → owned tier count, persisted to
// localStorage under `pogl_perks_v1`. Tier 0 = not owned; tier N means
// the first N tiers are bought. Single-tier perks are just 0 or 1.
//
// The game reads perk EFFECTS through the typed getters at the bottom
// (maxHpBonus / cooldownMult / magnetRadius / extraJumps / spawnShield
// / hasSecondWind). Those are applied once at player-init each level
// (see index.html, player = { … }) plus a couple of small in-loop
// hooks (coin magnet, second-wind revive).
//
// API (window.GamePerks):
//   getCatalog()            — array of perk defs (with live owned tier)
//   getTier(id)             — owned tier (0..tiers.length)
//   isMaxed(id)             — owned every tier?
//   nextCost(id)            — { coins, embers } for the next tier, or null
//   canBuy(id)              — affordable AND not maxed?
//   buy(id)                 — spend + bump tier; returns true on success
//   <effect getters>        — see EFFECTS section
//   reset()                 — wipe owned perks (debug)
// ──────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const LS_KEY = 'pogl_perks_v1';

  // ── Catalog ──────────────────────────────────────────────────────
  // tiers[i].cost is the price to go from tier i → i+1.
  // tiers[i].label is a short "what this tier gives you" blurb.
  const CATALOG = [
    {
      id: 'maxhp', name: 'STOUT HEART', icon: '❤️',
      desc: 'Raise your maximum health.',
      tiers: [
        { cost: { coins: 150 },  label: '+1 max HP' },
        { cost: { coins: 400 },  label: '+2 max HP' },
        { cost: { coins: 900 },  label: '+3 max HP' },
      ],
    },
    {
      id: 'cooldown', name: 'SWIFT PIPES', icon: '⚡',
      desc: 'Abilities recharge faster.',
      tiers: [
        { cost: { coins: 200 },  label: '-10% cooldowns' },
        { cost: { coins: 550 },  label: '-20% cooldowns' },
        { cost: { coins: 1200 }, label: '-30% cooldowns' },
      ],
    },
    {
      id: 'magnet', name: 'COIN MAGNET', icon: '\u{1F9F2}',
      desc: 'Draw nearby coins toward you.',
      tiers: [
        { cost: { coins: 120 },  label: 'Short pull' },
        { cost: { coins: 320 },  label: 'Medium pull' },
        { cost: { coins: 700 },  label: 'Long pull' },
      ],
    },
    {
      id: 'extrajump', name: 'HIGHLAND LUNG', icon: '\u{1FAB6}',
      desc: 'A permanent third jump.',
      tiers: [
        { cost: { coins: 650 },  label: 'Triple jump' },
      ],
    },
    {
      id: 'wardshield', name: 'THISTLE WARD', icon: '\u{1F33F}',
      desc: 'Begin every level shielded.',
      tiers: [
        { cost: { coins: 500, embers: 3 }, label: 'Spawn shield' },
      ],
    },
    {
      id: 'secondwind', name: 'SECOND WIND', icon: '\u{1F525}',
      desc: 'Cheat death once per level.',
      tiers: [
        { cost: { coins: 800, embers: 6 }, label: 'Revive at half HP' },
      ],
    },
  ];

  function _load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') return p;
      }
    } catch (e) { /* ignore */ }
    return {};
  }
  let _owned = _load();
  function _save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_owned)); }
    catch (e) { /* ignore */ }
  }

  function _def(id) { return CATALOG.find(p => p.id === id) || null; }

  // ── Queries ──────────────────────────────────────────────────────
  function getTier(id) {
    const d = _def(id);
    if (!d) return 0;
    return Math.max(0, Math.min(d.tiers.length, _owned[id] | 0));
  }
  function isMaxed(id) {
    const d = _def(id);
    return d ? getTier(id) >= d.tiers.length : true;
  }
  function nextCost(id) {
    const d = _def(id);
    if (!d) return null;
    const t = getTier(id);
    if (t >= d.tiers.length) return null;
    const c = d.tiers[t].cost || {};
    return { coins: c.coins | 0, embers: c.embers | 0 };
  }
  function canBuy(id) {
    const cost = nextCost(id);
    if (!cost) return false;
    return !!(window.GameWallet && window.GameWallet.canAfford(cost.coins, cost.embers));
  }
  /** Catalog with the live owned tier + next cost folded in for the UI. */
  function getCatalog() {
    return CATALOG.map(d => ({
      id: d.id, name: d.name, icon: d.icon, desc: d.desc,
      tiers: d.tiers.map(t => ({ cost: Object.assign({ coins: 0, embers: 0 }, t.cost), label: t.label })),
      tier: getTier(d.id),
      maxed: isMaxed(d.id),
      nextCost: nextCost(d.id),
      canBuy: canBuy(d.id),
    }));
  }

  // ── Purchase ─────────────────────────────────────────────────────
  function buy(id) {
    const cost = nextCost(id);
    if (!cost) return false;                       // maxed / unknown
    if (!window.GameWallet) return false;
    if (!window.GameWallet.spend(cost.coins, cost.embers)) return false;  // can't afford
    _owned[id] = getTier(id) + 1;
    _save();
    return true;
  }

  // ── Effect getters (read by the game at player-init / in loops) ──
  function maxHpBonus()  { return getTier('maxhp'); }                 // +0..+3 HP
  function cooldownMult() { return 1 - 0.10 * getTier('cooldown'); }  // 1.0 / .9 / .8 / .7
  function magnetRadius() { return [0, 70, 120, 185][getTier('magnet')] || 0; }
  function extraJumps()  { return getTier('extrajump') > 0 ? 1 : 0; }
  function spawnShield() { return getTier('wardshield') > 0; }
  function hasSecondWind() { return getTier('secondwind') > 0; }

  function reset() { _owned = {}; _save(); }

  window.GamePerks = {
    getCatalog, getTier, isMaxed, nextCost, canBuy, buy,
    maxHpBonus, cooldownMult, magnetRadius, extraJumps, spawnShield, hasSecondWind,
    reset,
  };
})();
