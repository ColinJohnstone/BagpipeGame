// src/three/dimension.js
// ─────────────────────────────────────────────────────────────────────────
// THE HIGHLAND PRISM — 2D platformer → TRUE 3D platformer.
//
// This is the one genuine ES module in the project (everything else is a
// classic <script src> talking through window globals). Vite bundles it and
// tree-shakes Three.js into it.
//
// Grabbing the Highland Prism folds the level into a Mario-64 / Odyssey-style
// third-person 3D platformer:
//   • the piper becomes a real 3D (voxel) character that turns to face the way
//     it's moving,
//   • a chase camera trails BEHIND the character; movement is camera-relative
//     so "up = forward". Drag the mouse to look around (auto-follow resumes
//     shortly after); wheel zooms.
//   • gravity + jump on Y, AABB collision against platform tops & sides,
//   • enemies chase in 3D and can be stomped.
//
// The 2D simulation's updatePlayer()/updateEnemies() are BYPASSED while 3D is
// active — index.html routes the tick to ThreeMode.tick3D(), which runs this
// controller and writes the resulting position back to window.player.x/y so the
// existing coin / goal / HUD code keeps working. Degrades to plain 2D if
// WebGL/Three fails to init.
// ─────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';

// World→scene mapping: 1 world unit == 1 three unit. Screen-down Y becomes
// world-up (+Y). The 2D gameplay line is z=0; blocks extrude across ±z into
// walkable pads.
// Platforms extrude across ±z into walkable pads. Deep enough to give real
// lateral (dodge) room, since the level's forward progression runs along +x.
const DEPTH = 320;
const HALF_D = DEPTH / 2;
const FACE_X = Math.PI / 2;   // yaw that faces +x (down the level's length)

// Player collision box (half-extents, feet-origin) + feel constants.
const P_HX = 12, P_HZ = 12, P_HEIGHT = 46;
const GRAV = 0.62, JUMP_V = 13.0, MOVE = 4.6, MAX_FALL = 22, ACCEL = 0.4, AIR_CTL = 0.6;

// Camera: a trailing chase cam behind the character.
const CAM = { el: 0.46, dist: 360, minEl: 0.05, maxEl: 1.25, minDist: 150, maxDist: 760, fov: 60 };

let renderer = null, scene = null, camera = null;
let three = null;
let inited = false, failed = false;

// mode: '2d' | 'entering' | '3d' | 'exiting'
let mode = '2d';
let warp = 0, warpTarget = 0;

// Camera state. camYaw = orbit yaw (trails the character's facing); manual
// mouse-drag temporarily overrides auto-follow (camDragCd frames).
const cam = { yaw: 0, el: CAM.el, dist: CAM.dist, tx: 0, ty: 0, tz: 0 };
let camDragCd = 0;

// 3D player state (up = +Y). x/z centre, y = feet. yaw = facing; stepPhase
// drives the walk cycle.
const p3 = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, grounded: false, yaw: 0, stepPhase: 0, lgx: 0, lgy: 0, lgz: 0 };

let boxes = [];
let levelSig = '';
let PWc = 32, PHc = 50;
let drag = null;

// ── small math helpers ──────────────────────────────────────────────────────
function angleLerp(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function toColor(str, fallback) {
  try { if (typeof str === 'string' && str[0] === '#') return new THREE.Color(str); } catch (e) {}
  return new THREE.Color(fallback);
}

// Lift a colour toward a target (used to brighten dim night skies).
function makeSkyTexture(topC, botC) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const cx = c.getContext('2d');
  const g = cx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#' + topC.getHexString());
  g.addColorStop(1, '#' + botC.getHexString());
  cx.fillStyle = g; cx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── pixel-art → CanvasTexture (enemies stay billboards) ─────────────────────
function makeSpriteCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { c, cx, tex };
}

// ── 3D voxel piper model ────────────────────────────────────────────────────
function mat(color, rough) { return new THREE.MeshStandardMaterial({ color, roughness: rough == null ? 0.72 : rough, metalness: 0.04 }); }
function box(w, h, d, color, rough) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, rough)); }
// A limb whose pivot is at its TOP (for hip/shoulder swing).
function limb(w, h, d, color) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, -h / 2, 0);
  return new THREE.Mesh(g, mat(color));
}

