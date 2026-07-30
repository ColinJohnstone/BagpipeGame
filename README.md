<div align="center">
  <img src="Ascend%20The%20Highlands.png" width="400" alt="Ascend The Highlands Logo">
</div>

# 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Ascend the Highlands

A pixel-art 2D platformer where a Scottish piper jumps, dashes, parries and shoots musical notes through 19 themed worlds. Pure HTML / CSS / vanilla JS — no install, no build step, no dependencies. Open it in a browser and play.

The game ships with **39 worlds** (~183 hand-built levels) across multiple galaxies — including two large new galaxies, **🌊 The Sunken Road** (coast → the deep) and **☄️ The Ascent Beyond** (surface → cosmos), each 10 themed worlds of 5 levels with its own signature mechanic — an 18-level **Tutorial Dojo**, a deep **character customizer** with themed costumes, a full in-browser **Level Builder**, a Minecraft-style **Level Generator** that procedurally rolls fresh levels from a seed, an achievement + lifetime-stats system, and an offline-capable service worker. Level select is a **3D walk-around overworld** — pick a galaxy, then stroll a themed map between level islands.

**1.0 — "The Highland Market":** coins and spirit-embers are now a real **economy**. They bank to a persistent **wallet** on every clear and you spend them in a **shop** on permanent **perks** (extra HP, faster cooldowns, a coin magnet, a triple jump, a spawn shield, a once-per-level revive) and on **early access to premium worlds**. A **Journey** screen tracks overall completion. Combat got **juicier** (screen shake, hit-stop, a combo chain that pays out bonus coins), and there's a new economy-themed enemy (the coin-stealing **Cutpurse**) and boss (the **Coin Hoarder**).

---

## ▶ Run it

