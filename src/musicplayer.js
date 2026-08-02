// src/musicplayer.js
// ──────────────────────────────────────────────────────────────────
// MUSIC PLAYER (jukebox) — play any of the game's soundtrack from a
// dedicated screen. Uses its own HTMLAudio element (independent of the
// level/menu music engine); opening it pauses the menu music, closing
// it resumes it. Exposes window.MusicPlayer.
// ──────────────────────────────────────────────────────────────────

(function () {
  // Curated list of the game's DISTINCT songs (the primary file for each —
  // the "(1)/2/copy" variants on disk are per-level alternates of these).
  const TRACKS = [
    ['Granite Savepoint.mp3', 'Granite Savepoint'],
    ['Baked Bagpipes.mp3', 'Baked Bagpipes'],
    ['Cartridge Thunder.mp3', 'Cartridge Thunder'],
    ['Highland Pixel Quest.mp3', 'Highland Pixel Quest'],
    ['Arcade Labyrinth.mp3', 'Arcade Labyrinth'],
    ['Baked Bagpipes x Cartridge Thunder (Mashup).mp3', 'Baked Bagpipes × Cartridge Thunder'],
    ['Granite Savepoint x Highland Pixel Quest (Mashup).mp3', 'Granite Savepoint × Highland Pixel Quest'],
    ['chrome-ransom.mp3', 'Chrome Ransom'],
    ['chrome-heartshot.mp3', 'Chrome Heartshot'],
    ['citrus-brass-speed 2.mp3', 'Citrus Brass Speed'],
    ['neon-verdict.mp3', 'Neon Verdict'],
    ['pixel-picnic.mp3', 'Pixel Picnic'],
    ['pixel-breakfast.mp3', 'Pixel Breakfast'],
  ];
  const DIR = window.MUSIC_DIR || 'music/';

  let audio = null, idx = 0, shuffle = false, loop = false, wired = false, active = false;
  // Guitar-Hero fret colours, cycled down the setlist.
  const FRETS = ['#4ade5a', '#ff4d4d', '#ffd23f', '#4d9bff', '#ff9d3f'];
  const el = (id) => document.getElementById(id);
  const fmt = (t) => { if (!isFinite(t) || t < 0) t = 0; const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + (s < 10 ? '0' : '') + s; };

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio(); audio.preload = 'metadata';
    audio.addEventListener('ended', () => { if (loop) { audio.currentTime = 0; audio.play().catch(() => {}); } else next(); });
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('play', highlight);
    audio.addEventListener('pause', highlight);
    return audio;
  }

  function updateProgress() {
    if (!audio) return;
    const seek = el('mp-seek');
    if (seek && !seek._dragging && audio.duration) seek.value = Math.round(audio.currentTime / audio.duration * 1000);
    if (el('mp-cur')) el('mp-cur').textContent = fmt(audio.currentTime);
    if (el('mp-dur')) el('mp-dur').textContent = fmt(audio.duration);
  }

  function buildList() {
    const list = el('mp-list'); if (!list) return;
    list.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'mp-row'; row.dataset.i = i;
      row.innerHTML =
        '<span class="mp-fret" style="color:' + FRETS[i % FRETS.length] + ';background:' + FRETS[i % FRETS.length] + ';"></span>'
        + '<span class="mp-num">' + String(i + 1).padStart(2, '0') + '</span>'
        + '<span class="mp-name">' + t[1] + '</span>'
        + '<span class="mp-eq"><i></i><i></i><i></i><i></i></span>';
      row.onclick = () => play(i);
      list.appendChild(row);
    });
    const head = el('mp-sethead'); if (head) head.textContent = '▮ SETLIST · ' + TRACKS.length + ' SONGS';
    highlight();
  }

  function highlight() {
    const playing = audio && !audio.paused;
    document.querySelectorAll('#mp-list .mp-row').forEach((r, i) => {
      r.classList.toggle('active', i === idx);
    });
    const title = TRACKS[idx] ? TRACKS[idx][1] : '—';
    if (el('mp-title')) el('mp-title').textContent = title;
    if (el('mp-playpause')) el('mp-playpause').textContent = playing ? '⏸' : '▶';
    if (el('mp-shuffle')) el('mp-shuffle').style.opacity = shuffle ? '1' : '0.5';
    if (el('mp-loop')) el('mp-loop').style.opacity = loop ? '1' : '0.5';
    // Turntable: spin the disc while playing, freeze the equalizer + disc when paused.
    const disc = el('mp-disc'), label = el('mp-disc-label'), arm = el('mp-tonearm'), list = el('mp-list');
    const started = !!(audio && audio.src);
    if (disc) { disc.classList.toggle('spin', started); disc.classList.toggle('paused', started && !playing); }
    if (list) list.classList.toggle('paused', started && !playing);
    if (arm) arm.classList.toggle('on', playing);
    if (label) label.textContent = started ? (title.replace(/[^A-Za-z0-9]/g, '')[0] || '♪').toUpperCase() : '♪';
  }

  function play(i) {
    // Belt-and-braces: never let the menu loop resume under a chosen track.
    try { if (active && typeof stopMenuMusic === 'function') stopMenuMusic({ fade: false }); } catch (e) {}
    idx = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    ensureAudio();
    audio.src = DIR + TRACKS[idx][0];
    audio.volume = (el('mp-vol') ? el('mp-vol').value : 80) / 100;
    audio.play().catch(() => {});
    highlight();
  }
  function togglePlay() { ensureAudio(); if (!audio.src) { play(idx); return; } if (audio.paused) audio.play().catch(() => {}); else audio.pause(); highlight(); }
  function next() { shuffle ? play(Math.floor(Math.random() * TRACKS.length)) : play(idx + 1); }
  function prev() { if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; } play(idx - 1); }

  function wire() {
    if (wired) return; wired = true;
    el('mp-playpause').onclick = togglePlay;
    el('mp-next').onclick = next;
    el('mp-prev').onclick = prev;
    el('mp-shuffle').onclick = () => { shuffle = !shuffle; highlight(); };
    el('mp-loop').onclick = () => { loop = !loop; highlight(); };
    const seek = el('mp-seek');
    seek.addEventListener('input', () => { seek._dragging = true; });
    seek.addEventListener('change', () => { seek._dragging = false; if (audio && audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; });
    const vol = el('mp-vol');
    vol.addEventListener('input', () => { if (audio) audio.volume = vol.value / 100; });
  }

  function open() {
    active = true;
    // Hard-stop the menu loop (no fade overlap) so nothing plays under the jukebox.
    try { if (typeof stopMenuMusic === 'function') stopMenuMusic({ fade: false }); } catch (e) {}
    // Seed the volume slider from the game's music volume.
    try {
      if (typeof getVolumes === 'function' && el('mp-vol')) {
        const v = getVolumes(); el('mp-vol').value = Math.round((v.master != null ? v.master : 1) * (v.music != null ? v.music : 1) * 100);
      }
    } catch (e) {}
    wire();
    buildList();
    if (window.UI && UI.showScreen) UI.showScreen('s-musicplayer');
  }
  function close() {
    active = false;
    if (audio) audio.pause();
    highlight();
    if (window.UI && UI.showScreen) UI.showScreen('s-title');
    try { if (typeof startMenuMusic === 'function') startMenuMusic(); } catch (e) {}
  }

  window.MusicPlayer = { open, close, play, next, prev, togglePlay, isOpen: () => active, TRACKS };
})();
