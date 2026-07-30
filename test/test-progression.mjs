// test/test-progression.mjs
// ──────────────────────────────────────────────────────────────────
// Progression harness for src/progression.js. Builds a tiny WORLDS +
// levelStars fixture in a sandbox (with stats/perks/wallet loaded) and
// asserts the completion math + milestone-achievement unlocks.
//
// USAGE: node test/test-progression.mjs
// ──────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; fails.push(msg); console.log('  ✗ ' + msg); } }

function makeCtx(lsStore) {
  const localStorage = {
    getItem: (k) => (k in lsStore ? lsStore[k] : null),
    setItem: (k, v) => { lsStore[k] = String(v); },
    removeItem: (k) => { delete lsStore[k]; },
  };
  // Stats toast() touches document; stub it minimally.
  const doc = { getElementById: () => null, createElement: () => ({ style: {}, appendChild() {} }), };
  // In a real browser window === globalThis, so `window.X = …` also creates
  // the bare global `X`. Mirror that here so modules see each other.
  const ctx = { localStorage, JSON, Math, console, document: doc,
    requestAnimationFrame: () => {}, setTimeout: () => {} };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  return ctx;
}
function load(ctx, file) { vm.runInContext(readFileSync(join(ROOT, 'src', file), 'utf8'), ctx); }

const ls = {};
const ctx = makeCtx(ls);
load(ctx, 'wallet.js');
load(ctx, 'stats.js');
load(ctx, 'perks.js');
// Fixture: 2 worlds (2 levels + 1 level) = 3 levels, 9 max stars.
ctx.window.WORLDS = [{ levels: [{}, {}] }, { levels: [{}] }];
ctx.window.levelStars = { '1-1': 3, '1-2': 1 };  // 2 cleared, 4 stars, world1 complete
load(ctx, 'progression.js');

const Prog = ctx.window.GameProgress;
const Stats = ctx.window.GameStats;

// ── Completion math ──────────────────────────────────────────────
let c = Prog.getCompletion();
ok(c.levels.total === 3 && c.levels.done === 2, 'levels 2/3 cleared');
ok(c.stars.max === 9 && c.stars.got === 4, 'stars 4/9');
ok(c.worlds.total === 2 && c.worlds.done === 1, 'worlds 1/2 complete');
ok(c.pct === 67, 'headline pct = round(2/3) = 67');

// ── Milestones not yet earned ────────────────────────────────────
Prog.checkMilestones();
ok(Stats.isUnlocked('completionist') === false, 'completionist not yet earned');
ok(Stats.isUnlocked('star_master') === false, 'star_master not yet earned');

// ── Clear everything → completionist; 3-star all → star_master ───
ctx.window.levelStars = { '1-1': 3, '1-2': 3, '2-1': 3 };
c = Prog.getCompletion();
ok(c.levels.done === 3 && c.pct === 100, 'all levels cleared → 100%');
ok(c.stars.got === 9, 'all 3-stars → 9/9');
Prog.checkMilestones();
ok(Stats.isUnlocked('completionist') === true, 'completionist unlocked at 100% levels');
ok(Stats.isUnlocked('star_master') === true, 'star_master unlocked at full stars');

// ── perk_collector: max every perk, then check ───────────────────
ok(Stats.isUnlocked('perk_collector') === false, 'perk_collector not earned with no perks');
const P = ctx.window.GamePerks, W = ctx.window.GameWallet;
W.earnCoins(100000); W.earnEmbers(100);
for (const def of P.getCatalog()) { while (!P.isMaxed(def.id)) { if (!P.buy(def.id)) break; } }
Prog.checkMilestones();
ok(Stats.isUnlocked('perk_collector') === true, 'perk_collector unlocked when all perks maxed');

// ── big_spender is data-driven off coinsSpent ───────────────────
ok(Stats.isUnlocked('big_spender') === true, 'big_spender unlocked after >1000 coins spent on perks');

console.log('\n── Results ──');
console.log('Pass: ' + pass);
console.log('Fail: ' + fail);
if (fail > 0) { console.log('\nFailing:'); for (const f of fails) console.log('  • ' + f); process.exit(1); }