The game now uses a lightweight **[Vite](https://vitejs.dev/)** build step — it's still a pure static browser game (no server-side code), Vite just gives us a dev server with hot-reload, npm dependencies (like **Three.js** for 3D mode), and a minified production build.

**First time — install dependencies:**

```bash
cd path/to/BagpipeGame
npm install
```

**Develop (hot-reload dev server):**

```bash
npm run dev
# then visit the URL it prints (default http://localhost:8765/)
```

**Build a production bundle (static files in `dist/`):**

```bash
npm run build      # outputs dist/  — copy that folder anywhere static
npm run preview    # serve the built dist/ locally to sanity-check it
```

**GitHub Pages:** deploy the contents of `dist/` (e.g. via the `gh-pages` branch or an Actions workflow). The build uses a relative base (`base: './'`) so it works from a project subpath (`username.github.io/<repo>/`). The local edit mode auto-disables on `*.github.io` so the hosted build is read-only.

> **No-build fallback:** the classic `<script src>` modules still work without Vite. Any static file server over the project root (e.g. `python3 -m http.server 8765`) will serve the game directly from `index.html` — handy for a quick look without `npm install`. `file://` may work too but browsers increasingly block local module loads, so a server is recommended.

---

## 🎮 Controls

### ⌨️ Keyboard

| Key | Action |
|---|---|
| `←` / `→` | Move |
| `↓` | Crouch / slide under low platforms (in-air: ground-pound meteor) |
| `Z` or `↑` | Jump (tap again mid-air for double jump) |
| `Q` | Shoot notes (hold for auto-fire) |
| `W` | Skirl Blast — close-range shockwave |
| `E` | Highland Charge — forward dash |
| `R` | Drone Wave — spread shot |
| `D` | Parry — reflect incoming shots |
| `F` | Interact with adjacent creature — pet a cow/sheep/chicken, or mount Mackenzie |
| `1`–`5` | Switch bagpipe type |
| `A` / `S` | **Portal bagpipe only** — arm portal A or B (next `Q` fires that color) |
| Hold `Space` | Aim up while shooting |
| Double-tap + hold `Space` | Aim down while shooting |
| `M` | Mute music |
| `Esc` / `P` | Pause (or in menus: navigate back; on castle-complete: main menu) |

**💠 Highland Prism — 3D platformer mode** (grab the prism, or play **World 6 · PRISM SUMMIT**, or press `G` to toggle in any level): the level folds into a true third-person 3D platformer with its own control scheme, separate from 2D —

| Key | 3D action |
|---|---|
| `W` `A` `S` `D` | Move (relative to the camera) |
| `Space` | Jump |
| `←` `→` | Rotate camera · `↑` `↓` tilt camera |
| Mouse drag | Swing the camera 360° · wheel to zoom |
| `Q` / `E` | Spin camera (alt) |

Stomp enemies from above; reach the goal to fold back to 2D.

**3D worldmap** — `WASD` / arrows walk; `←` `→` cycle galaxies/worlds; `Enter` selects / plays the nearby level; `Esc` backs out (world → galaxy → title). `F` opens the focused level in the builder (local edit mode only).

**Level builder** — `Tab` / `Shift+Tab` cycles through stacked objects under the cursor; `Z` undo; `Cmd/Ctrl + C/V` copy-paste; `Cmd/Ctrl + drag` box-select; `F` / `F2` edit the focused level. See the Level Builder section for the full set.

### 🕹️ Controller (DualSense / Standard)

✕ Cross — Jump · ○ Circle / R2 — Shoot · □ Square — Skirl · △ Triangle — Highland Charge · R1 — Drone · L1 — Parry · D-pad / L-stick — Move · D-pad ↑ / ↓ — Cycle bagpipe type · ⋯ Options — Pause

In the **level builder** specifically: D-pad ↑ / ↓ zoom, ✕ opens the controller-navigable settings panel, △ test-plays, □ exports JSON, Options exits.

### 📱 Mobile (touch)

- Add to Home Screen on iOS for a fullscreen landscape PWA with a custom app icon (generated in-canvas — no external image needed)
- On-screen touch buttons cover movement, jump, shoot, parry, skirl, charge, drone, and bagpipe cycling
- Tapping the screen while a controller is connected switches input back to touch
- Portrait orientation shows a **🔄 ROTATE YOUR DEVICE** overlay

---

## 🎵 Bagpipe types

Five bagpipe types, switched on the fly with `1`–`5` (or D-pad ↑ / ↓ on a controller):

1. **Default** — straight notes (color randomized to match the level theme, fresh hue every shot)
2. **Bounce** — notes ricochet off platforms
3. **Piercing** — shots punch through every foe in a line
4. **Charge** — hold `Q` to charge, release for a heavy shot that breaks thick walls
5. **Portal** — A/S arm portal A (purple) or B (pink); `Q` fires the armed color. The swirling orb on the bagpipe shows what's currently armed.

---

## 🗺️ Worlds & the 3D Worldmap

**LEVEL SELECT** opens a 3D-style navigator instead of a flat grid:

1. **Galaxy view** — top-tier categories (OG World, New Levels, Expansion, Tutorial, Generated) render as **spiral galaxies** orbiting a central sun. `←` `→` rotate the orbit; the focused galaxy snaps front-and-center. `Enter` drills into a galaxy, where its worlds appear as **3D planets**.
2. **World view** — a free-walk themed **overworld**. Your bagpiper walks around a biome-textured landscape (grass / lava / ice / sand / coral / cosmic / etc.) scattered with environmental decorations (trees, rocks, crystals, lanterns…). Each level is a floating **3D diorama island**; a winding stepping-stone path links them. Walk up to an island and an info card pops up with **stars, best score, coins, embers, best time, deaths, clears**. `Enter` plays it. A mini-map sits top-right.

`Esc` backs out one tier at a time (world → galaxy → title). A **🗂 CLASSIC MENU** toggle in Settings falls back to the original button-grid menus. The `▶ PLAY` button on the title resumes your last-played level; the 🗺 icon opens the worldmap.

### 🏴󠁧󠁢󠁳󠁣󠁴󠁿 OG World
Five themed worlds, six levels each — the original campaign:

1. ⛰ Misty Peaks
2. 👻 Haunted Glens
3. 💎 Crystal Caves
4. 🏰 Sky Citadel
5. 📜 Legacy

### 🌟 New Levels
Bonus worlds drilled-down from the **NEW LEVELS** card:

- **World 6 · Highland Trials** — variety pack of new levels
- **World 7 · The Clever Five** — five mechanic-focused designs (channeling Mario / Celeste / VVVVVV-style level design):
  - 🌊 **Echoes** — soundwave-only climb (footing exists only when you shoot it)
  - 🧊 **Glacial Drift** — angled bounce-pads at the end of ice slides
  - 🔁 **Parallel Path** — switch-flip between 🔴 / 🔵 worlds in mid-air
  - 💥 **Collapsing Causeway** — race forward as crumble platforms fall
  - 🟢 **Bounce Barrage** — vertical tower of angled bounce pads
- **🌋 World 8 · Inferno Echoes** — combat / ability gauntlets:
  - 🔥 **Magma Stream** — ride moving platforms over a 2 400-px spike pit (ground is lava)
  - 🧱 **Burning Wall** — five layered breakshot walls; hold Q to chew through
  - 💨 **Charge Chains** — four 320-px voids in a row, each cleared only by Highland Charge
  - 🎶 **Drone Fortress** — three walled chambers of aerial enemies; Drone Wave clears them
  - 🪜 **Inferno Ladder** — vertical 1 400-px finale combining breakshot + charge + drone + moving plats
- **❄ World 9 · Frost Gauntlet** — weather + aim trials:
  - 🌙 **Low Gravity** — moon weather; platforms spaced for the long hangtime
  - 🌪 **Storm Passage** — tornado wind shoves you laterally between tiny landings
  - 🌀 **Glacier Portal** — bagpipe-5 portal teleports across tall walls
  - 🌊 **Soundwave Lake** — ice floor over a long void crossed by 8 shoot-to-materialise tiles
  - 🌈 **Aurora Summit** — vertical 1 300-px climb mixing moon, ice, soundwave, bounce, moving
- **🌑 World 10 · Shadow Crucible** — collectibles + enemy mastery:
  - 🤫 **Silent Steps** — silencer enemies disable abilities; pure platforming + parry
  - 👤 **Twin's Mirror** — shadow twins copy your moves; position-then-strike puzzles
  - 🔥 **Ember Hunt** — three spirit embers in tricky alcoves
  - 🍫 **Mars Bar Heist** — all five 🍫 pieces required to unseal the castle
  - ⚔ **The Final Crucible** — long gauntlet with every enemy type, trophy mid-way

### 🌌 Expansion
Eight showcase worlds (11–18) built around the newer themes, weather, platform mechanics, and enemy variants. Each ends with a boss:

- **🌃 World 11 · Neon Spires** — cyber theme, lightning weather
- **🐚 World 12 · Coral Depths** — coral-reef theme, tide weather
- **⚙ World 13 · Brass Works** — steampunk theme
- **🕯 World 14 · Hollow Shivers** — haunted theme
- **✦ World 15 · Starfall Void** — cosmic theme, meteor weather
- **🏜 World 16 · Dune Embers** — desert theme, sandstorm — showcases the **v=12 Turret** enemy
- **🌲 World 17 · Veiled Thicket** — forest theme, fog — showcases the **v=13 Teleporter** enemy
- **🌸 World 18 · Petal Shrine** — cherry theme, day/night cycle — showcases the **v=14 Berserker** enemy
- **☁ World 19 · Celestial Ascent** — heaven / sky theme; five **vertical climb** levels built around upward movement — bounce pads, air-draft windtunnels, grapple-hook chains and magnetic anchors carry you to a goal at the very top

### 🎲 Generated
Appears once you've used the Level Generator at least once — a persistent collection of your most recent procedural rolls (capped at 30, dedupes by seed). See the **Level Generator** section below.

### 📐 Tutorial Dojo
18 short blueprint-themed lessons, always unlocked:

`MOVE → DOUBLE JUMP → AIM UP → AIM DOWN → SHOOT → BAGPIPE 2 (BOUNCE) → BAGPIPE 3 (PIERCING) → BAGPIPE 4 (CHARGE) → BAGPIPE 5 (PORTAL) → SKIRL → HIGHLAND CHARGE → DRONE WAVE → PARRY → ITEMS → PLATFORMS → VERTICAL CLIMB → TRAPS → ROSTER`

Each lesson **forces you to use the named mechanic** to clear it. Big readable signs, blueprint grid background, and yellow drafting-style arrows / circles / boxes highlight what to do next.

---

## 🎲 Level Generator

A new menu option that procedurally rolls a fresh level — Minecraft-style — from your settings:

- **Theme** (any of the 9 themes including Blueprint)
- **Weather** (clear, rain, storm, snow, tornado, moon gravity, earthquake, ashfall, fog)
- **Music** (any track or 🔀 random)
- **Length** — short / medium / long
- **Difficulty** — easy / medium / hard (affects gap chance, platform density, enemy count, spike spawns)
- **Terrain types** — multi-select checkboxes for normal, ice, bounce, one-way, soundwave, crumble, breakshot, moving
- **Seed** — leave blank for a random roll, or paste any string for a reproducible level

A seeded **Mulberry32 PRNG** drives placement so the same seed always produces the same level. Three actions:

- 🎲 **RANDOMIZE** — fills every form field with random values (theme, weather, music, length, difficulty, terrain subset). Press it for an instant "feeling lucky" roll, then GENERATE & PLAY.
- ▶ **GENERATE & PLAY** — rolls the level, **saves it to your Generated world**, and drops you straight in.
- ✏ **EDIT IN BUILDER** — also saves the roll to the Generated world, then opens it in the level builder for hand-polishing.

### 🗂 Generated world

Every roll is appended to a persistent **🎲 GENERATED** world that appears as its own card on the World Select screen alongside OG / NEW LEVELS / TUTORIAL. The world is stored in `localStorage` so it survives reloads. Caps at the most recent **30 rolls** (oldest dropped). Re-rolling the same seed updates the existing entry instead of creating a duplicate.

That means your favourite rolls accumulate as a personal level pack you can replay any time.

### 👀 Where to see your seed

After generation, the seed is exposed in four places so you can copy / share interesting rolls:

- **HUD** — the level label switches to `GEN · <seed>` instead of `W?-?`
- **Float-text** — a `SEED: <seed>` flash near the top of the screen when the level starts
- **Pause screen** — a selectable 🎲 SEED line appears under "PAUSED" (just click and drag to highlight, then `Ctrl/Cmd + C`)
- **Level-complete screen** — the seed is printed alongside score / coins / time, ready to copy

You can also open the **📐 OPEN IN EDITOR** button on the pause screen of any generated level to drop the in-progress roll straight into the level builder.

Got a seed you want to replay? Open the Level Generator, paste it into the **SEED** field, hit ▶ GENERATE & PLAY.

---

## 🎨 Character Customizer

The **CUSTOMIZE BAGPIPER** screen (person icon on the title) gives a live-preview sprite editor with tabs for every slot:

- **🎭 Costume** — one-click themed presets that set every slot at once. ~22 outfits grouped into **Holiday** (Santa, Pumpkin King, Harvest, Easter, New Year, Valentine, St Patrick), **Games** (Plumber, Hero, Wizard, Pirate, Viking, Cowboy, Cyber, Jester, Monk), and **Worlds** (Cherry, Frost, Inferno, Desert, Ranger, Cosmic, Haunted, Coral).
- **Hat / Beard / Face / Skin / Jacket / Socks / Sporran / Shoes / Cape / Bagpipe** — individual slot pickers with colour swatches and free hex pickers. Face options include glasses, sunglasses, eyepatch, monocle, cyber-visor, war-paint (blue / red / green / white) and more.

Cosmetics are gated by an **unlocks** system tied to achievements — Settings has a 🎁 **UNLOCK ALL COSMETICS** master toggle. The customizer redraws every frame so picks show instantly; SAVE persists to `localStorage`.

## 🏆 Achievements & Stats

A lifetime-stats + achievement layer records coins, kills, levels cleared, perfect (no-death) clears, distance walked, jumps, shots, deaths, and play time. Earning an achievement pops a toast banner. The 🏆 chip on the title opens the **Stats & Achievements** screen, with a **🧭 JOURNEY** button to a completion screen (levels / stars / worlds / achievements / perks). Per-level bests (score / coins / embers / time / deaths / clears) are tracked separately and surfaced on the 3D worldmap's info cards.

## 🛒 Highland Market — the economy (1.0)

Coins and 🔥 spirit-embers are spendable currency, banked to a persistent **wallet** on every level clear (coins pay out every run; each hidden ember pays out once). The 🛒 chip on the title opens the **shop**:

- **⚡ Perks** — permanent power-ups: **❤️ Stout Heart** (+max HP), **⚡ Swift Pipes** (faster ability cooldowns), **🧲 Coin Magnet** (sweep up nearby coins), **🪶 Highland Lung** (triple jump), **🌿 Thistle Ward** (spawn each level shielded), **🔥 Second Wind** (revive once per level). They apply automatically at the start of every level.
- **🎨 Cosmetics** — buy an achievement-locked outfit piece outright with coins instead of grinding its achievement; it then lights up in the Customizer.
- **Premium worlds** — a few showcase worlds (✦ Starfall Void, 🌲 Veiled Thicket, ☁ Celestial Ascent) can be unlocked **early** with coins/embers. This is a shortcut, not a wall — the normal progression chain still unlocks them for free, so no one is ever locked out.

Earn faster by chaining kills: a **combo** of back-to-back kills pays **bonus coins** (and ramps the screen shake).

## 🎵 Music

Procedural Web Audio drives SFX. Music is MP3 tracks under `music/`, picked per-level by a theme-aware allowlist. Settings has separate **master / music / SFX** volume sliders. A dedicated menu track (*Granite Savepoint*) loops on the title screen and worldmap and **crossfades** into the level track when you start a level (and back out when you return).

## ⚙ Mechanics overview

**Platform types:** normal, ice (slippery), bounce pads (rotatable), one-way (jump-through), soundwave (solid when shot from **any direction** — aim down works), crumble (collapses after touch), breakshot (5 hits to destroy), moving, switch A / switch B (toggle solidity).

**Hazards:** static spikes, popping spikes (alternating phases A / B), void floor, falling debris during earthquake weather.

**Enemies:** drum patrol, jumper, shooter, charger, shielded, rhythm, splitting drum, silencer (disables your abilities while close), shadow twin (mirrors your path), plus newer variants — **🔫 turret** (stationary 3-shot cannon with a telegraphed windup), **👻 teleporter** (vanishes and reappears right next to you), **⚔ berserker** (calm until 50% HP, then frenzies — doubles speed and lunges), and the **🥷 Cutpurse** (darts in, **snatches your coins** on contact, then flees — kill it to make it drop the loot). Any enemy can be flagged **elite** for double HP + a gold aura.

**Bosses:** five boss classes —
- **🦾 Mini-boss** — world-themed jumping shooter.
- **👑 Mega-boss** — 3-phase HP, telegraphed slam / projectile-fan / sweep attacks.
- **🔮 Summoner** — a *floating* conjurer; summons minions (including shooters), fires orb spreads, blinks above you and rains orbs, and unleashes sustained orb barrages in its final phase.
- **🐃 Juggernaut** — an armored bruiser; telegraphed charges, ground pounds that throw arcing debris + a shockwave, sky-rubble bombardment, and a phase-3 charge→pound combo.
- **💰 Coin Hoarder** — the economy boss; lobs arcing coin volleys, **summons Cutpurse minions** mid-fight, and ground-slams in its final phase. Killing it bursts a **jackpot** of coins.

Bosses are **immune to stun** — you can damage them but never interrupt-lock their telegraphs. Regular enemies have a stun cooldown so rapid fire can't perma-lock them either. A big boss HP bar with phase tints appears across the top of the screen.

**Items & pickups:** ❓ blocks (random powerup), 💰 coin blocks, 🏆 trophy (star power), 🔥 spirit embers (3 hidden per level), 🍫 Mars bar pieces (5 per level — collect all to unlock the castle gate). Powerup items: ⚡ rapid fire, 🎵 big notes, 💣 bomb notes, 🥁 war drum, ✨ invincibility, ⚔ charge refresh, 🪶 extra jump, 🌿 thistle shield, ❤️ heal heart.

**Weather:** rain, ⚡ thunderstorm (with screen-flash lightning), ❄ snow, 🌪 tornado, 🌙 moon (low gravity), 🌍 **earthquake** (chunks fall out of the level over time, biased to behind the player so you must keep moving forward), ashfall, heavy fog.

---

## 🔧 Level Builder — "The Maker's Workshop" (2.0)

A built-in editor accessible from the title screen, redesigned in a **Super Mario Maker 2** style. Place every element the game ships with — terrain, hazards, items, enemies, signs, and highlight markers (arrows, circles, boxes) for tutorial-style annotations.

### 2.0 layout & flow
- **Bottom part palette** — category tabs along the bottom; the part grid rises automatically when your cursor nears the bottom edge and tucks away when you move up to build, so it never covers the level. A **part counter** (`▦ N PARTS`) and a **recent-parts** strip (your last 6 picks, one tap away) sit in the chrome.
- **Build⇄Play toggle** — ▶ test-plays from where you are and snaps back to the exact scroll/zoom; a floating **✎ EDIT** button returns you in one tap.
- **🖌 Paint** — drag to lay continuous runs of grid terrain tiles (not just one sized block).
- **⛶ Multigrab** — drag a box to grab a region; a translucent **ghost** follows the cursor showing exactly what will be pasted, and a tap stamps a copy. **⇆ Flip** mirrors the selection.
- **Simple colour + palettes** — a one-click **FILL** builds a full shade ramp from a single colour, plus **10 built-in palette templates** and your own **custom palettes** (save the current colours, click to reuse across any course, right-click to delete). The 5 per-shade pickers live behind a **⚙ ADV** toggle.
- **Course rules** — **autoscroll** (off/slow/med/fast — keep up or fall off the left edge), a **time limit** (prominent top-centre countdown), instant theme/style swap, and day/night.
- **Clear conditions + beat-to-save** — set a win rule (reach goal / defeat all foes / collect N coins / collect all embers); the goal won't open until it's met. A **⚠ UNVERIFIED → ✓ VERIFIED** pill gates **export** until you've cleared the course once in a test play (SMM2's upload check). Editing re-locks it.

