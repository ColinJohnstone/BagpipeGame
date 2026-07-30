// src/state.js
// ──────────────────────────────────────────────────────────────────
// Shared mutable game state — Phase 3 of the module split. See
// src/ARCHITECTURE.md.
//
// Two access patterns coexist:
//
//   COLD state (game-screen flags + counters): GS, score, coins,
//     currentLevel, currentWorld, selectedWorld/SubWorld/Category,
//     levelTime, seaMonsterX. Stored INSIDE this module's IIFE and
//     exposed via Object.defineProperty accessors on `window`. Touched
//     a few times per second; accessor overhead is invisible.
//
//   HOT state (per-frame): player, camera, frameCount, enemies,
//     projectiles, enemyProjectiles, collectibles, particles, powerups,
//     portals, goalRect, spikeBlockTimer, weatherState, playerPathTrail.
//     These live in the inline script as `var` declarations so
//     `window.X` is a plain DATA property — bare references resolve
//     at maximum speed (critical for tight loops reading `player.X`,
//     `frameCount`, `camera.x`).
//
//     For these, we DON'T move the slots — we just expose proxy
//     accessors on `GameState` that read/write `window.X` directly.
//     New code can opt into `GameState.player` for the namespaced
//     API; hot inner loops keep using bare `player` for max JIT
//     friendliness.
//
// Why Object.defineProperty + bare-global mirrors for cold state?
//   Hundreds of inline call sites reference `score`, `GS`, etc.
//   directly. If we just `window.GameState = { … }`, every call site
//   would need rewriting. Instead each property is also installed on
//   `window` as an accessor, so a bare `score` reference in the inline
//   <script> resolves to `window.score` and goes through our getter.
//   This keeps the migration incremental — call sites get rewritten
//   to `GameState.score` opportunistically over time, not in one big
//   bang.
// ──────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Cold state — game-screen flags + counters ──────────────────
  // Top-level `let` slots; live values follow the same names/types
  // the inline script used to declare with `let`.
  let _GS                = 'title';
  let _score             = 0;
  let _coins             = 0;
  let _currentLevel      = 1;
  let _currentWorld      = 1;
  let _selectedWorld     = 1;
  let _selectedSubWorld  = 0;
  let _selectedCategory  = 'og';
  let _levelTime         = 0;
  let _seaMonsterX       = null;

  // Build (getter, setter) pairs once and stamp them onto both window
  // and GameState so the binding is bidirectional and migration-safe.
  function _bind(name, get, set) {
    Object.defineProperty(window, name, {
      get, set, configurable: true, enumerable: true,
    });
  }
  _bind('GS',                () => _GS,               v => { _GS = v; });
  _bind('score',             () => _score,            v => { _score = v; });
  _bind('coins',             () => _coins,            v => { _coins = v; });
  _bind('currentLevel',      () => _currentLevel,     v => { _currentLevel = v; });
  _bind('currentWorld',      () => _currentWorld,     v => { _currentWorld = v; });
  _bind('selectedWorld',     () => _selectedWorld,    v => { _selectedWorld = v; });
  _bind('selectedSubWorld',  () => _selectedSubWorld, v => { _selectedSubWorld = v; });
  _bind('selectedCategory',  () => _selectedCategory, v => { _selectedCategory = v; });
  _bind('levelTime',         () => _levelTime,        v => { _levelTime = v; });
  _bind('seaMonsterX',       () => _seaMonsterX,      v => { _seaMonsterX = v; });

  // Namespaced surface for new call sites. Both this and the bare
  // window globals read/write the SAME underlying slots — so they
  // never diverge.
  const GameState = {
    // ── Cold state (slots owned here) ──────────────────────────────
    get GS()               { return _GS;               }, set GS(v)              { _GS = v;              },
    get score()            { return _score;            }, set score(v)           { _score = v;           },
    get coins()            { return _coins;            }, set coins(v)           { _coins = v;           },
    get currentLevel()     { return _currentLevel;     }, set currentLevel(v)    { _currentLevel = v;    },
    get currentWorld()     { return _currentWorld;     }, set currentWorld(v)    { _currentWorld = v;    },
    get selectedWorld()    { return _selectedWorld;    }, set selectedWorld(v)   { _selectedWorld = v;   },
    get selectedSubWorld() { return _selectedSubWorld; }, set selectedSubWorld(v){ _selectedSubWorld = v;},
    get selectedCategory() { return _selectedCategory; }, set selectedCategory(v){ _selectedCategory = v;},
    get levelTime()        { return _levelTime;        }, set levelTime(v)       { _levelTime = v;       },
    get seaMonsterX()      { return _seaMonsterX;      }, set seaMonsterX(v)     { _seaMonsterX = v;     },

    // ── Hot state (proxy accessors — slot owned by inline `var`s) ─
    // Reads/writes go straight to `window.X` (a data property), so
    // hot-path access via bare names stays at full speed.
    get player()           { return window.player;           }, set player(v)           { window.player = v;           },
    get camera()           { return window.camera;           }, set camera(v)           { window.camera = v;           },
    get frameCount()       { return window.frameCount;       }, set frameCount(v)       { window.frameCount = v;       },
    get enemies()          { return window.enemies;          }, set enemies(v)          { window.enemies = v;          },
    get projectiles()      { return window.projectiles;      }, set projectiles(v)      { window.projectiles = v;      },
    get enemyProjectiles() { return window.enemyProjectiles; }, set enemyProjectiles(v) { window.enemyProjectiles = v; },
    get collectibles()     { return window.collectibles;     }, set collectibles(v)     { window.collectibles = v;     },
    get particles()        { return window.particles;        }, set particles(v)        { window.particles = v;        },
    get powerups()         { return window.powerups;         }, set powerups(v)         { window.powerups = v;         },
    get portals()          { return window.portals;          }, set portals(v)          { window.portals = v;          },
    get goalRect()         { return window.goalRect;         }, set goalRect(v)         { window.goalRect = v;         },
    get spikeBlockTimer()  { return window.spikeBlockTimer;  }, set spikeBlockTimer(v)  { window.spikeBlockTimer = v;  },
    get weatherState()     { return window.weatherState;     }, set weatherState(v)     { window.weatherState = v;     },
    get playerPathTrail()  { return window.playerPathTrail;  }, set playerPathTrail(v)  { window.playerPathTrail = v;  },

    // ── Debug helpers ──────────────────────────────────────────────
    /**
     * Return a shallow snapshot of every state value for logging /
     * regression diffing. Player / camera / enemies references stay
     * live (no deep clone) but the top-level keys are stable.
     */
    snapshot() {
      return {
        // Cold
        GS: _GS, score: _score, coins: _coins,
        currentLevel: _currentLevel, currentWorld: _currentWorld,
        selectedWorld: _selectedWorld, selectedSubWorld: _selectedSubWorld,
        selectedCategory: _selectedCategory, levelTime: _levelTime,
        seaMonsterX: _seaMonsterX,
        // Hot (live refs — count instead of including the whole object)
        playerX:        window.player && window.player.x,
        playerY:        window.player && window.player.y,
        playerHp:       window.player && window.player.hp,
        cameraX:        window.camera && window.camera.x,
        frameCount:     window.frameCount,
        enemiesAlive:   Array.isArray(window.enemies) ? window.enemies.filter(e => e && !e.dead).length : 0,
        projectilesAlive: Array.isArray(window.projectiles) ? window.projectiles.filter(p => p && p.life > 0).length : 0,
        weatherType:    window.weatherState && window.weatherState.type,
      };
    },

    /**
     * Convenience: dump snapshot() to console. Useful when paused.
     *   GameState.dump()
     */
    dump() {
      // eslint-disable-next-line no-console
      console.table(this.snapshot());
      return this.snapshot();
    },
  };
  window.GameState = GameState;
})();
