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
    chunkSizeWarningLimit: 2500,
    rollupOptions: { input: { index: `${studio}index.html`, 'phaser-demo': `${studio}phaser-demo.html` } },
  },
});