### Tool categories

- **PLAT** — terrain types (drag to size for solid blocks, click for switches)
- **HAZ** — spikes, checkpoints, goal castle
- **FLOW** — checkpoint + goal progress markers
- **ANML** — ambient wildlife (cows, sheep, chickens)
- **ITEM** — coins, ?-blocks, $-blocks, trophy, embers, Mars bars, all powerup items
- **FOE** — every enemy variant (patrol, jumper, shooter, charger, shielded, rhythm, splitter, silencer, twin, **turret, teleporter, berserker, cutpurse**, elite) **plus a BOSSES row** — mini-boss, mega-boss, summoner, juggernaut, **coin hoarder**
- **INFO** — 📜 sign, 🔠 free text, ⬆⬇⬅➡ arrows, ◯ circle, ▭ box (drag to size)

### Builder essentials

- Drag terrain tools to size; place point items with a click
- 🤏 **Pinch-zoom** on touch, `Ctrl + Wheel` or **+** / **−** buttons on desktop, D-pad ↑ / ↓ on controller
- 👆 **Long-press** on touch deletes; right-click on desktop deletes; L2 on controller deletes
- 🎯 **Precision picker** — clicks pick the closest / smallest object under the cursor (no more grabbing a bulky neighbour). `Tab` / `Shift+Tab` cycle through stacked objects; a hover outline previews exactly what will be selected. Tiny terrain gets an enlarged hit target so even 1×1 blocks are clickable.
- 🔲 Multi-select with `Cmd / Ctrl + drag`; copy-paste with `Cmd / Ctrl + C` / `V`
- ↔ **Move vs. edit** — a plain click-then-click-again on a platform opens its editor modal; a click-and-*drag* is treated purely as a move and won't trigger the editor
- 📝 **Sign editor** — clicking a placed sign once selects it, clicking again opens a prompt to edit title and body (auto-resizes to fit)
- 🎯 **Highlight markers** — arrows, circles, and dashed boxes with optional labels for tutorial annotations
- 💾 Export and import levels as JSON
- ▶ Test-play any in-progress level with the **TEST** button

