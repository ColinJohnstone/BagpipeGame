// src/stats.js
// ──────────────────────────────────────────────────────────────────
// Stats + Achievements module.
//
// Tracks aggregate gameplay counters across sessions (coins collected,
// enemies defeated, levels cleared, distance run, etc.) and unlocks
// achievements when thresholds are crossed. Both persist to
// localStorage under `pogl_stats_v1` and `pogl_achv_v1`. New unlocks
// fire a toast banner via window.GameStats.toast().
//
// API (all exposed on window.GameStats):
//   recordCoin()              — +1 to coinsCollected; checks coin achvs
//   recordEnemyKill()         — +1 to enemiesDefeated
//   recordLevelClear(stars)   — +1 to levelsCleared, optionally +1 to perfectClears
//   recordDistance(dx)        — +|dx| to distanceRun (uses |dx| so backwards walking still counts)
//   recordJump()              — +1 to jumps
//   recordShot()              — +1 to shotsFired
//   recordDeath()             — +1 to deaths
//   recordTimeMs(ms)          — +ms to msPlayed
//   getStats()                — returns current snapshot (object)
//   getAchievements()         — returns [{ id, label, desc, unlocked, … }, …]
//   isUnlocked(id)            — boolean
//   resetAll()                — clears stats + achievements (for debugging)
//   toast(text)               — fires the toast banner manually (used by other modules too)
//
// Achievements are deliberately data-driven — the catalog below is just
// an array of records. Adding a new one means appending an entry.
// ──────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const STATS_KEY = 'pogl_stats_v1';
  const ACHV_KEY  = 'pogl_achv_v1';

  const DEFAULT_STATS = {
    coinsCollected:  0,
    enemiesDefeated: 0,
    levelsCleared:   0,
    perfectClears:   0,   // 3-star clears
    distanceRun:     0,   // in canvas pixels
    jumps:           0,
    shotsFired:      0,
    deaths:          0,
    msPlayed:        0,
    worldsCompleted: 0,   // tracked when a player gets ≥1 star on every level of a world
    coinsSpent:      0,   // total coins spent in the Highland Market (shop/perks/worlds)
  };

  function _load(key, def) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return Object.assign({}, def);
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Merge so newly-added counter fields default to 0 on old saves
        return Object.assign({}, def, parsed);
      }
    } catch (e) { /* ignore */ }
    return Object.assign({}, def);
  }
  function _save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { /* localStorage full / disabled */ }
  }

  let _stats = _load(STATS_KEY, DEFAULT_STATS);
  let _unlocked = (function () {
    try {
      const raw = localStorage.getItem(ACHV_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) { return {}; }
  })();

  // ── Achievement catalog ──────────────────────────────────────────
  // Each entry has:
  //   id     — unique key (also used in unlock conditions for cosmetic items)
  //   label  — title shown in the UI / toast
  //   desc   — one-line subtitle
  //   icon   — emoji shown in the toast + achievement list
  //   check  — function(stats) → boolean (criteria met)
  const CATALOG = [
    // Coin milestones
    { id: 'coins_100',  label: 'COIN COLLECTOR',     icon: '🪙',
      desc: 'Collect 100 coins total',
      check: s => s.coinsCollected >= 100 },
    { id: 'coins_500',  label: 'TREASURE HOARDER',   icon: '💰',
      desc: 'Collect 500 coins total',
      check: s => s.coinsCollected >= 500 },
    { id: 'coins_2000', label: 'KING\'S RANSOM',     icon: '👑',
      desc: 'Collect 2,000 coins total',
      check: s => s.coinsCollected >= 2000 },

    // Combat milestones
    { id: 'kills_50',   label: 'FIRST BLOOD',        icon: '⚔️',
      desc: 'Defeat 50 enemies',
      check: s => s.enemiesDefeated >= 50 },
    { id: 'kills_250',  label: 'BATTLE-HARDENED',    icon: '🗡️',
      desc: 'Defeat 250 enemies',
      check: s => s.enemiesDefeated >= 250 },
    { id: 'kills_1000', label: 'LEGEND OF THE GLEN', icon: '🏹',
      desc: 'Defeat 1,000 enemies',
      check: s => s.enemiesDefeated >= 1000 },

    // Level clears
    { id: 'clear_5',    label: 'GETTING STARTED',    icon: '🚩',
      desc: 'Clear 5 levels',
      check: s => s.levelsCleared >= 5 },
    { id: 'clear_25',   label: 'JOURNEYMAN PIPER',   icon: '🎶',
      desc: 'Clear 25 levels',
      check: s => s.levelsCleared >= 25 },
    { id: 'clear_75',   label: 'HIGHLAND HERO',      icon: '🏔️',
      desc: 'Clear 75 levels',
      check: s => s.levelsCleared >= 75 },

    // Perfect (3-star) clears
    { id: 'perfect_5',  label: 'PERFECTIONIST',      icon: '⭐',
      desc: '3-star clear 5 levels',
      check: s => s.perfectClears >= 5 },
    { id: 'perfect_25', label: 'GOLDEN PIPER',       icon: '🌟',
      desc: '3-star clear 25 levels',
      check: s => s.perfectClears >= 25 },

    // Distance
    { id: 'dist_10k',   label: 'ROAD WARRIOR',       icon: '👣',
      desc: 'Run 10,000 pixels of glen',
      check: s => s.distanceRun >= 10000 },
    { id: 'dist_50k',   label: 'CROSS-COUNTRY',      icon: '🥾',
      desc: 'Run 50,000 pixels of glen',
      check: s => s.distanceRun >= 50000 },

    // Misc
    { id: 'jumps_500',  label: 'SPRING-LOADED',      icon: '🦘',
      desc: 'Perform 500 jumps',
      check: s => s.jumps >= 500 },
    { id: 'shots_1000', label: 'NOTE STORM',         icon: '🎵',
      desc: 'Fire 1,000 notes',
      check: s => s.shotsFired >= 1000 },
    { id: 'survive_1',  label: 'HEAD HIGH',          icon: '🛡️',
      desc: 'Clear a level without dying',
      check: s => false /* unlocked via recordLevelClear */ },

    // World completion (tracked via UI when a world becomes fully cleared)
    { id: 'world_1_done', label: 'MISTY MASTER',   icon: '🌫️',
      desc: 'Clear every level in Misty Peaks',
      check: s => false /* unlocked imperatively by ui.js */ },
    { id: 'world_5_done', label: 'LEGACY KEEPER',  icon: '📜',
      desc: 'Clear every level in Legacy',
      check: s => false },

    // ── Highland Market / progression (1.0) ──────────────────────────
    { id: 'big_spender',   label: 'BIG SPENDER',   icon: '🛒',
      desc: 'Spend 1,000 coins at the Highland Market',
      check: s => (s.coinsSpent || 0) >= 1000 },
    { id: 'perk_collector', label: 'FULLY EQUIPPED', icon: '⚙️',
      desc: 'Buy every perk to its maximum tier',
      check: s => false /* unlocked imperatively via GameProgress */ },
    { id: 'completionist', label: 'HIGHLAND LEGEND', icon: '🏅',
      desc: 'Clear every level in the game',
      check: s => false /* unlocked imperatively via GameProgress */ },
    { id: 'star_master',   label: 'CONSTELLATION',  icon: '🌠',
      desc: '3-star every level in the game',
      check: s => false /* unlocked imperatively via GameProgress */ },
  ];

  // ── Toast banner ─────────────────────────────────────────────────
  // Renders a small slide-down banner from the top of the canvas wrap.
  // Falls back to console if the DOM target isn't available yet.
  const TOAST_DURATION_MS = 3000;
  let _toastEl = null;
  let _toastQueue = [];
  let _toastBusy = false;
  function _ensureToastEl() {
    if (_toastEl) return _toastEl;
    const wrap = document.getElementById('wrap');
    if (!wrap) return null;
    _toastEl = document.createElement('div');
    _toastEl.id = 'achv-toast';
    _toastEl.style.cssText = [
      'position:absolute',
      'top:-80px',                       // off-screen at rest
      'left:50%',
      'transform:translateX(-50%)',
      'min-width:240px',
      'max-width:480px',
      'padding:10px 18px',
      'background:linear-gradient(180deg,rgba(20,14,52,0.92) 0%,rgba(6,4,22,0.88) 100%)',
      '-webkit-backdrop-filter:blur(14px) saturate(150%)',
      'backdrop-filter:blur(14px) saturate(150%)',
      'border:1px solid #ffd76a',
      'border-radius:14px',
      'box-shadow:0 12px 32px rgba(0,0,0,0.55), 0 0 24px rgba(255,215,106,0.45)',
      'color:#ffd76a',
      'font-family:"Press Start 2P", monospace',
      'font-size:8px',
      'text-align:center',
      'line-height:1.6',
      'letter-spacing:0.5px',
      'z-index:120',
      'pointer-events:none',
      'transition:top .35s cubic-bezier(.4,.2,.2,1), opacity .25s ease',
      'opacity:0',
    ].join(';');
    wrap.appendChild(_toastEl);
    return _toastEl;
  }
  function _runToastQueue() {
    if (_toastBusy) return;
    const next = _toastQueue.shift();
    if (!next) return;
    _toastBusy = true;
    const el = _ensureToastEl();
    if (!el) { console.log('[ACHV TOAST]', next); _toastBusy = false; _runToastQueue(); return; }
    el.innerHTML = next.html;
    requestAnimationFrame(() => {
      el.style.top = '18px';
      el.style.opacity = '1';
    });
    setTimeout(() => {
      el.style.top = '-80px';
      el.style.opacity = '0';
      setTimeout(() => { _toastBusy = false; _runToastQueue(); }, 400);
    }, TOAST_DURATION_MS);
  }
  /** Show a toast banner. `html` may contain inline HTML. */
  function toast(html) {
    _toastQueue.push({ html });
    _runToastQueue();
  }

  // ── Achievement engine ───────────────────────────────────────────
  function _checkAndUnlock() {
    let anyUnlocked = false;
    for (const a of CATALOG) {
      if (_unlocked[a.id]) continue;
      if (typeof a.check === 'function' && a.check(_stats)) {
        _unlock(a);
        anyUnlocked = true;
      }
    }
    if (anyUnlocked) _save(ACHV_KEY, _unlocked);
  }
  function _unlock(a) {
    if (_unlocked[a.id]) return;
    _unlocked[a.id] = { unlockedAt: Date.now() };
    toast(`<div style="font-size:10px;color:#ffd76a;margin-bottom:4px;">${a.icon || '🏆'} ACHIEVEMENT</div><div style="color:#fff;font-size:7px;">${a.label}</div><div style="color:#aaa;font-size:6px;margin-top:3px;">${a.desc}</div>`);
    _save(ACHV_KEY, _unlocked);
    // Tell the unlocks module so cosmetic items keyed off achievement IDs
    // can re-evaluate. Lazy lookup so module load order is forgiving.
    try {
      if (window.GameUnlocks && typeof window.GameUnlocks._reevaluate === 'function') {
        window.GameUnlocks._reevaluate();
      }
    } catch (e) { /* ignore */ }
  }
  /** Imperative unlock (for non-stat-driven achievements). */
  function unlockById(id) {
    const a = CATALOG.find(x => x.id === id);
    if (a) _unlock(a);
  }

  // ── Recording API ────────────────────────────────────────────────
  function _commit() { _save(STATS_KEY, _stats); }
  function recordCoin() {
    _stats.coinsCollected++;
    _commit();
    _checkAndUnlock();
  }
  function recordEnemyKill() {
    _stats.enemiesDefeated++;
    _commit();
    _checkAndUnlock();
  }
  function recordLevelClear(stars, opts) {
    _stats.levelsCleared++;
    if (stars >= 3) _stats.perfectClears++;
    if (opts && opts.noDeath) unlockById('survive_1');
    _commit();
    _checkAndUnlock();
  }
  function recordDistance(dx) {
    const d = Math.abs(+dx || 0);
    if (d > 0) {
      _stats.distanceRun += d;
      // Distance is incremented per frame — defer the commit so we don't
      // hit localStorage 60+ times per second. Save on a debounced timer.
      _scheduleDistanceCommit();
    }
  }
  let _distanceTimer = null;
  function _scheduleDistanceCommit() {
    if (_distanceTimer) return;
    _distanceTimer = setTimeout(() => {
      _distanceTimer = null;
      _commit();
      _checkAndUnlock();
    }, 2000);
  }
  function recordJump() { _stats.jumps++; _commit(); _checkAndUnlock(); }
  function recordShot() { _stats.shotsFired++; }       // hot — don't commit per shot
  let _shotTimer = null;
  function _scheduleShotCommit() {
    if (_shotTimer) return;
    _shotTimer = setTimeout(() => { _shotTimer = null; _commit(); _checkAndUnlock(); }, 2000);
  }
  // Wrapper that buffers shot-counter writes:
  const _recordShotRaw = recordShot;
  function recordShotBuffered() { _recordShotRaw(); _scheduleShotCommit(); }
  function recordDeath() { _stats.deaths++; _commit(); }
  function recordTimeMs(ms) {
    const v = +ms || 0;
    if (v > 0) { _stats.msPlayed += v; _scheduleDistanceCommit(); }
  }
  function recordSpend(coins) {
    const c = Math.max(0, Math.floor(+coins || 0));
    if (c > 0) { _stats.coinsSpent += c; _commit(); _checkAndUnlock(); }
  }
  function recordWorldComplete(worldIdx) {
    _stats.worldsCompleted++;
    _commit();
    // Specific per-world achievement IDs follow the convention `world_N_done`
    unlockById('world_' + worldIdx + '_done');
  }

  function getStats()        { return Object.assign({}, _stats); }
  function getAchievements() {
    return CATALOG.map(a => ({
      id: a.id, label: a.label, desc: a.desc, icon: a.icon,
      unlocked: !!_unlocked[a.id],
      unlockedAt: _unlocked[a.id] && _unlocked[a.id].unlockedAt,
    }));
  }
  function isUnlocked(id) { return !!_unlocked[id]; }
  function resetAll() {
    _stats = Object.assign({}, DEFAULT_STATS);
    _unlocked = {};
    _save(STATS_KEY, _stats);
    _save(ACHV_KEY, _unlocked);
  }

  // ── Exports ──────────────────────────────────────────────────────
  window.GameStats = {
    recordCoin, recordEnemyKill, recordLevelClear,
    recordDistance, recordJump, recordShot: recordShotBuffered,
    recordDeath, recordTimeMs, recordWorldComplete, recordSpend,
    unlockById,
    getStats, getAchievements, isUnlocked, resetAll,
    toast,
    CATALOG,
  };
})();
