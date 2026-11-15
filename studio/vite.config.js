// Asset Studio is a separate Vite app. It never changes the game's build:
// `npm run build` keeps using the root vite.config.js, while this config builds
// studio/ into dist-studio/ with relative URLs, so it works from any sub-path
// (for example /Newgame/studio/ on GitHub Pages) and without a backend.
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const studio = fileURLToPath(new URL('.', import.meta.url));
const repository = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root: studio,
  base: './',
  publicDir: false,
  server: { fs: { allow: [repository] } },
  preview: { port: 4174 },
  build: {
    outDir: fileURLToPath(new URL('../dist-studio', import.meta.url)),
    emptyOutDir: true,
    assetsDir: 'files',
    // Small sprites go inline into the scripts: an artifact holds at most 512 files (8 Nov 2026: 458 before the rocks and plants).
    // 15 Nov 2026: 24 KB – the 48 season oaks took the build to 561 files.
    assetsInlineLimit: 24576,
    chunkSizeWarningLimit: 2500,
    rollupOptions: { input: { index: `${studio}index.html`, 'phaser-demo': `${studio}phaser-demo.html`, 'path-lab': `${studio}path-lab.html`, buildings: `${studio}buildings.html`, 'ui-lab': `${studio}ui-lab.html`, 'world-lab': `${studio}world-lab.html`, 'fire-lab': `${studio}fire-lab.html`, 'light-lab': `${studio}light-lab.html` } },
  },
});