A full controller-navigable settings panel (theme, weather, music, level dimensions, palette colors) is reachable with ✕ Cross while the builder is focused.

---

## 🛠 Local Edit Mode

When the game is opened locally (`file://`, `localhost`, `127.x`), Settings shows a **🛠 LOCAL EDIT MODE** toggle. Enabling it adds an **✎ EDIT** button under each level card on the level-select screen — clicking it loads that level into the builder pre-populated, ready to modify.

Two save options:

1. **💾 SAVE** — writes the modified level to `localStorage` as a runtime override. Reloads transparently apply your edit.
2. **📝 HTML** — uses the **File System Access API** (Chromium browsers) to write all saved edits straight back to the source HTML file. The patcher inserts a tagged block of JSON near the top of the script that the runtime reads at startup, so changes survive across reloads even after `localStorage` is cleared.

The toggle is permanently disabled when the game is hosted on `*.github.io` so the public build is never editable.

---

## 🎨 UI design — SNES × iOS-26 liquid glass

The chrome (menus, HUD strip, builder panels) uses a *liquid-glass* design language layered over the pixel-art game world:

- **Press Start 2P** pixel font for all UI text — kept crisp through every blur.
- A CSS design-token set in `:root` (`--glass-bg`, `--glass-border`, `--glass-blur`, etc.) drives every translucent surface. Change one variable and it propagates across the title screen, world / level / generator menus, settings, how-to-play, pause, level-complete, the HUD bottom strip, and every builder panel.
- **Pause** and **level-complete** screens are *transparent glass over a live canvas* — pause shows the frozen moment behind heavy `backdrop-filter` blur; level-complete shows a live demo of the level you just finished.
- **Title-menu icons** (🗺 Level Select / 🎲 Generator / 🔧 Builder / 🧑 Customizer) are large glyph chips under the **▶ PLAY** button; hover reveals a glass tooltip. Settings, How-to-Play, and 🏆 Achievements live as chips top-left.
- The **3D worldmap** uses spiral-galaxy and floating-planet renderers, biome-themed overworld terrain, and pixel-art level dioramas — see the Worlds section.
- A growing set of in-game expressions: the player and every enemy variant change face for damage, alert, focused, dying, and idle blinks — driven by gameplay state rather than separate sprite frames.

