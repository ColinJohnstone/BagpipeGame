# Module Split — Architecture & Migration Plan

`index.html` (formerly `pipes_of_glory_v3_171.html`) is the entrypoint. This doc describes the target file layout and a phased path to get there without breaking the running game.

---

## Why incremental, not all-at-once

The script body has thousands of cross-references. Rough graph (sampled):

| Symbol           | # references | Source of truth         |
|------------------|--------------|-------------------------|
| `player`         | ~1100        | top-level `let`         |
| `enemies`        | ~140         | top-level `let`         |
| `ctx` / `canvas` | ~600         | top-level `const`       |
| `WORLDS`         | ~80          | top-level `const`       |
| `camera`         | ~430         | top-level `const` (re-assigned in `initLevel`) |
| `frameCount`     | ~120         | top-level `let`         |
| `getLevelData()` | ~140         | top-level function      |

A "pure" ESM split would need every call site updated to import the symbol. That's mechanical but it's a *lot* of mechanical. Doing it in one sitting risks introducing subtle bugs the harness can't catch.

The plan below keeps the game **runnable after every commit** by extracting modules incrementally, each one with a clear contract.

---

## Target layout

```
BagpipeGame/
├── index.html                   ← entrypoint; loads modules + game loop
├── src/
│   ├── ARCHITECTURE.md          ← this doc
│   ├── util.js                  ← ✅ DONE — pure helpers (overlap, clamp, hslToRgb, cleanThemeColor)
│   ├── themes.js                ← ✅ DONE — THEMES_PC/BG, NOTE_PALETTES, inferThemeKey, themePaletteFor, applyThemeToLevel
│   ├── state.js                 ← ✅ DONE — cold counters (owned), hot state (proxy accessors), snapshot()/dump() debug helpers
│   ├── stats.js                 ← ✅ DONE — lifetime stats + achievement catalog + toast banner (recordSpend for shop)
│   ├── wallet.js                ← ✅ 1.0 — spendable currency (coins + premium embers), bank-on-clear, spend(); GameWallet
│   ├── perks.js                 ← ✅ 1.0 — purchasable permanent power-ups + effect getters; GamePerks
│   ├── progression.js           ← ✅ 1.0 — completion % tracker + milestone achievements; GameProgress
│   ├── unlocks.js               ← ✅ DONE — cosmetic gates (achievement OR shop-purchase); GameUnlocks
│   ├── audio.js                 ← ✅ DONE — AC, masterGain, sfx(), startMusic / stopMusic / switchMusicForLevel / toggleMute, SONG_PLAYLIST / NEW_SONGS / MUSIC_DIR
│   ├── sprites.js               ← ✅ DONE — PLAYER_CUSTOM + load/save, HAT/FACE/BEARD/SOCK/SHOE variant maps + presets, _shadeHex / _playerColors (memoized) / _bagpipeAccent / _effectiveBpType, drawBagpiper32 + AimUp/AimDown/Crouched
│   ├── physics.js               ← ✅ DONE — resolveVsPlats, getActivePlatforms, updatePlayer
│   ├── enemies.js               ← ✅ DONE — updateEnemies + per-variant AI switches
│   ├── allies.js                ← ✅ DONE — drawMackenzie + updateAllies
│   ├── projectiles.js           ← ✅ DONE — updateProjectiles + updateEnemyProjectiles
│   ├── weather.js               ← ✅ DONE — weatherState + getLevelWeather / getWindForWeather / updateWeatherState / drawWeatherOverlay
│   ├── ui.js                    ← ✅ DONE — UI controller (screen swaps, customizer, world/level grids, generator screen)
│   ├── builder.js               ← ✅ DONE — BLD namespace (tools, level CRUD, JSON, undo/redo, gamepad nav)
│   └── generator.js             ← ✅ DONE — buildRandomLevel + template system + GenRNG + GEN_TEMPLATES
├── levels/
│   ├── world-01-misty-peaks.js   ← ✅ DONE
│   ├── world-02-haunted-glens.js ← ✅ DONE
│   ├── world-03-crystal-caves.js ← ✅ DONE
│   ├── world-04-sky-citadel.js   ← ✅ DONE
│   ├── world-05-legacy.js        ← ✅ DONE
│   ├── world-06-new-levels.js    ← ✅ DONE
│   ├── world-07-clever-five.js   ← ✅ DONE
│   ├── world-08-inferno-echoes.js ← ✅ DONE
│   ├── world-09-frost-gauntlet.js ← ✅ DONE
│   ├── world-10-shadow-crucible.js ← ✅ DONE
│   ├── world-11-neon-spires.js   ← ✅ DONE — proof of concept
│   ├── world-12-coral-depths.js  ← ✅ DONE
│   ├── world-13-brass-works.js   ← ✅ DONE
│   ├── world-14-hollow-shivers.js ← ✅ DONE
│   ├── world-15-starfall-void.js ← ✅ DONE
│   └── tutorial.js               ← ✅ DONE
├── music/                       ← ✅ DONE — all .mp3 tracks live here; resolved via MUSIC_DIR prefix
├── test/
│   ├── test-generator.mjs       ← ✅ DONE — winnability harness
│   ├── test-physics.mjs         ← ✅ DONE — collision/gravity regression (13 assertions)
│   ├── test-wallet.mjs          ← ✅ 1.0 — wallet earn/spend/bank + anti-farm (19 assertions)
│   ├── test-perks.mjs           ← ✅ 1.0 — perk catalog/buy/effects (24 assertions)
│   └── test-progression.mjs     ← ✅ 1.0 — completion math + milestones (13 assertions)
└── docs/
    └── CHEATSHEET.md            ← keybindings, save format, dev notes
```

