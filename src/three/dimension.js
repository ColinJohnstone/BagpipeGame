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
let movers = [];       // moving platforms: {box, mesh, bx,by,bz, axis, dist, speed, ph}
let spikes3d = [];     // spike hazards: {x, y, z, r}
const BOUNCE_V = 21;   // bounce-pad launch velocity
let levelSig = '';

// Damage the piper (contact hazards / lava / spikes). Respects i-frames.
function hurtPlayer() {
  const p = window.player;
  if (!p || p.invincible > 0) return;
  p.hp -= 1; p.invincible = 72; p._lastHp = p.hp;
  try { if (window.sfx) window.sfx('player_hit'); } catch (e) {}
  try { if (window.addShake) window.addShake(6); } catch (e) {}
}
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

// ── procedural biome block textures (bright, clean, Mario-3D-World-ish) ──────
const _texCache = {};
function canvasTex(key, w, h, draw) {
  if (_texCache[key]) return _texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  try { t.anisotropy = 4; } catch (e) {}
  _texCache[key] = t; return t;
}
function speckle(cx, w, h, cols, n) {
  for (let i = 0; i < n; i++) { cx.fillStyle = cols[(Math.random() * cols.length) | 0]; const s = 2 + Math.random() * 3; cx.fillRect(Math.random() * w, Math.random() * h, s, s); }
}
// top textures
function texTop(key, base, cols) { return canvasTex(key, 64, 64, (cx, w, h) => { cx.fillStyle = base; cx.fillRect(0, 0, w, h); speckle(cx, w, h, cols, 260); }); }
// side texture with a coloured fringe along the very top (grass/snow overhang)
function texSide(key, base, cols, fringe) {
  return canvasTex(key, 64, 64, (cx, w, h) => {
    cx.fillStyle = base; cx.fillRect(0, 0, w, h);
    for (let i = 0; i < 220; i++) { cx.fillStyle = cols[(Math.random() * cols.length) | 0]; cx.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
    if (fringe) { cx.fillStyle = fringe; cx.fillRect(0, 0, w, 9); for (let i = 0; i < w; i += 4) cx.fillRect(i, 7 + Math.random() * 6, 3, 6); }
  });
}
// glowing-crack emissive map (for lava rock)
function texCracks(key, glow) {
  return canvasTex(key, 64, 64, (cx, w, h) => {
    cx.fillStyle = '#000'; cx.fillRect(0, 0, w, h);
    cx.strokeStyle = glow; cx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { cx.beginPath(); let x = Math.random() * w, y = Math.random() * h; cx.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (Math.random() - 0.5) * 26; y += (Math.random() - 0.5) * 26; cx.lineTo(x, y); } cx.stroke(); }
  });
}

// Biome palettes: block textures + sky/fog/light + decoration style.
const BIOMES = {
  grass: { top: () => texTop('gTop', '#57b544', ['#66c853', '#4aa338', '#72d15f']), side: () => texSide('gSide', '#7a5230', ['#8a6238', '#653f1f', '#946b3e'], '#57b544'), sky: ['#7ec2ff', '#d4ecff'], fog: '#cfe8ff', light: '#fff2da', deco: 'tree', shine: 0 },
  ice: { top: () => texTop('iTop', '#bfe6f5', ['#d6f2ff', '#a9d8ec', '#e8faff']), side: () => texSide('iSide', '#8fc4dc', ['#a9d8ec', '#79b0c8', '#c6ebfa'], '#eaffff'), sky: ['#a7d8ff', '#e6f6ff'], fog: '#e6f6ff', light: '#eaf4ff', deco: 'crystal', shine: 0.4 },
  lava: { top: () => texTop('lTop', '#3a2b2b', ['#4a3636', '#2c2020', '#553c3c']), side: () => texSide('lSide', '#2e2222', ['#3c2b2b', '#241a1a', '#463232'], null), sky: ['#c8522a', '#f2a15a'], fog: '#e07a3a', light: '#ffd8a0', deco: 'ember', shine: 0, emissive: () => texCracks('lCrack', '#ff8a2a') },
  sky: { top: () => texTop('sTop', '#c9d4e8', ['#dbe4f2', '#b4c2dc', '#eef3fb']), side: () => texSide('sSide', '#aab6cf', ['#c0cbe0', '#95a2bd', '#d6dded'], '#eef3fb'), sky: ['#8fc4ff', '#dff0ff'], fog: '#dff0ff', light: '#fff6e6', deco: 'cloud', shine: 0.1 },
};
function pickBiome(ld) {
  const b = ld && ld.biome;
  if (b && BIOMES[b]) return b;
  return 'grass';
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

function cyl(rt, rb, h, color, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), mat(color)); }
function sph(r, color) { return new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), mat(color)); }
// A cylinder limb pivoted at its TOP (for hip / shoulder swing).
function limbCyl(rt, rb, h, color) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, 12);
  geo.translate(0, -h / 2, 0);
  return new THREE.Mesh(geo, mat(color));
}

function buildPiperModel() {
  const pc = (typeof window !== 'undefined' && window.PLAYER_CUSTOM) || {};
  const skin = pc.skin || '#e8c8a0';
  const jacket = pc.jacket || '#1f4a24';
  const jacketAcc = pc.jacketAccent || '#123016';
  const sock = pc.stockings || '#ece8d2';
  const beardCol = pc.beardColor || '#8b3a14';
  const kilt = '#8a3030', kiltDark = '#5e2020';   // tartan reds
  const hatCol = '#2a4a8c';                        // tam o' shanter blue
  const g = new THREE.Group();
  const parts = [];
  const add = (m, x, y, z) => { if (x != null) m.position.set(x, y, z); parts.push(m); return m; };

  // Feet + rounded legs.
  add(box(9, 5, 13, '#2a1c10'), -6, 3, 2.5);
  add(box(9, 5, 13, '#2a1c10'), 6, 3, 2.5);
  const legL = limbCyl(4.2, 3.6, 20, sock), legR = limbCyl(4.2, 3.6, 20, sock);
  add(legL, -6, 23, 0); add(legR, 6, 23, 0);
  add(cyl(4.6, 4.6, 2.5, kiltDark), -6, 26, 0);   // garter bands
  add(cyl(4.6, 4.6, 2.5, kiltDark), 6, 26, 0);

  // Flared tartan kilt (cone) + tartan cross-stripes + sporran + belt.
  add(cyl(10, 16.5, 17, kilt), 0, 20.5, 0);
  add(cyl(10.4, 13, 3, kiltDark), 0, 24, 0);
  add(cyl(13.5, 16.8, 3, kiltDark), 0, 14, 0);
  const sporran = sph(5.5, pc.sporran || '#5a3a18'); sporran.scale.set(1, 0.9, 0.7); add(sporran, 0, 15, 10);
  add(cyl(11.5, 11.5, 3.4, jacketAcc), 0, 29, 0);

  // Torso (tapered) + shoulders + lapels.
  add(cyl(9.5, 11, 16, jacket), 0, 38, 0);
  add(sph(6, jacket), -9, 45, 0); add(sph(6, jacket), 9, 45, 0);
  const lapel = box(9, 12, 2, jacketAcc); lapel.rotation.z = 0.12; add(lapel, 0, 40, 7);

  // Arms (rounded) + hands.
  const armL = limbCyl(3.6, 3, 17, jacket), armR = limbCyl(3.6, 3, 17, jacket);
  add(armL, -11.5, 46, 0); add(armR, 11.5, 46, 0);
  add(sph(3.4, skin), -11.5, 29, 0); add(sph(3.4, skin), 11.5, 29, 0);

  // Head + face (eyes, nose, brows) + beard.
  const head = sph(8.5, skin); head.scale.set(1, 1.05, 0.98); add(head, 0, 55, 0);
  add(sph(1.9, '#20232b'), -3.4, 56.5, 7); add(sph(1.9, '#20232b'), 3.4, 56.5, 7);   // eyes
  add(sph(1.1, '#ffffff'), -3.0, 57.0, 7.9); add(sph(1.1, '#ffffff'), 3.8, 57.0, 7.9); // eye glints
  add(sph(2, skin), 0, 54, 8.4);                                                        // nose
  if (!pc.beard || pc.beard !== 'clean') {
    const beard = sph(7, beardCol); beard.scale.set(1, 0.7, 0.7); add(beard, 0, 49.5, 5.5);
  }
  add(box(9, 1.4, 2, beardCol), 0, 60, 7.6);   // brow/hair line under the hat

  // Tam o' shanter — brim, domed top, pom.
  add(cyl(11, 11, 2.5, hatCol), 0, 62, 0);
  const dome = sph(9, hatCol); dome.scale.set(1, 0.55, 1); add(dome, 0, 64.5, 0);
  add(sph(2.6, '#c0202c'), 0, 68, 0);

  // Bagpipe — ellipsoid bag under the arm + a blowpipe + three banded drones.
  const bag = sph(8, '#38542c'); bag.scale.set(0.9, 1.15, 0.8); bag.rotation.z = -0.2; add(bag, 12, 40, 5);
  const blow = cyl(1.1, 1.1, 15, '#caa66a'); blow.rotation.z = -0.9; add(blow, 15, 50, 6);
  const droneCols = ['#efe6cc', '#e6dcbf', '#d8cdac'];
  const droneH = [24, 21, 17];
  for (let i = 0; i < 3; i++) {
    const d = limbCyl(1.7, 1.5, droneH[i], droneCols[i]);
    d.position.set(-9 - i * 2, 50, 3 - i); d.rotation.z = 0.4 + i * 0.06; d.rotation.x = -0.12;
    add(d);
    const band = cyl(2.1, 2.1, 2, '#3a2a16'); band.position.set(-9 - i * 2 - 4, 45, 3 - i); band.rotation.z = 0.4 + i * 0.06; add(band);
  }

  parts.forEach(m => g.add(m));
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { group: g, legL, legR, armL, armR, torso: head };
}