function buildPiperModel() {
  const pc = (typeof window !== 'undefined' && window.PLAYER_CUSTOM) || {};
  const skin = pc.skin || '#e8c8a0';
  const jacket = pc.jacket || '#1a3a1a';
  const jacketAcc = pc.jacketAccent || '#0f2a14';
  const sock = pc.stockings || '#e8e8d8';
  const beardCol = pc.beardColor || '#8b3a14';
  const kilt = '#7d2b2b';       // tartan red
  const hatCol = '#26407a';     // tam o' shanter blue
  const g = new THREE.Group();

  const legL = limb(7, 18, 8, sock), legR = limb(7, 18, 8, sock);
  legL.position.set(-5, 18, 0); legR.position.set(5, 18, 0);
  const shoeL = box(8, 4, 11, '#241a12'), shoeR = box(8, 4, 11, '#241a12');
  shoeL.position.set(-5, 2, 1.5); shoeR.position.set(5, 2, 1.5);

  const kiltMesh = box(24, 13, 14, kilt); kiltMesh.position.set(0, 21, 0);
  const sporran = box(8, 7, 3, pc.sporran || '#5a3a18'); sporran.position.set(0, 19, 7.5);
  const torso = box(20, 16, 11, jacket); torso.position.set(0, 34, 0);
  const belt = box(21, 3, 12, jacketAcc); belt.position.set(0, 27, 0);

  const armL = limb(6, 16, 6, jacket), armR = limb(6, 16, 6, jacket);
  armL.position.set(-12, 41, 0); armR.position.set(12, 41, 0);

  const head = box(15, 14, 12, skin); head.position.set(0, 50, 0);
  const beardMesh = (pc.beard && pc.beard !== 'clean') ? box(13, 6, 3, beardCol) : null;
  if (beardMesh) beardMesh.position.set(0, 46, 6.2);
  const hatBrim = box(20, 3, 18, hatCol); hatBrim.position.set(0, 57, 0);
  const hatTop = box(15, 6, 15, hatCol); hatTop.position.set(0, 60.5, 0);
  const pom = box(4, 4, 4, '#c0202c'); pom.position.set(0, 64.5, 0);

  // Bagpipe: a bag on the chest + drone pipes over the shoulder.
  const bag = box(11, 12, 8, '#35502a'); bag.position.set(11, 33, 4); bag.rotation.z = -0.25;
  const pipe1 = limb(2.4, 20, 2.4, '#e8dfc4'); pipe1.position.set(-8, 46, 3); pipe1.rotation.z = 0.35; pipe1.rotation.x = -0.15;
  const pipe2 = limb(2.4, 22, 2.4, '#e8dfc4'); pipe2.position.set(-11, 46, 4); pipe2.rotation.z = 0.45; pipe2.rotation.x = -0.1;
  const pipe3 = limb(2.4, 17, 2.4, '#d8cfb0'); pipe3.position.set(-6, 46, 2); pipe3.rotation.z = 0.28;

  [legL, legR, shoeL, shoeR, kiltMesh, sporran, torso, belt, armL, armR, head, hatBrim, hatTop, pom, bag, pipe1, pipe2, pipe3]
    .concat(beardMesh ? [beardMesh] : [])
    .forEach(m => g.add(m));

  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { group: g, legL, legR, armL, armR, torso };
}

// Briefly show the 3D control scheme on entry (it differs from 2D), then fade.
function showThreeHint() {
  try {
    const wrap = document.getElementById('wrap');
    if (!wrap) return;
    let el = document.getElementById('three-hint');
    if (!el) {
      el = document.createElement('div');
      el.id = 'three-hint';
      el.style.cssText = 'position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:60;'
        + "font-family:'Press Start 2P',monospace;font-size:8px;line-height:1.7;color:#eaf2ff;text-align:center;"
        + 'background:rgba(10,14,30,0.66);border:1px solid rgba(150,180,255,0.4);border-radius:10px;'
        + 'padding:9px 14px;pointer-events:none;transition:opacity .6s ease;backdrop-filter:blur(4px);';
      el.innerHTML = '💠 3D MODE'
        + '<br>WASD MOVE · SPACE JUMP · ESC PAUSE'
        + '<br>Q SHOOT · E CHARGE · F SKIRL · R DRONE'
        + '<br>ARROWS / MOUSE (CLICK TO LOOK) — CAMERA';
      wrap.appendChild(el);
    }
    el.style.display = '';
    el.style.opacity = '1';
    clearTimeout(showThreeHint._t);
    showThreeHint._t = setTimeout(() => { el.style.opacity = '0'; }, 4200);
  } catch (e) {}
}

function ensureInit(W, H) {
  if (inited || failed) return !failed;
  try {
    const wrap = document.getElementById('wrap');
    if (!wrap) return false;

    const cv = document.createElement('canvas');
    cv.id = 'three-canvas';
    cv.style.cssText = 'position:absolute;left:0;top:0;z-index:2;display:none;';
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cv.style.pointerEvents = 'none';
    wrap.appendChild(cv);

    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(CAM.fov, W / H, 1, 9000);

    const amb = new THREE.HemisphereLight(0xdfeeff, 0x506070, 1.7);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xfff4e0, 2.1); key.position.set(-260, 620, 420); scene.add(key);
    const rim = new THREE.DirectionalLight(0xa8c8ff, 0.7); rim.position.set(420, 200, -340); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(120, 120, 520); scene.add(fill);

    three = { platGroup: new THREE.Group(), coins: [], enemies: [], notes: [], player: null, shadow: null, skirlRing: null };
    scene.add(three.platGroup);

    // 3D piper.
    const model = buildPiperModel();
    scene.add(model.group);
    three.player = model;

    // Round drop-shadow.
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(18, 22),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.renderOrder = 5;
    scene.add(shadow); three.shadow = shadow;

    // Skirl-blast shockwave ring (lies flat, expands + fades on use).
    const ring = new THREE.Mesh(new THREE.RingGeometry(12, 18, 30),
      new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.renderOrder = 6; ring.visible = false;
    scene.add(ring); three.skirlRing = ring;

    attachCameraControls(cv);
    inited = true;
    return true;
  } catch (e) {
    console.error('[ThreeMode] init failed, staying 2D:', e);
    failed = true;
    return false;
  }
}