---

## Why `<script>` tags instead of `type="module"`

The HTML uses inline `onclick="UI.showScreen('s-title')"` attributes in hundreds of places. With `type="module"`, top-level declarations are scoped to the module — they don't appear on `window` — so those inline handlers can't find `UI`.

Two workable approaches:

1. **`type="module"` + explicit window assignment.** Every module ends with `window.X = X`. Works, but uglier and risks shadowing.
2. **Plain `<script>` tags loaded in order, modules attach to `window.GameX`.** Same loading model as today, just split across files. No async / circular-dep concerns.

We're going with option 2 for now. It's the lowest-risk path. Later when we have time to refactor all the inline handlers into `addEventListener` calls we can switch to true ESM.

---

## Phase plan

### ✅ Phase 0 — done
- `src/util.js` (overlap, clamp, lerp, hslToRgb, cleanThemeColor)
- `levels/world-11-neon-spires.js` (data extracted)
- `test/test-generator.mjs` (winnability harness — already caught 2 generator bugs in 100 seeds)
- JSDoc typedefs at top of main script
- Screen-transition fade

### ✅ Phase 1 — pure data extraction (COMPLETE)
All 15 worlds + tutorial now load from `/levels/world-NN-*.js` via plain `<script src>` tags. Each file exposes `window.LEVELS_W{NN}` (or `window.LEVELS_TUTORIAL`) and is a verbatim JSON-safe representation of the level data. Each was diffed against the inline builder before extraction.

For worlds 7-15 + tutorial the inline `buildWorldNLevels()` functions remain in place as fallbacks. For worlds 1-6 the original 416-line minified `const WORLDS = [...]` literal was REPLACED with a compact 18-line declaration that pulls from `window.LEVELS_W{N}` and falls back to an empty array if the file doesn't load. The legacy `LEGACY_WORLDS` const that W5 sourced from is still inline (it isn't a world card itself).

| File                                | Status |
|-------------------------------------|--------|
| `levels/world-01-misty-peaks.js`    | ✅     |
| `levels/world-02-haunted-glens.js`  | ✅     |
| `levels/world-03-crystal-caves.js`  | ✅     |
| `levels/world-04-sky-citadel.js`    | ✅     |
| `levels/world-05-legacy.js`         | ✅     |
| `levels/world-06-new-levels.js`     | ✅     |
| `levels/world-07-clever-five.js`    | ✅     |
| `levels/world-08-inferno-echoes.js` | ✅     |
| `levels/world-09-frost-gauntlet.js` | ✅     |
| `levels/world-10-shadow-crucible.js`| ✅     |
| `levels/world-11-neon-spires.js`    | ✅     |
| `levels/world-12-coral-depths.js`   | ✅     |
| `levels/world-13-brass-works.js`    | ✅     |
| `levels/world-14-hollow-shivers.js` | ✅     |
| `levels/world-15-starfall-void.js`  | ✅     |
| `levels/tutorial.js`                | ✅     |

