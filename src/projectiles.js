// src/projectiles.js
// ──────────────────────────────────────────────────────────────────
// Per-frame projectile updates — both player notes and enemy fire.
//
// Hot path: runs every frame. Reads/writes a lot of engine state via
// bare-name globals (player, camera, enemies, projectiles,
// enemyProjectiles, frameCount, sfx, getLevelData, weatherState, …).
// All of those land on `window` either via `var` declarations in the
// inline body or via the accessor pattern in src/state.js + audio.js +
// weather.js, so the bare references in here resolve through the
// global object at call time.
//
// Pool helpers (`createObjectPool`, `poolUpdate`) are `function`-
// declared in the inline script — those automatically become window
// properties in non-module scripts.
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Hit-stun helper — fixes the stun-lock exploit ─────────────────
  // Previously every projectile / charge / shield hit re-set e.stun
  // directly, so firing (or holding a charge/shield against a foe)
  // faster than the stun duration meant the enemy's AI NEVER ran —
  // a free perma-stun. Now:
  //   • Bosses (v=6/97/98/99) are immune to stun entirely. Damage
  //     still lands; their telegraphed attacks always play out.
  //   • Regular enemies can only be (re)stunned once their _stunCd
  //     has expired. The cooldown = stun duration + a guaranteed
  //     free-action gap, so rapid hits can't chain-lock them.
  // Damage is applied by the caller BEFORE this runs, so gating the
  // stun never gates the damage.
  function applyEnemyStun(e, frames) {
    if (!e) return;
    if (e.v === 6 || e.v === 97 || e.v === 98 || e.v === 99) return; // bosses immune
    if ((e._stunCd || 0) > 0) return;                                // still on cooldown
    const f = frames | 0;
    e.stun = Math.max(e.stun || 0, f);
    e._stunCd = f + 26;   // stun window + ~26-frame guaranteed action gap
  }
  window.applyEnemyStun = applyEnemyStun;

  function updateProjectiles() {
    const ld = getLevelData();
    poolUpdate(projectiles, proj => {
      if ((proj.delay || 0) > 0) { proj.delay--; return true; }
      proj.x += proj.vx; proj.y += proj.vy; proj.life--;
      // Cull on world bounds, not canvas H — tall levels (e.g. ECHOES, VERTICAL CLIMB)
      // legitimately have play area below y = H + 200, so the old check killed shots instantly.
      const _ldP = getLevelData();
      const _yMax = ((_ldP && (_ldP.height || _ldP.voidY)) || H) + 200;
      const _yMin = (_ldP && _ldP.height ? -(_ldP.height) : -200);
      if (proj.life <= 0 || proj.y > _yMax || proj.y < _yMin || proj.x < -300 || proj.x > (_ldP?.width || 8000) + 300) return false;
      // Break-shot terrain — destroyed after 5 hits from weapon notes
      if (proj.type !== 'portal-shot') {
        const hurtsBreak = ['note', 'bignote', 'bomb', 'drone', 'skirl', 'deflected', 'reflect'].includes(proj.type);
        if (hurtsBreak) {
          // hitR scales with charge for bignote; default to 6 (12px box) for
          // other note types so behavior is unchanged for them.
          const _hr = proj.hitR || 6;
          for (const bp of (ld.platforms || [])) {
            if (bp.type !== 'breakshot') continue;
            const bid = bp._id = bp._id || String(bp.x) + '_' + String(bp.y);
            const bst = specialPlatState[bid];
            if (bst && bst.broken) continue;
            // Per-projectile dedupe — don't re-hit the same tile as the
            // wide shot crosses multiple of them on the same frame.
            if (proj._bsHit && proj._bsHit.has(bid)) continue;
            if (!overlap(proj.x - _hr, proj.y - _hr, _hr * 2, _hr * 2, bp.x, bp.y, bp.w || 80, bp.h || 18)) continue;
            if (!specialPlatState[bid]) specialPlatState[bid] = { hits: 0, broken: false };
            specialPlatState[bid].hits++;
            if (!proj._bsHit) proj._bsHit = new Set();
            proj._bsHit.add(bid);
            sfx('hit'); spawnPart(proj.x, proj.y, '#66ccff', 6, 2.5);
            floatText(specialPlatState[bid].hits + '/5', bp.x - camera.x + bp.w / 2 - 12, bp.y - camera.y - 8, '#88ddff');
            if (specialPlatState[bid].hits >= 5) {
              specialPlatState[bid].broken = true;
              sfx('shield_break');
              spawnPart(bp.x + (bp.w || 40), bp.y + 4, '#aaddff', 14, 4);
              floatText('SHATTERED!', bp.x - camera.x, bp.y - camera.y - 20, '#66ccff');
            }
            // wideHit keeps the projectile alive so it can punch through
            // every breakable in its footprint on this frame and the next.
            if (!proj.piercing && !proj.wideHit) return false;
            if (!proj.wideHit) break;
          }
        }
      }
      // Bounce note: reflect off platforms and ground
      if (proj.bounceNote) {
        const _ld2 = getLevelData();
        if (proj.y >= (_ld2.voidY || 460) - 4) { proj.vy = -Math.abs(proj.vy); proj.bounces++; }
        for (const _pl of (_ld2.platforms || [])) {
          if (!overlap(proj.x - 4, proj.y - 4, 8, 8, _pl.x, _pl.y, _pl.w || 80, _pl.h || 18)) continue;
          const _cx = _pl.x + (_pl.w || 80) / 2, _cy = _pl.y + (_pl.h || 18) / 2;
          const _dx = (proj.x - _cx) / (_pl.w || 80) * 2, _dy = (proj.y - _cy) / (_pl.h || 18) * 2;
          if (Math.abs(_dx) > Math.abs(_dy)) proj.vx = -proj.vx;
          else { proj.vy = -proj.vy; proj.y += proj.vy > 0 ? 2 : -2; }
          proj.bounces++;
          spawnPart(proj.x, proj.y, '#44ffcc', 3, 3, 0.05);
          break;
        }
        if ((proj.bounces || 0) > proj.maxBounces) return false;
      }
      // Grapple shot: attaches when it overlaps a 'grapplehook'
      // platform. On hit, anchor the player to the block center and
      // remove the projectile. Misses just expire normally.
      if (proj.type === 'grapple-shot') {
        const _ldG = getLevelData();
        for (const _pl of (_ldG.platforms || [])) {
          if (_pl.type !== 'grapplehook') continue;
          const w = _pl.w || 32, h = _pl.h || 32;
          if (overlap(proj.x - 6, proj.y - 6, 12, 12, _pl.x, _pl.y, w, h)) {
            if (player) {
              player._grappleAttached = true;
              player._grappleAnchor = { x: _pl.x + w / 2, y: _pl.y + h / 2 };
              player.vx = 0; player.vy = 0;
            }
            sfx('checkpoint');
            spawnRing(_pl.x + w / 2, _pl.y + h / 2, '#88ccff', 10, 14, 2);
            floatText('HOOKED!', _pl.x - camera.x, _pl.y - camera.y - 14, '#88ccff');
            return false;
          }
        }
      }
      // Portal shot: embed on first platform or level boundary hit
      if (proj.type === 'portal-shot') {
        const _ld3 = getLevelData();
        let _hit = false;
        // Check platforms
        for (const _pl of (_ld3.platforms || [])) {
          if (overlap(proj.x - 6, proj.y - 6, 12, 12, _pl.x, _pl.y, _pl.w || 80, _pl.h || 18)) {
            _hit = true; break;
          }
        }
        // Check level boundaries
        if (proj.x < 8 || proj.x > (_ld3.width || 8000) - 8) _hit = true;
        if (_hit) {
          const _lbl2 = proj.portalLabel;
          replacePortal(_lbl2, proj.x, proj.y);
          sfx('checkpoint');
          spawnPart(proj.x, proj.y, _lbl2 === 'A' ? '#8866ff' : '#ff66aa', 10, 4, 0.08);
          floatText('PORTAL ' + _lbl2, proj.x - camera.x - 20, proj.y - camera.y - 30, _lbl2 === 'A' ? '#8866ff' : '#ff66aa');
          return false; // remove projectile
        }
      }

      // Soundwave activation: hitting an inactive soundwave platform
      // from ANY direction turns it solid for ~4.5 s. Originally gated
      // on proj.vy <= 0 (only upward / horizontal shots) which broke
      // aim-down — players standing above a soundwave and shooting
      // straight down couldn't activate it. Removed the velocity gate
      // so down-shots, bouncing notes, and ricochets all work.
      if (proj.type === 'note' || proj.type === 'bignote' || proj.type === 'bomb' || proj.type === 'drone') {
        let hitSoundwave = false;
        for (const _pl of (ld.platforms || [])) {
          if (_pl.type === 'soundwave') {
            if (overlap(proj.x - 8, proj.y - 8, 16, 16, _pl.x, _pl.y, _pl.w || 80, _pl.h || 18)) {
              const st = specialPlatState[_pl._id = _pl._id || Math.random()];
              if (st && st.active <= 0) {
                st.active = 270;
                sfx('checkpoint');
                spawnPart(_pl.x + (_pl.w || 80) / 2, _pl.y + (_pl.h || 18) / 2, '#22ccaa', 15, 5, 0.1);
                floatText('ACTIVATED!', _pl.x - camera.x, _pl.y - camera.y - 10, '#22ccaa');
                hitSoundwave = true;
                break;
              }
            }
          }
        }
        if (hitSoundwave) return false;
      }

      // NOTE: q-blocks are intentionally NOT triggered by projectiles.
      // The only way to pop a ? block is a head-bump from below
      // (handled in src/physics.js). Shooting one does nothing —
      // a note simply passes over / through it.

      if (proj.type === 'bomb') {
        const BOMB_R = 80;
        let hit = false;
        for (const e of enemies) {
          if (e.dead || e._invis) continue;
          if (overlap(proj.x - 10, proj.y - 10, 20, 20, e.x, e.y, e.w, e.h)) { hit = true; break; }
        }
        if (hit) {
          sfx('bomb_explode');
          for (const e of enemies) {
            if (e.dead || e._invis) continue;
            const dx = (e.x + e.w / 2) - proj.x, dy = (e.y + e.h / 2) - proj.y;
            if (dx * dx + dy * dy < BOMB_R * BOMB_R) {
              e.hp -= proj.dmg; applyEnemyStun(e, 25); spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ff6600', 8, 4);
            }
          }
          spawnPart(proj.x, proj.y, '#ff9900', 28, 7); spawnPart(proj.x, proj.y, '#ff3300', 18, 5); spawnPart(proj.x, proj.y, '#ffff00', 12, 6);
          floatText('💥 BOOM!', proj.x - camera.x - 30, proj.y - camera.y - 30, '#ff6600');
          return false;
        }
      }

      if (proj.type === 'bignote') {
        proj.scale = (proj.scale || 1) + 0.05;
        if (proj.scale > 3.5) proj.scale = 3.5;
        const r = 6 * proj.scale;
        for (const e of enemies) {
          if (e.dead || e._invis) continue;
          if (overlap(proj.x - r, proj.y - r, r * 2, r * 2, e.x, e.y, e.w, e.h)) {
            e.hp -= proj.dmg; applyEnemyStun(e, 18); spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#f5c518', 8, 3);
            return false;
          }
        }
        return true;
      }

      for (const e of enemies) {
        if (e.dead || e._invis) continue;
        // Wide-hit charge shots dedupe per enemy so passing through doesn't
        // tick damage every frame — one hit per target per shot.
        if (proj._enHit && proj._enHit.has(e)) continue;
        const pr = proj.hitR || 6;
        if (overlap(proj.x - pr, proj.y - pr, pr * 2, pr * 2, e.x, e.y, e.w, e.h)) {
          // Shield check for v=7
          if (e.v === 7 && !e.shieldBroken && proj.type !== 'skirl') {
            const fromRight = proj.vx < 0;
            if (fromRight === !!e.facingRight) {
              e.shieldHits = (e.shieldHits || 0) + 1;
              spawnPart(e.x + e.w / 2, e.y + e.h / 2, '#ffd700', 6, 3, 0.08, 'spark');
              if (e.shieldHits >= 5) {
                e.shieldBroken = true; sfx('shield_break');
                spawnRing(e.x + e.w / 2, e.y + e.h / 2, '#ffd700', 12, 18, 3);
                floatText('SHIELD BROKEN!', e.x - camera.x - 30, e.y - camera.y - 20, '#ffd700');
              }
              if (!proj._enHit) proj._enHit = new Set();
              proj._enHit.add(e);
              if (proj.type !== 'drone' && !proj.piercing && !proj.wideHit) return false;
              continue;
            }
          }
          e.hp -= proj.dmg; applyEnemyStun(e, 18);
          if (!proj._enHit) proj._enHit = new Set();
          proj._enHit.add(e);
          if (proj.type === 'deflected') { sfx('jump'); floatText('⚡', e.x - camera.x, e.y - camera.y - 20, '#00ffff'); }
          spawnPart(e.x + e.w / 2, e.y + e.h / 2, proj.type === 'deflected' ? '#00ffff' : '#f5c518', 6, 3, 0.1, 'spark');
          if (proj.type !== 'drone' && !proj.piercing && !proj.wideHit) return false;
        }
      }
      return true;
    });
  }

  function updateEnemyProjectiles() {
    // ─ Counter/Parry deflects enemy projectiles ────────
    if (player.counterActive > 0) {
      poolUpdate(enemyProjectiles, ep => {
        if (!overlap(ep.x - 6, ep.y - 6, 12, 12, player.x - 10, player.y - 10, PW + 20, PH + 20)) return true;
        // Deflect: reverse velocity and turn it into a player projectile
        // Spawn reflected bolt heading back toward the enemy
        const _rfx = ep.x, _rfy = ep.y;
        projectiles.push({ x: _rfx, y: _rfy, vx: -ep.vx * 1.5, vy: -ep.vy * 1.5, dmg: 5, type: 'reflect', life: 180 });
        sfx('checkpoint');
        spawnPart(_rfx, _rfy, '#00ffff', 12, 5, 0.1, 'spark');
        floatText('⚡REFLECT!', _rfx - camera.x - 20, _rfy - camera.y - 20, '#00ffff');
        spawnPart(ep.x, ep.y, '#00ffff', 8, 3, 0.1, 'spark');
        sfx('checkpoint');
        return false; // remove enemy projectile
      });
    }

    poolUpdate(enemyProjectiles, ep => {
      ep.x += ep.vx; ep.y += ep.vy;
      ep.vy += GRAV * getGravityMulForWeather(getLevelWeather()) * 0.2;
      if (weatherState.windX) ep.vx += weatherState.windX * 0.02;
      ep.life--;
      if (ep.life <= 0 || ep.y > H + 100 || ep.x < -100 || ep.x > getLevelData().width + 100) return false;

      const r = ep.type === 'boss_note' ? 12 : 6;

      if (!player.shieldOn && (player.invincible || 0) <= 0 && (player.starInvincible || 0) <= 0 && overlap(player.x, player.y, PW, PH, ep.x - r, ep.y - r, r * 2, r * 2)) {
        player.hp--; player.invincible = 100; sfx('hit'); spawnPart(player.x + 16, player.y + 25, '#ff6600', 10, 4); updateHUD();
        if (player.hp <= 0) sfx('player_die');
        spawnPart(ep.x, ep.y, '#ff6600', 6, 3);
        return false;
      }
      if (player.shieldOn && overlap(player.x - 4, player.y - 4, PW + 8, PH + 8, ep.x - r, ep.y - r, r * 2, r * 2)) {
        spawnPart(ep.x, ep.y, '#7fff00', 8, 4);
        return false;
      }
      return true;
    });
  }
  // ── Exports ────────────────────────────────────────────────────
  window.GameProjectiles = {
    updateProjectiles, updateEnemyProjectiles,
  };
  window.updateProjectiles      = updateProjectiles;
  window.updateEnemyProjectiles = updateEnemyProjectiles;
})();