// ── goal castle — the visible "end of level" landmark, with a light beacon ───
function buildGoalCastle() {
  const g = new THREE.Group();
  const stone = '#cfc9b2', stoneD = '#a9a288', roof = '#8a3b3b', doorC = '#3a2a18';
  const keep = box(72, 92, 62, stone); keep.position.y = 46; g.add(keep);
  const band = box(74, 10, 64, stoneD); band.position.y = 70; g.add(band);
  for (let i = -1; i <= 1; i++) { const b = box(16, 14, 62, stoneD); b.position.set(i * 26, 98, 0); g.add(b); }   // battlements
  const towers = [[-42, -28], [42, -28], [-42, 28], [42, 28]];
  for (const [tx, tz] of towers) {
    const t = cyl(15, 17, 118, stone, 12); t.position.set(tx, 59, tz); g.add(t);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(21, 30, 12), mat(roof)); cap.position.set(tx, 133, tz); g.add(cap);
  }
  // Door + glowing portal on the -x face (players arrive travelling +x).
  const doorM = box(28, 46, 8, doorC); doorM.position.set(-37, 23, 0); g.add(doorM);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(22, 38), new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  portal.position.set(-41.5, 23, 0); portal.rotation.y = Math.PI / 2; g.add(portal);
  // Flag on a central pole.
  const pole = cyl(1.6, 1.6, 54, '#5a4a3a'); pole.position.set(0, 126, 0); g.add(pole);
  const flag = box(34, 20, 2, '#c0202c'); flag.position.set(18, 146, 0); g.add(flag);
  // Beacon: a tall translucent light column so the goal is visible from afar.
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(12, 30, 760, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }));
  beacon.position.y = 420; g.add(beacon);
  g.traverse(o => { if (o.isMesh && o !== beacon && o !== portal) o.castShadow = true; });
  g.visible = false;
  return { group: g, beacon, flag, portal };
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
      el.style.cssText = 'position:absolute;left:10px;top:70px;z-index:60;'
        + "font-family:'Press Start 2P',monospace;font-size:7px;line-height:1.9;color:#eaf2ff;text-align:left;"
        + 'background:rgba(10,14,30,0.6);border:1px solid rgba(150,180,255,0.35);border-radius:8px;'
        + 'padding:8px 10px;pointer-events:none;transition:opacity .6s ease;';
      el.innerHTML = '💠 3D CONTROLS'
        + '<br>WASD MOVE · SPACE ×2 JUMP'
        + '<br>Q SHOOT · E CHARGE'
        + '<br>F SKIRL · R DRONE · H HOOK'
        + '<br>MOUSE / ARROWS LOOK · ESC PAUSE';
      wrap.appendChild(el);
    }
    el.style.display = '';
    el.style.opacity = '1';
    // Stay as a dim persistent legend after the intro so the keys are always
    // discoverable (the ability keys differ from 2D).
    clearTimeout(showThreeHint._t);
    showThreeHint._t = setTimeout(() => { if (el) el.style.opacity = '0.5'; }, 5500);
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(CAM.fov, W / H, 1, 9000);

    const amb = new THREE.HemisphereLight(0xdfeeff, 0x53607a, 1.35);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xfff2da, 2.0);
    key.position.set(-260, 620, 420);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 10; key.shadow.camera.far = 2600;
    key.shadow.camera.left = -820; key.shadow.camera.right = 820;
    key.shadow.camera.top = 820; key.shadow.camera.bottom = -820;
    key.shadow.bias = -0.0006;
    scene.add(key); scene.add(key.target);
    const rim = new THREE.DirectionalLight(0xa8c8ff, 0.55); rim.position.set(420, 200, -340); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4); fill.position.set(120, 120, 520); scene.add(fill);

    three = { platGroup: new THREE.Group(), decoGroup: new THREE.Group(), hazGroup: new THREE.Group(), coins: [], enemies: [], notes: [], player: null, shadow: null, skirlRing: null, hookLine: null, keyLight: key, goal: null };
    scene.add(three.platGroup); scene.add(three.decoGroup); scene.add(three.hazGroup);

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

    // Hook-shot rope.
    const hookLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineBasicMaterial({ color: 0xffe08a }));
    hookLine.visible = false; hookLine.renderOrder = 7; scene.add(hookLine); three.hookLine = hookLine;

    // Goal castle (the visible end-of-level landmark).
    three.goal = buildGoalCastle(); scene.add(three.goal.group);

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
  boxes = []; movers = []; spikes3d = [];
  for (let i = three.hazGroup.children.length - 1; i >= 0; i--) { const m = three.hazGroup.children[i]; three.hazGroup.remove(m); }

  // Biome-driven look: textured grass / ice / lava / sky blocks.
  const biome = pickBiome(ld);
  const B = BIOMES[biome];
  const topBase = B.top(), sideBase = B.side();
  const emBase = B.emissive ? B.emissive() : null;

  const _plats = ld.platforms || [];
  for (let _pi = 0; _pi < _plats.length; _pi++) {
    const p = _plats[_pi];
    if (p.type && p.type !== 'ground') continue;
    // Optional per-platform depth: zc = z-centre, zd = z half-depth.
    const zc = (typeof p.zc === 'number') ? p.zc : 0;
    const zd = (typeof p.zd === 'number') ? p.zd : HALF_D;
    const geo = new THREE.BoxGeometry(p.w, p.h, zd * 2);

    let top, side;
    if (p.kind === 'bounce') {                       // springy bounce pad
      top = new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: 0.4, metalness: 0.1, emissive: 0x6a3d00, emissiveIntensity: 0.4 });
      side = new THREE.MeshStandardMaterial({ color: 0xd98a12, roughness: 0.5 });
    } else if (p.kind === 'lava') {                  // glowing lava-rock hazard
      top = new THREE.MeshStandardMaterial({ color: 0x2a1410, roughness: 0.7, emissive: 0xff5a10, emissiveIntensity: 1.1 });
      side = new THREE.MeshStandardMaterial({ color: 0x1e0e0c, roughness: 0.8, emissive: 0xff4a10, emissiveIntensity: 0.7 });
    } else {                                          // textured biome block
      const topTex = topBase.clone(); topTex.needsUpdate = true; topTex.repeat.set(Math.max(1, p.w / 70), Math.max(1, (zd * 2) / 70));
      const sideTex = sideBase.clone(); sideTex.needsUpdate = true; sideTex.repeat.set(Math.max(1, p.w / 70), 1);
      top = new THREE.MeshStandardMaterial({ map: topTex, roughness: B.shine ? 0.34 : 0.85, metalness: B.shine ? 0.25 : 0.03 });
      side = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9, metalness: 0.02 });
      if (emBase) { const em = emBase.clone(); em.needsUpdate = true; em.repeat.copy(sideTex.repeat); side.emissiveMap = em; side.emissive = new THREE.Color(0xff6a1e); side.emissiveIntensity = 1.3; }
    }
    const mesh = new THREE.Mesh(geo, [side, side, top, side, side, side]);
    mesh.position.set(p.x + p.w / 2, -(p.y + p.h / 2), zc);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.platIndex = _pi;
    three.platGroup.add(mesh);
    const b = { x0: p.x, x1: p.x + p.w, y0: -(p.y + p.h), y1: -p.y, z0: zc - zd, z1: zc + zd };
    if (p.kind === 'bounce') b.bounce = true;
    if (p.kind === 'lava') b.lava = true;
    boxes.push(b);
    if (p.move) {
      movers.push({ box: b, mesh, bx: p.x + p.w / 2, by: -(p.y + p.h / 2), bz: zc, axis: p.move.axis || 'x', dist: p.move.dist || 120, speed: p.move.speed || 0.02, ph: p.move.phase || 0 });
    }
  }

  // Spikes — clusters of cones that damage on contact.
  for (const s of (ld.spikes || [])) {
    const grp = new THREE.Group();
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(7, 22, 6), mat('#c3c9d4', 0.5)); c.position.set(-9 + i * 9, 11, 0); c.castShadow = true; grp.add(c); }
    const sx = s.x + (s.w ? s.w / 2 : 12), sy = -(s.y + 24), sz = s.z || 0;
    grp.position.set(sx, sy, sz); three.hazGroup.add(grp);
    spikes3d.push({ x: sx, y: sy, z: sz, r: 24 });
  }

  makeDecorations(ld, biome);

  const skyTop = toColor(B.sky[0], '#7ec2ff'), skyBot = toColor(B.sky[1], '#d4ecff');
  if (scene.background && scene.background.dispose) scene.background.dispose();
  scene.background = makeSkyTexture(skyTop, skyBot);
  scene.fog = new THREE.Fog(toColor(B.fog, '#cfe8ff').getHex(), 1400, 5200);
  // Warm/cool the key light to the biome.
  if (three.keyLight) three.keyLight.color.set(B.light);
}