### ✅ Phase 2 — pure helpers (COMPLETE)
- ✅ `src/themes.js` — `THEMES_PC`, `THEMES_BG`, `NOTE_PALETTES`, `pickNoteColor`, `themePaletteFor`, `sameColorArray`, `inferThemeKey`, `applyThemeToLevel`. Exports to `window.GameThemes` AND mirrors each binding as a bare window global so the existing 100+ call sites continue to work unchanged.
- ✅ `src/audio.js` — `AC` (AudioContext), `masterGain`, `sfx()`, `startMusic` / `stopMusic` / `switchMusicForLevel` / `toggleMute`, `SONG_PLAYLIST` / `NEW_SONGS` / `MUSIC_DIR` + path helpers. Exposes `window.GameAudio` + bare-global mirrors. Engine dependencies (`demoLevelDataOverride`, `getLevelData`, `currentWorld`, `currentLevel`) are looked up lazily via `window.*` at call time. The mute-button click handler stays inline (DOM-dependent).

### ✅ Phase 3 — state.js foundation (COMPLETE)

**Session 1:** `src/state.js` set up with the `GameState` namespace + `Object.defineProperty(window, …)` accessors. The COLD state migrated:
- `GS`, `score`, `coins`, `currentLevel`, `currentWorld`,
- `selectedWorld`, `selectedSubWorld`, `selectedCategory`, `levelTime`, `seaMonsterX`.

These are touched a few times per second; accessor overhead is invisible. Hundreds of bare references in the inline script continue to work — they resolve through the global property descriptor we installed.

**Session 2:** HOT state exposed on `GameState` via **proxy accessors** that read/write `window.X` directly. The variables themselves stay as `var X` declarations in the inline body — that keeps `window.X` as a plain data property, so hot inner loops reading bare `player.X`, `frameCount`, `camera.x` go at full JIT speed. Only opt-in `GameState.X` access pays an accessor hop, and that's only meaningful for non-hot code.

Hot proxies added:
- `player`, `camera`, `frameCount`
- `enemies`, `projectiles`, `enemyProjectiles`
- `collectibles`, `particles`, `powerups`, `portals`
- `goalRect`, `spikeBlockTimer`, `weatherState`, `playerPathTrail`

Plus two debug helpers: `GameState.snapshot()` returns a shallow record of every state value (with derived counts like `enemiesAlive`), and `GameState.dump()` prints it via `console.table`. Handy from the DevTools console while paused.

Why proxies instead of fully migrating slot ownership?
- The doc's vision was to MOVE the variables into state.js and replace `var player` with an accessor. That works, but every bare-name read becomes a getter call (~5-10 ns vs ~1 ns for a data property), and V8 can't inline accessor-property reads into hot loops as effectively as data-property reads. With `player.X` accessed many times per frame in `updatePlayer`, that's a real cost.
- The proxy pattern gives us the namespaced API surface for free, with zero perf cost on bare references.
- The doc's eventual goal (call sites switching to `GameState.player`) is now possible but optional — future code can use the API; existing call sites stay fast.

### ✅ Phase 4 — sprite module (COMPLETE)
- ✅ `src/sprites.js` (~1300 lines extracted from the inline script):
  - `PLAYER_CUSTOM` (mutable object preserved in-place across load/save/reset)
  - `_loadPlayerCustom`, `_savePlayerCustom`, `PLAYER_CUSTOM_LS_KEY`
  - `HAT_VARIANTS` (15), `FACE_VARIANTS` (11), `BEARD_VARIANTS` (9), `SOCK_VARIANTS` (5), `SHOE_VARIANTS` (10)
  - `SKIN_PRESETS`, `JACKET_PRESETS`, `STOCKING_PRESETS`, `SPORRAN_PRESETS`
  - `_shadeHex`, `_playerColors` (memoized — see perf notes), `_bagpipeAccent`, `_effectiveBpType`
  - `drawBagpiper32`, `drawBagpiperAimUp`, `drawBagpiperAimDown`, `drawBagpiperCrouched`
