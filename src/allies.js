// src/allies.js
// ──────────────────────────────────────────────────────────────────
// Mackenzie ally — sprite drawing + per-frame AI/state machine.
// drawMackenzie() is called by the engine renderer; updateAllies()
// runs the companion logic (follow, fetch, attack, ride mount).
//
// Reads/writes engine globals via the global object (player, camera,
// enemies, projectiles, frameCount, sfx, weatherState, particles,
// getLevelData, screenShake, …) — all on window via either var
// declarations or earlier modules.
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  function drawMackenzie(c, ox, oy, facingRight, opts) {
    const o = opts || {};
    const moving  = !!o.moving;
    const barking = !!o.barking;
    const ridden  = !!o.ridden;
    const sitting = !!o.sitting && !o.moving && !o.ridden;
    const hurt    = !!o.hurt;
    const tongue  = Math.max(0, Math.min(1, o.tongueFrame || 0));
    const tail    = Math.max(-1, Math.min(1, o.tailFrame || 0));
    const _wf     = o.walkFrame || 0;
    c.save();
    if (!facingRight) { c.translate(ox * 2 + 36, 0); c.scale(-1, 1); }
    const X = ox, Y = oy;

    // Body bob — slight while trotting on her own, dampened while
    // ridden (the rider needs a stable seat) but legs still animate.
    const bob = moving ? Math.round(Math.abs(Math.sin(_wf * 0.30)) * (ridden ? 0.5 : 1)) : 0;
    const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(X + x, Y + y + bob, w, h); };

    // Trot gait — diagonal leg pairs move in opposite phase. Legs
    // animate while ridden too because she's still actually running.
    const _trotA = moving ? Math.sin(_wf * 0.30) : 0;
    const _trotB = -_trotA;
    const liftA = (_trotA > 0.4) ? -1 : 0;       // front-L + back-R
    const liftB = (_trotB > 0.4) ? -1 : 0;       // front-R + back-L
    const stepA = Math.round(_trotA * 1.4);
    const stepB = Math.round(_trotB * 1.4);

    // Palette — sable-and-white sheltie.
    const SABLE   = '#a87040';
    const SABLE_L = '#d09058';
    const SABLE_M = '#946038';
    const SABLE_D = '#5a2e10';
    const WHITE   = '#f4ece0';
    const WHITE_S = '#cbbb9e';
    const WHITE_D = '#9a8a70';
    const EYE     = '#1a1008';
    const EYE_HI  = '#fff5e0';
    const NOSE    = '#0a0608';
    const TONGUE  = '#ff6688';
    const TONGUE_D = '#cc3a58';
    const HEAD_DROP = ridden ? 1 : 0;

    // ════════════════════════════════════════════════════════════
    //  TAIL (drawn first so the body overlaps the base of it)
    //  Plumed, swept slightly upward, white tip. Wags side to side.
    // ════════════════════════════════════════════════════════════
    const tWag  = Math.round(tail * 2);
    const tArcY = Math.round(Math.abs(tail) * -1);
    // Base — anchored to the rump
    px(4 + tWag, 13 + tArcY,  3, 3, SABLE_D);
    px(2 + tWag, 11 + tArcY,  3, 4, SABLE);
    px(2 + tWag, 11 + tArcY,  3, 1, SABLE_L);   // top highlight
    // Plume curls
    px(0 + tWag, 13 + tArcY,  3, 3, SABLE);
    px(0 + tWag, 10 + tArcY,  2, 3, SABLE_L);   // upper plume tuft
    // White tail tip
    px(-1 + tWag, 12 + tArcY, 2, 3, WHITE);
    px(-1 + tWag, 12 + tArcY, 2, 1, WHITE_S);

    // ════════════════════════════════════════════════════════════
    //  BODY
    //  Sable rectangle with darker belly + lighter top stripe.
    //  Curves: rump rises slightly, chest steps up toward the head.
    // ════════════════════════════════════════════════════════════
    // Rump
    px(5, 13, 6, 9, SABLE);
    px(5, 13, 6, 1, SABLE_L);
    px(5, 14, 1, 8, SABLE_M);                   // rump shadow side
    // Main back
    px(11, 12, 11, 10, SABLE);
    px(11, 12, 11, 2, SABLE_L);                 // sun-lit back stripe
    px(11, 22, 11, 1, SABLE_D);                 // belly shadow
    // Speckle ticking that breaks up the flat sable.
    px(13, 16, 1, 1, SABLE_M);
    px(17, 14, 1, 1, SABLE_D);
    px(15, 19, 1, 1, SABLE_M);
    px(19, 17, 1, 1, SABLE_D);

    // ════════════════════════════════════════════════════════════
    //  MANE / CHEST RUFF
    //  Fluffy white-and-cream ruff under the neck — the sheltie's
    //  signature collar. Drawn after the body so it overlaps the
    //  shoulder seam.
    // ════════════════════════════════════════════════════════════
    px(20, 13, 4, 8, WHITE);                    // chest white
    px(20, 13, 4, 1, WHITE_S);
    px(19, 14, 1, 6, WHITE_S);                  // chest left shading
    px(20, 20, 4, 1, WHITE_D);                  // chest bottom shadow
    // Ruff fluff peeking up around the neck
    px(21, 11, 4, 3, WHITE);
    px(22, 10, 3, 2, WHITE);
    px(21, 11, 4, 1, WHITE_S);

    // ════════════════════════════════════════════════════════════
    //  HEAD
    //  Long sheltie muzzle, twin pointed ears, white blaze, eye,
    //  black nose. Mouth opens slightly when barking; pink tongue
    //  hangs out when panting.
    // ════════════════════════════════════════════════════════════
    const HX = 22, HY = 3 + HEAD_DROP;
    // Skull dome
    px(HX + 2, HY,     8, 7, SABLE);
    px(HX + 2, HY,     8, 1, SABLE_L);          // forehead highlight
    px(HX + 9, HY + 1, 1, 6, SABLE_M);          // far-side shadow
    // Muzzle — long, tapered
    px(HX + 8, HY + 5, 5, 5, SABLE);
    px(HX + 8, HY + 5, 5, 1, SABLE_L);
    // Chin / lower jaw
    px(HX + 8, HY + 9, 5, 1, SABLE_D);
    // White blaze running down the centre of the muzzle
    px(HX + 5, HY + 1, 2, 9, WHITE);
    px(HX + 5, HY + 1, 2, 1, WHITE_S);
    px(HX + 5, HY + 9, 2, 1, WHITE_D);
    // Cheek edge (mane curl behind the jaw)
    px(HX + 2, HY + 7, 3, 3, SABLE_L);
    // Twin ears — sheltie's signature half-pricked / tipped-forward.
    // Back ear (further from viewer) — slightly behind
    px(HX + 3, HY - 2, 2, 4, SABLE_D);
    px(HX + 4, HY - 1, 1, 1, SABLE_M);
    px(HX + 3, HY - 2, 1, 1, SABLE_M);          // tip-fold lighter
    // Front ear — fully visible, larger
    px(HX + 6, HY - 3, 3, 5, SABLE_D);
    px(HX + 7, HY - 2, 1, 2, SABLE);
    px(HX + 7, HY + 2, 1, 1, SABLE_L);          // ear-base hint
    // Eye — pre-pickup she has big puppy-dog eyes to win the player
    // over; once attached it shrinks to a normal almond shape so she
    // can look more "ready to work" instead of begging.
    if (o.bigEyes) {
      // Rounded big sparkly eye — 4×4 black, with a 2×2 white iris
      // highlight in the upper-left for that anime "shiny" look.
      px(HX + 5, HY + 2, 4, 4, EYE);
      px(HX + 6, HY + 3, 2, 2, EYE_HI);
      px(HX + 7, HY + 4, 1, 1, EYE);    // small pupil inside the highlight
      // A tiny secondary glint
      px(HX + 5, HY + 4, 1, 1, '#ffd76a');
    } else {
      px(HX + 6, HY + 3, 2, 2, EYE);
      px(HX + 7, HY + 3, 1, 1, EYE_HI);
    }
    // Nose — black, slightly larger
    px(HX + 11, HY + 6, 2, 2, NOSE);
    px(HX + 11, HY + 5, 1, 1, NOSE);
    // Open mouth while barking — small dark wedge
    if (barking) {
      px(HX + 9, HY + 8, 3, 2, '#3a1010');
    }
    // Tongue — animated pant. Hangs from lower jaw.
    if (tongue > 0.1) {
      const tw = Math.max(1, Math.round(1 + tongue * 3));
      px(HX + 9, HY + 10, tw, 2, TONGUE);
      px(HX + 9, HY + 11, tw, 1, TONGUE_D);
    }

    // ════════════════════════════════════════════════════════════
    //  LEGS — four legs visible. Trot gait: diagonal pairs in sync.
    //  Each leg has a sable upper section and a WHITE sock at the
    //  foot — the sheltie's iconic four-white-stockings look.
    //  Sitting pose tucks the back legs under and folds them flat
    //  against the rump, while the front legs stand straight.
    // ════════════════════════════════════════════════════════════
    if (sitting) {
      // Back legs are folded against the rump — short stub instead
      // of a full leg, with a tiny white paw curling forward.
      px(7,  25, 5, 2, SABLE);
      px(7,  27, 5, 1, WHITE);
      px(7,  27, 5, 1, WHITE_D);
      // Front legs planted straight, slightly longer than trotting
      // pose so she looks like she's actually seated.
      px(19, 22, 3, 6, SABLE);
      px(19, 28, 3, 1, WHITE);
      px(22, 22, 3, 6, SABLE_M);
      px(22, 28, 3, 1, WHITE_S);
      // Curled tail tip drapes lower when seated
    } else {
      const LY = 22;
      const legCol = SABLE;
      const sockCol = WHITE;
      // Back-LEFT leg (pair B — front-right + back-left)
      px(7 + stepB, LY + liftB, 3, 5, legCol);
      px(7 + stepB, LY + 5 + liftB, 3, 2, sockCol);
      px(7 + stepB, LY + 6 + liftB, 3, 1, WHITE_D);
      // Back-RIGHT leg (pair A) — slightly behind so it reads as the far leg
      px(10 + stepA, LY + liftA, 3, 5, SABLE_M);
      px(10 + stepA, LY + 5 + liftA, 3, 2, WHITE_S);
      // Front-LEFT leg (pair A) — closer to viewer
      px(19 + stepA, LY + liftA, 3, 5, legCol);
      px(19 + stepA, LY + 5 + liftA, 3, 2, sockCol);
      px(19 + stepA, LY + 6 + liftA, 3, 1, WHITE_D);
      // Front-RIGHT leg (pair B) — far front leg, slightly dimmer
      px(22 + stepB, LY + liftB, 3, 5, SABLE_M);
      px(22 + stepB, LY + 5 + liftB, 3, 2, WHITE_S);
    }

    // ════════════════════════════════════════════════════════════
    //  BARK CLOUD — speech-puff in front of the muzzle on attack.
    // ════════════════════════════════════════════════════════════
    if (barking) {
      c.fillStyle = 'rgba(255,255,255,0.88)';
      c.fillRect(X + HX + 14, Y + HY + 5 + bob, 3, 2);
      c.fillRect(X + HX + 16, Y + HY + 4 + bob, 4, 4);
      c.fillRect(X + HX + 20, Y + HY + 5 + bob, 2, 2);
      c.fillStyle = '#ffd76a';
      c.fillRect(X + HX + 17, Y + HY + 5 + bob, 2, 2);
    }

    // ════════════════════════════════════════════════════════════
    //  HURT FLASH — red overlay when she takes a hit.
    // ════════════════════════════════════════════════════════════
    if (hurt) {
      c.globalAlpha = 0.50;
      c.fillStyle = '#ff4848';
      c.fillRect(X + 4, Y + 1 + bob, 32, 26);
      c.globalAlpha = 1;
    }

    c.restore();
  }

  function updateAllies() {
    const ld = getLevelData(); if (!ld || !ld.allies || ld.allies.length === 0) return;
    const MW = 36, MH = 30;          // ally hit-box (matches sprite cell)
    const PICKUP_R = 40;             // collide radius to befriend
    const FOLLOW_DIST = 60;          // resting distance behind player
    // Fetch behaviour — Mackenzie *runs* to nearby items and picks
    // them up by physical overlap instead of magnetizing them. She
    // scans for items within FETCH_SCAN_R; if one's there she paths
    // to it (overriding her follow-the-player target), grabs it on
    // contact, then goes back to following.
    const FETCH_SCAN_R = 220;
    const FETCH_GRAB_R = 24;
    const FETCH_RETURN_R = 240;      // give up if player wanders too far
    const ATTACK_R = 280;            // vicinity for auto-bark target
    const ATTACK_CD = 42;            // ~0.7s between barks
    for (let i = 0; i < ld.allies.length; i++) {
      const a = ld.allies[i];
      if (!a || a._dead) continue;
      a._frame = (a._frame || 0) + 1;
      // Tongue pant cycle (head idle); slows while moving.
      const pantSpeed = a.attached ? 0.06 : 0.10;
      a._tongue = 0.5 + 0.5 * Math.sin(a._frame * pantSpeed);
      // Tail wag — faster when happy (attached or near player)
      const px = player.x + PW / 2, py = player.y + PH / 2;
      const ax = a.x + MW / 2, ay = a.y + MH / 2;
      const dx = px - ax, dy = py - ay;
      const dist = Math.hypot(dx, dy);
      const happy = a.attached || dist < 200;
      a._tail = Math.sin(a._frame * (happy ? 0.34 : 0.16));
      // Face toward player while idle
      if (!a.attached) a.facingRight = (dx >= 0);
      if (a._invuln > 0) a._invuln--;
      if (a._heartCd > 0) a._heartCd--;
      if (a._attackCd > 0) a._attackCd--;
      if (a._barkFrames > 0) a._barkFrames--;
      if (a._hurtFlash > 0) a._hurtFlash--;

      // ── Pickup ────────────────────────────────────────────────
      // Player collides with Mackenzie → she becomes an ally.
      if (!a.attached && Math.abs(player.x + PW/2 - ax) < PICKUP_R && Math.abs(player.y + PH/2 - ay) < PICKUP_R) {
        a.attached = true;
        a.vx = 0; a.vy = 0;
        sfx('coin');           // happy little chime
        spawnRing(ax, ay, '#ffd76a', 14, 20, 3);
        for (let p = 0; p < 8; p++) spawnPart(ax + (Math.random() - 0.5) * 16, ay - 8 + (Math.random() - 0.5) * 16, '#ff8acc', 1, 2.5, 0.06, 'star');
        floatText('🐕 MACKENZIE!', ax - camera.x - 36, ay - camera.y - 24, '#ffaad6');
      }

      // ── AI: idle (sit) vs follow vs ride ──────────────────────
      let moving = false;
      if (!a.attached) {
        // Idle: she sits at her spawn spot waiting for the player.
        // No horizontal drift — sitting front legs are planted, so
        // gliding her sideways would look broken. Every ~3 seconds
        // she gives an excited little hop to draw the player's eye.
        if (a._spawnX == null) a._spawnX = a.x;
        a.x = a._spawnX;
        // Periodic excited hop — fires when she's settled on ground
        // and the cooldown elapses. Counts down each frame; resets to
        // 180 (≈3s @ 60fps) after each hop.
        a._idleHopCd = (a._idleHopCd != null) ? a._idleHopCd - 1 : 30;
        if (a._idleHopCd <= 0 && a.onGround) {
          a.vy = -6.5;
          a.onGround = false;
          a._idleHopCd = 180;
          sfx('jump');
          spawnPart(a.x + 18, a.y + 26, '#ffe88a', 4, 1.5, 0.05);
        }
        a.vy += 0.35;
        if (a.vy > 9) a.vy = 9;
        a.y += a.vy;
        // Drop onto first platform below — use the same active set the
        // player walks on (ground + normal + crumble + timed + …) so
        // Mackenzie doesn't fall through floating platforms.
        const _wanderPlats = (typeof getActivePlatforms === 'function')
          ? getActivePlatforms(ld, true)
          : (ld.platforms || []);
        for (let _pi = 0; _pi < _wanderPlats.length; _pi++) {
          const pl = _wanderPlats[_pi];
          if (!pl) continue;
          if (pl.type === 'water' || pl.type === 'windtunnel' ||
              pl.type === 'grapplehook' || pl.type === 'magnetic') continue;
          if (a.x + MW <= pl.x || a.x >= pl.x + pl.w) continue;
          if (a.y + MH > pl.y && a.y + MH - a.vy <= pl.y + 2) {
            a.y = pl.y - MH; a.vy = 0; a.onGround = true; break;
          }
        }
      } else if (a.riding) {
        // While ridden, Mackenzie's position is driven by the player
        // riding logic (see updatePlayer). She doesn't path on her
        // own — the rider section moves her every tick.
        moving = Math.abs(player.vx) > 0.3;
      } else {
        // ── Pick priority target this tick ────────────────────
        // Enemy in range > item to fetch > follow the player.
        // Stored on the ally so the bark / fetch grab logic
        // further down can read them too.
        const _epool = (typeof enemies !== 'undefined') ? enemies : [];
        let attackTarget = null, attackD2 = ATTACK_R * ATTACK_R;
        for (const e of _epool) {
          if (!e || e.dead || e.hp <= 0) continue;
          const ew = e.w || 32, eh = e.h || 40;
          const ecx = e.x + ew / 2, ecy = e.y + eh / 2;
          const dxe = ecx - ax, dye = ecy - ay;
          const d2 = dxe * dxe + dye * dye;
          if (d2 < attackD2) { attackD2 = d2; attackTarget = e; }
        }
        a._attackTarget = attackTarget;
        // Fetch target (closest collectible) — only when no enemy
        // is around. Avoids her trying to grab a coin sitting on
        // top of an enemy.
        let fetchTarget = null;
        if (!attackTarget) {
          const scanItems = (oArr, hw, hh, kind, collectedFlag) => {
            if (!oArr) return null;
            for (let oi = 0; oi < oArr.length; oi++) {
              const o = oArr[oi]; if (!o) continue;
              if (collectedFlag && o[collectedFlag]) continue;
              const ocx = o.x + (o.w ? o.w / 2 : hw);
              const ocy = o.y + (o.h ? o.h / 2 : hh);
              const odx = ocx - ax, ody = ocy - ay;
              const od  = Math.hypot(odx, ody);
              if (od > FETCH_SCAN_R) continue;
              const pdx = ocx - (player.x + PW / 2);
              const pdy = ocy - (player.y + PH / 2);
              if (Math.hypot(pdx, pdy) > FETCH_RETURN_R) continue;
              return { o, oi, kind, ocx, ocy, od };
            }
            return null;
          };
          // For coin path-finding, scan the LIVE collectibles pool —
          // ld.coins still lists coins the player has already grabbed,
          // so chasing it would send her after ghosts.
          const _coinSrc = (typeof collectibles !== 'undefined') ? collectibles : null;
          const _candidates = [
            scanItems(_coinSrc,          8,  8, 'coin',   'collected'),
            scanItems(ld.powerupItems, 14, 14, 'powerup'),
            scanItems(ld.marsBarPieces, 12, 12, 'mars',   'collected'),
            scanItems(ld.spiritEmbers,  10, 10, 'ember',  'collected'),
            scanItems(ld.qblocks,       14, 14, 'qblock'),
            scanItems(ld.cblocks,       14, 14, 'cblock'),
            scanItems(ld.trophies,      12, 12, 'trophy', 'collected'),
          ].filter(Boolean);
          for (const c of _candidates) {
            if (!fetchTarget || c.od < fetchTarget.od) fetchTarget = c;
          }
        }
        a._fetchTarget = fetchTarget;

        // ── Compute movement destination ──────────────────────
        let followX, followY, mode = 'follow';
        if (attackTarget) {
          // Stand next to the enemy — approach from the side she's
          // already on so she doesn't run THROUGH the enemy to flank.
          const ew = attackTarget.w || 32, eh = attackTarget.h || 40;
          const ecx = attackTarget.x + ew / 2, ecy = attackTarget.y + eh / 2;
          const STAND_OFFSET = 34;
          const side = (ax < ecx) ? -1 : 1;
          followX = ecx + side * STAND_OFFSET - MW / 2;
          followY = ecy - MH / 2;
          mode = 'attack';
        } else if (fetchTarget) {
          followX = fetchTarget.ocx - MW / 2;
          followY = fetchTarget.ocy - MH / 2;
          mode = 'fetch';
        } else {
          followX = player.x - (player.facingRight ? FOLLOW_DIST : -FOLLOW_DIST);
          followY = player.y;
        }
        const fdx = followX - a.x;
        const fdy = followY - a.y;

        // ── Horizontal pursuit + speed cap ────────────────────
        // Faster pull when she has a real target to chase.
        const followStrength = (mode !== 'follow') ? 0.20 : 0.10;
        const followCap      = (mode !== 'follow') ? 7.5  : 6;
        a.vx = fdx * followStrength;
        if (Math.abs(a.vx) > followCap) a.vx = Math.sign(a.vx) * followCap;
        a.x += a.vx;

        // ── Jump to reach a target above her ──────────────────
        // She can jump twice — ground jump + one mid-air jump — so a
        // ledge that would normally need a Highland Charge to reach
        // is reachable for her too. Cooldown stops her chain-jumping
        // every tick if she still can't make it.
        a._jumpCd = Math.max(0, (a._jumpCd || 0) - 1);
        const targetAbove = fdy < -28 && Math.abs(fdx) < 220;
        const canGroundJump = a.onGround && a._jumpCd <= 0;
        // Air jump: not grounded, has the bonus charge, target still
        // significantly higher, vy is at or past peak (we're falling
        // or near apex) so the second jump doesn't fire mid-rise.
        const canAirJump = !a.onGround && (a._airJumpsLeft || 0) > 0 && targetAbove && a.vy > -3 && a._jumpCd <= 0;
        if (canGroundJump && targetAbove) {
          a.vy = -10.5;
          a.onGround = false;
          a._airJumpsLeft = 1;        // bank one mid-air jump
          a._jumpCd = 22;
          sfx('jump');
          spawnPart(ax, ay + MH - 4, '#ffd76a', 5, 2.4, 0.06);
        } else if (canAirJump) {
          a.vy = -9.5;                // double-jump kicker
          a._airJumpsLeft = 0;
          a._jumpCd = 22;
          sfx('jump');
          // Slightly different particle so the player can see it's
          // her second jump.
          spawnRing(ax, ay + MH / 2, '#ffe88a', 6, 12, 1.6);
          spawnPart(ax, ay + MH / 2, '#fff5b0', 5, 2.2, 0.06);
        } else {
          a.vy += 0.4;
          if (a.vy > 10) a.vy = 10;
        }
        a.y += a.vy;

        // ── Land on platforms ────────────────────────────────
        let landed = false;
        for (const pl of (ld.platforms || [])) {
          if (!pl || (pl.type && pl.type !== 'ground' && pl.type !== 'oneway')) continue;
          if (a.x + MW <= pl.x || a.x >= pl.x + pl.w) continue;
          if (a.y + MH > pl.y && a.y + MH - a.vy <= pl.y + 4) {
            a.y = pl.y - MH; a.vy = 0; a.onGround = true; landed = true;
            // Touching ground refreshes her air-jump charge.
            a._airJumpsLeft = 1;
            break;
          }
        }
        if (!landed) a.onGround = false;

        // Soft vertical pull when she lags far behind the player.
        if (Math.abs(fdy) > 80 && !a.onGround && mode === 'follow') a.y += Math.sign(fdy) * 1.2;
        // Teleport if she falls way behind / off the map.
        if (a.y > (ld.voidY || 560) + 80 || Math.abs(player.x - a.x) > 500) {
          a.x = player.x - 50; a.y = player.y - 10; a.vx = 0; a.vy = 0;
        }
        moving = Math.abs(a.vx) > 0.3;
        // Facing rule:
        //   • attack mode → face the enemy she's barking at
        //   • everything else (follow / fetch / idle drift) → face
        //     the player so she's always looking at her bagpiper.
        // This makes her trot backward toward a fetch item while
        // still looking at you, like a sheepdog watching its handler.
        if (mode === 'attack') {
          a.facingRight = (attackTarget.x + (attackTarget.w || 32) / 2) > ax;
        } else {
          a.facingRight = ((player.x + PW / 2) >= ax);
        }
      }
      a._moving = moving;

      // ── Anything Mackenzie's body touches gets picked up ────
      // Don't restrict the grab to her current fetch target — she'd
      // happily run past a coin that wasn't the closest one when she
      // started chasing. Instead, sweep her inflated hit-box against
      // every collectible array and grab anything we touch. Using a
      // proper AABB overlap so jump arcs sweeping past for 1–2 frames
      // still collect reliably.
      if (a.attached && !a.riding && !a._dead) {
        // Inflate her sprite cell by 4 px on each side — "wide mouth"
        const _mx = a.x - 4, _my = a.y - 4;
        const _mw = MW + 8, _mh = MH + 8;
        const collide = (ix, iy, iw, ih) => (
          _mx < ix + iw && _mx + _mw > ix && _my < iy + ih && _my + _mh > iy
        );
        // Coins — the renderer + player collection both read the
        // global `collectibles` pool (ld.coins is just spawn data,
        // copied into `collectibles` at level init). Marking them
        // collected here is what actually removes them from the
        // screen and credits the player. Splicing ld.coins didn't.
        if (typeof collectibles !== 'undefined' && collectibles) {
          for (const c of collectibles) {
            if (!c || c.collected) continue;
            if (!collide(c.x, c.y, c.w || 16, c.h || 16)) continue;
            c.collected = true; coins++; score += 10;
            spawnRing(c.x + 8, c.y + 8, '#ffd76a', 6, 12, 2);
            sfx('coin');
            if (typeof updateHUD === 'function') updateHUD();
          }
        }
        // Powerup items
        if (ld.powerupItems) {
          for (let oi = ld.powerupItems.length - 1; oi >= 0; oi--) {
            const pu = ld.powerupItems[oi]; if (!pu) continue;
            if (!collide(pu.x, pu.y, pu.w || 28, pu.h || 28)) continue;
            score += 20;
            spawnRing(pu.x + 14, pu.y + 14, '#88ddff', 8, 14, 2);
            sfx('powerup'); ld.powerupItems.splice(oi, 1);
          }
        }
        // Mars-bar pieces
        if (ld.marsBarPieces) {
          for (const mb of ld.marsBarPieces) {
            if (!mb || mb.collected) continue;
            if (!collide(mb.x - 12, mb.y - 12, 24, 24)) continue;
            mb.collected = true; score += 100;
            spawnRing(mb.x, mb.y, '#c8642a', 10, 16, 2); sfx('powerup');
            floatText('🍫', mb.x - camera.x, mb.y - camera.y - 12, '#c8642a');
          }
        }
        // Spirit embers
        if (ld.spiritEmbers) {
          for (const em of ld.spiritEmbers) {
            if (!em || em.collected) continue;
            if (!collide(em.x - 10, em.y - 10, 20, 20)) continue;
            em.collected = true; score += 250;
            spawnRing(em.x, em.y, '#ff8822', 12, 18, 2); sfx('powerup');
            floatText('🔥', em.x - camera.x, em.y - camera.y - 12, '#ff8822');
          }
        }
        // ? blocks and coin blocks — bump them on contact.
        const _bumpBlock = (o) => {
          if (!o || o._hit) return;
          o._hit = true; o.bumpTimer = 14;
          score += 10; coins++; sfx('coin');
          spawnPart(o.x + 14, o.y + 14, '#ffd76a', 6, 3);
        };
        if (ld.qblocks) for (const q of ld.qblocks) {
          if (q && collide(q.x, q.y, q.w || 28, q.h || 28)) _bumpBlock(q);
        }
        if (ld.cblocks) for (const cb of ld.cblocks) {
          if (cb && collide(cb.x, cb.y, cb.w || 28, cb.h || 28)) _bumpBlock(cb);
        }
        // Trophies
        if (ld.trophies) {
          for (const t of ld.trophies) {
            if (!t || t.collected) continue;
            if (!collide(t.x - 12, t.y - 12, 24, 24)) continue;
            t.collected = true; score += 200;
            spawnRing(t.x, t.y, '#ffd76a', 14, 22, 2); sfx('powerup');
            floatText('🏆', t.x - camera.x, t.y - camera.y - 12, '#ffd76a');
          }
        }
        // Clear the chase target whenever it has been grabbed —
        // forces a fresh scan next tick.
        if (a._fetchTarget) {
          const t = a._fetchTarget.o;
          const k = a._fetchTarget.kind;
          const gone = !t
            || t.collected
            || (k === 'powerup' && ld.powerupItems && !ld.powerupItems.includes(t));
          if (gone) a._fetchTarget = null;
        }
      }

      // ── Auto-attack (attached, including while ridden) ───────
      // Mackenzie keeps barking at enemies even when you're riding
      // her — she's a fierce companion. Range / cooldown bumped so
      // the player actually sees her contributing in combat.
      // Bite range — bark only fires when she's physically next to
      // the target. The movement code above paths her to a position
      // STAND_OFFSET (~34px) away, so a slightly larger bite radius
      // catches "I'm in position, take the swing" frames.
      const BITE_R = 60;
      const _attackEnemy = a.attached && a._attackTarget && !a._attackTarget.dead && a._attackTarget.hp > 0
        ? a._attackTarget : null;
      if (a.attached && a._attackCd <= 0 && _attackEnemy) {
        const e = _attackEnemy;
        const ew = e.w || 32, eh = e.h || 40;
        const ecx = e.x + ew / 2, ecy = e.y + eh / 2;
        const _bd2 = (ecx - ax) * (ecx - ax) + (ecy - ay) * (ecy - ay);
        const best = (_bd2 < BITE_R * BITE_R) ? e : null;
        if (best) {
          a._attackCd = ATTACK_CD;
          a._barkFrames = 16;
          const bw = best.w || 32, bh = best.h || 40;
          const bcx = best.x + bw / 2, bcy = best.y + bh / 2;
          // Face the target so the bark cloud points the right way.
          a.facingRight = (bcx > ax);
          const kbDir = Math.sign(bcx - ax) || 1;
          // Apply damage + knockback + stun. Set best.vx directly so
          // the enemy visibly jolts on impact, not just hp tick.
          best.hp -= 2;
          best.stun = Math.max(best.stun || 0, 25);
          best.vx = kbDir * 4.5;
          best._kbVx = kbDir * 5;
          best._kbVy = -2.5;
          // Audible bark — distinct two-note "woof-woof" so the
          // player can actually hear Mackenzie attacking instead of
          // it blending into the generic hit sfx.
          sfx('bark');
          // Visible bark streak — yellow sparks fly toward the target.
          for (let _bp = 0; _bp < 8; _bp++) {
            spawnPart(
              ax + (a.facingRight ? 24 : 4) + _bp * kbDir * 8,
              ay + 6 + (_bp - 4) * 1.2,
              _bp < 3 ? '#fff5b0' : '#ffd76a',
              1, 3.5, 0.02, 'spark'
            );
          }
          spawnRing(ax + (a.facingRight ? 24 : 4), ay + 6, '#ffd76a', 8, 16, 3);
          spawnRing(bcx, bcy, '#ff8a48', 6, 10, 2);
          floatText('WOOF!', ax - camera.x - 12, ay - camera.y - 28, '#ffd76a');
          if (best.hp <= 0) {
            best.dead = true;
            score += 50;
            spawnPart(bcx, bcy, '#ff8a48', 14, 4.5, 0.18);
          }
        }
      }

      // ── Enemy collision damage to Mackenzie ───────────────────
      // Same fix as the attack: read the live `enemies` pool, not the
      // spawn-data ld.enemies. On contact she rolls a dodge — 70%
      // chance she leaps clear of the hit, 30% chance the bite lands.
      if (a.attached && !a._dead && a._invuln <= 0) {
        const _hpool = (typeof enemies !== 'undefined') ? enemies : [];
        for (const e of _hpool) {
          if (!e || e.dead || e.hp <= 0) continue;
          const _ew = e.w || 32, _eh = e.h || 40;
          const _ecx = e.x + _ew / 2, _ecy = e.y + _eh / 2;
          if (Math.abs(_ecx - ax) < (MW/2 + _ew/2 - 6)
           && Math.abs(_ecy - ay) < (MH/2 + _eh/2 - 6)) {
            const _dodged = Math.random() >= 0.30;   // 70% miss, 30% hit
            if (_dodged) {
              // Visible side-leap away from the enemy — she's quick.
              const dDir = Math.sign(ax - _ecx) || (a.facingRight ? -1 : 1);
              a.vx = dDir * 6;
              a.x += dDir * 6;
              if (a.onGround) {
                a.vy = -7;
                a.onGround = false;
              }
              a._invuln = 18;            // brief grace so we don't reroll the same frame
              a._dodging = 10;
              sfx('jump');
              spawnPart(ax, ay + MH - 4, '#88ddff', 6, 3, 0.06);
              floatText('DODGE!', ax - camera.x - 16, ay - camera.y - 24, '#88ddff');
            } else {
              a.hp--;
              a._invuln = 60;
              a._hurtFlash = 16;
              sfx('hurt');
              floatText('-1', ax - camera.x, ay - camera.y - 26, '#ff6a6a');
              if (a.hp <= 0) {
                a._dead = true; a.attached = false; a.riding = false;
                spawnRing(ax, ay, '#ff6a6a', 16, 24, 3);
                floatText('🐕 ✕', ax - camera.x - 8, ay - camera.y - 24, '#ff6a6a');
              }
            }
            break;
          }
        }
      }
      if (a._dodging > 0) a._dodging--;

      // ── Floating hearts when player is close (cosmetic affection) ──
      if (a.attached && a._heartCd <= 0 && dist < 80) {
        a._heartCd = 90 + Math.floor(Math.random() * 60);
        floatText('♥', ax - camera.x + (Math.random() - 0.5) * 18, ay - camera.y - 14, '#ff7fb0');
      }
    }
  }
  // ── Exports ────────────────────────────────────────────────────
  window.GameAllies = { drawMackenzie, updateAllies };
  window.drawMackenzie = drawMackenzie;
  window.updateAllies  = updateAllies;
})();
