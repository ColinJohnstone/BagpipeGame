// src/audio.js
// ──────────────────────────────────────────────────────────────────
// Web Audio engine — procedural SFX + HTML5 Audio music playback.
//
// Loaded by a <script> tag AFTER themes.js but BEFORE the main inline
// script. The module creates a single shared AudioContext at load time
// and exposes its API on both `window.GameAudio` and bare-global mirror
// names (AC, sfx, startMusic, stopMusic, …) so existing call sites in
// the engine continue to work unchanged.
//
// Engine-state dependencies are looked up via `window.*` at call time
// so audio.js never needs the engine's globals to exist at module-load
// time. Specifically:
//   - demoLevelDataOverride: read in sfx() to suppress SFX during demo
//   - getLevelData / currentWorld / currentLevel: read in _songIndex
// ──────────────────────────────────────────────────────────────────

(function () {
  "use strict";
  // ═══════════════════════════════════════════════════════
  //  WEB AUDIO — procedural music + SFX
  // ═══════════════════════════════════════════════════════
  const AC = new (window.AudioContext || window.webkitAudioContext)();
  // Web Audio chain: SFX nodes → sfxGain → masterGain → destination.
  // The music engine is a regular HTMLAudioElement (not routed through
  // Web Audio), so its volume is applied by _applyMusicVolume() directly
  // on the element. We compute the music element's volume as
  // master × music × MUSIC_BASELINE so the master slider affects both
  // the music track AND the SFX bus equivalently.
  let sfxGain;     // node carrying every Web Audio (procedural SFX) sound
  let masterGain;  // SFX-bus → masterGain → destination. Music volume is
                   // multiplied by masterGain.gain manually below.
  let _musicTime = 0;

  // ── Volume state ────────────────────────────────────────────────
  // All three are 0..1 user-facing percentages. Defaults preserve the
  // original mix (master 1.0, SFX nominal 0.45, music nominal 0.65).
  // The baselines are folded into the gain node values so user 1.0 still
  // sounds the same as the legacy "max" volume.
  const SFX_BASELINE = 0.45;
  const MUSIC_BASELINE = 0.65;
  const VOL_KEYS = {
    master: 'pogl_vol_master',
    music:  'pogl_vol_music',
    sfx:    'pogl_vol_sfx',
  };
  function _loadVol(key, def) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return def;
      const n = parseFloat(raw);
      return (isFinite(n) && n >= 0 && n <= 1) ? n : def;
    } catch (e) { return def; }
  }
  let _masterVol = _loadVol(VOL_KEYS.master, 1.0);
  let _musicVol  = _loadVol(VOL_KEYS.music,  1.0);
  let _sfxVol    = _loadVol(VOL_KEYS.sfx,    1.0);

  function _persist(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) { /* ignore */ }
  }

  function _applyAudioGraph() {
    if (sfxGain)    sfxGain.gain.value    = muted ? 0 : _sfxVol * SFX_BASELINE;
    if (masterGain) masterGain.gain.value = muted ? 0 : _masterVol;
    _applyMusicVolume();
  }
  function _applyMusicVolume() {
    if (_audio) _audio.volume = muted ? 0 : (_masterVol * _musicVol * MUSIC_BASELINE);
    // Menu audio respects the same sliders. Skip if a fade is in
    // progress — the fade tick will pick up the new target on its
    // next step (it reads the live multiplier).
    if (_menuAudio && !_menuFadeTimer) {
      _menuAudio.volume = muted ? 0 : (_masterVol * _musicVol * MENU_BASELINE);
    }
  }

  function setMasterVolume(v) {
    _masterVol = Math.max(0, Math.min(1, +v || 0));
    _persist(VOL_KEYS.master, _masterVol);
    _applyAudioGraph();
  }
  function setMusicVolume(v) {
    _musicVol = Math.max(0, Math.min(1, +v || 0));
    _persist(VOL_KEYS.music, _musicVol);
    _applyMusicVolume();
  }
  function setSfxVolume(v) {
    _sfxVol = Math.max(0, Math.min(1, +v || 0));
    _persist(VOL_KEYS.sfx, _sfxVol);
    _applyAudioGraph();
  }
  function getVolumes() {
    return { master: _masterVol, music: _musicVol, sfx: _sfxVol, muted };
  }

  function resumeAC() { if (AC.state === 'suspended') AC.resume(); }

  function initAudio() {
    sfxGain = AC.createGain();
    masterGain = AC.createGain();
    sfxGain.connect(masterGain);
    masterGain.connect(AC.destination);
    _applyAudioGraph();
  }

  // ── SFX ──────────────────────────────────────────────
  function sfx(type) {
    // Suppress SFX during the title-screen demo (the NPC bagpiper plays silently)
    if (typeof window !== "undefined" && window.demoLevelDataOverride) return;
    // Tally a handful of SFX types as stats (jumps, shots) so the
    // achievements work without instrumenting every call site. Demo is
    // already filtered above, so these only fire in real gameplay.
    if (typeof window !== "undefined" && window.GameStats) {
      if (type === 'jump')  window.GameStats.recordJump();
      if (type === 'shoot') window.GameStats.recordShot();
    }
    resumeAC();
    const g = AC.createGain();
    g.connect(sfxGain);
    const o = AC.createOscillator();
    o.connect(g);
    const now = AC.currentTime;
    switch (type) {
      case 'jump':
        o.type = 'sine'; o.frequency.setValueAtTime(280, now); o.frequency.exponentialRampToValueAtTime(560, now + .12);
        g.gain.setValueAtTime(.3, now); g.gain.exponentialRampToValueAtTime(.001, now + .2);
        o.start(now); o.stop(now + .2); break;
      case 'kilt':
        o.type = 'triangle'; o.frequency.setValueAtTime(320, now); o.frequency.exponentialRampToValueAtTime(640, now + .08); o.frequency.exponentialRampToValueAtTime(480, now + .18);
        g.gain.setValueAtTime(.4, now); g.gain.exponentialRampToValueAtTime(.001, now + .25);
        o.start(now); o.stop(now + .25); break;
      case 'shoot':
        {
          const chanter = AC.createOscillator(), cg = AC.createGain();
          const chanter2 = AC.createOscillator(), cg2 = AC.createGain();
          chanter.type = 'sawtooth'; chanter.frequency.setValueAtTime(587, now); chanter.frequency.setValueAtTime(659, now + .04); chanter.frequency.setValueAtTime(587, now + .09);
          cg.gain.setValueAtTime(.22, now); cg.gain.exponentialRampToValueAtTime(.001, now + .22);
          chanter.connect(cg); cg.connect(sfxGain); chanter.start(now); chanter.stop(now + .22);
          chanter2.type = 'sawtooth'; chanter2.frequency.setValueAtTime(880, now); chanter2.frequency.setValueAtTime(990, now + .04); chanter2.frequency.setValueAtTime(880, now + .09);
          cg2.gain.setValueAtTime(.08, now); cg2.gain.exponentialRampToValueAtTime(.001, now + .18);
          chanter2.connect(cg2); cg2.connect(sfxGain); chanter2.start(now); chanter2.stop(now + .22);
        } break;
      case 'hit':
        o.type = 'sawtooth'; o.frequency.setValueAtTime(180, now); o.frequency.exponentialRampToValueAtTime(60, now + .15);
        g.gain.setValueAtTime(.35, now); g.gain.exponentialRampToValueAtTime(.001, now + .18);
        o.start(now); o.stop(now + .18); break;
      case 'enemy_die':
        o.type = 'square'; o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(100, now + .3);
        g.gain.setValueAtTime(.3, now); g.gain.exponentialRampToValueAtTime(.001, now + .35);
        o.start(now); o.stop(now + .35); break;
      case 'coin':
        o.type = 'sine'; o.frequency.setValueAtTime(880, now); o.frequency.exponentialRampToValueAtTime(1320, now + .08);
        g.gain.setValueAtTime(.25, now); g.gain.exponentialRampToValueAtTime(.001, now + .15);
        o.start(now); o.stop(now + .15); break;
      case 'bark':
        // Two short "woof-woof" notes — square wave with a quick
        // descending pitch envelope on each. Cuts through music
        // since it's higher pitched than the hit/punch sfx.
        for (let bi = 0; bi < 2; bi++) {
          const ob = AC.createOscillator(), gb = AC.createGain();
          ob.connect(gb); gb.connect(sfxGain);
          ob.type = 'square';
          const tb = now + bi * 0.09;
          ob.frequency.setValueAtTime(560, tb);
          ob.frequency.exponentialRampToValueAtTime(260, tb + 0.085);
          gb.gain.setValueAtTime(0.0, tb);
          gb.gain.linearRampToValueAtTime(0.36, tb + 0.008);
          gb.gain.exponentialRampToValueAtTime(0.001, tb + 0.10);
          ob.start(tb); ob.stop(tb + 0.12);
        }
        break;
      case 'skirl':
        for (let i = 0; i < 3; i++) {
          const o2 = AC.createOscillator(), g2 = AC.createGain();
          o2.connect(g2); g2.connect(sfxGain);
          o2.type = 'sawtooth'; o2.frequency.value = 220 + i * 110;
          g2.gain.setValueAtTime(.2, now + i * .05); g2.gain.exponentialRampToValueAtTime(.001, now + .5 + i * .05);
          o2.start(now + i * .05); o2.stop(now + .6);
        } break;
      case 'charge':
        o.type = 'sawtooth'; o.frequency.setValueAtTime(100, now); o.frequency.exponentialRampToValueAtTime(400, now + .25);
        g.gain.setValueAtTime(.4, now); g.gain.exponentialRampToValueAtTime(.001, now + .3);
        o.start(now); o.stop(now + .3); break;
      case 'shield':
        o.type = 'triangle'; o.frequency.setValueAtTime(440, now); o.frequency.exponentialRampToValueAtTime(880, now + .1); o.frequency.exponentialRampToValueAtTime(440, now + .25);
        g.gain.setValueAtTime(.3, now); g.gain.exponentialRampToValueAtTime(.001, now + .3);
        o.start(now); o.stop(now + .3); break;
      case 'castle':
        [523, 659, 784, 1047].forEach((f, i) => {
          const o2 = AC.createOscillator(), g2 = AC.createGain();
          o2.connect(g2); g2.connect(sfxGain);
          o2.type = 'triangle'; o2.frequency.value = f;
          g2.gain.setValueAtTime(.0, now + i * .12); g2.gain.linearRampToValueAtTime(.4, now + i * .12 + .05);
          g2.gain.exponentialRampToValueAtTime(.001, now + i * .12 + .4);
          o2.start(now + i * .12); o2.stop(now + i * .12 + .45);
        }); break;
      case 'player_die':
        o.type = 'sawtooth'; o.frequency.setValueAtTime(440, now); o.frequency.exponentialRampToValueAtTime(55, now + .8);
        g.gain.setValueAtTime(.4, now); g.gain.exponentialRampToValueAtTime(.001, now + .85);
        o.start(now); o.stop(now + .85); break;
      case 'powerup_spawn':
        o.type = 'square'; o.frequency.setValueAtTime(220, now); o.frequency.setValueAtTime(165, now + .05);
        g.gain.setValueAtTime(.3, now); g.gain.exponentialRampToValueAtTime(.001, now + .18);
        o.start(now); o.stop(now + .18); break;
      case 'powerup_collect':
        [659, 784, 880, 1047, 784].forEach((f, i) => {
          const o2 = AC.createOscillator(), g2 = AC.createGain();
          o2.connect(g2); g2.connect(sfxGain);
          o2.type = 'sawtooth'; o2.frequency.value = f;
          g2.gain.setValueAtTime(.0, now + i * .06); g2.gain.linearRampToValueAtTime(.18, now + i * .06 + .03);
          g2.gain.exponentialRampToValueAtTime(.001, now + i * .06 + .2);
          o2.start(now + i * .06); o2.stop(now + i * .06 + .22);
        }); break;
      case 'bomb_explode':
        {
          const buf = AC.createBuffer(1, AC.sampleRate * .4, AC.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (AC.sampleRate * .12));
          const ns = AC.createBufferSource(), ng = AC.createGain();
          ns.buffer = buf; ng.gain.value = .55;
          ns.connect(ng); ng.connect(sfxGain); ns.start(now);
          const boom = AC.createOscillator(), bg2 = AC.createGain();
          boom.type = 'sine'; boom.frequency.setValueAtTime(80, now); boom.frequency.exponentialRampToValueAtTime(20, now + .4);
          bg2.gain.setValueAtTime(.4, now); bg2.gain.exponentialRampToValueAtTime(.001, now + .4);
          boom.connect(bg2); bg2.connect(sfxGain); boom.start(now); boom.stop(now + .4);
        } break;
      case 'rapidfire':
        o.type = 'sawtooth'; o.frequency.setValueAtTime(440, now); o.frequency.exponentialRampToValueAtTime(880, now + .1);
        g.gain.setValueAtTime(.2, now); g.gain.exponentialRampToValueAtTime(.001, now + .15);
        o.start(now); o.stop(now + .15); break;
      case 'drone':
        o.type = 'square'; o.frequency.setValueAtTime(110, now); o.frequency.setValueAtTime(165, now + .1); o.frequency.setValueAtTime(220, now + .2);
        g.gain.setValueAtTime(.25, now); g.gain.exponentialRampToValueAtTime(.001, now + .4);
        o.start(now); o.stop(now + .4); break;
      case 'checkpoint':
        {
          const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.connect(g2); g2.connect(sfxGain);
          o2.type = 'square';
          o2.frequency.setValueAtTime(440, now); o2.frequency.setValueAtTime(550, now + .07); o2.frequency.setValueAtTime(660, now + .14);
          g2.gain.setValueAtTime(.25, now); g2.gain.exponentialRampToValueAtTime(.001, now + .35);
          o2.start(now); o2.stop(now + .35); break;
        }
      case 'shield_break':
        {
          const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.connect(g2); g2.connect(sfxGain);
          o2.type = 'sawtooth'; o2.frequency.setValueAtTime(800, now); o2.frequency.exponentialRampToValueAtTime(100, now + .25);
          g2.gain.setValueAtTime(.35, now); g2.gain.exponentialRampToValueAtTime(.001, now + .3);
          o2.start(now); o2.stop(now + .3); break;
        }
      case 'split':
        {
          [320, 220, 160].forEach((f, i) => {
            const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.connect(g2); g2.connect(sfxGain);
            o2.type = 'sine'; o2.frequency.setValueAtTime(f, now + i * .05);
            g2.gain.setValueAtTime(.18, now + i * .05); g2.gain.exponentialRampToValueAtTime(.001, now + i * .05 + .15);
            o2.start(now + i * .05); o2.stop(now + i * .05 + .15);
          }); break;
        }
      case 'wall_jump':
        {
          const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.connect(g2); g2.connect(sfxGain);
          o2.type = 'triangle'; o2.frequency.setValueAtTime(350, now); o2.frequency.exponentialRampToValueAtTime(650, now + .1);
          g2.gain.setValueAtTime(.2, now); g2.gain.exponentialRampToValueAtTime(.001, now + .15);
          o2.start(now); o2.stop(now + .15); break;
        }
      case 'bounce_land':
        {
          const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.connect(g2); g2.connect(sfxGain);
          o2.type = 'sine'; o2.frequency.setValueAtTime(180, now); o2.frequency.exponentialRampToValueAtTime(580, now + .08);
          g2.gain.setValueAtTime(.28, now); g2.gain.exponentialRampToValueAtTime(.001, now + .15);
          o2.start(now); o2.stop(now + .15); break;
        }
      case 'rhythm_warn':
        {
          const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.connect(g2); g2.connect(sfxGain);
          o2.type = 'square'; o2.frequency.setValueAtTime(110, now);
          g2.gain.setValueAtTime(.12, now); g2.gain.exponentialRampToValueAtTime(.001, now + .08);
          o2.start(now); o2.stop(now + .08); break;
        }
      case 'elite_die':
        {
          [880, 660, 440].forEach((f, i) => {
            const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.connect(g2); g2.connect(sfxGain);
            o2.type = 'sawtooth'; o2.frequency.setValueAtTime(f, now + i * .06);
            g2.gain.setValueAtTime(.2, now + i * .06); g2.gain.exponentialRampToValueAtTime(.001, now + i * .06 + .2);
            o2.start(now + i * .06); o2.stop(now + i * .06 + .2);
          }); break;
        }
      case 'invincible_start':
        {
          const t0 = now;
          // Sparkling entry burst — 12 random high notes in quick succession
          const sparkleN = [784, 880, 988, 1047, 1175, 1319, 1397, 1480, 1568, 1661, 1760, 1976];
          sparkleN.forEach((f, i) => {
            const eo = AC.createOscillator(), eg = AC.createGain();
            eo.type = 'sine'; eo.frequency.value = f;
            const delay = i * 0.04 + Math.random() * 0.02;
            eg.gain.setValueAtTime(0, t0 + delay);
            eg.gain.linearRampToValueAtTime(0.18, t0 + delay + 0.03);
            eg.gain.exponentialRampToValueAtTime(0.001, t0 + delay + 0.18);
            eo.connect(eg); eg.connect(sfxGain); eo.start(t0 + delay); eo.stop(t0 + delay + 0.2);
          });
        } break;
      case 'ember':
        {
          const t0 = now;
          [587, 784, 1047, 784, 1047].forEach((f, i) => {
            const eo = AC.createOscillator(), eg = AC.createGain();
            eo.type = 'sawtooth'; eo.frequency.value = f;
            eg.gain.setValueAtTime(.18, t0 + i * .06); eg.gain.exponentialRampToValueAtTime(.001, t0 + i * .06 + .1);
            eo.connect(eg); eg.connect(sfxGain); eo.start(t0 + i * .06); eo.stop(t0 + i * .06 + .1);
          });
        } break;
      case 'powerup_spawn':
        o.type = 'sine'; o.frequency.setValueAtTime(880, now); o.frequency.exponentialRampToValueAtTime(1320, now + .1);
        g.gain.setValueAtTime(.2, now); g.gain.exponentialRampToValueAtTime(.001, now + .15);
        o.start(now); o.stop(now + .15); break;
      case 'shadow_drum': {
        // Deep ominous boom + noise crack
        const buf = AC.createBuffer(1, AC.sampleRate * .35, AC.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (AC.sampleRate * .04));
        const ns = AC.createBufferSource(), ng = AC.createGain();
        ns.buffer = buf; ng.gain.value = .28; ns.connect(ng); ng.connect(sfxGain); ns.start(now);
        const boom = AC.createOscillator(), bg = AC.createGain();
        boom.type = 'sine'; boom.frequency.setValueAtTime(60, now); boom.frequency.exponentialRampToValueAtTime(18, now + .5);
        bg.gain.setValueAtTime(.34, now); bg.gain.exponentialRampToValueAtTime(.001, now + .55);
        boom.connect(bg); bg.connect(sfxGain); boom.start(now); boom.stop(now + .55);
        const eerie = AC.createOscillator(), eg = AC.createGain();
        eerie.type = 'sine'; eerie.frequency.setValueAtTime(330, now); eerie.frequency.exponentialRampToValueAtTime(165, now + .4);
        eg.gain.setValueAtTime(.07, now); eg.gain.exponentialRampToValueAtTime(.001, now + .45);
        eerie.connect(eg); eg.connect(sfxGain); eerie.start(now); eerie.stop(now + .45);
      } break;
      case 'shadow_warn': {
        // Rising whine — 0.4s before the drum hits
        const w = AC.createOscillator(), wg = AC.createGain();
        w.type = 'sawtooth'; w.frequency.setValueAtTime(110, now); w.frequency.exponentialRampToValueAtTime(440, now + .35);
        wg.gain.setValueAtTime(.03, now); wg.gain.linearRampToValueAtTime(.08, now + .25); wg.gain.exponentialRampToValueAtTime(.001, now + .4);
        w.connect(wg); wg.connect(sfxGain); w.start(now); w.stop(now + .4);
      } break;
      default: o.start(now); o.stop(now + .02); break;
    }
  }

  // ── MUSIC — HTML5 Audio using provided MP3 tracks ────────────────────────
  // New songs — referenced by filename (must be in same directory as HTML)
  const NEW_SONGS = [
    'Arcade Labyrinth.mp3',
    'Highland Pixel Quest.mp3',
    'Baked Bagpipes x Cartridge Thunder (Mashup).mp3',
    'Baked Bagpipes x Cartridge Thunder (Mashup) (1).mp3',
    'Granite Savepoint x Highland Pixel Quest (Mashup).mp3',
    'Granite Savepoint x Highland Pixel Quest (Mashup) (1).mp3',
  ];
  // Music tracks are loaded as files relative to this HTML file.
  const SONG_PLAYLIST = [
    'Granite Savepoint.mp3',             // Title Screen
    'Baked Bagpipes.mp3',                // Level 1
    'Granite Savepoint (1).mp3',         // Level 2
    'Baked Bagpipes (1).mp3',            // Level 3
    'Cartridge Thunder.mp3',             // Level 4
    'Cartridge Thunder (1).mp3',         // Level 5 & Level 6 Boss
    // New tracks (indices 6-11, resolve to filenames from NEW_SONGS)
    'new:0', 'new:1', 'new:2', 'new:3', 'new:4', 'new:5',
    'chrome-ransom.mp3',
    'pixel-picnic 3.mp3',                // (was pixel-breakfast.mp3 — that
                                         //  file was never shipped; sub in
                                         //  the closest "bright chiptune"
                                         //  vibe so theme allowlist slot 13
                                         //  still resolves to an MP3 on disk)
    'chrome-ransom 2.mp3',
    'chrome-heartshot.mp3',
    // ── May 2026 additions — local files in the BagpipeGame folder.
    'citrus-brass-speed 2.mp3',
    'neon-verdict.mp3',
    'neon-verdict 2.mp3',
    'pixel-picnic.mp3',
    'pixel-picnic 2.mp3',
    'pixel-picnic 3.mp3',
  ];

  let _audio = null;
  let musicPlaying = false;
  let muted = false;
  // ── Menu music (separate channel from level music) ───────────────
  // Plays continuously on the title screen + worldmap. Crossfades to
  // / from level music when the player starts or finishes a level.
  // We keep it on its own HTMLAudio element rather than the level
  // _audio so we can cross-fade overlapped (level fade-in while menu
  // fades out) instead of cutting one off to start the other.
  let _menuAudio = null;
  let _menuPlaying = false;
  let _menuFadeTimer = null;
  let _levelFadeTimer = null;
  const MENU_TRACK = 'Granite Savepoint copy.mp3';
  const MENU_BASELINE = 0.55;   // a touch quieter than level music
  const MENU_FADE_MS  = 800;    // crossfade duration

  // All MP3 assets live under /music/ on disk. The codebase, dropdowns,
  // and previously-saved levels still reference bare filenames like
  // "chrome-ransom.mp3" for back-compat — we prepend the directory ONCE
  // at resolution time, inside _songFileFromEntry. Don't add `music/`
  // to the SONG_PLAYLIST / NEW_SONGS arrays or the <option value>s.
  const MUSIC_DIR = 'music/';

  function _normalizeSongEntry(entry) {
    // Preserve compatibility with custom levels saved before music was de-embedded.
    if (entry === 'embedded:chrome-ransom') return 'chrome-ransom.mp3';
    if (entry === 'chrome-ransom_2.mp3') return 'chrome-ransom 2.mp3';
    return entry;
  }

  function _songFileFromEntry(entry) {
    const normalized = _normalizeSongEntry(entry);
    let bare;
    if (normalized && normalized.startsWith('new:')) {
      const ni = parseInt(normalized.slice(4), 10);
      bare = NEW_SONGS[ni] || SONG_PLAYLIST[0];
    } else {
      bare = normalized || SONG_PLAYLIST[0];
    }
    // If the entry already contains a slash (e.g. user-supplied custom
    // path) leave it alone; otherwise prefix the standard music dir.
    return (bare.indexOf('/') >= 0) ? bare : (MUSIC_DIR + bare);
  }

  // ── Per-theme music allowlists ──────────────────────────────────
  // The SONG_PLAYLIST is a flat list (indices 0..N-1). When the engine
  // hasn't set an explicit ld.music override, we'd like the auto-pick to
  // match the level's vibe instead of just hashing world/level. Each
  // theme key here lists the SONG_PLAYLIST indices that "fit". Themes
  // not in the map fall back to the full playlist.
  //
  // The actual playlist (from above):
  //   0  Granite Savepoint        — calm strings
  //   1  Baked Bagpipes           — folk-rock energy
  //   2  Granite Savepoint (1)    — alt of 0
  //   3  Baked Bagpipes (1)       — alt of 1
  //   4  Cartridge Thunder        — chiptune drive
  //   5  Cartridge Thunder (1)    — chiptune drive II
  //   6-11  new:0..new:5          — Arcade Labyrinth / Highland Pixel
  //                                  Quest / two Bagpipes×Thunder mashups
  //                                  / two Granite×Highland mashups
  //   12 chrome-ransom            — synth-y
  //   13 pixel-picnic 3           — bright chiptune (substitute)
  //   14 chrome-ransom 2          — synth-y
  //   15 chrome-heartshot         — synth-y, faster
  //   16 citrus-brass-speed 2     — brass-led arcade speed
  //   17 neon-verdict             — neon synth
  //   18 neon-verdict 2           — neon synth II
  //   19-21 pixel-picnic 1/2/3    — pastoral chiptune
  const THEME_MUSIC = {
    highland:  [0, 1, 2, 3, 10, 11, 19, 20, 21],          // folk + pastoral
    volcanic:  [4, 5, 8, 9, 16, 4, 5],                    // driving chiptune + brass
    frozen:    [0, 2, 19, 20, 21, 6, 7],                  // soft + Arcade Labyrinth/Highland Pixel Quest
    shadow:    [12, 14, 15, 17, 18],                      // moody synth
    desert:    [16, 1, 3, 13, 21],                        // brass + pastoral
    forest:    [0, 19, 20, 21, 6, 7],                     // pastoral chip
    citadel:   [1, 3, 8, 9, 6, 7, 16],                    // bagpipe + mashup
    ocean:     [0, 2, 6, 7, 19],                          // calm
    blueprint: [4, 5, 13, 6, 7],                          // chiptune
    castle:    [1, 3, 8, 9, 16],                          // bagpipe + brass
    cosmic:    [12, 14, 15, 17, 18, 13],                  // synth-heavy
    cherry:    [0, 2, 19, 20, 21, 13],                    // pastoral + soft chip
    steampunk: [4, 5, 8, 9, 13, 16],                      // chiptune + brass
    cyber:     [12, 14, 15, 17, 18],                      // neon synth
    coralreef: [0, 2, 6, 7, 19, 20],                      // calm + pastoral
    halloween: [12, 14, 15, 17, 18, 5],                   // synth + chip-driven
    heaven:    [0, 2, 7, 10, 11, 19, 20],                 // serene strings + pastoral
  };

  function _songIndex() {
    // Level-specific music override (set in builder)
    try {
      const ld = (typeof getLevelData === "function") ? getLevelData() : null;
      if (ld && ld.music) {
        const si = SONG_PLAYLIST.indexOf(_normalizeSongEntry(ld.music));
        if (si >= 0) return si;
      }
      // Theme-aware random — pull from the theme's allowlist (if any).
      if (ld) {
        const theme = (typeof inferThemeKey === 'function')
          ? inferThemeKey(ld, 'highland')
          : (ld._bgTheme || ld.theme || 'highland');
        const allow = THEME_MUSIC[theme];
        if (allow && allow.length) {
          // Deterministic per level: hash worldId+levelId so revisits get
          // the same track, but the seed is folded into the allowlist
          // instead of the full SONG_PLAYLIST.
          const wId = (window.currentWorld | 0);
          const lId = (window.currentLevel | 0);
          const seed = (wId * 31 + lId * 7 + wId * lId) % allow.length;
          // Guard against out-of-range allowlist entries (older playlists).
          const cand = allow[seed];
          if (cand >= 0 && cand < SONG_PLAYLIST.length) return cand;
        }
      }
    } catch (e) { }
    // Fallback: deterministic per level over the full playlist
    const seed = ((window.currentWorld|0) * 31 + (window.currentLevel|0) * 7 + (window.currentWorld|0) * (window.currentLevel|0)) % SONG_PLAYLIST.length;
    return seed;
  }

  function startMusic() {
    // Crossfade: fade menu music out while we fade level music in.
    if (_menuPlaying) stopMenuMusic({ fade: true });
    if (musicPlaying && _audio) {
      _audio.play(); // just resume
      return;
    }
    musicPlaying = true;
    _playTrack(_songIndex());
  }

  function stopMusic() {
    musicPlaying = false;
    if (_audio) {
      _musicTime = _audio.currentTime; // save position
      _audio.pause(); // no fade needed for pause
    }
  }

  // ── Menu music ────────────────────────────────────────────────
  // Starts (or unmutes) the title-screen / world-select loop. If
  // level music is currently playing it gets faded out first so the
  // two don't talk over each other. Safe to call repeatedly —
  // duplicate calls just re-target the fade to the current slider
  // value.
  function startMenuMusic() {
    const target = muted ? 0 : (_masterVol * _musicVol * MENU_BASELINE);
    if (_menuPlaying && _menuAudio) {
      // Already have a menu track. If it was autoplay-blocked (still
      // paused), this gesture is our chance to actually start it.
      if (_menuAudio.paused) {
        const a0 = _menuAudio;
        a0.play().then(() => {
          if (_menuAudio === a0 && _menuPlaying) _fadeMenuTo(target, MENU_FADE_MS);
          else { try { a0.pause(); } catch (e) {} }
        }).catch(() => {});
      } else {
        _fadeMenuTo(target, 400);
      }
      return;
    }
    // If level music is up, fade it out concurrently.
    if (musicPlaying && _audio) _fadeLevelOut(MENU_FADE_MS);
    _menuPlaying = true;
    const filename = (MENU_TRACK.indexOf('/') >= 0) ? MENU_TRACK : (MUSIC_DIR + MENU_TRACK);
    const src = new URL(filename, document.baseURI).href;
    const a = new Audio(src);
    a.loop = true;
    a.volume = 0;
    _menuAudio = a;
    a.play().then(() => {
      // Guard the async fade-in: if stopMenuMusic ran while play() was
      // pending (e.g. the same click that started a level), DON'T fade the
      // menu back up — that's the bug where menu + level music overlapped.
      if (_menuAudio === a && _menuPlaying) _fadeMenuTo(target, MENU_FADE_MS);
      else { try { a.pause(); } catch (e) {} }
    }).catch(() => {
      // Autoplay block — leave _menuAudio in place; next user gesture retries.
    });
  }

  function stopMenuMusic(opts) {
    const fade = !opts || opts.fade !== false;
    // Mark stopped SYNCHRONOUSLY so any in-flight startMenuMusic play()
    // promise sees _menuPlaying === false and refuses to fade back up.
    _menuPlaying = false;
    if (!_menuAudio) { return; }
    if (!fade) {
      try { _menuAudio.pause(); } catch (e) {}
      _menuAudio = null;
      return;
    }
    _fadeMenuTo(0, MENU_FADE_MS, () => {
      if (_menuAudio) { try { _menuAudio.pause(); } catch (e) {} _menuAudio = null; }
    });
  }

  function _fadeMenuTo(target, ms, done) {
    if (_menuFadeTimer) { clearInterval(_menuFadeTimer); _menuFadeTimer = null; }
    if (!_menuAudio) { if (done) done(); return; }
    const start = _menuAudio.volume;
    const steps = Math.max(1, Math.ceil(ms / 40));
    let i = 0;
    _menuFadeTimer = setInterval(() => {
      i++;
      if (!_menuAudio) {
        clearInterval(_menuFadeTimer); _menuFadeTimer = null;
        if (done) done();
        return;
      }
      // Re-read the live target each tick so slider changes mid-fade
      // converge onto the new value (we still respect mute).
      const liveCap = muted ? 0 : (_masterVol * _musicVol * MENU_BASELINE);
      const t = i / steps;
      const v = start + (target - start) * t;
      _menuAudio.volume = Math.max(0, Math.min(liveCap > 0 ? Math.max(liveCap, target) : 1, v));
      if (i >= steps) {
        clearInterval(_menuFadeTimer); _menuFadeTimer = null;
        if (_menuAudio) _menuAudio.volume = Math.max(0, target);
        if (done) done();
      }
    }, 40);
  }

  function _fadeLevelOut(ms) {
    if (!_audio) return;
    const a = _audio;
    if (_levelFadeTimer) { clearInterval(_levelFadeTimer); _levelFadeTimer = null; }
    const start = a.volume;
    const steps = Math.max(1, Math.ceil(ms / 40));
    let i = 0;
    _levelFadeTimer = setInterval(() => {
      i++;
      try { a.volume = Math.max(0, start * (1 - i / steps)); } catch (e) {}
      if (i >= steps) {
        clearInterval(_levelFadeTimer); _levelFadeTimer = null;
        try { a.pause(); } catch (e) {}
      }
    }, 40);
    musicPlaying = false;
    if (_audio === a) _audio = null;
  }

  function _playTrack(idx) {
    if (_audio) { _audio.pause(); _audio = null; }
    if (!musicPlaying) return;
    const filename = _songFileFromEntry(SONG_PLAYLIST[idx]);
    const src = new URL(filename, document.baseURI).href;
    const a = new Audio(src);
    if (_musicTime) {
      a.currentTime = _musicTime;
      _musicTime = 0; // reset after using
    }
    a.loop = true;
    a.volume = 0;
    // Final volume: user sliders (master × music) × baseline. Mute zeros it.
    const targetVol = muted ? 0 : (_masterVol * _musicVol * MUSIC_BASELINE);

    a.play().then(() => {
      let t = 0;
      const fade = setInterval(() => {
        t += 40;
        // If user changed sliders mid-fade, re-compute every tick so the
        // final volume tracks the latest setting.
        const liveTarget = muted ? 0 : (_masterVol * _musicVol * MUSIC_BASELINE);
        a.volume = Math.min(liveTarget, liveTarget * (t / 600));
        if (t >= 600) clearInterval(fade);
      }, 40);
    }).catch(() => { /* Autoplay block caught */ });
    _audio = a;
  }

  function switchMusicForLevel() {
    const newIdx = _songIndex();
    _playTrack(newIdx);
  }

  function toggleMute() {
    muted = !muted;
    _applyAudioGraph();
    const btn = document.getElementById('mute-btn');
    if (btn) {
      btn.textContent = muted ? '🔇' : '🔊';
      btn.classList.toggle('muted', muted);
    }
  }

  // ── Pause audio when the app is backgrounded ───────────────────
  // iOS home-screen PWAs keep <audio> elements playing after the app
  // is swiped away / closed — so the menu (or level) track plays on
  // in the background. Pause both tracks whenever the page is hidden
  // and resume the intended one when it comes back to the foreground.
  function _pauseForHide() {
    try { if (_menuAudio) _menuAudio.pause(); } catch (e) { }
    try { if (_audio) _audio.pause(); } catch (e) { }
  }
  function _resumeForShow() {
    try { if (_menuPlaying && _menuAudio) { const p = _menuAudio.play(); if (p && p.catch) p.catch(() => { }); } } catch (e) { }
    try { if (musicPlaying && _audio) { const p = _audio.play(); if (p && p.catch) p.catch(() => { }); } } catch (e) { }
  }
  try {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) _pauseForHide(); else _resumeForShow();
    });
    window.addEventListener('pagehide', _pauseForHide);
    window.addEventListener('freeze', _pauseForHide);
  } catch (e) { }

  // ── Exports ────────────────────────────────────────────────────
  // Namespaced object for new call sites:
  window.GameAudio = {
    AC, get masterGain() { return masterGain; }, get sfxGain() { return sfxGain; },
    sfx, resumeAC, initAudio,
    SONG_PLAYLIST, NEW_SONGS, MUSIC_DIR,
    startMusic, stopMusic, switchMusicForLevel, toggleMute,
    startMenuMusic, stopMenuMusic,
    setMasterVolume, setMusicVolume, setSfxVolume, getVolumes,
    get musicPlaying() { return musicPlaying; },
    get muted() { return muted; },
  };
  // Bare-global mirror for back-compat. The engine's existing references
  // to AC, sfx(), startMusic(), etc. land here. Drop this block once
  // every call site has been migrated to GameAudio.*.
  window.AC = AC;
  window.sfx = sfx;
  window.resumeAC = resumeAC;
  window.initAudio = initAudio;
  window.SONG_PLAYLIST = SONG_PLAYLIST;
  window.NEW_SONGS = NEW_SONGS;
  window.MUSIC_DIR = MUSIC_DIR;
  window.startMusic = startMusic;
  window.stopMusic = stopMusic;
  window.startMenuMusic = startMenuMusic;
  window.stopMenuMusic = stopMenuMusic;
  window.switchMusicForLevel = switchMusicForLevel;
  window.toggleMute = toggleMute;
  window.setMasterVolume = setMasterVolume;
  window.setMusicVolume = setMusicVolume;
  window.setSfxVolume = setSfxVolume;
  window.getVolumes = getVolumes;
  // The mutable flags are exposed as accessors so an external write also
  // updates the closure value. Mirror them too for direct read access:
  Object.defineProperty(window, "musicPlaying", {
    get() { return musicPlaying; },
    set(v) { musicPlaying = v; },
    configurable: true,
  });
  Object.defineProperty(window, "muted", {
    get() { return muted; },
    set(v) { muted = v; },
    configurable: true,
  });
  Object.defineProperty(window, "masterGain", {
    get() { return masterGain; },
    set(v) { masterGain = v; },
    configurable: true,
  });
  // _musicTime is the track-resume position. src/ui.js's _startGameInner
  // writes `_musicTime = 0` when switching to a different level so the new
  // track doesn't resume from the previous level's offset. Expose via
  // accessor so that bare-name write reaches this module's slot.
  Object.defineProperty(window, "_musicTime", {
    get() { return _musicTime; },
    set(v) { _musicTime = v; },
    configurable: true,
  });
})();
