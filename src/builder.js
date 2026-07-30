// src/builder.js
// ──────────────────────────────────────────────────────────────────
// Level builder controller. The `BLD` namespace — tool selection,
// snap/grid toggles, level-data CRUD operations, test-play hook,
// JSON import/export, undo/redo, gamepad navigation, etc.
//
// Referenced by:
//   - inline `onclick="BLD.X(...)"` attributes in the builder toolbar
//   - src/ui.js (UI.openBuilder etc.)
//   - the inline ESC-key handler (closes settings panel)
//
// Reads/calls many engine globals via window: getLevelData, WORLDS,
// player, frameCount, sfx, applyThemeToLevel, …
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  var BLD = {       // var so window.BLD is live for src/ui.js
    levelData: null, tool: 'platform', scrollX: 0,
    dragStart: null, isDragging: false, previewRect: null,
    undoStack: [], SNAP: 16, SIDEBAR: 0, theme: 'highland',
    zoom: 1, ZOOM_MIN: 0.4, ZOOM_MAX: 2.5,
    // Snap defaults on (16-px grid). Grid lines off by default — toggle
    // both from the new top toolbar.
    snapOn: true, gridVisible: false,
    _hoverObj: null, _moveObj: null, _moveDragStart: null, _moveObjStart: null,
    _resizeCorner: null, _resizeObj: null, _resizeObjStart: null,
    _spikeRotation: 0, _bounceRotation: 0, _rotatingObj: null, _rotStartAngle: 0, _colorTarget: null,
    _selection: [], _boxSelect: null, _boxSelectStart: null,
    _autoPanelCat: 'terrain', _settingsPinned: false,
    // Tab-cycling state for stacked objects under the cursor. When the
    // user Tabs through overlapping items, we cache the ranked list +
    // current index so successive Tabs walk the stack until the cursor
    // moves (which invalidates the cache).
    _lastCursorWX: 0, _lastCursorWY: 0,
    _stackCycle: null, _stackCycleAt: null,

    // ── New toolbar wires ──────────────────────────────────────
    onNameInput(v) {
      if (!this.levelData) return;
      this.levelData.name = String(v || '').slice(0, 32);
      this.updateInfo && this.updateInfo();
    },
    toggleSnap() {
      this.snapOn = !this.snapOn;
      const btn = document.getElementById('btn-bld-snap');
      if (btn) btn.classList.toggle('on', this.snapOn);
      this.showInfo && this.showInfo(this.snapOn ? 'SNAP ON · 16px GRID' : 'SNAP OFF — FREE PLACEMENT');
    },
    toggleGridVis() {
      this.gridVisible = !this.gridVisible;
      const btn = document.getElementById('btn-bld-grid');
      if (btn) btn.classList.toggle('on', this.gridVisible);
      this.showInfo && this.showInfo(this.gridVisible ? 'GRID LINES VISIBLE' : 'GRID HIDDEN');
    },
    refreshTopbarFromLevel() {
      // Push level name / dimensions into the toolbar info chip.
      // Called after newLevel / load / paste / dimension edits.
      const ld = this.levelData;
      const nameEl = document.getElementById('bld-tb-name');
      const dimsEl = document.getElementById('bld-tb-dims');
      if (nameEl) nameEl.value = ld?.name || '';
      if (dimsEl) {
        const w = ld?.width || 0;
        const h = ld?.height || ld?.voidY || 0;
        dimsEl.textContent = `${w} × ${h}`;
      }
    },

    setZoom(z, anchorCx, anchorCy) {
      const oldZ = this.zoom;
      const newZ = Math.max(this.ZOOM_MIN, Math.min(this.ZOOM_MAX, +z || 1));
      if (newZ === oldZ) { this._updateZoomLabel(); return; }
      // Anchor zoom around given canvas point so it stays put while zooming
      if (anchorCx != null && anchorCy != null) {
        const wxBefore = (anchorCx - this.SIDEBAR) / oldZ + this.scrollX;
        const wyBefore = anchorCy / oldZ + (this.scrollY || 0);
        this.zoom = newZ;
        this.scrollX = wxBefore - (anchorCx - this.SIDEBAR) / newZ;
        this.scrollY = wyBefore - anchorCy / newZ;
      } else {
        this.zoom = newZ;
      }
      this._clampScroll();
      this._updateZoomLabel();
    },
    zoomBy(dir) {
      const steps = [0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2, 2.5];
      const idx = steps.findIndex(s => Math.abs(s - this.zoom) < 0.01);
      let next = idx >= 0 ? idx + (dir > 0 ? 1 : -1) : (dir > 0 ? steps.findIndex(s => s > this.zoom) : steps.length - 1 - [...steps].reverse().findIndex(s => s < this.zoom));
      next = Math.max(0, Math.min(steps.length - 1, next));
      this.setZoom(steps[next], (W + this.SIDEBAR) / 2, H / 2);
    },
    _clampScroll() {
      if (!this.levelData) return;
      const visW = (W - this.SIDEBAR) / this.zoom;
      const visH = H / this.zoom;
      const maxX = Math.max(0, this.levelData.width - visW);
      const maxY = Math.max(0, (this.levelData.height || 560) - visH);
      this.scrollX = Math.max(0, Math.min(maxX, this.scrollX));
      this.scrollY = Math.max(0, Math.min(maxY, this.scrollY || 0));
    },
    _updateZoomLabel() {
      const el = document.getElementById('builder-zoom');
      if (el) el.textContent = Math.round(this.zoom * 100) + '%';
    },

    newLevel() {
      this.undoStack = []; this.scrollX = 0; this.scrollY = 0; this.zoom = 1; this._updateZoomLabel(); this.theme = 'highland';
      this.levelData = {
        name: 'CUSTOM LEVEL', width: 3200,
        platforms: [],  // Start empty — use ADD GROUND button or place platforms manually
        enemies: [], coins: [], qblocks: [], spikes: [], bounces: [], icePlats: [], checkpoints: [], movingPlats: [], switches: [],
        goalX: 3100, goalY: 310, timePar: 240, timeGold: 180, weather: 'none'
      };
      applyThemeToLevel(this.levelData, 'highland');
      const n = document.getElementById('bl-name'), bw = document.getElementById('bl-width'), bt = document.getElementById('bl-theme'), bwe = document.getElementById('bl-weather');
      if (n) n.value = 'CUSTOM LEVEL'; if (bw) bw.value = '3200'; if (bt) bt.value = 'highland'; if (bwe) bwe.value = 'none';
      this.updateInfo();
      this.refreshTopbarFromLevel();
    },
    closeCategoryPanels() {
      ['terrain', 'hazard', 'flow', 'animals', 'objects', 'enemies', 'info'].forEach(c => {
        const panel = document.getElementById('blpanel-' + c);
        if (panel) panel.style.display = 'none';
      });
      this._openCat = null;
    },
    toggleSettingsPanel(force) {
      const bar = document.getElementById('builder-bar');
      if (!bar) return;
      const show = force === undefined ? bar.style.display !== 'flex' : !!force;
      bar.style.display = show ? 'flex' : 'none';
      this._settingsPinned = show;
    },
    handleAutoPanels(clientX, clientY, canvasX, canvasY) {
      // SMM2-style bottom palette (Builder 2.0): drop the cursor toward the
      // bottom edge and the part dock rises; move back up into the level and
      // it hides so it never covers what you're building. Hovering the dock
      // or tab bar fires no canvas pointermove (DOM captures it), so the
      // palette stays put while you're actually picking a part. Hysteresis
      // between OPEN/CLOSE avoids flicker at the boundary.
      if (GS !== 'builder') return;
      const H_ = (typeof H === 'number' && H) ? H : 540;
      const OPEN_AT  = H_ - 100;   // cursor below this → reveal dock
      const CLOSE_AT = H_ - 150;   // cursor above this → hide dock
      if (canvasY >= OPEN_AT) {
        const target = this._autoPanelCat || this._openCat || 'terrain';
        if (this._openCat !== target) this.openCat(target, false);
      } else if (canvasY < CLOSE_AT && this._openCat) {
        this.closeCategoryPanels();
        document.querySelectorAll('.bl-cat').forEach(el => el.classList.remove('active'));
      }
    },
    // Count every placed object across the level arrays — shown in the
    // palette as an SMM2-style part counter.
    partCount() {
      const ld = this.levelData;
      if (!ld) return 0;
      const keys = ['platforms', 'icePlats', 'bounces', 'movingPlats', 'spikes',
        'enemies', 'coins', 'qblocks', 'cblocks', 'marsBarPieces', 'spiritEmbers',
        'trophies', 'powerupItems', 'checkpoints', 'npcs', 'allies', 'signs',
        'texts', 'highlights', 'switches'];
      let n = 0;
      for (const k of keys) if (Array.isArray(ld[k])) n += ld[k].length;
      // The full-width ground platform[0] is scenery, not a "part".
      return n;
    },
    updatePartCount() {
      const el = document.getElementById('bl-partcount');
      if (el) el.textContent = this.partCount();
    },
    // Recent-parts strip: remember the last few tools chosen so they're
    // one tap away regardless of which category they live in.
    _recentTools: [],
    pushRecentTool(t) {
      if (!t || t === 'pan') return;
      const r = this._recentTools.filter(x => x !== t);
      r.unshift(t);
      this._recentTools = r.slice(0, 6);
      this.renderRecentTools();
    },
    renderRecentTools() {
      const wrap = document.getElementById('bl-recent');
      if (!wrap) return;
      if (!this._recentTools.length) { wrap.style.display = 'none'; return; }
      wrap.style.display = 'flex';
      // Clone the visual of each source tool button so the recent chip
      // shows the same glyph; clicking re-selects that tool.
      wrap.innerHTML = '<span class="bl-recent-lbl">RECENT</span>' +
        this._recentTools.map(t => {
          const src = document.getElementById('bl-' + t);
          const glyph = src ? (src.childNodes[0] && src.childNodes[0].nodeValue || '').trim() : '';
          const lbl = src ? (src.querySelector('span') ? src.querySelector('span').textContent : '') : t;
          return '<div class="bl-recent-chip" onclick="UI.setTool(\'' + t + '\')" title="' + lbl + '">' + (glyph || '▩') + '</div>';
        }).join('');
    },
    setWidth(w) {
      if (!this.levelData) return;
      this.levelData.width = Math.max(900, Math.min(8000, w));
      if (this.levelData.platforms[0]) this.levelData.platforms[0].w = this.levelData.width;
      this.refreshTopbarFromLevel();
    },
    setHeight(h_) {
      if (!this.levelData) return;
      this.levelData.height = Math.max(560, Math.min(2000, h_));
      this.scrollY = 0; // reset vertical scroll when changing height
      this.updateInfo();
      this.showInfo('HEIGHT: ' + h_ + 'px — scroll down in builder to see void zone');
    },
    setVoidY(y) {
      if (!this.levelData) return;
      this.levelData.voidY = Math.max(100, Math.min(2000, y));
      this.updateInfo();
    },
    setMusic(track) {
      if (!this.levelData) return;
      this.levelData.music = track || null;
      this.showInfo(track ? 'MUSIC: ' + track : 'MUSIC: Auto');
    },
    // ── Builder 2.0 course rules ────────────────────────────────────
    setAutoScroll(v) {
      if (!this.levelData) return;
      const px = Math.max(0, parseFloat(v) || 0);
      this.levelData.autoScroll = px;
      this.showInfo(px > 0 ? '→ AUTOSCROLL ' + px.toFixed(1) + ' px/frame' : 'AUTOSCROLL OFF');
    },
    setTimeLimit(s) {
      if (!this.levelData) return;
      const sec = Math.max(0, Math.min(999, Math.floor(+s || 0)));
      this.levelData.timeLimit = sec;
      this.showInfo(sec > 0 ? '⏱ TIME LIMIT ' + sec + 's' : 'NO TIME LIMIT');
    },
    setWeather(weatherType) {
      if (!this.levelData) return;
      this.levelData.weather = getLevelWeather({ weather: weatherType });
      this.showInfo('WEATHER: ' + this.levelData.weather.toUpperCase());
    },
    setTheme(t) {
      if (!this.levelData) return;
      this.theme = applyThemeToLevel(this.levelData, t);
      // Sync color pickers to new theme
      const pc = this.levelData.platColors;
      for (let i = 0; i < 5; i++) { const el = document.getElementById('bl-col' + i); if (el && pc[i]) el.value = String(pc[i]); }
      this._colorTarget = null; // clear individual selection when theme changes
      const st = document.getElementById('bl-color-status');
      if (st) st.textContent = '◆ THEME: ' + this.theme.toUpperCase() + ' — palette updated';
    },
    snap(v) {
      // Snap toggle: when off, return the raw value so placement and
      // resizing are pixel-precise. When on (default) round to SNAP=16.
      if (!this.snapOn) return Math.round(v);
      return Math.round(v / this.SNAP) * this.SNAP;
    },
    canvasToWorld(cx, cy) {
      const z = this.zoom || 1;
      return { x: this.snap((cx - this.SIDEBAR) / z + this.scrollX), y: this.snap(cy / z + (this.scrollY || 0)) };
    },
    worldToCanvas(wx, wy) {
      const z = this.zoom || 1;
      return { x: (wx - this.scrollX) * z + this.SIDEBAR, y: (wy - (this.scrollY || 0)) * z };
    },
    saveState() {
      this.undoStack.push(JSON.stringify(this.levelData));
      if (this.undoStack.length > 30) this.undoStack.shift();
      // Any edit invalidates a prior "beat-to-save" verification.
      if (this.levelData && this.levelData._verified) { this.levelData._verified = false; this._syncVerifyPill(); }
    },
    // ── Builder 2.0: clear conditions + beat-to-save ────────────────
    setClearCondition(v) {
      if (!this.levelData) return;
      this.levelData.clearCondition = v || 'goal';
      // Editing the win rule un-verifies the course.
      this.levelData._verified = false; this._syncVerifyPill();
      const cnt = document.getElementById('bl-clearcount-wrap');
      if (cnt) cnt.style.display = (v === 'coins') ? 'flex' : 'none';
      const names = { goal: 'Reach the goal', defeatAll: 'Defeat all foes', coins: 'Collect N coins', embers: 'Collect all embers' };
      this.showInfo('🎯 CLEAR: ' + (names[v] || 'Reach the goal'));
    },
    setClearCount(n) {
      if (!this.levelData) return;
      this.levelData.clearCount = Math.max(1, Math.min(999, Math.floor(+n || 0)));
      this.levelData._verified = false; this._syncVerifyPill();
    },
    markVerified() { this._syncVerifyPill(); this.showInfo('✓ COURSE VERIFIED — you can now export'); },
    _syncVerifyPill() {
      const pill = document.getElementById('bl-verify-pill');
      if (!pill) return;
      const ok = !!(this.levelData && this.levelData._verified);
      pill.textContent = ok ? '✓ VERIFIED' : '⚠ UNVERIFIED';
      pill.classList.toggle('ok', ok);
    },
    undo() { if (this.undoStack.length) { this.levelData = JSON.parse(this.undoStack.pop()); this.updateInfo(); } },
    deleteAt(wx, wy) {
      const r = 24, ld = this.levelData;
      // Ground carve: right-click on ground to punch holes
      if (wy >= 430 && wy <= 472) {
        for (let gi = ld.platforms.length - 1; gi >= 0; gi--) {
          const gp = ld.platforms[gi];
          if (gp.y >= 440 && (gp.w || 0) > 100 && !gp.type && gp.x <= wx && gp.x + (gp.w || 0) >= wx) {
            this.saveState();
            const hW = 96, hx = this.snap(wx - hW / 2), segs = [];
            if (hx > gp.x + 16) segs.push({ x: gp.x, y: gp.y, w: hx - gp.x, h: gp.h || 60 });
            const rx = hx + hW;
            if (rx < gp.x + (gp.w || 0) - 16) segs.push({ x: rx, y: gp.y, w: gp.x + (gp.w || 0) - rx, h: gp.h || 60 });
            ld.platforms.splice(gi, 1, ...segs);
            this.updateInfo(); return;
          }
        }
      }
      ld.coins = ld.coins.filter(c => Math.abs(c.x - wx) > r || Math.abs(c.y - wy) > r);
      ld.qblocks = ld.qblocks.filter(q => Math.abs(q.x - wx) > r || Math.abs(q.y - wy) > r);
      ld.enemies = ld.enemies.filter(e => Math.abs(e.x - wx) > r || Math.abs(e.y - wy) > r);
      if (ld.spikeBlocks) ld.spikeBlocks = ld.spikeBlocks.filter(s => !(wx >= s.x && wx <= s.x + (s.w || 60) && wy >= s.y - 14 && wy <= s.y + (s.h || 16) + 4));
      if (ld.cblocks) ld.cblocks = ld.cblocks.filter(cb => Math.abs(cb.x + 14 - wx) > r || Math.abs(cb.y + 14 - wy) > r);
      if (ld.trophies) ld.trophies = ld.trophies.filter(t => Math.abs(t.x + 12 - wx) > r || Math.abs(t.y + 12 - wy) > r);
      if (ld.spiritEmbers) ld.spiritEmbers = ld.spiritEmbers.filter(e => Math.abs(e.x + 10 - wx) > r || Math.abs(e.y + 10 - wy) > r).map((e, i) => ({ ...e, idx: i }));
      if (ld.marsBarPieces) { ld.marsBarPieces = ld.marsBarPieces.filter(m => Math.abs(m.x - wx) > r || Math.abs(m.y - wy) > r); ld.marsBarPieces.forEach((m, i) => { m.idx = i; }); }
      if (ld.powerupItems) ld.powerupItems = ld.powerupItems.filter(p => Math.abs(p.x + 14 - wx) > r || Math.abs(p.y + 14 - wy) > r);
      if (ld.spikes) ld.spikes = ld.spikes.filter(sp => wx < sp.x || wx > sp.x + (sp.w || 48) || wy < sp.y || wy > sp.y + (sp.h || 16));
      if (ld.checkpoints) ld.checkpoints = ld.checkpoints.filter(cp => Math.abs(cp.x - wx) > r || Math.abs(cp.y - wy) > r * 2);
      if (ld.allies) ld.allies = ld.allies.filter(a => Math.abs(a.x + 18 - wx) > 24 || Math.abs(a.y + 15 - wy) > 22);
      if (ld.npcs) ld.npcs = ld.npcs.filter(n => {
        const def = NPC_VARIANTS[n.type]; if (!def) return true;
        return wx < n.x - 4 || wx > n.x + def.w + 4 || wy < n.y - 4 || wy > n.y + def.h + 4;
      });
      if (ld.icePlats) ld.icePlats = ld.icePlats.filter(p => wx < p.x || wx > p.x + (p.w || 55) || wy < p.y || wy > p.y + (p.h || 18));
      if (ld.bounces) ld.bounces = ld.bounces.filter(p => wx < p.x || wx > p.x + (p.w || 50) || wy < p.y || wy > p.y + (p.h || 14));
      if (ld.movingPlats) ld.movingPlats = ld.movingPlats.filter(mp => wx < (mp._cx || mp.x) || wx > (mp._cx || mp.x) + (mp.w || 60) || wy < (mp._cy || mp.y) || wy > (mp._cy || mp.y) + (mp.h || 14));
      if (ld.switches) ld.switches = ld.switches.filter(sw => Math.abs(sw.x + 12 - wx) > 20 || Math.abs(sw.y + 12 - wy) > 20);
      // Signs — delete by clicking inside the sign rect
      if (ld.signs) ld.signs = ld.signs.filter(s => !(wx >= s.x && wx <= s.x + (s.w || 240) && wy >= s.y && wy <= s.y + (s.h || 60)));
      // Free-text labels — delete by clicking inside the text bounding box
      if (ld.texts) ld.texts = ld.texts.filter(t => {
        if (!t || t.x == null) return false;
        const size = Math.max(6, Math.min(72, +t.size || 14));
        const lines = String(t.text || '').split(/\\n|\n/);
        const lineH = Math.round(size * 1.3);
        const maxLine = lines.reduce((m, l) => Math.max(m, l.length), 0);
        const w = Math.max(40, maxLine * size * 0.85);
        const h = Math.max(size, lines.length * lineH);
        return !(wx >= t.x && wx <= t.x + w && wy >= t.y && wy <= t.y + h + 4);
      });
      // Highlights — delete by clicking inside their hit-test region
      if (ld.highlights) ld.highlights = ld.highlights.filter(h => {
        if (!h) return false;
        if (h.type === 'box') return !(wx >= h.x && wx <= h.x + (h.w || 60) && wy >= h.y && wy <= h.y + (h.h || 60));
        if (h.type === 'circle') {
          const rr = (h.r || 22) + 6;
          return Math.hypot(wx - h.x, wy - h.y) > rr;
        }
        // Arrow types — small circular hit box around the anchor
        return Math.hypot(wx - h.x, wy - (h.y || 0)) > 22;
      });
      ld.platforms = ld.platforms.filter((p, i) => {
        if (p.y >= 440 && p.h >= 40 && p.w > 400) return true; // protect main ground
        return wx < p.x || wx > p.x + (p.w || 80) || wy < p.y || wy > p.y + (p.h || 18);
      });
    },
    placeAt(cx, cy) {
      const { x: wx, y: wy } = this.canvasToWorld(cx, cy);
      if (!this.levelData || wx < 0 || wx > this.levelData.width || wy < 0 || wy > 490) return;
      this.saveState();
      // tool-id → enemy template. Keep ordering aligned with the
      // FOE palette in index.html. Newer enemies (v=12 turret, v=13
      // teleporter, v=14 berserker) + bosses are listed at the end.
      // Bosses get explicit w/h since they render at non-default size.
      const eMap = {
        enemy0:  { v: 0,  hp: 3 },
        enemy1:  { v: 3,  hp: 4 },
        enemy2:  { v: 4,  hp: 4 },
        enemy3:  { v: 5,  hp: 5 },
        enemy4:  { v: 7,  hp: 6 },
        enemy5:  { v: 8,  hp: 5 },
        enemy6:  { v: 9,  hp: 4 },
        enemy7:  { v: 10, hp: 5 },
        enemy8:  { v: 11, hp: 55 },
        enemy9:  { v: 12, hp: 6 },               // TURRET
        enemy10: { v: 13, hp: 3 },               // TELEPORTER
        enemy11: { v: 14, hp: 6 },               // BERSERKER
        enemy12: { v: 15, hp: 3 },               // CUTPURSE (coin thief)
        enemyE:  { v: 0,  hp: 4, elite: true },
        bossMini:{ v: 6,  hp: 12 },                  // World-themed mini-boss
        bossBig: { v: 99, hp: 30, w: 64, h: 64 },    // Scaled drum mega-boss
        bossSummon: { v: 98, hp: 40, w: 64, h: 64 }, // Floating SUMMONER
        bossJugg:   { v: 97, hp: 46, w: 64, h: 64 }, // Armored JUGGERNAUT
        bossHoard:  { v: 96, hp: 42, w: 64, h: 64 }  // Coin Hoarder (economy boss)
      };
      const allPlats = [...(this.levelData.platforms || []), ...(this.levelData.icePlats || []), ...(this.levelData.bounces || [])];
      const onTerrain = allPlats.some(p => wx >= p.x && wx <= p.x + (p.w || 70) && wy >= p.y - 8 && wy <= p.y + (p.h || 18) + 8);

      if (this.tool in eMap) {
        // Enemies: snap to platform surface if nearby. Bosses are
        // taller than the default 40 px sprite — use the template's
        // own h so a 64-tall mega boss sits flush on the platform
        // instead of clipping into it.
        const tpl = eMap[this.tool];
        const spriteH = tpl.h || 40;
        let snapY = wy;
        for (const p of allPlats) {
          if (wx >= p.x && wx <= p.x + (p.w || 70) && Math.abs(wy - p.y) < 60) {
            snapY = p.y - spriteH;
            break;
          }
        }
        this.levelData.enemies.push({ x: wx, y: snapY, ...tpl });
      } else if (this.tool === 'coin') {
        this.levelData.coins.push({ x: wx, y: wy });
      } else if (this.tool === 'trophy') {
        if (!this.levelData.trophies) this.levelData.trophies = [];
        this.levelData.trophies.push({ x: wx, y: wy, collected: false });
      } else if (this.tool === 'marsbar') {
        if (!this.levelData.marsBarPieces) this.levelData.marsBarPieces = [];
        if (this.levelData.marsBarPieces.length >= 5) { this.showInfo('Max 5 Mars Bar pieces per level'); return; }
        this.saveState();
        this.levelData.marsBarPieces.push({ x: wx - 10, y: wy - 10, collected: false, idx: 0 });
        this.levelData.marsBarPieces.forEach((m, i) => { m.idx = i; });
        this.showInfo('?? MARS BAR #' + this.levelData.marsBarPieces.length + ' placed');
        this.updateInfo();
      } else if (this.tool === 'ember') {
        if (!this.levelData.spiritEmbers) this.levelData.spiritEmbers = [];
        if (this.levelData.spiritEmbers.length >= 3) { this.showInfo('MAX 3 SPIRIT EMBERS PER LEVEL'); return; }
        const idx = this.levelData.spiritEmbers.length;
        this.levelData.spiritEmbers.push({ x: wx, y: wy, collected: false, idx: idx });
      } else if (this.tool.startsWith('pu-')) {
        const puT = this.tool.slice(3);
        if (!this.levelData.powerupItems) this.levelData.powerupItems = [];
        this.levelData.powerupItems.push({ x: wx, y: wy, type: puT, collected: false });
      } else if (this.tool === 'qblock') {
        this.levelData.qblocks.push({ x: wx, y: wy });
      } else if (this.tool === 'cblock') {
        if (!this.levelData.cblocks) this.levelData.cblocks = [];
        this.levelData.cblocks.push({ x: wx, y: wy, hits: 3, bumpTimer: 0 });
      } else if (this.tool === 'goal') {
        this.levelData.goalX = wx; this.levelData.goalY = wy - 70;
      } else if (this.tool === 'spike' || this.tool === 'spikeA' || this.tool === 'spikeB') {
        if (!this.levelData.spikes) this.levelData.spikes = [];
        const spikeType = this.tool === 'spike' ? 'static' : this.tool === 'spikeA' ? 'popA' : 'popB';
        this.levelData.spikes.push({ x: wx, y: wy, w: 48, h: 16, rotation: 0, spikeType });
      } else if (this.tool === 'spikeBlockA' || this.tool === 'spikeBlockB') {
        if (!this.levelData.spikeBlocks) this.levelData.spikeBlocks = [];
        const grp = this.tool === 'spikeBlockA' ? 'A' : 'B';
        const spd = parseInt(document.getElementById('bl-sbspeed')?.value || '120');
        this.levelData.spikeBlocks.push({ x: this.snap(wx), y: this.snap(wy), w: 60, h: 16, spikeGroup: grp, period: spd, phase: 0 });
      } else if (this.tool === 'checkpoint') {
        if (!this.levelData.checkpoints) this.levelData.checkpoints = [];
        this.levelData.checkpoints.push({ x: wx, y: wy, activated: false });
      } else if (this.tool === 'mackenzie') {
        // Place Mackenzie the Shetland Sheepdog. She lives in ld.allies
        // so we don't collide with the existing enemy / coin slots.
        if (!this.levelData.allies) this.levelData.allies = [];
        this.levelData.allies.push({
          type: 'mackenzie', x: this.snap(wx), y: this.snap(wy),
          hp: 3, maxHp: 3, attached: false, riding: false,
          facingRight: true, vx: 0, vy: 0, onGround: false,
          _frame: 0, _tongue: 0, _tail: 0, _attackCd: 0,
          _invuln: 0, _dead: false, _heartCd: 0, _name: 'Mackenzie',
        });
        this.showInfo('🐕 MACKENZIE placed — collide to befriend');
      } else if (this.tool === 'npc-cow' || this.tool === 'npc-sheep' || this.tool === 'npc-chicken') {
        // Ambient NPC — wanders, pettable, never hurts the player.
        if (!this.levelData.npcs) this.levelData.npcs = [];
        const npcType = this.tool.slice(4);              // strip 'npc-'
        const def = NPC_VARIANTS[npcType];
        this.levelData.npcs.push({
          type: npcType, x: this.snap(wx), y: this.snap(wy),
          facingRight: true, vy: 0,
          _frame: 0, _spawnX: null, _wanderDir: Math.random() < 0.5 ? -1 : 1,
          _grazing: false, _wanderTimer: 0,
          _happy: 0, _petCd: 0,
        });
        this.showInfo((npcType === 'cow' ? '🐄' : npcType === 'sheep' ? '🐑' : '🐔') +
          ' ' + npcType.toUpperCase() + ' placed');
      } else if (this.tool === 'switch') {
        if (!this.levelData.switches) this.levelData.switches = [];
        const g = document.getElementById('bl-swgroup')?.value || 'A';
        this.levelData.switches.push({ x: wx, y: wy, w: 28, h: 28, switchGroup: g, _hit: false, _hitTimer: 0 });
        this.showInfo('SWITCH placed — group ' + g);
      } else if (this.tool === 'magnetic') {
        // Click-place: 32×32 magnet block with a 120-px pull radius.
        this.levelData.platforms.push({ x: wx, y: wy, w: 32, h: 32, type: 'magnetic', radius: 120, pull: 0.55 });
        this.showInfo('🧲 MAGNETIC BLOCK placed (radius 120)');
      } else if (this.tool === 'rotating') {
        // Click-place: 80×16 orbital platform around the drop point.
        this.levelData.platforms.push({
          x: wx, y: wy, w: 80, h: 16, type: 'rotating',
          cx: wx + 40, cy: wy + 8, radius: 80, speed: 0.018, startAngle: 0,
          _id: Math.random().toString(36).slice(2),
        });
        this.showInfo('🌀 ROTATING PLATFORM placed');
      } else if (this.tool === 'grapplehook') {
        // Click-place: 24×24 grapple-target block (drone-bagpipe hooks onto it).
        this.levelData.platforms.push({ x: wx, y: wy, w: 24, h: 24, type: 'grapplehook' });
        this.showInfo('⚓ GRAPPLE HOOK placed — drone bagpipe targets this');
      } else if (this.tool === 'text') {
        // Free-form text label. Glass dialog replaces window.prompt —
        // place position is captured here, then the editor populates
        // the text on Save (or aborts the placement on Cancel).
        if (!this.levelData.texts) this.levelData.texts = [];
        const placeX = wx, placeY = wy;
        const ldRef = this.levelData;
        const self = this;
        TextEditor.open({
          target: null,
          defaultText: 'HELLO',
          defaultSize: 14,
          defaultColor: '#e8f6ff',
          titleText: 'NEW TEXT',
          onSave: ({ text, size, color }) => {
            ldRef.texts.push({
              x: placeX, y: placeY,
              text: (text || '').slice(0, 200),
              size, color,
            });
            self.showInfo('🔠 TEXT placed');
            self.updateInfo();
          },
        });
        return;  // updateInfo / showInfo called via callback on Save
      } else if (this.tool === 'sign') {
        // Place a text sign and immediately prompt for content
        if (!this.levelData.signs) this.levelData.signs = [];
        const titleIn = (window.prompt('Sign title (leave blank for none):', '') || '').slice(0, 24);
        const bodyIn = window.prompt('Sign body — use \\n for new lines:', 'PRESS  Q  TO SHOOT.\\nHOLD  Q  TO\\nAUTO-FIRE.');
        if (bodyIn == null) return; // user cancelled — no placement
        const lines = bodyIn.split(/\\n|\n/).map(s => s.slice(0, 32));
        // Auto-size width based on longest line (Press Start 2P at 11px ≈ 10 px / glyph)
        const longest = lines.reduce((m, l) => Math.max(m, l.length), titleIn.length);
        const w = Math.max(220, Math.min(440, longest * 10 + 24));
        const h = lines.length * 18 + (titleIn ? 32 : 14);
        this.levelData.signs.push({
          x: wx, y: wy, w, h, title: titleIn || null, lines, color: '#e8f6ff', align: 'left',
        });
        this.showInfo('📜 SIGN placed — click it later to edit');
      } else if (this.tool === 'hl-up' || this.tool === 'hl-down' || this.tool === 'hl-left' || this.tool === 'hl-right') {
        if (!this.levelData.highlights) this.levelData.highlights = [];
        const dir = this.tool.slice(3); // 'up' | 'down' | 'left' | 'right'
        const labelIn = (window.prompt('Optional label (blank = none):', '') || '').slice(0, 16);
        this.levelData.highlights.push({
          type: 'arrow-' + dir, x: wx, y: wy,
          label: labelIn || null, color: '#ffd54a',
        });
        this.showInfo('➤ ARROW ' + dir.toUpperCase() + ' placed');
      } else if (this.tool === 'hl-circle') {
        if (!this.levelData.highlights) this.levelData.highlights = [];
        this.levelData.highlights.push({ type: 'circle', x: wx, y: wy, r: 22, color: '#ffd54a', label: null });
        this.showInfo('◯ CIRCLE placed — drag to move, right-click to delete');
      }
      // (hl-box uses startDrag flow — see below)
      this.updateInfo();
    },
    startDrag(cx, cy) { if (['platform', 'ice', 'bounce', 'soundwave', 'oneway', 'crumble', 'breakshot', 'moving', 'switchA', 'switchB', 'hl-box', 'conveyor', 'timed', 'fallaway', 'windtunnel', 'water'].includes(this.tool)) { const { x, y } = this.canvasToWorld(cx, cy); this.dragStart = { x, y }; this.isDragging = true; } },
    updateDrag(cx, cy) {
      if (this.isDragging && ['platform', 'ice', 'bounce', 'soundwave', 'oneway', 'crumble', 'breakshot', 'moving', 'switchA', 'switchB', 'hl-box', 'conveyor', 'timed', 'fallaway', 'windtunnel', 'water'].includes(this.tool)) {
        const { x, y } = this.canvasToWorld(cx, cy), { x: sx, y: sy } = this.dragStart;
        this.previewRect = { x: Math.min(sx, x), y: Math.min(sy, y), w: Math.max(16, Math.abs(x - sx)), h: Math.max(8, Math.abs(y - sy)) };
      }
    },
    endDrag(cx, cy) {
      if (this.isDragging && this.tool === 'hl-box' && this.dragStart) {
        const { x, y } = this.canvasToWorld(cx, cy), { x: sx, y: sy } = this.dragStart;
        const rx = Math.min(sx, x), ry = Math.min(sy, y), rw = Math.max(20, Math.abs(x - sx)), rh = Math.max(20, Math.abs(y - sy));
        this.saveState();
        if (!this.levelData.highlights) this.levelData.highlights = [];
        this.levelData.highlights.push({ type: 'box', x: rx, y: ry, w: rw, h: rh, color: '#ffd54a', label: null });
        this.previewRect = null; this.isDragging = false; this.dragStart = null;
        this.showInfo('▭ BOX placed');
        return;
      }
      if (this.isDragging && ['platform', 'ice', 'bounce', 'soundwave', 'oneway', 'crumble', 'breakshot', 'moving', 'switchA', 'switchB', 'conveyor', 'timed', 'fallaway', 'windtunnel', 'water'].includes(this.tool) && this.dragStart) {
        const { x, y } = this.canvasToWorld(cx, cy), { x: sx, y: sy } = this.dragStart;
        const rx = Math.min(sx, x), ry = Math.min(sy, y), rw = Math.max(16, Math.abs(x - sx)), rh = Math.max(8, Math.abs(y - sy));
        if (rw >= 16) {
          this.saveState();
          if (this.tool === 'ice') { if (!this.levelData.icePlats) this.levelData.icePlats = []; this.levelData.icePlats.push({ x: rx, y: ry, w: rw, h: Math.max(8, rh) }); }
          else if (this.tool === 'bounce') { if (!this.levelData.bounces) this.levelData.bounces = []; this.levelData.bounces.push({ x: rx, y: ry, w: rw, h: Math.max(8, rh), rotation: this._bounceRotation || 0 }); }
          else if (this.tool === 'soundwave') this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: rh, type: 'soundwave', _id: Math.random().toString(36).slice(2) });
          else if (this.tool === 'oneway') this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(8, rh), type: 'oneway' });
          else if (this.tool === 'crumble') this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(8, rh), type: 'crumble', _id: Math.random().toString(36).slice(2) });
          else if (this.tool === 'breakshot') this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(8, rh), type: 'breakshot', _id: Math.random().toString(36).slice(2) });
          else if (this.tool === 'switchA') { const g = document.getElementById('bl-swgroup')?.value || 'A'; this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(10, rh), type: 'switchA', switchGroup: g }); }
          else if (this.tool === 'switchB') { const g = document.getElementById('bl-swgroup')?.value || 'A'; this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(10, rh), type: 'switchB', switchGroup: g }); }
          // ── New expansion-pack platform types ────────────────
          else if (this.tool === 'conveyor') this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(10, rh), type: 'conveyor', dir: 1, speed: 1.6 });
          else if (this.tool === 'timed') this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(10, rh), type: 'timed', period: 180, _id: Math.random().toString(36).slice(2) });
          else if (this.tool === 'fallaway') this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(10, rh), type: 'fallaway', _id: Math.random().toString(36).slice(2) });
          else if (this.tool === 'windtunnel') this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(40, rh), type: 'windtunnel', lift: 0.85 });
          else if (this.tool === 'water') this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: Math.max(20, rh), type: 'water' });
          else if (this.tool === 'moving') {
            // Drag to place platform — it starts with x2=x+100 (horizontal travel by default)
            if (!this.levelData.movingPlats) this.levelData.movingPlats = [];
            const _spd = parseFloat(document.getElementById('bl-movespeed')?.value || '1.5') || 1.5;
            this.levelData.movingPlats.push({ x: rx, y: ry, w: rw, h: Math.max(10, rh), x2: rx + 100, y2: ry, speed: _spd, _t: 0, _dir: 1, _cx: rx, _cy: ry });
            this.showInfo('MOVING PLATFORM PLACED — drag endpoint to adjust path');
          }
          else this.levelData.platforms.push({ x: rx, y: ry, w: rw, h: rh });
        }
        this.isDragging = false; this.dragStart = null; this.previewRect = null; this.updateInfo();
      }
    },
    saveLevel() {
      if (!this.levelData) return;
      const slot = parseInt(document.getElementById('bl-slot').value) || 1;
      try { localStorage.setItem('pogl_custom_' + slot, JSON.stringify(this.levelData)); this.showInfo('SAVED TO SLOT ' + slot); }
      catch (e) { this.showInfo('SAVE FAILED'); }
    },
    loadLevel() {
      const slot = parseInt(document.getElementById('bl-slot').value) || 1;
      try {
        const d = localStorage.getItem('pogl_custom_' + slot);
        if (d) {
          this.levelData = JSON.parse(d); const n = document.getElementById('bl-name'), bw = document.getElementById('bl-width');
          if (n) n.value = this.levelData.name || ''; if (bw) bw.value = this.levelData.width || 3200; const bvoid = document.getElementById('bl-void'); if (bvoid) bvoid.checked = !!(this.levelData.voidFloor);
          this.theme = inferThemeKey(this.levelData, this.theme || 'highland'); const bt = document.getElementById('bl-theme'); if (bt) bt.value = this.theme;
          if (!this.levelData.weather) this.levelData.weather = 'none';
          const bwx = document.getElementById('bl-weather'); if (bwx) bwx.value = this.levelData.weather;
          this.showInfo('LOADED SLOT ' + slot);
        }
        else this.showInfo('SLOT ' + slot + ' EMPTY');
      }
      catch (e) { this.showInfo('LOAD FAILED'); }
    },
    returnToBuilder() {
      GS = 'playing';
      stopMusic();
      document.getElementById('s-pause').classList.remove('active');
      UI.openBuilder();
    },
    returnToBuilderFromComplete() {
      stopMusic();
      document.getElementById('s-complete').classList.remove('active');
      document.getElementById('hud').style.display = 'none';
      UI.openBuilder();
    },

    testLevel() {
      if (!this.levelData) return;
      // If the text editor was open mid-edit, dismiss it so it doesn't
      // sit over the gameplay during test.
      if (typeof TextEditor !== 'undefined' && TextEditor.isOpen()) TextEditor.close(false);
      const ld = JSON.parse(JSON.stringify(this.levelData));
      ld.qblocks = (ld.qblocks || []).map(b => ({ ...b, hit: false, bumpTimer: 0 }));
      WORLDS[98] = WORLDS[98] || { name: 'TEST', color: '#888', borderColor: '#aaa', emoji: '🔧', desc: '', levels: [] };
      WORLDS[98].levels[0] = ld;
      // Hide every builder UI element by id. Anything visible only
      // inside the builder state must be turned off here, otherwise
      // it floats over the test gameplay (this used to leak the right-
      // side controller-shortcuts overlay and the INFO flyout panel).
      ['builder-sidebar', 'builder-actions', 'builder-bar', 'builder-props',
        'builder-colorbar', 'builder-info', 'builder-help'].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.style.display = 'none';
            if (el.classList) el.classList.remove('show');
          }
        });
      // Close every category flyout — terrain/hazard/flow/objects/enemies *and* info.
      ['terrain', 'hazard', 'flow', 'animals', 'objects', 'enemies', 'info'].forEach(c => {
        const p = document.getElementById('blpanel-' + c); if (p) p.style.display = 'none';
      });
      this._openCat = null;
      document.getElementById('hud').style.display = 'flex';
      score = 0; coins = 0; levelTime = 0; currentWorld = 99; currentLevel = 1;
      GS = 'playing'; initLevel(1); startMusic(); resumeAC();
      // Builder 2.0: one-tap EDIT button overlays the test so build⇄play
      // is a single click each way (scroll/zoom are preserved on return).
      const _te = document.getElementById('bld-test-edit'); if (_te) _te.style.display = 'block';
    },
    updateInfo() {
      // Sync color pickers to current level palette
      const pc = this.levelData?.platColors || ['#1a3010', '#243a18', '#3a7a28', '#4a9a32', '#5ab840'];
      for (let i = 0; i < 5; i++) { const el = document.getElementById('bl-col' + i); if (el && pc[i]) el.value = pc[i]; }
      const bh = document.getElementById('bl-height'); if (bh) { bh.value = this.levelData?.height || 560; const bhv = document.getElementById('bl-height-val'); if (bhv) bhv.textContent = (this.levelData?.height || 560) + 'px'; }
      const bw2 = document.getElementById('bl-width'); if (bw2) { bw2.value = this.levelData?.width || 3200; const bwv = document.getElementById('bl-width-val'); if (bwv) bwv.textContent = (this.levelData?.width || 3200) + 'px'; }
      const bvy2 = document.getElementById('bl-voidy'); if (bvy2) { bvy2.value = this.levelData?.voidY || 460; const bvyv = document.getElementById('bl-voidy-val'); if (bvyv) bvyv.textContent = (this.levelData?.voidY || 460) + 'px'; }
      // Sync color pickers to selected object or palette
      const _ct = this._colorTarget;
      const _sp = (_ct && _ct.obj?.colors) ? _ct.obj.colors : (this.levelData?.platColors || ['#1a3010', '#243a18', '#3a7a28', '#4a9a32', '#5ab840']);
      for (let i = 0; i < 5; i++) { const el = document.getElementById('bl-col' + i); if (el && _sp[i]) el.value = String(_sp[i]); }
      const bm = document.getElementById('bl-music'); if (bm) bm.value = this.levelData?.music || '';
      const bwx = document.getElementById('bl-weather'); if (bwx) bwx.value = getLevelWeather(this.levelData);
      const bvoid = document.getElementById('bl-void'); if (bvoid) bvoid.checked = !!(this.levelData?.voidFloor);
      const bvy = document.getElementById('bl-voidy'); if (bvy) bvy.value = this.levelData?.voidY || 460;
      const bsx = document.getElementById('bl-startx'); if (bsx) bsx.value = this.levelData?.startX || 60;
      const bsy = document.getElementById('bl-starty'); if (bsy) bsy.value = this.levelData?.startY || 380;
      const bww = document.getElementById('bl-width'); if (bww) bww.value = this.levelData?.width || 3200;
      // Course rules (Builder 2.0)
      const basl = document.getElementById('bl-autoscroll'); if (basl) basl.value = String(this.levelData?.autoScroll || 0);
      const btl = document.getElementById('bl-timelimit'); if (btl) btl.value = this.levelData?.timeLimit || 0;
      const bcc = document.getElementById('bl-clearcondition');
      if (bcc) {
        bcc.value = this.levelData?.clearCondition || 'goal';
        const ccw = document.getElementById('bl-clearcount-wrap');
        if (ccw) ccw.style.display = (bcc.value === 'coins') ? 'flex' : 'none';
      }
      const bcn = document.getElementById('bl-clearcount'); if (bcn) bcn.value = this.levelData?.clearCount || 10;
      this._syncVerifyPill();

      const el = document.getElementById('builder-info'); if (!el || !this.levelData) return;
      const ld = this.levelData;
      // Live counts only — keyboard / controller hints are now shown
      // through the toolbar tooltips, so no need to clutter the
      // readout with "Z UNDO | R2 DEL | ←→ SCROLL" anymore.
      el.textContent = `P:${ld.platforms.length} · E:${ld.enemies.length} · C:${ld.coins.length} · Q:${ld.qblocks.length} · SP:${(ld.spikes || []).length} · CP:${(ld.checkpoints || []).length}`;
      this.updatePartCount();
    },
    getCornerAt(wx, wy) {
      // Returns {type, index, obj, corner:'TL'|'TR'|'BL'|'BR'} if within
      // 10 px of a resizable block corner. Critically, we DO NOT expose
      // corner handles for platforms that are smaller than the handles
      // themselves — otherwise the four corner hot-zones of a tiny 4×4
      // block overlap and gobble every click, forcing the user into
      // resize mode instead of allowing select / move / delete on the
      // body. Min-size threshold matches the corner radius.
      const ld = this.levelData; if (!ld) return null;
      const R = 10;
      const MIN_SIZE_FOR_CORNERS = R * 2 + 4;  // 24 px in either dim
      const check = (arr, type) => {
        if (!arr) return null;
        for (let i = arr.length - 1; i >= 0; i--) {
          const p = arr[i];
          const px = p.x, py = p.y, pw = p.w || 70, ph = p.h || 18;
          // Skip corners entirely when the block is too small for them
          // to be visually distinct from the body. Use the body picker.
          if (pw < MIN_SIZE_FOR_CORNERS || ph < MIN_SIZE_FOR_CORNERS) continue;
          const corners = { TL: [px, py], TR: [px + pw, py], BL: [px, py + ph], BR: [px + pw, py + ph] };
          for (const [cname, [cx2, cy2]] of Object.entries(corners)) {
            if (Math.abs(wx - cx2) < R && Math.abs(wy - cy2) < R) return { type, index: i, obj: p, corner: cname };
          }
        }
        return null;
      };
      return check(ld.platforms, 'platform') || check(ld.icePlats, 'icePlat') || check(ld.bounces, 'bounce') || check(ld.spikes, 'spike') || check(ld.switches, 'switch');
    },

    startResize(hit, wx, wy) {
      this._resizeObj = hit; this._resizeObjStart = { ...hit.obj, x: hit.obj.x, y: hit.obj.y, w: hit.obj.w || 70, h: hit.obj.h || 18 };
      this._moveDragStart = { x: wx, y: wy };
    },
    updateResize(wx, wy) {
      if (!this._resizeObj) return;
      const rs = this._resizeObjStart, c = this._resizeObj.corner;
      const dx = wx - this._moveDragStart.x, dy = wy - this._moveDragStart.y;
      const o = this._resizeObj.obj;
      if (c === 'TL') { o.x = this.snap(rs.x + dx); o.y = this.snap(rs.y + dy); o.w = Math.max(16, rs.w - dx); o.h = Math.max(8, rs.h - dy); }
      else if (c === 'TR') { o.y = this.snap(rs.y + dy); o.w = Math.max(16, rs.w + dx); o.h = Math.max(8, rs.h - dy); }
      else if (c === 'BL') { o.x = this.snap(rs.x + dx); o.w = Math.max(16, rs.w - dx); o.h = Math.max(8, rs.h + dy); }
      else if (c === 'BR') { o.w = Math.max(16, rs.w + dx); o.h = Math.max(8, rs.h + dy); }
    },
    cycleBounceRot() {
      this._bounceRotation = ((this._bounceRotation || 0) + 90) % 360;
      const el = document.getElementById('bl-brotval');
      const labels = ['↑0°', '→90°', '↓180°', '←270°'];
      if (el) el.textContent = labels[this._bounceRotation / 90];
      this.showInfo('BOUNCE ROTATION: ' + this._bounceRotation + '°');
    },

    cycleSpikeRot() {
      this._spikeRotation = ((this._spikeRotation || 0) + 90) % 360;
      const el = document.getElementById('bl-spike-rot');
      if (el) { const labels = ['↑0°', '→90°', '↓180°', '←270°']; el.innerHTML = '🔄<span>' + labels[this._spikeRotation / 90] + '</span>'; }
      this.showInfo('SPIKE ROTATION: ' + this._spikeRotation + '°');
    },

    endResize() {
      if (!this._resizeObj) return;
      this._resizeObj = null; this._resizeObjStart = null; this._moveDragStart = null;
      this.updateInfo();
    },

    getRotHandleAt(wx, wy) {
      const ld = this.levelData; if (!ld) return null;
      // Don't show rotation handles for void/start (they use 1D drag)
      const hoType = (this._hoverObj?.type);
      if (hoType === 'voidLine' || hoType === 'startMarker') return null;
      const R = 10, OUTER = 22;
      // Same logic as getCornerAt: skip rotation rings for tiny blocks
      // so a 1×1 platform isn't surrounded by a 22-px rotation halo
      // that intercepts every click.
      const MIN_SIZE_FOR_ROT = 24;
      const check = (arr, getRect) => {
        for (const obj of (arr || [])) {
          const r = getRect(obj);
          if (r.w < MIN_SIZE_FOR_ROT || r.h < MIN_SIZE_FOR_ROT) continue;
          const corners = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
          for (const [cx, cy] of corners) {
            const d = Math.hypot(wx - cx, wy - cy);
            if (d >= R && d <= OUTER) return obj;
          }
        }
        return null;
      };
      return check(ld.platforms, p => ({ x: p.x, y: p.y, w: p.w || 80, h: p.h || 18 }))
        || check(ld.bounces, b => ({ x: b.x, y: b.y, w: b.w || 50, h: b.h || 14 }))
        || check(ld.spikes, s => ({ x: s.x, y: s.y, w: s.w || 48, h: s.h || 16 }))
        || check(ld.icePlats, i => ({ x: i.x, y: i.y, w: i.w || 55, h: i.h || 18 }))
        || check(ld.movingPlats, m => ({ x: m._cx || m.x, y: m._cy || m.y, w: m.w || 60, h: m.h || 14 }));
    },

    startRotate(obj, wx, wy) {
      const cx = (obj.x || 0) + (obj.w || 50) / 2, cy = (obj.y || 0) + (obj.h || 18) / 2;
      this._rotatingObj = obj;
      this._rotCX = cx; this._rotCY = cy;
      this._rotStartAngle = Math.atan2(wy - cy, wx - cx) * 180 / Math.PI - (obj.rotation || 0);
      this.saveState();
    },

    updateRotate(wx, wy) {
      const obj = this._rotatingObj; if (!obj) return;
      let angle = Math.atan2(wy - this._rotCY, wx - this._rotCX) * 180 / Math.PI - this._rotStartAngle;
      angle = ((Math.round(angle) % 360) + 360) % 360;
      obj.rotation = angle;
      this.updateInfo();
    },

    addGround() {
      if (!this.levelData) return;
      this.saveState();
      const w = this.levelData.width || 3200;
      this.levelData.platforms.push({ x: 0, y: 450, w, h: 60 });
      this.updateInfo(); this.showInfo('GROUND ADDED');
    },

    getObjAt(wx, wy) {
      // Returns {type, index, obj} for the BEST candidate at the cursor.
      //
      // Old behaviour was "first match in priority order with generous
      // hit padding". That caused neighbour-grabs — clicking near coin A
      // but inside coin B's 36-px-square hit box still returned coin B
      // if B was checked first, even when the cursor was clearly closer
      // to A. We now COLLECT every candidate whose hit box contains the
      // cursor, score them by (specificity + distance from cursor to
      // bounding-box centre), and return the best.
      //
      // Helpers used by callers (cycleStackedPick) get the full ranked
      // list via `getObjsAt(wx, wy)`. `getObjAt` just returns the top.
      const list = this.getObjsAt(wx, wy);
      return list.length ? list[0] : null;
    },
    // Ranked candidate list: every object under (wx, wy), sorted from
    // best-match (smallest, closest, foreground items) to worst.
    getObjsAt(wx, wy) {
      const ld = this.levelData; if (!ld) return [];
      const out = [];
      // typePriority lifts foreground items above bulky terrain so a
      // coin sitting on a platform is preferred. Lower = better.
      const PRI = {
        coin: 0, cblock: 0, qblock: 0, trophy: 0, marsbar: 0,
        powerupItem: 0, ember: 0,
        spike: 1, switch: 1, checkpoint: 1, ally: 1, npc: 1, enemy: 1, sign: 1, text: 1, highlight: 1,
        goal: 1,
        spikeBlock: 2, bounce: 2, icePlat: 2, movingEnd: 2,
        platform: 3,
        startMarker: -1, voidLine: -1,   // anchors always win
      };
      // push(candidate) computes the bounding-box center distance to
      // the cursor and bakes it + the area into a score. The lookup
      // sort prefers SMALL hit boxes first (the user's clearly trying
      // to grab the specific small thing under the cursor), then the
      // closest center, with type-priority only as a tie-breaker so
      // a tiny terrain block still wins even if a bulky enemy sprite
      // covers the same point. Previously priority was weighted ×1e7
      // which made foreground items ALWAYS beat tiny terrain.
      const push = (type, index, obj, hx, hy, hw, hh) => {
        const cx = hx + hw / 2, cy = hy + hh / 2;
        const dx = wx - cx, dy = wy - cy;
        const dist = Math.hypot(dx, dy);
        const area = Math.max(36, hw * hh);
        out.push({
          type, index, obj,
          _bbox: { x: hx, y: hy, w: hw, h: hh },
          _area: area, _dist: dist, _pri: PRI[type] != null ? PRI[type] : 2,
          // Score formula:
          //   sqrt(area) * 4   — smaller hit box ranked first
          //   dist             — closer center ranked first
          //   _pri * 3         — gentle tie-break (foreground over bulk)
          // This lets a 4×4 platform (sqrt=2 → 8) win over a 24×24
          // coin (sqrt=24 → 96) sitting nearby, while still preferring
          // the coin over a 200×16 platform of similar reach.
          _score: Math.sqrt(area) * 4
                + dist
                + (PRI[type] != null ? PRI[type] : 2) * 3,
        });
      };

      // Anchors (void line + start marker) always win — tight check.
      { const vy = ld.voidY || 460; if (Math.abs(wy - vy) < 8) return [{ type: 'voidLine', index: 0, obj: { x: wx, y: vy } }]; }
      { const sx2 = ld.startX || 60, sy2 = ld.startY || 398; if (Math.abs(wx - sx2) < 18 && Math.abs(wy - sy2) < 18) return [{ type: 'startMarker', index: 0, obj: { x: sx2, y: sy2 } }]; }

      // Helper: AABB test
      const inRect = (x, y, w, h) => wx >= x && wx <= x + w && wy >= y && wy <= y + h;
      // Goal castle — the whole 100×140 footprint is clickable so the
      // castle can be selected + dragged like any other object. We
      // bias its score modestly (small effective area) so a platform
      // tucked behind the castle base doesn't always steal the click.
      if (ld.goalX != null && ld.goalY != null && ld.goalX > -500
          && inRect(ld.goalX, ld.goalY, 100, 140)) {
        const _gcx = ld.goalX + 50, _gcy = ld.goalY + 70;
        const _gd = Math.hypot(wx - _gcx, wy - _gcy);
        out.push({
          type: 'goal', index: 0, obj: { x: ld.goalX, y: ld.goalY },
          _bbox: { x: ld.goalX, y: ld.goalY, w: 100, h: 140 },
          _area: 3600, _dist: _gd, _pri: 1,
          _score: Math.sqrt(3600) * 4 + _gd + 1 * 3,
        });
      }
      // Helper: point-with-padding (for small icons). Pad = halo radius.
      const inPoint = (cx, cy, radius) => Math.abs(wx - cx) < radius && Math.abs(wy - cy) < radius;

      // ── Small pickups (16-px icons centred on x+8, y+8) ────────
      // Reduced pickup hit radius (was 18) — was overlapping neighbours.
      const PICK_R = 14;
      if (ld.coins) for (let i = ld.coins.length - 1; i >= 0; i--) {
        const c = ld.coins[i];
        if (inPoint(c.x + 8, c.y + 8, PICK_R)) push('coin', i, c, c.x - 4, c.y - 4, 24, 24);
      }
      if (ld.cblocks) for (let i = ld.cblocks.length - 1; i >= 0; i--) {
        const cb = ld.cblocks[i];
        if (inPoint(cb.x + 14, cb.y + 14, PICK_R)) push('cblock', i, cb, cb.x, cb.y, 28, 28);
      }
      if (ld.trophies) for (let i = ld.trophies.length - 1; i >= 0; i--) {
        const t = ld.trophies[i];
        if (inPoint(t.x + 12, t.y + 12, PICK_R)) push('trophy', i, t, t.x, t.y, 24, 24);
      }
      if (ld.powerupItems) for (let i = ld.powerupItems.length - 1; i >= 0; i--) {
        const pu = ld.powerupItems[i];
        if (inPoint(pu.x + 14, pu.y + 14, PICK_R)) push('powerupItem', i, pu, pu.x, pu.y, 28, 28);
      }
      if (ld.qblocks) for (let i = ld.qblocks.length - 1; i >= 0; i--) {
        const q = ld.qblocks[i];
        if (inPoint(q.x + 14, q.y + 14, PICK_R)) push('qblock', i, q, q.x, q.y, 28, 28);
      }
      if (ld.spiritEmbers) for (let i = ld.spiritEmbers.length - 1; i >= 0; i--) {
        const e = ld.spiritEmbers[i];
        if (inPoint(e.x, e.y, PICK_R)) push('ember', i, e, e.x - 14, e.y - 14, 28, 28);
      }
      if (ld.marsBarPieces) for (let i = ld.marsBarPieces.length - 1; i >= 0; i--) {
        const mb = ld.marsBarPieces[i];
        if (Math.abs(mb.x - wx) < 14 && Math.abs(mb.y - wy) < 14) push('marsbar', i, mb, mb.x - 14, mb.y - 14, 28, 28);
      }

      // ── Spike-blocks (thin overhead bars) ──────────────────────
      if (ld.spikeBlocks) for (let i = ld.spikeBlocks.length - 1; i >= 0; i--) {
        const sb = ld.spikeBlocks[i];
        const sw = sb.w || 60, sh = sb.h || 16;
        if (wx >= sb.x && wx <= sb.x + sw && wy >= sb.y - 10 && wy <= sb.y + sh + 2) {
          push('spikeBlock', i, sb, sb.x, sb.y - 10, sw, sh + 12);
        }
      }

      // ── Enemies — tightened hit box (was 56×72, way too generous) ─
      if (ld.enemies) for (let i = ld.enemies.length - 1; i >= 0; i--) {
        const e = ld.enemies[i];
        // Sprite footprint ≈ 32×40 ish. Use a 36×48 hit box centred on
        // (x+16, y+20). Previously was 56×72 — that caused enemies to
        // hijack clicks meant for nearby coins / platforms.
        if (Math.abs(e.x + 16 - wx) < 18 && Math.abs(e.y + 20 - wy) < 24) {
          push('enemy', i, e, e.x - 2, e.y - 4, 36, 48);
        }
      }
      // ── Checkpoints — tightened (40-tall hit box was eating clicks
      //    on platforms below it). Tighter band centred on the pole.
      if (ld.checkpoints) for (let i = ld.checkpoints.length - 1; i >= 0; i--) {
        const c = ld.checkpoints[i];
        if (Math.abs(c.x + 9 - wx) < 16 && wy >= c.y - 40 && wy <= c.y + 8) {
          push('checkpoint', i, c, c.x - 7, c.y - 40, 32, 48);
        }
      }
      // ── Allies (Mackenzie) — tightened to roughly sprite footprint.
      if (ld.allies) for (let i = ld.allies.length - 1; i >= 0; i--) {
        const a = ld.allies[i];
        if (Math.abs(a.x + 18 - wx) < 20 && Math.abs(a.y + 15 - wy) < 18) {
          push('ally', i, a, a.x - 2, a.y - 3, 40, 36);
        }
      }
      // ── NPCs ────────────────────────────────────────────────────
      if (ld.npcs) for (let i = ld.npcs.length - 1; i >= 0; i--) {
        const n = ld.npcs[i]; const def = NPC_VARIANTS[n.type];
        if (!def) continue;
        if (inRect(n.x, n.y, def.w, def.h)) {
          push('npc', i, n, n.x, n.y, def.w, def.h);
        }
      }
      // ── Switches ────────────────────────────────────────────────
      if (ld.switches) for (let i = ld.switches.length - 1; i >= 0; i--) {
        const sw = ld.switches[i]; const ww = sw.w || 28, hh = sw.h || 28;
        if (inRect(sw.x, sw.y, ww, hh)) push('switch', i, sw, sw.x, sw.y, ww, hh);
      }
      // ── Spikes — tightened padding (was ±6 in every direction;
      //    cut to ±3 so they don't gobble clicks meant for the platform
      //    next to them).
      if (ld.spikes) for (let i = ld.spikes.length - 1; i >= 0; i--) {
        const sp = ld.spikes[i]; const sw = sp.w || 48, sh = sp.h || 16;
        if (wx >= sp.x - 3 && wx <= sp.x + sw + 3 && wy >= sp.y - 3 && wy <= sp.y + sh + 3) {
          push('spike', i, sp, sp.x, sp.y, sw, sh);
        }
      }
      // ── Tiny-terrain hit-pad helper ─────────────────────────────
      // Very small platforms (e.g. a 4×4 stepping stone or a 2-px
      // thin strip) are nearly unclickable at default zoom because
      // their literal rect is smaller than mouse precision. We pad
      // the HIT-TEST box up to a minimum of 20 px in each dimension
      // when the platform is smaller than that, so the player can
      // still grab it reliably. The object itself isn't resized —
      // only its hit footprint. Accounts for builder zoom so the
      // pad stays roughly constant in SCREEN pixels regardless of
      // how far zoomed-out the view is.
      const _bz = this.zoom || 1;
      const MIN_HIT_SCREEN = 20;
      const MIN_HIT = Math.max(12, MIN_HIT_SCREEN / Math.max(0.25, _bz));
      const inTerrainHit = (x, y, w, h) => {
        const padX = Math.max(0, (MIN_HIT - w) / 2);
        const padY = Math.max(0, (MIN_HIT - h) / 2);
        return wx >= x - padX && wx <= x + w + padX
            && wy >= y - padY && wy <= y + h + padY;
      };

      // ── Ice platforms / bounces (small dedicated rect tests) ────
      if (ld.icePlats) for (let i = ld.icePlats.length - 1; i >= 0; i--) {
        const p = ld.icePlats[i]; const ph = p.h || 18;
        if (inTerrainHit(p.x, p.y, p.w, ph)) push('icePlat', i, p, p.x, p.y, p.w, ph);
      }
      if (ld.bounces) for (let i = ld.bounces.length - 1; i >= 0; i--) {
        const p = ld.bounces[i]; const ph = p.h || 14;
        if (inTerrainHit(p.x, p.y, p.w, ph)) push('bounce', i, p, p.x, p.y, p.w, ph);
      }
      // ── Moving platform endpoints — pad reduced from ±10 to ±4 ──
      if (ld.movingPlats) for (let i = ld.movingPlats.length - 1; i >= 0; i--) {
        const mp = ld.movingPlats[i];
        const ex = mp.x2 || mp.x, ey = mp.y2 || mp.y, ew = mp.w || 60, eh = mp.h || 14;
        if (wx >= ex - 4 && wx <= ex + ew + 4 && wy >= ey - 4 && wy <= ey + eh + 4) {
          push('movingEnd', i, { x: ex, y: ey, w: ew, h: eh, _mp: mp }, ex, ey, ew, eh);
        }
      }
      // ── Signs ───────────────────────────────────────────────────
      if (ld.signs) for (let i = ld.signs.length - 1; i >= 0; i--) {
        const s = ld.signs[i]; const sw = s.w || 240, sh = s.h || 60;
        if (inRect(s.x, s.y, sw, sh)) push('sign', i, s, s.x, s.y, sw, sh);
      }
      // ── Text labels ─────────────────────────────────────────────
      if (ld.texts) for (let i = ld.texts.length - 1; i >= 0; i--) {
        const t = ld.texts[i];
        if (!t || t.x == null) continue;
        const size = Math.max(6, Math.min(72, +t.size || 14));
        const lines = String(t.text || '').split(/\\n|\n/);
        const lineH = Math.round(size * 1.3);
        const maxLine = lines.reduce((m, l) => Math.max(m, l.length), 0);
        const w = Math.max(40, maxLine * size * 0.85);
        const h = Math.max(size, lines.length * lineH);
        if (inRect(t.x, t.y, w, h + 4)) push('text', i, t, t.x, t.y, w, h + 4);
      }
      // ── Highlight markers ───────────────────────────────────────
      if (ld.highlights) for (let i = ld.highlights.length - 1; i >= 0; i--) {
        const h = ld.highlights[i];
        if (h.type === 'box') {
          const hw = h.w || 60, hh = h.h || 60;
          if (inRect(h.x, h.y, hw, hh)) push('highlight', i, h, h.x, h.y, hw, hh);
        } else if (h.type === 'circle') {
          const rr = (h.r || 22);
          if (Math.hypot(wx - h.x, wy - (h.y || 0)) <= rr + 4) push('highlight', i, h, h.x - rr, (h.y || 0) - rr, rr * 2, rr * 2);
        } else {
          if (Math.hypot(wx - h.x, wy - (h.y || 0)) <= 18) push('highlight', i, h, h.x - 18, (h.y || 0) - 18, 36, 36);
        }
      }
      // ── Platforms (skip the giant ground at index 0) ─────────────
      if (ld.platforms) for (let i = ld.platforms.length - 1; i >= 0; i--) {
        const p = ld.platforms[i];
        if (i === 0 && p.w > 300) continue;
        if (p.type === 'rotating') {
          const ccx = p.cx != null ? p.cx : p.x;
          const ccy = p.cy != null ? p.cy : p.y;
          const r = p.radius || 60;
          const px = p._cx != null ? p._cx : (ccx + Math.cos(p.startAngle || 0) * r);
          const py = p._cy != null ? p._cy : (ccy + Math.sin(p.startAngle || 0) * r);
          const pw = p.w || 60, ph = p.h || 14;
          if (inTerrainHit(px, py, pw, ph)) {
            push('platform', i, p, px, py, pw, ph);
          } else if (Math.abs(wx - ccx) <= 8 && Math.abs(wy - ccy) <= 8) {
            push('platform', i, p, ccx - 8, ccy - 8, 16, 16);
          }
          continue;
        }
        if (inTerrainHit(p.x, p.y, p.w, p.h)) push('platform', i, p, p.x, p.y, p.w, p.h);
      }

      // Sort by composite score (lower = better match)
      out.sort((a, b) => a._score - b._score);
      return out;
    },

    startMove(obj, wx, wy) {
      this._moveObj = obj;
      this._moveDragStart = { x: wx, y: wy };
      this._moveObjStart = { x: obj.obj.x, y: obj.obj.y };
      // Track whether the user actually dragged so endMove() can tell
      // a "true second click" (no drag) from a "drag-and-release"
      // (which should NOT open the platform editor — the user was
      // moving, not double-clicking).
      this._moveDidDrag = false;
      // Multi-select: capture all start positions if this obj is in selection
      if (this._selection && this._selection.length > 1 && this._selection.includes(obj.obj)) {
        this._selectionMoveStart = { wx: this.snap(wx), wy: this.snap(wy) };
        this._selectionStartPos = this._selection.map(o => ({ x: o.x || 0, y: o.y || 0 }));
      } else {
        this._selectionMoveStart = null;
        this._selectionStartPos = null;
      }
    },
    updateMove(wx, wy) {
      // If we have a multi-selection, move all objects in it
      if (this._selection && this._selection.length > 1 && this._selectionMoveStart) {
        const dx = this.snap(wx) - this._selectionMoveStart.wx;
        const dy = this.snap(wy) - this._selectionMoveStart.wy;
        this._selection.forEach((obj, i) => {
          obj.x = this.snap(this._selectionStartPos[i].x + dx);
          obj.y = this.snap(this._selectionStartPos[i].y + dy);
        });
        return;
      }
      if (this._moveObj && this._moveObj.type === 'voidLine') {
        const snapped = this.snap(wy);
        this.levelData.voidY = Math.max(100, Math.min(2000, snapped));
        // Sync number input
        const el = document.getElementById('bl-voidy'); if (el) el.value = this.levelData.voidY;
        return;
      }
      if (this._moveObj && this._moveObj.type === 'startMarker') {
        this.levelData.startX = Math.max(10, Math.min((this.levelData.width || 3200) - 80, this.snap(wx)));
        this.levelData.startY = Math.max(50, Math.min(500, this.snap(wy)));
        const elx = document.getElementById('bl-startx'); if (elx) elx.value = this.levelData.startX;
        return;
      }
      if (!this._moveObj) return;
      // Use the raw cursor delta (NOT snapped) to detect "did the
      // user actually drag" — snap quantizes to the grid which would
      // miss small intentional moves <16 px.
      const rawDx = wx - this._moveDragStart.x;
      const rawDy = wy - this._moveDragStart.y;
      if (Math.abs(rawDx) > 3 || Math.abs(rawDy) > 3) this._moveDidDrag = true;
      const dx = this.snap(rawDx);
      const dy = this.snap(rawDy);
      if (this._moveObj.type === 'goal') {
        // Drag the goal castle — updates levelData.goalX/Y directly.
        this.levelData.goalX = this._moveObjStart.x + dx;
        this.levelData.goalY = this._moveObjStart.y + dy;
        return;
      }
      if (this._moveObj.type === 'movingEnd') {
        // Move the endpoint of a moving platform
        this._moveObj.obj._mp.x2 = this.snap(this._moveObjStart.x + dx);
        this._moveObj.obj._mp.y2 = this.snap(this._moveObjStart.y + dy);
      } else {
        this._moveObj.obj.x = this._moveObjStart.x + dx;
        this._moveObj.obj.y = this._moveObjStart.y + dy;
      }
    },
    endMove() {
      this._selectionMoveStart = null; this._selectionStartPos = null;
      if (!this._moveObj) return;
      // If the user actually dragged the platform, disarm the edit
      // target. Otherwise the NEXT click on the same platform would
      // open the PlatformEditor (treating the drag-release as the
      // "first click" of a double-click sequence) — which is wrong:
      // the user was moving, not preparing to edit. They have to
      // explicitly do a non-drag click → click cycle to open the
      // modal.
      if (this._moveDidDrag) {
        this._infoEditTarget = null;
      }
      this._moveDidDrag = false;
      this._moveObj = null; this._moveDragStart = null; this._moveObjStart = null;
      this.updateInfo();
    },

    _clipboard: null,

    // ══ Builder 2.0 — editing modes (tile-paint + multigrab) ════════
    _paintMode: false, _painting: false, _paintCells: null,
    _grabMode: false,
    PAINT_TILE: 24,

    _syncModeButtons() {
      const p = document.getElementById('btn-bld-paint');
      if (p) p.classList.toggle('on', !!this._paintMode);
      const g = document.getElementById('btn-bld-grab');
      if (g) g.classList.toggle('on', !!this._grabMode);
    },
    togglePaint(force) {
      this._paintMode = (force === undefined) ? !this._paintMode : !!force;
      if (this._paintMode) this._grabMode = false;   // modes are exclusive
      this._syncModeButtons();
      this.showInfo(this._paintMode ? '🖌 PAINT — drag to lay terrain tiles' : 'PAINT OFF');
    },
    toggleGrab(force) {
      this._grabMode = (force === undefined) ? !this._grabMode : !!force;
      if (this._grabMode) this._paintMode = false;
      this._syncModeButtons();
      this.showInfo(this._grabMode ? '⛶ MULTIGRAB — drag a box to grab objects, then STAMP' : 'MULTIGRAB OFF');
    },
    // Tools that can be tile-painted (special-but-static terrain only).
    _paintable() {
      return ['platform', 'ice', 'oneway', 'crumble', 'breakshot', 'soundwave', 'switchA', 'switchB'].includes(this.tool);
    },
    paintStart(wx, wy) {
      this.saveState();
      this._painting = true;
      this._paintCells = new Set();
      this.paintMove(wx, wy);
    },
    paintMove(wx, wy) {
      if (!this._painting || !this.levelData) return;
      const T = this.PAINT_TILE;
      const gx = Math.floor(wx / T) * T, gy = Math.floor(wy / T) * T;
      const key = gx + ',' + gy;
      if (this._paintCells.has(key)) return;       // one tile per cell per stroke
      this._paintCells.add(key);
      if (gy < 0 || gy > 490 || gx < 0 || gx > (this.levelData.width || 3200)) return;
      // Skip if a platform already covers this cell's centre (no stacking).
      const ccx = gx + T / 2, ccy = gy + T / 2;
      const occupied = (this.levelData.platforms || []).some(p =>
        ccx >= p.x && ccx <= p.x + (p.w || 0) && ccy >= p.y && ccy <= p.y + (p.h || 0));
      if (occupied) return;
      this._pushTile(this.tool, gx, gy, T, T);
      this.updateInfo();
    },
    // Mirrors endDrag's per-type storage so painted tiles match dragged ones.
    _pushTile(tool, x, y, w, h) {
      const ld = this.levelData;
      const rid = () => Math.random().toString(36).slice(2);
      if (tool === 'ice') { (ld.icePlats = ld.icePlats || []).push({ x, y, w, h }); }
      else if (tool === 'oneway') ld.platforms.push({ x, y, w, h, type: 'oneway' });
      else if (tool === 'crumble') ld.platforms.push({ x, y, w, h, type: 'crumble', _id: rid() });
      else if (tool === 'breakshot') ld.platforms.push({ x, y, w, h, type: 'breakshot', _id: rid() });
      else if (tool === 'soundwave') ld.platforms.push({ x, y, w, h, type: 'soundwave', _id: rid() });
      else if (tool === 'switchA') ld.platforms.push({ x, y, w, h, type: 'switchA', switchGroup: (document.getElementById('bl-swgroup')?.value || 'A') });
      else if (tool === 'switchB') ld.platforms.push({ x, y, w, h, type: 'switchB', switchGroup: (document.getElementById('bl-swgroup')?.value || 'A') });
      else ld.platforms.push({ x, y, w, h });
    },
    paintEnd() {
      this._painting = false; this._paintCells = null;
      this.updateInfo();
    },

    // Multigrab: after a grab box-selects objects, load them into the
    // stamp clipboard so STAMP / Cmd+V drop copies at the cursor.
    grabSelectionToClipboard() {
      if (this._selection && this._selection.length) {
        this.copySelected();
        this.showInfo('⛶ GRABBED ' + this._selection.length + ' — tap to stamp a copy (ghost shows where)');
      }
    },
    // Stamp grabbed objects into the centre of the current view, slightly
    // offset from the originals so the copy is always visibly separate.
    // The objects currently on the stamp clipboard, as a flat array of
    // raw objects (multigrab → _multiClipboard; single copy → _clipboard.obj).
    _stampItems() {
      if (this._multiClipboard && this._multiClipboard.length) return this._multiClipboard;
      if (this._clipboard && this._clipboard.obj) return [this._clipboard.obj];
      return null;
    },
    // Ghost preview: while GRAB mode has something on the clipboard, draw a
    // translucent outline of what would be pasted, anchored at the cursor —
    // matching pasteSelected's min-corner-to-cursor offset. Drawn inside
    // drawScene's world transform.
    drawStampGhost(ctx) {
      if (!this._grabMode || this._boxSelectStart) return;   // hide while dragging a new grab box
      const items = this._stampItems();
      if (!items || !items.length) return;
      if (this._lastMx == null || this._lastMy == null) return;
      const cur = this.canvasToWorld(this._lastMx, this._lastMy);   // snapped
      let minX = Infinity, minY = Infinity;
      for (const o of items) { minX = Math.min(minX, o.x != null ? o.x : 0); minY = Math.min(minY, o.y != null ? o.y : 0); }
      if (!isFinite(minX)) minX = 0;
      if (!isFinite(minY)) minY = 0;
      const dx = cur.x - this.snap(minX), dy = cur.y - this.snap(minY);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = 'rgba(110,180,255,0.22)';
      ctx.strokeStyle = '#9ad0ff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      for (const o of items) {
        const gx = (o.x || 0) + dx, gy = (o.y || 0) + dy;
        const gw = o.w || (o.r ? o.r * 2 : 24), gh = o.h || (o.r ? o.r * 2 : 24);
        ctx.fillRect(gx, gy, gw, gh);
        ctx.strokeRect(gx, gy, gw, gh);
      }
      ctx.setLineDash([]);
      // "STAMP" tag at the ghost's top-left so it's clear what this is.
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#9ad0ff';
      ctx.font = '5px "Press Start 2P"';
      ctx.fillText('📌 STAMP', this.snap(minX) + dx, this.snap(minY) + dy - 5);
      ctx.restore();
    },
    stampGrab() {
      if ((!this._multiClipboard || !this._multiClipboard.length) && !this._clipboard) {
        this.showInfo('NOTHING GRABBED — drag a box with ⛶ GRAB first'); return;
      }
      const z = this.zoom || 1;
      const cx = (W / 2) / z + (this.scrollX || 0);
      const cy = (H / 2) / z + (this.scrollY || 0);
      this.pasteSelected(this.snap(cx), this.snap(cy));
    },
    // Mirror the current selection horizontally about its own centre.
    flipSelectionH() {
      const sel = this._selection;
      if (!sel || !sel.length) { this.showInfo('NOTHING SELECTED TO FLIP'); return; }
      this.saveState();
      let minX = Infinity, maxX = -Infinity;
      for (const o of sel) { const w = o.w || 16; minX = Math.min(minX, o.x); maxX = Math.max(maxX, o.x + w); }
      const cx = (minX + maxX) / 2;
      for (const o of sel) {
        const w = o.w || 16;
        o.x = Math.round(cx + (cx - (o.x + w)));    // reflect left edge
        if (o.x2 != null) o.x2 = Math.round(2 * cx - o.x2);
        if (o._cx != null) o._cx = o.x;
        if (o.rotation != null) o.rotation = (360 - o.rotation) % 360;
        if (o.dir != null) o.dir = -o.dir;           // conveyor direction
      }
      this.updateInfo();
      this.showInfo('⇆ FLIPPED ' + sel.length + ' OBJECTS');
    },

    /** New identity for special terrain so pasted copies don't share runtime state (hits, crumble, etc.). */
    assignFreshSpecialTerrainIds(o) {
      if (!o || typeof o !== 'object') return;
      const t = o.type;
      if (t === 'breakshot' || t === 'crumble' || t === 'soundwave') {
        o._id = Math.random().toString(36).slice(2, 11) + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
      }
    },

    // ── Stacked-pick cycler (Tab key) ──────────────────────────
    // When multiple objects overlap, Tab walks through them so the
    // user can grab the specific one they want. Shift+Tab walks the
    // other way. The cached stack is invalidated when the cursor
    // moves (handled in builderPointerMove → _stackCycleAt drift).
    cycleStackedPick(dir) {
      const wx = this._lastCursorWX | 0, wy = this._lastCursorWY | 0;
      // Refresh the candidate list either on first cycle or after
      // moving away from the previous cycle anchor.
      if (!this._stackCycle || !this._stackCycleAt
       || Math.abs(wx - this._stackCycleAt.x) > 8
       || Math.abs(wy - this._stackCycleAt.y) > 8) {
        const list = this.getObjsAt(wx, wy);
        if (!list.length) { this.showInfo('— NOTHING UNDER CURSOR —'); return; }
        this._stackCycle = { list, idx: 0 };
        this._stackCycleAt = { x: wx, y: wy };
      } else {
        const n = this._stackCycle.list.length;
        this._stackCycle.idx = ((this._stackCycle.idx + (dir || 1)) % n + n) % n;
      }
      const sc = this._stackCycle;
      const pick = sc.list[sc.idx];
      this._hoverObj = pick;
      // Auto-select the cycled object so copy/edit/delete operate
      // on it immediately without a second click.
      if (pick && pick.obj) {
        this._colorTarget = pick;
        if (this._selection) this._selection.length = 0;
      }
      this.showInfo('▥ ' + (sc.idx + 1) + ' / ' + sc.list.length + '  ' + (pick.type || '?').toUpperCase()
        + '  (Tab to cycle)');
    },

    copySelected() {
      // Multi-select copy
      if (this._selection && this._selection.length > 0) {
        this._multiClipboard = JSON.parse(JSON.stringify(this._selection));
        this.showInfo('📋 COPIED ' + this._selection.length + ' OBJECTS');
        return;
      }
      // Single object: prefer explicit selection (click-to-select / color target), else object under cursor
      const single = (this._colorTarget && this._colorTarget.obj) ? this._colorTarget : this._hoverObj;
      if (!single || !single.obj) return;
      this._clipboard = JSON.parse(JSON.stringify(single));
      this._multiClipboard = null;
      this.showInfo('COPIED ' + (single.type || '').toUpperCase());
    },

    // Optional (targetWx, targetWy): world coords to anchor the paste at.
    // When omitted, falls back to the last cursor position (legacy Cmd+V).
    pasteSelected(targetWx, targetWy) {
      const haveTarget = (typeof targetWx === 'number' && typeof targetWy === 'number');
      if (!this._multiClipboard || !this._multiClipboard.length) {
        if (!this._clipboard) { this.showInfo('NOTHING GRABBED — use ⛶ GRAB first'); return; }
        let wx2, wy2;
        if (haveTarget) { wx2 = targetWx; wy2 = targetWy; }
        else { const bx = this._lastMx != null ? this._lastMx : 400, by = this._lastMy != null ? this._lastMy : 300; ({ x: wx2, y: wy2 } = this.canvasToWorld(bx, by)); }
        this.pasteClipboard(wx2, wy2);
        return;
      }
      this.saveState();
      const ld = this.levelData;
      const originals = this._multiClipboard;
      let minAX = Infinity, minAY = Infinity;
      for (const o of originals) {
        minAX = Math.min(minAX, o.x != null ? o.x : 0);
        minAY = Math.min(minAY, o.y != null ? o.y : 0);
      }
      if (!isFinite(minAX)) minAX = 0;
      if (!isFinite(minAY)) minAY = 0;
      let twx, twy;
      if (haveTarget) { twx = targetWx; twy = targetWy; }
      else { const bx = this._lastMx != null ? this._lastMx : 400, by = this._lastMy != null ? this._lastMy : 300; ({ x: twx, y: twy } = this.canvasToWorld(bx, by)); }
      const dx = this.snap(twx) - this.snap(minAX), dy = this.snap(twy) - this.snap(minAY);
      const offsetClone = (c) => {
        c.x = (c.x || 0) + dx; c.y = (c.y || 0) + dy;
        if (c.x1 != null) c.x1 += dx;
        if (c.y1 != null) c.y1 += dy;
        if (c.x2 != null) c.x2 += dx;
        if (c.y2 != null) c.y2 += dy;
        if (c._cx != null) c._cx += dx;
        if (c._cy != null) c._cy += dy;
      };
      const clones = originals.map(o => {
        const c = JSON.parse(JSON.stringify(o));
        offsetClone(c);
        this.assignFreshSpecialTerrainIds(c);
        return c;
      });
      // Figure out which array each clone goes into by comparing to current arrays
      clones.forEach((clone, i) => {
        const o = originals[i];
        if ((ld.platforms || []).some(p => p.x === o.x && p.y === o.y && p.w === o.w)) { ld.platforms.push(clone); }
        else if ((ld.bounces || []).some(p => p.x === o.x && p.y === o.y)) { if (!ld.bounces) ld.bounces = []; ld.bounces.push(clone); }
        else if ((ld.enemies || []).some(p => p.x === o.x && p.y === o.y)) { if (!ld.enemies) ld.enemies = []; ld.enemies.push(clone); }
        else if ((ld.coins || []).some(p => p.x === o.x && p.y === o.y)) { if (!ld.coins) ld.coins = []; ld.coins.push(clone); }
        else if ((ld.spikes || []).some(p => p.x === o.x && p.y === o.y)) { if (!ld.spikes) ld.spikes = []; ld.spikes.push(clone); }
        else if ((ld.movingPlats || []).some(p => p.x === o.x && p.y === o.y)) { if (!ld.movingPlats) ld.movingPlats = []; ld.movingPlats.push(clone); }
        else { ld.platforms.push(clone); }
      });
      this._selection = clones;
      this.showInfo('📋 PASTED ' + clones.length + ' OBJECTS');
      this.updateInfo();
    },

    pasteClipboard(wx, wy) {
      if (!this._clipboard) return;
      const ld = this.levelData; if (!ld) return;
      this.saveState();
      const c = JSON.parse(JSON.stringify(this._clipboard));
      const obj = c.obj;
      const dx = this.snap(wx) - (obj.x || 0), dy = this.snap(wy) - (obj.y || 0);
      obj.x = (obj.x || 0) + dx; obj.y = (obj.y || 0) + dy;
      this.assignFreshSpecialTerrainIds(obj);
      const t = c.type;
      if (t === 'platform') ld.platforms.push(obj);
      else if (t === 'icePlat') { if (!ld.icePlats) ld.icePlats = []; ld.icePlats.push(obj); }
      else if (t === 'bounce') { if (!ld.bounces) ld.bounces = []; ld.bounces.push(obj); }
      else if (t === 'coin') ld.coins.push(obj);
      else if (t === 'qblock') ld.qblocks.push(obj);
      else if (t === 'cblock') { if (!ld.cblocks) ld.cblocks = []; ld.cblocks.push(obj); }
      else if (t === 'trophy') { if (!ld.trophies) ld.trophies = []; ld.trophies.push(obj); }
      else if (t === 'enemy') ld.enemies.push(obj);
      else if (t === 'spike') { if (!ld.spikes) ld.spikes = []; ld.spikes.push(obj); }
      else if (t === 'switch') { if (!ld.switches) ld.switches = []; ld.switches.push(obj); }
      else if (t === 'checkpoint') { if (!ld.checkpoints) ld.checkpoints = []; ld.checkpoints.push(obj); }
      this.showInfo('PASTED');
      this.updateInfo();
    },

    // ══ Builder 2.0 — palette templates + quick fill ════════════════
    // One-click full palettes so users don't have to hand-pick 5 shades.
    PALETTE_TEMPLATES: [
      { name: 'GRASS',  c: ['#1a3010', '#243a18', '#3a7a28', '#4a9a32', '#5ab840'] },
      { name: 'STONE',  c: ['#23232a', '#33333d', '#55555f', '#6e6e7a', '#8a8a96'] },
      { name: 'SAND',   c: ['#7a5a2a', '#9a7a3a', '#c8a85a', '#e0c878', '#f0e0a0'] },
      { name: 'LAVA',   c: ['#3a0a04', '#6a1a08', '#a83010', '#e0600f', '#ffaa30'] },
      { name: 'ICE',    c: ['#16384a', '#1f4f68', '#3a86a8', '#6abede', '#bdeeff'] },
      { name: 'CORAL',  c: ['#5a1838', '#8a2a55', '#c8466e', '#ff7aa0', '#ffc0d4'] },
      { name: 'COSMIC', c: ['#180a3a', '#2a1860', '#5a3aaa', '#8a66e0', '#c0a0ff'] },
      { name: 'CANDY',  c: ['#5a1a4a', '#8a2a6a', '#cf4a9a', '#ff7ac8', '#ffc0e8'] },
      { name: 'SHADOW', c: ['#0a0a12', '#16161f', '#26263a', '#3a3a55', '#5a5a7a'] },
      { name: 'BRASS',  c: ['#3a2a10', '#5a4018', '#8a6a28', '#c89a40', '#f0d070'] },
    ],
    // ── Builder 2.0: custom palettes (saved + reusable) ─────────────
    _loadPalettes() {
      try { const r = localStorage.getItem('pogl_palettes_v1'); if (r) { const p = JSON.parse(r); if (Array.isArray(p)) return p; } } catch (e) {}
      return [];
    },
    _savePalettes(list) { try { localStorage.setItem('pogl_palettes_v1', JSON.stringify(list)); } catch (e) {} },
    _palGrad(c) { return 'linear-gradient(180deg,' + c[4] + ' 0%,' + c[2] + ' 55%,' + c[0] + ' 100%)'; },
    saveCurrentPalette() {
      const cols = [];
      for (let i = 0; i < 5; i++) { const el = document.getElementById('bl-col' + i); cols.push(el ? el.value : '#888888'); }
      let name = (window.prompt('Name this palette:', 'My Palette') || '').replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 14);
      if (!name) return;
      const list = this._loadPalettes();
      const ix = list.findIndex(p => p.name === name);
      if (ix >= 0) list[ix] = { name, c: cols }; else list.push({ name, c: cols });
      while (list.length > 24) list.shift();
      this._savePalettes(list);
      this.renderPaletteTemplates();
      this.showInfo('🎨 SAVED PALETTE: ' + name);
    },
    applyCustomPalette(name) {
      const p = this._loadPalettes().find(x => x.name === name);
      if (!p) return;
      const where = this._applyPalette(p.c.slice());
      this.showInfo('🎨 ' + p.name + ' → ' + where);
    },
    deleteCustomPalette(name) {
      this._savePalettes(this._loadPalettes().filter(p => p.name !== name));
      this.renderPaletteTemplates();
      this.showInfo('🗑 DELETED PALETTE: ' + name);
    },
    renderPaletteTemplates() {
      const wrap = document.getElementById('bl-templates');
      if (!wrap) return;
      const builtins = this.PALETTE_TEMPLATES.map((t, i) =>
        '<div class="bl-pal-chip" title="' + t.name + '" onclick="BLD.applyPaletteTemplate(' + i + ')" style="background:' + this._palGrad(t.c) + '"></div>'
      ).join('');
      const custom = this._loadPalettes().map(p =>
        '<div class="bl-pal-chip bl-pal-custom" title="' + p.name + ' (right-click to delete)" onclick="BLD.applyCustomPalette(\'' + p.name + '\')" oncontextmenu="event.preventDefault();BLD.deleteCustomPalette(\'' + p.name + '\')" style="background:' + this._palGrad(p.c) + '"></div>'
      ).join('');
      const saveChip = '<div class="bl-pal-save" title="Save the current colours as a reusable palette" onclick="BLD.saveCurrentPalette()">+</div>';
      wrap.innerHTML = builtins + custom + saveChip;
    },
    _applyPalette(cols) {
      if (!this.levelData) return;
      const sel = (this._selection || []).filter(o =>
        (this.levelData.platforms || []).includes(o) || (this.levelData.icePlats || []).includes(o));
      const ct = this._colorTarget;
      let where;
      if (sel.length > 1) { sel.forEach(o => { o.colors = cols.slice(); }); where = sel.length + ' BLOCKS'; }
      else if (ct && (ct.type === 'platform' || ct.type === 'icePlat') && ct.obj) { ct.obj.colors = cols.slice(); where = 'THIS BLOCK'; }
      else { this.levelData.platColors = cols.slice(); where = 'NEW TERRAIN'; }
      for (let k = 0; k < 5; k++) { const el = document.getElementById('bl-col' + k); if (el) el.value = cols[k]; }
      const qf = document.getElementById('bl-quickfill'); if (qf) qf.value = cols[2];
      this.updateInfo();
      return where;
    },
    applyPaletteTemplate(i) {
      const tpl = this.PALETTE_TEMPLATES[i];
      if (!tpl) return;
      const where = this._applyPalette(tpl.c.slice());
      this.showInfo('🎨 ' + tpl.name + ' → ' + where);
    },
    // Lerp a hex colour toward white (f>0) or black (f<0) by fraction |f|.
    _shade(hex, f) {
      let h = String(hex || '#888888').replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      let r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      if (!isFinite(r)) { r = g = b = 136; }
      const t = f < 0 ? 0 : 255, a = Math.abs(f);
      r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
      const hx = n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
      return '#' + hx(r) + hx(g) + hx(b);
    },
    // Build a 5-shade ramp from one base colour (dark underside → bright top).
    quickFill(base) {
      const cols = [this._shade(base, -0.55), this._shade(base, -0.3), base, this._shade(base, 0.2), this._shade(base, 0.42)];
      const where = this._applyPalette(cols);
      this.showInfo('🎨 FILL → ' + where);
    },
    toggleColorAdvanced() {
      const adv = document.getElementById('bl-adv-pickers');
      if (!adv) return;
      const show = adv.style.display === 'none' || !adv.style.display;
      adv.style.display = show ? 'flex' : 'none';
      const btn = document.getElementById('bl-adv-toggle');
      if (btn) btn.classList.toggle('on', show);
    },

    // ── Platform-editor MODAL: same templates + quick-fill ──────────
    // These set the modal's pe-col inputs (the modal applies them on Save),
    // respecting each input's data-slot-index remap for special platforms.
    peRenderTemplates() {
      const wrap = document.getElementById('pe-templates');
      if (!wrap) return;
      wrap.innerHTML = this.PALETTE_TEMPLATES.map((t, i) => {
        const grad = 'linear-gradient(180deg,' + t.c[4] + ' 0%,' + t.c[2] + ' 55%,' + t.c[0] + ' 100%)';
        return '<div class="bl-pal-chip" title="' + t.name + '" onclick="BLD.peApplyTemplate(' + i + ')" style="background:' + grad + '"></div>';
      }).join('');
    },
    _peSetCols(cols) {
      for (let pos = 0; pos < 5; pos++) {
        const inp = document.getElementById('pe-col' + pos);
        if (!inp) continue;
        const idx = parseInt(inp.dataset.slotIndex, 10);
        const ci = Number.isInteger(idx) ? idx : pos;
        if (cols[ci]) inp.value = cols[ci];
      }
    },
    peApplyTemplate(i) {
      const tpl = this.PALETTE_TEMPLATES[i];
      if (!tpl) return;
      this._peSetCols(tpl.c);
    },
    peQuickFill(base) {
      this._peSetCols([this._shade(base, -0.55), this._shade(base, -0.3), base, this._shade(base, 0.2), this._shade(base, 0.42)]);
    },
    peToggleAdvanced() {
      const adv = document.getElementById('pe-adv-swatches');
      if (!adv) return;
      const show = adv.style.display === 'none' || !adv.style.display;
      adv.style.display = show ? 'flex' : 'none';
      const btn = document.getElementById('pe-adv-toggle');
      if (btn) btn.classList.toggle('gold', show);
    },

    updatePlatColor(idx, val) {
      if (!this.levelData) return;
      const labels = ['BODY', 'DIRT', 'GRASS', 'TOP', 'BLADE'];
      const statusEl = document.getElementById('bl-color-status');
      // Multi-select: apply to all selected platforms/icePlats
      const sel = (this._selection || []).filter(o =>
        (this.levelData.platforms || []).includes(o) ||
        (this.levelData.icePlats || []).includes(o)
      );
      if (sel.length > 1) {
        sel.forEach(o => {
          if (!o.colors) o.colors = [...(this.levelData.platColors || ['#1a3010', '#243a18', '#3a7a28', '#4a9a32', '#5ab840'])];
          o.colors[idx] = val;
        });
        if (statusEl) statusEl.textContent = '● ' + sel.length + ' SELECTED: ' + labels[idx] + ' = ' + val;
        return;
      }
      // Single selected platform
      const target = this._colorTarget;
      if (target && (target.type === 'platform' || target.type === 'icePlat') && target.obj) {
        if (!target.obj.colors) target.obj.colors = [...(this.levelData.platColors || ['#1a3010', '#243a18', '#3a7a28', '#4a9a32', '#5ab840'])];
        target.obj.colors[idx] = val;
        if (statusEl) statusEl.textContent = '● SELECTED: ' + labels[idx] + ' = ' + val;
      } else {
        // No selection: modify global palette only (affects NEW terrain placed after this)
        if (!Array.isArray(this.levelData.platColors))
          this.levelData.platColors = ['#1a3010', '#243a18', '#3a7a28', '#4a9a32', '#5ab840'];
        this.levelData.platColors[idx] = val;
        if (statusEl) statusEl.textContent = '◆ PALETTE ' + labels[idx] + ' = ' + val + ' (new terrain only)';
      }
    },

    showInfo(msg) {
      const el = document.getElementById('builder-info'); if (!el) return;
      el.textContent = msg; clearTimeout(this._t); this._t = setTimeout(() => this.updateInfo(), 2000);
    },

    openCat(cat, toggle = true) {
      // Toggle category panels
      const panels = ['terrain', 'hazard', 'flow', 'animals', 'objects', 'enemies', 'info'];
      const willOpen = toggle ? (this._openCat !== cat) : true;
      panels.forEach(c => {
        const panel = document.getElementById('blpanel-' + c);
        const btn = document.getElementById('blcat-' + c);
        const open = c === cat && willOpen;
        if (panel) panel.style.display = open ? 'grid' : 'none';
        if (btn) btn.classList.toggle('active', open);
      });
      this._openCat = willOpen ? cat : null;
      this._autoPanelCat = cat;
      // Opening a category panel collapses the settings panel — unless the
      // controller is actively navigating it (we don't want to fight the user).
      if (typeof BLD_NAV === 'undefined' || !BLD_NAV.active) {
        this.toggleSettingsPanel(false);
      }
      // Position panel vertically aligned with its category button.
      //
      // Previously this used getBoundingClientRect() differences, which
      // includes #wrap's CSS transform scaling — giving wrong pixel
      // offsets on anything but a 1:1 viewport. It also never clamped
      // the panel's max-height, so categories near the bottom of the
      // sidebar (Items, Foes, Info) pushed their panels off the bottom
      // of the 540 px wrap, clipping the last tool rows.
      //
      // Use offsetTop (un-transformed CSS pixels) and dynamically set
      // max-height so the panel always fits inside #wrap.
      // Builder 2.0: the part dock is bottom-anchored via CSS (see the
      // "Builder 2.0 — SMM2-style layout" block). Clear any stale inline
      // top/maxHeight from the old left-rail layout so the CSS wins.
      const panel = document.getElementById('blpanel-' + cat);
      if (panel) { panel.style.top = ''; panel.style.maxHeight = ''; }
    },

    // ── Save the in-progress edit back to its source level slot ──
    // Persists to localStorage so the edit survives reloads, AND replaces
    // the in-memory WORLDS entry so the change is immediately playable.
    saveEdit() {
      if (!isLocalEditMode()) { this.showInfo('LOCAL EDIT MODE OFF'); return; }
      const tgt = this._editTarget;
      if (!tgt || !this.levelData) { this.showInfo('NO EDIT TARGET — open via ✎ EDIT'); return; }
      const wd = WORLDS[tgt.world - 1];
      if (!wd || !wd.levels || !wd.levels[tgt.level - 1]) { this.showInfo('TARGET MISSING'); return; }
      // Strip transient runtime fields before serialising
      const clean = JSON.parse(JSON.stringify(this.levelData));
      delete clean._platformsOriginal;
      delete clean._eqChunksLost;
      if (Array.isArray(clean.platforms)) for (const p of clean.platforms) { if (p) delete p._eqDmg; }
      // Replace live + persist override
      wd.levels[tgt.level - 1] = clean;
      try { localStorage.setItem('pogl_lvl_w' + tgt.world + '_l' + tgt.level, JSON.stringify(clean)); } catch (e) { }
      this.showInfo('💾 SAVED W' + tgt.world + '-' + tgt.level + ' (LOCAL)');
    },

    // ── Write every saved edit back to the source HTML file ──────────
    // Uses the File System Access API (Chrome / Edge on localhost or file://).
    // The HTML file's <script> is mutated by injecting an `applyHardcodedEdits()`
    // call that contains the saved overrides as a JSON literal — keeps changes
    // robust against the giant single-line WORLDS array.
    async patchHtmlFile() {
      if (!isLocalEditMode()) { this.showInfo('LOCAL EDIT MODE OFF'); return; }
      if (typeof window.showOpenFilePicker !== 'function') {
        this.showInfo('FSA API UNAVAILABLE — USE A CHROMIUM BROWSER');
        return;
      }
      // Gather every saved edit
      const edits = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const m = key && key.match(/^pogl_lvl_w(\d+)_l(\d+)$/);
          if (m) {
            try { edits[key] = JSON.parse(localStorage.getItem(key)); } catch (e) { }
          }
        }
      } catch (e) { }
      if (!Object.keys(edits).length) { this.showInfo('NO SAVED EDITS TO WRITE'); return; }
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Game HTML', accept: { 'text/html': ['.html', '.htm'] } }],
          multiple: false,
        });
        const file = await handle.getFile();
        let text = await file.text();
        // Build sentinel + markers via fromCharCode so the literal text never
        // appears verbatim in THIS function's own source — that way the
        // search below can't ever match its own definition (the bug that ate
        // the file last time).
        const SL = String.fromCharCode(47), ST = String.fromCharCode(42);
        const SENTINEL = SL + ST + '@LEVEL_EDITS_INSERT_HERE@' + ST + SL;
        const MARK_BEGIN = SL + ST + '===HARDCODED-EDITS-BEGIN===' + ST + SL;
        const MARK_END = SL + ST + '===HARDCODED-EDITS-END===' + ST + SL;
        const block =
          MARK_BEGIN + '\n' +
          '    (function applyHardcodedEdits(){\n' +
          '      const E = ' + JSON.stringify(edits, null, 2) + ';\n' +
          '      for (const k in E) {\n' +
          '        const m = k.match(/^pogl_lvl_w(\\d+)_l(\\d+)$/);\n' +
          '        if (!m) continue;\n' +
          '        const w = +m[1], l = +m[2];\n' +
          '        if (WORLDS[w-1] && WORLDS[w-1].levels) WORLDS[w-1].levels[l-1] = E[k];\n' +
          '      }\n' +
          '    })();\n' +
          '    ' + MARK_END;
        const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existsRe = new RegExp(reEsc(MARK_BEGIN) + '[\\s\\S]*?' + reEsc(MARK_END));
        if (existsRe.test(text)) {
          text = text.replace(existsRe, block);
        } else {
          const idx = text.indexOf(SENTINEL);
          if (idx < 0) { this.showInfo('SENTINEL NOT FOUND — WRONG FILE?'); return; }
          text = text.slice(0, idx) + block + '\n    ' + text.slice(idx);
        }
        const writable = await handle.createWritable();
        await writable.write(text);
        await writable.close();
        // Clear localStorage now that edits are baked into the file
        for (const k of Object.keys(edits)) try { localStorage.removeItem(k); } catch (e) { }
        this.showInfo('📝 HTML PATCHED · RELOAD TO SEE');
      } catch (e) {
        this.showInfo('PATCH CANCELLED OR FAILED');
      }
    },

    exportJSON() {
      if (!this.levelData) return;
      // Beat-to-save: require clearing the course once (under its own rules)
      // before it can be exported/shared — SMM2's upload gate.
      if (!this.levelData._verified) {
        this.showInfo('▶ BEAT YOUR COURSE FIRST — hit ▶ TEST and clear it to unlock export');
        try { if (window.sfx) sfx('hit'); } catch (e) {}
        return;
      }
      const json = JSON.stringify(this.levelData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (this.levelData.name || 'level').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
      a.click();
      URL.revokeObjectURL(url);
      this.showInfo('EXPORTED: ' + a.download);
    },

    importJSON() {
      const fi = document.getElementById('bl-import-file');
      if (fi) { fi.value = ''; fi.click(); }
    },

    onImportFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.platforms || !Array.isArray(data.platforms)) throw new Error('Invalid level data');
          // Ensure required arrays
          ['enemies', 'coins', 'qblocks', 'spikes', 'bounces', 'icePlats', 'checkpoints'].forEach(k => {
            if (!Array.isArray(data[k])) data[k] = [];
          });
          if (!data.weather) data.weather = 'none';
          this.levelData = data;
          const n = document.getElementById('bl-name'), bw = document.getElementById('bl-width'),
            bt = document.getElementById('bl-theme'), bv = document.getElementById('bl-void');
          if (n) n.value = data.name || 'IMPORTED';
          if (bw) bw.value = data.width || 3200;
          if (bv) bv.checked = !!data.voidFloor;
          this.theme = inferThemeKey(data, this.theme || 'highland');
          if (bt) bt.value = this.theme;
          const bwx = document.getElementById('bl-weather'); if (bwx) bwx.value = getLevelWeather(data);
          const bm = document.getElementById('bl-muted'); if (bm) bm.checked = !!data.muted;
          this.scrollX = 0;
          this.refreshTopbarFromLevel();
          this.showInfo('IMPORTED: ' + file.name);
        } catch (err) {
          this.showInfo('IMPORT FAILED: ' + err.message);
        }
      };
      reader.readAsText(file);
    },

    drawScene() {
      const ld = this.levelData; if (!ld) return;
      initSpecialPlats(ld); // keep switch/crumble state fresh for preview
      const SB = this.SIDEBAR, sx = this.scrollX, sy = this.scrollY || 0, z = this.zoom || 1;
      const visW = (W - SB) / z, visH = H / z;

      // ── Background — full game-quality per theme ───────────
      const themeKey = inferThemeKey(ld, this.theme || 'highland');
      this.theme = themeKey;
      const tb = THEMES_BG[themeKey] || THEMES_BG.highland;
      const bg = ld.bgColors || tb.bg;
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, cleanThemeColor(bg[0], tb.bg[0])); grad.addColorStop(1, cleanThemeColor(bg[1] || bg[0], tb.bg[1]));
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // ── World-space drawing (inside translation + scale) ─────────
      ctx.save();
      ctx.translate(SB, 0);
      ctx.scale(z, z);
      ctx.translate(-sx, -sy);
      drawThemeBackdrop(ctx, ld, themeKey, { viewX: sx, viewY: sy, viewW: visW, viewH: visH, worldW: ld.width || W, frame: frameCount });
      drawWeatherOverlay(ctx, ld, sx, sy, visW, visH, frameCount, true);
      drawSigns(ctx, ld, sx, sy, visW, visH);
      drawTexts(ctx, ld, sx, sy, visW, visH);
      drawHighlights(ctx, ld, sx, sy, visW, visH);

      // Grid lines — gated by BLD.gridVisible (toolbar toggle). The
      // 32-px primary grid is bright when on, and a 16-px secondary
      // grid is faintly visible too so SNAP=16 placements line up
      // visibly with grid intersections.
      if (this.gridVisible) {
        ctx.lineWidth = 1 / z;
        const gx0 = Math.floor(sx / 16) * 16;
        const gy0 = Math.floor(sy / 16) * 16;
        // Secondary 16-px grid (faint)
        ctx.strokeStyle = 'rgba(126, 216, 255, 0.10)';
        for (let gx = gx0; gx < sx + visW + 10; gx += 16) {
          if (gx % 32 === 0) continue;
          ctx.beginPath(); ctx.moveTo(gx, gy0); ctx.lineTo(gx, sy + visH); ctx.stroke();
        }
        for (let gy = gy0; gy < sy + visH; gy += 16) {
          if (gy % 32 === 0) continue;
          ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx + visW, gy); ctx.stroke();
        }
        // Primary 32-px grid (more visible)
        ctx.strokeStyle = 'rgba(126, 216, 255, 0.22)';
        for (let gx = Math.floor(sx / 32) * 32; gx < sx + visW + 10; gx += 32) { ctx.beginPath(); ctx.moveTo(gx, gy0); ctx.lineTo(gx, sy + visH); ctx.stroke(); }
        for (let gy = Math.floor(sy / 32) * 32; gy < sy + visH; gy += 32) { ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx + visW, gy); ctx.stroke(); }
      }

      // Void floor — always show in builder, gameplay only kills when voidFloor=true
      if (true) {
        const vy = ld.voidY || 460, vg = ctx.createLinearGradient(0, vy, 0, vy + 60);
        vg.addColorStop(0, 'rgba(0,0,0,0.9)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = vg; ctx.fillRect(sx, vy, visW, 80);
        // Draggable void line handle
        ctx.strokeStyle = '#ff0044'; ctx.lineWidth = 2 / z; ctx.setLineDash([8 / z, 4 / z]);
        ctx.beginPath(); ctx.moveTo(sx, vy); ctx.lineTo(sx + visW, vy); ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 1;
        // Handle grip in centre
        ctx.fillStyle = '#ff0044'; ctx.fillRect(sx + visW / 2 - 30, vy - 8, 60, 16);
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText('▲▼ VOID', sx + visW / 2, vy + 4); ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(80,0,120,0.3)';
        for (let vx = sx; vx < sx + visW; vx += 60) {
          const sh = Math.sin((vx + frameCount * 2) * 0.05) * 8; ctx.fillRect(vx, vy + sh, 30, 4);
        }
      }

      // Normal platforms — identical to game rendering
      for (const p of (ld.platforms || [])) {
        if (!p) continue;
        if (p.type && p.type !== 'ground') continue; // special types drawn separately below
        drawThemedTerrain(ctx, p, ld, themeKey, frameCount);
      }

      // Moving platforms
      for (const mp of (ld.movingPlats || [])) {
        const mx = mp._cx || mp.x, my = mp._cy || mp.y, mw = mp.w || 60, mh = mp.h || 14;
        // Draw travel path line first
        ctx.strokeStyle = 'rgba(80,180,255,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(mp.x + mw / 2, mp.y + mh / 2); ctx.lineTo((mp.x2 || mp.x) + mw / 2, (mp.y2 || mp.y) + mh / 2); ctx.stroke();
        ctx.setLineDash([]);
        // Ghost at endpoint
        ctx.globalAlpha = 0.28; ctx.fillStyle = '#4a8acf'; ctx.fillRect(mp.x2 || mp.x, mp.y2 || mp.y, mw, mh); ctx.globalAlpha = 1;
        // Platform body — steel blue with moving arrows
        ctx.fillStyle = '#1a3a6a'; ctx.fillRect(mx, my, mw, mh);
        ctx.fillStyle = '#3a7ac8'; ctx.fillRect(mx, my, mw, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(mx, my, mw, 1);
        // Animated chevrons
        const moff = Math.floor(frameCount / 4) % 8;
        ctx.fillStyle = '#5aaeff';
        for (let dx = moff; dx < mw - 4; dx += 10) { ctx.beginPath(); ctx.moveTo(mx + dx, my + mh - 3); ctx.lineTo(mx + dx + 4, my + 3); ctx.lineTo(mx + dx + 7, my + mh - 3); ctx.lineTo(mx + dx + 5, my + mh - 3); ctx.lineTo(mx + dx + 4, my + 5); ctx.lineTo(mx + dx + 2, my + mh - 3); ctx.closePath(); ctx.fill(); }
        // ↔ icon at centre
        ctx.font = 'bold 8px sans-serif'; ctx.fillStyle = '#9adcff'; ctx.textAlign = 'center';
        ctx.fillText('↔', mx + mw / 2, my + mh / 2 + 3); ctx.textAlign = 'left';
      }
      // One-way platforms (translucent lime with upward arrow pattern)
      for (const p of (ld.platforms || [])) {
        if (p.type !== 'oneway') continue;
        // Striped pattern base
        ctx.fillStyle = '#1a3a1a'; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#3a8a3a'; ctx.fillRect(p.x, p.y, p.w, 4);
        // Diagonal stripes
        ctx.save(); ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
        ctx.strokeStyle = 'rgba(80,200,80,0.3)'; ctx.lineWidth = 6;
        for (let dx = -p.h; dx < p.w + p.h; dx += 14) { ctx.beginPath(); ctx.moveTo(p.x + dx, p.y + p.h); ctx.lineTo(p.x + dx + p.h, p.y); ctx.stroke(); }
        ctx.restore();
        ctx.fillStyle = 'rgba(100,255,100,0.15)'; ctx.fillRect(p.x, p.y, p.w, p.h);
        // ↑ arrows spaced across top
        ctx.fillStyle = '#6aff6a';
        for (let dx = 8; dx < p.w - 8; dx += 20) {
          ctx.beginPath(); ctx.moveTo(p.x + dx, p.y + p.h - 2); ctx.lineTo(p.x + dx + 6, p.y + 2); ctx.lineTo(p.x + dx + 12, p.y + p.h - 2); ctx.lineTo(p.x + dx + 9, p.y + p.h - 2); ctx.lineTo(p.x + dx + 6, p.y + 5); ctx.lineTo(p.x + dx + 3, p.y + p.h - 2); ctx.closePath(); ctx.fill();
        }
      }
      // Crumble platforms (rough brown — looks like stone ready to break)
      for (const p of (ld.platforms || [])) {
        if (p.type !== 'crumble') continue;
        // Stone texture base
        ctx.fillStyle = '#4a2e08'; ctx.fillRect(p.x, p.y, p.w, p.h);
        // Block grid
        const bs = 16; ctx.strokeStyle = '#2a1800'; ctx.lineWidth = 1;
        for (let bx = p.x; bx < p.x + p.w; bx += bs) { ctx.beginPath(); ctx.moveTo(bx, p.y); ctx.lineTo(bx, p.y + p.h); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(p.x, p.y + p.h / 2); ctx.lineTo(p.x + p.w, p.y + p.h / 2); ctx.stroke();
        // Highlight top
        ctx.fillStyle = '#7a4e18'; ctx.fillRect(p.x, p.y, p.w, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(p.x, p.y, p.w, 1);
        // Crack detail
        ctx.strokeStyle = '#2a1000'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x + p.w * 0.3, p.y); ctx.lineTo(p.x + p.w * 0.35, p.y + p.h * 0.6); ctx.lineTo(p.x + p.w * 0.4, p.y + p.h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x + p.w * 0.7, p.y); ctx.lineTo(p.x + p.w * 0.65, p.y + p.h * 0.7); ctx.stroke();
        // ⚠ label
        ctx.font = '7px "Press Start 2P"'; ctx.fillStyle = '#cc8800'; ctx.textAlign = 'center';
        ctx.fillText('⚠', p.x + p.w / 2, p.y - 2); ctx.textAlign = 'left';
      }
      // Break-shot platforms (5 hits) — stone block preview
      for (const p of (ld.platforms || [])) {
        if (p.type !== 'breakshot') continue;
        ctx.fillStyle = '#5a4a3a'; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#7c6a52'; ctx.fillRect(p.x, p.y, p.w, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(p.x, p.y, p.w, 1);
        // brick lines
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
        const seg = Math.max(16, Math.floor(p.w / Math.max(2, Math.round(p.w / 22))));
        for (let bx = p.x + seg; bx < p.x + p.w; bx += seg) { ctx.beginPath(); ctx.moveTo(bx, p.y + 4); ctx.lineTo(bx, p.y + p.h); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(p.x, p.y + p.h * 0.55); ctx.lineTo(p.x + p.w, p.y + p.h * 0.55); ctx.stroke();
        ctx.strokeStyle = '#3a2818'; ctx.lineWidth = 1.5; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1); ctx.lineWidth = 1;
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#ff9933'; ctx.textAlign = 'center';
        ctx.fillText('×5', p.x + p.w / 2, p.y - 2); ctx.textAlign = 'left';
      }
      // Soundwave platforms
      for (const p of (ld.platforms || [])) {
        if (p.type !== 'soundwave') continue;
        ctx.strokeStyle = '#22ccaa'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.setLineDash([]);
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#22ccaa'; ctx.textAlign = 'center';
        ctx.fillText('WAVE', p.x + p.w / 2, p.y + p.h / 2 + 2); ctx.textAlign = 'left';
      }

      // ── New expansion-pack platform types (builder preview) ──────
      // Each draws a simplified static preview + label so the level
      // designer can see the shape without animating any state.
      for (const p of (ld.platforms || [])) {
        if (!p || !p.type) continue;
        const labelStyle = () => { ctx.font = '5px "Press Start 2P"'; ctx.textAlign = 'center'; };

        if (p.type === 'conveyor') {
          const dir = p.dir === -1 ? -1 : 1;
          const _cvp = (p.colors && p.colors.length === 5)
            ? p.colors
            : ['#3a2a18', '#4a3a28', '#6a5234', '#8a6a44', '#c8a060'];
          ctx.fillStyle = _cvp[1]; ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = _cvp[3]; ctx.fillRect(p.x, p.y, p.w, 3);
          ctx.fillStyle = _cvp[4];
          for (let dx = 0; dx < p.w - 6; dx += 12) {
            const ax = p.x + dx;
            if (dir > 0) {
              ctx.beginPath();
              ctx.moveTo(ax, p.y + p.h - 3); ctx.lineTo(ax + 6, p.y + p.h / 2);
              ctx.lineTo(ax, p.y + 4); ctx.lineTo(ax + 2, p.y + p.h / 2); ctx.closePath(); ctx.fill();
            } else {
              ctx.beginPath();
              ctx.moveTo(ax + 6, p.y + p.h - 3); ctx.lineTo(ax, p.y + p.h / 2);
              ctx.lineTo(ax + 6, p.y + 4); ctx.lineTo(ax + 4, p.y + p.h / 2); ctx.closePath(); ctx.fill();
            }
          }
          labelStyle(); ctx.fillStyle = '#c8a060';
          ctx.fillText('CONV ' + (dir > 0 ? '→' : '←'), p.x + p.w / 2, p.y - 3);
          ctx.textAlign = 'left';
        } else if (p.type === 'timed') {
          const _tmp = (p.colors && p.colors.length === 5)
            ? p.colors
            : ['#1e1438', '#3a2a6a', '#5a4a9a', '#88aaff', '#bcd4ff'];
          ctx.fillStyle = _tmp[1] + '80'; ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.strokeStyle = _tmp[3]; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3]);
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          ctx.setLineDash([]); ctx.lineWidth = 1;
          ctx.fillStyle = _tmp[3]; ctx.fillRect(p.x, p.y, p.w, 3);
          labelStyle(); ctx.fillText('TIMD ' + (p.period || 180) + 'f', p.x + p.w / 2, p.y - 3);
          ctx.textAlign = 'left';
        } else if (p.type === 'fallaway') {
          const _fap = (p.colors && p.colors.length === 5)
            ? p.colors
            : ['#5a3a18', '#8a5a28', '#a87a3a', '#caa060', '#e6c478'];
          ctx.fillStyle = _fap[1]; ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = _fap[3]; ctx.fillRect(p.x, p.y, p.w, 3);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          for (let dx = 4; dx < p.w - 4; dx += 12) ctx.fillRect(p.x + dx, p.y + p.h - 4, 6, 2);
          // Yellow caution stripe
          ctx.fillStyle = 'rgba(255, 220, 60, 0.55)';
          ctx.fillRect(p.x, p.y + p.h - 7, p.w, 2);
          labelStyle(); ctx.fillStyle = _fap[3]; ctx.fillText('FALL', p.x + p.w / 2, p.y - 3);
          ctx.textAlign = 'left';
        } else if (p.type === 'magnetic') {
          const cx = p.x + (p.w || 32) / 2, cy = p.y + (p.h || 32) / 2;
          const R = p.radius || 120;
          // Pull radius
          ctx.strokeStyle = 'rgba(170, 68, 255, 0.5)';
          ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#5a2080'; ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = '#9050d0'; ctx.fillRect(p.x, p.y, p.w, 3);
          ctx.fillStyle = '#ff4488'; ctx.fillRect(p.x + 2, p.y + p.h - 6, (p.w - 4) / 2 - 2, 4);
          ctx.fillStyle = '#4488ff'; ctx.fillRect(p.x + p.w / 2 + 2, p.y + p.h - 6, (p.w - 4) / 2 - 2, 4);
          labelStyle(); ctx.fillStyle = '#aa44ff'; ctx.fillText('MAG ' + R, cx, p.y - 3);
          ctx.textAlign = 'left';
        } else if (p.type === 'windtunnel') {
          ctx.fillStyle = 'rgba(136, 232, 255, 0.22)'; ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.strokeStyle = '#88e8ff'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          ctx.setLineDash([]); ctx.lineWidth = 1;
          // Up arrows
          ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 1.5;
          for (let y = p.y + p.h - 6; y > p.y + 8; y -= 14) {
            ctx.beginPath();
            ctx.moveTo(p.x + 4, y); ctx.lineTo(p.x + p.w / 2, y - 6); ctx.lineTo(p.x + p.w - 4, y);
            ctx.stroke();
          }
          ctx.lineWidth = 1;
          labelStyle(); ctx.fillStyle = '#88e8ff'; ctx.fillText('WIND', p.x + p.w / 2, p.y - 3);
          ctx.textAlign = 'left';
        } else if (p.type === 'rotating') {
          const ccx = p.cx != null ? p.cx : p.x;
          const ccy = p.cy != null ? p.cy : p.y;
          const radius = p.radius || 60;
          // Orbit path (dashed circle around the pivot)
          ctx.strokeStyle = 'rgba(136, 170, 255, 0.45)';
          ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(ccx, ccy, radius, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          // Platform at its current orbit position
          const px2 = p._cx != null ? p._cx : (ccx + Math.cos(p.startAngle || 0) * radius);
          const py2 = p._cy != null ? p._cy : (ccy + Math.sin(p.startAngle || 0) * radius);
          const _rtp = (p.colors && p.colors.length === 5)
            ? p.colors
            : ['#28284e', '#3a3a6a', '#5a5aa0', '#88aaff', '#bcd4ff'];
          ctx.fillStyle = _rtp[1]; ctx.fillRect(px2, py2, p.w || 60, p.h || 14);
          ctx.fillStyle = _rtp[3]; ctx.fillRect(px2, py2, p.w || 60, 3);
          // Pivot marker
          ctx.fillStyle = '#ffd700'; ctx.fillRect(ccx - 2, ccy - 2, 4, 4);
          labelStyle(); ctx.fillStyle = '#88aaff'; ctx.fillText('ROT', ccx, ccy + radius + 10);
          ctx.textAlign = 'left';
        } else if (p.type === 'water') {
          ctx.fillStyle = 'rgba(40, 140, 220, 0.45)'; ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.strokeStyle = '#3aa8e0'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          ctx.setLineDash([]); ctx.lineWidth = 1;
          // Surface ripples
          ctx.strokeStyle = 'rgba(200, 240, 255, 0.55)';
          ctx.beginPath();
          for (let xx = p.x; xx <= p.x + p.w; xx += 4) {
            const yy = p.y + Math.sin(xx * 0.18) * 1.5;
            if (xx === p.x) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
          labelStyle(); ctx.fillStyle = '#3aa8e0'; ctx.fillText('WATER', p.x + p.w / 2, p.y - 3);
          ctx.textAlign = 'left';
        } else if (p.type === 'grapplehook') {
          const w = p.w || 24, h = p.h || 24;
          // Glow halo
          ctx.fillStyle = 'rgba(136, 204, 255, 0.30)';
          ctx.beginPath(); ctx.arc(p.x + w / 2, p.y + h / 2, w * 0.9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1f3a5a'; ctx.fillRect(p.x, p.y, w, h);
          ctx.fillStyle = '#88ccff'; ctx.fillRect(p.x + 2, p.y + 2, w - 4, h - 4);
          // Hook glyph (J)
          ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x + w / 2, p.y + 5);
          ctx.lineTo(p.x + w / 2, p.y + h - 8);
          ctx.arc(p.x + w / 2 - 4, p.y + h - 8, 4, 0, Math.PI);
          ctx.stroke();
          ctx.lineWidth = 1;
          labelStyle(); ctx.fillStyle = '#88ccff'; ctx.fillText('HOOK', p.x + w / 2, p.y - 3);
          ctx.textAlign = 'left';
        }
      }

      // Switch A/B platforms
      for (const p of (ld.platforms || [])) {
        if (p.type !== 'switchA' && p.type !== 'switchB') continue;
        const isA = p.type === 'switchA';
        const g = p.switchGroup || 'A';
        const active = isA ? !switchGroupState[g] : switchGroupState[g];
        const col = isA ? '#cc2200' : '#2244cc', bright = isA ? '#ff4422' : '#4488ff';
        if (active) {
          ctx.fillStyle = col; ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = bright; ctx.fillRect(p.x, p.y, p.w, 3);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          for (let dx = 6; dx < p.w - 4; dx += 12) ctx.fillRect(p.x + dx, p.y + 5, 4, 4);
        } else {
          ctx.strokeStyle = bright; ctx.lineWidth = 2; ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2); ctx.lineWidth = 1;
          ctx.globalAlpha = 0.12; ctx.fillStyle = col; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.globalAlpha = 1;
          ctx.strokeStyle = bright + '88'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y + p.h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(p.x + p.w, p.y); ctx.lineTo(p.x, p.y + p.h); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText((isA ? 'A:' : 'B:') + g, p.x + p.w / 2, p.y - 3); ctx.textAlign = 'left';
      }
      // Switches
      for (const sw of (ld.switches || [])) {
        const isA = !switchGroupState[sw.switchGroup || 'A'];
        ctx.fillStyle = isA ? '#ff4422' : '#4488ff'; ctx.fillRect(sw.x, sw.y, sw.w || 24, sw.h || 24);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(sw.x + 2, sw.y + 2, (sw.w || 24) - 4, (sw.h || 24) - 4);
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText('SW', sw.x + (sw.w || 24) / 2, sw.y + (sw.h || 24) - 4); ctx.textAlign = 'left';
      }
      // Ice platforms
      for (const ip of (ld.icePlats || [])) {
        const iw = ip.w || 55, ih = ip.h || 18;
        ctx.fillStyle = '#8ad4f0'; ctx.fillRect(ip.x, ip.y, iw, ih);
        ctx.fillStyle = '#c8f0ff'; ctx.fillRect(ip.x, ip.y, iw, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(ip.x, ip.y, iw, 1);
        ctx.fillStyle = '#ffffff';
        for (let ix2 = ip.x + 6; ix2 < ip.x + iw - 4; ix2 += 18) { ctx.fillRect(ix2, ip.y - 2, 2, 4); ctx.fillRect(ix2 - 2, ip.y, 4, 2); }
      }

      // Bounce pads (spring style) with rotation
      for (const bp of (ld.bounces || [])) {
        const bw = bp.w || 50, bh = bp.h || 14, rot = (bp.rotation || 0) * Math.PI / 180;
        ctx.save();
        ctx.translate(bp.x + bw / 2, bp.y + bh / 2);
        ctx.rotate(rot);
        const x0 = -bw / 2, y0 = -bh / 2;
        ctx.fillStyle = '#003322'; ctx.fillRect(x0, y0 + bh - 5, bw, 5);
        ctx.fillStyle = '#00ff88';
        const na = Math.max(1, Math.floor(bw / 20));
        for (let ai = 0; ai < na; ai++) {
          const ax = x0 + 4 + ai * (bw - 8) / Math.max(1, na - 1);
          ctx.beginPath(); ctx.moveTo(ax, y0 + bh - 6); ctx.lineTo(ax + 6, y0 + 4); ctx.lineTo(ax + 12, y0 + bh - 6);
          ctx.lineTo(ax + 10, y0 + bh - 6); ctx.lineTo(ax + 6, y0 + 6); ctx.lineTo(ax + 2, y0 + bh - 6);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#00ffcc'; ctx.fillRect(x0, y0, bw, 2);
        ctx.restore();
        // Rotation label in builder
        if (bp.rotation) { ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#00cc88'; ctx.textAlign = 'center'; ctx.fillText(bp.rotation + '°', bp.x + bw / 2, bp.y - 4); ctx.textAlign = 'left'; }
      }

      // Spikes (with rotation support + type label)
      for (const sp of (ld.spikes || [])) {
        if (sp.x + (sp.w || 48) < sx - 10 || sp.x > sx + visW + 10) continue;
        const sw2 = sp.w || 48, sh2 = sp.h || 16, rotation = sp.rotation || 0;
        // Pop spikes: show half-extended in builder as preview
        const isPopA = sp.spikeType === 'popA', isPopB = sp.spikeType === 'popB';
        const builderExt = (isPopA || isPopB) ? 0.6 : 1;
        const pts = Math.max(2, Math.floor(sw2 / 12)), tw2 = sw2 / pts;
        ctx.save();
        ctx.translate(sp.x + sw2 / 2, sp.y + sh2 / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-sw2 / 2, -sh2 / 2);
        for (let pi = 0; pi < pts; pi++) {
          const spx = pi * tw2;
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath(); ctx.moveTo(spx + 2, sh2); ctx.lineTo(spx + tw2 / 2 + 2, 1); ctx.lineTo(spx + tw2 + 2, sh2); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#b0b8c0';
          ctx.beginPath(); ctx.moveTo(spx, sh2); ctx.lineTo(spx + tw2 / 2, 1); ctx.lineTo(spx + tw2, sh2); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#e8f0f8';
          ctx.beginPath(); ctx.moveTo(spx + tw2 / 2 - 1, 3); ctx.lineTo(spx + tw2 / 2, 1); ctx.lineTo(spx + tw2 / 2 + 1, 3); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#cc2200'; ctx.beginPath(); ctx.arc(spx + tw2 / 2, 1, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        // Type + rotation label
        ctx.font = '5px "Press Start 2P"'; ctx.textAlign = 'center';
        const spLabel = (sp.spikeType === 'popA' ? 'POP A' : sp.spikeType === 'popB' ? 'POP B' : '') + (rotation ? (' ' + rotation + '°') : '');
        if (spLabel) { ctx.fillStyle = '#ff6622'; ctx.fillText(spLabel, sp.x + sw2 / 2, sp.y - 6); }
        ctx.textAlign = 'left';
      }

      // Allies (Mackenzie placement preview) — static seated pose so
      // the level designer can confirm spawn position before testing.
      for (const _al of (ld.allies || [])) {
        if (!_al || (_al.type !== 'mackenzie' && _al.type)) continue;
        drawMackenzie(ctx, _al.x, _al.y, true, {
          moving: false, tongueFrame: 0.5, tailFrame: 0, walkFrame: 0,
          sitting: true, bigEyes: true,
        });
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#ffaad6';
        ctx.textAlign = 'center';
        ctx.fillText('MACKENZIE', _al.x + 18, _al.y - 4);
        ctx.textAlign = 'left';
      }

      // Ambient NPCs (cows / sheep / chickens) — static placement preview.
      for (const _np of (ld.npcs || [])) {
        if (!_np) continue;
        const _def = NPC_VARIANTS[_np.type]; if (!_def) continue;
        _def.draw(ctx, _np.x, _np.y, true, frameCount, { moving: false, happy: false });
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#aaffcc';
        ctx.textAlign = 'center';
        ctx.fillText(_np.type.toUpperCase(), _np.x + _def.w / 2, _np.y - 4);
        ctx.textAlign = 'left';
      }

      // Checkpoints
      for (const cp of (ld.checkpoints || [])) {
        ctx.fillStyle = '#888'; ctx.fillRect(cp.x + 6, cp.y - 60, 4, 64);
        ctx.fillStyle = '#666';
        ctx.beginPath(); ctx.moveTo(cp.x + 10, cp.y - 60); ctx.lineTo(cp.x + 30, cp.y - 52); ctx.lineTo(cp.x + 10, cp.y - 44); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#555'; ctx.fillRect(cp.x, cp.y, 18, 8);
        ctx.font = '6px "Press Start 2P"'; ctx.fillStyle = '#888'; ctx.textAlign = 'center';
        ctx.fillText('CP', cp.x + 9, cp.y - 65); ctx.textAlign = 'left';
      }

      // Placed powerup items
      const puIBLD = { rapid: '⚡', big: '🎵', bomb: '💣', drum: '🥁', invincible: '🏆', chargerefresh: '⚔️', extrajump: '🪶', shield: '🌿', heal: '❤️' };
      for (const pu of (ld.powerupItems || [])) {
        ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.fillText(puIBLD[pu.type] || '?', pu.x + 14, pu.y + 20); ctx.textAlign = 'left';
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#f5c518'; ctx.textAlign = 'center'; ctx.fillText(pu.type.toUpperCase(), pu.x + 14, pu.y - 3); ctx.textAlign = 'left';
      }
      // Player start marker (draggable)
      const _sx2 = ld.startX || 60;
      const _sy2 = ld.startY || 398;
      ctx.fillStyle = '#00ffaa';
      ctx.beginPath(); ctx.moveTo(_sx2 + 8, _sy2 + 7); ctx.lineTo(_sx2 + 18, _sy2 - 8); ctx.lineTo(_sx2 - 2, _sy2 - 8); ctx.closePath(); ctx.fill();
      ctx.fillRect(_sx2 + 5, _sy2 - 23, 6, 15);
      ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#00ffaa'; ctx.textAlign = 'center';
      ctx.fillText('START', _sx2 + 8, _sy2 - 25); ctx.textAlign = 'left';

      // Mars Bar pieces (builder)
      for (const mb of (ld.marsBarPieces || [])) {
        ctx.font = '18px serif'; ctx.textAlign = 'center';
        ctx.fillText('🍫', mb.x - sx, mb.y - sy + 6);
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#c8642a';
        ctx.fillText('#' + ((mb.idx || 0) + 1), mb.x - sx, mb.y - sy - 8);
        ctx.textAlign = 'left';
      }
      // Spirit Embers
      for (const em of (ld.spiritEmbers || [])) {
        ctx.font = '16px serif'; ctx.textAlign = 'center';
        ctx.fillText('🔥', em.x + 10, em.y + 16); ctx.textAlign = 'left';
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#ff8820'; ctx.textAlign = 'center';
        ctx.fillText('#' + (em.idx + 1), em.x + 10, em.y - 2); ctx.textAlign = 'left';
      }
      // Trophies
      for (const t of (ld.trophies || [])) {
        ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.fillText('🏆', t.x + 12, t.y + 20); ctx.textAlign = 'left';
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
        ctx.fillText('INVC', t.x + 12, t.y - 3); ctx.textAlign = 'left';
      }
      // Goal — render the ACTUAL castle sprite so the builder shows
      // exactly what the player will see, where it will be. A dashed
      // footprint box (100×140) marks the castle's bounds; a green
      // base line marks where the castle floor must rest on terrain.
      if (ld.goalX != null && ld.goalY != null && ld.goalX > -500) {
        const gX = ld.goalX, gY = ld.goalY, GW = 100, GH = 140;
        // Footprint outline
        ctx.save();
        ctx.strokeStyle = 'rgba(245,197,24,0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(gX, gY, GW, GH);
        ctx.setLineDash([]);
        // Castle sprite (global drawCastle from the inline engine),
        // themed to the level so the editor preview matches in-game.
        if (typeof drawCastle === 'function') {
          const _ckTheme = (typeof inferThemeKey === 'function')
            ? inferThemeKey(ld) : (this.theme || 'highland');
          try { drawCastle(ctx, gX, gY, (typeof frameCount === 'number' ? frameCount : 0), _ckTheme); }
          catch (e) { ctx.fillStyle = '#f5c518'; ctx.fillRect(gX, gY, 6, GH); }
        } else {
          ctx.fillStyle = '#f5c518'; ctx.fillRect(gX, gY, 6, GH);
        }
        // Base line — the castle floor; this must sit flush on a
        // platform top for the level to be completable.
        const baseY = gY + GH;
        ctx.strokeStyle = '#3affa0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gX - 6, baseY);
        ctx.lineTo(gX + GW + 6, baseY);
        ctx.stroke();
        // Warn (red base line + label) if the castle base isn't
        // resting on a platform — i.e. it's buried in / floating off
        // terrain and the level can't be finished.
        const surfaces = []
          .concat(ld.platforms || [])
          .concat(ld.icePlats || [])
          .concat(ld.bounces || []);
        let rests = false, buried = false;
        for (const s of surfaces) {
          if (!s || s.x == null) continue;
          const sw = s.w || 0, sh = s.h || 18;
          if (s.x + sw <= gX || s.x >= gX + 64) continue;   // no x overlap
          if (Math.abs(s.y - baseY) <= 6) rests = true;     // flush on top
          if (s.y < baseY - 6 && s.y + sh > gY + 50) buried = true; // pierces the castle
        }
        ctx.font = '7px "Press Start 2P"';
        ctx.textAlign = 'center';
        if (buried || (!rests && surfaces.length)) {
          ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(gX - 6, baseY); ctx.lineTo(gX + GW + 6, baseY); ctx.stroke();
          ctx.fillStyle = '#ff6666';
          ctx.fillText(buried ? '⚠ CASTLE STUCK IN TERRAIN' : '⚠ CASTLE NOT ON A PLATFORM',
            gX + GW / 2, gY - 8);
        } else {
          ctx.fillStyle = '#f5c518';
          ctx.fillText('GOAL', gX + GW / 2, gY - 8);
        }
        ctx.textAlign = 'left';
        ctx.restore();
      }

      // Enemies — dispatch to the proper sprite by `v` so the builder
      // shows the same figure the player will see in-game (turret,
      // teleporter, berserker, mini-boss, mega-boss all look distinct
      // instead of falling through to a generic drum).
      for (const e of (ld.enemies || [])) {
        const ev = e.v || 0, elite = enemyIsEliteFlag(e.elite);
        const _frame = (typeof frameCount === 'number') ? frameCount : 0;
        // Provide _bld defaults so sprite renderers that read mutable
        // runtime state (e.g. teleporter _teleState, berserker _frenzy)
        // still produce a coherent "idle" preview in the editor.
        const _eDraw = Object.assign({ facingRight: true }, e);
        if (ev === 6) {
          // World-themed mini-boss (drawBoss is global)
          if (typeof drawBoss === 'function') {
            drawBoss(ctx, e.x, e.y, e.hp || 12, e.hp || 12, _frame,
                     (typeof currentWorld === 'number' ? currentWorld : 1), 'neutral');
          } else {
            drawDrum32(ctx, e.x, e.y, { v: 6, elite: true }, e.hp || 12, e.hp || 12, _frame);
          }
        } else if (ev === 99) {
          // 2× scaled drum mega-boss
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.scale(2, 2);
          drawDrum32(ctx, 0, 0, { v: 0, elite: true }, e.hp || 30, e.hp || 30, _frame);
          ctx.restore();
        } else if (ev === 98 && typeof drawSummonerBoss === 'function') {
          drawSummonerBoss(ctx, e.x, e.y, _eDraw, _frame);
        } else if (ev === 97 && typeof drawJuggernautBoss === 'function') {
          drawJuggernautBoss(ctx, e.x, e.y, _eDraw, _frame);
        } else if (ev === 12 && typeof drawTurret32 === 'function') {
          drawTurret32(ctx, e.x, e.y, _eDraw, _frame);
        } else if (ev === 13 && typeof drawTeleporter32 === 'function') {
          drawTeleporter32(ctx, e.x, e.y, _eDraw, _frame);
        } else if (ev === 14 && typeof drawBerserker32 === 'function') {
          drawBerserker32(ctx, e.x, e.y, _eDraw, _frame);
        } else if (ev === 15 && typeof drawCutpurse32 === 'function') {
          drawCutpurse32(ctx, e.x, e.y, _eDraw, _frame);
        } else if (ev === 96 && typeof drawCoinHoarderBoss === 'function') {
          drawCoinHoarderBoss(ctx, e.x, e.y, _eDraw, _frame);
        } else {
          drawDrum32(ctx, e.x, e.y, elite ? { v: ev, elite: true } : ev, e.hp || 3, e.hp || 3, _frame);
        }
        if (elite && ev !== 6 && ev !== 99 && ev !== 96) {
          ctx.fillStyle = 'rgba(255,215,0,0.4)';
          ctx.fillRect(e.x - 2, e.y - 2, 34, 46);
        }
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#aaa'; ctx.textAlign = 'center';
        const lbl = {
          7: 'SHD', 8: 'RHY', 9: 'SPL', 10: 'SIL', 11: 'TWN',
          12: 'TUR', 13: 'TLP', 14: 'BRZ', 15: 'CUT',
          6: 'BOSS', 99: 'MEGA', 98: 'SUMN', 97: 'JUGG', 96: 'HOARD',
        }[ev] || (elite ? 'ELIT' : '');
        if (lbl) ctx.fillText(lbl, e.x + 16, e.y - 4); ctx.textAlign = 'left';
      }

      // Coins
      for (const c of (ld.coins || [])) {
        ctx.fillStyle = '#c8a820'; ctx.beginPath(); ctx.arc(c.x + 8, c.y + 8, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f5d640'; ctx.beginPath(); ctx.arc(c.x + 8, c.y + 8, 6, 0, Math.PI * 2); ctx.fill();
      }

      // Coin Blocks
      for (const cb of (ld.cblocks || [])) {
        const empty = (cb.hits || 0) <= 0;
        ctx.fillStyle = empty ? '#888' : '#c87820'; ctx.fillRect(cb.x, cb.y, 28, 28);
        ctx.fillStyle = empty ? '#aaa' : '#f5a840'; ctx.fillRect(cb.x + 2, cb.y + 2, 24, 24);
        ctx.fillStyle = empty ? '#666' : '#7a3800';
        ctx.font = 'bold 13px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText(empty ? '○' : '🪙', cb.x + 14, cb.y + 20); ctx.textAlign = 'left';
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#ff8800'; ctx.textAlign = 'center';
        ctx.fillText('×' + (cb.hits || 0), cb.x + 14, cb.y - 3); ctx.textAlign = 'left';
      }
      // QBlocks
      for (const q of (ld.qblocks || [])) {
        ctx.fillStyle = '#c8a820'; ctx.fillRect(q.x, q.y, 28, 28);
        ctx.fillStyle = '#f5d640'; ctx.fillRect(q.x + 2, q.y + 2, 24, 24);
        ctx.fillStyle = '#8b5800'; ctx.font = 'bold 16px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('?', q.x + 14, q.y + 20); ctx.textAlign = 'left';
      }

      // ── Drag preview ─────────────────────────────────────
      if (this.previewRect) {
        const pr = this.previewRect;
        const prevCol = this.tool === 'ice' ? '#8ad4f0' : this.tool === 'bounce' ? '#00ffcc' : '#6eb4ff';
        ctx.globalAlpha = .4; ctx.fillStyle = prevCol; ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
        ctx.globalAlpha = .9; ctx.strokeStyle = prevCol; ctx.lineWidth = 2; ctx.strokeRect(pr.x, pr.y, pr.w, pr.h);
        ctx.globalAlpha = 1; ctx.lineWidth = 1;
      }

      // ── Multi-selection highlight (blue outlines) ──────────────
      for (const sel of (this._selection || [])) {
        if (!sel.x && sel.x !== 0) continue;
        ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.strokeRect((sel.x || 0) - 2, (sel.y || 0) - 2, (sel.w || 80) + 4, (sel.h || 18) + 4);
        ctx.setLineDash([]); ctx.lineWidth = 1;
      }
      // ── Box-select rubber band ────────────────────────────────
      if (this._boxSelect) {
        const bs = this._boxSelect;
        ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.fillStyle = 'rgba(68,136,255,0.08)';
        ctx.fillRect(bs.x, bs.y, bs.w, bs.h);
        ctx.strokeRect(bs.x, bs.y, bs.w, bs.h);
        ctx.setLineDash([]); ctx.lineWidth = 1;
      }
      // ── Stamp ghost preview (multigrab) ───────────────────────
      this.drawStampGhost(ctx);
      // ── Color-target highlight (yellow = selected for coloring) ──
      const ct = this._colorTarget;
      if (ct && ct.obj) {
        const co = ct.obj, cx2 = co.x || 0, cy2 = co.y || 0, cw2 = co.w || 80, ch2 = co.h || 18;
        const cRot = (co.rotation || 0) * Math.PI / 180;
        ctx.save();
        if (cRot) { ctx.translate(cx2 + cw2 / 2, cy2 + ch2 / 2); ctx.rotate(cRot); ctx.translate(-cx2 - cw2 / 2, -cy2 - ch2 / 2); }
        ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]);
        ctx.strokeRect(cx2 - 3, cy2 - 3, cw2 + 6, ch2 + 6); ctx.setLineDash([]); ctx.lineWidth = 1;
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'center';
        ctx.fillText('SELECTED', cx2 + cw2 / 2, cy2 - 8); ctx.textAlign = 'left';
        ctx.restore();
      }

      // ── Hover / resize corner highlight (rotated with object) ──
      const ho = this._hoverObj;
      if (ho && ho.obj && ho.type !== 'voidLine' && ho.type !== 'startMarker') {
        const o = ho.obj;
        // Prefer the picker's _bbox (the actual hit-box) so point
        // objects (coins, embers, …) show a tight outline that
        // matches what will be selected on click. Fall back to the
        // raw object dimensions for backward compat.
        const _bb = ho._bbox;
        const hx = _bb ? _bb.x : (o.x || 0);
        const hy = _bb ? _bb.y : (o.y || 0);
        const hw = _bb ? _bb.w : (o.w || 32);
        const hh = _bb ? _bb.h : (o.h || 32);
        const hRot = (o.rotation || 0) * Math.PI / 180;
        const hcx = hx + hw / 2, hcy = hy + hh / 2;
        ctx.save();
        if (hRot) { ctx.translate(hcx, hcy); ctx.rotate(hRot); ctx.translate(-hcx, -hcy); }
        // Brighter cyan outline so it really stands out from any
        // background art. Pulse + dash to make it unmistakable.
        ctx.globalAlpha = 0.55 + Math.sin(frameCount * 0.18) * 0.15;
        ctx.strokeStyle = '#7fe8ff'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 3]);
        ctx.strokeRect(hx - 2, hy - 2, hw + 4, hh + 4);
        // Soft inner glow halo on the highlight so the outlined
        // shape pops even against busy art.
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 6;
        ctx.strokeRect(hx - 2, hy - 2, hw + 4, hh + 4);
        ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.lineWidth = 1;
        // Corner handles
        if (['platform', 'icePlat', 'bounce'].includes(ho.type)) {
          const corners = [[hx, hy], [hx + hw, hy], [hx, hy + hh], [hx + hw, hy + hh]];
          for (const [cx2, cy2] of corners) {
            ctx.fillStyle = '#6eb4ff'; ctx.fillRect(cx2 - 4, cy2 - 4, 8, 8);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(cx2 - 4, cy2 - 4, 8, 8);
          }
        }
        // Rotation handle dots at corners
        [[hx, hy], [hx + hw, hy], [hx + hw, hy + hh], [hx, hy + hh]].forEach(([cx2, cy2]) => {
          ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(cx2, cy2, 5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 1; ctx.stroke();
        });
        ctx.restore(); // un-rotate for text labels
        ctx.font = '5px "Press Start 2P"'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        // When this platform has been armed for the click-to-open
        // PlatformEditor flow (first click already happened), show
        // "EDIT" instead of "MOVE" so the user knows the next click
        // opens the modal rather than starting a drag.
        const _armed = (this._infoEditTarget === ho.obj);
        const modeLabel = this._resizeCorner != null ? 'RESIZE'
                        : this._rotatingObj === ho.obj ? 'ROTATE'
                        : _armed ? 'EDIT' : 'MOVE';
        if (_armed) ctx.fillStyle = '#ffd76a';
        ctx.fillText(modeLabel, hcx, hcy - hh / 2 - 12);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
        if (o.rotation) {
          ctx.fillStyle = '#ffaa00'; ctx.textAlign = 'center';
          ctx.fillText(o.rotation + '°', hcx, hcy - hh / 2 - 22); ctx.textAlign = 'left';
        }
      }

      ctx.restore();  // ← restore from translate

      // ── Screen-space overlay ──────────────────────────────
      // Sidebar gutter cover — fills the canvas area beneath the DOM sidebar/actions panels
      ctx.fillStyle = '#050414'; ctx.fillRect(0, 0, SB, H);
      ctx.strokeStyle = '#3a3a6a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(SB, 0); ctx.lineTo(SB, H); ctx.stroke(); ctx.lineWidth = 1;
      // Scroll indicator
      const lvW = ld.width, vW = W - SB, scrollVisW = vW / z;
      const tW = Math.max(30, vW * Math.min(1, scrollVisW / Math.max(lvW, 1)));
      const tX = SB + Math.max(0, Math.min(vW - tW, (sx / Math.max(lvW - scrollVisW, 1)) * (vW - tW)));
      ctx.fillStyle = '#111'; ctx.fillRect(SB, H - 4, vW, 4);
      ctx.fillStyle = '#3a3a6a'; ctx.fillRect(tX, H - 4, tW, 4);
      // End marker (canvas space: account for zoom)
      const endX = SB + (ld.width - sx) * z;
      if (endX > SB && endX < W) {
        ctx.globalAlpha = .4; ctx.fillStyle = '#e74c3c'; ctx.fillRect(endX, 0, 2, H); ctx.globalAlpha = 1;
        ctx.font = '7px "Press Start 2P"'; ctx.fillStyle = '#e74c3c'; ctx.fillText('END', endX + 4, 18);
      }
      // Tool info
      ctx.font = '6px "Press Start 2P"'; ctx.fillStyle = '#5a5a7a'; ctx.textAlign = 'right';
      ctx.fillText('TOOL:' + this.tool.toUpperCase() + '  X:' + Math.round(sx) + '  ZOOM:' + Math.round(z * 100) + '%', W - 4, H - 8);
      ctx.textAlign = 'left';
      drawBuilderCursor();
    },
  };
  // ── Exports ────────────────────────────────────────────────────
  window.BLD = BLD;
  window.GameBuilder = BLD;
})();