- Exposes both `window.GameSprites` and bare-global mirrors so the customizer UI in the inline script still resolves `PLAYER_CUSTOM`, `HAT_VARIANTS`, etc.
- Reads `window.player._portalNext` for the portal swirl. The inline script's `let player` → `var player` bridge (see Phase 3) makes that live.

### Phase 3 — `state.js` foundation
Create the shared-state module. Everything that's currently a top-level `let`/`const` for game state moves here, exposed via `window.GameState`:

```js
window.GameState = {
  // Read/write via getters/setters so we can audit changes later.
  get player() { return _player; }, set player(v) { _player = v; },
  get camera() { return _camera; }, set camera(v) { _camera = v; },
  get frameCount() { return _frame; }, set frameCount(v) { _frame = v; },
  // …
};
```

After this, every subsequent module reads/writes through `GameState.player` instead of a bare `player` reference. The main script keeps working because the `let player = …` declaration is moved into `state.js`.

Estimated effort: **2 sessions** (lots of touch points, but each is mechanical).

### Phase 4 — sprite module
Move every `drawX` function into `src/sprites.js`:
- `drawBagpiper32`, `drawBagpiperCrouched`, `drawBagpiperAimUp/Down`
- `drawDrum32` (and all variants)
- `drawMackenzie`
- `drawThemedTerrain` (closer to engine, but the rendering is pure)

These are large but mostly *pure* — they take `(ctx, x, y, opts)` and draw. Dependencies on `frameCount` move into the `opts` argument.

Estimated effort: **1 session**.

### ✅ Phase 5 — engine + builder split (COMPLETE)

All eight Phase 5 modules now live in `src/` and the inline HTML script has been reduced from ~22k lines to ~13.6k:

| Module             | Lines | Owns                                                                |
|--------------------|------:|---------------------------------------------------------------------|
| `generator.js`     |   843 | `buildRandomLevel` + `ENCOUNTER_TEMPLATES` + `PACING_CURVES` + seeded RNG. Pure. |
| `weather.js`       |   497 | `weatherState` (window accessor), `getLevelWeather`/`getWindForWeather`/`getGravityMulForWeather`/`updateWeatherState`, `drawWeatherOverlay`. |
| `projectiles.js`   |   283 | `updateProjectiles` + `updateEnemyProjectiles`. Hot path.            |
| `enemies.js`       |   394 | `updateEnemies` + the per-variant AI switch.                         |
| `allies.js`        |   682 | `drawMackenzie` + `updateAllies` (companion/fetch/attack/ride).      |
| `physics.js`       | 1,246 | `resolveVsPlats` + `getActivePlatforms` + `updatePlayer`. Biggest of the engine modules. |
| `ui.js`            | 1,079 | `UI` controller — screen swaps, customizer screen, world/level grids, pause/gameover, generator form. Exposes `window.UI` for inline `onclick="UI.X()"` attributes. |
| `builder.js`       | 1,757 | `BLD` namespace — tools, level-data CRUD, snap/grid toggles, JSON import/export, undo/redo, gamepad nav. |

**Two more `let` → `var` bridges added in this session** (so the engine modules can resolve their references via the global object):
- `var BLD = {…}` — needed by `src/ui.js` for `BLD.toggleSettingsPanel`, etc.
- `var WORLDS = […]` — needed by `src/ui.js` + `src/builder.js` for world grid + test-play.
- (Earlier: `var player, projectiles, enemies, collectibles, particles, camera, goalRect` + `var powerups, enemyProjectiles, frameCount, spikeBlockTimer`.)

### What's still inline (~13.6k lines remain in the HTML body)

