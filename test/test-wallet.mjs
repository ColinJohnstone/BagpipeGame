// test/test-wallet.mjs
// ──────────────────────────────────────────────────────────────────
// Wallet regression harness for src/wallet.js (the "Highland Market"
// economy module). Loads the module in a minimal sandbox with a mock
// localStorage and asserts:
//   1. Fresh wallet starts empty.
//   2. earnCoins / earnEmbers add and clamp negatives/junk.
//   3. canAfford / spend are atomic (no partial debits).
//   4. bankClear always pays full coins but only NEW embers (anti-farm).
//   5. State persists to localStorage and reloads.
//   6. onChange fires on every mutation.
//
// USAGE: node test/test-wallet.mjs
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
  if (cond) { pass++; }
  else { fail++; fails.push(msg); console.log('  ✗ ' + msg); }
}

// ── Sandbox with a mock localStorage that we can reset between loads ─
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

function loadWallet(ctx) {
  const src = readFileSync(join(ROOT, 'src', 'wallet.js'), 'utf8');
  vm.runInContext(src, ctx);
  return ctx.window.GameWallet;
}

// ── 1. Fresh wallet ──────────────────────────────────────────────
const ls = {};
let ctx = makeCtx(ls);
let W = loadWallet(ctx);
ok(W.getCoins() === 0 && W.getEmbers() === 0, 'fresh wallet starts at 0/0');

// ── 6. onChange subscription ─────────────────────────────────────
let events = 0;
W.onChange(() => { events++; });

// ── 2. earns ─────────────────────────────────────────────────────
ok(W.earnCoins(50) === 50 && W.getCoins() === 50, 'earnCoins adds 50');
ok(W.earnCoins(-9) === 0 && W.getCoins() === 50, 'earnCoins ignores negatives');
ok(W.earnCoins('abc') === 0 && W.getCoins() === 50, 'earnCoins ignores junk');
ok(W.earnEmbers(3) === 3 && W.getEmbers() === 3, 'earnEmbers adds 3');

// ── 3. spend atomicity ───────────────────────────────────────────
ok(W.canAfford(50, 3) === true, 'canAfford exact balance');
ok(W.canAfford(51, 0) === false, 'cannot afford over-coins');
ok(W.spend(999, 0) === false && W.getCoins() === 50, 'overspend is a no-op (atomic)');
ok(W.spend(20, 1) === true && W.getCoins() === 30 && W.getEmbers() === 2, 'spend debits both');

// ── 4. bankClear: full coins, only-new embers ────────────────────
let r1 = W.bankClear('1-1', 40, 2);
ok(r1.coins === 40 && r1.embers === 2, 'first clear banks 40 coins + 2 embers');
ok(W.getCoins() === 70 && W.getEmbers() === 4, 'balances after first bank');

let r2 = W.bankClear('1-1', 40, 2);          // replay, same 2 embers
ok(r2.coins === 40 && r2.embers === 0, 'replay banks coins again but 0 new embers');
ok(W.getCoins() === 110 && W.getEmbers() === 4, 'embers did not double-pay on replay');

let r3 = W.bankClear('1-1', 10, 3);          // found the 3rd ember this time
ok(r3.embers === 1, 'finding the 3rd ember banks exactly 1 new ember');
ok(W.getEmbers() === 5, 'ember high-water mark advanced');

let r4 = W.bankClear('1-2', 5, 1);           // different level, independent
ok(r4.embers === 1, 'different level tracks embers independently');

ok(events > 0, 'onChange fired during mutations');

// ── 5. persistence + reload ──────────────────────────────────────
const coinsBefore = W.getCoins(), embersBefore = W.getEmbers();
let ctx2 = makeCtx(ls);                        // same backing store
let W2 = loadWallet(ctx2);
ok(W2.getCoins() === coinsBefore && W2.getEmbers() === embersBefore,
   'wallet reloads coins/embers from localStorage');
let r5 = W2.bankClear('1-1', 1, 2);            // anti-farm survives reload
ok(r5.embers === 0, 'ember high-water mark persists across reload');

// ── Results ──────────────────────────────────────────────────────
console.log('\n── Results ──');
console.log('Pass: ' + pass);
console.log('Fail: ' + fail);
if (fail > 0) { console.log('\nFailing:'); for (const f of fails) console.log('  • ' + f); process.exit(1); }