// ── camera controls (mouse-drag orbit temporarily overrides auto-follow) ────
function attachCameraControls(cv) {
  // Attach to WINDOW (not just the WebGL canvas) so the drag registers no
  // matter which element ends up topmost — the earlier canvas-only listener
  // could be starved of events. Skip drags that start on UI (HUD, buttons).
  const onUI = (t) => t && t.closest && t.closest('button, input, #hud, #touch-ctrl, .screen');
  const locked = () => document.pointerLockElement === cv;
  // Click once to capture the mouse → free look (no button held). Esc / pause
  // releases it. Drag still works as a fallback if lock is unavailable/denied.
  const down = (e) => {
    if (mode === '2d' || onUI(e.target)) return;
    if (!locked()) { try { cv.requestPointerLock(); } catch (err) {} }
    drag = { x: e.clientX, y: e.clientY };
  };
  const move = (e) => {
    if (mode === '2d') return;
    if (locked()) {
      cam.yaw -= (e.movementX || 0) * 0.0035;
      cam.el = Math.max(CAM.minEl, Math.min(CAM.maxEl, cam.el - (e.movementY || 0) * 0.003));
      camDragCd = 110;
    } else if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      cam.yaw -= dx * 0.007;
      cam.el = Math.max(CAM.minEl, Math.min(CAM.maxEl, cam.el - dy * 0.005));
      camDragCd = 110;
    }
  };
  const up = () => { drag = null; };
  window.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('wheel', (e) => {
    if (mode === '2d') return;
    cam.dist = Math.max(CAM.minDist, Math.min(CAM.maxDist, cam.dist + e.deltaY * 0.3));
  }, { passive: true });
}

// ── static level geometry + collision boxes ─────────────────────────────────
function buildLevel(ld) {
  for (let i = three.platGroup.children.length - 1; i >= 0; i--) {
    const m = three.platGroup.children[i];
    three.platGroup.remove(m);
    if (m.geometry) m.geometry.dispose();
    if (m.material) { const mm = m.material; (Array.isArray(mm) ? mm : [mm]).forEach(x => x.dispose()); }
  }
  boxes = [];

  const pc = (ld.platColors && ld.platColors.length) ? ld.platColors : ['#2a3a1a', '#3a5228', '#4a7a38', '#5a9a48', '#6ab858'];
  const faceCol = toColor(pc[2] || pc[pc.length - 1], '#4a7a38');
  const topCol = toColor(pc[4] || pc[pc.length - 1], '#6ab858');

  for (const p of (ld.platforms || [])) {
    if (p.type && p.type !== 'ground') continue;
    // Optional per-platform depth: zc = z-centre, zd = z half-depth. Default is
    // the full walkable slab. Narrow/offset values make platforms that you can
    // walk AROUND in 3D, or depth-staggered islands that only line up in 2D.
    // (The flat 2D game ignores zc/zd entirely — everything is on the plane.)
    const zc = (typeof p.zc === 'number') ? p.zc : 0;
    const zd = (typeof p.zd === 'number') ? p.zd : HALF_D;
    const geo = new THREE.BoxGeometry(p.w, p.h, zd * 2);
    const side = new THREE.MeshStandardMaterial({ color: faceCol, roughness: 0.85, metalness: 0.04 });
    const top = new THREE.MeshStandardMaterial({ color: topCol, roughness: 0.7, metalness: 0.04 });
    const mesh = new THREE.Mesh(geo, [side, side, top, side, side, side]);
    mesh.position.set(p.x + p.w / 2, -(p.y + p.h / 2), zc);
    three.platGroup.add(mesh);
    boxes.push({ x0: p.x, x1: p.x + p.w, y0: -(p.y + p.h), y1: -p.y, z0: zc - zd, z1: zc + zd });
  }

  const bg = (ld.bgColors && ld.bgColors.length) ? ld.bgColors : ['#0a1520', '#182535'];
  const skyTop = toColor(bg[0], '#0a1520').clone().lerp(new THREE.Color(0x8ec7ff), 0.82);
  const skyBot = toColor(bg[1] || bg[0], '#182535').clone().lerp(new THREE.Color(0xdff0ff), 0.72);
  if (scene.background && scene.background.dispose) scene.background.dispose();
  scene.background = makeSkyTexture(skyTop, skyBot);
  scene.fog = new THREE.Fog(skyBot.getHex(), 1200, 4400);
}

