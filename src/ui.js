// src/ui.js
// ──────────────────────────────────────────────────────────────────
// UI controller. Owns the `UI` namespace (referenced by hundreds of
// inline `onclick="UI.X(...)"` attributes in the HTML markup) plus
// the customizer screen logic, world / level grid builders, pause /
// game-over handlers, and the generator screen.
//
// Reads/calls many engine helpers via bare-name globals: BLD (now
// `var BLD`), WORLDS (now `var WORLDS`), getLevelData, currentWorld,
// currentLevel, score, coins, levelTime (via state.js accessors),
// PLAYER_CUSTOM + variant/preset maps (via sprites.js).
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  const UI = {
    showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      if (id === 's-levelselect') this.buildLevelGrid();
      if (id === 's-worldselect') this.buildWorldGrid();
      if (id === 's-settings') buildSettingsUI();
      if (id === 's-shop') this.buildShopScreen();
      if (id === 's-journey') this.buildJourneyScreen();
      // Any menu screen means we're no longer test-playing a course.
      { const _te = document.getElementById('bld-test-edit'); if (_te) _te.style.display = 'none'; }
      { const _tb = document.getElementById('time-banner'); if (_tb) _tb.style.display = 'none'; }
      if (typeof window.refreshWalletChip === 'function') window.refreshWalletChip();
      gpMenuFocus = 0; gpClearFocus();
      // Make sure HUD doesn't stay hidden after coming back from
      // the 3D worldmap view (which hides the HUD to give the
      // canvas full real estate).
      const hud = document.getElementById('hud');
      if (hud && (id === 's-title' || id === 's-worldselect' || id === 's-levelselect')) {
        // HUD is only meaningful during play — title-level menus
        // should keep it hidden the way the original CSS did.
        hud.style.display = 'none';
      }
      // ── Menu music gating ─────────────────────────────────────
      // Title and world/level select are the canonical "menu" screens.
      // Starting menu music here covers the path back from a level
      // (gameover → s-title, or complete → s-title). startMenuMusic is
      // idempotent — if it's already running this just re-targets the
      // fade. We deliberately don't start it on s-customize / s-settings
      // because those overlay the title without changing audio state.
      const menuScreens = { 's-title': 1, 's-worldselect': 1, 's-levelselect': 1, 's-generator': 1 };
      if (menuScreens[id] && typeof window.startMenuMusic === 'function') {
        try { window.startMenuMusic(); } catch (e) {}
      }
    },
    // ─── 3D-style worldmap entry point ───────────────────────────
    // Opens the canvas-driven galaxy + world walkaround. Falls back
    // to the classic DOM s-worldselect grid if the user has opted
    // into the "classic menu" toggle in settings (or if the module
    // failed to load).
    openWorldMap() {
      try {
        if (localStorage.getItem('pogl_classic_menu') === '1') {
          this.showScreen('s-worldselect');
          return;
        }
      } catch (e) {}
      if (window.GameWorldMap && typeof window.GameWorldMap.open === 'function') {
        try { window.GameWorldMap.open(); return; }
        catch (e) { console.error('worldmap open failed, falling back:', e); }
      }
      // Module missing / errored — graceful degrade to old grid.
      this.showScreen('s-worldselect');
    },
    // ── Return-to-worldmap-at-current-level ──────────────────────
    // Used by the in-game LEVEL SELECT buttons (pause + complete +
    // gameover). Opens the worldmap straight into the world the
    // player was just playing, with the avatar standing next to the
    // island for the level they came from. Classic-menu users still
    // fall back to the DOM grid.
    returnToWorldMap() {
      const w = currentWorld | 0;
      const l = currentLevel | 0;
      // Stop the level music — the worldmap will fade menu music in.
      try { if (typeof stopMusic === 'function') stopMusic(); } catch (e) {}
      try {
        if (localStorage.getItem('pogl_classic_menu') === '1') {
          this.showScreen('s-worldselect');
          return;
        }
      } catch (e) {}
      if (window.GameWorldMap && typeof window.GameWorldMap.openAtLevel === 'function' && w >= 1 && w !== 99) {
        try { window.GameWorldMap.openAtLevel(w, l); return; }
        catch (e) { console.error('worldmap openAtLevel failed:', e); }
      }
      // Fallback paths: open the galaxy view, then the DOM grid.
      if (window.GameWorldMap && typeof window.GameWorldMap.open === 'function') {
        try { window.GameWorldMap.open(); return; } catch (e) {}
      }
      this.showScreen('s-worldselect');
    },
    // ─── Character customizer ────────────────────────────────────
    // Opens the customizer screen and starts a live-preview animation
    // loop that re-draws the bagpiper sprite each tick using the
    // current PLAYER_CUSTOM state. Pick categories on the right;
    // each variant button mutates PLAYER_CUSTOM in place. SAVE
    // persists, CANCEL restores the snapshot taken on open.
    _custSnapshot: null,
    _custTab: 'hat',
    _custFacingRight: true,
    _custLoopId: null,
    openCustomizer() {
      // Snapshot current state so CANCEL can restore.
      this._custSnapshot = JSON.parse(JSON.stringify(PLAYER_CUSTOM));
      this._custTab = 'hat';
      this._custFacingRight = true;
      this.showScreen('s-customize');
      this._renderCustomizerTabs();
      this._renderCustomizerOptions();
      this._startCustomizerLoop();
    },
    closeCustomizer(commit) {
      this._stopCustomizerLoop();
      if (commit) {
        _savePlayerCustom();
      } else if (this._custSnapshot) {
        // Restore the pre-open state.
        Object.assign(PLAYER_CUSTOM, this._custSnapshot);
      }
      this._custSnapshot = null;
      this.showScreen('s-title');
    },
    resetCustomizer() {
      // Restore defaults.
      Object.assign(PLAYER_CUSTOM, {
        hat: 'tam', face: 'cheerful',
        beard: 'full', beardColor: '#8b3a14',
        skin: '#e8c8a0',
        jacket: '#1a3a1a', jacketAccent: '#0f2a14',
        sporran: '#5a3a18',
        stockings: '#e8e8d8', sockStyle: 'short',
        shoes: 'ghillie',
        cape: 'none', capeColor: '#8b0000',
        bagpipeType: 0, bagpipeAccent: '',
      });
      this._renderCustomizerOptions();
    },
    // ── Themed costume presets ─────────────────────────────────
    // One-click outfits that bulk-set every customization slot.
    // Each entry sets the keys it cares about; anything omitted
    // keeps the user's current value (so swapping outfits doesn't
    // randomize sliders they were happy with). Holiday, level-theme,
    // and "guest character" homages.
    _COSTUMES: [
      // ── HOLIDAY ──────────────────────────────────────────────
      { id: 'santa',       group: 'HOLIDAY', label: '🎅 SANTA',
        hat: 'santa', beard: 'full', beardColor: '#ffffff', face: 'cheerful',
        skin: '#ffd0b0', jacket: '#cc1818', jacketAccent: '#8b0000',
        sporran: '#8b3a14', stockings: '#ffffff', sockStyle: 'tall',
        shoes: 'snow_boot', cape: 'classic', capeColor: '#cc1818' },
      { id: 'pumpkin',     group: 'HOLIDAY', label: '🎃 PUMPKIN KING',
        hat: 'witch', beard: 'goatee', beardColor: '#1a1a1a', face: 'facepaint_green',
        skin: '#e8c8a0', jacket: '#cc6010', jacketAccent: '#8b4010',
        sporran: '#3a1a08', stockings: '#3a1a08', sockStyle: 'tall',
        shoes: 'boot', cape: 'classic', capeColor: '#1a0a08' },
      { id: 'turkey',      group: 'HOLIDAY', label: '🦃 HARVEST',
        hat: 'feathered', beard: 'full', beardColor: '#8b3a14', face: 'cheerful',
        skin: '#e8c8a0', jacket: '#8b3a14', jacketAccent: '#cc8800',
        sporran: '#5a3a18', stockings: '#cc8800', sockStyle: 'argyle',
        shoes: 'cowboy_boot', cape: 'none' },
      { id: 'easter',      group: 'HOLIDAY', label: '🐰 EASTER',
        hat: 'catEars', beard: 'clean', face: 'blush',
        skin: '#ffe0d8', jacket: '#ffc8e0', jacketAccent: '#ff80a0',
        sporran: '#ffffff', stockings: '#ffffff', sockStyle: 'short',
        shoes: 'sneaker', cape: 'classic', capeColor: '#ffc8e0' },
      { id: 'newyear',     group: 'HOLIDAY', label: '🎆 NEW YEAR',
        hat: 'tophat', beard: 'mustache', beardColor: '#1a1a1a', face: 'monocle',
        skin: '#e8c8a0', jacket: '#1a1a1a', jacketAccent: '#ffd700',
        sporran: '#3a3a3a', stockings: '#1a1a1a', sockStyle: 'tall',
        shoes: 'heels', cape: 'royal', capeColor: '#1a1a1a' },
      { id: 'valentine',   group: 'HOLIDAY', label: '💖 VALENTINE',
        hat: 'crown', beard: 'clean', face: 'blush',
        skin: '#ffd0b0', jacket: '#cc1840', jacketAccent: '#ff80a0',
        sporran: '#cc1840', stockings: '#ff80a0', sockStyle: 'argyle',
        shoes: 'heels', cape: 'classic', capeColor: '#cc1840' },
      { id: 'stpatricks',  group: 'HOLIDAY', label: '☘ ST PATRICK',
        hat: 'tam', beard: 'full', beardColor: '#cc4a18', face: 'freckles',
        skin: '#ffe0c8', jacket: '#1a8a3a', jacketAccent: '#cc8800',
        sporran: '#5a3a18', stockings: '#1a8a3a', sockStyle: 'argyle',
        shoes: 'boot', cape: 'classic', capeColor: '#1a8a3a' },

      // ── GUEST CHARACTERS / GAME HOMAGES ─────────────────────
      { id: 'plumber',     group: 'GAMES', label: '🍄 PLUMBER',
        hat: 'flatcap', beard: 'mustache', beardColor: '#3a1a08', face: 'cheerful',
        skin: '#ffd0b0', jacket: '#cc1818', jacketAccent: '#1a3a8a',
        sporran: '#5a3a18', stockings: '#1a3a8a', sockStyle: 'short',
        shoes: 'boot', cape: 'none' },
      { id: 'hero_link',   group: 'GAMES', label: '🗡 HERO',
        hat: 'hood', beard: 'clean', face: 'serious',
        skin: '#ffe0c8', jacket: '#3aaa3a', jacketAccent: '#1a5a1a',
        sporran: '#8b6030', stockings: '#ffffff', sockStyle: 'tall',
        shoes: 'boot', cape: 'none' },
      { id: 'wizard',      group: 'GAMES', label: '🧙 WIZARD',
        hat: 'wizard', beard: 'long', beardColor: '#dddddd', face: 'serious',
        skin: '#e8c8a0', jacket: '#1a1a6a', jacketAccent: '#8866ff',
        sporran: '#3a1a4a', stockings: '#1a1a4a', sockStyle: 'tall',
        shoes: 'boot', cape: 'wings', capeColor: '#1a1a6a' },
      { id: 'pirate',      group: 'GAMES', label: '🏴‍☠ PIRATE',
        hat: 'pirate', beard: 'full', beardColor: '#1a1a1a', face: 'eyepatch',
        skin: '#ddb898', jacket: '#1a1a1a', jacketAccent: '#cc1818',
        sporran: '#5a3a18', stockings: '#ffffff', sockStyle: 'tall',
        shoes: 'cowboy_boot', cape: 'classic', capeColor: '#1a1a1a' },
      { id: 'viking',      group: 'GAMES', label: '⚔ VIKING',
        hat: 'viking', beard: 'braided', beardColor: '#c8581a', face: 'thickbrow',
        skin: '#ddb898', jacket: '#5a3a1a', jacketAccent: '#a07030',
        sporran: '#3a2010', stockings: '#5a3a1a', sockStyle: 'tall',
        shoes: 'armor', cape: 'tartan', capeColor: '#8b3a14' },
      { id: 'cowboy',      group: 'GAMES', label: '🤠 COWBOY',
        hat: 'cowboy', beard: 'handlebar', beardColor: '#8b5a30', face: 'serious',
        skin: '#e8a878', jacket: '#8b6030', jacketAccent: '#a08050',
        sporran: '#5a3a18', stockings: '#5a3a18', sockStyle: 'tall',
        shoes: 'cowboy_boot', cape: 'none' },
      { id: 'cyber',       group: 'GAMES', label: '🤖 CYBER',
        hat: 'headphones', beard: 'soul_patch', beardColor: '#ff40c8', face: 'cyber_visor',
        skin: '#e8c8a0', jacket: '#0a0a3a', jacketAccent: '#ff40c8',
        sporran: '#0a0a18', stockings: '#1a1a4a', sockStyle: 'tall',
        shoes: 'hightop', cape: 'wings', capeColor: '#ff40c8' },
      { id: 'jester',      group: 'GAMES', label: '🃏 JESTER',
        hat: 'jester', beard: 'goatee', beardColor: '#cc4a18', face: 'cheerful',
        skin: '#e8c8a0', jacket: '#a040a0', jacketAccent: '#ffd040',
        sporran: '#ffd040', stockings: '#a040a0', sockStyle: 'argyle',
        shoes: 'kiltedclog', cape: 'classic', capeColor: '#ffd040' },
      { id: 'monk',        group: 'GAMES', label: '🧘 MONK',
        hat: 'hood', beard: 'long', beardColor: '#8b6030', face: 'serious',
        skin: '#d8a070', jacket: '#a06030', jacketAccent: '#6a4020',
        sporran: '#6a4020', stockings: '#a06030', sockStyle: 'short',
        shoes: 'sandal', cape: 'none' },

      // ── LEVEL-THEME COSTUMES ─────────────────────────────────
      { id: 'sakura',      group: 'WORLDS', label: '🌸 CHERRY',
        hat: 'flatcap', beard: 'clean', face: 'blush',
        skin: '#ffe0d8', jacket: '#ff80a0', jacketAccent: '#ffb0d8',
        sporran: '#5a3a18', stockings: '#ffb0d8', sockStyle: 'tall',
        shoes: 'geta', cape: 'short', capeColor: '#ffb0d8' },
      { id: 'frost',       group: 'WORLDS', label: '❄ FROST',
        hat: 'beanie', beard: 'full', beardColor: '#cce0f0', face: 'cheerful',
        skin: '#f0d8c0', jacket: '#3a6acc', jacketAccent: '#88c8ff',
        sporran: '#88c8ff', stockings: '#ffffff', sockStyle: 'tall',
        shoes: 'snow_boot', cape: 'classic', capeColor: '#88c8ff' },
      { id: 'inferno',     group: 'WORLDS', label: '🔥 INFERNO',
        hat: 'viking', beard: 'bushy', beardColor: '#1a1a1a', face: 'facepaint_red',
        skin: '#cc8060', jacket: '#a82820', jacketAccent: '#ff6040',
        sporran: '#3a1010', stockings: '#3a1010', sockStyle: 'tall',
        shoes: 'armor', cape: 'classic', capeColor: '#a82820' },
      { id: 'dune',        group: 'WORLDS', label: '🏜 DESERT',
        hat: 'bandana', beard: 'goatee', beardColor: '#3a1a08', face: 'serious',
        skin: '#d8a878', jacket: '#cc8830', jacketAccent: '#ffd080',
        sporran: '#a06030', stockings: '#a06030', sockStyle: 'short',
        shoes: 'sandal', cape: 'scarf', capeColor: '#ffd080' },
      { id: 'forest',      group: 'WORLDS', label: '🌲 RANGER',
        hat: 'feathered', beard: 'chinstrap', beardColor: '#3a2a08', face: 'serious',
        skin: '#ddb898', jacket: '#2a5a2a', jacketAccent: '#5a8a3a',
        sporran: '#5a3a18', stockings: '#2a5a2a', sockStyle: 'tall',
        shoes: 'boot', cape: 'short', capeColor: '#2a5a2a' },
      { id: 'cosmic',      group: 'WORLDS', label: '🌌 COSMIC',
        hat: 'wizard', beard: 'long', beardColor: '#a080ff', face: 'third_eye',
        skin: '#ddc8e0', jacket: '#3a0a4a', jacketAccent: '#a080ff',
        sporran: '#1a0a3a', stockings: '#a080ff', sockStyle: 'tall',
        shoes: 'boot', cape: 'wings', capeColor: '#a080ff' },
      { id: 'haunted',     group: 'WORLDS', label: '👻 HAUNTED',
        hat: 'tophat', beard: 'vandyke', beardColor: '#1a1a1a', face: 'eyeliner',
        skin: '#d0d0d8', jacket: '#1a1a1a', jacketAccent: '#5a2a4a',
        sporran: '#1a1a1a', stockings: '#1a1a1a', sockStyle: 'tall',
        shoes: 'boot', cape: 'ghost', capeColor: '#ffffff' },
      { id: 'coral',       group: 'WORLDS', label: '🐚 CORAL',
        hat: 'bandana_blue', beard: 'stubble', beardColor: '#3a5a8a', face: 'cheerful',
        skin: '#e8c8a0', jacket: '#3a8aaa', jacketAccent: '#ffa0c0',
        sporran: '#a0c8d8', stockings: '#3a8aaa', sockStyle: 'short',
        shoes: 'barefoot', cape: 'none' },
    ],

    // Tabs: which slot is the user editing right now.
    _renderCustomizerTabs() {
      const tabs = [
        { id: 'costume',   label: '🎭 COSTUME'   },
        { id: 'hat',       label: '🎩 HAT'       },
        { id: 'beard',     label: '🧔 BEARD'     },
        { id: 'face',      label: '😀 FACE'      },
        { id: 'skin',      label: '✋ SKIN'      },
        { id: 'jacket',    label: '🧥 JACKET'    },
        { id: 'stockings', label: '🧦 SOCKS'     },
        { id: 'sporran',   label: '👜 SPORRAN'   },
        { id: 'shoes',     label: '👟 SHOES'     },
        { id: 'cape',      label: '🦸 CAPE'      },
        { id: 'bagpipe',   label: '🎷 BAGPIPE'   },
      ];
      const host = document.getElementById('cust-tabs'); if (!host) return;
      host.innerHTML = '';
      for (const t of tabs) {
        const b = document.createElement('button');
        b.className = 'bld-tb-toggle' + (t.id === this._custTab ? ' on' : '');
        b.textContent = t.label;
        b.style.flex = '1';
        b.style.minWidth = '70px';
        b.style.fontSize = '6.5px';
        b.style.padding = '8px 6px';
        b.onclick = () => {
          this._custTab = t.id;
          this._renderCustomizerTabs();
          this._renderCustomizerOptions();
        };
        host.appendChild(b);
      }
    },
    _renderCustomizerOptions() {
      const host = document.getElementById('cust-options');
      const colorHost = document.getElementById('cust-color-row');
      if (!host) return;
      host.innerHTML = '';
      colorHost.innerHTML = '';
      colorHost.style.display = 'none';

      // Locked-by-cosmetic-unlocks check. Returns { locked: bool, hint: string|null }
      const _checkLock = (slot, key) => {
        if (!window.GameUnlocks) return { locked: false, hint: null };
        return {
          locked: !window.GameUnlocks.isUnlocked(slot, key),
          hint: window.GameUnlocks.lockHint(slot, key),
        };
      };
      // Style-chip button (text label + on/off ring). Pass slot+key to
      // gate behind the unlocks system; locked chips render dimmed,
      // show a 🔒 prefix, and refuse clicks.
      const makeChip = (label, isActive, onClick, slot, key) => {
        const b = document.createElement('button');
        const lock = (slot && key !== undefined) ? _checkLock(slot, String(key)) : { locked: false };
        b.className = 'bld-tb-toggle' + (isActive ? ' on' : '');
        b.textContent = lock.locked ? ('🔒 ' + label) : label;
        b.style.fontSize = '6.5px';
        b.style.padding = '8px 4px';
        b.style.textAlign = 'center';
        b.style.lineHeight = '1.35';
        // The .bld-tb-toggle base class sets white-space:nowrap (good
        // for toolbar pills), but customizer chips sit in a fixed
        // 70-px grid cell — long labels like "PUMPKIN KING" must wrap
        // instead of overflowing into their neighbours. Force wrapping
        // + a flexbox centre so multi-line labels stay tidy + uniform.
        b.style.whiteSpace = 'normal';
        b.style.wordBreak = 'break-word';
        b.style.overflowWrap = 'anywhere';
        b.style.display = 'flex';
        b.style.alignItems = 'center';
        b.style.justifyContent = 'center';
        b.style.minHeight = '40px';
        b.style.boxSizing = 'border-box';
        if (lock.locked) {
          b.style.opacity = '0.45';
          b.style.cursor = 'not-allowed';
          if (lock.hint) b.title = 'LOCKED — ' + lock.hint;
          b.onclick = () => {
            if (window.GameStats && lock.hint) {
              window.GameStats.toast(
                '<div style="font-size:9px;color:#ff8a6e;margin-bottom:4px;">🔒 LOCKED</div>' +
                '<div style="color:#aaa;font-size:6px;">' + lock.hint + '</div>');
            }
          };
        } else {
          b.onclick = onClick;
        }
        return b;
      };
      // Color swatch button (renders the color, glow ring when selected).
      const makeSwatch = (bg, isActive, onClick, accent) => {
        const b = document.createElement('button');
        b.className = 'bld-tb-toggle' + (isActive ? ' on' : '');
        b.style.background = bg;
        if (accent) b.style.borderBottom = '6px solid ' + accent;
        b.style.height = '40px';
        b.style.border = isActive
          ? '2px solid #ffd76a' : '1px solid rgba(255,255,255,0.25)';
        b.style.cursor = 'pointer';
        b.onclick = onClick;
        return b;
      };
      // Free-hex color picker shown in the optional color row strip.
      // `label` is the field-name display, `field` is the PLAYER_CUSTOM
      // key, `placeholder` is the value to show when the field is empty
      // (used by bagpipeAccent which can be "use default").
      const addHexPicker = (label, field, placeholder) => {
        colorHost.style.display = 'flex';
        colorHost.style.alignItems = 'center';
        colorHost.style.gap = '8px';
        colorHost.style.flexWrap = 'wrap';
        const wrap = document.createElement('label');
        wrap.style.display = 'flex';
        wrap.style.alignItems = 'center';
        wrap.style.gap = '6px';
        wrap.style.fontFamily = "'Press Start 2P', monospace";
        wrap.style.fontSize = '6.5px';
        wrap.style.color = '#cfe6ff';
        wrap.textContent = label;
        const input = document.createElement('input');
        input.type = 'color';
        input.value = (PLAYER_CUSTOM[field] && PLAYER_CUSTOM[field][0] === '#')
          ? PLAYER_CUSTOM[field] : (placeholder || '#888888');
        input.style.width = '40px';
        input.style.height = '28px';
        input.style.border = '1px solid #3a3a6a';
        input.style.borderRadius = '4px';
        input.style.background = 'transparent';
        input.style.cursor = 'pointer';
        input.oninput = () => {
          PLAYER_CUSTOM[field] = input.value;
          // Don't re-render the entire UI on every drag — the preview
          // loop will pick up the value next tick.
        };
        input.onchange = () => { this._renderCustomizerOptions(); };
        wrap.appendChild(input);
        colorHost.appendChild(wrap);
        // "Clear" button for fields that have a meaningful empty state
        // (e.g. bagpipeAccent = use type default).
        if (placeholder === '__optional__') {
          const clr = document.createElement('button');
          clr.className = 'bld-tb-toggle';
          clr.textContent = '✕ DEFAULT';
          clr.style.fontSize = '6px';
          clr.style.padding = '6px 10px';
          clr.onclick = () => { PLAYER_CUSTOM[field] = ''; this._renderCustomizerOptions(); };
          colorHost.appendChild(clr);
        }
      };

      const tab = this._custTab;
      if (tab === 'costume') {
        // Apply a complete preset to PLAYER_CUSTOM. Group costumes by
        // theme (HOLIDAY / GAMES / WORLDS) with a small section label
        // before each block. Each chip is a button that overlays the
        // preset on top of the current customization in one click.
        let lastGroup = null;
        for (const cos of this._COSTUMES) {
          if (cos.group !== lastGroup) {
            // Section divider — render a full-width label row.
            const lbl = document.createElement('div');
            lbl.style.cssText = 'grid-column:1/-1;font-family:\'Press Start 2P\',monospace;font-size:6.5px;color:#88c8ff;letter-spacing:1px;padding:6px 4px 2px;border-bottom:1px solid rgba(255,255,255,0.08);margin-top:6px;';
            lbl.textContent = '— ' + cos.group + ' —';
            host.appendChild(lbl);
            lastGroup = cos.group;
          }
          // A costume is "active" only if EVERY field it specifies
          // matches the current PLAYER_CUSTOM. Loose match — accent
          // colors don't need to be checked individually since they
          // co-vary with jacket / beard.
          let isActive = true;
          for (const k of Object.keys(cos)) {
            if (k === 'id' || k === 'group' || k === 'label') continue;
            if (PLAYER_CUSTOM[k] !== cos[k]) { isActive = false; break; }
          }
          host.appendChild(makeChip(
            cos.label,
            isActive,
            () => {
              // Apply every field the preset specifies; leave others alone.
              for (const k of Object.keys(cos)) {
                if (k === 'id' || k === 'group' || k === 'label') continue;
                PLAYER_CUSTOM[k] = cos[k];
              }
              this._renderCustomizerOptions();
              if (window.sfx) try { window.sfx('powerup'); } catch (e) {}
            },
            'costume', cos.id
          ));
        }
      } else if (tab === 'hat') {
        for (const k of Object.keys(HAT_VARIANTS)) {
          host.appendChild(makeChip(
            k.toUpperCase(),
            PLAYER_CUSTOM.hat === k,
            () => { PLAYER_CUSTOM.hat = k; this._renderCustomizerOptions(); },
            'hat', k
          ));
        }
      } else if (tab === 'beard') {
        for (const k of Object.keys(BEARD_VARIANTS)) {
          host.appendChild(makeChip(
            k.toUpperCase(),
            PLAYER_CUSTOM.beard === k,
            () => { PLAYER_CUSTOM.beard = k; this._renderCustomizerOptions(); },
            'beard', k
          ));
        }
        // Beard color presets (only meaningful when not 'clean')
        if (PLAYER_CUSTOM.beard !== 'clean') {
          const beardColors = [
            '#8b3a14', '#3a1a08', '#c8581a', '#e8c860',
            '#777777', '#bbbbbb', '#1a1a1a', '#a04020',
          ];
          for (const c of beardColors) {
            host.appendChild(makeSwatch(
              c, PLAYER_CUSTOM.beardColor === c,
              () => { PLAYER_CUSTOM.beardColor = c; this._renderCustomizerOptions(); }
            ));
          }
          addHexPicker('BEARD COLOR', 'beardColor');
        }
      } else if (tab === 'face') {
        for (const k of Object.keys(FACE_VARIANTS)) {
          host.appendChild(makeChip(
            k.toUpperCase(),
            PLAYER_CUSTOM.face === k,
            () => { PLAYER_CUSTOM.face = k; this._renderCustomizerOptions(); },
            'face', k
          ));
        }
      } else if (tab === 'shoes') {
        for (const k of Object.keys(SHOE_VARIANTS)) {
          host.appendChild(makeChip(
            k.toUpperCase().replace('_', ' '),
            PLAYER_CUSTOM.shoes === k,
            () => { PLAYER_CUSTOM.shoes = k; this._renderCustomizerOptions(); },
            'shoes', k
          ));
        }
      } else if (tab === 'skin') {
        for (const c of SKIN_PRESETS) {
          host.appendChild(makeSwatch(
            c, PLAYER_CUSTOM.skin === c,
            () => { PLAYER_CUSTOM.skin = c; this._renderCustomizerOptions(); }
          ));
        }
        addHexPicker('SKIN', 'skin');
      } else if (tab === 'jacket') {
        for (const [main, accent] of JACKET_PRESETS) {
          host.appendChild(makeSwatch(
            main, PLAYER_CUSTOM.jacket === main,
            () => {
              PLAYER_CUSTOM.jacket = main;
              PLAYER_CUSTOM.jacketAccent = accent;
              this._renderCustomizerOptions();
            }, accent
          ));
        }
        addHexPicker('JACKET', 'jacket');
        addHexPicker('ACCENT', 'jacketAccent');
      } else if (tab === 'stockings') {
        // Sock-style chips first (length / pattern)
        for (const k of Object.keys(SOCK_VARIANTS)) {
          host.appendChild(makeChip(
            k.toUpperCase().replace('-', ' '),
            PLAYER_CUSTOM.sockStyle === k,
            () => { PLAYER_CUSTOM.sockStyle = k; this._renderCustomizerOptions(); },
            'sockStyle', k
          ));
        }
        // Then color swatches
        for (const c of STOCKING_PRESETS) {
          host.appendChild(makeSwatch(
            c, PLAYER_CUSTOM.stockings === c,
            () => { PLAYER_CUSTOM.stockings = c; this._renderCustomizerOptions(); }
          ));
        }
        addHexPicker('SOCK COLOR', 'stockings');
      } else if (tab === 'sporran') {
        for (const c of SPORRAN_PRESETS) {
          host.appendChild(makeSwatch(
            c, PLAYER_CUSTOM.sporran === c,
            () => { PLAYER_CUSTOM.sporran = c; this._renderCustomizerOptions(); }
          ));
        }
        addHexPicker('SPORRAN', 'sporran');
      } else if (tab === 'cape') {
        // Cape style chips — 'none' renders no cape at all.
        for (const k of Object.keys(CAPE_VARIANTS)) {
          host.appendChild(makeChip(
            k.toUpperCase(),
            PLAYER_CUSTOM.cape === k,
            () => { PLAYER_CUSTOM.cape = k; this._renderCustomizerOptions(); },
            'cape', k
          ));
        }
        // Cape color presets (only meaningful when not 'none')
        if (PLAYER_CUSTOM.cape !== 'none') {
          const capeColors = [
            '#8b0000', '#1a3a8a', '#0a4a1a', '#4a0a4a',
            '#cc8800', '#1a1a1a', '#fff8e8', '#a04a8a',
          ];
          for (const c of capeColors) {
            host.appendChild(makeSwatch(
              c, PLAYER_CUSTOM.capeColor === c,
              () => { PLAYER_CUSTOM.capeColor = c; this._renderCustomizerOptions(); }
            ));
          }
          addHexPicker('CAPE COLOR', 'capeColor');
        }
      } else if (tab === 'bagpipe') {
        // Bagpipe type chips — 0 = inherit from level, 1-5 = pin a specific type.
        const bpLabels = ['AUTO (LEVEL)', '1 · STANDARD', '2 · BOUNCE', '3 · PIERCING', '4 · CHARGE', '5 · PORTAL'];
        for (let i = 0; i <= 5; i++) {
          host.appendChild(makeChip(
            bpLabels[i],
            (PLAYER_CUSTOM.bagpipeType | 0) === i,
            () => { PLAYER_CUSTOM.bagpipeType = i; this._renderCustomizerOptions(); },
            'bagpipeType', i
          ));
        }
        // Free-hex pipe accent override (empty = let the type pick its own).
        addHexPicker('PIPE ACCENT', 'bagpipeAccent', '__optional__');
      }
    },
    _startCustomizerLoop() {
      const cv = document.getElementById('cust-preview');
      if (!cv) return;
      const pctx = cv.getContext('2d');
      pctx.imageSmoothingEnabled = false;
      let _f = 0;
      const tick = () => {
        if (!document.getElementById('s-customize').classList.contains('active')) {
          this._custLoopId = null;
          return;
        }
        _f++;
        pctx.fillStyle = 'rgba(8,4,22,0.55)';
        pctx.fillRect(0, 0, cv.width, cv.height);
        // The bagpiper sprite is "32 wide" at its body, but the bagpipes
        // can extend from x≈-6 (charge cannon) to x≈+52 (piercing pipe),
        // and tall hats (feathered, viking horns) reach up to y≈-21. The
        // canvas + offsets here are sized so none of that gets clipped.
        const scale = 3;
        pctx.save();
        pctx.scale(scale, scale);
        // Logical canvas at scale=3 is ~87×80 units. Sit feet near the
        // bottom but leave headroom for tall hats, and shift left a bit
        // so the long right-side pipes (Piercing) still fit.
        const logicalW = cv.width / scale;
        const logicalH = cv.height / scale;
        const ox = Math.round((logicalW - 32) / 2 - 8);
        const oy = Math.round(logicalH - 50 - 6);
        drawBagpiper32(pctx, ox, oy, this._custFacingRight, _f, false, false, 1, _f, 'neutral');
        pctx.restore();
        this._custLoopId = requestAnimationFrame(tick);
      };
      this._custLoopId = requestAnimationFrame(tick);
      // Flip button wires to a toggle that mutates _custFacingRight.
      const flipBtn = document.getElementById('cust-flip-btn');
      if (flipBtn) flipBtn.onclick = () => { this._custFacingRight = !this._custFacingRight; };
    },
    _stopCustomizerLoop() {
      if (this._custLoopId != null) {
        cancelAnimationFrame(this._custLoopId);
        this._custLoopId = null;
      }
    },
    openGenerated() {
      // Compact dice chip beside the unlock toggle on the world-select
      // screen. Walks WORLDS for the generated entry, then drills into
      // that world's level grid. Resets selectedSubWorld so the BACK
      // button on level-select returns to the top-level world grid.
      const genEntry = WORLDS.map((w, i) => ({ w, i })).find(x => x && x.w && x.w.category === 'generated');
      if (!genEntry || !genEntry.w.levels || genEntry.w.levels.length === 0) return;
      selectedWorld = genEntry.i + 1; selectedSubWorld = 0;
      this.buildLevelGrid(); this.showScreen('s-levelselect');
    },
    clearGenerated() {
      // Trash-bin button on the generated level-select toolbar. Opens
      // the in-game glass confirm dialog (NOT the native browser
      // confirm) — user has to type the exact phrase before the
      // DELETE button arms. On confirm we wipe both the in-memory
      // list AND the localStorage cache via the helper returned by
      // ensureGeneratedWorld, then pop back to world-select so the
      // dice chip dims out.
      const genEntry = WORLDS.map((w, i) => ({ w, i })).find(x => x && x.w && x.w.category === 'generated');
      if (!genEntry || !genEntry.w.levels || genEntry.w.levels.length === 0) return;
      const n = genEntry.w.levels.length;
      ConfirmDelete.open({
        count: n,
        onConfirm: () => {
          try { ensureGeneratedWorld().clearGenerated(); } catch (e) { genEntry.w.levels = []; }
          selectedWorld = 0; selectedSubWorld = 0;
          this.buildWorldGrid();
          this.showScreen('s-worldselect');
        },
      });
    },
    importGenerated() {
      // Open the hidden file picker. The 'change' handler is wired up
      // in the boot sequence (see _wireImportGenerated below) so the
      // listener attaches once instead of every time the button is
      // pressed.
      const inp = document.getElementById('gen-tb-import-input');
      if (!inp) return;
      inp.value = ''; // allow re-selecting the same file later
      inp.click();
    },
    exportGenerated() {
      // Export every saved generated level as its own JSON file inside
      // a single ZIP download. Uses a tiny in-place "stored" (no
      // compression) ZIP writer so we don't pull in any dependency.
      const genEntry = WORLDS.map((w, i) => ({ w, i })).find(x => x && x.w && x.w.category === 'generated');
      if (!genEntry || !genEntry.w.levels || genEntry.w.levels.length === 0) return;
      const levels = genEntry.w.levels;
      const enc = new TextEncoder();
      // Sanitize a level name into a safe-ish filename component.
      const slug = (s) => String(s || 'level')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'level';
      // Strip transient runtime state from a level before serializing.
      const sanitize = (lv) => {
        const clean = JSON.parse(JSON.stringify(lv));
        // Drop fields that only matter at runtime / reference live state
        delete clean._cx; delete clean._cy; delete clean._t; delete clean._dir;
        return clean;
      };
      // Build {name, data} entries
      const usedNames = Object.create(null);
      const files = levels.map((lv, i) => {
        let base = `${String(i + 1).padStart(2, '0')}-${slug(lv && lv.name)}`;
        let name = `${base}.json`;
        let dup = 1;
        while (usedNames[name]) { name = `${base}-${++dup}.json`; }
        usedNames[name] = true;
        const json = JSON.stringify(sanitize(lv), null, 2);
        return { name, data: enc.encode(json) };
      });
      // ── Minimal "stored" ZIP writer (no compression, no encryption) ──
      // Reference: PKZIP APPNOTE.TXT §4.3 (Local file header, Central
      // directory header, End of central directory record).
      const crcTable = (function () {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
          let c = n;
          for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
          t[n] = c >>> 0;
        }
        return t;
      })();
      const crc32 = (buf) => {
        let c = 0 ^ (-1);
        for (let i = 0, len = buf.length; i < len; i++) {
          c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xFF];
        }
        return (c ^ (-1)) >>> 0;
      };
      const parts = [];      // local headers + file bytes (file payload area)
      const central = [];    // central directory entries
      let offset = 0;
      for (const f of files) {
        const nameBytes = enc.encode(f.name);
        const data = f.data;
        const crc = crc32(data);
        const size = data.length;
        // Local file header (30 bytes + filename)
        const lfh = new ArrayBuffer(30);
        const lv = new DataView(lfh);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);   // version needed
        lv.setUint16(6, 0, true);    // general purpose flag
        lv.setUint16(8, 0, true);    // compression: 0 = stored
        lv.setUint16(10, 0, true);   // mod time
        lv.setUint16(12, 0, true);   // mod date
        lv.setUint32(14, crc, true);
        lv.setUint32(18, size, true);
        lv.setUint32(22, size, true);
        lv.setUint16(26, nameBytes.length, true);
        lv.setUint16(28, 0, true);   // extra field length
        parts.push(new Uint8Array(lfh), nameBytes, data);
        // Central directory header (46 bytes + filename)
        const cdh = new ArrayBuffer(46);
        const cv = new DataView(cdh);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);   // version made by
        cv.setUint16(6, 20, true);   // version needed
        cv.setUint16(8, 0, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, 0, true);
        cv.setUint16(14, 0, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, size, true);
        cv.setUint32(24, size, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint16(30, 0, true);
        cv.setUint16(32, 0, true);
        cv.setUint16(34, 0, true);
        cv.setUint16(36, 0, true);
        cv.setUint32(38, 0, true);
        cv.setUint32(42, offset, true);
        central.push(new Uint8Array(cdh), nameBytes);
        offset += 30 + nameBytes.length + size;
      }
      // End of central directory
      let cdSize = 0; for (const p of central) cdSize += p.length;
      const cdOffset = offset;
      const eocd = new ArrayBuffer(22);
      const ev = new DataView(eocd);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(4, 0, true);
      ev.setUint16(6, 0, true);
      ev.setUint16(8, files.length, true);
      ev.setUint16(10, files.length, true);
      ev.setUint32(12, cdSize, true);
      ev.setUint32(16, cdOffset, true);
      ev.setUint16(20, 0, true);
      const blob = new Blob([...parts, ...central, new Uint8Array(eocd)], { type: 'application/zip' });
      // Trigger the download.
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.href = url;
      a.download = `pog-generated-levels-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    },
    buildWorldGrid() {
      const grid = document.getElementById('world-grid'); if (!grid) return; grid.innerHTML = '';

      // ── Helper to render a "category" card that drills into a sub-grid
      const drillCard = (opts) => {
        const div = document.createElement('div');
        div.className = 'world-card';
        div.style.cssText = `border-color:${opts.border};box-shadow:0 0 24px ${opts.glow};cursor:pointer;padding:20px;min-width:180px;`;
        div.innerHTML = `<div style="font-size:36px">${opts.emoji}</div>
          <div class="wc-name" style="color:${opts.border};font-size:11px;margin:6px 0">${opts.name}</div>
          <div style="font-size:6px;color:#aaa;margin-bottom:6px">${opts.desc}</div>
          ${opts.statline}`;
        div.onclick = opts.onclick;
        grid.appendChild(div);
      };

      // ── OG WORLD card → drills into the 5 original story worlds only ──
      const ogLevels = buildOGLevels();
      const ogStars = ogLevels.reduce((acc, e) => acc + (levelStars[`${e.worldIdx}-${e.levelIdx}`] || 0), 0);
      const ogMax = ogLevels.length * 3;
      const ogPct = ogMax > 0 ? Math.round(ogStars / ogMax * 100) : 0;
      drillCard({
        emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'OG WORLD', border: '#f5c518', glow: '#f5c51866',
        desc: `${ogLevels.length} ORIGINAL LEVELS`,
        statline: `<div style="font-size:8px;color:#f5c518">${ogStars}/${ogMax} ★ · ${ogPct}%</div>`,
        onclick: () => { selectedWorld = 0; selectedSubWorld = 0; selectedCategory = 'og'; this.buildSubWorldGrid('og'); this.showScreen('s-levelselect'); },
      });

      // ── NEW LEVELS parent card → drills into bonus worlds (W6 + W7 + …) ──
      const newWorlds = WORLDS.map((w, i) => ({ w, i })).filter(x => x.w && x.w.category === 'new' && x.w.levels && x.w.levels.length > 0);
      if (newWorlds.length > 0) {
        const totalLevels = newWorlds.reduce((a, x) => a + x.w.levels.length, 0);
        const totalStars = newWorlds.reduce((a, x) => a + x.w.levels.reduce((b, _, li) => b + (levelStars[`${x.i + 1}-${li + 1}`] || 0), 0), 0);
        drillCard({
          emoji: '🌟', name: 'NEW LEVELS', border: '#cf80ff', glow: '#cf80ff66',
          desc: `${newWorlds.length} BONUS WORLD${newWorlds.length !== 1 ? 'S' : ''} · ${totalLevels} LEVELS`,
          statline: `<div style="font-size:8px;color:#cf80ff">${totalStars}/${totalLevels * 3} ★</div>`,
          onclick: () => { selectedWorld = 0; selectedSubWorld = 0; selectedCategory = 'new'; this.buildSubWorldGrid('new'); this.showScreen('s-levelselect'); },
        });
      }

      // ── 🎲 GENERATED is now a compact chip next to the unlock toggle
      //    (see #generated-chip in #s-worldselect markup). Sync its label
      //    to the current roll-count so users see how many are saved.
      const genEntry = WORLDS.map((w, i) => ({ w, i })).find(x => x && x.w && x.w.category === 'generated');
      const genChip = document.getElementById('generated-chip');
      const genChipLabel = document.getElementById('generated-chip-label');
      if (genChip && genChipLabel) {
        const gn = (genEntry && genEntry.w.levels) ? genEntry.w.levels.length : 0;
        genChipLabel.textContent = gn > 0 ? `GENERATED · ${gn}` : 'GENERATED';
        genChip.style.opacity = gn > 0 ? '1' : '0.55';
        genChip.disabled = gn === 0;
        genChip.title = gn > 0 ? `${gn} procedural roll${gn !== 1 ? 's' : ''} saved` : 'Roll a level in the generator to fill this up';
      }

      // ── EXPANSION card → drills into the 5 expansion showcase worlds
      //    (worlds 11-15) that feature the new themes, weather, and
      //    platform mechanics added in v3.17x.
      const expWorlds = WORLDS.map((w, i) => ({ w, i })).filter(x => x.w && x.w.category === 'expansion' && x.w.levels && x.w.levels.length > 0);
      if (expWorlds.length > 0) {
        const totalLevels = expWorlds.reduce((a, x) => a + x.w.levels.length, 0);
        const totalStars = expWorlds.reduce((a, x) => a + x.w.levels.reduce((b, _, li) => b + (levelStars[`${x.i + 1}-${li + 1}`] || 0), 0), 0);
        drillCard({
          emoji: '🌌', name: 'EXPANSION', border: '#5ad8ff', glow: '#5ad8ff66',
          desc: `${expWorlds.length} SHOWCASE WORLDS · ${totalLevels} LEVELS`,
          statline: `<div style="font-size:8px;color:#5ad8ff">${totalStars}/${totalLevels * 3} ★ · NEW THEMES & WEATHER</div>`,
          onclick: () => { selectedWorld = 0; selectedSubWorld = 0; selectedCategory = 'expansion'; this.buildSubWorldGrid('expansion'); this.showScreen('s-levelselect'); },
        });
      }

      // ── TUTORIAL DOJO card → opens its level grid directly ──
      const tutEntry = WORLDS.map((w, i) => ({ w, i })).find(x => x && x.w && x.w.category === 'tutorial');
      if (tutEntry) {
        const tutWorld = tutEntry.i + 1;
        const tutLevels = tutEntry.w.levels.length;
        const tutStars = tutEntry.w.levels.reduce((a, _, li) => a + (levelStars[`${tutWorld}-${li + 1}`] || 0), 0);
        drillCard({
          emoji: tutEntry.w.emoji || '📐', name: tutEntry.w.name || 'TUTORIAL', border: '#88c8ff', glow: '#88c8ff66',
          desc: tutEntry.w.desc || 'TRAINING',
          statline: `<div style="font-size:8px;color:#88c8ff">${tutLevels} LESSONS · ${tutStars}/${tutLevels * 3} ★</div>`,
          onclick: () => { selectedWorld = tutWorld; selectedSubWorld = 0; this.buildLevelGrid(); this.showScreen('s-levelselect'); },
        });
      }
    },
    buildSubWorldGrid(filter) {
      // Render worlds matching the given category ('og' | 'new' | 'tutorial')
      this._lastSubFilter = filter;   // remembered so buyWorld() can re-render
      const grid = document.getElementById('level-grid'); if (!grid) return; grid.innerHTML = '';
      const titleEl = document.getElementById('ls-world-name');
      const titleMap = { og: '— OG WORLD —', new: '— NEW LEVELS —', tutorial: '— TUTORIAL —', expansion: '— EXPANSION —' };
      if (titleEl) titleEl.textContent = titleMap[filter] || '— SELECT WORLD —';
      const backBtn = document.getElementById('ls-back-btn');
      if (backBtn) backBtn.onclick = () => this.showScreen('s-worldselect');
      WORLDS.forEach((wd, wi) => {
        if (!wd) return;
        if (filter && wd.category !== filter) return;
        if (!wd.levels || wd.levels.length === 0) return;
        const w = wi + 1;
        const accessible = isWorldAccessible(w), unlocked = getWorldUnlocked(w);
        // Premium worlds that are still locked can be bought outright here.
        const premium = !accessible && (typeof isWorldPremium === 'function') && isWorldPremium(w);
        const price = premium && (typeof worldPrice === 'function') ? worldPrice(w) : null;
        const totalStars = Array.from({ length: wd.levels.length }, (_, i) => levelStars[`${w}-${i + 1}`] || 0).reduce((a, b) => a + b, 0);
        const div = document.createElement('div');
        div.className = 'world-card' + (accessible ? '' : ' locked');
        div.style.cssText = `border-color:${accessible ? wd.borderColor : (premium ? '#8a7320' : '#222')};${accessible ? 'cursor:pointer;box-shadow:0 0 15px ' + wd.color + '44;' : ''}min-width:140px;`;
        const prog = accessible ? `${Math.min(unlocked - 1, wd.levels.length)}/${wd.levels.length} LEVELS` : 'LOCKED';
        let bottom;
        if (premium && price) {
          const afford = window.GameWallet && GameWallet.canAfford(price.coins || 0, price.embers || 0);
          const priceStr = '🪙' + (price.coins || 0) + (price.embers ? ' 🔥' + price.embers : '');
          bottom = `<button class="btn" style="font-size:6px;padding:5px 8px;margin-top:4px;${afford ? '' : 'opacity:0.45;'}" ${afford ? '' : 'disabled'} data-buyworld="${w}">UNLOCK ${priceStr}</button>`;
        } else {
          bottom = `<div class="wc-prog">${prog}</div>`;
        }
        div.innerHTML = `<div style="font-size:26px">${wd.emoji}</div>
          <div class="wc-name" style="color:${accessible ? '#f5c518' : (premium ? '#ffd76a' : '#444')};font-size:9px;margin:4px 0">${wd.name}</div>
          <div style="font-size:6px;color:${accessible ? '#888' : '#333'};margin-bottom:4px">${wd.desc}</div>
          <div class="wc-stars">${accessible ? '★'.repeat(Math.min(3, Math.floor(totalStars / wd.levels.length))) + '☆'.repeat(3 - Math.min(3, Math.floor(totalStars / wd.levels.length))) : (premium ? '🛒' : '🔒')}</div>
          ${bottom}`;
        if (accessible) {
          div.onclick = () => { selectedSubWorld = w; selectedWorld = w; this.buildLevelGrid(); };
        } else if (premium && price) {
          const btn = div.querySelector('[data-buyworld]');
          if (btn) btn.onclick = (e) => { e.stopPropagation(); this.buyWorld(w); };
        }
        grid.appendChild(div);
      });
    },
    buildLevelGrid() {
      const grid = document.getElementById('level-grid'); if (!grid) return; grid.innerHTML = '';
      const titleEl = document.getElementById('ls-world-name');
      const backBtn = document.getElementById('ls-back-btn');
      // Hide the generated corner buttons by default; re-show below
      // only when the current world is the generated one. Each button
      // is pinned independently — toggle .show on all three.
      const genTbClear  = document.getElementById('gen-tb-clear');
      const genTbImport = document.getElementById('gen-tb-import');
      const genTbExport = document.getElementById('gen-tb-export');
      if (genTbClear)  genTbClear.classList.remove('show');
      if (genTbImport) genTbImport.classList.remove('show');
      if (genTbExport) genTbExport.classList.remove('show');

      if (selectedWorld === 0) {
        // Show whichever sub-grid the user opened (OG, NEW LEVELS, …).
        this.buildSubWorldGrid(selectedCategory || 'og'); return;
      }

      const wd = WORLDS[selectedWorld - 1];
      if (titleEl) titleEl.textContent = `— ${wd.name} —`;
      if (wd && wd.category === 'generated') {
        if (genTbClear)  genTbClear.classList.add('show');
        if (genTbImport) genTbImport.classList.add('show');
        if (genTbExport) genTbExport.classList.add('show');
      }
      if (backBtn) backBtn.onclick = () => {
        // BACK behavior depends on whether this world lives inside a
        // multi-world category (og / new) or stands alone (tutorial /
        // generated, which each only have one card on the world grid).
        // For standalone categories the sub-grid would just show one
        // card — pointless — so we jump straight to the top-level
        // world-select instead.
        const cat = wd.category || (selectedWorld <= 5 ? 'og' : 'new');
        selectedWorld = 0; selectedSubWorld = 0;
        if (cat === 'tutorial' || cat === 'generated') {
          this.showScreen('s-worldselect');
        } else {
          selectedCategory = cat;
          this.buildSubWorldGrid(cat);
        }
      };
      const unlocked = getWorldUnlocked(selectedWorld);
      const editMode = isLocalEditMode();
      wd.levels.forEach((lv, i) => {
        const unlockAll = localStorage.getItem('pogl_unlock_all') === '1';
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px';
        const btn = document.createElement('button'), locked = !unlockAll && i >= unlocked;
        btn.className = 'lvl-btn' + (locked ? ' locked' : '');
        if (!locked) btn.style.borderColor = wd.borderColor + '88';
        const stars = levelStars[`${selectedWorld}-${i + 1}`] || 0;
        btn.innerHTML = `<div style="font-size:8px">${locked ? '🔒' : 'W' + selectedWorld + '-' + (i + 1)}</div>
          <div style="font-size:6px;color:#888">${locked ? '???' : lv.name.substring(0, 12)}</div>
          <div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>`;
        if (!locked) btn.onclick = () => this.startGame(selectedWorld, i + 1);
        wrapper.appendChild(btn);
        // ── Edit button (visible only in local edit mode) ──
        if (editMode && !locked) {
          const ebtn = document.createElement('button');
          ebtn.className = 'lvl-btn';
          ebtn.style.cssText = 'min-width:90px;width:90px;height:24px;padding:0;font-size:6px;background:#1a0e2a;color:#cf80ff;border-color:#5a3aaa;cursor:pointer;';
          ebtn.textContent = '✎ EDIT';
          ebtn.onclick = (e) => { e.stopPropagation(); UI.editLevel(selectedWorld, i + 1); };
          wrapper.appendChild(ebtn);
        }
        grid.appendChild(wrapper);
      });
    },
    // ── Screen-transition helper ───────────────────────────────
    // Wraps a level / screen swap in a fade-to-black:
    //   1. fade IN (opacity 0 → 1) over 220ms
    //   2. run the supplied swap callback while the screen is dark
    //   3. fade OUT (opacity 1 → 0) over 220ms
    // The overlay holds at full black for ~30ms between phases so
    // the swap can settle (e.g. drawScene draws once) before fade
    // begins. Safe to call without an overlay element — falls back
    // to running the callback synchronously.
    _fadeTransition(swapFn) {
      const o = document.getElementById('fade-overlay');
      if (!o) { try { swapFn && swapFn(); } catch (e) {} return; }
      o.classList.add('show');
      setTimeout(() => {
        try { swapFn && swapFn(); } catch (e) { console.error('fade swap:', e); }
        setTimeout(() => o.classList.remove('show'), 30);
      }, 230);
    },
    startGame(world, lvl) {
      // Run the actual screen swap behind a fade so the cut isn't
      // a jarring instant jump. Same call-shape as before; the
      // wrapper just delays the body by 230ms.
      // Persist the last-played (world,level) so the title PLAY
      // button can resume where the user left off. Skip the builder
      // test slot (99) and out-of-range values.
      try {
        if (world >= 1 && world <= 200 && lvl >= 1 && lvl <= 999 && world !== 99) {
          localStorage.setItem('pogl_last_played', world + ',' + lvl);
        }
      } catch (e) {}
      this._fadeTransition(() => this._startGameInner(world, lvl));
    },
    // ─── PLAY button: continue to the next level ────────────────
    // Behaviour:
    //   1. If the player has CLEARED a level, launch the NEXT level
    //      in sequence (next level in the world, or level 1 of the
    //      next world) — but only if that next level is unlocked /
    //      accessible.
    //   2. If the next level isn't unlocked, or no clear is on
    //      record, fall back to the last-PLAYED level.
    //   3. First boot with neither → World 1, Level 1.
    // Every candidate is validated against the live WORLDS data so a
    // renamed / removed world can't launch a missing level.
    playLast() {
      const WD = window.WORLDS || [];
      const _valid = (w, l) => {
        const wd = WD[w - 1];
        return !!(wd && wd.levels && l >= 1 && l <= wd.levels.length);
      };
      // Is (w,l) reachable? Uses the engine's unlock helpers when
      // available; the "unlock all" toggle overrides everything.
      const _unlocked = (w, l) => {
        try { if (localStorage.getItem('pogl_unlock_all') === '1') return true; } catch (e) {}
        const access = (typeof isWorldAccessible === 'function') ? isWorldAccessible(w) : true;
        if (!access) return false;
        const upTo = (typeof getWorldUnlocked === 'function') ? getWorldUnlocked(w) : 999;
        return l <= upTo;
      };

      let target = null;

      // 1. Next-after-cleared
      try {
        const rawC = localStorage.getItem('pogl_last_cleared') || '';
        const cp = rawC.split(',');
        const cw = parseInt(cp[0], 10), cl = parseInt(cp[1], 10);
        if (cw >= 1 && cl >= 1 && WD[cw - 1] && WD[cw - 1].levels) {
          const wd = WD[cw - 1];
          let nw = cw, nl = cl + 1;
          if (nl > wd.levels.length) { nw = cw + 1; nl = 1; }   // roll to next world
          if (_valid(nw, nl) && _unlocked(nw, nl)) {
            target = { w: nw, l: nl };
          }
        }
      } catch (e) {}

      // 2. Fall back to last-played
      if (!target) {
        try {
          const rawP = localStorage.getItem('pogl_last_played') || '';
          const pp = rawP.split(',');
          const pw = parseInt(pp[0], 10), pl = parseInt(pp[1], 10);
          if (_valid(pw, pl)) target = { w: pw, l: pl };
        } catch (e) {}
      }

      // 3. First boot
      if (!target) target = { w: 1, l: 1 };

      this.startGame(target.w, target.l);
    },
    _startGameInner(world, lvl) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('hud').style.display = 'flex';
      document.getElementById('builder-sidebar').style.display = 'none';
      const _bae = document.getElementById('builder-actions'); if (_bae) _bae.style.display = 'none';
      document.getElementById('builder-bar').style.display = 'none';
      score = 0; coins = 0; currentWorld = world; if (currentLevel !== lvl || currentWorld !== world) { _musicTime = 0; }
      currentLevel = lvl; levelTime = 0;
      GS = 'playing'; initLevel(lvl); startMusic(); resumeAC();
      if (typeof window.playLevelTransition === 'function') window.playLevelTransition();
      // Show back-to-builder button if testing from builder
      const _bbb = document.getElementById('btn-back-builder');
      if (_bbb) _bbb.style.display = (world === 99) ? '' : 'none';
      const _ehud = document.getElementById('hud-embers');
      // Reset ember slots on level start
      for (let _ei = 0; _ei < 3; _ei++) {
        const _es = document.getElementById('ember-' + _ei);
        if (!_es) continue;
        const _total = (getLevelData()?.spiritEmbers || []).length;
        if (_ei < _total) { _es.textContent = '🫙'; _es.classList.remove('lit'); _es.style.display = ''; }
        else { _es.style.display = 'none'; }
      }
    },
    resume() { GS = 'playing'; document.getElementById('s-pause').classList.remove('active'); startMusic(); },

    // Settings → pause integration. Stash where the user came from so the
    // settings BACK button returns there instead of always to the title.
    _settingsReturnTo: 's-title',
    openSettingsFromPause() {
      this._settingsReturnTo = 's-pause';
      this.showScreen('s-settings');
    },
    closeSettings() {
      const target = this._settingsReturnTo || 's-title';
      this._settingsReturnTo = 's-title';
      if (target === 's-pause' && GS === 'paused') {
        // Keep the game paused; just swap the visible screen.
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('s-pause').classList.add('active');
      } else {
        this.showScreen(target);
      }
    },
    restart() { this.startGame(currentWorld, currentLevel); document.getElementById('s-gameover').classList.remove('active'); },
    nextLevel() {
      document.getElementById('s-complete').classList.remove('active');
      if (currentWorld === 0) {
        // OG mode: advance through flat list
        const total = buildOGLevels().length;
        if (currentLevel < total) this.startGame(0, currentLevel + 1);
        else this.showScreen('s-title');
      } else {
        const maxLvl = WORLDS[currentWorld - 1]?.levels?.length || 6;
        if (currentLevel < maxLvl) this.startGame(currentWorld, currentLevel + 1);
        else if (currentWorld < WORLDS.length) this.startGame(currentWorld + 1, 1);
        else this.showScreen('s-title');
      }
    },
    setUnlockAll(enabled) {
      localStorage.setItem('pogl_unlock_all', enabled ? '1' : '0');
      if (enabled) {
        // Unlock all levels in all worlds
        WORLDS.forEach((_, wi) => setWorldUnlocked(wi + 1, 7));
      }
      this.buildLevelGrid();
    },

    backToTitle() {
      this._fadeTransition(() => this._backToTitleInner());
    },
    _backToTitleInner() {
      stopMusic();
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('s-title').classList.add('active');
      document.getElementById('hud').style.display = 'none';
      document.getElementById('builder-sidebar').style.display = 'none';
      const _bae = document.getElementById('builder-actions'); if (_bae) _bae.style.display = 'none';
      document.getElementById('builder-bar').style.display = 'none';
      ['terrain', 'hazard', 'flow', 'animals', 'objects', 'enemies', 'info'].forEach(c => {
        const p = document.getElementById('blpanel-' + c); if (p) p.style.display = 'none';
      });
      if (typeof BLD !== 'undefined') BLD._openCat = null;
      GS = 'title';
      // Roll a fresh random demo level for the title background. After
      // a level-complete (or returning from a generated level) bgState
      // still points at the level just played; without this reset the
      // title shows that level looping instead of the title demo.
      try { initBgState(); } catch (e) { /* harmless if init fails */ }
      // Resume menu music (stopMusic faded out the level track above).
      try { if (typeof window.startMenuMusic === 'function') window.startMenuMusic(); } catch (e) {}
    },
    pause() {
      GS = 'paused'; stopMusic();
      document.getElementById('s-pause').classList.add('active');
      // Show back-to-builder button only in test mode
      const btn = document.getElementById('btn-back-builder');
      if (btn) btn.style.display = currentWorld === 99 ? '' : 'none';
      // Reveal the seed for generated levels so it can be copied / shared
      const seedEl = document.getElementById('pause-seed');
      const ld = getLevelData();
      const isGen = !!(ld && ld._seed);
      if (seedEl) {
        if (isGen) {
          seedEl.style.display = 'block';
          seedEl.innerHTML = '🎲 GENERATED LEVEL<br>SEED: <span class="selectable" style="color:#9bff9b">' + ld._seed + '</span>';
        } else {
          seedEl.style.display = 'none';
        }
      }
      // Show "Open in Editor" only for generated levels (not the test/builder world)
      const eBtn = document.getElementById('btn-pause-editor');
      if (eBtn) eBtn.style.display = isGen ? '' : 'none';
    },

    // Load the currently-loaded level into the level builder (used from pause)
    openCurrentInBuilder() {
      const ld = getLevelData();
      if (!ld) return;
      BLD.levelData = JSON.parse(JSON.stringify(ld));
      BLD._editTarget = null;
      // Hide the pause overlay before opening builder so it doesn't linger
      document.getElementById('s-pause').classList.remove('active');
      this.openBuilder();
      BLD.showInfo(ld._seed ? ('🎲 GENERATED · SEED ' + ld._seed) : '✏ EDITING LEVEL COPY');
    },
    resetBindings() { Object.assign(KB, DEFAULT_KB); try { localStorage.removeItem('pogl_kb'); } catch (e) { } buildSettingsUI(); updateHUDKeys(); },
    // ── Open the level builder pre-loaded with an existing level for editing ──
    editLevel(world, level) {
      if (!isLocalEditMode()) return;
      const wd = WORLDS[world - 1];
      if (!wd || !wd.levels || !wd.levels[level - 1]) return;
      // Deep-clone so edits don't mutate the live level until the user saves.
      const ld = JSON.parse(JSON.stringify(wd.levels[level - 1]));
      // Tag the source so the builder's "save" button knows where to write back.
      BLD._editTarget = { world, level };
      BLD.levelData = ld;
      // Open builder
      this.openBuilder();
      BLD.updateInfo();
      BLD.showInfo('✎ EDITING W' + world + '-' + level + ' · ' + (ld.name || ''));
    },

    // ── Level Generator screen ──
    // ── Achievements + lifetime stats screen ─────────────────────
    buildAchievementsScreen() {
      const body = document.getElementById('achv-body');
      if (!body) return;
      const stats = (window.GameStats && GameStats.getStats()) || {};
      const list  = (window.GameStats && GameStats.getAchievements()) || [];

      const fmt = n => String(n | 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const mins = ((stats.msPlayed || 0) / 60000);
      const hrs  = Math.floor(mins / 60);
      const remMins = Math.floor(mins % 60);

      const statRows = [
        ['🪙 Coins collected',  fmt(stats.coinsCollected)],
        ['⚔️ Enemies defeated', fmt(stats.enemiesDefeated)],
        ['🚩 Levels cleared',   fmt(stats.levelsCleared)],
        ['⭐ Perfect clears',   fmt(stats.perfectClears)],
        ['🦘 Total jumps',      fmt(stats.jumps)],
        ['🎵 Notes fired',      fmt(stats.shotsFired)],
        ['👣 Distance run',     fmt(stats.distanceRun) + 'px'],
        ['💀 Deaths',           fmt(stats.deaths)],
        ['⏱ Time played',       (hrs ? hrs + 'h ' : '') + remMins + 'm'],
      ].map(([label, val]) =>
        `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1a2a;font-family:'Press Start 2P',monospace;font-size:7px;">
          <span style="color:#aaa;">${label}</span><span style="color:#ffd76a;">${val}</span>
        </div>`
      ).join('');

      const achvCards = list.map(a => {
        const tint = a.unlocked ? '#ffd76a' : '#3a3a4a';
        const opa  = a.unlocked ? '1' : '0.45';
        const lockIcon = a.unlocked ? a.icon : '🔒';
        return `<div style="opacity:${opa};display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid ${tint};border-radius:8px;background:rgba(0,0,0,0.3);">
          <div style="font-size:18px;flex:0 0 auto;">${lockIcon}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:${tint};">${a.label}</div>
            <div style="font-family:'Press Start 2P',monospace;font-size:5.5px;color:#888;margin-top:3px;">${a.desc}</div>
          </div>
        </div>`;
      }).join('');

      const unlockedN = list.filter(a => a.unlocked).length;
      const totalN = list.length;

      body.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:18px;">
          <div>
            <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#88c8ff;margin-bottom:8px;letter-spacing:1px;">LIFETIME STATS</div>
            ${statRows}
          </div>
          <div>
            <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#88c8ff;margin-bottom:8px;letter-spacing:1px;">ACHIEVEMENTS · ${unlockedN}/${totalN}</div>
            <div style="display:grid;grid-template-columns:1fr;gap:6px;">${achvCards}</div>
          </div>
        </div>`;
    },

    // Buy early access to a premium world from the classic world grid.
    buyWorld(w) {
      if (typeof purchaseWorld !== 'function') return;
      if (purchaseWorld(w)) {
        if (window.sfx) try { sfx('castle'); } catch (e) {}
        if (window.refreshWalletChip) window.refreshWalletChip();
        // Re-render the sub-world grid we're on so the card flips to playable.
        if (this._lastSubFilter) this.buildSubWorldGrid(this._lastSubFilter);
      }
    },

    // ─── Journey (completion tracker) ────────────────────────────
    openJourney() { this.showScreen('s-journey'); },
    _journeyBar(label, got, total, color) {
      const pct = total > 0 ? Math.round((got / total) * 100) : 0;
      return '<div style="margin-bottom:12px;">' +
        '<div style="display:flex;justify-content:space-between;font-family:\'Press Start 2P\',monospace;font-size:7px;margin-bottom:5px;">' +
          '<span style="color:#bbb;">' + label + '</span>' +
          '<span style="color:' + color + ';">' + got + ' / ' + total + '</span>' +
        '</div>' +
        '<div style="height:12px;border-radius:6px;background:#1a1a2a;overflow:hidden;border:1px solid #2a2a3a;">' +
          '<div style="height:100%;width:' + pct + '%;background:' + color + ';box-shadow:0 0 8px ' + color + '88;transition:width .3s ease;"></div>' +
        '</div></div>';
    },
    buildJourneyScreen() {
      const body = document.getElementById('journey-body');
      if (!body) return;
      const c = (window.GameProgress && GameProgress.getCompletion()) || null;
      if (!c) { body.innerHTML = '<div style="color:#888;font-size:7px;">No progress data yet.</div>'; return; }
      const ringPct = c.pct;
      body.innerHTML =
        '<div style="text-align:center;margin-bottom:18px;">' +
          '<div style="font-family:\'Press Start 2P\',monospace;font-size:30px;color:#ffd76a;text-shadow:0 0 18px rgba(255,215,106,0.6);">' + ringPct + '%</div>' +
          '<div style="font-family:\'Press Start 2P\',monospace;font-size:7px;color:#888;margin-top:6px;letter-spacing:1px;">GAME COMPLETION</div>' +
        '</div>' +
        this._journeyBar('🚩 LEVELS CLEARED', c.levels.done, c.levels.total, '#4abf20') +
        this._journeyBar('⭐ STARS EARNED',   c.stars.got,  c.stars.max,   '#ffd76a') +
        this._journeyBar('🏰 WORLDS DONE',    c.worlds.done, c.worlds.total, '#6eb4ff') +
        this._journeyBar('🏆 ACHIEVEMENTS',   c.achievements.got, c.achievements.total, '#cf80ff') +
        this._journeyBar('⚡ PERKS OWNED',    c.perks.got, c.perks.total, '#ff8a3c');
    },

    // ─── Highland Market (shop) ──────────────────────────────────
    openShop() {
      if (!this._shopTab) this._shopTab = 'perks';
      this.showScreen('s-shop');   // showScreen() calls buildShopScreen()
    },
    setShopTab(tab) {
      this._shopTab = (tab === 'cosmetics') ? 'cosmetics' : 'perks';
      this.buildShopScreen();
      gpMenuFocus = 0; gpClearFocus();
    },
    buyPerk(id) {
      if (window.GamePerks && GamePerks.buy(id)) {
        if (window.sfx) try { sfx('powerup_collect'); } catch (e) {}
        if (window.refreshWalletChip) window.refreshWalletChip();
        if (window.GameProgress) GameProgress.checkMilestones();
        this.buildShopScreen();
      }
    },
    buyCosmetic(slot, key) {
      if (window.GameUnlocks && GameUnlocks.purchase(slot, key)) {
        if (window.sfx) try { sfx('powerup_collect'); } catch (e) {}
        if (window.refreshWalletChip) window.refreshWalletChip();
        this.buildShopScreen();
      }
    },
    _shopCost(cost) {
      if (!cost) return '';
      const parts = [];
      if (cost.coins)  parts.push('<span style="color:#f5c518;">🪙' + cost.coins + '</span>');
      if (cost.embers) parts.push('<span style="color:#80f0ff;">🔥' + cost.embers + '</span>');
      return parts.join('&nbsp;');
    },
    _renderPerks() {
      const list = (window.GamePerks && GamePerks.getCatalog()) || [];
      return '<div style="display:grid;grid-template-columns:1fr;gap:8px;">' + list.map(p => {
        const total = p.tiers.length;
        const pips = Array.from({ length: total }, (_, i) =>
          '<span style="display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:3px;background:' +
          (i < p.tier ? '#ffd76a' : '#2a2a3a') + ';"></span>').join('');
        let action;
        if (p.maxed) {
          action = '<span style="color:#9bff9b;font-size:7px;">MAX</span>';
        } else {
          const nextLabel = p.tiers[p.tier] ? p.tiers[p.tier].label : '';
          const dis = p.canBuy ? '' : 'disabled style="opacity:0.4;cursor:not-allowed;"';
          action = '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">' +
            '<div style="font-size:6px;color:#aaa;">' + nextLabel + '</div>' +
            '<button class="btn" ' + dis + ' onclick="UI.buyPerk(\'' + p.id + '\')">' +
            this._shopCost(p.nextCost) + '</button></div>';
        }
        return '<div style="display:flex;gap:12px;align-items:center;padding:10px 12px;border:1px solid #3a3a5a;border-radius:8px;background:rgba(0,0,0,0.3);">' +
          '<div style="font-size:22px;flex:0 0 auto;">' + p.icon + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:#ffd76a;">' + p.name + '</div>' +
            '<div style="font-family:\'Press Start 2P\',monospace;font-size:6px;color:#9aa;margin-top:4px;">' + p.desc + '</div>' +
            '<div style="margin-top:6px;">' + pips + '</div>' +
          '</div>' +
          '<div style="flex:0 0 auto;">' + action + '</div>' +
        '</div>';
      }).join('') + '</div>';
    },
    _renderCosmetics() {
      const cat = (window.GameUnlocks && GameUnlocks.getCatalog()) || [];
      if (!cat.length) return '<div style="color:#888;font-size:7px;text-align:center;padding:20px;">No cosmetics available.</div>';
      const cards = cat.map(e => {
        const bought   = GameUnlocks.isBought(e.slot, e.key);
        const unlocked = GameUnlocks.isUnlocked(e.slot, e.key);
        const price    = GameUnlocks.priceOf(e.slot, e.key);
        let action, tint = '#3a3a5a';
        if (bought) { action = '<span style="color:#9bff9b;font-size:7px;">OWNED</span>'; tint = '#2a5a3a'; }
        else if (unlocked) { action = '<span style="color:#88c8ff;font-size:7px;">EARNED</span>'; tint = '#2a4a6a'; }
        else {
          const afford = window.GameWallet && GameWallet.canAfford(price, 0);
          const dis = afford ? '' : 'disabled style="opacity:0.4;cursor:not-allowed;"';
          action = '<button class="btn" ' + dis + ' onclick="UI.buyCosmetic(\'' + e.slot + '\',\'' + e.key + '\')">🪙' + price + '</button>';
        }
        return '<div style="display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid ' + tint + ';border-radius:8px;background:rgba(0,0,0,0.3);">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-family:\'Press Start 2P\',monospace;font-size:7px;color:#ddd;">' + e.label + '</div>' +
            '<div style="font-family:\'Press Start 2P\',monospace;font-size:5.5px;color:#888;margin-top:3px;">' + (e.slot + '').toUpperCase() + '</div>' +
          '</div>' +
          '<div style="flex:0 0 auto;">' + action + '</div>' +
        '</div>';
      }).join('');
      return '<div style="font-family:\'Press Start 2P\',monospace;font-size:6px;color:#888;margin-bottom:10px;text-align:center;">' +
        'Buy a locked cosmetic outright, or earn it via achievements. Equip in the Customizer.</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' + cards + '</div>';
    },
    buildShopScreen() {
      const body = document.getElementById('shop-body');
      if (!body) return;
      const W = window.GameWallet;
      const ce = document.getElementById('shop-coins');  if (ce && W) ce.textContent = W.getCoins();
      const ee = document.getElementById('shop-embers'); if (ee && W) ee.textContent = W.getEmbers();
      const tab = this._shopTab || 'perks';
      const tp = document.getElementById('shop-tab-perks');
      const tc = document.getElementById('shop-tab-cosmetics');
      if (tp) tp.style.opacity = tab === 'perks' ? '1' : '0.5';
      if (tc) tc.style.opacity = tab === 'cosmetics' ? '1' : '0.5';
      body.innerHTML = (tab === 'cosmetics') ? this._renderCosmetics() : this._renderPerks();
    },

    openGenerator() {
      this.showScreen('s-generator');
      // Pre-fill the seed so the user can see what they're about to roll
      // before clicking GENERATE. They can edit it or hit the ✕ button to
      // blank it out (which falls back to Date.now() at generate time).
      const seedEl = document.getElementById('gen-seed');
      if (seedEl && !seedEl.value.trim()) seedEl.value = this._rollSeed();
    },
    // Short, readable, base36 seed — easy to share with friends.
    _rollSeed() {
      return Math.floor(Math.random() * Math.pow(36, 7)).toString(36).padStart(7, '0');
    },


    // Read the generator form into an opts object
    _readGeneratorOpts() {
      const $ = (id) => document.getElementById(id);
      const lenEl = document.querySelector('input[name="gen-len"]:checked');
      const diffEl = document.querySelector('input[name="gen-diff"]:checked');
      const shapeEl = document.querySelector('input[name="gen-shape"]:checked');
      const terrains = Array.from(document.querySelectorAll('#gen-terrains input[type="checkbox"]'))
        .filter(el => el.checked).map(el => el.dataset.terrain);
      const items = Array.from(document.querySelectorAll('#gen-items input[type="checkbox"]'))
        .filter(el => el.checked).map(el => el.dataset.item);
      const enemyVariants = Array.from(document.querySelectorAll('#gen-enemies input[type="checkbox"]'))
        .filter(el => el.checked).map(el => parseInt(el.dataset.enemy, 10));
      // Default-on wildlife toggles. If the checkbox is missing in the
      // DOM (e.g. an older HTML build), assume the legacy default (on).
      const npcsEl = $('gen-include-npcs');
      const macEl  = $('gen-include-mackenzie');
      return {
        theme: $('gen-theme').value,
        weather: $('gen-weather').value,
        music: $('gen-music').value,
        length: lenEl ? lenEl.value : 'medium',
        difficulty: diffEl ? diffEl.value : 'medium',
        shape: shapeEl ? shapeEl.value : 'mixed',
        terrains: terrains.length ? terrains : ['normal'],
        items: items, // empty array → none
        enemyVariants: enemyVariants, // empty array → no enemies
        includeNpcs:      npcsEl ? npcsEl.checked : true,
        includeMackenzie: macEl  ? macEl.checked  : true,
        seed: $('gen-seed').value.trim(),
      };
    },

    // Single path now — the templated builder was removed 2026-05-18.
    _buildFromOpts(opts) {
      return buildRandomLevel(opts);
    },

    // Build a level, push it into the persistent Generated world, and start it
    generateAndPlay() {
      const opts = this._readGeneratorOpts();
      const ld = this._buildFromOpts(opts);
      const idx = ensureGeneratedWorld().pushGeneratedLevel(ld);
      // Generated world lives at WORLDS[97] (1-based: world 98)
      this.startGame(98, idx + 1);
    },

    // Build a level and load it into the builder for editing
    generateInBuilder() {
      const opts = this._readGeneratorOpts();
      const ld = this._buildFromOpts(opts);
      // Also save it to the Generated world so it shows up in world select
      ensureGeneratedWorld().pushGeneratedLevel(ld);
      BLD.levelData = JSON.parse(JSON.stringify(ld));
      BLD._editTarget = null;
      this.openBuilder();
      BLD.showInfo('🎲 GENERATED — EDIT FREELY');
    },

    // Roll random values into every generator form field.
    randomizeGeneratorForm() {
      const $ = (id) => document.getElementById(id);
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const themes = ['highland', 'volcanic', 'frozen', 'shadow', 'desert', 'forest', 'citadel', 'ocean', 'blueprint',
        'castle', 'cosmic', 'cherry', 'steampunk', 'cyber', 'coralreef', 'halloween'];
      const weathers = ['none', 'rain', 'storm', 'snow', 'tornado', 'moon', 'earthquake', 'ashfall', 'fog',
        'sandstorm', 'acidrain', 'lightning', 'meteor', 'tide', 'daynight'];
      const lengths = ['short', 'medium', 'long'];
      const diffs = ['easy', 'medium', 'hard'];
      $('gen-theme').value = pick(themes);
      $('gen-weather').value = pick(weathers);
      // Music: blank ~30% (random), otherwise random track from the list
      const musicEl = $('gen-music');
      if (musicEl) musicEl.value = Math.random() < 0.3 ? '' : musicEl.options[1 + Math.floor(Math.random() * (musicEl.options.length - 1))].value;
      // Length / difficulty radios
      const setRadio = (name, val) => { const el = document.querySelector(`input[name="${name}"][value="${val}"]`); if (el) el.checked = true; };
      setRadio('gen-len', pick(lengths));
      setRadio('gen-diff', pick(diffs));
      // Helper: random subset of N checkboxes with always-on safety pick
      const randomSubset = (sel, minCount, maxCount, safetyAttr, safetyVal) => {
        const all = Array.from(document.querySelectorAll(sel));
        all.forEach(el => { el.checked = false; });
        const target = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
        const shuffled = all.slice().sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(target, shuffled.length); i++) shuffled[i].checked = true;
        if (safetyAttr) {
          const safe = all.find(el => el.dataset[safetyAttr] === safetyVal);
          if (safe) safe.checked = true;
        }
      };
      // Terrains — 2-5, always include 'normal'
      randomSubset('#gen-terrains input[type="checkbox"]', 2, 5, 'terrain', 'normal');
      // Items — 4-8 (mix of consumables and blocks)
      randomSubset('#gen-items input[type="checkbox"]', 4, 8);
      // Enemies — 2-5
      randomSubset('#gen-enemies input[type="checkbox"]', 2, 5);
      // Shape — random
      setRadio('gen-shape', pick(['horizontal', 'mixed', 'vertical']));
      // Wildlife / Mackenzie — flip the two checkboxes randomly. Both
      // bias toward ON (75% / 50%) so a fresh roll feels alive.
      const npcsEl = $('gen-include-npcs');
      const macEl  = $('gen-include-mackenzie');
      if (npcsEl) npcsEl.checked = Math.random() < 0.75;
      if (macEl)  macEl.checked  = Math.random() < 0.50;
      // Seed: roll a fresh visible one instead of clearing — the user
      // sees exactly what they're about to generate.
      $('gen-seed').value = this._rollSeed();
    },

    openBuilder() {
      // Stop the title/level-select menu loop — the builder is its
      // own context; we don't want Granite Savepoint copy looping
      // under the editor work. The level-music crossfade kicks in
      // again when the user "Test Plays" a level from the builder.
      try { if (typeof window.stopMenuMusic === 'function') window.stopMenuMusic(); } catch (e) {}
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('hud').style.display = 'none';
      { const _te = document.getElementById('bld-test-edit'); if (_te) _te.style.display = 'none'; }
      { const _tb = document.getElementById('time-banner'); if (_tb) _tb.style.display = 'none'; }
      document.getElementById('builder-sidebar').style.display = 'flex';
      document.getElementById('builder-actions').style.display = 'flex';
      document.getElementById('builder-colorbar').style.display = 'none'; // shown only when terrain tool active or platform selected
      document.getElementById('builder-bar').style.display = 'none';
      // Clear inline display='none' that exitBuilder set, so CSS rules
      // (default block for info, .show class for help) take over again.
      const _bi = document.getElementById('builder-info'); if (_bi) _bi.style.display = '';
      const _bh2 = document.getElementById('builder-help'); if (_bh2) _bh2.style.display = '';
      // testLevel() hides every builder element by id — including
      // `builder-props`, which is the actual settings-form CHILD of
      // `builder-bar`. If we leave that inline 'none' in place, the
      // next time the user opens the settings panel the wrapper shows
      // but the contents stay invisible. Reset it so the CSS grid
      // layout takes over again.
      const _bp = document.getElementById('builder-props'); if (_bp) _bp.style.display = '';
      GS = 'builder';
      gpBuilderFocus = BL_TOOLS.indexOf(BLD.tool);
      if (gpBuilderFocus < 0) gpBuilderFocus = 0;
      gpClearFocus();
      if (!BLD.levelData) BLD.newLevel();
      BLD._settingsPinned = false;
      BLD.closeCategoryPanels();
      BLD.theme = inferThemeKey(BLD.levelData, BLD.theme || 'highland');
      const bt = document.getElementById('bl-theme'); if (bt) bt.value = BLD.theme;
      BLD.updateInfo();
      BLD._updateZoomLabel();
      BLD.refreshTopbarFromLevel();
      // Reflect the current toolbar toggle state on enter so the
      // pills always match the actual snap / grid flags.
      const _snapBtn = document.getElementById('btn-bld-snap');
      if (_snapBtn) _snapBtn.classList.toggle('on', !!BLD.snapOn);
      const _gridBtn = document.getElementById('btn-bld-grid');
      if (_gridBtn) _gridBtn.classList.toggle('on', !!BLD.gridVisible);
      // Builder 2.0: reflect paint/grab mode pills + clear any stray stroke.
      BLD._painting = false;
      if (BLD._syncModeButtons) BLD._syncModeButtons();
      if (BLD.renderPaletteTemplates) BLD.renderPaletteTemplates();
      if (BLD.peRenderTemplates) BLD.peRenderTemplates();
      // Toggle controller help overlay if a gamepad is connected
      const help = document.getElementById('builder-help');
      if (help) help.classList.toggle('show', !!gpConnected);
      // Show / hide local-edit buttons
      const editing = !!BLD._editTarget && isLocalEditMode();
      const sBtn = document.getElementById('btn-builder-save');
      const pBtn = document.getElementById('btn-builder-patch-html');
      if (sBtn) sBtn.style.display = editing ? '' : 'none';
      if (pBtn) pBtn.style.display = isLocalEditMode() ? '' : 'none';
      setTimeout(() => BLD.openCat(BLD._autoPanelCat || 'terrain', false), 50);
    },
    exitBuilder() {
      // Hide all builder UI — anything visible only inside the builder
      // state must be torn down here, or it bleeds into the title /
      // menu screens after exit. Explicitly hide every overlay element,
      // not just the ones tracked by class — inline-style toggles took
      // priority over CSS in some browsers.
      document.getElementById('hud').style.display = 'none';
      ['builder-sidebar', 'builder-actions', 'builder-bar',
        'builder-info', 'builder-colorbar', 'builder-help'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = 'none';
          if (el.classList) el.classList.remove('show');
        }
      });
      if (BLD_NAV.active) bldNavClose();
      // Close all flyout panels
      ['terrain', 'hazard', 'objects', 'enemies'].forEach(c => {
        const p = document.getElementById('blpanel-' + c);
        if (p) p.style.display = 'none';
        const b = document.getElementById('blcat-' + c);
        if (b) b.classList.remove('active');
      });
      BLD._openCat = null;
      BLD._settingsPinned = false;
      BLD._editTarget = null;
      // Remove any hover highlights left on canvas
      BLD._hoverObj = null;
      // Reset gamestate cleanly
      GS = 'title';
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('s-title').classList.add('active');
    },
    setTool(t) {
      BLD.tool = t;
      document.querySelectorAll('.bl-tool').forEach(el => el.classList.remove('active'));
      const el = document.getElementById('bl-' + t); if (el) el.classList.add('active');
      // Highlight the parent category button
      const catMap = {
        platform: 'terrain', ice: 'terrain', bounce: 'terrain', soundwave: 'terrain', oneway: 'terrain', crumble: 'terrain', breakshot: 'terrain', moving: 'terrain', switchA: 'terrain', switchB: 'terrain', switch: 'terrain',
        conveyor: 'terrain', timed: 'terrain', fallaway: 'terrain', magnetic: 'terrain', windtunnel: 'terrain', rotating: 'terrain', water: 'terrain', grapplehook: 'terrain',
        spike: 'hazard', spikeA: 'hazard', spikeB: 'hazard',
        // checkpoint + goal moved out of hazards (they aren't damaging
        // — they're level-flow anchors) into their own FLOW category.
        checkpoint: 'flow', goal: 'flow', mackenzie: 'flow',
        'npc-cow': 'animals', 'npc-sheep': 'animals', 'npc-chicken': 'animals',
        coin: 'objects', qblock: 'objects', cblock: 'objects', trophy: 'objects', ember: 'objects', marsbar: 'objects', 'pu-rapid': 'objects', 'pu-big': 'objects', 'pu-bomb': 'objects', 'pu-drum': 'objects', 'pu-invincible': 'objects', 'pu-chargerefresh': 'objects', 'pu-extrajump': 'objects', 'pu-shield': 'objects', 'pu-heal': 'objects',
        enemy0: 'enemies', enemy1: 'enemies', enemy2: 'enemies', enemy3: 'enemies',
        enemy4: 'enemies', enemy5: 'enemies', enemy6: 'enemies', enemy7: 'enemies', enemy8: 'enemies',
        enemy9: 'enemies', enemy10: 'enemies', enemy11: 'enemies', enemy12: 'enemies', enemyE: 'enemies',
        bossMini: 'enemies', bossBig: 'enemies', bossSummon: 'enemies', bossJugg: 'enemies', bossHoard: 'enemies',
        sign: 'info', text: 'info', 'hl-up': 'info', 'hl-down': 'info', 'hl-left': 'info', 'hl-right': 'info', 'hl-circle': 'info', 'hl-box': 'info', pan: 'info'
      };
      document.querySelectorAll('.bl-cat').forEach(el => el.classList.remove('active'));
      const catId = 'blcat-' + (catMap[t] || '');
      const catEl = document.getElementById(catId); if (catEl) catEl.classList.add('active');
      if (catMap[t]) BLD._autoPanelCat = catMap[t];
      // Show speed slider only for moving platform tool
      const showSpeed = t === 'moving';
      const _spw = document.getElementById('bl-movespeed-wrap'); if (_spw) _spw.style.display = showSpeed ? 'flex' : 'none';
      // Show bounce rot only for bounce tool
      const brotEl = document.getElementById('bl-bounce-rot');
      if (brotEl) brotEl.style.display = t === 'bounce' ? '' : 'none';
      // Show colorbar only for terrain tools; sync pickers to theme palette
      const terrainTools = ['platform', 'ice', 'soundwave', 'oneway', 'crumble', 'breakshot', 'moving', 'switchA', 'switchB'];
      const colorbar = document.getElementById('builder-colorbar');
      if (colorbar) colorbar.style.display = terrainTools.includes(t) ? 'flex' : 'none';
      // Sync color pickers to current theme palette when switching to terrain tool
      if (terrainTools.includes(t) && BLD.levelData) {
        const pc = BLD.levelData.platColors || ['#1a3010', '#243a18', '#3a7a28', '#4a9a32', '#5ab840'];
        for (let i = 0; i < 5; i++) { const el = document.getElementById('bl-col' + i); if (el && pc[i]) el.value = String(pc[i]); }
        const st = document.getElementById('bl-color-status');
        if (st) st.textContent = '◆ PALETTE MODE — affects new terrain';
        BLD._colorTarget = null; // clear any individual selection
      }
      // UX: after choosing a tool, collapse open flyout/settings until cursor returns near sidebar.
      BLD.closeCategoryPanels();
      document.querySelectorAll('.bl-cat').forEach(el => el.classList.remove('active'));
      if (catMap[t]) {
        const activeBtn = document.getElementById('blcat-' + catMap[t]);
        if (activeBtn) activeBtn.classList.add('active');
      }
      BLD.toggleSettingsPanel(false);
      // SMM2 recent-parts strip: remember this pick.
      if (BLD.pushRecentTool) BLD.pushRecentTool(t);
    },
  };
  // ── Exports ────────────────────────────────────────────────────
  // Hundreds of inline onclick="UI.X(...)" attributes in the HTML
  // body resolve via window.UI at click time.
  window.UI = UI;
  window.GameUI = UI;
})();
