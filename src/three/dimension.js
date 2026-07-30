// src/three/dimension.js
// ─────────────────────────────────────────────────────────────────────────
// THE HIGHLAND PRISM — 2D platformer → TRUE 3D platformer.
//
// This is the one genuine ES module in the project (everything else is a
// classic <script src> talking through window globals). Vite bundles it and
// tree-shakes Three.js into it.
//
// When the player grabs the Highland Prism the level FOLDS INTO 3D and becomes
// a Mario-64 / Sunshine-style platformer:
//   • free movement on the X-Z ground plane, relative to the camera,
//   • gravity + jump on Y, with AABB collision against platform tops & sides,
//   • an orbiting 360° camera (mouse-drag / Q-E to spin, wheel to zoom).
//
// The 2D simulation's own updatePlayer()/updateEnemies() are BYPASSED while 3D
// is active — index.html routes the tick to ThreeMode.tick3D() instead, which
// runs its own 3D character controller and writes the resulting position back
// to window.player.x/y so the existing coin / goal / HUD code keeps working.
// The level's platforms (extruded into real boxes) are the collision world,
// and the pixel-art sprites are reused as camera-facing billboards so the game
// keeps its identity.
//
// Degrades gracefully: if WebGL/Three fails to init, isActive() stays false
// and the game keeps rendering + simulating in plain 2D.
// ─────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';

// World→scene mapping: 1 world unit == 1 three unit. Screen-down Y becomes
// world-up (+Y). The 2D gameplay line is z=0; blocks are extruded across ±z so
// they become walkable pads in 3D.
const DEPTH = 220;             // platform depth (walkable Z span)
const HALF_D = DEPTH / 2;

// Player collision box (half-extents) + feel constants (world px, tuned to
// roughly match the 2D game's GRAV/JUMP/SPEED so it feels of-a-piece).
const P_HX = 13, P_HZ = 13, P_HEIGHT = 46;
const GRAV = 0.62, JUMP_V = 13.2, MOVE = 4.2, MAX_FALL = 22, AIR_CTL = 0.55;

// Camera defaults.
const CAM = { az: 0.5, el: 0.42, dist: 360, minEl: 0.06, maxEl: 1.32, minDist: 180, maxDist: 820, fov: 60 };

let renderer = null, scene = null, camera = null;
let three = null;               // gathered mesh/pool state
let inited = false, failed = false;

// mode: '2d' (off) | 'entering' | '3d' | 'exiting'
let mode = '2d';
let warp = 0, warpTarget = 0;   // 0 = flat/2D framing, 1 = full 3D

// Live camera orbit state (copied from CAM on enter).
const cam = { az: CAM.az, el: CAM.el, dist: CAM.dist, tx: 0, ty: 0, tz: 0 };

// 3D player state (up = +Y).  x/z centre, y = feet.
const p3 = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, grounded: false, faceR: true, lgx: 0, lgy: 0, lgz: 0 };

let boxes = [];                 // collision AABBs (up-space)
let levelSig = '';
let PWc = 32, PHc = 50;         // player 2D dims, passed in from index.html

// Pointer / wheel camera control (attached once).
let drag = null;

// ── offscreen pixel-art → CanvasTexture ────────────────────────────────────
function makeSpriteCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { c, cx, tex };
}

function toColor(str, fallback) {
  try { if (typeof str === 'string' && str[0] === '#') return new THREE.Color(str); } catch (e) {}
  return new THREE.Color(fallback);
}

// Lift a (possibly near-black) level colour toward daylight so the 3D sky
// stays vivid even in dim night themes, while keeping the theme's hue.
function brighten(c, amt) {
  const col = c.clone();
  col.lerp(new THREE.Color(0xffffff), amt);
  return col;
}

