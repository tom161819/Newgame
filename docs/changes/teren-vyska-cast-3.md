# Terrain height, part 3: terrain settings in the world code, rocks on hills, World Editor tab

## What and why
Plan item `m-teren-vyska` (owner 8 Nov 2026: hills affect the game, smooth hills, sometimes plains, water in valleys). Parts 1 and 2 (0.94.0, 0.96.0) brought hills, slopes, lift and sight. Part 3 was left: the sliders in the world generator, rocks on hills, and the editor (handover 19 Nov 2026: "pokračuj další prací Mechaniky podle plánu").

## What changed
- **World code, generator 6** (`src/data/worldCode.js`): four settings at the end of `WORLD_SETTINGS` – Hilliness, Hill height, Plains, Bank slope – taken from the World Lab's `HEIGHT_SETTINGS` (`height:true`). A code now has 16 digits; `settingsCount(generator)` says 12 for generator 5 and older. `heightLevelsOf(levels)` gives the terrain levels (defaults for older codes), `fullLevels(levels)` fills an older code up to 16.
- **The game's relief** (`GameScene`) uses the world's terrain levels (`buildRelief(ground, seed, heightLevelsOf(levels))`). Older codes fall back to the defaults, so saved games keep exactly the same hills.
- **Rocks on hills** (`worldGeneration.js` `placeRocks`, `WORLD_GENERATION.rocks.flat/hill/slope`): the hills of the world (same algorithm and `height` stream as the game) weigh where outcrops go – a hilltop or a steep side up to about three times likelier than flat land. The number of outcrops is unchanged. `worldStreams` now carries its `seed` for this.
- **UI**: New Game's world generator shows the four sliders with what they make; the World Editor has a **Terrain** tab with them. i18n `setup.gen.hilliness…`, `editor.tab.terrain` (en, cs).
- **World Editor presets** saved before (12 levels) are kept with default terrain (`worldEditorStore.normalizeRecord`).
- **Studio World Lab**: its world list skips the four terrain settings (it has its own height panel); a saved Lab state with 12 levels is filled up.

## Files and systems
`src/data/worldCode.js`, `src/data/worldTerrain.js`, `src/data/worldEditorStore.js`, `src/game/worldGeneration.js`, `src/game/seededRandom.js`, `src/game/GameScene.js`, `src/ui/WorldGenerator.js`, `src/ui/WorldEditor.js`, `studio/src/world-lab/main.js`, i18n; tests `world-code`, `world-editor`, `zelezny-dul-misto`; smoke scripts use generator-6 codes.

## Implementation decisions
- The terrain digits are appended (world code rule: new settings only at the end with a new generator version).
- Rock weighting needs the hills before the rocks; they are computed from the ground at that point (water and fords are final then), with a fresh `height` stream so the game's relief is not shifted.
- The plan's map-editor brushes (raise/lower/level/smooth) are not done: the game has no hand map editor yet (`m-editor-mapy`).
- The Studio World Lab still keeps its height sliders apart from the code (a Lab code carries default terrain digits). Joining them is a Studio (Grafika) task.

## Save/Load impact
None for saves: SAVE_VERSION stays 66. A saved game keeps its generator-5 code (12 digits) and default hills. A New Game needs a generator-6 code; an old code is refused as before for older generators.

## Testing
- Full suite; world code round trip and old codes; presets; the Iron Mine sweep.
- Browser smokes `world-code` and `world-editor` pass (`node scripts/browser-smoke.mjs --base=/ --world-code --world-editor`).
- `scripts/building-menu-smoke.mjs` was out of date since 0.139.0 (it expected `menuOrder` only and stopped every smoke run there); it now uses `BUILDING_MENU_ORDER` like the game. The smoke run then stops later, at the King's stone pickup click (`browser-smoke.mjs` ~l. 362) – not looked into here.

## Measured
Five seeds, default levels: rock tiles stand on average 2.60 height units high against 1.99 for other tiles (generator 5: 2.15 against 2.00); the number of rock tiles stays about the same (1790 against 1831).

## Notes for the next agent
- The seed `SU24BGPY` (a reported generator-5 world) is another world in generator 6; its nearest Iron Deposit is ~28 tiles from the Castle (was 18).
