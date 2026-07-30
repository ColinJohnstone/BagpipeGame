// src/progression.js
// ──────────────────────────────────────────────────────────────────
// Progression / completion tracking — Phase 3 of the "Highland Market"
// 1.0 update.
//
// Aggregates the player's overall journey from the data the rest of the
// game already persists:
//   • levelStars  (window.levelStars)  — per-level star counts (0..3)
//   • WORLDS       (window.WORLDS)       — the world/level manifest
//   • GameStats    — lifetime achievements
//   • GamePerks    — owned perk tiers
//   • GameWallet   — premium ember balance (informational)
//
// Headline "completion %" is levels-cleared / total-levels, so a player
// reaches 100% by clearing every level once (stars/perks/achievements
// are shown as separate progress bars rather than gating the headline).
//
// Also fires a few milestone achievements that aren't pure stat
// thresholds (100% completion, every perk maxed). Call checkMilestones()
// after a level clear or a shop purchase.
//
// API (window.GameProgress):
//   getCompletion() → {
//     pct, levels:{done,total}, stars:{got,max},
//     worlds:{done,total}, achievements:{got,total}, perks:{got,total},
//   }
//   checkMilestones()   — unlock completion/perk milestone achievements
// ──────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  function _worlds() {
    const w = (typeof WORLDS !== 'undefined' && WORLDS) || window.WORLDS;
    return Array.isArray(w) ? w : [];
  }
  function _stars() { return window.levelStars || {}; }

  function getCompletion() {
    const worlds = _worlds();
    const stars = _stars();

    let levelsTotal = 0, levelsDone = 0;
    let starsGot = 0, starsMax = 0;
    let worldsDone = 0;

    for (let i = 0; i < worlds.length; i++) {
      const w = worlds[i];
      const levels = (w && w.levels) || [];
      if (!levels.length) continue;
      let worldComplete = true;
      for (let j = 0; j < levels.length; j++) {
        const key = (i + 1) + '-' + (j + 1);
        const s = Math.max(0, Math.min(3, stars[key] | 0));
        levelsTotal++;
        starsMax += 3;
        starsGot += s;
        if (s > 0) levelsDone++; else worldComplete = false;
      }
      if (worldComplete) worldsDone++;
    }

    // Achievements
    let achGot = 0, achTotal = 0;
    try {
      const list = (window.GameStats && GameStats.getAchievements()) || [];
      achTotal = list.length;
      achGot = list.filter(a => a.unlocked).length;
    } catch (e) { /* ignore */ }

    // Perks (sum of owned tiers vs total tiers)
    let perkGot = 0, perkTotal = 0;
    try {
      const cat = (window.GamePerks && GamePerks.getCatalog()) || [];
      for (const p of cat) { perkTotal += p.tiers.length; perkGot += p.tier; }
    } catch (e) { /* ignore */ }

    const pct = levelsTotal > 0 ? Math.round((levelsDone / levelsTotal) * 100) : 0;

    return {
      pct,
      levels: { done: levelsDone, total: levelsTotal },
      stars:  { got: starsGot, max: starsMax },
      worlds: { done: worldsDone, total: worlds.length },
      achievements: { got: achGot, total: achTotal },
      perks:  { got: perkGot, total: perkTotal },
    };
  }

  // ── Milestone achievements ───────────────────────────────────────
  function checkMilestones() {
    if (!window.GameStats || typeof GameStats.unlockById !== 'function') return;
    try {
      const c = getCompletion();
      if (c.levels.total > 0 && c.levels.done >= c.levels.total) {
        GameStats.unlockById('completionist');
      }
      if (c.stars.max > 0 && c.stars.got >= c.stars.max) {
        GameStats.unlockById('star_master');
      }
      if (c.perks.total > 0 && c.perks.got >= c.perks.total) {
        GameStats.unlockById('perk_collector');
      }
    } catch (e) { /* never let a milestone check break a clear */ }
  }

  window.GameProgress = { getCompletion, checkMilestones };
})();