// Animate moving platforms; stash each frame's delta on the box so a piper
// standing on it gets carried along.
function updateMovers() {
  const t = (window.frameCount | 0);
  for (const m of movers) {
    const off = Math.sin(t * m.speed + m.ph) * m.dist;
    let nx = m.bx, ny = m.by, nz = m.bz;
    if (m.axis === 'x') nx += off; else if (m.axis === 'y') ny += off; else nz += off;
    const ccx = (m.box.x0 + m.box.x1) / 2, ccy = (m.box.y0 + m.box.y1) / 2, ccz = (m.box.z0 + m.box.z1) / 2;
    m.box._dx = nx - ccx; m.box._dy = ny - ccy; m.box._dz = nz - ccz;
    const hw = (m.box.x1 - m.box.x0) / 2, hh = (m.box.y1 - m.box.y0) / 2, hd = (m.box.z1 - m.box.z0) / 2;
    m.box.x0 = nx - hw; m.box.x1 = nx + hw; m.box.y0 = ny - hh; m.box.y1 = ny + hh; m.box.z0 = nz - hd; m.box.z1 = nz + hd;
    m.mesh.position.set(nx, ny, nz);
  }
}

// Scatter simple biome decorations (scenery) around the level's edges.
function makeDecorations(ld, biome) {
  const g = three.decoGroup;
  for (let i = g.children.length - 1; i >= 0; i--) { const m = g.children[i]; g.remove(m); if (m.geometry) m.geometry.dispose(); }
  const width = ld.width || 1600;
  // base ground height = top of the first non-special platform (fallback -500)
  let baseY = -500;
  const p0 = (ld.platforms || []).find(p => !p.type || p.type === 'ground');
  if (p0) baseY = -p0.y;
  const rand = (a, b) => a + Math.random() * (b - a);
  const N = 16;
  for (let i = 0; i < N; i++) {
    const x = rand(40, width - 40);
    const side = Math.random() < 0.5 ? -1 : 1;
    const z = side * rand(240, 560);
    let node = new THREE.Group();
    if (biome === 'grass') {
      const trunk = cyl(6, 7, 34, '#6b4423'); trunk.position.y = 17; node.add(trunk);
      const c1 = sph(24, '#3f9a34'); c1.position.y = 44; c1.scale.set(1, 0.9, 1); node.add(c1);
      const c2 = sph(17, '#4bb03f'); c2.position.set(10, 54, 6); node.add(c2);
    } else if (biome === 'ice') {
      const cr = new THREE.Mesh(new THREE.ConeGeometry(14, 52, 6), new THREE.MeshStandardMaterial({ color: '#bfeeff', roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.9 }));
      cr.position.y = 26; node.add(cr);
    } else if (biome === 'lava') {
      const r = sph(18, '#2c2020'); r.scale.set(1.2, 0.7, 1.1); r.position.y = 10; node.add(r);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(7, 10, 10), new THREE.MeshBasicMaterial({ color: '#ff7a1e' })); glow.position.y = 18; node.add(glow);
    } else { // sky — floating clouds
      const y = baseY + rand(60, 260);
      for (let k = 0; k < 4; k++) { const puff = sph(rand(20, 34), '#ffffff'); puff.position.set(rand(-30, 30), 0, rand(-20, 20)); puff.scale.y = 0.7; node.add(puff); }
      node.position.set(x, y, z); node.traverse(o => { if (o.isMesh) { o.castShadow = false; } }); g.add(node); continue;
    }
    node.position.set(x, baseY, z);
    node.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.add(node);
  }
}

