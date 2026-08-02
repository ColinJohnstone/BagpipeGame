// src/builder3d.js
// ──────────────────────────────────────────────────────────────────
// 3D LEVEL BUILDER — a live, in-scene editor for the Prism (3D) mode.
// The heavy THREE math (raycast cursor, orbit camera, marker meshes)
// lives in the engine as ThreeMode.editor (src/three/dimension.js);
// this module owns the UI (floating toolbar + HUD), localStorage CRUD
// for the separate "MY 3D LEVELS" collection, the level-list screen,
// and the playtest hand-off. Exposes window.Builder3D.
//
// Coordinate note (matches the 3D engine): x = forward along the course,
// y = screen-down height (smaller y = higher up), z = lateral.
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  const STORE = 'pogl_my3d_v1';
  const BIOMES = ['grass', 'ice', 'lava', 'sky'];
  const BIOME_SKY = {
    grass: ['#2a4a7a', '#4f83bd'], ice: ['#3a5a86', '#7fb4dc'],
    lava: ['#6a2418', '#d06a34'], sky: ['#243f6e', '#4b7fb8'],
  };
  const TOOLS = [
    ['platform', '🟫', 'Platform'], ['bounce', '🟠', 'Bounce pad'], ['lava', '🔥', 'Lava block'],
    ['spike', '🔺', 'Spikes'], ['coin', '🪙', 'Coin'], ['enemy', '🥁', 'Enemy'],
    ['start', '🚩', 'Start'], ['goal', '🏰', 'Goal'], ['select', '✋', 'Select / Move'], ['erase', '🧽', 'Erase'],
  ];

  let loopId = 0, running = false, editingId = null, dom = null, playReturn = false, current = null;

  // ── level factory ────────────────────────────────────────────────
  function blankLevel(name) {
    return {
      name: name || 'MY 3D LEVEL',
      biome: 'grass',
      width: 1600,
      mode3d: true,
      bgColors: BIOME_SKY.grass.slice(),
      skyStars: false,
      platColors: ['#274d1c', '#356a26', '#4a8f33', '#5cb040', '#74d155'],
      voidFloor: true, voidY: 760,
      startX: 60, startY: 360,
      platforms: [
        { x: 0, y: 470, w: 420, h: 170, zc: 0, zd: 160 },
        { x: 620, y: 450, w: 260, h: 30, zc: 0, zd: 140 },
        { x: 1040, y: 430, w: 320, h: 40, zc: 0, zd: 170 },
      ],
      coins: [], enemies: [], spikes: [],
      goalX: 1180, goalY: 260,
      timePar: 200, timeGold: 140,
    };
  }

  // ── storage ──────────────────────────────────────────────────────
  function loadAll() { try { const r = localStorage.getItem(STORE); const a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveAll(list) { try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) {} }
  function uid() { return 'l' + Math.abs((Date.now() ^ (Math.floor(performance.now() * 1000))) | 0).toString(36); }

  // ── screen: MY 3D LEVELS list ────────────────────────────────────
  function open() { renderList(); if (window.UI && UI.showScreen) UI.showScreen('s-my3d'); }
  function close() { if (window.UI && UI.showScreen) UI.showScreen('s-title'); }

  function renderList() {
    const wrap = document.getElementById('my3d-list'); if (!wrap) return;
    const list = loadAll();
    wrap.innerHTML = '';
    if (!list.length) {
      wrap.innerHTML = '<div style="padding:22px 14px;color:#8fa;opacity:.7;font-size:8px;text-align:center;">No levels yet. Press <b style="color:#8ef0ff;">+ NEW LEVEL</b> to build one in 3D.</div>';
      return;
    }
    list.forEach((entry) => {
      const c = entry.level || {};
      const nP = (c.platforms || []).length, nC = (c.coins || []).length, nE = (c.enemies || []).length;
      const card = document.createElement('div');
      card.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.07);';
      card.innerHTML =
        '<div style="font-size:10px;color:#ffe27a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(c.name || 'UNTITLED') + '</div>'
        + '<div style="font-size:7px;color:#8fb;opacity:.7;white-space:nowrap;">' + (c.biome || 'grass').toUpperCase() + ' · ' + nP + ' plat · ' + nC + ' coin · ' + nE + ' foe</div>';
      const btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
      const mk = (label, bg, fn) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = label; b.style.cssText = 'font-size:8px;padding:8px 12px;min-width:0;flex:0 0 auto;' + (bg ? 'background:' + bg + ';' : ''); b.onclick = fn; return b; };
      btns.appendChild(mk('▶ PLAY', 'rgba(60,180,90,.25)', () => playtest(entry.level)));
      btns.appendChild(mk('✎ EDIT', '', () => edit(entry.id)));
      btns.appendChild(mk('🗑 DELETE', 'rgba(180,60,60,.25)', () => { if (confirm('Delete "' + (c.name || 'level') + '"?')) { const l = loadAll().filter(x => x.id !== entry.id); saveAll(l); renderList(); } }));
      card.appendChild(btns);
      wrap.appendChild(card);
    });
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

  function newLevel() { editingId = null; startEditing(blankLevel()); }
  function edit(id) { const e = loadAll().find(x => x.id === id); if (!e) return; editingId = id; startEditing(JSON.parse(JSON.stringify(e.level))); }

  // ── editor session ───────────────────────────────────────────────
  function startEditing(level) {
    if (!window.ThreeMode || ThreeMode.isFailed()) { alert('3D mode is unavailable on this device.'); return; }
    current = level;
    // Hide any active menu screen so the 3D canvas is unobscured.
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const hud = document.getElementById('hud'); if (hud) hud.style.display = 'none';
    ensureToolbar();
    const ok = ThreeMode.editor.open(level, { onChange: syncHud });
    if (!ok) { alert('Could not start the 3D editor.'); return; }
    dom.root.style.display = '';
    setTool('platform');
    syncFields();
    running = true; loop();
  }

  function loop() {
    if (!running) return;
    const wrap = document.getElementById('wrap');
    const r = wrap ? wrap.getBoundingClientRect() : { width: 960, height: 540 };
    ThreeMode.editor.frame(Math.round(r.width), Math.round(r.height));
    syncHud();
    loopId = requestAnimationFrame(loop);
  }

  function stopLoop() { running = false; if (loopId) cancelAnimationFrame(loopId); loopId = 0; }

  function exitEditor() {
    stopLoop();
    if (window.ThreeMode) ThreeMode.editor.close();
    if (dom) dom.root.style.display = 'none';
    open();   // back to the list
  }

  // ── toolbar / HUD ────────────────────────────────────────────────
  function ensureToolbar() {
    if (dom) return;
    const root = document.createElement('div');
    root.id = 'b3d-ui';
    root.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;font-family:"Press Start 2P",monospace;';

    // Left tool palette.
    const pal = div('position:absolute;left:12px;top:64px;display:flex;flex-direction:column;gap:6px;pointer-events:auto;');
    TOOLS.forEach(([id, icon, label]) => {
      const b = document.createElement('button');
      b.dataset.tool = id; b.title = label; b.textContent = icon;
      b.style.cssText = 'width:46px;height:46px;font-size:18px;border:1px solid rgba(150,180,255,.35);border-radius:10px;background:rgba(12,16,34,.7);color:#fff;cursor:pointer;';
      b.onclick = () => setTool(id);
      pal.appendChild(b);
    });
    root.appendChild(pal);

    // Top bar: name + biome + actions.
    const top = div('position:absolute;left:70px;right:12px;top:12px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;pointer-events:auto;background:rgba(10,14,30,.7);border:1px solid rgba(150,180,255,.3);border-radius:10px;padding:8px 10px;');
    const name = document.createElement('input');
    name.id = 'b3d-name'; name.value = 'MY 3D LEVEL';
    name.style.cssText = 'font-family:inherit;font-size:9px;color:#ffe27a;background:rgba(0,0,0,.35);border:1px solid #2a2a4a;border-radius:6px;padding:7px 8px;width:180px;';
    name.oninput = () => { const L = ThreeMode.editor.getLevel(); if (L) L.name = name.value; };
    top.appendChild(label('NAME')); top.appendChild(name);

    const biome = document.createElement('select');
    biome.id = 'b3d-biome';
    biome.style.cssText = 'font-family:inherit;font-size:9px;color:#cfe;background:rgba(0,0,0,.35);border:1px solid #2a2a4a;border-radius:6px;padding:7px 6px;';
    BIOMES.forEach(b => { const o = document.createElement('option'); o.value = b; o.textContent = b.toUpperCase(); biome.appendChild(o); });
    biome.onchange = () => { const L = ThreeMode.editor.getLevel(); ThreeMode.editor.setBiome(biome.value); if (L) L.bgColors = (BIOME_SKY[biome.value] || BIOME_SKY.grass).slice(); };
    top.appendChild(label('BIOME')); top.appendChild(biome);

    top.appendChild(actionBtn('↺ UNDO', () => ThreeMode.editor.undo()));
    top.appendChild(actionBtn('🗑 DEL', () => ThreeMode.editor.deleteSelected()));
    top.appendChild(actionBtn('💾 SAVE', '#2e6a3a', doSave));
    top.appendChild(actionBtn('▶ PLAYTEST', '#3a5aa0', () => { const L = ThreeMode.editor.getLevel(); playtest(JSON.parse(JSON.stringify(L)), true); }));
    top.appendChild(actionBtn('✕ EXIT', '#7a3030', exitEditor));
    root.appendChild(top);

    // Platform-size + enemy-variant controls (right side).
    const opt = div('position:absolute;right:12px;top:64px;width:150px;display:flex;flex-direction:column;gap:7px;pointer-events:auto;background:rgba(10,14,30,.7);border:1px solid rgba(150,180,255,.3);border-radius:10px;padding:10px;');
    opt.id = 'b3d-opts';
    opt.appendChild(sizeSlider('W', 'w', 60, 900, 220));
    opt.appendChild(sizeSlider('H', 'h', 12, 220, 30));
    opt.appendChild(sizeSlider('DEPTH', 'd', 60, 420, 220));
    const ev = document.createElement('select');
    ev.id = 'b3d-enemyv';
    ev.style.cssText = 'font-family:inherit;font-size:8px;color:#cfe;background:rgba(0,0,0,.35);border:1px solid #2a2a4a;border-radius:6px;padding:6px;';
    [['0', 'Red drum'], ['1', 'Teal drum'], ['4', 'Fast red'], ['14', 'Runner'], ['5', 'Green'], ['3', 'Orange']].forEach(([v, n]) => { const o = document.createElement('option'); o.value = v; o.textContent = n; ev.appendChild(o); });
    ev.onchange = () => ThreeMode.editor.setEnemyVariant(+ev.value);
    const evl = label('ENEMY'); evl.style.marginTop = '2px'; opt.appendChild(evl); opt.appendChild(ev);
    root.appendChild(opt);

    // Bottom HUD (counts + controls hint).
    const hud = div('position:absolute;left:70px;bottom:12px;right:12px;display:flex;justify-content:space-between;gap:10px;pointer-events:none;');
    const stat = div('background:rgba(10,14,30,.7);border:1px solid rgba(150,180,255,.3);border-radius:8px;padding:7px 10px;font-size:7px;color:#cfe;line-height:1.7;');
    stat.id = 'b3d-stat';
    const help = div('background:rgba(10,14,30,.7);border:1px solid rgba(150,180,255,.3);border-radius:8px;padding:7px 10px;font-size:7px;color:#9fb6e8;line-height:1.7;text-align:right;');
    help.innerHTML = 'LEFT-CLICK place / select · RIGHT-DRAG orbit · WHEEL zoom<br>WASD pan · R/F build height · DEL delete · CTRL+Z undo';
    hud.appendChild(stat); hud.appendChild(help);
    root.appendChild(hud);

    document.body.appendChild(root);
    dom = { root, name, biome, ev, stat };
  }

  function div(css) { const d = document.createElement('div'); d.style.cssText = css; return d; }
  function label(t) { const s = document.createElement('span'); s.textContent = t; s.style.cssText = 'font-size:7px;color:#8fb;opacity:.75;'; return s; }
  function actionBtn(text, bg, fn) {
    if (typeof bg === 'function') { fn = bg; bg = ''; }
    const b = document.createElement('button'); b.textContent = text;
    b.style.cssText = 'font-family:inherit;font-size:8px;color:#fff;border:1px solid rgba(150,180,255,.35);border-radius:7px;padding:8px 9px;cursor:pointer;background:' + (bg || 'rgba(12,16,34,.7)') + ';';
    b.onclick = fn; return b;
  }
  function sizeSlider(labelText, key, min, max, val) {
    const row = div('display:flex;flex-direction:column;gap:3px;');
    const lab = div('font-size:7px;color:#8fb;opacity:.8;display:flex;justify-content:space-between;');
    lab.innerHTML = '<span>' + labelText + '</span><span id="b3d-' + key + 'v">' + val + '</span>';
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.value = val; inp.step = 10;
    inp.style.cssText = 'width:100%;accent-color:#8ef0ff;cursor:pointer;';
    inp.oninput = () => {
      const v = +inp.value; document.getElementById('b3d-' + key + 'v').textContent = v;
      const s = ThreeMode.editor.getPlatSize();
      ThreeMode.editor.setPlatSize(key === 'w' ? v : s.w, key === 'h' ? v : s.h, key === 'd' ? v : s.d);
    };
    row.appendChild(lab); row.appendChild(inp);
    return row;
  }

  function setTool(id) {
    if (!ThreeMode.editor) return;
    ThreeMode.editor.setTool(id);
    if (dom) dom.root.querySelectorAll('[data-tool]').forEach(b => {
      const on = b.dataset.tool === id;
      b.style.background = on ? 'rgba(142,240,255,.28)' : 'rgba(12,16,34,.7)';
      b.style.borderColor = on ? '#8ef0ff' : 'rgba(150,180,255,.35)';
    });
    const opts = document.getElementById('b3d-opts');
    if (opts) opts.style.opacity = (id === 'platform' || id === 'bounce' || id === 'lava' || id === 'enemy') ? '1' : '0.45';
  }

  function syncFields() {
    const L = ThreeMode.editor.getLevel(); if (!L || !dom) return;
    dom.name.value = L.name || 'MY 3D LEVEL';
    dom.biome.value = L.biome || 'grass';
  }
  function syncHud() {
    if (!dom || !dom.stat || !ThreeMode.editor) return;
    const c = ThreeMode.editor.counts();
    const tool = ThreeMode.editor.getTool();
    const by = ThreeMode.editor.getBuildY();
    const sel = ThreeMode.editor.getSelection();
    dom.stat.innerHTML = 'TOOL <b style="color:#8ef0ff;">' + tool.toUpperCase() + '</b> · BUILD-Y ' + Math.round(by)
      + '<br>' + c.platforms + ' plat · ' + c.coins + ' coin · ' + c.enemies + ' foe · ' + c.spikes + ' spike · W' + c.width
      + (sel ? '<br><span style="color:#ffe27a;">selected: ' + sel.kind + '</span>' : '');
  }

  function doSave() {
    const L = ThreeMode.editor.getLevel(); if (!L) return;
    L.name = (dom.name.value || 'MY 3D LEVEL').trim() || 'MY 3D LEVEL';
    const list = loadAll();
    const snapshot = JSON.parse(JSON.stringify(L));
    if (editingId) {
      const e = list.find(x => x.id === editingId);
      if (e) { e.level = snapshot; e.updated = Date.now(); }
      else { editingId = uid(); list.push({ id: editingId, level: snapshot, updated: Date.now() }); }
    } else {
      editingId = uid(); list.push({ id: editingId, level: snapshot, updated: Date.now() });
    }
    saveAll(list);
    flashSaved();
  }
  function flashSaved() {
    let t = document.getElementById('b3d-saved');
    if (!t) { t = document.createElement('div'); t.id = 'b3d-saved'; t.style.cssText = 'position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:10001;background:rgba(20,60,30,.92);border:1px solid #4ad06a;border-radius:10px;color:#bfffce;font-family:"Press Start 2P",monospace;font-size:10px;padding:12px 18px;transition:opacity .5s;pointer-events:none;'; document.body.appendChild(t); }
    t.textContent = '✓ SAVED'; t.style.opacity = '1';
    clearTimeout(flashSaved._t); flashSaved._t = setTimeout(() => { t.style.opacity = '0'; }, 1100);
  }

  // ── playtest (reuses the builder's WORLDS[98] scratch-world pattern) ──
  function playtest(level, fromEditor) {
    const ld = JSON.parse(JSON.stringify(level));
    ld.mode3d = true;
    ld.qblocks = (ld.qblocks || []);
    if (!Array.isArray(window.WORLDS)) return;
    WORLDS[98] = WORLDS[98] || { name: 'TEST3D', color: '#b06bff', borderColor: '#b06bff', emoji: '💠', desc: '', levels: [] };
    WORLDS[98].levels[0] = ld;
    // Hide editor UI + list; fully close the editor so its input handlers and
    // canvas state don't fight the play session. Then run the normal pipeline.
    stopLoop();
    if (window.ThreeMode && ThreeMode.editor.isOpen()) ThreeMode.editor.close();
    if (dom) dom.root.style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    playReturn = !!fromEditor;
    const hudEl = document.getElementById('hud'); if (hudEl) hudEl.style.display = 'flex';
    try {
      window.score = 0; window.coins = 0; window.levelTime = 0;
      window.currentWorld = 99; window.currentLevel = 1; window.GS = 'playing';
      window.initLevel(1);
      if (typeof window.startMusic === 'function') startMusic();
      if (typeof window.resumeAC === 'function') resumeAC();
    } catch (e) { console.error('[Builder3D] playtest failed', e); }
    showPlayExit();
  }

  // Floating button to leave a playtest and return to the editor / list.
  function showPlayExit() {
    let b = document.getElementById('b3d-playexit');
    if (!b) {
      b = document.createElement('button'); b.id = 'b3d-playexit';
      b.style.cssText = 'position:fixed;right:14px;top:14px;z-index:10002;font-family:"Press Start 2P",monospace;font-size:9px;color:#fff;background:rgba(40,28,86,.9);border:1px solid #b06bff;border-radius:10px;padding:10px 12px;cursor:pointer;';
      b.onclick = leavePlaytest;
      document.body.appendChild(b);
    }
    b.textContent = playReturn ? '✎ BACK TO EDITOR' : '✕ EXIT';
    b.style.display = 'block';
  }
  function leavePlaytest() {
    const b = document.getElementById('b3d-playexit'); if (b) b.style.display = 'none';
    if (window.ThreeMode) ThreeMode.reset();
    window.GS = 'title';
    const hud = document.getElementById('hud'); if (hud) hud.style.display = 'none';
    if (playReturn && current && window.ThreeMode) {
      // Re-enter the editor on the same level (reset() closed the 3D scene).
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      ensureToolbar();
      ThreeMode.editor.open(current, { onChange: syncHud });
      dom.root.style.display = '';
      syncFields();
      running = true; loop();
    } else open();
  }

  window.Builder3D = { open, close, newLevel, edit, exitEditor, _leavePlaytest: leavePlaytest };
})();