// ── enemy billboards + coins ────────────────────────────────────────────────
function drawEnemySprite(spr, e, frame) {
  const { c, cx, tex } = spr;
  cx.clearRect(0, 0, c.width, c.height);
  let drew = false;
  try { if (typeof window.drawDrum32 === 'function') { window.drawDrum32(cx, 8, 8, e.v | 0, e.hp, e.maxHp, frame | 0, e._expr || null); drew = true; } } catch (err) {}
  if (!drew) { cx.fillStyle = '#c0392b'; cx.fillRect(12, 12, 40, 40); }
  tex.needsUpdate = true;
}
function acquireEnemy() {
  const spr = makeSpriteCanvas(64, 64);
  const mat2 = new THREE.MeshBasicMaterial({ map: spr.tex, transparent: true, alphaTest: 0.35, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(52, 52), mat2);
  mesh.renderOrder = 9; scene.add(mesh);
  return { sprite: mesh, spr };
}
function acquireCoin() {
  const geo = new THREE.CylinderGeometry(9, 9, 3, 18);
  const m = new THREE.MeshStandardMaterial({ color: 0xf5c518, metalness: 0.7, roughness: 0.25, emissive: 0x5a4600, emissiveIntensity: 0.45 });
  const mesh = new THREE.Mesh(geo, m); mesh.rotation.x = Math.PI / 2; scene.add(mesh);
  return { mesh };
}
function acquireNote() {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  mesh.renderOrder = 8; scene.add(mesh);
  return { mesh };
}

// ── collision + kill helpers ────────────────────────────────────────────────
function boxHit(cx, feetY, cz, hx, hh, hz, b) {
  return cx + hx > b.x0 && cx - hx < b.x1 && feetY + hh > b.y0 && feetY < b.y1 && cz + hz > b.z0 && cz - hz < b.z1;
}
function killCredit(e) {
  if (e._statCounted) return;
  e._statCounted = true;
  try { if (window.GameStats) window.GameStats.recordEnemyKill(); } catch (err) {}
  try { if (typeof window.onEnemyKilled === 'function') window.onEnemyKilled(e); } catch (err) {}
}

// ── 3D enemy AI (chase + stomp) ─────────────────────────────────────────────
function tickEnemies3D() {
  const player = window.player;
  const foes = (window.enemies || []).filter(e => e && !e.dead && !e._dead);
  for (const e of foes) {
    const ew = e.w || 32, eh = e.h || 32;
    const hx = ew / 2, hz = Math.min(ew / 2, 18), h = eh;
    if (!e._p3) e._p3 = { x: e.x + ew / 2, y: -(e.y + eh), z: 0, vx: 0, vy: 0, vz: 0, grounded: false };
    const s = e._p3;

    const dx = p3.x - s.x, dz = p3.z - s.z;
    const dist = Math.hypot(dx, dz) || 1;
    const isBoss = e.v >= 90;
    let spd = 1.7;
    if (e.v === 4) spd = 2.9; else if (e.v === 14) spd = 2.4; else if (isBoss) spd = 2.2;
    if (warp > 0.6 && dist < 1200) {
      s.vx += ((dx / dist) * spd - s.vx) * 0.08;
      s.vz += ((dz / dist) * spd - s.vz) * 0.08;
    } else { s.vx *= 0.9; s.vz *= 0.9; }

    s.vy -= GRAV; if (s.vy < -MAX_FALL) s.vy = -MAX_FALL;

    s.x += s.vx;
    for (const b of boxes) { if (boxHit(s.x, s.y, s.z, hx, h, hz, b)) { if (s.vx > 0) s.x = b.x0 - hx; else if (s.vx < 0) s.x = b.x1 + hx; s.vx = 0; } }
    s.z += s.vz;
    for (const b of boxes) { if (boxHit(s.x, s.y, s.z, hx, h, hz, b)) { if (s.vz > 0) s.z = b.z0 - hz; else if (s.vz < 0) s.z = b.z1 + hz; s.vz = 0; } }
    s.grounded = false; s.y += s.vy;
    for (const b of boxes) { if (boxHit(s.x, s.y, s.z, hx, h, hz, b)) { if (s.vy <= 0) { s.y = b.y1; s.grounded = true; } else s.y = b.y0 - h; s.vy = 0; } }

    if (s.y < -3000) { e.dead = true; continue; }
    e.x = s.x - ew / 2; e.y = -s.y - eh;

    const near = Math.abs(p3.x - s.x) < (P_HX + hx) && Math.abs(p3.z - s.z) < (P_HZ + hz)
      && (p3.y < s.y + h) && (p3.y + P_HEIGHT > s.y);
    if (near) {
      const stomp = p3.vy < 0 && p3.y > s.y + h * 0.55;
      if (stomp && !isBoss) {
        e.hp = 0; e.dead = true; p3.vy = JUMP_V * 0.72; killCredit(e);
        try { if (window.sfx) window.sfx('enemy_die'); } catch (err) {}
      } else if (isBoss && stomp) {
        if (typeof e.hp === 'number') e.hp -= 1;
        p3.vy = JUMP_V * 0.6;
        try { if (window.sfx) window.sfx('hit'); } catch (err) {}
        if (e.hp <= 0) { e.dead = true; killCredit(e); }
      } else if (!(player.invincible > 0)) {
        player.hp -= 1; player.invincible = 66; player._lastHp = player.hp;
        const kb = Math.atan2(p3.z - s.z, p3.x - s.x);
        p3.vx = Math.cos(kb) * 6.5; p3.vz = Math.sin(kb) * 6.5; p3.vy = 6.5;
        try { if (window.sfx) window.sfx('player_hit'); } catch (err) {}
        try { if (window.addShake) window.addShake(7); } catch (err) {}
      }
    }
  }
}

// Coins in 3D are collected by generous 3D proximity (the tight 2D overlap the
// flat game uses is too fiddly for arcing 3D jumps). Marks the coin collected +
// pays out; index.html's updateHUD() then reflects the new totals.
function collect3DCoins() {
  const cols = window.collectibles || [];
  const pcx = p3.x, pcy = p3.y + P_HEIGHT / 2, pcz = p3.z;
  for (const c of cols) {
    if (c.collected || (c.type && c.type !== 'coin')) continue;
    const cx = c.x + 8, cy = -(c.y + 8);
    const dx = pcx - cx, dy = pcy - cy, dz = pcz - 0;
    if (dx * dx + dy * dy + dz * dz < 46 * 46) {
      c.collected = true;
      try { window.coins = (window.coins | 0) + 1; } catch (e) {}
      try { window.score = (window.score | 0) + 30; } catch (e) {}
      try { if (window.GameStats) window.GameStats.recordCoin(); } catch (e) {}
      try { if (window.sfx) window.sfx('coin'); } catch (e) {}
    }
  }
}

// ── 3D combat abilities ─────────────────────────────────────────────────────
// The 2D abilities live in updatePlayer (bypassed in 3D), so 3D gets its own
// lightweight versions: fire note projectiles forward, dash, and a skirl AOE.
let notes3d = [];                 // {x,y,z,vx,vy,vz,life,col}
let shootCd = 0, dashCd = 0, skirlCd = 0;
let skirlFx = 0;                  // expanding-ring visual timer

function noteColor() {
  try { if (typeof window.pickNoteColor === 'function') { const c = window.pickNoteColor(); if (c) return c; } } catch (e) {}
  const h = ((window.frameCount | 0) * 11) % 360;
  return 'hsl(' + h + ',90%,62%)';
}

function fireNote(angleOffset) {
  const yaw = p3.yaw + (angleOffset || 0);
  const fx = Math.sin(yaw), fz = Math.cos(yaw), spd = 12;
  notes3d.push({ x: p3.x + fx * 16, y: p3.y + 28, z: p3.z + fz * 16, vx: fx * spd, vy: 0, vz: fz * spd, life: 70, col: noteColor() });
}

function tickAbilities() {
  const K = window.K || {}, JP = window.JP || {};
  if (shootCd > 0) shootCd--; if (dashCd > 0) dashCd--; if (skirlCd > 0) skirlCd--;
  if (skirlFx > 0) skirlFx -= 0.06;
  const armed = warp > 0.5;

  // Q — shoot notes (hold to auto-fire). R — drone (3-note spread).
  if (armed && K['KeyR'] && shootCd <= 0) {
    shootCd = 14; fireNote(0); fireNote(0.32); fireNote(-0.32);
    try { if (window.sfx) window.sfx('shoot'); } catch (e) {}
  } else if (armed && K['KeyQ'] && shootCd <= 0) {
    shootCd = 9; fireNote(0);
    try { if (window.sfx) window.sfx('shoot'); } catch (e) {}
  }

  // E — Highland Charge (forward dash).
  if (armed && JP['KeyE'] && dashCd <= 0) {
    dashCd = 42;
    const fx = Math.sin(p3.yaw), fz = Math.cos(p3.yaw);
    p3.vx += fx * 11; p3.vz += fz * 11;
    try { if (window.sfx) window.sfx('charge'); } catch (e) {}
  }

  // F — Skirl Blast (radial shockwave).
  if (armed && JP['KeyF'] && skirlCd <= 0) {
    skirlCd = 38; skirlFx = 1;
    for (const e of (window.enemies || [])) {
      if (!e || e.dead || !e._p3) continue;
      if (Math.hypot(e._p3.x - p3.x, e._p3.z - p3.z) < 100) {
        e.hp = (typeof e.hp === 'number' ? e.hp : 1) - 2;
        if (e.hp <= 0) { e.dead = true; killCredit(e); }
      }
    }
    try { if (window.sfx) window.sfx('skirl'); } catch (e) {}
  }

  // Advance note projectiles + resolve enemy hits.
  for (let i = notes3d.length - 1; i >= 0; i--) {
    const n = notes3d[i];
    n.x += n.vx; n.y += n.vy; n.z += n.vz; n.life--;
    let done = n.life <= 0;
    if (!done) {
      for (const e of (window.enemies || [])) {
        if (!e || e.dead || !e._p3) continue;
        const s = e._p3, eh = e.h || 32;
        if (Math.abs(n.x - s.x) < 22 && Math.abs(n.z - s.z) < 22 && n.y > s.y - 8 && n.y < s.y + eh + 8) {
          e.hp = (typeof e.hp === 'number' ? e.hp : 1) - 1;
          if (e.hp <= 0) { e.dead = true; killCredit(e); try { if (window.sfx) window.sfx('enemy_die'); } catch (_) {} }
          else { try { if (window.sfx) window.sfx('hit'); } catch (_) {} }
          done = true; break;
        }
      }
    }
    if (done) notes3d.splice(i, 1);
  }
}

// ── player controller (camera-relative move + chase-cam follow) ─────────────
function tickController() {
  const player = window.player;
  if (player && player.invincible > 0) player.invincible--;
  if (camDragCd > 0) camDragCd--;

  const K = window.K || {}, JP = window.JP || {};
  // ── 3D has its OWN control scheme, deliberately separate from 2D ──
  //   MOVE:   W A S D          (2D uses the arrow keys for movement)
  //   JUMP:   Space            (2D uses Z / ArrowUp)
  //   CAMERA: arrow keys rotate/tilt, + Q/E spin, + mouse-drag, + wheel zoom
  const inF = (K['KeyW'] ? 1 : 0) - (K['KeyS'] ? 1 : 0);
  const inS = (K['KeyD'] ? 1 : 0) - (K['KeyA'] ? 1 : 0);
  // Keyboard camera control (arrow keys; always works, no mouse required).
  // Q/E/etc. are left free for the combat abilities.
  let camKey = false;
  if (K['ArrowLeft']) { cam.yaw += 0.05; camKey = true; }
  if (K['ArrowRight']) { cam.yaw -= 0.05; camKey = true; }
  if (K['ArrowUp']) { cam.el = Math.min(CAM.maxEl, cam.el + 0.03); camKey = true; }
  if (K['ArrowDown']) { cam.el = Math.max(CAM.minEl, cam.el - 0.03); camKey = true; }
  if (camKey) camDragCd = 45;   // suppress auto-follow while steering the camera

  // Camera-relative movement basis (from the camera's current yaw).
  // forward = direction from camera toward the target (into the screen);
  // right = cross(forward, up) so D is screen-right, A is screen-left.
  const cf = { x: Math.sin(cam.yaw), z: Math.cos(cam.yaw) };   // camera forward
  const cr = { x: -Math.cos(cam.yaw), z: Math.sin(cam.yaw) };  // camera right

  const locked = warp < 0.45;
  let wx = 0, wz = 0, moving = false;
  if (!locked && (inF || inS)) {
    wx = cf.x * inF + cr.x * inS;
    wz = cf.z * inF + cr.z * inS;
    const len = Math.hypot(wx, wz) || 1; wx /= len; wz /= len;
    moving = true;
    // Character model turns to face the way it's moving.
    const targetYaw = Math.atan2(wx, wz);
    p3.yaw = angleLerp(p3.yaw, targetYaw, 0.3);
    // Gentle auto-follow: the camera drifts to behind the character only when
    // advancing FORWARD and you're not actively steering it — a soft assist,
    // never fast enough to hijack the controls.
    if (camDragCd <= 0 && inF > 0) cam.yaw = angleLerp(cam.yaw, p3.yaw, 0.035);
  }

  const ctl = p3.grounded ? 1 : AIR_CTL;
  p3.vx += ((wx * MOVE) - p3.vx) * ACCEL * ctl;
  p3.vz += ((wz * MOVE) - p3.vz) * ACCEL * ctl;
  if (!moving && p3.grounded) { p3.vx *= 0.6; p3.vz *= 0.6; }

  // Walk cycle.
  const speed = Math.hypot(p3.vx, p3.vz);
  if (p3.grounded && speed > 0.4) p3.stepPhase += 0.35; else p3.stepPhase *= 0.8;

  // Jump — Space (3D's own jump key).
  if (!locked && p3.grounded && JP['Space']) {
    p3.vy = JUMP_V; p3.grounded = false;
    try { if (typeof window.sfx === 'function') window.sfx('jump'); } catch (e) {}
  }

  p3.vy -= GRAV; if (p3.vy < -MAX_FALL) p3.vy = -MAX_FALL;
  if (mode === 'exiting') { p3.z += (0 - p3.z) * 0.2; p3.vz = 0; }

  const hx = P_HX, hz = P_HZ, h = P_HEIGHT;
  // Horizontal (x/z) blocking uses a SHORT collision height (lower body only)
  // so the piper slips UNDER low overhead ledges instead of jamming its head —
  // essential for repurposed 2D levels whose platforms sit close together. The
  // vertical pass keeps full height so landing-on-top and head-bonk still work.
  const HWALK = 22;
  const Axz = () => [p3.x - hx, p3.x + hx, p3.y + 2, p3.y + 2 + HWALK, p3.z - hz, p3.z + hz];
  const Ay = () => [p3.x - hx, p3.x + hx, p3.y, p3.y + h, p3.z - hz, p3.z + hz];
  const hit = (a, b) => a[1] > b.x0 && a[0] < b.x1 && a[3] > b.y0 && a[2] < b.y1 && a[5] > b.z0 && a[4] < b.z1;

  p3.x += p3.vx;
  for (const b of boxes) { const a = Axz(); if (hit(a, b)) { if (p3.vx > 0) p3.x = b.x0 - hx; else if (p3.vx < 0) p3.x = b.x1 + hx; p3.vx = 0; } }
  p3.z += p3.vz;
  for (const b of boxes) { const a = Axz(); if (hit(a, b)) { if (p3.vz > 0) p3.z = b.z0 - hz; else if (p3.vz < 0) p3.z = b.z1 + hz; p3.vz = 0; } }
  p3.grounded = false; p3.y += p3.vy;
  for (const b of boxes) { const a = Ay(); if (hit(a, b)) { if (p3.vy <= 0) { p3.y = b.y1; p3.grounded = true; } else p3.y = b.y0 - h; p3.vy = 0; } }

  if (p3.grounded) { p3.lgx = p3.x; p3.lgy = p3.y; p3.lgz = p3.z; }
  if (p3.y < -2600) { p3.x = p3.lgx; p3.y = p3.lgy + 40; p3.z = p3.lgz; p3.vx = p3.vy = p3.vz = 0; }

  // Sync to 2D player so coin/goal/HUD keep working.
  if (player) { player.x = p3.x - PWc / 2; player.y = -p3.y - PHc; }
}

function updatePiperModel() {
  const m = three.player;
  const g = m.group;
  g.position.set(p3.x, p3.y, p3.z);
  g.rotation.y = p3.yaw;
  const airborne = !p3.grounded;
  if (airborne) {
    m.legL.rotation.x = -0.5; m.legR.rotation.x = 0.35;
    m.armL.rotation.x = -0.9; m.armR.rotation.x = -0.9;
  } else {
    const sw = Math.sin(p3.stepPhase) * Math.min(1, Math.hypot(p3.vx, p3.vz) / MOVE);
    m.legL.rotation.x = sw * 0.8; m.legR.rotation.x = -sw * 0.8;
    m.armL.rotation.x = -sw * 0.6; m.armR.rotation.x = sw * 0.6;
  }
}

// ── public API ──────────────────────────────────────────────────────────────
const ThreeMode = {
  isActive() { return mode !== '2d' && !failed; },
  isControlling() { return (mode === '3d' || mode === 'entering' || mode === 'exiting') && !failed; },
  // Mid-fold: index.html renders the live 2D scene underneath the crossfade.
  isTransitioning() { return (mode === 'entering' || mode === 'exiting') && warp > 0.015 && warp < 0.985; },
  isFailed() { return failed; },
  is3D() { return mode === '3d'; },

  enter() {
    if (failed || mode === '3d' || mode === 'entering') return;
    mode = 'entering'; warpTarget = 1;
    showThreeHint();
    const player = window.player || { x: 40, y: 300 };
    p3.x = player.x + PWc / 2; p3.y = -(player.y + PHc); p3.z = 0;
    p3.vx = p3.vy = p3.vz = 0; p3.grounded = false; p3.yaw = FACE_X; p3.stepPhase = 0;
    p3.lgx = p3.x; p3.lgy = p3.y; p3.lgz = 0;
    // Camera looks down the level's length (+x), so "forward" advances the
    // level exactly like walking right in 2D; strafe (A/D) dodges laterally.
    cam.yaw = FACE_X; cam.el = CAM.el; cam.dist = CAM.dist; camDragCd = 0;
    cam.tx = p3.x; cam.ty = p3.y + 34; cam.tz = 0;
    try { if (typeof window.sfx === 'function') window.sfx('powerup_collect'); } catch (e) {}
  },

  exit() { if (mode === '2d') return; mode = 'exiting'; warpTarget = 0; },

  reset() {
    mode = '2d'; warp = 0; warpTarget = 0; drag = null; camDragCd = 0;
    notes3d = []; shootCd = dashCd = skirlCd = 0; skirlFx = 0;
    if (three && three.notes) three.notes.forEach(n => { n.mesh.visible = false; });
    try { (window.enemies || []).forEach(e => { if (e) e._p3 = null; }); } catch (err) {}
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    const cv = document.getElementById('three-canvas');
    if (cv) { cv.style.display = 'none'; cv.style.pointerEvents = 'none'; }
    const gc = document.getElementById('gameCanvas');
    if (gc) gc.style.opacity = '';
    const hint = document.getElementById('three-hint');
    if (hint) hint.style.display = 'none';
  },

  tick3D(opts) {
    if (opts) { if (opts.PW) PWc = opts.PW; if (opts.PH) PHc = opts.PH; }
    if (!ensureInit(960, 540)) return;

    const ld = (typeof window.getLevelData === 'function') ? window.getLevelData() : null;
    if (ld) {
      const sig = (ld.name || '') + '|' + (ld.platforms ? ld.platforms.length : 0) + '|' + (ld.width || 0);
      if (sig !== levelSig) { levelSig = sig; buildLevel(ld); }
    }

    tickController();
    if (mode === '3d' || mode === 'entering') { tickEnemies3D(); tickAbilities(); collect3DCoins(); }

    if (window.player && window.player.hp <= 0 && mode !== 'exiting') { this.reset(); return; }

    warp += (warpTarget - warp) * 0.1;
    if (mode === 'entering' && warp > 0.98) mode = '3d';
    if (mode === 'exiting' && warp < 0.02) { this.reset(); }
  },

  renderWorld(opts) {
    const W = opts.W, H = opts.H;
    if (opts.PW) PWc = opts.PW; if (opts.PH) PHc = opts.PH;
    if (!ensureInit(W, H)) return;

    const cv = document.getElementById('three-canvas');
    const gc = document.getElementById('gameCanvas');
    // Crossfade the two canvases through the swing: 3D fades in, 2D fades out.
    if (cv) { cv.style.display = ''; cv.style.pointerEvents = (mode === '2d' ? 'none' : 'auto'); cv.style.opacity = String(Math.min(1, warp * 1.7)); }
    if (gc) gc.style.opacity = String(Math.max(0, 1 - warp * 1.7));

    const ld = (typeof window.getLevelData === 'function') ? window.getLevelData() : null;
    if (!ld) return;
    const sig = (ld.name || '') + '|' + (ld.platforms ? ld.platforms.length : 0) + '|' + (ld.width || 0);
    if (sig !== levelSig) { levelSig = sig; buildLevel(ld); }

    const frame = window.frameCount | 0;

    // Seamless swing: blend between the flat, straight-on pose that MATCHES the
    // 2D side view (warp 0) and the behind-the-piper 3D chase pose (warp 1), so
    // entering/leaving 3D reads as the camera rotating around the world (which
    // simultaneously extrudes/flattens) rather than a hard cut.
    cam.tx += (p3.x - cam.tx) * 0.16;
    cam.ty += ((p3.y + 34) - cam.ty) * 0.16;
    cam.tz += (p3.z - cam.tz) * 0.16;
    const t = warp * warp * (3 - 2 * warp);           // smoothstep
    const horiz = cam.dist * Math.cos(cam.el);
    const bx = cam.tx - Math.sin(cam.yaw) * horiz;    // 3D behind-view position
    const by = cam.ty + cam.dist * Math.sin(cam.el);
    const bz = cam.tz - Math.cos(cam.yaw) * horiz;
    const FLAT_Z = 520;                               // 2D straight-on distance (≈960px wide framing)
    camera.position.set(
      cam.tx + (bx - cam.tx) * t,
      cam.ty + (by - cam.ty) * t,
      FLAT_Z + (bz - FLAT_Z) * t
    );
    camera.lookAt(cam.tx, cam.ty + 10 * t, cam.tz * t);

    three.platGroup.scale.z = 0.05 + 0.95 * warp;

    // Piper model.
    updatePiperModel();

    // Shadow onto the platform beneath the piper.
    let groundY = -2600;
    for (const b of boxes) {
      if (p3.x > b.x0 - 6 && p3.x < b.x1 + 6 && p3.z > b.z0 - 6 && p3.z < b.z1 + 6 && b.y1 <= p3.y + 2) {
        if (b.y1 > groundY) groundY = b.y1;
      }
    }
    const sh = three.shadow;
    if (groundY > -2600) {
      sh.visible = true;
      sh.position.set(p3.x, groundY + 0.6, p3.z);
      const fall = Math.max(0, Math.min(1, (p3.y - groundY) / 300));
      sh.scale.setScalar(Math.max(0.4, 1 - fall * 0.55));
      sh.material.opacity = 0.32 * (1 - fall * 0.7) * warp;
    } else sh.visible = false;

    // Coins.
    const coins = (window.collectibles || []).filter(c => !c.collected && (c.type === 'coin' || !c.type));
    while (three.coins.length < coins.length) three.coins.push(acquireCoin());
    for (let i = 0; i < three.coins.length; i++) {
      const cm = three.coins[i].mesh;
      if (i < coins.length) { const c = coins[i]; cm.visible = true; cm.position.set(c.x + 8, -(c.y + 8), 0); cm.rotation.z = frame * 0.12 + i; }
      else cm.visible = false;
    }

    // Enemy billboards (at their live 3D positions).
    const foes = (window.enemies || []).filter(e => e && !e.dead && !e._dead);
    while (three.enemies.length < foes.length) three.enemies.push(acquireEnemy());
    for (let i = 0; i < three.enemies.length; i++) {
      const em = three.enemies[i];
      if (i < foes.length) {
        const e = foes[i];
        em.sprite.visible = true;
        drawEnemySprite(em.spr, e, frame);
        const ew = e.w || 32, eh = e.h || 32;
        const ex = e._p3 ? e._p3.x : (e.x + ew / 2);
        const ey = e._p3 ? (e._p3.y + eh / 2) : -(e.y + eh / 2);
        const ez = e._p3 ? e._p3.z : 0;
        em.sprite.scale.set(ew / 44, eh / 44, 1);
        em.sprite.position.set(ex, ey, ez);
        em.sprite.rotation.set(0, Math.atan2(camera.position.x - ex, camera.position.z - ez), 0);
      } else em.sprite.visible = false;
    }

    // Note projectiles.
    while (three.notes.length < notes3d.length) three.notes.push(acquireNote());
    for (let i = 0; i < three.notes.length; i++) {
      const nm = three.notes[i].mesh;
      if (i < notes3d.length) { const n = notes3d[i]; nm.visible = true; nm.position.set(n.x, n.y, n.z); try { nm.material.color.set(n.col); } catch (e) {} }
      else nm.visible = false;
    }

    // Skirl shockwave ring.
    const sr = three.skirlRing;
    if (skirlFx > 0) {
      sr.visible = true;
      sr.position.set(p3.x, p3.y + 2, p3.z);
      const s = 1 + (1 - skirlFx) * 8;
      sr.scale.set(s, s, s);
      sr.material.opacity = Math.max(0, skirlFx) * 0.7;
    } else sr.visible = false;

    renderer.render(scene, camera);
  },

  _dbg() { return { THREE, scene, renderer, camera, three, cam, p3, mode, warp, boxes, camDragCd }; },

  resize(W, H) {
    if (!inited || !renderer) return;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const cv = document.getElementById('three-canvas');
    if (cv) { cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  },
};

window.ThreeMode = ThreeMode;
export default ThreeMode;