---

## 🧠 Technical notes

- 🧩 Pure HTML / CSS / vanilla JS. `index.html` is the entry point; runtime code is split across 19 modules in `src/` and per-world data files in `levels/`. All loaded via plain `<script src="…">` tags — no bundler, no transpiler.
- 🚫 No build step, no package manager, no `node_modules`
- 📴 **Offline-capable** — a service worker (`sw.js`) pre-caches the game shell (HTML, all `src/` + `levels/` modules, assets) with a stale-while-revalidate strategy; MP3s cache lazily as they play
- 🎵 Procedural Web Audio for SFX; MP3 tracks bundled under `music/`; theme-aware per-level music picks + a crossfading menu loop
- 🖼 Canvas rendering at 960 × 540, scaled to fit the viewport with safe-area-inset awareness for iPhone notches
- ⏱ **Fixed-step 60 Hz simulation** with an accumulator decoupled from rendering. Ticks correctly on 30 Hz throttled tabs (2 ticks per rAF), 60 Hz monitors (1 : 1), and 120 / 144 / 240 Hz monitors (~one tick every 2 rAFs) — game speed stays constant regardless of display refresh.
- 📊 **FPS / TPS meter** (Settings → Show FPS) shows three numbers: rAF rate, logical-tick rate, and avg / peak frame work in ms. Lets you distinguish a throttled browser tab from over-budget frame work at a glance.
- ✏️ **Canvas-based floating text** — combat / score popups render directly on the canvas (no DOM nodes), so a multi-kill or War Drum burst no longer thrashes layout.
- 🎯 Spatial-hash collision grid (`GRID_SIZE = 160`) and per-frame culling cap render work at ~3–5 ms on a typical level.
- 📲 Web app manifest and `apple-touch-icon` are generated **at runtime via canvas** — no external image assets are needed for home-screen install
- 🕹️ Gamepad input via `navigator.getGamepads()`; touch input via pointer events with multi-touch tracking for builder pinch-zoom
- 🎲 Procedural level generator uses Mulberry32 + a string-hashed seed for fully deterministic playback

