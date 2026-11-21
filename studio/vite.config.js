// Asset Studio is a separate Vite app. It never changes the game's build:
// `npm run build` keeps using the root vite.config.js, while this config builds
// studio/ into dist-studio/ with relative URLs, so it works from any sub-path
// (for example /Newgame/studio/ on GitHub Pages) and without a backend.
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const studio = fileURLToPath(new URL('.', import.meta.url));
const repository = fileURLToPath(new URL('..', import.meta.url));
// Owner 21 Nov 2026: STUDIO_PART=buildings|world builds one of the two Studio pages (512-file limit of a claude.ai
// page); without it the whole Studio is built (local work, the smoke test). scripts/studio-parts.mjs writes the lists.
const PART = process.env.STUDIO_PART || 'all';
const PAGES = { all: ['index', 'phaser-demo', 'path-lab', 'buildings', 'guide', 'ui-lab', 'world-lab', 'fire-lab', 'light-lab'],
  buildings: ['index', 'buildings', 'guide', 'fire-lab', 'phaser-demo'], world: ['index', 'guide', 'ui-lab', 'world-lab', 'path-lab', 'light-lab'] }[PART];
// The other part's page (claude.ai): the nav links to its labs there.
// The two Studio pages on claude.ai link to each other.
const STUDIO_URLS = { buildings: 'https://claude.ai/artifact/Tc4cSr8CHBVvfAAeBkFXCy', world: 'https://claude.ai/artifact/AEvhN8rkFejSAvD7aTDnsp' };
const OTHER = { buildings: process.env.STUDIO_WORLD_URL ?? STUDIO_URLS.world, world: process.env.STUDIO_BUILDINGS_URL ?? STUDIO_URLS.buildings, all: '' }[PART];

// In a part, nav links to the other part's pages go to that page (or vanish when its address is not known), and the
// part's name is shown under the title.
const partLinks = {
  name: 'studio-part-links',
  transformIndexHtml(html) {
    if (PART === 'all') return html;
    const title = PART === 'buildings' ? 'Buildings and fortifications' : 'Characters, nature and labs';
    html = html.replace(/<a ([^>]*?)href="\.\/([a-z-]+)\.html"([^>]*)>(.*?)<\/a>/g, (all, a, page, b, text) => PAGES.includes(page) ? all
      : OTHER ? `<a ${a}href="${OTHER}" target="_blank" rel="noopener" title="In the other part of the Studio"${b}>${text} ↗</a>` : '');
    return html.replace('<span class="brand-sub">Medieval Kingdom · 2:1 isometric</span>', `<span class="brand-sub">Medieval Kingdom · ${title}</span>`);
  },
};

export default defineConfig({
  plugins: [partLinks],
  root: studio,
  base: './',
  resolve: { alias: { '@studio-part': fileURLToPath(new URL(`./src/parts/${PART}.js`, import.meta.url)) } },
  publicDir: false,
  server: { fs: { allow: [repository] } },
  preview: { port: 4174 },
  build: {
    outDir: fileURLToPath(new URL(PART === 'all' ? '../dist-studio' : `../dist-studio-${PART}`, import.meta.url)),
    emptyOutDir: true,
    assetsDir: 'files',
    // Small sprites go inline into the scripts: an artifact holds at most 512 files (8 Nov 2026: 458 before the rocks and plants).
    // 15 Nov 2026: 24 KB – the 48 season oaks took the build to 561 files.
    // 21 Nov 2026: each of the two parts has room for more files, so it inlines less (its largest script stays well under
    // the 16 MiB a claude.ai page allows).
    assetsInlineLimit: { all: 24576, buildings: 8192, world: 16384 }[PART],
    chunkSizeWarningLimit: 2500,
    rollupOptions: { input: Object.fromEntries(PAGES.map(page => [page, `${studio}${page}.html`])) },
  },
});
