// src/weather.js
// ──────────────────────────────────────────────────────────────────
// Weather state + per-frame update + render overlay.
//
// All weather logic is self-contained EXCEPT for the earthquake
// branch in updateWeatherState which reads/writes `player` (random
// shoves + screen-shake feedback). The inline script's player
// declaration is `var player` so window.player is live by the time
// the game loop calls updateWeatherState.
//
// `weatherState` is mutated in place (e.g. `weatherState.flash = 5`)
// AND reassigned wholesale by initLevel (`weatherState = {type: …}`).
// So we install a window.weatherState accessor — the inline script's
// reassignment updates the slot, our module sees the new object.
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  let weatherState = {
    type: 'none',
    windX: 0,
    flash: 0,
    quakeTimer: 0,
    quakeRattle: 0,
    stormPulse: 0,
  };

  function getLevelWeather(ld = getLevelData()) {
    const w = String(ld?.weather || 'none').toLowerCase();
    const valid = ['none', 'rain', 'storm', 'snow', 'tornado', 'moon', 'earthquake', 'ashfall', 'fog',
      'sandstorm', 'acidrain', 'lightning', 'meteor', 'tide', 'daynight'];
    return valid.includes(w) ? w : 'none';
  }

  function getGravityMulForWeather(weather) {
    if (weather === 'moon') return 0.62;
    if (weather === 'snow') return 0.9;
    return 1;
  }

  function getWindForWeather(weather) {
    const fc = demoPhysicsFrame != null ? demoPhysicsFrame : frameCount;
    if (weather === 'rain') return 0.05 * Math.sin(fc * 0.025);
    if (weather === 'storm') return 0.11 * Math.sin(fc * 0.04) + 0.04 * Math.sin(fc * 0.11);
    if (weather === 'snow') return 0.03 * Math.sin(fc * 0.018);
    if (weather === 'ashfall') return 0.07 * Math.sin(fc * 0.03);
    // Tornado: layered fast + slow gusts so the shove feels chaotic
    // rather than a clean sine wave. Much stronger amplitude than the
    // other weathers — this one is supposed to physically toss you.
    if (weather === 'tornado') return 2.4 * Math.sin(fc * 0.08) + 0.9 * Math.sin(fc * 0.21);
    return 0;
  }

  function updateWeatherState(ld) {
    const weather = getLevelWeather(ld);
    weatherState.type = weather;
    weatherState.windX = getWindForWeather(weather);
    weatherState.stormPulse = (weatherState.stormPulse + 1) % 99999;
    weatherState.flash = Math.max(0, (weatherState.flash || 0) - 1);
    weatherState.quakeRattle = Math.max(0, (weatherState.quakeRattle || 0) - 1);

    if (weather === 'storm') {
      if (Math.random() < 0.007) weatherState.flash = 4 + Math.floor(Math.random() * 4);
    }

    if (weather === 'earthquake') {
      if (Math.random() < 0.09) weatherState.quakeRattle = 6 + Math.floor(Math.random() * 7);
      weatherState.quakeTimer = (weatherState.quakeTimer || 0) + 1;

      // ── Tiny shake-rattle: every shake spawns a few dust particles at random spots
      if (weatherState.quakeTimer % 18 === 0 && ld?.platforms?.length) {
        for (let dust = 0; dust < 3; dust++) {
          const pp = ld.platforms[Math.floor(Math.random() * ld.platforms.length)];
          if (!pp || (pp.type && pp.type !== 'ground')) continue;
          spawnPart(pp.x + Math.random() * (pp.w || 40), pp.y + (pp.h || 16) * 0.6, '#a09070', 4, 1.6, 0.12, 'spark');
        }
        if (player) player.vx += (Math.random() - 0.5) * 0.25;
      }

      // ── Aggressive "chasing crumble": ground behind & near the player collapses fast,
      //    forcing forward motion. Tick fires 8x/sec; platforms close-behind chunk in 1 hit.
      const DAMAGE_PERIOD = 8;           // ~7.5x per second
      const HITS_TO_CHUNK_AHEAD = 3;     // platforms ahead of player still take 3 cracks
      const HITS_TO_CHUNK_BEHIND = 1;    // platforms behind player crumble immediately
      const PER_TICK_DAMAGE = 3;         // damage 3 platforms per tick
      if (weatherState.quakeTimer % DAMAGE_PERIOD === 0 && ld?.platforms?.length) {
        if (ld._eqChunksLost == null) ld._eqChunksLost = 0;
        // Generous chunk budget — let the level visibly disintegrate
        const MAX_CHUNKS = Math.max(8, Math.floor((ld.width || 3200) / 220)); // ~14 chunks per 3200px

        // Weighted candidate pool — heavily favour platforms behind & near the player so
        // the destruction *chases* them forward.
        const candidates = [];
        for (const p of ld.platforms) {
          if ((p._eqDmg || 0) >= 5) continue;
          if ((p.w || 0) < 50) continue;
          if (p.type && p.type !== 'ground') continue;
          let weight = 1;
          let isBehind = false;
          if (player) {
            const cx = p.x + (p.w || 0) / 2;
            const dx = cx - player.x;
            if (dx < -10 && dx > -260) { weight = 14; isBehind = true; } // crumbling-right-behind
            else if (dx < -10) weight = 6;                                // farther behind
            else if (dx < 200) weight = 3;                                // close ahead
            else if (dx > 480) weight = 0.2;                              // far ahead — barely touched
          }
          p._eqBehind = isBehind;
          for (let w = 0; w < Math.ceil(weight * 10); w++) candidates.push(p);
        }

        for (let dmgN = 0; dmgN < PER_TICK_DAMAGE && candidates.length > 0; dmgN++) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          target._eqDmg = (target._eqDmg || 0) + 1;
          const dx0 = target.x + Math.random() * (target.w || 40);
          const dy0 = target.y + (target.h || 16) * 0.5;
          spawnPart(dx0, dy0, '#a89070', 7, 3, 0.18, 'spark');
          spawnPart(dx0, dy0, '#705540', 6, 2, 0.18, 'circle');

          const threshold = target._eqBehind ? HITS_TO_CHUNK_BEHIND : HITS_TO_CHUNK_AHEAD;
          if (target._eqDmg >= threshold && (target.w || 0) >= 100 && ld._eqChunksLost < MAX_CHUNKS) {
            const chunkW = 60 + Math.floor(Math.random() * 30);   // even bigger chunks (60–90px)
            const minSeg = 28;                                     // very small min-segment
            let lo = target.x + minSeg;
            let hi = target.x + target.w - minSeg - chunkW;
            const forbidden = [];
            // Tiny safety bubble directly under player feet — keeps them from yanking through the floor mid-step
            if (player) forbidden.push([player.x - 28, player.x + 36]);
            // Always preserve a tile near the goal so the level remains finishable
            if (ld.goalX != null) forbidden.push([ld.goalX - 60, ld.goalX + 60]);
            let chunkX = null;
            for (let tries = 0; tries < 14 && lo <= hi; tries++) {
              // For "behind" platforms, bias chunkX toward the player's x — chunks fall right where
              // the player just was, creating that terrifying "ground gone behind me" feeling.
              let candX;
              if (target._eqBehind && player) {
                const targetX = Math.max(lo, Math.min(hi, player.x - 24 - chunkW));
                candX = Math.floor(targetX + (Math.random() - 0.5) * 50);
                candX = Math.max(lo, Math.min(hi, candX));
              } else {
                candX = lo + Math.floor(Math.random() * Math.max(1, hi - lo));
              }
              const overlaps = forbidden.some(([fl, fh]) => !(candX + chunkW <= fl || candX >= fh));
              if (!overlaps) { chunkX = candX; break; }
            }
            if (chunkX != null) {
              const left = Object.assign({}, target, { x: target.x, w: chunkX - target.x, _eqDmg: 0 });
              const right = Object.assign({}, target, { x: chunkX + chunkW, w: (target.x + target.w) - (chunkX + chunkW), _eqDmg: 0 });
              for (let pp = 0; pp < 32; pp++) {
                const dx = chunkX + Math.random() * chunkW;
                const dy = target.y + Math.random() * (target.h || 18);
                spawnPart(dx, dy, Math.random() < 0.6 ? '#a89070' : '#5a4a30', 22, 5.5, 0.32, 'spark');
              }
              const idx = ld.platforms.indexOf(target);
              if (idx >= 0) {
                ld.platforms.splice(idx, 1, left, right);
                ld._eqChunksLost++;
                if (typeof sfx === 'function' && !demoLevelDataOverride) sfx('hit');
                weatherState.quakeRattle = Math.max(weatherState.quakeRattle || 0, 16);
              }
            }
          }
        }
      }
    } else {
      weatherState.quakeTimer = 0;
    }

    // ── New weather behaviors (sandstorm / acidrain / lightning /
    //    meteor / tide / daynight). Each maintains a small bit of
    //    state on weatherState so the visual + collision passes can
    //    read it without doing extra computation per draw. ──
    weatherState.visibility = 1.0;
    weatherState.acidActive = false;
    weatherState.tideY = null;
    weatherState.dayPhase = 0;
    if (!Array.isArray(weatherState.meteors)) weatherState.meteors = [];
    if (!Array.isArray(weatherState.strikes)) weatherState.strikes = [];

    if (weather === 'sandstorm') {
      // Visibility 0.45–0.65, oscillating like dust gusts.
      const t = (weatherState.stormPulse % 240) / 240;
      weatherState.visibility = 0.45 + 0.20 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
      // Mild constant wind so it feels gusty
      weatherState.windX = (weatherState.windX || 0) + 0.4 * Math.sin(weatherState.stormPulse * 0.05);
    } else if (weather === 'acidrain') {
      weatherState.acidActive = true;
    } else if (weather === 'lightning') {
      // Telegraph a new strike every ~3 s. Each strike has a
      // 50-frame warning then a 14-frame discharge.
      weatherState.lightningCd = (weatherState.lightningCd || 0) - 1;
      if (weatherState.lightningCd <= 0) {
        const W_ = ld?.width || 3200;
        weatherState.strikes.push({
          x: 60 + Math.random() * (W_ - 120),
          warn: 50,
          strike: 0,
        });
        weatherState.lightningCd = 140 + Math.floor(Math.random() * 120);
      }
      for (let i = weatherState.strikes.length - 1; i >= 0; i--) {
        const s = weatherState.strikes[i];
        if (s.warn > 0) { s.warn--; if (s.warn <= 0) s.strike = 14; }
        else if (s.strike > 0) { s.strike--; }
        else { weatherState.strikes.splice(i, 1); }
      }
    } else if (weather === 'meteor') {
      // Spawn meteors at intervals
      weatherState.meteorCd = (weatherState.meteorCd || 0) - 1;
      if (weatherState.meteorCd <= 0) {
        const W_ = ld?.width || 3200;
        weatherState.meteors.push({
          x: Math.random() * W_,
          y: -40,
          vx: -1 + Math.random() * 2,
          vy: 4 + Math.random() * 3,
          life: 240,
        });
        weatherState.meteorCd = 32 + Math.floor(Math.random() * 36);
      }
      for (let i = weatherState.meteors.length - 1; i >= 0; i--) {
        const m = weatherState.meteors[i];
        m.x += m.vx; m.y += m.vy; m.vy += 0.08; m.life--;
        // Player collision (only when not invincible)
        if (player && (player.invincible || 0) <= 0 && (player.starInvincible || 0) <= 0) {
          if (overlap(m.x - 8, m.y - 8, 16, 16, player.x, player.y, PW, PH)) {
            player.hp = Math.max(0, (player.hp || 0) - 1);
            player.invincible = 90;
            if (typeof sfx === 'function' && !demoLevelDataOverride) sfx('hit');
            weatherState.meteors.splice(i, 1);
            continue;
          }
        }
        if (m.life <= 0 || m.y > (ld?.voidY || 560) + 80) weatherState.meteors.splice(i, 1);
      }
    } else if (weather === 'tide') {
      // Tide oscillates over ~20 s between voidY-80 and voidY+10.
      const period = 1200;
      const t = (weatherState.stormPulse % period) / period;
      const baseY = ld?.voidY || 460;
      weatherState.tideY = baseY - 80 + 90 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
    } else if (weather === 'daynight') {
      // 30 s day-night cycle. 0 = noon, 1 = midnight.
      const period = 1800;
      const t = (weatherState.stormPulse % period) / period;
      weatherState.dayPhase = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);  // 0..1..0
      // Visibility dips toward midnight
      weatherState.visibility = 1.0 - 0.55 * weatherState.dayPhase;
    }
  }

  function drawWeatherOverlay(ctx, ld, viewX, viewY, viewW, viewH, frame, inBuilder = false) {
    const weather = getLevelWeather(ld);
    if (weather === 'none') return;
    const fxW = Math.max(1, viewW), fxH = Math.max(1, viewH);
    const wind = inBuilder ? getWindForWeather(weather) : weatherState.windX;

    if (weather === 'rain' || weather === 'storm') {
      ctx.strokeStyle = weather === 'storm' ? 'rgba(180,220,255,0.6)' : 'rgba(130,190,255,0.5)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 110; i++) {
        const x = viewX + ((i * 57 + frame * (9 + (weather === 'storm' ? 3 : 0))) % (fxW + 60)) - 30;
        const y = viewY + ((i * 41 + frame * 14) % (fxH + 80)) - 40;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 5 + wind * 30, y + 14);
        ctx.stroke();
      }
    }

    if (weather === 'snow') {
      ctx.fillStyle = 'rgba(245,250,255,0.85)';
      for (let i = 0; i < 90; i++) {
        const x = viewX + ((i * 49 + frame * 1.8 + Math.sin(frame * 0.03 + i) * 16) % (fxW + 80)) - 40;
        const y = viewY + ((i * 37 + frame * 2.6) % (fxH + 80)) - 40;
        ctx.beginPath(); ctx.arc(x + wind * 45, y, (i % 3 === 0 ? 2.2 : 1.5), 0, Math.PI * 2); ctx.fill();
      }
    }

    if (weather === 'ashfall') {
      ctx.fillStyle = 'rgba(140,120,100,0.62)';
      for (let i = 0; i < 80; i++) {
        const x = viewX + ((i * 61 + frame * 2.8) % (fxW + 80)) - 40;
        const y = viewY + ((i * 29 + frame * 3.2) % (fxH + 60)) - 30;
        ctx.fillRect(x + wind * 55, y, 2, 2 + (i % 2));
      }
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#a07050';
      ctx.fillRect(viewX, viewY, fxW, fxH);
      ctx.globalAlpha = 1;
    }

    if (weather === 'fog') {
      ctx.globalAlpha = 0.18 + Math.sin(frame * 0.015) * 0.05;
      const g = ctx.createLinearGradient(viewX, viewY + fxH * 0.35, viewX, viewY + fxH);
      g.addColorStop(0, 'rgba(210,220,240,0.15)');
      g.addColorStop(1, 'rgba(185,200,225,0.35)');
      ctx.fillStyle = g;
      ctx.fillRect(viewX, viewY + fxH * 0.28, fxW, fxH * 0.72);
      ctx.globalAlpha = 1;
    }

    if (weather === 'moon') {
      const mx = viewX + fxW * 0.82, my = viewY + 88;
      ctx.fillStyle = 'rgba(250,245,220,0.75)';
      ctx.beginPath(); ctx.arc(mx, my, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.arc(mx - 8, my - 8, 26, 0, Math.PI * 2); ctx.fill();
    }

    if (weather === 'tornado') {
      const tx = viewX + fxW * 0.5 + Math.sin(frame * 0.02) * (fxW * 0.18);
      ctx.strokeStyle = 'rgba(210,220,240,0.42)';
      for (let i = 0; i < 16; i++) {
        const y = viewY + 36 + i * 24;
        const r = 8 + i * 2.6;
        ctx.lineWidth = Math.max(1, 3 - i * 0.11);
        ctx.beginPath();
        ctx.ellipse(tx + Math.sin(frame * 0.08 + i) * 8, y, r, 4 + i * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }

    if (weather === 'earthquake') {
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = '#8b5a28';
      for (let i = 0; i < 5; i++) {
        const y = viewY + fxH * 0.63 + i * 22 + Math.sin(frame * 0.09 + i) * 6;
        ctx.fillRect(viewX, y, fxW, 3);
      }
      ctx.globalAlpha = 1;
    }

    if (weather === 'storm' && !inBuilder && weatherState.flash > 0) {
      ctx.globalAlpha = Math.min(0.55, 0.18 + weatherState.flash * 0.08);
      ctx.fillStyle = '#d8e8ff';
      ctx.fillRect(viewX, viewY, fxW, fxH);
      ctx.globalAlpha = 1;
    }

    // ── New weather visuals ─────────────────────────────────────────
    if (weather === 'sandstorm') {
      // Dust particle streaks
      ctx.fillStyle = 'rgba(214, 154, 66, 0.42)';
      for (let i = 0; i < 140; i++) {
        const x = viewX + ((i * 53 + frame * 6) % (fxW + 80)) - 40;
        const y = viewY + ((i * 31 + frame * 2.4) % (fxH + 40)) - 20;
        ctx.fillRect(x, y, 6 + (i % 3), 1);
      }
      // Yellow-brown haze
      const vis = (inBuilder ? 0.55 : (weatherState.visibility || 0.55));
      ctx.globalAlpha = (1 - vis) * 0.6;
      ctx.fillStyle = '#c0843a';
      ctx.fillRect(viewX, viewY, fxW, fxH);
      ctx.globalAlpha = 1;
    }

    if (weather === 'acidrain') {
      // Bright green diagonal rain
      ctx.strokeStyle = 'rgba(168, 255, 80, 0.7)';
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 120; i++) {
        const x = viewX + ((i * 53 + frame * 10) % (fxW + 60)) - 30;
        const y = viewY + ((i * 43 + frame * 16) % (fxH + 80)) - 40;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 4 + wind * 30, y + 14);
        ctx.stroke();
      }
      // Subtle green wash
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = '#88ff44';
      ctx.fillRect(viewX, viewY, fxW, fxH);
      ctx.globalAlpha = 1;
    }

    if (weather === 'lightning') {
      // Telegraphed strike warnings + bolts
      const strikes = inBuilder ? [] : (weatherState.strikes || []);
      for (const s of strikes) {
        if (s.warn > 0) {
          const t = 1 - s.warn / 50;
          ctx.globalAlpha = 0.30 + 0.35 * (1 - Math.abs(Math.sin(frame * 0.6)));
          ctx.fillStyle = '#ffe060';
          // Vertical warning beam
          ctx.fillRect(s.x - 2, viewY, 4, fxH);
          ctx.globalAlpha = 0.12 * (1 - t);
          ctx.fillRect(s.x - 14, viewY, 28, fxH);
          ctx.globalAlpha = 1;
        } else if (s.strike > 0) {
          const a = Math.min(1, s.strike / 14);
          // Bright bolt
          ctx.globalAlpha = a;
          ctx.strokeStyle = '#fffae0';
          ctx.lineWidth = 4;
          ctx.beginPath();
          let px = s.x, py = viewY;
          ctx.moveTo(px, py);
          for (let k = 0; k < 9; k++) {
            px += (Math.sin(k * 2.3 + s.x) * 8);
            py += fxH / 9;
            ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.lineWidth = 1;
          // Flash
          ctx.globalAlpha = 0.18 * a;
          ctx.fillStyle = '#fffae0';
          ctx.fillRect(viewX, viewY, fxW, fxH);
          ctx.globalAlpha = 1;
        }
      }
    }

    if (weather === 'meteor') {
      const meteors = inBuilder ? [] : (weatherState.meteors || []);
      for (const m of meteors) {
        // Trail
        ctx.strokeStyle = 'rgba(255, 138, 50, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(m.x - m.vx * 8, m.y - m.vy * 8);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
        ctx.lineWidth = 1;
        // Core
        ctx.fillStyle = '#ffe080';
        ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff6a20';
        ctx.beginPath(); ctx.arc(m.x, m.y, 7, 0, Math.PI * 2);
        ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1;
      }
    }

    if (weather === 'tide') {
      const tideY = inBuilder
        ? ((ld?.voidY || 460) - 80 + 90 * (0.5 + 0.5 * Math.sin(frame * 0.005)))
        : (weatherState.tideY != null ? weatherState.tideY : (ld?.voidY || 460));
      // Water body
      const g = ctx.createLinearGradient(viewX, tideY, viewX, viewY + fxH + 40);
      g.addColorStop(0, 'rgba(40, 140, 200, 0.55)');
      g.addColorStop(1, 'rgba(8, 32, 80, 0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(viewX, tideY, fxW, viewY + fxH + 80 - tideY);
      // Surface ripples
      ctx.strokeStyle = 'rgba(180, 230, 255, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = viewX; x <= viewX + fxW; x += 6) {
        const yy = tideY + Math.sin(frame * 0.08 + x * 0.05) * 2;
        if (x === viewX) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    if (weather === 'daynight') {
      // Darker overlay as dayPhase approaches 1 (midnight)
      const phase = inBuilder ? 0.5 : (weatherState.dayPhase || 0);
      ctx.globalAlpha = 0.55 * phase;
      ctx.fillStyle = '#0a0a28';
      ctx.fillRect(viewX, viewY, fxW, fxH);
      ctx.globalAlpha = 1;
      // Stars during night
      if (phase > 0.4) {
        ctx.fillStyle = `rgba(255, 250, 200, ${0.5 * (phase - 0.4) / 0.6})`;
        for (let i = 0; i < 80; i++) {
          const sx = viewX + ((i * 137) % fxW);
          const sy = viewY + ((i * 91) % (fxH * 0.45));
          ctx.fillRect(sx, sy, 1, 1);
        }
      }
    }
  }
  // ── Exports ────────────────────────────────────────────────────
  // Live two-way binding for weatherState: the inline initLevel does
  // `weatherState = {…}` (full reassign) and elsewhere mutates fields
  // in place. The accessor below keeps both in sync.
  Object.defineProperty(window, "weatherState", {
    get() { return weatherState; },
    set(v) { weatherState = v; },
    configurable: true, enumerable: true,
  });
  window.GameWeather = {
    get weatherState() { return weatherState; },
    set weatherState(v) { weatherState = v; },
    getLevelWeather, getGravityMulForWeather, getWindForWeather,
    updateWeatherState, drawWeatherOverlay,
  };
  window.getLevelWeather       = getLevelWeather;
  window.getGravityMulForWeather = getGravityMulForWeather;
  window.getWindForWeather     = getWindForWeather;
  window.updateWeatherState    = updateWeatherState;
  window.drawWeatherOverlay    = drawWeatherOverlay;
})();
