// src/enemies.js
// ──────────────────────────────────────────────────────────────────
// Per-frame enemy update — `updateEnemies()` runs the AI switch for
// every variant in the level's `enemies` array. Hot path.
//
// Reads/writes a lot of engine state via bare-name globals: player,
// camera, enemies, projectiles, enemyProjectiles, frameCount, sfx,
// getLevelData, weatherState, screenShake, particles, sprites helpers
// (drawBagpiper32 isn't called here; the enemy sprites have their own
// per-variant drawers — but those still live inline for now).
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  function updateEnemies() {
    const ld = getLevelData();
    // Mars Bar piece pickup detection (logic only — drawing happens in drawScene).
    for (const mb of (ld.marsBarPieces || [])) {
      if (mb.collected) continue;
      if (overlap(player.x - 8, player.y - 8, PW + 16, PH + 24, mb.x - 20, mb.y - 24, 40, 48)) {
        mb.collected = true;
        sfx('powerup_spawn');
        spawnPart(mb.x, mb.y, '#c8642a', 12, 5, 0.1, 'star');
        const a = ld.marsBarPieces || [];
        const g = a.filter(p => p.collected).length;
        floatText('🍫 ' + g + '/' + a.length, mb.x - camera.x - 20, mb.y - camera.y - 30, '#c8642a');
        updateHUD();
        if (g === a.length) {
          floatText('🍫 CASTLE UNLOCKED!', player.x - camera.x - 60, player.y - camera.y - 50, '#ff9944');
          sfx('invincible_start');
        }
      }
    }

    for (const e of enemies) {
      if (e.dead) continue;
      if (e.hp <= 0) {
        e.dead = true;
        // Bosses (v=6 mini, v=99/98/97 mega-class) all award the big
        // 5000-point bounty + a full explosion fanfare.
        const _isBoss = (e.v === 6 || e.v === 99 || e.v === 98 || e.v === 97 || e.v === 96);
        const baseScore = _isBoss ? 5000 : e.v === 11 ? 350 : e.elite ? 400 : e.v >= 7 ? 250 : 150;
        score += baseScore;
        if (_isBoss) {
          for (let i = 0; i < 40; i++) spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#1a6a3a', 1, 8, 0.12, 'star');
          for (let i = 0; i < 40; i++) spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ff9900', 1, 6, 0.1, 'spark');
          spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 16, 40, 4);
          sfx('bomb_explode');
        } else if (e.v === 9) {
          // Split into 2 smaller enemies
          sfx('split');
          spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#00ffaa', 10, 15, 3);
          for (let si = 0; si < 2; si++) {
            const child = {
              x: e.x + si * 20, y: e.y, v: 0, hp: 2, maxHp: 2, w: 20, h: 30,
              vx: (si === 0 ? -2 : 2), vy: -4, vy0: 0, onGround: false, stun: 0, dead: false,
              jumpTimer: 20, shootTimer: 999, chargeTimer2: 0, charging: false, isChild: true
            };
            enemies.push(child);
          }
        } else if (e.elite) {
          sfx('elite_die');
          spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#ffd700', 12, 20, 4);
          spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ffd700', 20, 6, 0.1, 'star');
        } else {
          spawnPart(e.x + 16, e.y + 22, '#e74c3c', 12, 5, 0.12, 'circle');
          spawnPart(e.x + 16, e.y + 22, '#ff9900', 8, 4, 0.1, 'spark');
          sfx('enemy_die');
        }
        floatText((_isBoss ? '+5000' : e.elite ? '+400' : e.v >= 7 ? '+250' : '+150'), e.x - camera.x + e.w / 2 - 20, e.y - camera.y, '#e74c3c');
        updateHUD(); continue;
      }
      // Tick the stun re-application cooldown every frame (regardless
      // of whether the enemy is currently stunned) — this is what
      // guarantees the free-action gap between stuns.
      if (e._stunCd > 0) e._stunCd--;
      if (e.stun > 0) { e.stun--; if (e.v !== 11) continue; }

      // ─── v=11: Shadow twin — follows your path delayed; drum shockwave hazard ───
      if (e.v === 11) {
        // Auto-spawn the full pack of MAX_TWINS on first update of any placed twin
        if (e._twinIndex === undefined) {
          e._twinIndex = 0;
          for (let ti = 1; ti < MAX_TWINS; ti++) {
            enemies.push({
              v: 11, hp: e.hp, maxHp: e.maxHp, w: e.w || 32, h: e.h || 44,
              x: e.x, y: e.y, vx: 0, vy: 0, onGround: true,
              stun: 0, dead: false, elite: e.elite,
              jumpTimer: 0, shootTimer: 0, chargeTimer2: 0, charging: false,
              _twinIndex: ti,
              _drumCd: Math.floor(SHADOW_DRUM_INTERVAL_FRAMES * ti / MAX_TWINS)
            });
          }
        }
        const twinDelay = SHADOW_PATH_DELAY_FRAMES + (e._twinIndex || 0) * TWIN_STAGGER_FRAMES;
        const lagIdx = playerPathTrail.length - 1 - twinDelay;
        const hasTrail = lagIdx >= 0;
        const idx = lagIdx >= 0 ? lagIdx : 0;
        const pt = playerPathTrail[idx];
        const ptPrev = playerPathTrail[Math.max(0, idx - 1)];
        e._isFollowing = hasTrail;
        if (pt && hasTrail) {
          e.x = pt.x;
          e.y = pt.y;
          if (ptPrev) e.facingRight = pt.x >= ptPrev.x;
          // No free-moving trail particles for twins; visual pulse is rendered anchored in draw().
        }
        e.vx = 0; e.vy = 0; e.onGround = true;
        if (hasTrail) e._drumCd = (e._drumCd || 0) + 1;
        // Warn player 25 frames before drum fires
        if (hasTrail && e._drumCd === SHADOW_DRUM_INTERVAL_FRAMES - 25 && (e._twinIndex || 0) === 0) sfx('shadow_warn');
        if (hasTrail && e._drumCd >= SHADOW_DRUM_INTERVAL_FRAMES) {
          e._drumCd = 0;
          e._pulseT = 26;
          const ecx = e.x + (e.w || 32) / 2, ecy = e.y + (e.h || 44) / 2;
          const pcx = player.x + PW / 2, pcy = player.y + PH / 2;
          const dist = Math.hypot(pcx - ecx, pcy - ecy);
          if ((player.starInvincible || 0) <= 0 && (player.invincible || 0) <= 0) {
            if (dist < SHADOW_DRUM_KILL_R) {
              player.hp = 0;
              sfx('player_die');
              screenShake = Math.max(screenShake, 16);
            } else if (dist < SHADOW_DRUM_SLOW_R) {
              player.drumSlow = Math.max(player.drumSlow || 0, 80);
            }
          }
          if ((e._twinIndex || 0) === 0) sfx('shadow_drum');
          e._pulseX = ecx; e._pulseY = ecy;
          // Keep drum pulse visuals anchored to the twin (drawn via _pulseT) and avoid
          // free-moving purple particles that can look like they chase the player.
        }
        if ((e._pulseT || 0) > 0) e._pulseT--;

        if (player.chargeOn && !e._invis && overlap(player.x - 8, player.y, PW + 16, PH, e.x, e.y, e.w, e.h)) {
          e.hp -= 3;
          if (window.applyEnemyStun) window.applyEnemyStun(e, 25); else e.stun = 25;
          spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ff6600', 10, 5);
        }
        if (player.starInvincible > 50 && !e.dead && !e._invis && overlap(player.x - 4, player.y - 4, PW + 8, PH + 8, e.x, e.y, e.w, e.h)) {
          e.hp = 0; e.dead = true;
          score += e.elite ? 400 : 350; updateHUD();
          const _ex = e.x + e.w / 2, _ey = e.y + e.h / 2;
          spawnPart(_ex, _ey, '#9040ff', 28, 7, 0.12, 'star');
          spawnRing(_ex, _ey, '#aa66ff', 14, 32, 3);
          screenShake = Math.max(screenShake, 8);
          floatText('SHADOW FADES!', e.x - camera.x - 40, e.y - camera.y - 30, '#cc88ff');
          sfx('jump');
        }
        if (player.shieldOn && !e._invis && overlap(player.x - 8, player.y - 8, PW + 16, PH + 16, e.x, e.y, e.w, e.h)) {
          e.hp--;
          if (window.applyEnemyStun) window.applyEnemyStun(e, 45); else e.stun = 45;
          spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#7fff00', 8, 4);
        }
        continue;
      }

      if (e.v === 6) {
        e.shootTimer = (e.shootTimer || 0) - 1;
        e.jumpTimer = (e.jumpTimer || 0) - 1;

        e.vx = e.x > player.x ? -1.5 : 1.5;

        if (e.jumpTimer <= 0 && e.onGround) {
          e.vy = JFORCE * 0.8; e.jumpTimer = 180 + Math.random() * 120;
        }

        if (e.shootTimer <= 0) {
          for (let i = -1; i <= 1; i++) {
            const speed = 5.5;
            enemyProjectiles.push({
              x: e.x + e.w / 2, y: e.y + e.h / 2 + i * 20,
              vx: (e.x > player.x ? -1 : 1) * speed, vy: i * 2 - 1,
              life: 200, fromEnemy: true, type: 'boss_note'
            });
          }
          sfx('hit');
          e.shootTimer = e.hp < 25 ? 65 : 110;
        }
      } else if (e.v === 3) {
        e.jumpTimer = (e.jumpTimer || 0) - 1;
        if (e.jumpTimer <= 0 && e.onGround) { e.vy = JFORCE * 0.75; e.jumpTimer = 120 + Math.floor(Math.random() * 80); }
      } else if (e.v === 4) {
        e.shootTimer = (e.shootTimer || 0) - 1;
        const dx = player.x - e.x, dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (e.shootTimer <= 0 && dist < 500 && e.onGround) {
          const speed = 4.5; const nx = dx / dist, ny = dy / dist;
          enemyProjectiles.push({ x: e.x + 16, y: e.y + 10, vx: nx * speed, vy: ny * speed - 0.5, life: 120, fromEnemy: true });
          sfx('hit'); spawnPart(e.x + 16, e.y + 8, '#ff6600', 5, 2.5);
          e.shootTimer = 180 + Math.floor(Math.random() * 60);
        }
      } else if (e.v === 5) {
        e.chargeTimer2 = (e.chargeTimer2 || 0) - 1;
        const dx = player.x - e.x; const dist = Math.abs(dx);
        if (!e.charging && dist < 300 && e.chargeTimer2 <= 0) {
          e.charging = true; e.vx = (dx > 0 ? 1 : -1) * 5; e.chargeTimer2 = 50; spawnPart(e.x + 16, e.y + 22, '#00e8ff', 8, 3);
        }
        if (e.charging && e.chargeTimer2 <= 0) {
          e.charging = false; e.vx = (Math.random() > .5 ? 1 : -1) * 1.2; e.chargeTimer2 = 120 + Math.floor(Math.random() * 60);
        }
      } else if (e.v === 99) {
        // ─── v=99: BOSS — 3-phase HP, telegraphed attacks ─────────────
        // Big foe with maxHp = 30 (10 per phase). Slow patrol within
        // ±_bossPatrol px of spawn. Every _bossAttackCd frames picks an
        // attack from this phase's pool, telegraphs for ~60 frames
        // (flashes red), then fires.
        //
        // Phase 1 (hp > 20): { slam }
        // Phase 2 (hp 10..20): { slam, projectile_fan }
        // Phase 3 (hp ≤ 10): { slam, projectile_fan, sweep }   (faster pace)
        if (e._bossInit === undefined) {
          e._bossInit = true;
          e._bossSpawnX = e.x;
          e._bossPatrol = 220;
          e._bossAttackCd = 120;       // wait 2 sec before first attack
          e._bossTeleFrames = 0;       // > 0 while telegraphing
          e._bossAttack = null;        // 'slam' | 'fan' | 'sweep'
          e._bossPhase = 1;
          e._bossName = 'BOSS';
        }
        // Phase transitions tinted by HP thresholds
        const _hpPct = e.hp / Math.max(1, e.maxHp);
        const _phase = _hpPct > 0.66 ? 1 : _hpPct > 0.33 ? 2 : 3;
        if (_phase !== e._bossPhase) {
          e._bossPhase = _phase;
          spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#ff4444', 8, 28, 4);
          sfx('hit');
        }
        const _phaseAttackCd = _phase === 1 ? 180 : _phase === 2 ? 150 : 110;
        const _patrolSpeed   = _phase === 1 ? 0.6 : _phase === 2 ? 0.9 : 1.2;
        // Patrol
        if (!e._bossTeleFrames && !e._bossAttack) {
          if (e.x < e._bossSpawnX - e._bossPatrol) e.vx = _patrolSpeed;
          else if (e.x > e._bossSpawnX + e._bossPatrol) e.vx = -_patrolSpeed;
          else if (Math.abs(e.vx) < 0.1) e.vx = (player.x > e.x ? 1 : -1) * _patrolSpeed;
        }
        // Telegraph / pick next attack
        if (e._bossAttackCd > 0) e._bossAttackCd--;
        if (e._bossAttackCd === 0 && !e._bossTeleFrames && !e._bossAttack) {
          // Pick an attack from this phase's pool
          const pool = _phase === 1 ? ['slam']
                      : _phase === 2 ? ['slam', 'fan']
                      : ['slam', 'fan', 'sweep'];
          e._bossAttack = pool[Math.floor(Math.random() * pool.length)];
          e._bossTeleFrames = 60;
          e.vx = 0;
          sfx('hit');
        }
        // Render-time flash effect is via e._bossTeleFrames > 0 (drawScene
        // can read this for a red overlay). We don't draw boss sprite
        // here, just the AI.
        if (e._bossTeleFrames > 0) {
          e._bossTeleFrames--;
          // Pulse particles during wind-up
          if (e._bossTeleFrames % 6 === 0) {
            spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ff4444', 4, 3, 0.05);
          }
          if (e._bossTeleFrames === 0) {
            // Execute the attack
            const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
            if (e._bossAttack === 'slam') {
              // Slam: jump up and back down, releasing a shockwave on
              // contact. Implemented as: -vy + a delayed shockwave check.
              e.vy = -14;
              e._slamArmed = true;
              sfx('skirl');
            } else if (e._bossAttack === 'fan') {
              // 5-bullet projectile fan toward player
              const dx = player.x - cx, dy = player.y - cy;
              const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
              const nx = dx / dist, ny = dy / dist;
              // 5 angles: -30°, -15°, 0°, +15°, +30°
              for (const ang of [-0.52, -0.26, 0, 0.26, 0.52]) {
                const ca = Math.cos(ang), sa = Math.sin(ang);
                const rx = nx * ca - ny * sa, ry = nx * sa + ny * ca;
                const speed = 4.0;
                enemyProjectiles.push({
                  x: cx, y: cy,
                  vx: rx * speed, vy: ry * speed,
                  life: 180, fromEnemy: true, type: 'boss_note',
                });
              }
              sfx('hit');
            } else if (e._bossAttack === 'sweep') {
              // Charge toward player at speed 5 for 50 frames
              e._sweepFrames = 50;
              e.vx = (player.x > e.x ? 1 : -1) * 5;
              sfx('charge');
            }
            e._bossAttack = null;
            e._bossAttackCd = _phaseAttackCd;
          }
        }
        // Slam-shockwave: when boss lands after a slam-jump and _slamArmed
        // is true, spawn a damaging ring at impact point.
        if (e._slamArmed && e.onGround && e.vy >= 0) {
          e._slamArmed = false;
          screenShake = Math.max(screenShake, 20);
          spawnRing(e.x + e.w / 2, e.y + e.h, '#ff8a3a', 14, 80, 5);
          // Damage if player is within 140 px AND on ground
          const px = player.x + PW / 2, py = player.y + PH / 2;
          const bx = e.x + e.w / 2, by = e.y + e.h;
          const dist = Math.sqrt((px - bx) ** 2 + (py - by) ** 2);
          if (dist < 140 && player.onGround && player.invincible <= 0) {
            player.hp -= 2; player.invincible = 60;
            sfx('hit');
          }
        }
        // Sweep windup wears off
        if (e._sweepFrames > 0) {
          e._sweepFrames--;
          if (e._sweepFrames === 0) e.vx = 0;
        }
      } else if (e.v === 98) {
        // ─── v=98 SUMMONER — hovering conjurer ─────────────────────────
        // Floats above the arena (no gravity). Phase-gated attack pool:
        //   Phase 1 (hp > 66%): { summon }
        //   Phase 2 (33–66%):   { summon, orb }
        //   Phase 3 (≤ 33%):    { summon, orb, blink } — faster pace
        // Summons basic drum minions; orb is a fast aimed shot; blink
        // teleports above the player. maxHp ≈ 40 recommended.
        if (e._bossInit === undefined) {
          e._bossInit = true;
          e._float = true;                 // skip gravity (see physics above)
          e._bossSpawnX = e.x;
          e._bossSpawnY = e.y;
          e._bossAttackCd = 120;
          e._bossTeleFrames = 0;
          e._bossAttack = null;
          e._bossPhase = 1;
          e._bossName = 'SUMMONER';
        }
        const _hpPct98 = e.hp / Math.max(1, e.maxHp);
        const _phase98 = _hpPct98 > 0.66 ? 1 : _hpPct98 > 0.33 ? 2 : 3;
        if (_phase98 !== e._bossPhase) {
          e._bossPhase = _phase98;
          spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#aa66ff', 8, 30, 4);
          sfx('hit');
        }
        // Hover — gentle vertical bob + drift to keep ~140 px from player.
        e.vy = Math.sin(frameCount * 0.05) * 0.9;
        if (!e._bossTeleFrames && !e._bossAttack) {
          const targetX = player.x + (e.x > player.x ? 150 : -150);
          e.vx = Math.max(-1.6, Math.min(1.6, (targetX - e.x) * 0.02));
          // Keep the boss from drifting into the floor / off the top.
          if (e.y < e._bossSpawnY - 80) e.vy = Math.abs(e.vy);
          if (e.y > e._bossSpawnY + 80) e.vy = -Math.abs(e.vy);
        }
        if (e._bossAttackCd > 0) e._bossAttackCd--;
        if (e._bossAttackCd === 0 && !e._bossTeleFrames && !e._bossAttack) {
          // Bigger, attack-dense pools — phase 3 adds a relentless
          // multi-orb 'barrage'. Telegraph is short (38 fr) so the
          // player has to read the wind-up fast.
          const pool98 = _phase98 === 1 ? ['summon', 'orb']
                       : _phase98 === 2 ? ['summon', 'orb', 'orb', 'blink']
                       : ['summon', 'orb', 'blink', 'barrage', 'barrage'];
          e._bossAttack = pool98[Math.floor(Math.random() * pool98.length)];
          e._bossTeleFrames = 38;
          e.vx = 0;
          sfx('skirl');
        }
        // Active barrage — fire an orb every few frames for a burst.
        if (e._barrage > 0) {
          e._barrage--;
          if (e._barrage % 10 === 0) {
            const bcx = e.x + e.w / 2, bcy = e.y + e.h / 2;
            const bdx = player.x - bcx, bdy = player.y - bcy;
            const bdist = Math.max(1, Math.hypot(bdx, bdy));
            const bsp = 5.6;
            // Aimed pair with a slight spread
            for (const sp of [-0.16, 0.16]) {
              const ca = Math.cos(sp), sa = Math.sin(sp);
              const rx = (bdx / bdist) * ca - (bdy / bdist) * sa;
              const ry = (bdx / bdist) * sa + (bdy / bdist) * ca;
              enemyProjectiles.push({
                x: bcx, y: bcy, vx: rx * bsp, vy: ry * bsp - 0.4,
                life: 200, fromEnemy: true, type: 'boss_note',
              });
            }
            sfx('hit');
          }
        }
        if (e._bossTeleFrames > 0) {
          e._bossTeleFrames--;
          if (e._bossTeleFrames % 5 === 0) {
            spawnPart(e.x + e.w / 2, e.y + e.h, '#aa66ff', 4, 3, -0.04);
          }
          if (e._bossTeleFrames === 0) {
            const cx98 = e.x + e.w / 2, cy98 = e.y + e.h / 2;
            if (e._bossAttack === 'summon') {
              // Spawn 2-4 minions. From phase 2 one is a SHOOTER (v=4);
              // minions are tougher (hp 3) than the old hp-2 fodder.
              const n98 = _phase98 === 3 ? 4 : _phase98 === 2 ? 3 : 2;
              for (let s = 0; s < n98; s++) {
                const isShooter = (_phase98 >= 2 && s === 0);
                enemies.push({
                  x: e.x + e.w / 2 + (s - (n98 - 1) / 2) * 40, y: e.y + e.h,
                  v: isShooter ? 4 : 0, hp: 3, maxHp: 3, w: 32, h: 44,
                  vx: (Math.random() > 0.5 ? 1 : -1) * 1.4, vy: 0,
                  elite: false, onGround: false, stun: 0, dead: false,
                  facingRight: true, spawnX: e.x, patrolRange: 150,
                  jumpTimer: 40, shootTimer: 60, chargeTimer2: 0,
                  _summoned: true,
                });
              }
              spawnRing(cx98, e.y + e.h, '#aa66ff', 12, 26, 3);
              sfx('powerup');
            } else if (e._bossAttack === 'orb') {
              // Orb SPREAD — width scales with phase (1 / 3 / 5 orbs).
              const dx98 = player.x - cx98, dy98 = player.y - cy98;
              const dist98 = Math.max(1, Math.hypot(dx98, dy98));
              const nx98 = dx98 / dist98, ny98 = dy98 / dist98;
              const sp98 = 5.6;
              const angs98 = _phase98 === 1 ? [0]
                           : _phase98 === 2 ? [-0.32, 0, 0.32]
                           : [-0.5, -0.25, 0, 0.25, 0.5];
              for (const ang of angs98) {
                const ca = Math.cos(ang), sa = Math.sin(ang);
                const rx = nx98 * ca - ny98 * sa;
                const ry = nx98 * sa + ny98 * ca;
                enemyProjectiles.push({
                  x: cx98, y: cy98, vx: rx * sp98, vy: ry * sp98 - 0.5,
                  life: 200, fromEnemy: true, type: 'boss_note',
                });
              }
              sfx('hit');
            } else if (e._bossAttack === 'blink') {
              // Teleport above the player, then immediately rain 3
              // orbs straight down so the blink itself is a threat.
              spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#ff66e0', 10, 24, 3);
              e.x = player.x - (e.w - PW) / 2;
              e.y = Math.max(50, player.y - 170);
              e._bossSpawnX = e.x; e._bossSpawnY = e.y;
              spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#ff66e0', 10, 26, 3);
              const bx98 = e.x + e.w / 2, by98 = e.y + e.h;
              for (const off of [-26, 0, 26]) {
                enemyProjectiles.push({
                  x: bx98 + off, y: by98, vx: off * 0.03, vy: 4.5,
                  life: 200, fromEnemy: true, type: 'boss_note',
                });
              }
              sfx('jump');
            } else if (e._bossAttack === 'barrage') {
              // Kick off a sustained orb burst (~6 aimed pairs).
              e._barrage = 60;
              sfx('skirl');
            }
            e._bossAttack = null;
            // Much tighter cadence than before.
            e._bossAttackCd = _phase98 === 1 ? 105 : _phase98 === 2 ? 80 : 56;
          }
        }
      } else if (e.v === 97) {
        // ─── v=97 JUGGERNAUT — armored charger + ground pound ──────────
        // Heavy ground boss. Phase-gated pool:
        //   Phase 1: { charge }
        //   Phase 2: { charge, pound }
        //   Phase 3: { charge, pound, pound } — pound-biased, faster
        // Charge dashes across the arena; pound jumps + slams, spawning
        // arcing debris + a shockwave. maxHp ≈ 46 recommended.
        if (e._bossInit === undefined) {
          e._bossInit = true;
          e._bossSpawnX = e.x;
          e._bossPatrol = 200;
          e._bossAttackCd = 110;
          e._bossTeleFrames = 0;
          e._bossAttack = null;
          e._bossPhase = 1;
          e._bossName = 'JUGGERNAUT';
        }
        const _hpPct97 = e.hp / Math.max(1, e.maxHp);
        const _phase97 = _hpPct97 > 0.66 ? 1 : _hpPct97 > 0.33 ? 2 : 3;
        if (_phase97 !== e._bossPhase) {
          e._bossPhase = _phase97;
          spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#ffaa44', 8, 28, 4);
          sfx('hit');
        }
        const _atkCd97 = _phase97 === 1 ? 110 : _phase97 === 2 ? 84 : 58;
        const _patrol97 = _phase97 === 1 ? 1.0 : _phase97 === 2 ? 1.4 : 1.9;
        // Patrol while not charging / telegraphing.
        if (!e._bossTeleFrames && !e._bossAttack && !e._chargeFrames) {
          if (e.x < e._bossSpawnX - e._bossPatrol) e.vx = _patrol97;
          else if (e.x > e._bossSpawnX + e._bossPatrol) e.vx = -_patrol97;
          else if (Math.abs(e.vx) < 0.1) e.vx = (player.x > e.x ? 1 : -1) * _patrol97;
        }
        if (e._bossAttackCd > 0) e._bossAttackCd--;
        if (e._bossAttackCd === 0 && !e._bossTeleFrames && !e._bossAttack && !e._chargeFrames) {
          // Pools get nastier: phase 2 adds 'rubble' (sky bombardment),
          // phase 3 adds 'combo' (charge that ends in a pound).
          const pool97 = _phase97 === 1 ? ['charge', 'pound']
                       : _phase97 === 2 ? ['charge', 'pound', 'rubble']
                       : ['charge', 'pound', 'rubble', 'combo', 'combo'];
          e._bossAttack = pool97[Math.floor(Math.random() * pool97.length)];
          e._bossTeleFrames = 38;
          e.vx = 0;
          sfx('hit');
        }
        if (e._bossTeleFrames > 0) {
          e._bossTeleFrames--;
          if (e._bossTeleFrames % 5 === 0) {
            spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ffaa44', 4, 3, 0.05);
          }
          if (e._bossTeleFrames === 0) {
            if (e._bossAttack === 'charge' || e._bossAttack === 'combo') {
              e._chargeFrames = 64;
              e.vx = (player.x > e.x ? 1 : -1) * (7.4 + _phase97 * 0.9);
              // 'combo' arms a pound that fires the instant the charge ends.
              e._comboPound = (e._bossAttack === 'combo');
              sfx('charge');
            } else if (e._bossAttack === 'pound') {
              e.vy = -13;
              e._poundArmed = true;
              sfx('skirl');
            } else if (e._bossAttack === 'rubble') {
              // Sky bombardment — 5-7 rocks rain down across the arena
              // near the player. They fall as gravity-affected bolts.
              const nR = _phase97 === 3 ? 7 : 5;
              for (let r = 0; r < nR; r++) {
                const rx = player.x + (r - (nR - 1) / 2) * 70 + (Math.random() - 0.5) * 40;
                enemyProjectiles.push({
                  x: rx, y: e.y - 220 - Math.random() * 60,
                  vx: 0, vy: 1.5 + Math.random() * 1.5,
                  life: 240, fromEnemy: true, type: 'boss_note',
                });
              }
              spawnRing(e.x + e.w / 2, e.y, '#ffaa44', 10, 30, 3);
              sfx('skirl');
            }
            e._bossAttack = null;
            e._bossAttackCd = _atkCd97;
          }
        }
        if (e._chargeFrames > 0) {
          e._chargeFrames--;
          // Kick up dust during the charge
          if (e._chargeFrames % 4 === 0) spawnPart(e.x + e.w / 2, e.y + e.h, '#caa070', 3, 2, -0.02);
          if (e._chargeFrames === 0) {
            e.vx = 0;
            // Combo: the charge ends in an immediate ground pound.
            if (e._comboPound) {
              e._comboPound = false;
              e.vy = -13;
              e._poundArmed = true;
              sfx('skirl');
            }
          }
        }
        // Ground pound — on landing, shockwave + 6 arcing debris bolts.
        if (e._poundArmed && e.onGround && e.vy >= 0) {
          e._poundArmed = false;
          screenShake = Math.max(screenShake, 28);
          const cx97 = e.x + e.w / 2, cy97 = e.y;
          spawnRing(cx97, e.y + e.h, '#ffaa44', 18, 120, 6);
          for (let d = -3; d <= 3; d++) {
            if (d === 0) continue;
            enemyProjectiles.push({
              x: cx97, y: cy97,
              vx: d * 2.0, vy: -6.5 - Math.abs(d) * 0.5,
              life: 190, fromEnemy: true, type: 'boss_note',
            });
          }
          // Wider shockwave (190 px) — 2 damage to a grounded player.
          const px97 = player.x + PW / 2, py97 = player.y + PH / 2;
          const dist97 = Math.hypot(px97 - cx97, py97 - (e.y + e.h));
          if (dist97 < 190 && player.onGround && player.invincible <= 0) {
            player.hp -= 2; player.invincible = 60; sfx('hit');
          }
        }
      } else if (e.v === 12) {
        // ─── v=12 TURRET — stationary multi-shot cannon ────────────────
        // Doesn't move. Periodically winds up + fires a 3-shot burst aimed
        // at the player's current position. Higher HP than a basic foe so
        // it stays alive long enough to be a real obstacle.
        e.vx = 0;
        // Always face the player so the visual barrel points correctly.
        e.facingRight = player.x > e.x;
        // Burst-shooting state machine:
        //   shootTimer counts down → 0 → start telegraph (windup ~36 fr)
        //   → fire 3 shots over 12 frames → reset shootTimer to ~150 fr
        if (e._turretBurst > 0) {
          e._turretBurst--;
          if (e._turretBurst % 6 === 0) {
            // Aimed shot
            const dx = player.x - e.x, dy = player.y - e.y;
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            const speed = 5;
            enemyProjectiles.push({
              x: e.x + e.w / 2, y: e.y + e.h / 2,
              vx: (dx / dist) * speed, vy: (dy / dist) * speed,
              life: 180, fromEnemy: true,
            });
            sfx('hit');
          }
        } else if (e._turretTele > 0) {
          e._turretTele--;
          // Visual pulse every 6 frames during windup
          if (e._turretTele % 6 === 0) {
            spawnPart(e.x + e.w / 2, e.y + 8, '#ffaa44', 3, 2, 0.05);
          }
          if (e._turretTele === 0) {
            // Begin the 3-shot burst (shots at burst frames 18, 12, 6, 0)
            e._turretBurst = 18;
          }
        } else {
          e.shootTimer = (e.shootTimer || 0) - 1;
          if (e.shootTimer <= 0) {
            // Only fire if the player is roughly in line-of-sight range
            const dx = player.x - e.x, dy = player.y - e.y;
            if (Math.abs(dx) + Math.abs(dy) < 600) {
              e._turretTele = 36;
              sfx('skirl');
            }
            e.shootTimer = 150 + Math.floor(Math.random() * 60);
          }
        }
      } else if (e.v === 13) {
        // ─── v=13 TELEPORTER — vanishes + reappears near player ────────
        // Four-state machine driven by e._teleState ('idle'|'vanish'|'gone'|'appear')
        // and e._teleCd (frames left in the current state).
        if (e._teleState === undefined) {
          e._teleState = 'idle';
          e._teleCd = 90 + Math.floor(Math.random() * 60);
          e._invis = false;
        }
        e._teleCd--;
        if (e._teleState === 'idle') {
          // Hover in place; slow drift so it doesn't read as a fixed turret.
          e.vx = Math.sin(frameCount * 0.05 + (e.x | 0)) * 0.4;
          if (e._teleCd <= 0) {
            // About to vanish — fire one parting shot at the player
            const dx = player.x - e.x, dy = player.y - e.y;
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            enemyProjectiles.push({
              x: e.x + e.w / 2, y: e.y + e.h / 2,
              vx: (dx / dist) * 4.5, vy: (dy / dist) * 4.5,
              life: 160, fromEnemy: true,
            });
            sfx('hit');
            e._teleState = 'vanish';
            e._teleCd = 22;
          }
        } else if (e._teleState === 'vanish') {
          e.vx = 0;
          // Fade-out particles
          if (e._teleCd % 3 === 0) {
            spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#cc66ff', 4, 2, -0.04);
          }
          if (e._teleCd <= 0) {
            e._teleState = 'gone';
            e._invis = true;
            e._teleCd = 36;
          }
        } else if (e._teleState === 'gone') {
          // Track the player while invisible so the final teleport
          // destination is RIGHT next to the player at the moment of
          // re-appearance. Previously we snapped to a random side
          // 110-170 px out at the START of 'gone' — by the time the
          // teleporter materialised, the player had walked away. Now
          // we recompute every frame until landing.
          const side = (e._teleSide != null) ? e._teleSide : (Math.random() < 0.5 ? -1 : 1);
          e._teleSide = side;
          // Land 20-36 px from the player (inside their collision box
          // hitstun range so the touch-damage actually fires).
          const offset = 20 + Math.random() * 16;
          e.x = player.x + side * offset;
          e.y = player.y;
          e.vy = 0;
          if (e._teleCd <= 0) {
            e._teleState = 'appear';
            e._invis = false;
            e._teleCd = 14;     // shorter "appear" so the player has
                                // less time to evade before contact
            e._teleSide = null;
            spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#cc66ff', 10, 22, 2);
          }
        } else if (e._teleState === 'appear') {
          e.vx = 0;
          if (e._teleCd % 3 === 0) {
            spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ff66e0', 3, 2, 0.04);
          }
          if (e._teleCd <= 0) {
            e._teleState = 'idle';
            e._teleCd = 110 + Math.floor(Math.random() * 70);
          }
        }
        // While invisible, the turret can't be hit and doesn't damage.
        // We surface this via e._invis (already set above) — the
        // updateProjectiles + player-collision code checks `e.dead` AND
        // we extend that with `e._invis` further below in this file.
      } else if (e.v === 14) {
        // ─── v=14 BERSERKER — speeds up at low HP, lunges harder ───────
        // Normal patrol until HP < 50%; then enters "frenzy" mode:
        //   • speed doubles
        //   • lunges toward the player aggressively
        //   • red flash overlay (e._frenzyFlash > 0 → renderer tints)
        const pct = e.hp / Math.max(1, e.maxHp || 6);
        const wasFrenzy = !!e._frenzy;
        e._frenzy = pct < 0.5;
        if (e._frenzy && !wasFrenzy) {
          // One-shot frenzy entry effect
          spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#ff3030', 10, 20, 2);
          sfx('charge');
        }
        e._frenzyFlash = e._frenzy ? ((e._frenzyFlash || 0) + 1) : 0;
        const speedMul = e._frenzy ? 2.0 : 1.0;
        // Patrol toward player
        const dxp = player.x - e.x;
        const dirSign = (Math.abs(dxp) < 4) ? (Math.random() < 0.5 ? -1 : 1) : (dxp > 0 ? 1 : -1);
        e.vx = dirSign * (1.4 * speedMul);
        // Lunge: in frenzy, occasionally hop toward the player
        if (e._frenzy && e.onGround) {
          e._lungeCd = (e._lungeCd || 0) - 1;
          if (e._lungeCd <= 0 && Math.abs(dxp) > 60 && Math.abs(dxp) < 400) {
            e.vy = JFORCE * 0.78;
            e.vx = dirSign * (3.4 * speedMul);
            e._lungeCd = 60 + Math.floor(Math.random() * 30);
          }
        }
      } else if (e.v === 15) {
        // ─── v=15 CUTPURSE — coin thief. Darts at the player, snatches
        // coins on contact, then flees with the loot. Kill it to make it
        // drop everything it stole. Deals NO HP damage (excluded from the
        // generic contact-damage check below) — losing coins is the cost.
        if (e._purseState === undefined) {
          e._purseState = 'hunt'; e._stolen = 0; e._stealCd = 0; e._fleeTimer = 0;
        }
        const dxp = player.x - e.x;
        const dir = dxp >= 0 ? 1 : -1;
        e.facingRight = dir > 0;
        if (e._stealCd > 0) e._stealCd--;
        if (e._purseState === 'hunt') {
          e.vx = dir * 2.4;                              // brisk chase
          if (e.onGround && Math.abs(dxp) < 260 && Math.random() < 0.02) e.vy = JFORCE * 0.6;
          if (e._stealCd <= 0 && overlap(player.x, player.y, PW, PH, e.x, e.y, e.w, e.h)) {
            const avail = (typeof coins === 'number') ? coins : 0;
            if (avail > 0) {
              const amt = Math.min(avail, 5 + Math.floor(Math.random() * 6));
              coins -= amt; e._stolen += amt;
              if (window.updateHUD) updateHUD();
              floatText('-' + amt + '🪙 SNATCHED!', e.x - camera.x - 20, e.y - camera.y - 18, '#ff5566');
            } else {
              floatText('EMPTY POCKETS!', e.x - camera.x - 26, e.y - camera.y - 18, '#ffaa66');
            }
            sfx('coin');
            spawnPart(player.x + 16, player.y + 16, '#ffd76a', 8, 3);
            e._purseState = 'flee'; e._fleeTimer = 150; e._stealCd = 90;
            e.vx = -dir * 5; e.vy = JFORCE * 0.5;        // recoil away with the loot
          }
        } else {  // flee
          e.vx = -dir * 3.4;
          if (e.onGround && Math.random() < 0.03) e.vy = JFORCE * 0.55;
          if (--e._fleeTimer <= 0) e._purseState = 'hunt';
        }
      } else if (e.v === 96) {
        // ─── v=96 COIN HOARDER — economy boss. 3 phases of coin attacks,
        // summons Cutpurse minions mid-fight, drops a jackpot on death
        // (handled in onEnemyKilled). Reuses the mega-boss HUD bar +
        // completion machinery (generalized to include v=96).
        if (e._bossInit === undefined) {
          e._bossInit = true;
          e._bossSpawnX = e.x;
          e._bossPatrol = 200;
          e._bossAttackCd = 110;
          e._bossTeleFrames = 0;
          e._bossAttack = null;
          e._bossPhase = 1;
          e._bossName = e._bossName || 'THE COIN HOARDER';
        }
        const _hpPct = e.hp / Math.max(1, e.maxHp);
        const _phase = _hpPct > 0.66 ? 1 : _hpPct > 0.33 ? 2 : 3;
        if (_phase !== e._bossPhase) {
          e._bossPhase = _phase;
          spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#ffd76a', 8, 30, 4);
          sfx('coin');
        }
        const _cd  = _phase === 1 ? 150 : _phase === 2 ? 120 : 90;
        const _spd = _phase === 1 ? 0.7 : _phase === 2 ? 1.0 : 1.4;
        if (!e._bossTeleFrames && !e._bossAttack) {
          if (e.x < e._bossSpawnX - e._bossPatrol) e.vx = _spd;
          else if (e.x > e._bossSpawnX + e._bossPatrol) e.vx = -_spd;
          else if (Math.abs(e.vx) < 0.1) e.vx = (player.x > e.x ? 1 : -1) * _spd;
        }
        if (e._bossAttackCd > 0) e._bossAttackCd--;
        if (e._bossAttackCd === 0 && !e._bossTeleFrames && !e._bossAttack) {
          const pool = _phase === 1 ? ['volley']
                     : _phase === 2 ? ['volley', 'summon']
                     : ['volley', 'summon', 'slam'];
          e._bossAttack = pool[Math.floor(Math.random() * pool.length)];
          e._bossTeleFrames = 54;
          e.vx = 0;
          sfx('skirl');
        }
        if (e._bossTeleFrames > 0) {
          e._bossTeleFrames--;
          if (e._bossTeleFrames % 6 === 0) spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ffd76a', 4, 3, 0.05);
          if (e._bossTeleFrames === 0) {
            const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
            if (e._bossAttack === 'volley') {
              // Lobbed coin shots (they arc — enemy projectiles get gravity).
              const n = _phase === 3 ? 7 : 5;
              const dx = player.x - cx, dy = player.y - cy;
              const dist = Math.max(1, Math.hypot(dx, dy));
              const nx = dx / dist, ny = dy / dist;
              for (let k = 0; k < n; k++) {
                const ang = (k - (n - 1) / 2) * 0.22;
                const ca = Math.cos(ang), sa = Math.sin(ang);
                const rx = nx * ca - ny * sa, ry = nx * sa + ny * ca;
                const speed = 4.0;
                enemyProjectiles.push({ x: cx, y: cy, vx: rx * speed, vy: ry * speed - 2.2, life: 220, fromEnemy: true, type: 'coin_shot' });
              }
              sfx('coin');
            } else if (e._bossAttack === 'summon') {
              const count = _phase === 3 ? 2 : 1;
              for (let k = 0; k < count; k++) {
                enemies.push({
                  v: 15, x: e.x + (k ? 44 : -44), y: e.y, w: 26, h: 36,
                  hp: 3, maxHp: 3, vx: 0, vy: 0, onGround: false, stun: 0, dead: false,
                  facingRight: true, spawnX: e.x, patrolRange: 700,
                  _purseState: 'hunt', _stolen: 0, _stealCd: 0, _fleeTimer: 0,
                });
              }
              spawnRing(cx, cy, '#ffd76a', 8, 24, 3);
              sfx('checkpoint');
            } else if (e._bossAttack === 'slam') {
              e.vy = -13; e._slamArmed = true; sfx('skirl');
            }
            e._bossAttack = null;
            e._bossAttackCd = _cd;
          }
        }
        if (e._slamArmed && e.onGround && e.vy >= 0) {
          e._slamArmed = false;
          screenShake = Math.max(screenShake, 18);
          spawnRing(e.x + e.w / 2, e.y + e.h, '#ffd76a', 14, 80, 5);
          const px = player.x + PW / 2, py = player.y + PH / 2;
          const bx = e.x + e.w / 2, by = e.y + e.h;
          if (Math.hypot(px - bx, py - by) < 150 && player.onGround && player.invincible <= 0) {
            player.hp -= 2; player.invincible = 60; sfx('hit');
          }
          // The slam scatters loose coins — grab-them risk/reward.
          for (let k = 0; k < 3; k++) {
            collectibles.push({ x: e.x + e.w / 2 + (Math.random() * 120 - 60), y: e.y + e.h - 20, collected: false, type: 'coin' });
          }
        }
      }

      // ─── v=7: Shielded ──────────────────────────────────
      if (e.v === 7) {
        if (!e.shieldBroken) {
          // Face player — shield is on the side facing player
          e.facingRight = e.x < player.x;
          // Only take damage from behind, from skirl (all-dir), or from above (stomp)
        }
        // Charge attack occasionally
        e.chargeTimer2 = (e.chargeTimer2 || 0) - 1;
        const dx7 = player.x - e.x;
        if (!e.charging && Math.abs(dx7) < 250 && e.chargeTimer2 <= 0 && e.onGround) {
          e.charging = true; e.vx = (dx7 > 0 ? 1 : -1) * 4.5; e.chargeTimer2 = 45;
        }
        if (e.charging && e.chargeTimer2 <= 0) { e.charging = false; e.chargeTimer2 = 180; }
      }
      // ─── v=8: Rhythm/Pattern ──────────────────────────
      if (e.v === 8) {
        e.rhythmTimer = (e.rhythmTimer || 0) - 1;
        e.rhythmWarning = (e.rhythmWarning || 0) - 1;
        if (e.rhythmTimer <= 0) {
          // Broadcast attack pulse — nearby enemies also attack
          if (e.rhythmWarning <= 0) {
            e.rhythmWarning = 30; sfx('rhythm_warn');
          } else if (e.rhythmWarning <= 1) {
            // Fire in pattern: 3-shot spread
            const dx8 = player.x - e.x, dy8 = player.y - e.y, dist8 = Math.hypot(dx8, dy8) || 1;
            for (let ri = -1; ri <= 1; ri++) {
              const ang = Math.atan2(dy8, dx8) + ri * 0.3;
              enemyProjectiles.push({
                x: e.x + e.w / 2, y: e.y + e.h / 2,
                vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4 - 0.5,
                life: 120, fromEnemy: true, type: 'rhythm_note'
              });
            }
            sfx('hit'); e.rhythmTimer = 120;
            // Synergy: nearby same enemies fire too
            for (const oe of enemies) {
              if (oe !== e && !oe.dead && oe.v === 8 && Math.abs(oe.x - e.x) < 200) oe.rhythmTimer = 10;
            }
          }
        }
      }
      // ─── v=10: Silencer ──────────────────────────
      if (e.v === 10 && (player.starInvincible || 0) <= 0) {
        // Silencer cannot affect star-powered player
        const dx10 = player.x + 16 - (e.x + (e.w || 32) / 2);
        const dy10 = player.y + 25 - (e.y + (e.h || 32) / 2);
        if (Math.hypot(dx10, dy10) < 150) {
          player.silenced = 300;
        }
      }

      // ─── v=9: Splitting — fast, fragile, spawns on death (handled above) ──
      if (e.v === 9) {
        // More aggressive movement toward player
        const dx9 = player.x - e.x;
        if (Math.abs(dx9) < 400) e.vx = (dx9 > 0 ? 1 : -1) * (e.isChild ? 2 : 2.5);
        // Small hop when near
        e.jumpTimer = (e.jumpTimer || 0) - 1;
        if (e.jumpTimer <= 0 && e.onGround && Math.abs(dx9) < 200) {
          e.vy = JFORCE * 0.6; e.jumpTimer = 80;
        }
      }

      if (e.v !== 6) {
        const baseRaw = e.v === 9 ? 2.5 : e.v === 8 ? 1.0 : e.v === 7 ? (e.charging ? 4.5 : 1.5) : e.v === 5 ? (e.charging ? Math.abs(e.vx) : 1.2) : e.v === 4 ? 0.9 : e.v === 3 ? 1.6 : (0.7 + e.v * 0.3);
        const baseSpeed = baseRaw * (e.elite ? 1.6 : 1);
        // On ice: skip vx snapping so enemy slides
        const eOnIce2 = e.onGround && (ld.icePlats || []).some(ip => overlap(e.x + 2, e.y + e.h - 3, e.w - 4, 4, ip.x, ip.y, ip.w || 55, ip.h || 18));
        if ((e.v !== 5 || !e.charging) && !eOnIce2) {
          if (Math.abs(e.vx) < baseSpeed * 0.5) e.vx = (e.vx >= 0 ? 1 : -1) * baseSpeed;
          if (Math.abs(e.vx) > baseSpeed * 1.2) e.vx = Math.sign(e.vx) * baseSpeed * 1.2;
        }
      }

      e.x += e.vx;
      if (e.x < 0 || e.x + e.w > ld.width) { e.vx *= -1; e.charging = false; }

      // ── Patrol radius — keep the enemy near its spawn x ──
      // Designers can opt out per-enemy by setting patrolRange: 0 or a huge value.
      if (typeof e.spawnX === 'number' && e.patrolRange > 0 && !e.charging) {
        const lo = e.spawnX - e.patrolRange;
        const hi = e.spawnX + e.patrolRange;
        if (e.x < lo && e.vx < 0) { e.x = lo; e.vx = Math.abs(e.vx); }
        else if (e.x > hi && e.vx > 0) { e.x = hi; e.vx = -Math.abs(e.vx); }
      }

      if (e.v !== 6 && !e.charging) {
        let safe = false;
        const allSurfaces = [...getActivePlatforms(ld, false), ...(ld.movingPlats || []).map(mp => ({ x: mp._cx || mp.x, y: mp._cy || mp.y, w: mp.w || 60, h: mp.h || 14 })), ...(ld.icePlats || []), ...(ld.bounces || [])];
        for (const p of allSurfaces) {
          const checkX = e.vx > 0 ? e.x + e.w : e.x;
          const ph = p.h || 18;
          if (e.y + e.h >= p.y && e.y + e.h <= p.y + 10 && checkX >= p.x && checkX <= p.x + p.w) { safe = true; break; }
        }
        if (!safe) e.vx *= -1;
      }

      const ePrevVy = e.vy || 0;
      if (e._float) {
        // Floating enemy (e.g. v=98 SUMMONER boss) — the AI controls
        // vertical velocity directly; gravity is skipped so it can
        // hover. Still moves by whatever vy the AI set.
        e.y += e.vy;
      } else {
        e.vy = ePrevVy + GRAV * getGravityMulForWeather(getLevelWeather()) * .5; e.vy = Math.min(e.vy, 16); e.y += e.vy;
      }
      if (weatherState.windX) e.x += weatherState.windX * 0.12;
      const eSolid = getActivePlatforms(ld, false);
      const empAsSolid = (ld.movingPlats || []).map(mp => ({ x: mp._cx || mp.x, y: mp._cy || mp.y, w: mp.w || 60, h: mp.h || 14 }));
      const ePlats = [...eSolid, ...empAsSolid, ...(ld.icePlats || []), ...(ld.bounces || [])];
      resolveVsPlats(e, e.w, e.h, ePlats);
      if (e.onGround) e.vy = 0;

      // ── Bounce pad effect on enemy ──────────────────────
      if (e.onGround) {
        for (const bp of (ld.bounces || [])) {
          if (overlap(e.x + 2, e.y + e.h - 3, e.w - 4, 4, bp.x, bp.y, bp.w || 50, bp.h || 14)) {
            e.vy = JFORCE * 0.8; e.onGround = false;
            spawnPart(e.x + e.w / 2, e.y + e.h, '#00ffcc', 6, 3);
            break;
          }
        }
      }

      // ── Ice friction on enemy ────────────────────────────
      let onIce = false;
      if (e.onGround) {
        for (const ip of (ld.icePlats || [])) {
          if (overlap(e.x + 2, e.y + e.h - 3, e.w - 4, 4, ip.x, ip.y, ip.w || 55, ip.h || 18)) {
            onIce = true; break;
          }
        }
      }
      // On ice: don't snap vx to target — let it slide gradually
      if (onIce) e.vx *= 0.97; // barely decelerate on ice

      if (e.y > H + 200) { e.dead = true; continue; }

      if (player.chargeOn && !e._invis && overlap(player.x - 8, player.y, PW + 16, PH, e.x, e.y, e.w, e.h)) {
        e.hp -= 3;
        if (window.applyEnemyStun) window.applyEnemyStun(e, 25); else e.stun = 25;
        spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ff6600', 10, 5);
      }

      // Star invincibility: kill on contact
      if (player.starInvincible > 50 && !e.dead && !e._invis && overlap(player.x - 4, player.y - 4, PW + 8, PH + 8, e.x, e.y, e.w, e.h)) {
        e.hp = 0; e.dead = true;
        score += e.elite ? 400 : 150; updateHUD();
        // Drum-style explosion effect
        const _ex = e.x + e.w / 2, _ey = e.y + e.h / 2;
        spawnPart(_ex, _ey, '#ffd700', 28, 7, 0.12, 'star');
        spawnPart(_ex, _ey, '#ff88ff', 20, 6, 0.1, 'spark');
        spawnPart(_ex, _ey, '#ffffff', 14, 5, 0.08, 'spark');
        spawnRing(_ex, _ey, '#ffd700', 14, 32, 3);
        screenShake = Math.max(screenShake, 8);
        floatText('⭐ STAR!', e.x - camera.x - 20, e.y - camera.y - 30, '#ffd700');
        sfx('jump'); // quick pop sound on contact kill
      }
      // Ground pound vs enemy — resolved BEFORE touch damage so the
      // meteor wins the trade. Weak enemies (≤2 HP) are one-shot. Tougher
      // ones take damage and bounce the player back up, ending the pound.
      // Stun keeps the enemy from immediately re-touching the player on
      // the same frame the bounce starts.
      if (player._groundPound && !e.dead && (player.invincible || 0) <= 30 &&
          !e._invis && overlap(player.x, player.y, PW, PH, e.x, e.y, e.w, e.h)) {
        const POUND_KILL_HP = 2;   // ≤ this HP = squashed
        const POUND_DMG = 3;       // damage to tougher enemies
        if ((e.hp || 0) <= POUND_KILL_HP) {
          e.hp = 0; e.dead = true; e.stun = 30;
          score += e.elite ? 200 : 80; updateHUD();
          const ex = e.x + (e.w || 32) / 2, ey = e.y + (e.h || 32) / 2;
          spawnPart(ex, ey, '#ffaa22', 18, 5, 0.1, 'spark');
          spawnPart(ex, ey, '#ffeb88', 12, 4, 0.08);
          spawnRing(ex, ey, '#ffaa22', 12, 28, 3);
          screenShake = Math.max(screenShake, 7);
          sfx('bomb_explode');
          floatText('SQUASH!', ex - camera.x - 22, ey - camera.y - 18, '#ffaa22');
          // Keep the meteor going — pound continues through the squashed enemy
        } else {
          e.hp -= POUND_DMG;
          if (window.applyEnemyStun) window.applyEnemyStun(e, 40); else e.stun = 40;
          const ex2 = e.x + (e.w || 32) / 2, ey2 = e.y + (e.h || 32) / 2;
          spawnPart(ex2, ey2, '#ff7733', 14, 4);
          spawnRing(ex2, ey2, '#ffaa22', 10, 22, 2.5);
          screenShake = Math.max(screenShake, 5);
          sfx('hit');
          floatText('SMASH!', ex2 - camera.x - 18, ey2 - camera.y - 18, '#ff7733');
          // Bounce: stronger than a stomp, gives a brief regrant of jumps
          player.vy = JFORCE * 0.85; // JFORCE is negative — upward kick
          player.y = e.y - PH - 2;   // sit on top so we don't re-overlap immediately
          player.jumpsLeft = Math.max(player.jumpsLeft, 1);
          player.invincible = Math.max(player.invincible || 0, 18);
          player._groundPound = false;
          player._groundPoundFx = 0;
        }
      }

      if (!player.shieldOn && (player.invincible || 0) <= 0 && (player.starInvincible || 0) <= 0 && e.v !== 11 && e.v !== 15 && !e._invis && overlap(player.x, player.y, PW, PH, e.x, e.y, e.w, e.h)) {
        player.hp--; player.invincible = 100; sfx('hit'); spawnPart(player.x + 16, player.y + 25, '#e74c3c', 10, 4); updateHUD();
        if (player.hp <= 0) sfx('player_die');
      }

      if (player.shieldOn && !e._invis && overlap(player.x - 8, player.y - 8, PW + 16, PH + 16, e.x, e.y, e.w, e.h)) {
        e.hp--;
        if (window.applyEnemyStun) window.applyEnemyStun(e, 45); else e.stun = 45;
        e.vx *= -2.5;
        spawnPart(player.x + 16, player.y + 25, '#7fff00', 8, 4);
      }
    }
  }
  // ── Exports ────────────────────────────────────────────────────
  window.GameEnemies = { updateEnemies };
  window.updateEnemies = updateEnemies;
})();