// ── coins + enemies (3D) ────────────────────────────────────────────────────
function acquireCoin() {
  const geo = new THREE.CylinderGeometry(9, 9, 3, 18);
  const m = new THREE.MeshStandardMaterial({ color: 0xf5c518, metalness: 0.7, roughness: 0.25, emissive: 0x5a4600, emissiveIntensity: 0.45 });
  const mesh = new THREE.Mesh(geo, m); mesh.rotation.x = Math.PI / 2; scene.add(mesh);
  return { mesh };
}
function acquireNote() {
  const grp = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false }));
  grp.add(core); grp.add(glow);
  grp.renderOrder = 8; scene.add(grp);
  return { mesh: grp, core, glow };
}

// Per-variant drum tint (falls back to the classic red).
function variantColor(v) {
  const map = { 0: '#c0392b', 1: '#2a9d8f', 2: '#8e44ad', 3: '#e67e22', 4: '#c0392b', 5: '#16a085', 6: '#a93226', 12: '#7f8c8d', 13: '#9b59b6', 14: '#e74c3c', 15: '#f1c40f' };
  return map[v] != null ? map[v] : '#c0392b';
}

// A 3D "drum" enemy: barrel drum body with rims + an angry face + drumstick
// arms + feet. Replaces the old flat billboard. Tinted per variant at render.
function acquireEnemyModel() {
  const grp = new THREE.Group();
  const meshes = [];
  const addm = (m, x, y, z) => { m.position.set(x, y, z); meshes.push(m); grp.add(m); return m; };
  addm(box(7, 4, 9, '#241a12'), -6, 2, 1); addm(box(7, 4, 9, '#241a12'), 6, 2, 1);
  const body = cyl(13, 13, 20, '#c0392b', 18); addm(body, 0, 15, 0);
  addm(cyl(14, 14, 3, '#efe6cc'), 0, 25, 0); addm(cyl(14, 14, 3, '#efe6cc'), 0, 5, 0);
  addm(cyl(13.4, 13.4, 4, '#ecf0f1'), 0, 15, 0);                 // centre band
  addm(sph(2.6, '#20232b'), -4.5, 18, 12.5); addm(sph(2.6, '#20232b'), 4.5, 18, 12.5); // eyes
  addm(sph(1.1, '#ffffff'), -4, 18.6, 13.3); addm(sph(1.1, '#ffffff'), 5, 18.6, 13.3); // glints
  const brow1 = box(6, 1.6, 2, '#20232b'); brow1.rotation.z = -0.35; addm(brow1, -4.5, 21, 12.6);
  const brow2 = box(6, 1.6, 2, '#20232b'); brow2.rotation.z = 0.35; addm(brow2, 4.5, 21, 12.6);
  addm(box(9, 2.6, 2, '#20232b'), 0, 11.5, 12.6);               // grimace
  const stickL = limbCyl(1.6, 1.4, 15, '#caa66a'); stickL.position.set(-13, 24, 2); stickL.rotation.z = 0.7; grp.add(stickL); meshes.push(stickL);
  const stickR = limbCyl(1.6, 1.4, 15, '#caa66a'); stickR.position.set(13, 24, 2); stickR.rotation.z = -0.7; grp.add(stickR); meshes.push(stickR);
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; });
  scene.add(grp);
  return { group: grp, body, stickL, stickR };
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
    const cx = c.x + 8, cy = -(c.y + 8), cz = c.z || 0;   // coins may sit off the 2D plane in 3D
    const dx = pcx - cx, dy = pcy - cy, dz = pcz - cz;
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
let shootCd = 0, dashCd = 0, skirlCd = 0, hookCd = 0;
let skirlFx = 0;                  // expanding-ring visual timer
let dashTimer = 0, dashDirX = 0, dashDirZ = 0;   // Highland Charge burst
const hook = { active: false, tx: 0, ty: 0, tz: 0 };  // hook-shot zip target
const DASH_SPD = 13;