---

## 🛠 Development

No build pipeline. Open the HTML in your editor, edit, refresh the browser.

### Repo layout

```
.
├── index.html                   ← entrypoint: markup, CSS, render kernel, game loop
├── sw.js                        ← service worker (offline pre-cache)
├── src/                         ← extracted runtime modules (19)
│   ├── ARCHITECTURE.md          ← module split history + scoreboard
│   ├── util.js                  ← overlap / clamp / hslToRgb / cleanThemeColor
│   ├── themes.js                ← THEMES_PC / THEMES_BG / NOTE_PALETTES / inferThemeKey
│   ├── state.js                 ← GameState namespace (cold counters + hot proxies + snapshot/dump)
│   ├── stats.js                 ← lifetime stats + achievement catalog + toast banner
│   ├── wallet.js                ← spendable wallet (coins + premium embers), bank-on-clear
│   ├── perks.js                 ← purchasable permanent perks + effect getters
│   ├── progression.js           ← completion % tracker + milestone achievements
│   ├── unlocks.js               ← cosmetic gating (achievement OR shop purchase)
│   ├── audio.js                 ← AC + sfx() + music engine + menu-music crossfade
│   ├── sprites.js               ← PLAYER_CUSTOM + variant maps + bagpiper poses + enemy/boss sprites
│   ├── weather.js               ← weatherState + updateWeatherState + drawWeatherOverlay
│   ├── generator.js             ← buildRandomLevel + seeded RNG
│   ├── projectiles.js           ← updateProjectiles + updateEnemyProjectiles + applyEnemyStun
│   ├── enemies.js               ← updateEnemies + per-variant AI + boss state machines
│   ├── allies.js                ← drawMackenzie + updateAllies
│   ├── physics.js               ← resolveVsPlats + getActivePlatforms + updatePlayer
│   ├── ui.js                    ← UI namespace (screens, customizer, costumes, generator)
│   ├── builder.js               ← BLD namespace (tools, level CRUD, undo/redo, JSON)
│   └── worldmap.js              ← 3D galaxy + free-walk overworld level select
├── levels/                      ← per-world LevelData (20 files, ~83 levels total)
│   ├── world-01-misty-peaks.js
│   ├── …
│   ├── world-19-celestial-ascent.js
│   └── tutorial.js
├── music/                       ← .mp3 tracks (referenced by audio.js via MUSIC_DIR)
└── test/
    ├── test-generator.mjs       ← winnability regression harness — runs 100 seeds
    ├── test-physics.mjs         ← physics regression harness (7 scenarios / 13 assertions)
    ├── test-wallet.mjs          ← wallet earn/spend/bank + anti-farm (19 assertions)
    ├── test-perks.mjs           ← perk catalog/buy/effects (24 assertions)
    └── test-progression.mjs     ← completion math + milestones (13 assertions)
```

