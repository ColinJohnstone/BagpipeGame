import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Ascend the Highlands — Vite config.
//
// The game is a "classic globals" app: ~20 scripts in src/ and the per-world
// data in levels/ load via plain <script src> tags and attach to window, and
// index.html wires ~150 inline onclick handlers to those globals. We do NOT
// convert that to ESM — Vite is here to (a) give us a dev server + HMR, (b)
// let us pull in Three.js via npm for the 3D mode, and (c) produce a minified
// static build that still deploys to GitHub Pages.
//
// So: the existing classic scripts, the level data, music, the service worker
// and image assets are copied verbatim into dist/ (never hashed or reordered,
// which would break the load-order-dependent globals and the SW precache list).
// Only genuine ES modules (the new src/three/ code + its `import 'three'`) go
// through Rollup and get bundled.
export default defineConfig({
  // Relative base so the build works from a GitHub Pages project subpath
  // (username.github.io/<repo>/) as well as a domain root.
  base: './',

  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'src/*.js', dest: 'src' },
        { src: 'levels/*.js', dest: 'levels' },
        { src: 'music/*.mp3', dest: 'music' },
        { src: 'sw.js', dest: '.' },
        { src: '*.png', dest: '.' },
      ],
    }),
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Keep the built HTML close to the source so the classic <script src>
    // tags keep resolving to the copied-verbatim files.
    assetsInlineLimit: 0,
  },

  server: {
    port: 8765,
    open: false,
  },
});