// Find the best hook-shot target: the closest platform-top that's ahead of the
// piper (in facing) or above it, within range. Returns {x,y,z} on the top, or null.
function findHookTarget() {
  const fx = Math.sin(p3.yaw), fz = Math.cos(p3.yaw);
  let best = null, bestScore = 1e9;
  for (const b of boxes) {
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, ty = b.y1;
    const dx = cx - p3.x, dz = cz - p3.z, dyTop = ty - p3.y;
    const horiz = Math.hypot(dx, dz);
    const dist = Math.hypot(dx, dyTop, dz);
    if (dist < 70 || dist > 620) continue;                 // too close / out of range
    const ahead = horiz > 1 ? (dx / horiz) * fx + (dz / horiz) * fz : 0;
    const isAbove = dyTop > 50;
    if (ahead < 0.35 && !isAbove) continue;                 // must be roughly ahead or above
    const score = dist - (isAbove ? 120 : 0) - ahead * 60;  // prefer higher / more-ahead
    if (score < bestScore) { bestScore = score; best = { x: cx, y: ty, z: cz }; }
  }
  return best;
}

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
  if (shootCd > 0) shootCd--; if (dashCd > 0) dashCd--; if (skirlCd > 0) skirlCd--; if (hookCd > 0) hookCd--;
  if (skirlFx > 0) skirlFx -= 0.05;
  const armed = warp > 0.5;

  // Q — shoot notes (hold to auto-fire). R — drone (3-note spread).
  if (armed && K['KeyR'] && shootCd <= 0) {
    shootCd = 14; fireNote(0); fireNote(0.32); fireNote(-0.32);
    try { if (window.sfx) window.sfx('shoot'); } catch (e) {}
  } else if (armed && K['KeyQ'] && shootCd <= 0) {
    shootCd = 9; fireNote(0);
    try { if (window.sfx) window.sfx('shoot'); } catch (e) {}
  }

  // E — Highland Charge: a real sustained dash burst in the facing direction
  // (with brief i-frames), not just a nudge.
  if (armed && JP['KeyE'] && dashCd <= 0 && !hook.active) {
    dashCd = 40; dashTimer = 12;
    dashDirX = Math.sin(p3.yaw); dashDirZ = Math.cos(p3.yaw);
    if (window.player) window.player.invincible = Math.max(window.player.invincible | 0, 16);
    try { if (window.sfx) window.sfx('charge'); } catch (e) {}
  }

  // F — Skirl Blast: big radial shockwave that damages AND knocks back foes.
  if (armed && JP['KeyF'] && skirlCd <= 0) {
    skirlCd = 40; skirlFx = 1;
    for (const e of (window.enemies || [])) {
      if (!e || e.dead || !e._p3) continue;
      const dx = e._p3.x - p3.x, dz = e._p3.z - p3.z, dd = Math.hypot(dx, dz);
      if (dd < 150) {
        e.hp = (typeof e.hp === 'number' ? e.hp : 1) - 3;
        const k = dd > 1 ? 9 / dd : 0;
        e._p3.vx = dx * k * 1.4; e._p3.vz = dz * k * 1.4; e._p3.vy = 7;   // knockback
        if (e.hp <= 0) { e.dead = true; killCredit(e); }
      }
    }
    try { if (window.addShake) window.addShake(6); } catch (e) {}
    try { if (window.sfx) window.sfx('skirl'); } catch (e) {}
  }

  // H — Hook Shot: zip to the nearest platform-top ahead/above.
  if (armed && JP['KeyH'] && hookCd <= 0 && !hook.active) {
    const t = findHookTarget();
    if (t) {
      hook.active = true; hook.tx = t.x; hook.ty = t.y; hook.tz = t.z; hookCd = 45;
      try { if (window.sfx) window.sfx('charge'); } catch (e) {}
    }
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
  if (p3.grounded) p3.jumps = 0;   // reset the jump count on landing (for double jump)

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

  // Hook-shot zip: fly straight to the target, ignoring gravity + collision.
  if (hook.active) {
    const dx = hook.tx - p3.x, dy = hook.ty - p3.y, dz = hook.tz - p3.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 28) {
      p3.x = hook.tx; p3.y = hook.ty; p3.z = hook.tz;
      p3.vx = p3.vy = p3.vz = 0; p3.grounded = true; p3.jumps = 0; hook.active = false;
    } else {
      const f = 0.26;
      p3.x += dx * f; p3.y += dy * f; p3.z += dz * f;
      if (Math.abs(dx) + Math.abs(dz) > 1) p3.yaw = angleLerp(p3.yaw, Math.atan2(dx, dz), 0.3);
    }
    if (player) { player.x = p3.x - PWc / 2; player.y = -p3.y - PHc; }
    return;
  }

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

  if (dashTimer > 0) {
    dashTimer--;                                  // Highland Charge: forced burst
    p3.vx = dashDirX * DASH_SPD; p3.vz = dashDirZ * DASH_SPD;
    p3.yaw = angleLerp(p3.yaw, Math.atan2(dashDirX, dashDirZ), 0.4);
  } else {
    const ctl = p3.grounded ? 1 : AIR_CTL;
    p3.vx += ((wx * MOVE) - p3.vx) * ACCEL * ctl;
    p3.vz += ((wz * MOVE) - p3.vz) * ACCEL * ctl;
    if (!moving && p3.grounded) { p3.vx *= 0.6; p3.vz *= 0.6; }
  }

  // Walk cycle.
  const speed = Math.hypot(p3.vx, p3.vz);
  if (p3.grounded && speed > 0.4) p3.stepPhase += 0.35; else p3.stepPhase *= 0.8;

  // Jump — Space, with DOUBLE jump (and the extra-jump perk on top).
  const maxJumps = 2 + ((player && player._extraJumps) ? player._extraJumps : 0);
  if (!locked && JP['Space'] && (p3.jumps || 0) < maxJumps) {
    p3.vy = JUMP_V; p3.grounded = false; p3.jumps = (p3.jumps || 0) + 1;
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
  p3.grounded = false; p3.y += p3.vy; let landed = null;
  for (const b of boxes) {
    const a = Ay();
    if (hit(a, b)) {
      if (p3.vy <= 0) {
        if (b.bounce) { p3.y = b.y1; p3.vy = BOUNCE_V; p3.jumps = 0; try { if (window.sfx) window.sfx('jump'); } catch (e) {} }
        else { p3.y = b.y1; p3.grounded = true; p3.vy = 0; landed = b; if (b.lava) { hurtPlayer(); p3.vy = 11; p3.grounded = false; } }
      } else { p3.y = b.y0 - h; p3.vy = 0; }
    }
  }
  // Carry the piper along a moving platform it's standing on.
  if (landed && (landed._dx || landed._dy || landed._dz)) { p3.x += landed._dx || 0; p3.y += landed._dy || 0; p3.z += landed._dz || 0; }

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
    p3.vx = p3.vy = p3.vz = 0; p3.grounded = false; p3.yaw = FACE_X; p3.stepPhase = 0; p3.jumps = 0;
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
    notes3d = []; shootCd = dashCd = skirlCd = hookCd = 0; skirlFx = 0; dashTimer = 0; hook.active = false;
    if (three && three.notes) three.notes.forEach(n => { n.mesh.visible = false; });
    if (three && three.hookLine) three.hookLine.visible = false;
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

    updateMovers();
    tickController();
    // Spike hazards — contact damage + knock-up.
    for (const s of spikes3d) {
      if (Math.abs(p3.x - s.x) < s.r && Math.abs(p3.z - s.z) < 22 && p3.y < s.y + 30 && p3.y + P_HEIGHT > s.y - 4) { hurtPlayer(); p3.vy = 9; break; }
    }
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

    // Keep the shadow-casting light following the piper so shadows stay crisp
    // and within the shadow frustum.
    if (three.keyLight) {
      three.keyLight.position.set(cam.tx - 300, cam.ty + 640, cam.tz + 420);
      three.keyLight.target.position.set(cam.tx, cam.ty - 40, cam.tz);
      three.keyLight.target.updateMatrixWorld();
    }

    // Piper model.
    updatePiperModel();

    // Hook-shot rope.
    if (three.hookLine) {
      if (hook.active) {
        three.hookLine.visible = true;
        const pos = three.hookLine.geometry.attributes.position;
        pos.setXYZ(0, p3.x, p3.y + 42, p3.z);
        pos.setXYZ(1, hook.tx, hook.ty, hook.tz);
        pos.needsUpdate = true;
      } else three.hookLine.visible = false;
    }

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
      sh.material.opacity = 0.16 * (1 - fall * 0.7) * warp;   // faint — real shadows do the rest
    } else sh.visible = false;

    // Goal castle — the visible end-of-level landmark + light beacon.
    if (three.goal) {
      const gr = window.goalRect;
      if (gr && isFinite(gr.x) && isFinite(gr.y)) {
        three.goal.group.visible = true;
        three.goal.group.position.set(gr.x + (gr.w || 100) / 2, -(gr.y + (gr.h || 140)), 0);
        three.goal.flag.rotation.y = Math.sin(frame * 0.14) * 0.28;
        three.goal.beacon.material.opacity = (0.1 + Math.sin(frame * 0.08) * 0.05) * warp;
      } else three.goal.group.visible = false;
    }

    // Coins.
    const coins = (window.collectibles || []).filter(c => !c.collected && (c.type === 'coin' || !c.type));
    while (three.coins.length < coins.length) three.coins.push(acquireCoin());
    for (let i = 0; i < three.coins.length; i++) {
      const cm = three.coins[i].mesh;
      if (i < coins.length) { const c = coins[i]; cm.visible = true; cm.position.set(c.x + 8, -(c.y + 8), c.z || 0); cm.rotation.z = frame * 0.12 + i; }
      else cm.visible = false;
    }

    // Enemies as 3D drum models (at their live 3D positions).
    const foes = (window.enemies || []).filter(e => e && !e.dead && !e._dead);
    while (three.enemies.length < foes.length) three.enemies.push(acquireEnemyModel());
    for (let i = 0; i < three.enemies.length; i++) {
      const em = three.enemies[i];
      if (i < foes.length) {
        const e = foes[i];
        em.group.visible = true;
        const ew = e.w || 32, eh = e.h || 32;
        const ex = e._p3 ? e._p3.x : (e.x + ew / 2);
        const feetY = e._p3 ? e._p3.y : -(e.y + eh);
        const ez = e._p3 ? e._p3.z : 0;
        em.group.scale.setScalar(Math.max(0.6, eh / 32));
        em.group.position.set(ex, feetY, ez);
        em.group.rotation.y = Math.atan2(p3.x - ex, p3.z - ez);   // face the piper
        try {
          em.body.material.color.set(variantColor(e.v | 0));
          if (e.elite) { em.body.material.emissive.set('#5a4600'); em.body.material.emissiveIntensity = 0.5; }
          else { em.body.material.emissiveIntensity = 0; }
        } catch (_) {}
        const beat = Math.sin(frame * 0.3 + i) * 0.45;            // drumming animation
        em.stickL.rotation.z = 0.7 + beat; em.stickR.rotation.z = -0.7 - beat;
      } else em.group.visible = false;
    }

    // Note projectiles.
    while (three.notes.length < notes3d.length) three.notes.push(acquireNote());
    for (let i = 0; i < three.notes.length; i++) {
      const nt = three.notes[i];
      if (i < notes3d.length) {
        const n = notes3d[i];
        nt.mesh.visible = true; nt.mesh.position.set(n.x, n.y, n.z);
        try { nt.core.material.color.set(n.col); nt.glow.material.color.set(n.col); } catch (e) {}
      } else nt.mesh.visible = false;
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

  _dbg() { return { THREE, scene, renderer, camera, three, cam, p3, mode, warp, boxes, camDragCd, hook, findHookTarget }; },

  resize(W, H) {
    if (!inited || !renderer) return;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const cv = document.getElementById('three-canvas');
    if (cv) { cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  },
};

// ═════════════════════════════════════════════════════════════════════════
//  LIVE 3D LEVEL EDITOR
//  A self-contained in-scene editor that reuses the play renderer's scene,
//  textures, biome system and goal castle. Orbit the camera, aim a build
//  cursor at a platform top (or the build plane), and click to place / select
//  / erase level elements. Drives its own frames via ThreeMode.editor.frame().
//  UI + storage live in src/builder3d.js (window.Builder3D); this owns all the
//  THREE math (raycast, cursor, camera, marker meshes).
// ═════════════════════════════════════════════════════════════════════════
const ED_PW = 32, ED_PH = 50;                 // player box (for start marker / spawn)
const ed = {
  active: false, level: null, tool: 'platform',
  plat: { w: 220, h: 30, d: 220 }, enemyV: 0, kind: 'normal',
  buildY: 470, grid: 20,
  cam: { yaw: FACE_X, el: 0.5, dist: 640, fx: 800, fy: -300, fz: 0 },
  sel: null,                                   // { kind:'platform'|'coin'|..., index }
  cursor: new THREE.Vector3(), cursorOn: false,
  ndc: new THREE.Vector2(), ray: new THREE.Raycaster(),
  plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  cursorMesh: null, selBox: null, markGroup: null, grid3d: null, planeMesh: null,
  dirty: true, drag: null, onChange: null,
};

function edEnsure() {
  if (ed.cursorMesh) return;
  // Build cursor — a bright wire box that previews the platform footprint.
  const cg = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(cg);
  ed.cursorMesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8ef0ff }));
  ed.cursorMesh.renderOrder = 20; scene.add(ed.cursorMesh);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), new THREE.MeshBasicMaterial({ color: 0x8ef0ff }));
  ed.cursorMesh.add(dot); ed.cursorDot = dot;
  // Selection highlight box.
  ed.selBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
    new THREE.LineBasicMaterial({ color: 0xffe27a }));
  ed.selBox.visible = false; ed.selBox.renderOrder = 21; scene.add(ed.selBox);
  // Marker group (coins / enemies / spikes / start / goal).
  ed.markGroup = new THREE.Group(); scene.add(ed.markGroup);
  // A grid on the build plane for spatial reference.
  ed.grid3d = new THREE.GridHelper(4000, 100, 0x9fd0ff, 0x3a4a66);
  ed.grid3d.material.transparent = true; ed.grid3d.material.opacity = 0.35;
  scene.add(ed.grid3d);
}