- Top-level `<style>` (~3k lines of CSS).
- All `<body>` markup (screens, buttons, builder toolbar, ~3k lines).
- The inline `<script>` body still hosts: the game loop, the render pipeline (drawThemedTerrain + level renderers + HUD), the per-frame `gameLoop()` itself, keyboard/gamepad input handlers, miscellaneous init code (settings UI builder, level-edit persistence, gamepad probe).

These are candidates for future extractions (a `render.js` / `engine.js` / `input.js`) but the architecture doc didn't pre-name those, so I'm leaving them as the inline kernel for now. The 5 phases the doc spec'd are all complete.

---

## ✅ Migration scoreboard — all 5 phases complete

| Phase | Goal | Status |
|------:|------|--------|
| 0 | util.js + level proof-of-concept + test harness + JSDoc + screen fade | ✅ |
| 1 | All 15 worlds + tutorial extracted to `/levels/` | ✅ |
| 2 | themes.js + audio.js | ✅ |
| 3 | state.js (cold + hot via proxy accessors, plus debug snapshot helpers) | ✅ |
| 4 | sprites.js | ✅ |
| 5 | physics.js + enemies.js + allies.js + projectiles.js + weather.js + ui.js + builder.js + generator.js | ✅ |

13 modules in `src/`, totaling ~9000 lines of code lifted out of the inline HTML. The HTML went from ~22000 lines to ~13600 — most of what's left is CSS, markup, and the inline kernel (render pipeline + game loop + DOM glue).

### Useful next-up work (not in the original doc)
- **`src/render.js`** — extract `render()`, `drawThemedTerrain`, HUD drawing. Hot path; would be the natural mate to `physics.js`.
- **`src/engine.js`** — the main `gameLoop()` tick + RAF scheduling. Small but central.
- **`src/input.js`** — keyboard + gamepad handlers (KB, GPP, _bindingAction logic). DOM-heavy.
- **`test/test-physics.mjs`** — physics regression harness similar to `test-generator.mjs`. Would catch collision regressions automatically.
- **Call-site migration** — start opportunistically rewriting bare-global reads (`player.X` → `GameState.player.X`) in non-hot code as files are touched for other reasons. The bare-global mirrors stay in place as a back-compat layer.

---

## Conventions

1. **One module = one `window.GameX` object.** No bare globals.
2. **Module loading order matters** because we're using plain `<script>` tags. The HTML loads `util.js` → `themes.js` → `audio.js` → … → main script. Document the order at the top of `index.html`.
3. **No circular imports.** Each module depends only on modules earlier in the load order.
4. **`/** @typedef */` blocks** at the top of every module that introduces new types.
5. **Each module exports a tiny test surface.** When `state.js` exists, `test/test-state.mjs` should be trivial to write.
6. **Levels are pure data.** No methods, no functions. Numbers + strings + arrays + plain objects only. (`window.LEVELS_W11` is already shaped this way.)

---

## What doesn't move