// Build a vertical gradient sky as a CanvasTexture for scene.background.
function makeSkyTexture(topC, botC) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const cx = c.getContext('2d');
  const g = cx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#' + topC.getHexString());
  g.addColorStop(1, '#' + botC.getHexString());
  cx.fillStyle = g;
  cx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function ensureInit(W, H) {
  if (inited || failed) return !failed;
  try {
    const wrap = document.getElementById('wrap');
    if (!wrap) return false;

    const cv = document.createElement('canvas');
    cv.id = 'three-canvas';
    cv.style.cssText = 'position:absolute;left:0;top:0;z-index:2;display:none;';
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    cv.style.pointerEvents = 'none';
    wrap.appendChild(cv);

    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(CAM.fov, W / H, 1, 8000);

    // Bright, sunny lighting — the 3D world should feel vivid (Mario-Sunshine),
    // not inherit the dim night-time mood some 2D levels use.
    const amb = new THREE.HemisphereLight(0xdfeeff, 0x506070, 1.7);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xfff4e0, 2.1);
    key.position.set(-260, 620, 420);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xa8c8ff, 0.7);
    rim.position.set(420, 200, -340);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(120, 120, 520);
    scene.add(fill);

    three = { platGroup: new THREE.Group(), coins: [], enemies: [], player: null, shadow: null };
    scene.add(three.platGroup);

    // Player billboard.
    const pspr = makeSpriteCanvas(64, 72);
    const pmat = new THREE.MeshBasicMaterial({ map: pspr.tex, transparent: true, alphaTest: 0.35, depthWrite: false });
    const pmesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 58), pmat);
    pmesh.renderOrder = 10;
    scene.add(pmesh);
    three.player = { sprite: pmesh, spr: pspr };

    // Soft round shadow blob.
    const shGeo = new THREE.CircleGeometry(18, 20);
    const shMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
    const shadow = new THREE.Mesh(shGeo, shMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 5;
    scene.add(shadow);
    three.shadow = shadow;

    attachCameraControls(cv);

    inited = true;
    return true;
  } catch (e) {
    console.error('[ThreeMode] init failed, staying 2D:', e);
    failed = true;
    return false;
  }
}

// ── camera orbit controls (mouse drag + wheel; Q/E/keys handled in tick) ────
function attachCameraControls(cv) {
  const down = (e) => { if (mode === '2d') return; drag = { x: e.clientX, y: e.clientY }; e.preventDefault(); };
  const move = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    cam.az -= dx * 0.006;
    cam.el = Math.max(CAM.minEl, Math.min(CAM.maxEl, cam.el - dy * 0.006));
  };
  const up = () => { drag = null; };
  cv.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  cv.addEventListener('wheel', (e) => {
    if (mode === '2d') return;
    cam.dist = Math.max(CAM.minDist, Math.min(CAM.maxDist, cam.dist + e.deltaY * 0.35));
    e.preventDefault();
  }, { passive: false });
}

// ── build static level geometry + collision boxes ───────────────────────────
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
    const geo = new THREE.BoxGeometry(p.w, p.h, DEPTH);
    const side = new THREE.MeshStandardMaterial({ color: faceCol, roughness: 0.85, metalness: 0.04 });
    const top = new THREE.MeshStandardMaterial({ color: topCol, roughness: 0.7, metalness: 0.04 });
    const mesh = new THREE.Mesh(geo, [side, side, top, side, side, side]);
    mesh.position.set(p.x + p.w / 2, -(p.y + p.h / 2), 0);
    three.platGroup.add(mesh);
    // AABB in up-space.
    boxes.push({ x0: p.x, x1: p.x + p.w, y0: -(p.y + p.h), y1: -p.y, z0: -HALF_D, z1: HALF_D });
  }

  const bg = (ld.bgColors && ld.bgColors.length) ? ld.bgColors : ['#0a1520', '#182535'];
  const baseTop = toColor(bg[0] || '#0a1520', '#0a1520');
  const baseBot = toColor(bg[1] || bg[0], '#182535');
  // Bias the sky toward a vivid daylight blue (keeping a hint of the theme
  // hue) so even dim night themes read as bright and sunny in 3D.
  const skyTop = baseTop.clone().lerp(new THREE.Color(0x8ec7ff), 0.82);
  const skyBot = baseBot.clone().lerp(new THREE.Color(0xdff0ff), 0.72);
  if (scene.background && scene.background.dispose) scene.background.dispose();
  scene.background = makeSkyTexture(skyTop, skyBot);
  scene.fog = new THREE.Fog(skyBot.getHex(), 1200, 4200);
}

// ── sprite drawing ──────────────────────────────────────────────────────────
function updatePlayerSprite() {
  const player = window.player || {};
  const { c, cx, tex } = three.player.spr;
  cx.clearRect(0, 0, c.width, c.height);
  try {
    if (typeof window.drawBagpiper32 === 'function') {
      window.drawBagpiper32(cx, 16, 8, p3.faceR, player.frame | 0, !!player.shieldOn, !!player.chargeOn, player.bagpipe || 1, 0, null);
    }
  } catch (e) {}
  tex.needsUpdate = true;
}

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
  const mat = new THREE.MeshBasicMaterial({ map: spr.tex, transparent: true, alphaTest: 0.35, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(52, 52), mat);
  mesh.renderOrder = 9;
  scene.add(mesh);
  return { sprite: mesh, spr };
}

