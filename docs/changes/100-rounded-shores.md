# World v2 step 3: rounded shores (#100, plan m-svet-kulate-brehy, 7 Nov 2026)

## What and why
Step 3 of World v2 (brief `zadani-svet-v2.md`). Shores, banks and the deep channel used to follow the diamond grid, because each tile only feathered its neighbours' textures in along its edges. The renderer now picks the shape of every transition from the tile's **four corners**. A corner's value is the share of the four tiles meeting there that belong to one side. Inside the tile the value is mixed bilinearly between the corners, and the boundary is the 0.5 contour, as in marching squares with interpolation. River and lake edges, sandy, muddy and pebbly banks, the desert rim and the edge of the deep channel therefore run in curves.

The Studio's transition pieces (`g-svet-kulate-brehy`) are not ready yet. Following the owner's rule (do not wait for graphics, prepare a provisional version), the masks are computed in code and the approved textures are drawn through them.

## Files and systems
- `src/game/TerrainRenderer.js`:
  - `landCorners` / `grassCorners` give the corner shares for water against land and grass against bare ground.
  - `shoreMask` is a 64 × 32 alpha mask for four corner values (cached by value).
  - `shoreOverlay` draws a texture through a mask (cached per texture and mask, capped at 2,400 canvases).
  - `roundShore` handles water against land, `roundBank` grass against sand, mud, pebbles and desert, and `roundDeep` deep against shallow water.
  - `blendEdges` leaves these pairs alone while `shoreStyle` is `'round'`. Other pairs (for example mud against pebbles) still feather.
  - Decals are skipped on tiles a transition crosses.
  - `setShoreStyle('round'|'edges')` repaints all chunks.
- `src/ui/GameApplication.js`: the developer switch `mkDev.setShoreStyle('edges')` shows the older look for comparison.
- Tests:
  - `tests/world-generation-v2.test.js`: corner shares on a straight shore and bank, skipped feathering, the switch.
  - `scripts/world-smoke.mjs` measures chunk painting with and without the World v2 layers.

## Implementation decisions
- **Interpolated corners rather than 16 fixed pieces.** With shares in quarter steps (5⁴ combinations), the bilinear contour gives curves for diagonal shores and narrow inlets that 16 binary marching-squares cases would show as straight cuts.
  - The mask edge is a smoothstep from 0.4 to 0.6, about 4 px of soft edge, so it matches the textures' antialiasing.
  - When the Studio's pieces arrive, `shoreMask` can return their alpha for the 16 binary cases (shares rounded) and keep the computed masks for the rest.
- **Which texture is drawn through the mask.**
  - On a water tile: the land neighbour with the highest blend rank (grass over desert over sand…).
  - On a land tile: the shallowest water neighbour (shallow, then ford, then deep).
  - Fords count as water, so the river's outline includes them.
- **Grid stays square for the game.** Only the picture changes: walking, building and fishing still use whole tiles. A curved shore can therefore show a little land over a water tile, or the reverse, by up to half a tile. The owner's step 3 asked for looks only.
- **Cost.** Chunks are painted once and cached, so frame rate is unchanged. Painting a whole chunk takes about 0.85 ms with all World v2 layers (zones, decals, reeds, rounded shores) against about 0.55 ms with edge feathering and no zones, measured in the smoke, Chrome headless, 100 chunks, two runs.

## Save/Load impact
None.

## Testing
- `npm test` passes (908).
- `npm run smoke -- --current-only --world --paths-v2 --world-code` passes.
- Screenshots of a river with a ford, sandy banks and the deep channel were checked.

## Notes for the next agent
- `g-svet-kulate-brehy` (Grafika): when transition pieces are approved, wire them into `shoreMask` (keep its signature). The pairs are water/grass, water/sand, water/mud, water/pebbles and sand/grass.
- There is still a faint diamond seam inside large water areas, where neighbouring variants meet. That is the existing tile-variant look, not the shore masks.
