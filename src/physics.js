// src/physics.js
// ──────────────────────────────────────────────────────────────────
// Player movement + collision. Hot path — runs every frame.
//
//   - resolveVsPlats(obj, w, h, plats): box-vs-platforms collision
//     used for player, ally, and a few other moving entities.
//   - getActivePlatforms(ld, includeOneway): filters a level's
//     platform array down to the ones currently solid (switch state,
//     timed phase, fall-away alive, etc.).
//   - updatePlayer(): per-frame player update — input → forces →
//     collision resolution → state-machine transitions.
//
// All engine state reached through bare-name globals: player, camera,
// frameCount, enemies, projectiles, weatherState, sfx, getLevelData,
// powerups, particles, qblocks/cblocks/trophies/spiritEmbers/
// marsBarPieces (level data), and the helpers from earlier modules.
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  function resolveVsPlats(obj, w, h, plats) {
    obj.onGround = false;
    const toCheck = plats || getPlatsNear(obj.x, obj.y, w, h);
    // Ground-pound passes through breakables (crumble/breakshot) — the
    // smash sweep in updateSpecialPlats records the destruction.
    const pounding = obj === player && !!obj._groundPound;
    for (let i = 0, len = toCheck.length; i < len; i++) {
      const p = toCheck[i];
      // Skip platforms whose collision state is currently non-solid. The
      // spatial grid contains every platform regardless of type, so this
      // filter is what keeps the player from standing on inactive
      // soundwaves / collapsed crumble blocks / off-state switch tiles.
      if (p.type) {
        if (p.type === 'oneway') continue; // handled by resolveVsOneway
        if (p.type === 'soundwave') {
          const st = specialPlatState[p._id];
          if (!st || st.active <= 0) continue;
        } else if (p.type === 'crumble') {
          if (pounding) continue;
          const st = specialPlatState[p._id];
          if (st && (st.respawn > 0 || st.crumble > 20)) continue;
        } else if (p.type === 'breakshot') {
          if (pounding) continue;
          const st = specialPlatState[p._id];
          if (st && st.broken) continue;
        } else if (p.type === 'switchA') {
          if (switchGroupState[p.switchGroup || 'A']) continue;
        } else if (p.type === 'switchB') {
          if (!switchGroupState[p.switchGroup || 'A']) continue;
        } else if (p.type === 'water' || p.type === 'windtunnel' || p.type === 'grapplehook') {
          // Non-solid field-effect blocks — never resolve as collision.
          // Water is handled by the swim-physics block in updatePlayer;
          // wind tunnel by the upward-push block; grapple hook by the
          // grapple projectile attach logic.
          continue;
        } else if (p.type === 'timed') {
          // Phase-cycling platform: solid for first ~55% of period,
          // intangible for the rest.
          const st = specialPlatState[p._id];
          const period = p.period || 180;
          if (!st || st.phase >= Math.floor(period * 0.55)) continue;
        } else if (p.type === 'fallaway') {
          const st = specialPlatState[p._id];
          if (st && st.gone) continue;
        } else if (p.type === 'rotating') {
          // Rotating platforms move their visual position to (_cx,_cy)
          // each tick. The collision check needs the *current* pos.
          if (p._cx != null && p._cy != null) {
            const _rw = p.w || 60, _rh = p.h || 14;
            if (!overlap(obj.x, obj.y, w, h, p._cx, p._cy, _rw, _rh)) continue;
            const oL = (obj.x + w) - p._cx, oR = (p._cx + _rw) - obj.x;
            const oT = (obj.y + h) - p._cy, oB = (p._cy + _rh) - obj.y;
            const mH = Math.min(oT, oB), mV = Math.min(oL, oR);
            if (mH < mV) {
              if (oT < oB) { obj.y = p._cy - h; if (obj.vy >= 0) { obj.vy = 0; obj.onGround = true; } }
              else { obj.y = p._cy + _rh; if (obj.vy < 0) obj.vy = 0; }
            } else {
              if (oL < oR) { obj.x = p._cx - w; obj.vx = 0; }
              else { obj.x = p._cx + _rw; obj.vx = 0; }
            }
            continue; // already resolved against the shifted pos
          }
        }
      }
      if (!overlap(obj.x, obj.y, w, h, p.x, p.y, p.w, p.h)) continue;
      const oL = (obj.x + w) - p.x, oR = (p.x + p.w) - obj.x;
      const oT = (obj.y + h) - p.y, oB = (p.y + p.h) - obj.y;
      const mH = Math.min(oT, oB), mV = Math.min(oL, oR);
      if (mH < mV) {
        if (oT < oB) { obj.y = p.y - h; if (obj.vy >= 0) { obj.vy = 0; obj.onGround = true; } }
        else { obj.y = p.y + p.h; if (obj.vy < 0) obj.vy = 0; }
      } else {
        if (oL < oR) { obj.x = p.x - w; obj.vx = 0; }
        else { obj.x = p.x + p.w; obj.vx = 0; }
      }
    }
  }

  function getActivePlatforms(ld, includeOneway = false) {
    if (includeOneway && _activePlatsCacheOneway) return _activePlatsCacheOneway;
    if (!includeOneway && _activePlatsCache) return _activePlatsCache;

    const result = [];
    const plats = ld.platforms || [];
    for (let i = 0, len = plats.length; i < len; i++) {
      const p = plats[i];
      if (p.type === 'oneway') {
        if (!includeOneway) continue;
      } else if (p.type === 'soundwave') {
        const st = specialPlatState[p._id];
        if (!st || st.active <= 0) continue;
      } else if (p.type === 'crumble') {
        const st = specialPlatState[p._id];
        if (st && (st.respawn > 0 || st.crumble > 20)) continue;
      } else if (p.type === 'breakshot') {
        const st = specialPlatState[p._id];
        if (st && st.broken) continue;
      } else if (p.type === 'switchA') {
        if (switchGroupState[p.switchGroup || 'A']) continue;
      } else if (p.type === 'switchB') {
        if (!switchGroupState[p.switchGroup || 'A']) continue;
      } else if (p.type === 'timed') {
        const st = specialPlatState[p._id];
        const period = p.period || 180;
        // Solid during the first ~55% of the period
        if (!st || st.phase >= Math.floor(period * 0.55)) continue;
      } else if (p.type === 'fallaway') {
        const st = specialPlatState[p._id];
        if (st && st.gone) continue;
      } else if (p.type === 'water' || p.type === 'windtunnel' || p.type === 'grapplehook') {
        // Non-solid types — handled separately as field effects.
        continue;
      }
      // Rotating platforms render at (_cx, _cy) so collision needs the
      // shifted position. Push a *shadow* object with the current pos.
      if (p.type === 'rotating' && p._cx != null && p._cy != null) {
        result.push({ ...p, x: p._cx, y: p._cy });
        continue;
      }
      result.push(p);
    }

    if (includeOneway) _activePlatsCacheOneway = result;
    else _activePlatsCache = result;

    return result;
  }

  function updatePlayer() {
    const p = player;
    const ld = getLevelData();

    if (kPress('pause')) { UI.pause(); return; }
    if (kPress('mute')) toggleMute();

    const onIce = p.standingOn === 'ice';
    const spdMul = (p.drumSlow || 0) > 0 ? DRUM_SLOW_MUL : 1;
    // Sprint: while the run key is held (and the player isn't
    // crouched / sliding / muted / silenced), walking speed is
    // boosted 1.55×. Doesn't kick in while crouching since that's
    // the slide path. Stored on the player so the sprite + dust
    // FX downstream can react.
    const _sprintHeld = kHeld('run') && !p.crouched && !p._sliding && !p._groundPound;
    p._sprinting = _sprintHeld && p.onGround && Math.abs(p.vx) > 0.1;
    const runMul = _sprintHeld ? 1.55 : 1;
    const runCap = SPEED * spdMul * runMul;
    // Sprint dust — controlled trail spawned every 3 frames. Each
    // puff inherits a fraction of the player's reverse velocity so
    // it drifts toward the trailing edge of the runner instead of
    // scattering randomly (spawnPart picks a random direction, which
    // was leaving particles all over the screen). With this they
    // stay close to the character's feet like a real dust kick-up.
    if (p._sprinting && (frameCount % 3 === 0)) {
      const trailFootX = p.x + (p.facingRight ? 4 : PW - 8);
      const trailFootY = p.y + PH - 4;
      for (let _di = 0; _di < 2; _di++) {
        const pp = particlePool[nextParticleIdx];
        if (pp) {
          pp.active = true;
          pp.x = trailFootX + (Math.random() - 0.5) * 4;
          pp.y = trailFootY + (Math.random() - 0.5) * 2;
          // Drift behind the player (~40% of their speed in reverse)
          // plus a tiny lift so it puffs up. Anchors the cloud to the
          // runner's heels.
          pp.vx = -p.vx * 0.40 + (Math.random() - 0.5) * 0.5;
          pp.vy = -0.55 - Math.random() * 0.45;
          pp.life = 14; pp.maxLife = 14;
          pp.col = '#cbb98a';
          pp.sz = 1 + Math.random() * 1.4;
          pp.grav = 0.08;
          pp.type = 'circle';
          nextParticleIdx = (nextParticleIdx + 1) % PARTICLE_POOL_SIZE;
        }
      }
    }
    // Slide state from the previous frame: while sliding, the run
    // input is bypassed so the slide friction (applied later, in the
    // crouch block) can actually decay vx instead of getting
    // overwritten to ±runCap every frame.
    if (p._sliding) {
      // Allow a tiny steering nudge so the player can still aim into
      // gaps, but don't reset vx to runCap.
      if (kHeld('left')) p.vx -= 0.06;
      else if (kHeld('right')) p.vx += 0.06;
    } else if (kHeld('left')) {
      p.vx = onIce ? Math.max(p.vx - 0.4, -runCap) : -runCap;
      p.facingRight = false;
    } else if (kHeld('right')) {
      p.vx = onIce ? Math.min(p.vx + 0.4, runCap) : runCap;
      p.facingRight = true;
    } else {
      p.vx *= (onIce ? 0.97 : 0.72);
    }

    if (p.chargeOn) p.vx = p.facingRight ? 10 : -10;

    // ── Crouch + Ground Pound ───────────────────────────────────────────
    // Down arrow has two meanings:
    //   on ground  → crouch (slower stance, low-trajectory shots)
    //   in air     → ground pound (meteor dive, smashes breakables)
    // The pound state persists until the player lands on solid terrain,
    // bounces off a pad (handled in the bounce block above), or cancels
    // with a charge dash. While pounding, normal gravity is overridden
    // with a strong downward velocity and the player can't aim/jump.
    // While riding Mackenzie, the rider is locked to her back — no
    // crouching, no sliding, no ground-pound. Force the crouch input
    // to read as released so the entire crouch / slide / pound chain
    // below short-circuits cleanly.
    const _crouchHeld = kHeld('crouch') && !p._riding;
    const _wasCrouched = !!p._crouchedLast;
    p.crouched = !!p.onGround && _crouchHeld;
    // ── Slide: crouch + run = slide ────────────────────────────────
    // Entering crouch while running fast gives you a sliding state
    // that preserves momentum and only loses speed to friction. Slide
    // ends when velocity drops below 1, the player jumps, or releases
    // crouch on a flat surface.
    const _wasSliding = !!p._sliding;
    if (!p.crouched) {
      p._sliding = false;
    } else if (!_wasCrouched && Math.abs(p.vx) > 3.5) {
      // Just entered crouch with significant horizontal speed — slide.
      p._sliding = true;
      // Small forward boost so the slide commits and feels punchy.
      p.vx *= 1.15;
    }
    if (p._sliding) {
      // Reduce friction so the slide decays slowly instead of stopping
      // the instant the player stops pressing forward.
      const onIce2 = p.standingOn === 'ice';
      p.vx *= (onIce2 ? 0.995 : 0.97);
      if (Math.abs(p.vx) < 1.0) p._sliding = false;
    }

    // Crouch hitbox: standing dimensions flipped 90° → 50 wide × 32 tall.
    // Same body, just rotated onto its side. Stand-up is blocked if
    // anything is in the way above (sticks them in the crouch until they
    // walk clear), which keeps the player from teleporting their head
    // into a ceiling.
    const CROUCH_PW = 50, CROUCH_PH = 32;
    if (p.crouched && !_wasCrouched) {
      // Snap feet to stay planted: top shifts down by (PH - CROUCH_PH).
      p.y += (PH - CROUCH_PH);
    } else if (!p.crouched && _wasCrouched) {
      // Trying to stand: shift up first, then test for ceiling clearance.
      // If blocked, snap back down and force-crouch this frame.
      const newY = p.y - (PH - CROUCH_PH);
      let blocked = false;
      const cands = getPlatsNear(p.x, newY, PW, PH - CROUCH_PH + 2);
      for (let _ci = 0; _ci < cands.length; _ci++) {
        const pl = cands[_ci];
        if (pl.type === 'oneway' || pl.type === 'soundwave' || pl.type === 'switchA' || pl.type === 'switchB') continue;
        if (pl.type === 'crumble') {
          const st = specialPlatState[pl._id];
          if (st && (st.respawn > 0 || st.crumble > 20)) continue;
        } else if (pl.type === 'breakshot') {
          const st = specialPlatState[pl._id];
          if (st && st.broken) continue;
        }
        if (overlap(p.x, newY, PW, PH - CROUCH_PH + 1, pl.x, pl.y, pl.w, pl.h)) { blocked = true; break; }
      }
      if (blocked) {
        p.crouched = true; // stuck under a ceiling — stay crouched
      } else {
        p.y = newY;
      }
    }
    p._crouchedLast = p.crouched;
    const cPW = p.crouched ? CROUCH_PW : PW;
    const cPH = p.crouched ? CROUCH_PH : PH;
    // Trigger ground pound: in air, pressing crouch (edge or held), not
    // already pounding, and we have downward room. kPress catches the
    // fresh edge so jumping then immediately holding down doesn't fail
    // to fire. Disabled while riding Mackenzie — the rider sits firmly
    // on her back and can't dive-bomb without dismounting first.
    if (!p.onGround && _crouchHeld && !p._groundPound && !p._riding) {
      p._groundPound = true;
      p._groundPoundFx = 0;
      p.vx = 0;          // commits to a vertical dive
      p.vy = 14;         // initial downward kick
      p.invincible = Math.max(p.invincible || 0, 6); // brief i-frames so contact-damage doesn't undo it
      sfx('charge');
      spawnRing(p.x + PW / 2, p.y + PH / 2, '#ffaa22', 12, 22, 2.5);
      floatText('METEOR!', p.x - camera.x - 24, p.y - camera.y - 10, '#ffaa22');
    }
    // Charge dash cancels the pound (player input override).
    if (p._groundPound && kPress('charge') && p.cooldowns.charge <= 0) {
      p._groundPound = false;
      p._groundPoundFx = 0;
      // The actual charge ability fires below via its own kPress check.
    }
    // Landing cancels the pound (and emits a small impact).
    if (p._groundPound && p.onGround) {
      p._groundPound = false;
      spawnRing(p.x + PW / 2, p.y + PH - 4, '#ffaa22', 10, 26, 2.5);
      spawnPart(p.x + PW / 2, p.y + PH - 2, '#ffaa22', 14, 3.5);
      screenShake = Math.max(screenShake, 6);
      sfx('bomb_explode');
      floatText('SLAM!', p.x - camera.x - 18, p.y - camera.y - 16, '#ffaa22');
    }
    if (p._groundPound) {
      // Lock to dive trajectory regardless of left/right input.
      p.vy = Math.max(p.vy, 18);
      p.vx = 0;
      p._groundPoundFx = (p._groundPoundFx || 0) + 1;
      // Emit a meteor trail every 2 frames.
      if (p._groundPoundFx % 2 === 0) {
        spawnPart(p.x + PW / 2, p.y + PH / 2, '#ff7733', 3, 1.8, -0.05, 'spark');
        spawnPart(p.x + PW / 2, p.y + 4, '#ffcc44', 2, 1.2, -0.04, 'circle');
      }
    }
    if (p.crouched || p._groundPound) p.jumpBuffer = 0;
    else if (kPress('jump')) p.jumpBuffer = 10;
    if (p.jumpBuffer > 0) p.jumpBuffer--;

    // ── F-key: mount / dismount Mackenzie ─────────────────────────
    // If the player presses F (or a controller-mapped mount button)
    // while standing near an attached Mackenzie, hop onto her back.
    // Press again to dismount. The ride binds player.x/y to the dog
    // each frame, lets her absorb a hit instead of the player, and
    // gives a bigger jump.
    const _mackPressed = (typeof JP !== 'undefined' && (JP['KeyF'] || JP['F']));
    if (_mackPressed) {
      const _ld = getLevelData();
      if (_ld && _ld.allies) {
        // Find the closest attached, non-dead Mackenzie within reach.
        let nearest = null, nd = 90;
        for (const a of _ld.allies) {
          if (!a || a._dead || !a.attached) continue;
          const adx = (a.x + 18) - (p.x + PW / 2);
          const ady = (a.y + 15) - (p.y + PH / 2);
          const dd = Math.hypot(adx, ady);
          if (dd < nd) { nd = dd; nearest = a; }
        }
        if (nearest) {
          // Only consume the F press when we ACTUALLY mount/dismount,
          // so the pet-animal handler downstream in updateNpcs can still
          // read JP['KeyF'] when there's no Mackenzie nearby (the bug
          // before this guard: F always got eaten here, even near a
          // cow, so petting never fired).
          delete JP['KeyF']; delete JP['F'];
          if (nearest.riding) {
            // Dismount — hop the player slightly off to the side.
            nearest.riding = false;
            p.x = nearest.x + (nearest.facingRight ? 40 : -36);
            p.y = nearest.y - 8;
            p.vy = -4;
            floatText('DISMOUNT', p.x - camera.x - 20, p.y - camera.y - 20, '#ffd76a');
            sfx('jump');
          } else {
            nearest.riding = true;
            floatText('🐕 MOUNT', p.x - camera.x - 18, p.y - camera.y - 26, '#ff8acc');
            sfx('coin');
            spawnRing(nearest.x + 14, nearest.y + 12, '#ffd76a', 10, 16, 2);
          }
        }
      }
    }

    // ── While riding Mackenzie: bind player to her back ──────────
    // She inherits the player's horizontal input + ground physics,
    // but the player's draw position is pinned above her. Mount mode
    // is a power-fantasy ride: fast cruise speed, triple jump, and
    // an extended Highland Charge dash.
    const _ridingMack = (function () {
      const _ld = getLevelData();
      if (!_ld || !_ld.allies) return null;
      for (const a of _ld.allies) if (a && a.riding && !a._dead) return a;
      return null;
    })();
    if (_ridingMack) {
      const m = _ridingMack;
      // Mounting cancels any in-flight crouch / slide / ground-pound
      // so transitioning into a ride doesn't leave the player in a
      // dive that can't terminate.
      p._groundPound = false;
      p._groundPoundFx = 0;
      p._sliding = false;
      p.crouched = false;
      // Move Mackenzie based on player input (left/right keys).
      const _ml = kHeld('left') ? -1 : 0;
      const _mr = kHeld('right') ? 1 : 0;
      const moveDir = _ml + _mr;
      // Mount cruises ~2× walk speed; Highland Charge boosts harder.
      const _ridingCharge = p.chargeOn || p.chargeTimer > 0;
      let baseSpeed = _ridingCharge ? 14 : 7.2;
      // Holding RUN from the saddle doubles the cruise speed, so the
      // run button stays useful while riding Mackenzie. Charge already
      // overrides everything, so only apply the run boost otherwise.
      if (!_ridingCharge && kHeld('run')) baseSpeed *= 2;
      m.vx = moveDir * baseSpeed;
      m.x += m.vx;
      // Gravity — respect weather modifiers (moon = 0.62×, snow = 0.9×).
      // Without this, the ridden mount would fall at normal rate even on
      // the moon, while the dismounted player floats — feels wrong.
      const _rideGrav = 0.55 * getGravityMulForWeather(getLevelWeather());
      m.vy += _rideGrav;
      if (m.vy > 12) m.vy = 12;
      m.y += m.vy;
      // ── Clamp Mackenzie to the level bounds ───────────────────
      // Without this, a Highland Charge would let the rider sail off
      // the left or right edge of the world and drop into the void.
      // 36 matches the sprite cell width used in updateAllies.
      const _lvW = (getLevelData().width || 3200);
      const _mackW = 36;
      if (m.x < 0) { m.x = 0; m.vx = 0; }
      else if (m.x + _mackW > _lvW) { m.x = _lvW - _mackW; m.vx = 0; }
      // Settle on ground — use the same solid-platform set the player
      // would (getActivePlatforms with one-ways included) so the mount
      // lands on crumble / breakshot / timed / soundwave / etc. tiles
      // and not just `ground` slabs. Without this Mackenzie falls right
      // through every small floating platform.
      let _mLanded = false;
      const _ridePlats = getActivePlatforms(getLevelData(), true);
      for (let _pi = 0; _pi < _ridePlats.length; _pi++) {
        const pl = _ridePlats[_pi];
        if (!pl) continue;
        // Skip non-solid pass-through types (water/wind/grapple/magnetic).
        if (pl.type === 'water' || pl.type === 'windtunnel' ||
            pl.type === 'grapplehook' || pl.type === 'magnetic') continue;
        if (m.x + 28 <= pl.x || m.x >= pl.x + pl.w) continue;
        if (m.y + 24 > pl.y && m.y + 24 - m.vy <= pl.y + 4) {
          m.y = pl.y - 24; m.vy = 0; m.onGround = true;
          if (!m._wasGrounded) m._airJumps = 2;   // triple = 1 ground + 2 air
          _mLanded = true; break;
        }
      }
      if (!_mLanded) m.onGround = false;
      m._wasGrounded = m.onGround;
      // Triple jump — consume ground jump first, then air-jumps.
      if (p.jumpBuffer > 0 && (m.onGround || (m._airJumps || 0) > 0)) {
        const isGround = m.onGround;
        m.vy = isGround ? -11.5 : -10.5;
        if (isGround) {
          m._airJumps = 2;
          m.onGround = false;
        } else {
          m._airJumps = Math.max(0, (m._airJumps || 0) - 1);
        }
        p.jumpBuffer = 0;
        sfx('jump');
        spawnPart(m.x + 14, m.y + 24, '#ffd76a', 6, 2, 0.10);
        if (!isGround) {
          // Visible "puff" for each air-jump so the user can tell
          // they've activated jump #2 or #3.
          spawnRing(m.x + 14, m.y + 22, '#ffe88a', 6, 10, 1.5);
        }
      }
      // Extend the dash duration when the player triggers Highland
      // Charge while riding — gives the mount a much longer sprint.
      if (p.chargeOn && !m._chargeBoosted) {
        p.chargeTimer = Math.max(p.chargeTimer, 96);   // ~3× normal (was 32)
        p.invincible  = Math.max(p.invincible, 110);
        m._chargeBoosted = true;
      }
      if (!p.chargeOn) m._chargeBoosted = false;
      // Pin the player on Mackenzie's back, facing the same way.
      // Sprite cell is 36×30 — center her back at ~(18, 12) so the
      // rider's feet plant on the mane fluff. Slight horizontal shift
      // toward the saddle area depending on her facing.
      if (moveDir !== 0) m.facingRight = moveDir > 0;
      p.x = m.x + 2;
      p.y = m.y - 22;
      p.vx = m.vx; p.vy = 0;
      p.onGround = true;          // rider counts as grounded for jump logic
      p.jumpsLeft = 2;
      // Don't tick walkFrame while riding — the leg-cycle on the
      // sprite should freeze since the rider's feet aren't walking.
      p._riding = true;
    } else {
      if (p._riding) p._riding = false;
    }

    // Coyote time removed — first jump now requires the player to be on
    // ground at the moment they press jump. If they've already walked off
    // the ledge, the press becomes a double-jump (jumpsLeft path) instead
    // of a forgiveness-window ground jump.
    const prevWallLeft = !!p.wallLeft, prevWallRight = !!p.wallRight, prevWallSliding = !!p.wallSliding;
    if (p.silenced > 0) p.silenced--;
    if ((p.drumSlow || 0) > 0) p.drumSlow--;
    const abilitiesDisabled = (getLevelData().muted === true) || (p.silenced > 0);
    const wallSliding = prevWallSliding && !p.onGround && p.vy > 0;

    const canFirstJump = p.onGround;
    // canAirJump: any in-air press with a jump in the bank — including
    // jumpsLeft === 2 when the player walked off a ledge without jumping.
    // The `isDouble` flag below is what gates the KILT POWER bonus, so
    // walk-off jumps are normal-power and double-jumps still get the boost.
    const canAirJump = !p.onGround && (p.jumpsLeft >= 1 || (p.jumpsLeft === 0 && (p._extraJumps || 0) > 0));
    // Wall jump only fires when actively pressing INTO the wall — otherwise double jump works normally
    const canWallJump = wallSliding && ((prevWallLeft && kHeld('left')) || (prevWallRight && kHeld('right')));

    if (p.jumpBuffer > 0 && p._underwater) {
      // ── Underwater swim stroke ─────────────────────────────────
      // Each press of jump/up while submerged gives a strong upward
      // pulse without consuming jumpsLeft. The held-key logic further
      // down (`if (kHeld('jump')) p.vy -= 0.35`) handles continuous
      // rise. Refreshing jumpsLeft = 2 ensures the player breaks the
      // surface with full air jumps available, so when they actually
      // "jump out of the water" their first airborne press counts as
      // a normal first jump.
      p.vy = Math.max(-6.0, p.vy - 3.6);
      p.jumpBuffer = 0;
      p.jumpsLeft = 2;
      sfx('jump');
      spawnPart(p.x + PW / 2, p.y + PH / 2 + 6, '#7ec8ff', 6, 1.8);
    } else if (p.jumpBuffer > 0 && canWallJump && !p.onGround) {
      // Wall jump — kick away from wall
      const dir = prevWallLeft ? 1 : -1;
      p.vx = dir * SPEED * 1.6;
      p.vy = JFORCE * 0.88;
      p.jumpBuffer = 0; p.jumpsLeft = 1;
      sfx('wall_jump');
      spawnPart(p.x + PW / 2, p.y + PH / 2, '#00ccff', 12, 4);
      floatText('WALL JUMP!', p.x - camera.x - 30, p.y - camera.y - 10, '#00ccff');
    } else if (p.jumpBuffer > 0 && (canFirstJump || canAirJump)) {
      const isDouble = canAirJump && !canFirstJump && p.jumpsLeft === 1;
      p.vy = JFORCE + (isDouble ? 1 : 0);
      p.jumpBuffer = 0;
      if (canFirstJump) { p.jumpsLeft = 1; }
      else {
        if (p.jumpsLeft <= 0 && (p._extraJumps || 0) > 0) {
          p._extraJumps--;
          floatText('🪶', p.x - camera.x, p.y - camera.y - 10, '#88aaff');
        }
        p.jumpsLeft = Math.max(0, p.jumpsLeft - 1);
      }

      if (isDouble) {
        sfx('kilt'); spawnPart(p.x + 16, p.y + 30, '#1a5c2e', 10, 2.5); spawnPart(p.x + 16, p.y + 30, '#0e4d7d', 8, 2);
        floatText('KILT POWER!', p.x - camera.x - 40, p.y - camera.y, '#4a8c3f');
      } else sfx('jump');
    }

    // Counter / Parry — briefly deflects any incoming projectile
    if (p.counterActive > 0) p.counterActive--;
    if (p.counterWindow > 0) p.counterWindow--;
    if (kPress('counter') && p.cooldowns.counter <= 0 && !abilitiesDisabled) {
      p.counterActive = 18;   // 0.3s deflect window
      p.cooldowns.counter = p.CD_MAX.counter;
      sfx('shield_break');  // clang sound
      spawnRing(p.x + 16, p.y + 25, '#00ffff', 8, 18, 2);
      floatText('PARRY!', p.x - camera.x - 20, p.y - camera.y - 20, '#00ffff');
    }

    // War Drum — one-use, kills all on-screen enemies
    if (kPress('shoot') && p.activeNote === 'drum' && !abilitiesDisabled) {
      p.activeNote = null; p.rapidFire = 0;
      screenShake = 35;
      sfx('bomb_explode');
      let kills = 0;
      for (const e of enemies) {
        if (!e.dead && e.x + (e.w || 32) > camera.x && e.x < camera.x + W) {
          e.hp = 0; kills++;
        }
      }
      score += kills * 300; updateHUD();
      floatText('⚔ WAR DRUM! ×' + kills, p.x - camera.x - 60, p.y - camera.y - 30, '#ff4400');
      for (let i = 0; i < 30; i++) spawnPart(p.x + 16, p.y + 20, '#ff4400', 30, 8);
      for (let i = 0; i < 20; i++) spawnPart(p.x + 16, p.y + 20, '#ffcc00', 20, 6);
    }

    const rapidFireActive = p.rapidFire > 0 && p.activeNote === 'note';
    // ── Aim mode: spacebar hold = up, double-tap+hold = down ──────────
    // Aim key — defaults to Space but rebindable via KB.aim
    const _aimKey = normalizeKeyCode(KB.aim || 'Space');
    const _spaceNow = !!K[_aimKey];
    if (_spaceNow && !p._spaceWas) {
      // New spacebar press — track double-tap
      const _gap = frameCount - (p._lastSpaceTap || 0);
      p._spaceTaps = (_gap < 14) ? (p._spaceTaps || 0) + 1 : 1;
      p._lastSpaceTap = frameCount;
    }
    p._spaceWas = _spaceNow;
    p._spaceHeld = _spaceNow ? (p._spaceHeld || 0) + 1 : 0;
    // Aim locks in after holding for >8 frames (past the jump impulse)
    if (K['_aimUp']) {
      p._aimMode = 'up';
    } else if (K['_aimDown']) {
      p._aimMode = 'down';
    } else if (_spaceNow && (p._spaceHeld || 0) > 8) {
      p._aimMode = (p._spaceTaps || 0) >= 2 ? 'down' : 'up';
    } else if (!_spaceNow) {
      p._aimMode = 'normal';
      if ((p._spaceTaps || 0) >= 2 && (p._spaceHeld || 0) === 0) p._spaceTaps = 0; // reset after release
    }

    // ── Bagpipe switch: keys 1-5 OR D-pad up/down on controller (cycle through 5 types)
    const _bpSwitchTo = (_bn) => {
      if ((p.bagpipe || 1) === _bn) return;
      p.bagpipe = _bn; p.chargeHeld = 0;
      const _bpN = ['', 'DEFAULT', 'BOUNCE', 'PIERCING', 'CHARGE', 'PORTAL'];
      const _bpC = ['', '#f5c518', '#44ffcc', '#ff88ff', '#ff8800', '#8866ff'];
      p._bagpipePopTimer = 90;
      sfx('jump');
      floatText(_bpN[_bn] + ' BAGPIPE', p.x - camera.x - 50, p.y - camera.y - 50, _bpC[_bn]);
    };
    // Bagpipe keys are rebindable (KB.bp1..KB.bp5 default to '1'..'5')
    for (let _bi = 1; _bi <= 5; _bi++) {
      const _bk = normalizeKeyCode(KB['bp' + _bi] || ('Digit' + _bi));
      if (JP[_bk]) {
        _bpSwitchTo(_bi);
        delete JP[_bk];
      }
    }
    if (GPP.bagpipeNext) { const _c = p.bagpipe || 1; _bpSwitchTo(_c >= 5 ? 1 : _c + 1); }
    if (GPP.bagpipePrev) { const _c = p.bagpipe || 1; _bpSwitchTo(_c <= 1 ? 5 : _c - 1); }
    const _bp = p.bagpipe || 1;
    const dir = p.facingRight ? 1 : -1;
    const noteType = p.activeNote || 'note';
    // Muzzle origin. Crouched: 50 wide × 32 tall stretched sprite. The
    // bagpipe sits roughly at three-quarters height of the squashed body
    // (~p.y + 22). Standing: at the bagpipe (~p.y + 20).
    const _px = p.x + (p.facingRight ? cPW + 4 : -6), _py = p.crouched ? p.y + 22 : p.y + 20;

    // Bagpipe 4: Charge — hold to grow, release to fire
    if (_bp === 4 && !rapidFireActive && !abilitiesDisabled) {
      if (kHeld('shoot')) {
        p.chargeHeld = Math.min((p.chargeHeld || 0) + 1, 90);
      } else if ((p.chargeHeld || 0) > 0 && p.cooldowns.shoot <= 0) {
        const _ch = p.chargeHeld / 90;
        const _aimVy4 = p._aimMode === 'up' ? -12 : p._aimMode === 'down' ? 12 : -0.5;
        const _aimVx4 = p._aimMode === 'up' || p._aimMode === 'down' ? 0 : dir * 10;
        const _ncol4 = (noteType === 'note') ? pickNoteColor(ld) : null;
        projectiles.push({
          x: _px, y: _py, vx: _aimVx4, vy: _aimVy4, type: noteType,
          life: 120 + Math.floor(_ch * 80), dmg: 1 + Math.floor(_ch * 4),
          scale: 1 + _ch * 2.5, hitR: 6 * (1 + _ch * 2.5),
          // wideHit: a charge shot above ~10% charge punches through every
          // target inside its footprint (breakable terrain + enemies). The
          // shot keeps flying until lifetime ends. Per-target dedupe lives
          // on proj._bsHit / proj._enHit so the same target isn't tagged
          // twice as the projectile crosses it.
          wideHit: _ch > 0.1,
          col: _ncol4 && _ncol4[0], colDim: _ncol4 && _ncol4[1],
        });
        sfx('shoot'); p.cooldowns.shoot = p.CD_MAX.shoot; p.chargeHeld = 0;
      }
    }
    // Bagpipe 5: Portal mode.
    //   A key      → arm portal A (queues which color the next shot fires)
    //   S key      → arm portal B
    //   shoot key  → fire the currently-armed portal
    // The armed state is stored on player._portalNext and persists until
    // the player switches it. The bagpipe's swirl color reflects the
    // current selection so the player always knows what Q will fire.
    else if (_bp === 5 && !abilitiesDisabled) {
      // Arm a color when the player presses A or S (no cooldown — pure
      // mode toggle, not a shot).
      if (kPress('portalA')) {
        p._portalNext = 'A';
        floatText('PORTAL A', p.x - camera.x - 20, p.y - camera.y - 28, '#8866ff');
        sfx('checkpoint');
      } else if (kPress('portalB')) {
        p._portalNext = 'B';
        floatText('PORTAL B', p.x - camera.x - 20, p.y - camera.y - 28, '#ff66aa');
        sfx('checkpoint');
      }
      // Fire on shoot. Default armed color is A on level start.
      if (kPress('shoot') && p.cooldowns.shoot <= 0) {
        const _portalLbl = p._portalNext || 'A';
        const _pspd = 18;
        // Respect the aim mode so portals can be fired straight up or
        // down (hold Space = up, double-tap-hold Space = down), not
        // just horizontally. Crouching cancels vertical aim, matching
        // the other bagpipe types.
        const _pUp = !p.crouched && p._aimMode === 'up';
        const _pDn = !p.crouched && p._aimMode === 'down';
        const _pvx = (_pUp || _pDn) ? 0 : dir * _pspd;
        const _pvy = _pUp ? -_pspd : _pDn ? _pspd : -1;
        projectiles.push({
          x: _px, y: _py, vx: _pvx, vy: _pvy,
          type: 'portal-shot', life: 120, dmg: 0, portalLabel: _portalLbl
        });
        sfx('shoot'); p.cooldowns.shoot = 30;
      }
    }
    // Bagpipes 1-3
    else if (!abilitiesDisabled) {
      const shootTrigger = kHeld('shoot'); // hold Q to auto-fire at cooldown rate
      if (shootTrigger && p.cooldowns.shoot <= 0) {
        // One themed color per shoot event so e.g. bp=2's two simultaneous
        // notes match each other. Only randomized for the basic 'note'
        // type — powerup notes (bignote/bomb/drone) keep their distinctive
        // colors so the player can still read which mode is active.
        const _ncol = (noteType === 'note') ? pickNoteColor(ld) : null;
        const _nc = _ncol && _ncol[0], _ncd = _ncol && _ncol[1];
        if (_bp === 2) {
          // Double bounce: two notes, spread depends on aim mode
          const _spd = 9;
          if (p._aimMode === 'up') {
            [-1, 1].forEach(_s => {
              const ang = -Math.PI / 2 + _s * (Math.PI / 9);
              projectiles.push({ x: _px, y: _py, vx: Math.cos(ang) * _spd, vy: Math.sin(ang) * _spd, type: noteType, life: 220, dmg: 1, bounces: 0, maxBounces: 3, bounceNote: true, col: _nc, colDim: _ncd });
            });
          } else if (p._aimMode === 'down') {
            [-1, 1].forEach(_s => {
              const ang = Math.PI / 2 + _s * (Math.PI / 9);
              projectiles.push({ x: _px, y: _py, vx: Math.cos(ang) * _spd, vy: Math.sin(ang) * _spd, type: noteType, life: 220, dmg: 1, bounces: 0, maxBounces: 3, bounceNote: true, col: _nc, colDim: _ncd });
            });
          } else {
            const _c45 = _spd * 0.707;
            [-1, 1].forEach(_s => {
              projectiles.push({ x: _px, y: _py, vx: dir * _c45, vy: _s * _c45, type: noteType, life: 220, dmg: 1, bounces: 0, maxBounces: 3, bounceNote: true, col: _nc, colDim: _ncd });
            });
          }
        } else if (_bp === 3) {
          // Piercing: slow, passes through enemies
          const _aimVy3 = p.crouched ? 0 : (p._aimMode === 'up' ? -12 : p._aimMode === 'down' ? 12 : -0.5);
          const _aimVx3 = p.crouched ? dir * 8 : (p._aimMode === 'up' || p._aimMode === 'down' ? 0 : dir * 8);
          projectiles.push({ x: _px, y: _py, vx: _aimVx3, vy: _aimVy3, type: noteType, life: 160, dmg: 1, piercing: true, col: _nc, colDim: _ncd });
        } else {
          const _aimVy1 = p.crouched ? 0 : (p._aimMode === 'up' ? -12 : p._aimMode === 'down' ? 12 : -0.5);
          const _aimVx1 = p.crouched ? dir * 10 : (p._aimMode === 'up' || p._aimMode === 'down' ? 0 : dir * 10);
          projectiles.push({ x: _px, y: _py, vx: _aimVx1, vy: _aimVy1, type: noteType, life: 120, dmg: noteType === 'bomb' ? 3 : 1, col: _nc, colDim: _ncd });
        }
        sfx('shoot');
        p.cooldowns.shoot = rapidFireActive ? 5 : (_bp === 3 ? p.CD_MAX.shoot * 2 : p.CD_MAX.shoot);
      }
    }

    if (kPress('skirl') && p.cooldowns.skirl <= 0 && !abilitiesDisabled) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5)
        projectiles.push({ x: p.x + 16, y: p.y + 20, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, type: 'skirl', life: 45, dmg: 2 });
      spawnPart(p.x + 16, p.y + 20, '#00aaff', 20, 5); sfx('skirl'); p.cooldowns.skirl = p.CD_MAX.skirl;
      floatText('SKIRL BLAST!', p.x - camera.x - 40, p.y - camera.y - 20, '#00aaff');
    }
    if (kPress('charge') && p.cooldowns.charge <= 0 && !abilitiesDisabled) {
      p.chargeOn = true; p.chargeTimer = 32; p.invincible = 38;
      spawnPart(p.x + 16, p.y + 20, '#ff6600', 14, 4); sfx('charge'); p.cooldowns.charge = p.CD_MAX.charge;
      floatText('HIGHLAND CHARGE!', p.x - camera.x - 40, p.y - camera.y - 20, '#ff6600');
    }
    // ── Drone key → Grappling hook (auto-lock) ──────────────────
    // The drone of the bagpipe targets the NEAREST grapple-hook block
    // within range. No projectile / aiming — just lock + pull. The
    // player can press drone again OR jump to release. The closest
    // hook is rendered with a target reticle (see drawScene) so the
    // player can see what they'll attach to before pressing.
    if (kPress('drone') && !abilitiesDisabled) {
      if (p._grappleAttached) {
        // Release with a small hop.
        p._grappleAttached = false;
        p._grappleAnchor = null;
        p.vy = -3;
        floatText('RELEASE', p.x - camera.x - 20, p.y - camera.y - 20, '#88ccff');
        sfx('jump');
      } else if (p.cooldowns.drone <= 0) {
        // Find the closest grapplehook block within MAX_GRAPPLE_RANGE.
        // Square-distance compare so we can skip the sqrt.
        const MAX_R = 540, MAX_R2 = MAX_R * MAX_R;
        let best = null, bestD2 = MAX_R2 + 1;
        const px = p.x + cPW / 2, py = p.y + cPH / 2;
        for (const pl of (ld.platforms || [])) {
          if (!pl || pl.type !== 'grapplehook') continue;
          const cx = pl.x + (pl.w || 24) / 2;
          const cy = pl.y + (pl.h || 24) / 2;
          const dx = cx - px, dy = cy - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) { bestD2 = d2; best = { plat: pl, cx, cy }; }
        }
        if (best) {
          p._grappleAttached = true;
          p._grappleAnchor = { x: best.cx, y: best.cy };
          p.vx = 0; p.vy = 0;
          sfx('drone');
          p.cooldowns.drone = 18;
          spawnRing(best.cx, best.cy, '#88ccff', 12, 16, 2.5);
          floatText('HOOKED!', best.plat.x - camera.x, best.plat.y - camera.y - 14, '#88ccff');
        } else {
          // No target in range — quick floatText for feedback.
          floatText('NO HOOK IN RANGE', p.x - camera.x - 50, p.y - camera.y - 30, '#ff6666');
          p.cooldowns.drone = 20;
        }
      }
    }
    // Jump while attached also dismounts (mirrors classic grappling-
    // hook conventions). Gives a real jump force + restores air-jumps
    // so the player can re-chain into a wall-jump or double-jump.
    if (p._grappleAttached && kPress('jump')) {
      p._grappleAttached = false;
      p._grappleAnchor = null;
      p.vy = JFORCE;
      p.jumpsLeft = 1;
      p.jumpBuffer = 0;
      sfx('jump');
      spawnPart(p.x + cPW / 2, p.y + cPH / 2, '#88ccff', 8, 3, 0.05, 'spark');
    }
    // ── Grapple-attached physics ────────────────────────────────
    // While attached we smoothly fly to the anchor; once close, hold
    // position. Normal gravity / collision still runs but the pull is
    // strong enough to dominate.
    if (p._grappleAttached && p._grappleAnchor) {
      const aX = p._grappleAnchor.x, aY = p._grappleAnchor.y;
      const dx = aX - (p.x + cPW / 2), dy = aY - (p.y + cPH / 2);
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        // Pull velocity toward anchor — accelerate, then cap.
        const pullStrength = 1.4;
        p.vx = (dx / dist) * Math.min(pullStrength * dist, 16);
        p.vy = (dy / dist) * Math.min(pullStrength * dist, 16);
      } else {
        // Locked at the hook — zero out motion, ignore gravity.
        p.x = aX - cPW / 2;
        p.y = aY - cPH / 2;
        p.vx = 0; p.vy = 0;
        p.onGround = false;
        p.jumpsLeft = 2;   // can release with a jump if needed
        // Small ambient sparkle at the hook
        if (frameCount % 5 === 0) spawnPart(aX, aY, '#88ccff', 1, 1.4, -0.04, 'spark');
      }
    }

    // Notation-style combo recognition removed — Jump→Skirl→Jump and
    // Charge→Charge→Jump sequences were hijacking the player's third
    // keypress (overriding p.vy / p.vx), so normal jumps after another
    // action felt like they "didn't happen". Every keypress now maps
    // directly to its action.
    // shield/heal are item pickups now — not abilities. See updatePowerupItems.

    if (p.chargeTimer > 0) { p.chargeTimer--; if (p.chargeTimer <= 0) p.chargeOn = false; }
    if (p.shieldTimer > 0) { p.shieldTimer--; if (p.shieldTimer <= 0) p.shieldOn = false; }
    if (p.invincible > 0) p.invincible--;
    if (p.invincibleFX > 0) p.invincibleFX--;
    if ((p.starInvincible || 0) > 0) {
      p.starInvincible--;
      // Star power jingle — play next melody note (runs every physics step)
      if (AC && masterGain) {
        resumeAC();
        const _si = p.starInvincible;
        // Speed up as star expires
        const _interval = _si < 120 ? 4 : _si < 240 ? 5 : 6;
        if (frameCount % _interval === 0) {
          try {
            const _mel = [784, 880, 988, 784, 880, 988, 1047, 1175, 1319, 1175, 1047, 988, 1047, 1175, 1319, 1568];
            const _beat = (p._jingleBeat = ((p._jingleBeat || 0) + 1)) % _mel.length;
            const _f = _mel[_beat];
            const t0 = AC.currentTime;
            const _go = AC.createOscillator(), _gg = AC.createGain();
            _go.type = 'square'; _go.frequency.value = _f;
            _gg.gain.setValueAtTime(0.0, t0);
            _gg.gain.linearRampToValueAtTime(0.07, t0 + 0.01);
            _gg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
            _go.connect(_gg); _gg.connect(masterGain); _go.start(t0); _go.stop(t0 + 0.1);
            // Harmony a fifth above
            const _ho = AC.createOscillator(), _hg = AC.createGain();
            _ho.type = 'sine'; _ho.frequency.value = _f * 1.5;
            _hg.gain.setValueAtTime(0.0, t0);
            _hg.gain.linearRampToValueAtTime(0.03, t0 + 0.01);
            _hg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
            _ho.connect(_hg); _hg.connect(masterGain); _ho.start(t0); _ho.stop(t0 + 0.09);
          } catch (_e) { }
        }
      }
    }
    if (p.rapidFire > 0) { p.rapidFire--; if (p.rapidFire <= 0) { p.activeNote = null; } }
    for (const k in p.cooldowns) if (p.cooldowns[k] > 0) p.cooldowns[k]--;

    const weather = getLevelWeather();
    p.vy += GRAV * getGravityMulForWeather(weather); p.vy = Math.min(p.vy, 20);
    if (weatherState.windX) p.vx += weatherState.windX * 0.08;
    p._landVy = p.vy;
    p.x += p.vx; p.y += p.vy;
    // Tornado: apply a direct positional shove on top of the velocity
    // nudge above. Velocity-only winds vanish the instant the player
    // holds a direction (vx gets overwritten to ±SPEED each frame), so
    // the storm-level was effectively ignoring its own weather setting.
    // Position-additive shove can't be cancelled by input — the player
    // has to physically fight against it, which is the design intent
    // of "tornado weather". Air-time gets a 1.5× multiplier so being
    // airborne in a tornado feels considerably more dangerous.
    if (weather === 'tornado' && weatherState.windX) {
      const airMul = p.onGround ? 1.0 : 1.5;
      p.x += weatherState.windX * 0.55 * airMul;
    }
    p.x = Math.max(0, Math.min(p.x, (ld.width || 3200) - PW));

    // Use Grid for static AABB platforms, combine with dynamic ones
    const dynamicSolid = [];
    const movingPlats = ld.movingPlats || [];
    for (let i = 0; i < movingPlats.length; i++) {
      const mp = movingPlats[i];
      dynamicSolid.push({ x: mp._cx || mp.x, y: mp._cy || mp.y, w: mp.w || 60, h: mp.h || 14 });
    }
    const qb = ld.qblocks || [];
    for (let i = 0; i < qb.length; i++) dynamicSolid.push({ x: qb[i].x, y: qb[i].y, w: 28, h: 28 });
    const cb = ld.cblocks || [];
    for (let i = 0; i < cb.length; i++) dynamicSolid.push({ x: cb[i].x, y: cb[i].y, w: 28, h: 28 });

    // Use crouch-aware dimensions for every collision query in this
    // block. cPW/cPH were computed near the top of updatePlayer:
    //   crouched  → 50 wide × 32 tall  (prone)
    //   standing  → 32 wide × 50 tall  (upright)
    // Using PW/PH unconditionally here was the bug behind "can't slide
    // under a 1-block-high platform" — the visual was prone but the
    // collision capsule was still full-height standing.
    const nearbyPlats = getPlatsNear(p.x, p.y, cPW, cPH);
    resolveVsPlats(p, cPW, cPH, [...nearbyPlats, ...dynamicSolid]);

    const solidPlats = getActivePlatforms(ld, false);
    const rotatedPlats = [];
    for (let i = 0; i < solidPlats.length; i++) if (solidPlats[i].rotation) rotatedPlats.push(solidPlats[i]);

    resolveVsRotatedPlats(p, cPW, cPH, rotatedPlats);
    // One-way: can jump through from below, stand on top
    const onewayPlats = [];
    const allPlats = ld.platforms || [];
    for (let i = 0; i < allPlats.length; i++) {
      const pl = allPlats[i];
      if (pl.type === 'oneway' && !(ld.voidFloor && pl.y >= 445 && pl.w > 300)) onewayPlats.push(pl);
    }
    resolveVsOneway(p, cPW, cPH, onewayPlats);
    updateWallSlideContacts(p, ld, solidPlats);

    // Preserve grounded state across all subsequent resolveVsPlats calls
    // (each call resets obj.onGround = false internally)
    let anyGrounded = p.onGround;

    const activeQbPlats = (ld.qblocks || []).filter(qb => !qb.hit).map(qb => ({ x: qb.x, y: qb.y, w: 28, h: 28 }));
    if (activeQbPlats.length) { resolveVsPlats(p, cPW, cPH, activeQbPlats); anyGrounded = anyGrounded || p.onGround; }

    // ─── icePlats (separate ice platforms) ─────────────────
    if (ld.icePlats && ld.icePlats.length) {
      resolveVsPlats(p, cPW, cPH, ld.icePlats);
      if (p.onGround) {
        anyGrounded = true;
        for (const ip of ld.icePlats) {
          if (overlap(p.x + 2, p.y + cPH - 3, cPW - 4, 5, ip.x, ip.y, ip.w || 55, ip.h || 18)) {
            p.standingOn = 'ice'; break;
          }
        }
      }
    }

    // ─── Bounce pads — OBB + per-pad cooldown ────────────────────
    for (const bp of (ld.bounces || [])) {
      const bw = bp.w || 50, bh = bp.h || 14;
      const rad = (bp.rotation || 0) * Math.PI / 180;

      // Launch direction unit vector: 0°=up, 90°=right, 180°=down, 270°=left
      const lx = Math.sin(rad), ly = -Math.cos(rad);

      // Transform player centre into pad local space (OBB overlap test)
      const dx = (p.x + cPW / 2) - (bp.x + bw / 2), dy = (p.y + cPH / 2) - (bp.y + bh / 2);
      const C = Math.cos(-rad), S = Math.sin(-rad);
      const localX = dx * C - dy * S;
      const localY = dx * S + dy * C;
      const halfW = bw / 2 + cPW / 2, halfH = bh / 2 + cPH / 2;
      if (Math.abs(localX) >= halfW || Math.abs(localY) >= halfH) continue; // no overlap

      // Penetration on each axis
      const penSide = halfW - Math.abs(localX);
      const penDepth = halfH - Math.abs(localY);

      // Player velocity along launch direction (negative = moving toward active face)
      const vDot = p.vx * lx + p.vy * ly;

      if (penDepth <= penSide) {
        // Front or back face hit
        // Is this the active (front) face? Player must be approaching it: vDot < 0
        if (vDot < 0) {
          // Push player out along face normal (lx, ly) by penDepth
          p.x += lx * penDepth;
          p.y += ly * penDepth;

          // Fire bounce — use per-pad cooldown so chain-bouncing works.
          // Ground pound doubles the bounce force, ends the pound state,
          // and emits a brighter rebound flash so the moment reads.
          if (!(bp._cd > 0)) {
            const meteor = !!p._groundPound;
            const force = Math.abs(JFORCE) * (meteor ? 3.0 : 1.5);
            p.vx = lx * force;
            p.vy = ly * force;
            p.onGround = false; p.jumpsLeft = 2; anyGrounded = false;
            bp._cd = 20; // per-pad cooldown, not global
            sfx('bounce_land');
            spawnPart(p.x + PW / 2, p.y + PH / 2, meteor ? '#ffeb88' : '#00ffcc', meteor ? 22 : 14, meteor ? 6 : 4);
            floatText(meteor ? 'SUPER BOING!' : 'BOING!', p.x - camera.x - 20, p.y - camera.y, meteor ? '#ffeb88' : '#00ffcc');
            if (meteor) { p._groundPound = false; p._groundPoundFx = 0; }
          }
        }
        // Back face: one-way — do nothing, player passes through
      } else {
        // Side face — solid push, no bounce
        const sideNx = (localX < 0 ? -1 : 1);
        // Rotate local side normal back to world space
        const wnx = C * sideNx, wny = S * sideNx;
        p.x += wnx * penSide;
        p.y += wny * penSide;
        // Cancel velocity into the side
        const vSide = p.vx * wnx + p.vy * wny;
        if (vSide < 0) { p.vx -= vSide * wnx; p.vy -= vSide * wny; }
      }
      break;
    }
    // Tick per-pad cooldowns
    for (const bp of (ld.bounces || [])) { if (bp._cd > 0) bp._cd--; }

    // Commit final grounded state — used by next-frame jump check.
    const _wasGrounded = p.onGround;
    p.onGround = anyGrounded;
    if (!_wasGrounded && p.onGround && p._landVy > 3) {
      spawnPart(p.x + PW / 2, p.y + PH, '#c8b090', 6, 2, -0.06, 'spark');
      spawnPart(p.x + PW / 2, p.y + PH, '#a09070', 4, 1.5, -0.04, 'circle');
    }
    if (p.onGround) p.jumpsLeft = 2;

    // ─── New-platform field effects ────────────────────────────────
    // Conveyor (solid, but pushes the rider sideways)
    // Magnetic   (solid + within radius pulls the player toward it)
    // Wind tunnel (non-solid; pushes upward while inside)
    // Water      (non-solid; reduced gravity + slower vy cap inside)
    let inWater = false;
    for (const pl of (ld.platforms || [])) {
      if (!pl || !pl.type) continue;
      if (pl.type === 'conveyor' && p.onGround) {
        const px = pl._cx != null ? pl._cx : pl.x;
        const py = pl._cy != null ? pl._cy : pl.y;
        if (overlap(p.x + 2, p.y + cPH - 3, cPW - 4, 5, px, py, pl.w || 60, pl.h || 18)) {
          // dir: -1 left, 1 right (default right)
          const dir = pl.dir === -1 ? -1 : 1;
          const speed = pl.speed || 1.6;
          p.x += dir * speed;
        }
      } else if (pl.type === 'magnetic') {
        const cx = (pl.x + (pl.w || 32) / 2), cy = (pl.y + (pl.h || 32) / 2);
        const dx = cx - (p.x + cPW / 2), dy = cy - (p.y + cPH / 2);
        const d2 = dx * dx + dy * dy;
        const R = pl.radius || 120;
        if (d2 < R * R && d2 > 1) {
          const d = Math.sqrt(d2);
          // Stronger, grabbier pull: ~2x the base force, and a gentler
          // falloff (still ~50% strength out at the edge instead of fading
          // to zero) so the anchor actually reels the player in. The
          // vertical tug is nearly as strong as the horizontal so it can
          // overcome gravity and lift you toward the anchor.
          const pull = (pl.pull || 0.55) * 2.0 * (1 - 0.5 * d / R);
          p.vx += (dx / d) * pull;
          p.vy += (dy / d) * pull * 0.9;
        }
      } else if (pl.type === 'windtunnel') {
        if (overlap(p.x, p.y, cPW, cPH, pl.x, pl.y, pl.w || 50, pl.h || 120)) {
          // Strong upward push, capped vy
          p.vy -= (pl.lift || 0.85);
          if (p.vy < -8) p.vy = -8;
          p.onGround = false;
        }
      } else if (pl.type === 'water') {
        if (overlap(p.x + 4, p.y + cPH * 0.35, cPW - 8, cPH * 0.55, pl.x, pl.y, pl.w || 80, pl.h || 60)) {
          inWater = true;
        }
      }
    }
    if (inWater) {
      // Underwater physics — buoyant + damp.
      //  • Hard-cap vy so you can't sink fast (was 2.4, now 1.2)
      //  • Heavy damp on vertical motion so gravity doesn't accumulate
      //  • Holding jump pulls you up strongly (0.85 was 0.35) — strong
      //    enough that with normal gravity (~0.5/frame) you still rise
      //  • Slight passive buoyancy (-0.15/frame) so even when you're
      //    NOT holding jump you drift toward the surface instead of
      //    accelerating through the bottom of the pool. The buoyancy
      //    is gentle so the player can still dive by releasing jump.
      if (p.vy > 1.2) p.vy = 1.2;
      p.vy *= 0.78;
      p.vy -= 0.15;                          // passive buoyancy
      if (kHeld('jump')) p.vy -= 0.85;       // active swim up
      if (p.vy < -7) p.vy = -7;
      p.vx *= 0.92;
      p._underwater = true;
    } else {
      p._underwater = false;
    }

    // ─── Grapple-target tracking ─────────────────────────────────
    // Each tick (while NOT already attached) record the nearest
    // grapple-hook block within range as p._grappleTarget so the
    // renderer can draw a target reticle on it. Cleared while
    // attached — the rope itself shows the active anchor.
    if (p._grappleAttached) {
      p._grappleTarget = null;
    } else {
      const _MR = 540, _MR2 = _MR * _MR;
      let _best = null, _bestD2 = _MR2 + 1;
      const _px = p.x + cPW / 2, _py = p.y + cPH / 2;
      for (const pl of (ld.platforms || [])) {
        if (!pl || pl.type !== 'grapplehook') continue;
        const cx = pl.x + (pl.w || 24) / 2;
        const cy = pl.y + (pl.h || 24) / 2;
        const dx = cx - _px, dy = cy - _py;
        const d2 = dx * dx + dy * dy;
        if (d2 < _bestD2) { _bestD2 = d2; _best = pl; }
      }
      p._grappleTarget = _best;
    }

    // ─── Portal teleport ────────────────────────────────────
    poolUpdate(portals, pt => { if ((pt.life || 600) > 0) pt.life--; return (pt.life || 0) > 0; });
    if (portals.length === 2 && !(p._portalCd > 0)) {
      for (let pi = 0; pi < 2; pi++) {
        const a = portals[pi], b = portals[1 - pi];
        if (overlap(p.x + 4, p.y + 4, PW - 8, PH - 8, a.x - 16, a.y - 16, 32, 32)) {
          p.x = b.x - PW / 2; p.y = b.y - PH / 2;
          p.vx *= 0.5; p._portalCd = 30;
          spawnRing(b.x, b.y, pi === 0 ? '#8866ff' : '#ff66aa', 12, 28, 3);
          sfx('checkpoint'); break;
        }
      }
    }
    if ((p._portalCd || 0) > 0) p._portalCd--;

    // ─── Terrain type detection ───────────────────────────
    p.standingOn = 'normal';
    if (p.onGround) {
      for (const pl of ld.platforms) {
        if (pl.type && overlap(p.x + 2, p.y + cPH - 3, cPW - 4, 5, pl.x, pl.y, pl.w, pl.h)) {
          p.standingOn = pl.type; break;
        }
      }
      if (p.standingOn === 'normal') {
        for (const ip of (ld.icePlats || [])) {
          if (overlap(p.x + 2, p.y + cPH - 3, cPW - 4, 5, ip.x, ip.y, ip.w || 55, ip.h || 18)) {
            p.standingOn = 'ice'; break;
          }
        }
      }
    }


    // ─── Spikes ───────────────────────────────────────────
    if (ld.spikes) {
      for (const sp of ld.spikes) {
        // popA/popB: animated — use spikeBlockTimer for phase
        if (sp.spikeType === 'popA' || sp.spikeType === 'popB') {
          const period = sp.period || 240;
          // popB is offset by half a period so they're always opposite
          const t = (spikeBlockTimer + (sp.spikeType === 'popB' ? period / 2 : 0)) % period;
          // Active (up) = first 90 frames, down = last 150 frames
          const active = t < 90;
          sp._popActive = active;
          if (!active) continue; // retracted — no collision
        } else {
          sp._popActive = true;
        }
        if (overlap(p.x + 4, p.y + 4, cPW - 8, cPH - 4, sp.x, sp.y, sp.w || 48, sp.h || 16)) {
          if (!demoLevelDataOverride && p.invincible <= 0 && (p.starInvincible || 0) <= 0) { p.hp = Math.max(0, p.hp - 1); p.invincible = 90; sfx('hit'); if (p.hp <= 0) sfx('player_die'); break; }
        }
      }
    }

    // ─── Spike Blocks (platforms with toggling spikes) ─────────
    for (const sb of (ld.spikeBlocks || [])) {
      const period = sb.period || 120;
      const half = period / 2;
      const phase = sb.phase || 0;
      const t = (spikeBlockTimer + phase) % period;
      // Group A: spikes active in first half; Group B: spikes active in second half
      const active = (sb.spikeGroup === 'B') ? (t >= half) : (t < half);
      sb._active = active;
      if (active && !demoLevelDataOverride && (p.invincible || 0) <= 0 && (p.starInvincible || 0) <= 0) {
        // Only damage if player overlaps the spike tips (top 6px of block)
        if (overlap(p.x + 4, p.y + cPH - 8, cPW - 8, 10, sb.x, sb.y, sb.w || 60, 8)) {
          p.hp = Math.max(0, p.hp - 1); p.invincible = 90; sfx('hit');
          if (p.hp <= 0) sfx('player_die');
        }
      }
    }
    // ─── Void floor ───────────────────────────────────────
    // Player dies below the void line regardless of voidFloor flag
    // voidFloor=false just means there's a ground graphic but carved holes still kill
    const deathY = ld.voidY || (ld.voidFloor ? 460 : 560); // fall off screen = die
    if (!demoLevelDataOverride && p.y + cPH > deathY && p.hp > 0) { sfx('player_die'); p.hp = 0; }

    // ─── New-weather player effects ───────────────────────────────
    // Sandstorm: 25% movement slowdown while exposed (any direction).
    // Acid rain: 1 HP every 3 s unless something is directly overhead
    //   (a platform within ~140 px above gives shelter).
    // Lightning: active strike that overlaps the player damages them.
    // Tide: above the tideY is safe; below is "drowning" (kills).
    if (!demoLevelDataOverride) {
      const w = getLevelWeather(ld);
      if (w === 'sandstorm') p.vx *= 0.75;
      if (w === 'acidrain' && p.hp > 0 && (p.invincible || 0) <= 0 && (p.starInvincible || 0) <= 0) {
        // Check overhead shelter
        let sheltered = false;
        for (const pl of (ld.platforms || [])) {
          if (!pl || (pl.type && pl.type !== 'ground')) continue;
          if (pl.x < p.x + cPW && pl.x + (pl.w || 0) > p.x && pl.y + (pl.h || 0) < p.y && pl.y > p.y - 220) {
            sheltered = true; break;
          }
        }
        if (!sheltered) {
          p._acidTick = (p._acidTick || 0) + 1;
          if (p._acidTick >= 180) {
            p._acidTick = 0;
            p.hp = Math.max(0, p.hp - 1); p.invincible = 60;
            sfx('hit');
            if (p.hp <= 0) sfx('player_die');
          }
        } else {
          p._acidTick = Math.max(0, (p._acidTick || 0) - 2);
        }
      }
      if (w === 'lightning' && p.hp > 0 && (p.invincible || 0) <= 0 && (p.starInvincible || 0) <= 0) {
        for (const s of (weatherState.strikes || [])) {
          if (s.strike > 0 && Math.abs(s.x - (p.x + cPW / 2)) < 22) {
            p.hp = Math.max(0, p.hp - 1); p.invincible = 90;
            sfx('hit');
            if (p.hp <= 0) sfx('player_die');
            s.strike = 0;
            break;
          }
        }
      }
      if (w === 'tide' && weatherState.tideY != null && p.y + cPH > weatherState.tideY && p.hp > 0) {
        // Drowning in the rising tide — instant kill matches voidY behavior.
        sfx('player_die'); p.hp = 0;
      }
    }

    if (p.vy <= 2 && p.vy > -20) {
      const headX = p.x + 4, headW = cPW - 8;
      const headY = p.y;
      for (const qb of ld.qblocks) {
        if (qb.hit) continue;
        if (headX + headW <= qb.x || headX >= qb.x + 28) continue;
        const blockBottom = qb.y + 28;
        if (headY >= qb.y + 22 && headY <= blockBottom + 6) {
          qb.hit = true; qb.bumpTimer = 10; p.vy = 2;
          const puType = randomPowerupType();
          powerups.push({ x: qb.x + 4, y: qb.y - 28, vy: -4, type: puType, life: 600 });
          sfx('powerup_spawn'); spawnPart(qb.x + 14, qb.y, '#f5c518', 12, 3.5);
          floatText('?!', qb.x - camera.x + 4, qb.y - camera.y - 10, '#f5c518');
          break;
        }
      }
      // Coin blocks (multiple hits, each gives coins)
      for (const cb of (ld.cblocks || [])) {
        if ((cb.hits || 0) <= 0) continue;
        if (headX + headW <= cb.x || headX >= cb.x + 28) continue;
        const cbBottom = cb.y + 28;
        if (headY >= cb.y + 22 && headY <= cbBottom + 6) {
          cb.hits--; cb.bumpTimer = 10; p.vy = 2;
          coins++; score += 50; updateHUD();
          sfx('coin'); spawnPart(cb.x + 14, cb.y, '#f5c518', 8, 3);
          floatText('+50🪙', cb.x - camera.x + 4, cb.y - camera.y - 10, '#f5c518');
          break;
        }
      }
    }

    p.frame++;
    // Freeze the player's leg cycle while riding — feet aren't on the
    // ground walking, they're on Mackenzie's back.
    if (Math.abs(p.vx) > 0.5 && p.onGround && !p._riding) p.walkFrame++;
  }
  // ── Exports ────────────────────────────────────────────────────
  window.GamePhysics = { resolveVsPlats, getActivePlatforms, updatePlayer };
  window.resolveVsPlats     = resolveVsPlats;
  window.getActivePlatforms = getActivePlatforms;
  window.updatePlayer       = updatePlayer;
})();