function acquireCoin() {
  const geo = new THREE.CylinderGeometry(9, 9, 3, 18);
  const mat = new THREE.MeshStandardMaterial({ color: 0xf5c518, metalness: 0.7, roughness: 0.25, emissive: 0x5a4600, emissiveIntensity: 0.45 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  scene.add(mesh);
  return { mesh };
}

// ── 3D character controller ─────────────────────────────────────────────────
function aabbHit(px0, px1, py0, py1, pz0, pz1, b) {
  return px1 > b.x0 && px0 < b.x1 && py1 > b.y0 && py0 < b.y1 && pz1 > b.z0 && pz0 < b.z1;
}

// Center-x/z, feet-y AABB test against a level box.
function boxHit(cx, feetY, cz, hx, hh, hz, b) {
  return cx + hx > b.x0 && cx - hx < b.x1 && feetY + hh > b.y0 && feetY < b.y1 && cz + hz > b.z0 && cz - hz < b.z1;
}

// Reuse the 2D kill funnel (combo chain, screen shake, bonus coins, stats)
// so kills scored in 3D feel and pay out exactly like 2D kills.
function killCredit(e) {
  if (e._statCounted) return;
  e._statCounted = true;
  try { if (window.GameStats) window.GameStats.recordEnemyKill(); } catch (err) {}
  try { if (typeof window.onEnemyKilled === 'function') window.onEnemyKilled(e); } catch (err) {}
}

// ── full 3D enemy AI ────────────────────────────────────────────────────────
// Enemies chase the piper across the X-Z plane with gravity + platform
// collision. Stomp them from above to kill; touch them any other way to take a
// hit. Positions are written back to e.x/e.y so a return to 2D is seamless.
function tickEnemies3D() {
  const player = window.player;
  const foes = (window.enemies || []).filter(e => e && !e.dead && !e._dead);
  for (const e of foes) {
    const ew = e.w || 32, eh = e.h || 32;
    const hx = ew / 2, hz = Math.min(ew / 2, 18), h = eh;
    if (!e._p3) e._p3 = { x: e.x + ew / 2, y: -(e.y + eh), z: 0, vx: 0, vy: 0, vz: 0, grounded: false };
    const s = e._p3;

    // Chase (only once the fold-in has mostly finished).
    const dx = p3.x - s.x, dz = p3.z - s.z;
    const dist = Math.hypot(dx, dz) || 1;
    const isBoss = e.v >= 90;
    let spd = 1.7;
    if (e.v === 4) spd = 2.9;        // charger
    else if (e.v === 14) spd = 2.4;  // berserker
    else if (isBoss) spd = 2.2;
    if (warp > 0.6 && dist < 1200) {
      s.vx += ((dx / dist) * spd - s.vx) * 0.08;
      s.vz += ((dz / dist) * spd - s.vz) * 0.08;
    } else { s.vx *= 0.9; s.vz *= 0.9; }

    // Gravity.
    s.vy -= GRAV;
    if (s.vy < -MAX_FALL) s.vy = -MAX_FALL;

    // Integrate + resolve per axis.
    s.x += s.vx;
    for (const b of boxes) { if (boxHit(s.x, s.y, s.z, hx, h, hz, b)) { if (s.vx > 0) s.x = b.x0 - hx; else if (s.vx < 0) s.x = b.x1 + hx; s.vx = 0; } }
    s.z += s.vz;
    for (const b of boxes) { if (boxHit(s.x, s.y, s.z, hx, h, hz, b)) { if (s.vz > 0) s.z = b.z0 - hz; else if (s.vz < 0) s.z = b.z1 + hz; s.vz = 0; } }
    s.grounded = false; s.y += s.vy;
    for (const b of boxes) { if (boxHit(s.x, s.y, s.z, hx, h, hz, b)) { if (s.vy <= 0) { s.y = b.y1; s.grounded = true; } else s.y = b.y0 - h; s.vy = 0; } }

    if (s.y < -3000) { e.dead = true; continue; }

    // Write back to 2D coords so exiting 3D is seamless.
    e.x = s.x - ew / 2; e.y = -s.y - eh;

    // Player interaction.
    const near = Math.abs(p3.x - s.x) < (P_HX + hx) && Math.abs(p3.z - s.z) < (P_HZ + hz)
      && (p3.y < s.y + h) && (p3.y + P_HEIGHT > s.y);
    if (near) {
      const stomp = p3.vy < 0 && p3.y > s.y + h * 0.55;
      if (stomp && !isBoss) {
        e.hp = 0; e.dead = true;
        p3.vy = JUMP_V * 0.72;
        killCredit(e);
        try { if (window.sfx) window.sfx('enemy_die'); } catch (err) {}
      } else if (isBoss && stomp) {
        // Bosses take a hit from a stomp but don't die outright.
        if (typeof e.hp === 'number') e.hp -= 1;
        p3.vy = JUMP_V * 0.6;
        try { if (window.sfx) window.sfx('hit'); } catch (err) {}
        if (e.hp <= 0) { e.dead = true; killCredit(e); }
      } else if (!(player.invincible > 0)) {
        player.hp -= 1;
        player.invincible = 66;
        player._lastHp = player.hp;
        const kb = Math.atan2(p3.z - s.z, p3.x - s.x);
        p3.vx = Math.cos(kb) * 6.5; p3.vz = Math.sin(kb) * 6.5; p3.vy = 6.5;
        try { if (window.sfx) window.sfx('player_hit'); } catch (err) {}
        try { if (window.addShake) window.addShake(7); } catch (err) {}
      }
    }
  }
}

function syncPlayerBack() {
  const player = window.player;
  if (!player) return;
  player.x = p3.x - PWc / 2;
  player.y = -p3.y - PHc;   // p3.y is feet in up-space
}

function tickController() {
  // Player invincibility frames (from taking a hit) tick down here since the
  // 2D sim that normally decrements them is bypassed in 3D.
  if (window.player && window.player.invincible > 0) window.player.invincible--;

  // Camera-relative movement basis (flattened to XZ).
  const fx = Math.sin(cam.az), fz = Math.cos(cam.az);   // "into screen" toward target
  // forward should push AWAY from camera → toward -(camera offset) = (fx,fz) points from target to cam,
  // so movement-forward is -(fx,fz).
  const forwardX = -fx, forwardZ = -fz;
  const rightX = -fz, rightZ = fx;

  const K = window.K || {}, JP = window.JP || {};
  const inF = (K['ArrowUp'] || K['KeyW'] ? 1 : 0) - (K['ArrowDown'] || K['KeyS'] ? 1 : 0);
  const inS = (K['ArrowRight'] || K['KeyD'] ? 1 : 0) - (K['ArrowLeft'] || K['KeyA'] ? 1 : 0);
  // Keyboard camera spin fallback (abilities are inert in 3D).
  if (K['KeyQ']) cam.az += 0.045;
  if (K['KeyE']) cam.az -= 0.045;

  const locked = warp < 0.5;   // no control until the fold-in mostly finishes
  let wishX = 0, wishZ = 0;
  if (!locked && (inF || inS)) {
    wishX = forwardX * inF + rightX * inS;
    wishZ = forwardZ * inF + rightZ * inS;
    const len = Math.hypot(wishX, wishZ) || 1;
    wishX /= len; wishZ /= len;
  }

  const ctl = p3.grounded ? 1 : AIR_CTL;
  const target = MOVE;
  // Accelerate toward wished velocity.
  p3.vx += ((wishX * target) - p3.vx) * 0.35 * ctl;
  p3.vz += ((wishZ * target) - p3.vz) * 0.35 * ctl;
  if (!wishX && !wishZ && p3.grounded) { p3.vx *= 0.7; p3.vz *= 0.7; }

  // Facing: flip sprite based on screen-space horizontal motion.
  const screenR = p3.vx * rightX + p3.vz * rightZ;
  if (Math.abs(screenR) > 0.15) p3.faceR = screenR > 0;

  // Jump.
  if (!locked && p3.grounded && (JP['Space'] || JP['KeyZ'] || JP['ArrowUp'])) {
    p3.vy = JUMP_V;
    p3.grounded = false;
    try { if (typeof window.sfx === 'function') window.sfx('jump'); } catch (e) {}
  }

  // Gravity.
  p3.vy -= GRAV;
  if (p3.vy < -MAX_FALL) p3.vy = -MAX_FALL;

  // Exit fold: ease Z back to the play-plane so 2D resumes cleanly.
  if (mode === 'exiting') { p3.z += (0 - p3.z) * 0.2; p3.vz = 0; }

  // ── integrate + resolve per axis ──
  const hx = P_HX, hz = P_HZ, h = P_HEIGHT;
  const px = () => [p3.x - hx, p3.x + hx, p3.y, p3.y + h, p3.z - hz, p3.z + hz];

  // X
  p3.x += p3.vx;
  for (const b of boxes) { let a = px(); if (aabbHit(a[0], a[1], a[2], a[3], a[4], a[5], b)) { if (p3.vx > 0) p3.x = b.x0 - hx; else if (p3.vx < 0) p3.x = b.x1 + hx; p3.vx = 0; } }
  // Z
  p3.z += p3.vz;
  for (const b of boxes) { let a = px(); if (aabbHit(a[0], a[1], a[2], a[3], a[4], a[5], b)) { if (p3.vz > 0) p3.z = b.z0 - hz; else if (p3.vz < 0) p3.z = b.z1 + hz; p3.vz = 0; } }
  // Y
  p3.grounded = false;
  p3.y += p3.vy;
  for (const b of boxes) {
    let a = px();
    if (aabbHit(a[0], a[1], a[2], a[3], a[4], a[5], b)) {
      if (p3.vy <= 0) { p3.y = b.y1; p3.grounded = true; } // land on top
      else { p3.y = b.y0 - h; }                            // bonk head
      p3.vy = 0;
    }
  }

  if (p3.grounded) { p3.lgx = p3.x; p3.lgy = p3.y; p3.lgz = p3.z; }

  // Fell off the world → respawn at last safe ground.
  if (p3.y < -2600) {
    p3.x = p3.lgx; p3.y = p3.lgy + 40; p3.z = p3.lgz;
    p3.vx = p3.vy = p3.vz = 0;
    try { if (window.player && typeof window.addShake === 'function') window.addShake(6); } catch (e) {}
  }

  syncPlayerBack();
}

// ── public API ──────────────────────────────────────────────────────────────
const ThreeMode = {
  isActive() { return mode !== '2d' && !failed; },     // for render routing
  isControlling() { return (mode === '3d' || mode === 'entering' || mode === 'exiting') && !failed; },
  isFailed() { return failed; },
  is3D() { return mode === '3d'; },

  enter() {
    if (failed || mode === '3d' || mode === 'entering') return;
    mode = 'entering';
    warpTarget = 1;
    // Seed 3D state from the current 2D player.
    const player = window.player || { x: 40, y: 300 };
    p3.x = player.x + PWc / 2;
    p3.y = -(player.y + PHc);
    p3.z = 0; p3.vx = p3.vy = p3.vz = 0; p3.grounded = false;
    p3.lgx = p3.x; p3.lgy = p3.y; p3.lgz = 0;
    cam.az = CAM.az; cam.el = CAM.el; cam.dist = CAM.dist;
    cam.tx = p3.x; cam.ty = p3.y + 30; cam.tz = 0;
    try { if (typeof window.sfx === 'function') window.sfx('powerup_collect'); } catch (e) {}
  },

  exit() {
    if (mode === '2d') return;
    mode = 'exiting';
    warpTarget = 0;
  },

  reset() {
    mode = '2d'; warp = 0; warpTarget = 0; drag = null;
    // Drop each enemy's 3D state so a fresh entry re-seeds from 2D positions.
    try { (window.enemies || []).forEach(e => { if (e) e._p3 = null; }); } catch (err) {}
    const cv = document.getElementById('three-canvas');
    if (cv) { cv.style.display = 'none'; cv.style.pointerEvents = 'none'; }
    const gc = document.getElementById('gameCanvas');
    if (gc) gc.style.opacity = '';
  },

  // Advance the 3D player + camera. Called from index.html tickOnce while
  // isControlling() is true. opts carries inline-script consts (PW/PH).
  tick3D(opts) {
    if (opts) { if (opts.PW) PWc = opts.PW; if (opts.PH) PHc = opts.PH; }
    if (!ensureInit(960, 540)) return;

    // Level rebuild on change.
    const ld = (typeof window.getLevelData === 'function') ? window.getLevelData() : null;
    if (ld) {
      const sig = (ld.name || '') + '|' + (ld.platforms ? ld.platforms.length : 0) + '|' + (ld.width || 0);
      if (sig !== levelSig) { levelSig = sig; buildLevel(ld); }
    }

    tickController();
    if (mode === '3d' || mode === 'entering') tickEnemies3D();

    // Player death in 3D: hard-cut back to 2D so the normal death / respawn /
    // gameover path takes over on the next tick (position is already synced).
    if (window.player && window.player.hp <= 0 && mode !== 'exiting') { this.reset(); return; }

    // Warp easing + mode settle.
    warp += (warpTarget - warp) * 0.1;
    if (mode === 'entering' && warp > 0.98) mode = '3d';
    if (mode === 'exiting' && warp < 0.02) { this.reset(); }
  },

  // Draw the 3D scene. Called from renderFrame() every rAF while isActive().
  renderWorld(opts) {
    const W = opts.W, H = opts.H;
    if (opts.PW) PWc = opts.PW; if (opts.PH) PHc = opts.PH;
    if (!ensureInit(W, H)) return;

    const cv = document.getElementById('three-canvas');
    const gc = document.getElementById('gameCanvas');
    if (cv) { cv.style.display = ''; cv.style.pointerEvents = (mode === '2d' ? 'none' : 'auto'); }
    if (gc) gc.style.opacity = String(1 - Math.min(1, warp * 1.8));

    const ld = (typeof window.getLevelData === 'function') ? window.getLevelData() : null;
    if (!ld) return;
    const sig = (ld.name || '') + '|' + (ld.platforms ? ld.platforms.length : 0) + '|' + (ld.width || 0);
    if (sig !== levelSig) { levelSig = sig; buildLevel(ld); }

    const frame = window.frameCount | 0;

    // Camera follow + orbit (eased target).
    cam.tx += (p3.x - cam.tx) * 0.14;
    cam.ty += ((p3.y + 34) - cam.ty) * 0.14;
    cam.tz += (p3.z - cam.tz) * 0.14;
    const ce = Math.cos(cam.el), se = Math.sin(cam.el);
    // During fold-in, dolly the camera from far → normal and lift elevation.
    const dist = cam.dist * (1 + (1 - warp) * 1.4);
    camera.position.set(
      cam.tx + dist * ce * Math.sin(cam.az),
      cam.ty + dist * se + (1 - warp) * 40,
      cam.tz + dist * ce * Math.cos(cam.az)
    );
    camera.lookAt(cam.tx, cam.ty, cam.tz);

    // Blocks "unfold" into depth as warp rises.
    three.platGroup.scale.z = 0.05 + 0.95 * warp;

    // Player billboard + shadow.
    updatePlayerSprite();
    const pm = three.player.sprite;
    pm.position.set(p3.x, p3.y + 29, p3.z);
    pm.rotation.set(0, Math.atan2(camera.position.x - p3.x, camera.position.z - p3.z), 0);

    // Shadow: drop onto the highest platform top beneath the player.
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
      sh.scale.setScalar(Math.max(0.35, 1 - fall * 0.6));
      sh.material.opacity = 0.34 * (1 - fall * 0.7) * warp;
    } else sh.visible = false;

    // Coins (3D discs).
    const coins = (window.collectibles || []).filter(c => !c.collected && (c.type === 'coin' || !c.type));
    while (three.coins.length < coins.length) three.coins.push(acquireCoin());
    for (let i = 0; i < three.coins.length; i++) {
      const cm = three.coins[i].mesh;
      if (i < coins.length) { const c = coins[i]; cm.visible = true; cm.position.set(c.x + 8, -(c.y + 8), 0); cm.rotation.z = frame * 0.12 + i; }
      else cm.visible = false;
    }

    // Enemies (billboards, frozen in 3D v1).
    const foes = (window.enemies || []).filter(e => e && !e.dead && !e._dead);
    while (three.enemies.length < foes.length) three.enemies.push(acquireEnemy());
    for (let i = 0; i < three.enemies.length; i++) {
      const em = three.enemies[i];
      if (i < foes.length) {
        const e = foes[i];
        em.sprite.visible = true;
        drawEnemySprite(em.spr, e, frame);
        const ew = e.w || 32, eh = e.h || 32;
        // Use the enemy's live 3D position (it now moves in Z too).
        const ex = e._p3 ? e._p3.x : (e.x + ew / 2);
        const ey = e._p3 ? (e._p3.y + eh / 2) : -(e.y + eh / 2);
        const ez = e._p3 ? e._p3.z : 0;
        em.sprite.scale.set(ew / 44, eh / 44, 1);
        em.sprite.position.set(ex, ey, ez);
        em.sprite.rotation.set(0, Math.atan2(camera.position.x - ex, camera.position.z - ez), 0);
      } else em.sprite.visible = false;
    }

    renderer.render(scene, camera);
  },

  _dbg() { return { THREE, scene, renderer, camera, three, cam, p3, mode, warp, boxes }; },

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