Each `src/*.js` module is a plain `<script>` (not `type="module"`). They attach their exports to both `window.GameX` (namespaced) and bare-name window globals — that pattern lets the inline `<script>` body in the HTML keep referencing `sfx`, `THEMES_BG`, `drawBagpiper32`, `BLD`, `UI` etc. without rewriting hundreds of call sites. See `src/ARCHITECTURE.md` for the full migration history and back-compat conventions.

### Useful console commands

While the game's running, open DevTools and try:

```js
GameState.dump()           // print every counter + a snapshot of hot state
GameState.player           // live player object
GameState.snapshot()       // shallow record (suitable for diffing across frames)
window.LEVELS_W11          // any world's level data, as JSON
buildRandomLevel({ seed: 'abc' })   // roll a level from a fixed seed
```

### Tests

```bash
node test/test-generator.mjs            # 100-seed winnability run
node test/test-generator.mjs --n 500    # bigger run
node test/test-generator.mjs --verbose  # dump a successful sample
node test/test-physics.mjs              # physics regression (7 scenarios)
node test/test-wallet.mjs               # wallet earn/spend/bank economy
node test/test-perks.mjs                # perk catalog / buy / effects
node test/test-progression.mjs          # completion math + milestones
```

The **generator** harness sandboxes `src/util.js → src/themes.js → src/state.js → … → src/builder.js` and then the inline body, then calls `buildRandomLevel({ seed })` repeatedly to check that every spawn → goal route has a continuous chain of platforms within max-jump reach.

The **physics** harness loads the same module sandbox and runs gravity / collision / terminal-velocity invariant checks against `updatePlayer` so platforming regressions surface before they ship.

---

## 📜 License

Personal project — no license declared. Open an issue if you want to use the code or art.
