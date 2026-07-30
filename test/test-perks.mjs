// test/test-perks.mjs
// ──────────────────────────────────────────────────────────────────
// Perk regression harness for src/perks.js (loaded alongside the
// wallet, since buy() debits it). Asserts:
//   1. Fresh perks own nothing; effect getters are neutral.
//   2. Tier progression + nextCost walk the catalog.
//   3. buy() fails when broke, succeeds when funded, debits the wallet.
//   4. Maxed perks can't be bought further.
//   5. Effect getters reflect owned tiers (hp / cooldown / magnet / jump).
//   6. Ownership persists across reload.
//
// USAGE: node test/test-perks.mjs
// ──────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; fails.push(msg); console.log('  ✗ ' + msg); }
}

function makeCtx(lsStore) {
  const localStorage = {
    getItem: (k) => (k in lsStore ? lsStore[k] : null),
    setItem: (k, v) => { lsStore[k] = String(v); },
    removeItem: (k) => { delete lsStore[k]; },
  };
  const win = {};
  const ctx = { window: win, localStorage, JSON, Math, console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  return ctx;
}
function load(ctx, file) {
  vm.runInContext(readFileSync(join(ROOT, 'src', file), 'utf8'), ctx);
}

const ls = {};
let ctx = makeCtx(ls);
load(ctx, 'wallet.js');
load(ctx, 'perks.js');
const W = ctx.window.GameWallet;
const P = ctx.window.GamePerks;

// ── 1. Fresh ──────────────────────────────────────────────────────
ok(P.getTier('maxhp') === 0, 'fresh perks own nothing');
ok(P.maxHpBonus() === 0, 'maxHpBonus neutral at 0');
ok(P.cooldownMult() === 1, 'cooldownMult neutral at 1');
ok(P.magnetRadius() === 0, 'magnetRadius neutral at 0');
ok(P.extraJumps() === 0 && P.spawnShield() === false && P.hasSecondWind() === false, 'one-shot perks off');

// ── 2/3. nextCost + buy gating ────────────────────────────────────
const c0 = P.nextCost('maxhp');
ok(c0 && c0.coins === 150, 'maxhp tier-1 costs 150');
ok(P.canBuy('maxhp') === false, 'cannot buy maxhp while broke');
ok(P.buy('maxhp') === false, 'buy fails while broke');

W.earnCoins(1000);
ok(P.canBuy('maxhp') === true, 'can buy after funding');
ok(P.buy('maxhp') === true, 'buy succeeds when funded');
ok(W.getCoins() === 850, 'wallet debited 150');
ok(P.getTier('maxhp') === 1 && P.maxHpBonus() === 1, 'maxhp now tier 1 → +1 HP');

// ── 5. effect getters track tiers ─────────────────────────────────
W.earnCoins(5000);
P.buy('cooldown');
ok(Math.abs(P.cooldownMult() - 0.9) < 1e-9, 'cooldown tier 1 → x0.9');
P.buy('cooldown'); P.buy('cooldown');
ok(Math.abs(P.cooldownMult() - 0.7) < 1e-9, 'cooldown tier 3 → x0.7');
ok(P.isMaxed('cooldown') === true, 'cooldown maxed at 3 tiers');

// ── 4. maxed can't buy further ────────────────────────────────────
ok(P.nextCost('cooldown') === null, 'maxed perk has no next cost');
ok(P.buy('cooldown') === false, 'cannot buy past max');

P.buy('magnet');
ok(P.magnetRadius() === 70, 'magnet tier 1 → radius 70');

P.buy('extrajump');
ok(P.extraJumps() === 1, 'extrajump owned → 1 extra jump');

// ── one-shot premium perks need embers ────────────────────────────
ok(P.canBuy('secondwind') === false || W.getEmbers() < 6, 'secondwind needs embers');
W.earnEmbers(10);
ok(P.buy('secondwind') === true, 'secondwind buys with coins + embers');
ok(P.hasSecondWind() === true, 'secondwind active');

// ── 6. persistence ────────────────────────────────────────────────
const tierBefore = P.getTier('maxhp');
let ctx2 = makeCtx(ls);
load(ctx2, 'wallet.js');
load(ctx2, 'perks.js');
ok(ctx2.window.GamePerks.getTier('maxhp') === tierBefore, 'owned perks persist across reload');
ok(ctx2.window.GamePerks.hasSecondWind() === true, 'one-shot perk persists across reload');

console.log('\n── Results ──');
console.log('Pass: ' + pass);
console.log('Fail: ' + fail);
if (fail > 0) { console.log('\nFailing:'); for (const f of fails) console.log('  • ' + f); process.exit(1); }
