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