function edTag(o, kind, index) { o.userData.edKind = kind; o.userData.edIndex = index; }
function edFindTagged(o) { let n = o; while (n) { if (n.userData && n.userData.edKind) return n; n = n.parent; } return null; }
function edSnap(v) { return Math.round(v / ed.grid) * ed.grid; }

// Screen (client) coords → the point being aimed at. Prefers the closest
// platform-top surface; falls back to the horizontal build plane.
function edAim(clientX, clientY) {
  const cv = renderer.domElement, r = cv.getBoundingClientRect();
  ed.ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
  ed.ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
  ed.ray.setFromCamera(ed.ndc, camera);
  const platHits = ed.ray.intersectObjects(three.platGroup.children, false);
  const markHits = ed.ray.intersectObjects(ed.markGroup.children, true);
  ed.plane.constant = -(-ed.buildY);      // plane at threeY = -buildY
  const planePt = new THREE.Vector3();
  const hitPlane = ed.ray.ray.intersectPlane(ed.plane, planePt);
  // Nearest hit decides the aim point + what's under the cursor.
  let best = null, bestDist = Infinity, platIndex = -1, markObj = null;
  if (platHits.length && platHits[0].distance < bestDist) { best = platHits[0].point.clone(); bestDist = platHits[0].distance; platIndex = platHits[0].object.userData.platIndex; markObj = null; }
  if (markHits.length && markHits[0].distance < bestDist) { best = markHits[0].point.clone(); bestDist = markHits[0].distance; markObj = edFindTagged(markHits[0].object); platIndex = -1; }
  if (hitPlane && (!best || planePt.distanceTo(camera.position) < bestDist * 0.999)) {
    // Only fall to the plane when nothing solid is closer.
    if (!best) { best = planePt.clone(); platIndex = -1; markObj = null; }
  }
  if (!best) return null;
  best.x = edSnap(best.x); best.z = edSnap(best.z);
  return { pt: best, platIndex, markObj };
}

// Convert an aim point into a new level element for the active tool.
function edPlace(aim) {
  const L = ed.level, pt = aim.pt;
  const wx = pt.x, wz = pt.z, topWorldY = -pt.y;   // world-Y (screen-down) of the surface
  const T = ed.tool;
  edSnapshot();
  if (T === 'platform' || T === 'bounce' || T === 'lava') {
    const P = ed.plat;
    const p = { x: Math.round(wx - P.w / 2), y: Math.round(topWorldY), w: P.w, h: P.h, zc: Math.round(wz), zd: Math.round(P.d / 2) };
    if (T === 'bounce') p.kind = 'bounce'; else if (T === 'lava') p.kind = 'lava';
    (L.platforms || (L.platforms = [])).push(p);
    ed.sel = { kind: 'platform', index: L.platforms.length - 1 };
  } else if (T === 'coin') {
    (L.coins || (L.coins = [])).push({ x: Math.round(wx - 8), y: Math.round(-(pt.y + 24) - 8), z: Math.round(wz) });
  } else if (T === 'enemy') {
    (L.enemies || (L.enemies = [])).push({ x: Math.round(wx - 16), y: Math.round(topWorldY - 32), v: ed.enemyV | 0, hp: 3 });
  } else if (T === 'spike') {
    (L.spikes || (L.spikes = [])).push({ x: Math.round(wx - 12), y: Math.round(topWorldY - 24), z: Math.round(wz) });
  } else if (T === 'start') {
    L.startX = Math.round(wx - 16); L.startY = Math.round(topWorldY - ED_PH);
  } else if (T === 'goal') {
    L.goalX = Math.round(wx - 50); L.goalY = Math.round(topWorldY - 140);
  }
  edAutosize();
  ed.dirty = true;
  if (ed.onChange) ed.onChange();
}

// Erase the element under the cursor (platform or marker).
function edErase(aim) {
  const L = ed.level;
  edSnapshot();
  if (aim.platIndex >= 0 && L.platforms) { L.platforms.splice(aim.platIndex, 1); if (ed.sel && ed.sel.kind === 'platform') ed.sel = null; }
  else if (aim.markObj) {
    const k = aim.markObj.userData.edKind, i = aim.markObj.userData.edIndex;
    if (k === 'coin' && L.coins) L.coins.splice(i, 1);
    else if (k === 'enemy' && L.enemies) L.enemies.splice(i, 1);
    else if (k === 'spike' && L.spikes) L.spikes.splice(i, 1);
  }
  ed.sel = null; ed.dirty = true;
  if (ed.onChange) ed.onChange();
}

