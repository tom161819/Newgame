# Continuous ground in the game + world generator in New Game

## What and why
- The owner chose ground settings in the World Lab (groundProposal/default, 8 Nov 2026) and asked to take them over into the game ("převzít zemi"). The game now paints grass, sand, mud, shore rocks and rivers as one continuous surface (no tile diamonds), with plants, stones and objects in the shallows, by season.
- "Bod 1": New Game setup has a World generator (folding section under World): a slider per world setting, the existing New seed button and a map preview. It only changes the world code (MKW…), so starting, saving and sharing work as before.
- "Bod 2" (manual map editor) is only a plan task (m-editor-mapy).

## Files and systems
- src/render/continuousGround.js (moved from studio/src/world-lab/ground.js; the Studio re-exports it), src/data/groundStyle.json (owner's settings).
- src/game/TerrainRenderer.js: groundStyle 'continuous' (default) paints each chunk with the engine; explored-but-unseen ground keeps the grey memory look; paths draw on top. mkDev.setGroundStyle('tiles') returns the old look; mkDev.scene() for tests.
- src/ui/WorldGenerator.js, src/ui/NewGameSetup.js, index.html, src/style.css, i18n (setup.gen.*).
- tests/world-generator-ui.test.js.

## Implementation decisions
- Chunk paint uses a coarse grid (6 px) plus per-pixel grain; each chunk paints one tile into seen neighbours so seams do not show.
- The ground config sits in src/data (the game may not import art/).
- Duck families and the animated flow overlay stay in the World Lab for now (plan task g-kachny-proud-hra); the game keeps its own fish shadows.
- Slider descriptions use the English text from worldCode.js (same as the Studio).

## Save/Load impact
None. Ground is drawn from the saved world; no SAVE_VERSION change.

## Testing
npm test (all pass), build, browser: new game with code MKW2-155515555555-1, river view, chunk paint ok, FPS ~49 in headless swiftshader; setup generator: sliders change the code and the preview.

## Notes for the next agent
- Ground look tuning: change src/data/groundStyle.json (or propose again from the World Lab and copy the settings).
- Performance on weak PCs is not measured yet; if needed raise the grid step in paintContinuousChunk.

## 0.73.1 fix (owner report: fog of war broken)
Each chunk painted one tile into its neighbour chunks to hide seams; those pixels were never greyed by the neighbour's remembered overlay, so explored ground showed light stripes along chunk borders. Chunks now paint only their own tiles. A faint seam between remembered chunks can remain.

## 0.74.0 (owner: fog still broken, 9 FPS; report items 1–5; WebGL)
- Cause of both: every fog change repainted whole chunks with the continuous painter (~55 ms each) and only 2 dirty chunks per frame were allowed, so the view lagged (dark around the king) and FPS fell.
- Ground (land, water, plants) is cached per chunk (key: season + buildings on the chunk) and drawn with one drawImage; fog repaints are cheap, so 8 dirty chunks per frame. A stale ground (season, new building) repaints one chunk per frame; others keep their old picture meanwhile.
- Remembered ground is greyed per pixel (greyRemembered) with the same tile rule as the paint; ground has a 0.05-tile bleed so zoomed chunk edges show no line. Fog changes also dirty neighbour chunks; neighbour tiles that are unexplored get blacked over plant tops.
- RiverLife.js: flow streaks (makeWaterField.flow per 16×16 chunk) + 3 duck families (duckSites, drawDuck pre-rendered in 16 headings), only in sight, none in winter.
- Settings → Renderer select (localStorage newgame.renderer; ?renderer= still wins).
- Generator slider texts via i18n (describe()). The 404 was not reproducible (2 of 3 runs clean).
- Save/Load: none. Testing: npm test, headless walk/fog/season runs (FPS ~50 in software rendering).