- The HTML markup (it's already structured)
- Inline `<style>` (could move to `style.css` but that's a separate task)
- Inline `onclick` handlers (until we switch to `addEventListener`)

---

## Open questions

- **JSON vs JS for level files?** JSON is cleaner but requires `fetch()`, which doesn't work from `file://`. Currently using `.js` files that assign to `window.LEVELS_W{NN}`. Could revisit if/when the game gets a build step or is served from a real HTTP origin.
- **Should we keep the `buildWorld11Levels()` fallback after every world is migrated?** Probably yes for the first few months, then delete. The cost is small.
- **TypeScript?** Not yet. JSDoc `@typedef` gets us 80% of the type-checking value without a build step. Revisit once the file split is done.

---

## 1.0 — "The Highland Market" economy update

Layered on top of the module split; all new modules follow the same
`<script src>` + `window.GameX` convention and load after `stats.js`.

**Currencies (`wallet.js` → `GameWallet`).** Two spendable pools persisted
to `pogl_wallet_v1`, kept SEPARATE from the monotonic `GameStats.coinsCollected`
achievement counter:
- **Coins** — soft currency, banked in full on every level clear.
- **Embers** — premium currency from the 3-hidden-per-level spirit embers;
  only NEW embers ever pay out (per-level high-water mark in `bankedEmbers`),
  so a level's lifetime ember income is capped at its ember count.

**Perks (`perks.js` → `GamePerks`).** Data-driven catalog of permanent,
purchasable power-ups (pure upgrades — balanced by price). Owned tiers in
`pogl_perks_v1`. Effects are applied once at player-init each level
(`maxHpBonus / cooldownMult / magnetRadius / extraJumps / spawnShield /
hasSecondWind`) plus two in-loop hooks (coin magnet in `updateCollectibles`,
Second Wind revive in the death path).

**Shop (`s-shop` screen in `ui.js`).** Glass-UI menu reached from the title
🛒 chip; PERKS + COSMETICS tabs. Cosmetics can be bought outright via
`GameUnlocks.purchase()` (persisted to `pogl_unlock_buy_v1`), so `isUnlocked`
returns true for achievement-earned OR shop-bought items.

**Progression (`progression.js` → `GameProgress`).** `getCompletion()` rolls
levels/stars/worlds/achievements/perks into a Journey screen; `checkMilestones()`
fires the completionist / star-master / perk-collector achievements.

**Premium worlds.** `WORLD_PRICE` (index.html) gates a few showcase worlds
behind coins/embers as an EARLY-ACCESS shortcut — the normal progression chain
still unlocks them free, so no one is ever walled out. Purchases in
`pogl_world_buy_v1`.

**Game-feel.** `screenShake` / `hitStop` / combo chain (`onEnemyKilled`) +
a level-start fade overlay (`playLevelTransition`). All respect
`prefers-reduced-motion`.

**New units.** v=15 Cutpurse (coin-thief enemy) + v=96 Coin Hoarder (economy
boss) — sprites in `sprites.js`, AI in `enemies.js`, builder tools + previews
wired through `builder.js`. The mega-boss completion + HUD-bar checks were
generalized to include v=96.

All new save keys load through `try/catch` with sane defaults, so older saves
upgrade transparently (no migration step).

---

## 2.0 — "The Maker's Workshop" (builder overhaul)

A Super Mario Maker 2-style rebuild of the editor, layered onto `builder.js`
+ the builder DOM/CSS in `index.html` — UI/UX + new systems, not a rewrite of
the placement internals.

**Layout.** `SIDEBAR` is now 0 (full-width playfield); the category rail moved
to a bottom tab bar and the part panels to a bottom dock (pure CSS reposition,
all `bl-tool` ids/handlers unchanged). `handleAutoPanels` reveals/hides the dock
by cursor proximity to the bottom edge. New: part counter (`partCount`),
recent-parts strip (`pushRecentTool`).

**Editing.** Build⇄Play preserves scroll/zoom (openBuilder never resets them) +
a floating `#bld-test-edit` button. Tile-paint (`paintStart/Move/End`,
`_pushTile`) routes terrain drags through grid-cell painting. Multigrab reuses
box-select → `copySelected`/`pasteSelected(targetWx,targetWy)` with a cursor
ghost (`drawStampGhost`) and `flipSelectionH`.

**Colour.** `PALETTE_TEMPLATES` (10 built-ins) + `quickFill` (ramp from one
colour) + custom palettes in `pogl_palettes_v1` (`saveCurrentPalette` /
`applyCustomPalette` / `deleteCustomPalette`). Mirrored in the platform-editor
modal (`pe*` variants). Per-shade pickers gated behind an ADV toggle.

**Course rules.** `ld.autoScroll` (forced camera in `updateCamera`, re-armed on
respawn), `ld.timeLimit` (countdown + `#time-banner`), `ld.clearCondition` /
`clearCount` (`clearConditionUnmet` gates the goal in `checkGoal`).

**Beat-to-save.** `ld._verified` is set when a builder test (`currentWorld===99`)
is cleared, reset on any `saveState` (edit), surfaced as a toolbar pill, and
required by `exportJSON`.

All `ld.*` course fields ride the level data, so they persist through
save/export/JSON and carry into test-play.