// Grow level.width so it always covers the furthest placement + margin.
function edAutosize() {
  const L = ed.level; let mx = 600;
  for (const p of (L.platforms || [])) mx = Math.max(mx, p.x + p.w);
  if (L.goalX != null && L.goalX > -500) mx = Math.max(mx, L.goalX + 200);
  L.width = Math.max(1200, Math.ceil((mx + 300) / 100) * 100);
}

// Undo stack (level snapshots).
ed.undo = [];
function edSnapshot() { try { ed.undo.push(JSON.stringify(ed.level)); if (ed.undo.length > 40) ed.undo.shift(); } catch (e) {} }
function edUndo() { if (!ed.undo.length) return; try { const s = ed.undo.pop(); ed.level = JSON.parse(s); ed.sel = null; ed.dirty = true; if (ed.onChange) ed.onChange(); } catch (e) {} }

// Rebuild the coin / enemy / spike / start / goal marker meshes from the level.
function edBuildMarkers() {
  const g = ed.markGroup;
  for (let i = g.children.length - 1; i >= 0; i--) { const m = g.children[i]; g.remove(m); m.traverse && m.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  const L = ed.level;
  (L.coins || []).forEach((c, i) => { const m = cyl(9, 9, 3, '#f5c518'); m.rotation.x = Math.PI / 2; m.position.set(c.x + 8, -(c.y + 8), c.z || 0); edTag(m, 'coin', i); g.add(m); });
  (L.enemies || []).forEach((e, i) => {
    const grp = new THREE.Group();
    const b = cyl(13, 13, 20, variantColor(e.v | 0)); b.position.y = 15; grp.add(b);
    grp.add(cyl(14, 14, 3, '#efe6cc')); grp.children[1].position.y = 25;
    grp.position.set(e.x + (e.w || 32) / 2, -(e.y + (e.h || 32)), 0); edTag(grp, 'enemy', i); g.add(grp);
  });
  (L.spikes || []).forEach((s, i) => {
    const grp = new THREE.Group();
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(7, 22, 6), mat('#c3c9d4', 0.5)); c.position.set(-9 + k * 9, 11, 0); grp.add(c); }
    grp.position.set(s.x + (s.w ? s.w / 2 : 12), -(s.y + 24), s.z || 0); edTag(grp, 'spike', i); g.add(grp);
  });
  if (L.startX != null) { const m = new THREE.Mesh(new THREE.ConeGeometry(11, 28, 8), mat('#4ad06a')); m.position.set(L.startX + 16, -(L.startY + ED_PH) + 14, 0); edTag(m, 'start', 0); g.add(m); }
  if (L.goalX != null && L.goalX > -500) {
    const grp = new THREE.Group();
    const post = box(30, 120, 30, '#cfc9b2'); post.position.y = 60; grp.add(post);
    const flag = box(34, 20, 2, '#c0202c'); flag.position.set(20, 108, 0); grp.add(flag);
    grp.position.set(L.goalX + 50, -(L.goalY + 140), 0); edTag(grp, 'goal', 0); g.add(grp);
  }
}

function edPositionCamera() {
  const c = ed.cam, h = c.dist * Math.cos(c.el);
  camera.position.set(c.fx - Math.sin(c.yaw) * h, c.fy + c.dist * Math.sin(c.el), c.fz - Math.cos(c.yaw) * h);
  camera.lookAt(c.fx, c.fy, c.fz);
}

// Pointer + wheel handlers (attached once, gated on ed.active).
function edAttachInput() {
  if (edAttachInput._done) return; edAttachInput._done = true;
  const cv = renderer.domElement;
  cv.addEventListener('contextmenu', (e) => { if (ed.active) e.preventDefault(); });
  cv.addEventListener('pointerdown', (e) => {
    if (!ed.active) return;
    if (e.button === 2 || e.button === 1 || e.shiftKey) { ed.drag = { x: e.clientX, y: e.clientY, orbit: true }; return; }
    const aim = edAim(e.clientX, e.clientY); if (!aim) return;
    if (ed.tool === 'select') {
      if (aim.platIndex >= 0) { ed.sel = { kind: 'platform', index: aim.platIndex }; ed.drag = { x: e.clientX, y: e.clientY, move: true }; }
      else if (aim.markObj) { ed.sel = { kind: aim.markObj.userData.edKind, index: aim.markObj.userData.edIndex }; ed.drag = { x: e.clientX, y: e.clientY, move: true }; }
      else ed.sel = null;
    } else if (ed.tool === 'erase') { edErase(aim); }
    else { edPlace(aim); }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!ed.active) return;
    if (ed.drag && ed.drag.orbit) {
      const dx = e.clientX - ed.drag.x, dy = e.clientY - ed.drag.y; ed.drag.x = e.clientX; ed.drag.y = e.clientY;
      ed.cam.yaw -= dx * 0.006; ed.cam.el = Math.max(0.08, Math.min(1.35, ed.cam.el - dy * 0.005)); return;
    }
    const aim = edAim(e.clientX, e.clientY);
    if (aim) { ed.cursor.copy(aim.pt); ed.cursorOn = true; } else ed.cursorOn = false;
    if (ed.drag && ed.drag.move && ed.sel && aim) edMoveSel(aim);
  });
  window.addEventListener('pointerup', () => { if (ed.drag && ed.drag.move && ed.onChange) ed.onChange(); ed.drag = null; });
  cv.addEventListener('wheel', (e) => { if (!ed.active) return; e.preventDefault(); ed.cam.dist = Math.max(180, Math.min(1600, ed.cam.dist + e.deltaY * 0.4)); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (!ed.active) return;
    const k = e.key.toLowerCase();
    const step = 40;
    const fwd = { x: Math.sin(ed.cam.yaw), z: Math.cos(ed.cam.yaw) }, rt = { x: Math.cos(ed.cam.yaw), z: -Math.sin(ed.cam.yaw) };
    if (k === 'w') { ed.cam.fx += fwd.x * step; ed.cam.fz += fwd.z * step; }
    else if (k === 's') { ed.cam.fx -= fwd.x * step; ed.cam.fz -= fwd.z * step; }
    else if (k === 'd') { ed.cam.fx += rt.x * step; ed.cam.fz += rt.z * step; }
    else if (k === 'a') { ed.cam.fx -= rt.x * step; ed.cam.fz -= rt.z * step; }
    else if (k === 'r') { ed.buildY -= ed.grid; }        // raise build plane (screen-down: up = smaller y)
    else if (k === 'f') { ed.buildY += ed.grid; }        // lower build plane
    else if (k === 'delete' || k === 'backspace') { if (ed.sel) edDeleteSel(); }
    else if (k === 'z' && (e.ctrlKey || e.metaKey)) { edUndo(); }
    else return;
    e.preventDefault();
  });
}

