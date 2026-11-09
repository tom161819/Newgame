# Fog of War: land leaving sight turns grey at once (no squares beyond sight)

## What and why
Owner, 9 Nov 2026 (Grafika chat), with a screenshot of 0.83.1: "fow je lepší, ale furt to když odcházím dělá viditelné čtverce za dosahem". Land the king had just left stayed in full colour in chunk-shaped, stepped blocks while the soft edge had moved on.

## Cause
- A tile leaving sight only changes between full colour and the remembered grey. That still needed a repaint of its whole 10 × 10 chunk.
- Since 0.80 such repaints queue: one every 50 ms, each chunk at most every 200 ms, and they wait while the chunk's ground is due for a repaint because of path wear.
- With residents and the king moving, a chunk waited a second or more, and the remembered look caught up in square blocks.

## Files and systems
- src/game/TerrainRenderer.js:
  - **updateFog** splits fog changes. Land seen before, with all 8 neighbours known and no pavement around, goes to `fogPatch` (chunk → tiles). Everything else repaints its chunk as before: land seen for the first time, the rim beside unknown land, pavement.
  - **applyFogPatches()**, each frame in repaintDirty: for the patched tiles only, the pixels are recomputed from the cached ground with the same per-pixel rule as greyRemembered, written back and passed to the composite. A tile costs a fraction of a millisecond.
  - **Frontier chunks:** chunks with a changed fog that cannot be patched get up to 2 fog-only repaints a frame (`fogDirty`, `fogOnlyPass`), over their previous ground picture, ahead of the ground queue.
  - **memoryFactor():** remembered ground takes one brightness, the Memory brightness setting. Before it took fog.brightness, with a 0.08 brighter rim 1 tile beyond sight that moved with every step. A patch therefore always matches a full repaint pixel for pixel.
  - **Bushes:** with the camera still, bushes are re-tinted when their tile enters or leaves sight. Before, only rocks were re-tinted.
- tests/terrain-invalidation.test.js: patching of known land, and the frontier fog-only repaints, two a frame.

## Implementation decisions
- **Patch per tile instead of raising the repaint budget.** Repainting whole chunks on every fog change cost about 10 FPS without GPU under load. Patches touch only the tiles that changed.
- **Leave the frontier on the old path.** Tiles beside unknown land carry the black edge ring of neighbour chunks, so they keep the chunk repaint, whose order is right.
- **Drop the 0.08 edge brightening from the ground.** The soft edge is FogEdgeLayer's gradient. With a moving brightening, a patch could not equal a repaint.

## Save/Load impact
None.

## Testing
- Browser: the king explored, walked back and forward, then the game was paused. Every shown chunk's patched picture was compared with a full repaint of the same state: 23 chunks and 516 patched tiles, with 0 different pixels.
- Browser, the king walking into unknown land and back (4 runs):
  - no black tile in sight lasted 0.75 s;
  - remembered tiles still showing colour after 1 s were down to 0–3 single tiles, under trees (their crowns) or at the frontier, and no blocks;
  - FPS without GPU was 42–47, the same as before.
- npm test: 1188 pass.

## Notes for the next agent
- Trees in remembered land keep their own look (resource views). That is not part of the ground.
- With extreme load (24 vision sources stepping 8 tiles a second) FPS drops to about 30 because of the many frontier repaints. Real residents move far less.
