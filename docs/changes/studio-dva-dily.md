# Asset Studio split into two pages

## What and why
Owner 21 Nov 2026: "rozděl to studio na 2, laby přidej tam kde bude víc místa". One claude.ai page holds at most 512
files and the Studio was at 504. It is now two pages that link to each other:
- **Buildings and fortifications** – the old artifact `d772dccf…` (https://claude.ai/artifact/Tc4cSr8CHBVvfAAeBkFXCy):
  building designs, Buildings in game, Fire Lab, Phaser demo, guide. 397 files.
- **Characters, nature and labs** – new artifact `4ad4021c…` (https://claude.ai/artifact/AEvhN8rkFejSAvD7aTDnsp):
  characters, animals, vehicles, nature, ground, objects, UI Lab, World Lab, Path Lab, Light Lab, guide. 436 files.

## Files and systems
- `scripts/studio-parts.mjs` (new, `npm run studio:parts`) writes `studio/src/parts/{all,buildings,world}.js`: the
  `import.meta.glob` lists of each part (`specModules`, `gameSpriteModules`, `exportedPngModules`,
  `exportedMetaModules`; keys stripped to `art/…` and `public/…`). Glob patterns must be literal, so they are generated.
- `studio/vite.config.js`: `STUDIO_PART` (all | buildings | world) picks the pages, the alias `@studio-part`, the
  output dir (`dist-studio`, `dist-studio-buildings`, `dist-studio-world`) and the inline limit. A `partLinks` plugin
  turns nav links to the other part's pages into links (↗, new tab) to the other artifact; `STUDIO_URLS` holds the
  two addresses (env `STUDIO_WORLD_URL` / `STUDIO_BUILDINGS_URL` override).
- `studio/src/data.js`, `fire-lab/main.js`, `demo/phaser-demo.js` import their lists from `@studio-part`;
  `buildings/main.js` only globs `public/assets/buildings/**`.
- `package.json`: `studio:parts`, `studio:build:parts`; `studio:build` runs the parts script first (part `all`).
- `.gitignore`: `dist-studio-*/`.

## Implementation decisions
- The building part keeps the old artifact so its address and its review database stay.
- The new part has its own database (same rules: read view, write interact). Reviews made there must be taken over
  from both artifacts.
- `all` still builds every page (local work, smoke test).

## Save/Load impact
None.

## Testing
- `npm run studio:build:parts`; both artifacts' file lists compared with the builds by sha256 (no difference).
- `npm test`. `studio:smoke` fails at the same pre-existing assertion as before the change.

## Notes for the next agent
- Publishing: build with `npm run studio:build:parts`, then publish `dist-studio-buildings` to `d772dccf…` and
  `dist-studio-world` to `4ad4021c…` (each over 256 files → two publish calls; files under /tmp are refused and
  hard-linked files too, copy them).
- Take-over (`db_list` → `studio:sync`) must read the reviews and preferred docs of both artifacts.