// Move the selected element to follow the cursor (x/z; keeps height).
function edMoveSel(aim) {
  const L = ed.level, s = ed.sel, wx = aim.pt.x, wz = aim.pt.z;
  if (s.kind === 'platform' && L.platforms[s.index]) { const p = L.platforms[s.index]; p.x = Math.round(wx - p.w / 2); p.zc = Math.round(wz); }
  else if (s.kind === 'coin' && L.coins[s.index]) { const c = L.coins[s.index]; c.x = Math.round(wx - 8); c.z = Math.round(wz); }
  else if (s.kind === 'enemy' && L.enemies[s.index]) { const en = L.enemies[s.index]; en.x = Math.round(wx - 16); }
  else if (s.kind === 'spike' && L.spikes[s.index]) { const sp = L.spikes[s.index]; sp.x = Math.round(wx - 12); sp.z = Math.round(wz); }
  else if (s.kind === 'start') { L.startX = Math.round(wx - 16); }
  else if (s.kind === 'goal') { L.goalX = Math.round(wx - 50); }
  ed.dirty = true; edAutosize();
}
function edDeleteSel() {
  const L = ed.level, s = ed.sel; if (!s) return; edSnapshot();
  if (s.kind === 'platform' && L.platforms) L.platforms.splice(s.index, 1);
  else if (s.kind === 'coin' && L.coins) L.coins.splice(s.index, 1);
  else if (s.kind === 'enemy' && L.enemies) L.enemies.splice(s.index, 1);
  else if (s.kind === 'spike' && L.spikes) L.spikes.splice(s.index, 1);
  else if (s.kind === 'start') { /* keep a start; ignore */ }
  else if (s.kind === 'goal') { L.goalX = -1000; }
  ed.sel = null; ed.dirty = true; if (ed.onChange) ed.onChange();
}

// Update the selection-highlight box from the current selection.
function edUpdateSelBox() {
  const L = ed.level, s = ed.sel, b = ed.selBox;
  if (!s) { b.visible = false; return; }
  let cx, cy, cz, sx, sy, sz;
  if (s.kind === 'platform' && L.platforms[s.index]) { const p = L.platforms[s.index], zd = p.zd != null ? p.zd : HALF_D; cx = p.x + p.w / 2; cy = -(p.y + p.h / 2); cz = p.zc || 0; sx = p.w + 6; sy = p.h + 6; sz = zd * 2 + 6; }
  else if (s.kind === 'coin' && L.coins[s.index]) { const c = L.coins[s.index]; cx = c.x + 8; cy = -(c.y + 8); cz = c.z || 0; sx = sy = sz = 26; }
  else if (s.kind === 'enemy' && L.enemies[s.index]) { const e = L.enemies[s.index]; cx = e.x + 16; cy = -(e.y + 16); cz = 0; sx = 34; sy = 40; sz = 34; }
  else if (s.kind === 'spike' && L.spikes[s.index]) { const sp = L.spikes[s.index]; cx = sp.x + 12; cy = -(sp.y + 12); cz = sp.z || 0; sx = 40; sy = 30; sz = 30; }
  else if (s.kind === 'start') { cx = (L.startX || 0) + 16; cy = -((L.startY || 0) + ED_PH / 2); cz = 0; sx = 34; sy = ED_PH; sz = 34; }
  else if (s.kind === 'goal' && L.goalX > -500) { cx = L.goalX + 50; cy = -(L.goalY + 70); cz = 0; sx = 40; sy = 140; sz = 40; }
  else { b.visible = false; return; }
  b.visible = true; b.position.set(cx, cy, cz); b.scale.set(sx, sy, sz);
}

// The editor's public surface (called from src/builder3d.js).
ThreeMode.editor = {
  isOpen() { return ed.active; },
  open(level, opts) {
    if (!ensureInit(960, 540)) return false;
    edEnsure(); edAttachInput();
    ed.active = true; ed.level = level; ed.sel = null; ed.dirty = true; ed.undo = [];
    ed.onChange = (opts && opts.onChange) || null;
    // Aim the camera at the level's start.
    ed.cam.fx = (level.startX || 200) + 200; ed.cam.fy = -((level.startY || 380)) - 40; ed.cam.fz = 0;
    ed.buildY = (level.startY != null ? level.startY + ED_PH : 470);
    levelSig = '__editor__';
    const cv = document.getElementById('three-canvas');
    if (cv) { cv.style.display = ''; cv.style.pointerEvents = 'auto'; cv.style.zIndex = '9998'; cv.style.opacity = '1'; }
    const gc = document.getElementById('gameCanvas'); if (gc) gc.style.opacity = '0';
    return true;
  },
  close() {
    ed.active = false;
    if (three && three.player) three.player.group.visible = true;   // play renderer never re-enables it
    if (ed.cursorMesh) ed.cursorMesh.visible = false;
    if (ed.selBox) ed.selBox.visible = false;
    const cv = document.getElementById('three-canvas');
    if (cv) { cv.style.display = 'none'; cv.style.pointerEvents = 'none'; cv.style.zIndex = '2'; }
    const gc = document.getElementById('gameCanvas'); if (gc) gc.style.opacity = '';
    levelSig = '';   // force the play renderer to rebuild fresh next time
  },
  setTool(t) { ed.tool = t; },
  getTool() { return ed.tool; },
  setBiome(b) { if (ed.level) { ed.level.biome = b; ed.dirty = true; } },
  setPlatSize(w, h, d) { if (w) ed.plat.w = w; if (h) ed.plat.h = h; if (d) ed.plat.d = d; },
  getPlatSize() { return { ...ed.plat }; },
  setEnemyVariant(v) { ed.enemyV = v | 0; },
  getBuildY() { return ed.buildY; },
  setBuildY(y) { ed.buildY = y; },
  deleteSelected() { edDeleteSel(); },
  undo() { edUndo(); },
  getSelection() { return ed.sel ? { ...ed.sel } : null; },
  getLevel() { return ed.level; },
  markDirty() { ed.dirty = true; },
  counts() { const L = ed.level || {}; return { platforms: (L.platforms || []).length, coins: (L.coins || []).length, enemies: (L.enemies || []).length, spikes: (L.spikes || []).length, width: L.width || 0 }; },

  // One editor frame: rebuild changed geometry, place cursor + camera, render.
  frame(W, H) {
    if (!ed.active || !inited) return;
    if (W && H) {
      renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
      const cv = renderer.domElement; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    }
    if (ed.dirty) { buildLevel(ed.level); edBuildMarkers(); ed.dirty = false; }

    // Cursor preview (platform footprint for build tools; a dot otherwise).
    const cm = ed.cursorMesh;
    if (ed.cursorOn && ed.tool !== 'select') {
      cm.visible = true;
      if (ed.tool === 'platform' || ed.tool === 'bounce' || ed.tool === 'lava') {
        cm.position.set(ed.cursor.x, ed.cursor.y - ed.plat.h / 2, ed.cursor.z);
        cm.scale.set(ed.plat.w, ed.plat.h, ed.plat.d);
        ed.cursorDot.scale.setScalar(1 / Math.max(ed.plat.w, 1) * 40);
      } else {
        cm.position.copy(ed.cursor); cm.scale.set(30, 30, 30); ed.cursorDot.scale.setScalar(0.6);
      }
    } else cm.visible = false;

    edUpdateSelBox();
    if (ed.grid3d) { ed.grid3d.position.set(ed.cam.fx, -ed.buildY, ed.cam.fz); }
    // Keep the shadow light near the working area.
    if (three.keyLight) { three.keyLight.position.set(ed.cam.fx - 300, -ed.buildY + 640, ed.cam.fz + 420); three.keyLight.target.position.set(ed.cam.fx, -ed.buildY, ed.cam.fz); three.keyLight.target.updateMatrixWorld(); }
    // Hide play-only dynamic objects.
    if (three.player) three.player.group.visible = false;
    if (three.shadow) three.shadow.visible = false;
    if (three.goal) three.goal.group.visible = false;
    three.coins.forEach(c => c.mesh.visible = false);
    three.enemies.forEach(e => e.group.visible = false);
    three.platGroup.scale.z = 1;

    edPositionCamera();
    renderer.render(scene, camera);
  },
};

window.ThreeMode = ThreeMode;
export default ThreeMode;
