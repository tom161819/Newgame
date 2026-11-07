# #116 Paths V2 (pesinav2) in the game + trampled-grass level (7 Nov 2026)

## What and why
Plan item `m-pesiny-v2-do-hry`. The owner picked the Path Lab setting "V2 pesinav2" (`art/path-lab/pesinav2.json`). The game now draws trodden paths with that renderer instead of N12, and has four wear levels; level 1 is new.

| Level | Look | Threshold (passes) | Speed |
|---|---|---|---|
| 1 | trampled grass (dark green track, no soil) | 3 (about half the first soil path) | none |
| 2 | soil (formerly level 1) | 5 | +5 % |
| 3 | trodden path (formerly 2) | 15 | +10 % |
| 4 | well-worn path (formerly 3) | 30 | +15 % |

Recovery is unchanged and now passes through level 1 (2 → 1 → grass).

## Files and systems
- `src/data/pathWear.js`: thresholds `[0,3,5,15,30]`, speed `[1,1,1.05,1.1,1.15]`, `terrainIds` with the new `grass_trodden`.
- `src/data/objects/terrain.js`: the new `grass_trodden` definition (colours `#33561c` / `#466b28`, as the lab's grass track). The soil levels keep their approved Earth tiles.
- `src/data/pathStyle.js` (new): the pesinav2 parameters, copied from the lab export. The test checks they are equal.
- `src/game/pathV2.js` (new): the geometry of the lab's V2 renderer (`studio/src/path-lab/v2.js`), copied with two equivalent speed-ups: the nearest area for path-to-area blending is found through a grid, and `fieldAt` gets an optional early exit. `tests/path-v2.test.js` checks that shapes and the field equal the lab's on the lab test map.
- `src/game/PathV2Layer.js` (new):
  - **Geometry.** One geometry is built for the whole map from the levels the renderer may show (live wear, or remembered wear under Fog of War). It is rebuilt only when those levels change, at most every 500 ms. Capsules are kept every second centerline point (8 ground px).
  - **Tile overlays.** Each tile's overlay is painted at the lab's resolution (2 px) with the lab's colours, coverage, halo, snow and Earth grain. Samples belong to exactly one tile, the one under their centre.
  - **Coarse grid.** The field is evaluated on a coarse grid (every 8 px). Blocks wholly outside the path are skipped, blocks wholly inside take the level from the grid, and only blocks on an edge are sampled at every point.
  - **Cache and budget.** Overlays are cached per tile. At most 3 ms of tile painting runs per frame; the rest keep their previous look until a later frame. After a wear change, only the changed chains plus 2 tiles around them are repainted.
  - **Chunk paint.** Per chunk, the tile overlays (and the ring of tiles around the chunk) are laid into one small image, scaled up once per Fog state and clipped to the union of the tiles, so tile edges never show as seams.
- `src/game/TerrainRenderer.js`:
  - `pathStyle` 'v2' (default) or 'n12'; the developer switch is `mkDev.setPathRenderer('n12'|'v2')` in the console, and `mkDev.pathStats()` gives the timings.
  - A chunk with a dirty tile near a path is repainted whole (cached overlays), because a partial repaint would leave antialiased tile edges in a continuous path.
  - N12 handles five levels (winter veil and debug colours).
- `src/ui/Minimap.js`: the wear colour starts at soil (level 2), as before.
- Saves: `SAVE_VERSION` 44, levels 0–4 in path wear and in Map Memory.
- Tests:
  - `tests/path-v2.test.js` is new.
  - Updated: `path-wear`, `path-wear-render` (N12 with shifted levels), `save-load`, `stockpile-cleanup` and `assets` (+1 object).
- Smokes:
  - `scripts/paths-v2-smoke.mjs` (`--paths-v2`) is new.
  - `stockpile-cleanup-smoke` now expects wear level 4.

## Implementation decisions
- **The lab code is copied, not shared.** The geometry is a copy of the lab's code, so the game does not depend on `studio/**` (the Grafika chat's area); the equality test keeps the two in step.
- **Painting differs only where it must.** The lab paints the whole scene at once; the game paints tile by tile into chunk canvases, so the per-tile cache, the sample ownership and the per-chunk composition are game-only.
- **The interior level comes from the grid.** Inside a path its level is interpolated from the coarse grid. The level field is smooth over about a tile, so this is not visible.
- **N12 stays as a developer fallback.** Players only see V2.

## Performance (headless Chrome with software GL, this sandbox)
- Geometry for a dense test village (about 545 worn tiles): 15–25 ms in Node, 4–26 ms in the browser.
- Tile overlay: 0.3–0.5 ms per path tile. A whole dense chunk without cache takes 30–45 ms in Node, which is why the work is spread by the 3 ms frame budget and cached; repainting a chunk from cache costs about 2 ms.
- Standing still with paths in view: about 17 ms per frame with V2 against 16.6–16.8 ms with N12 (both near the 60 Hz frame).
- Walking with Fog of War over newly seen paths: 20–28 ms with V2 against 17–22 ms with N12. The cost comes from rebuilding the geometry as remembered paths come into view. **This is more than the brief's 5 % limit while exploring paths.** It is the same as N12 when the paths are already known.
- The brief's "under 4 ms for one chunk" holds for repaints from cache, not for the first paint of a dense chunk; that first paint is spread over frames.

## Save/Load impact
`SAVE_VERSION` 44. The meaning of the stored levels changed (0–4), so saves from 0.15.0 cannot be loaded. The V2 cache is not saved; it is drawn again after loading.

## Testing
- `npm test` passes: 868 tests.
- Smokes pass: `--paths-v2`, `--fog`, `--fog-brightness`, `--pavement`, `--minimap`, `--season-transition`, `--pave-under` and `--stockpile-cleanup`.
- Screenshots of V2 and N12 at zoom 1 and 2 were compared by eye.

## Notes for the next agent
- Meeting the 5 % limit while exploring needs an incremental geometry: rebuild only the chains that changed, or build in a Web Worker. Lowering the 500 ms rebuild interval makes exploring look fresher but costs more.
- A faint line can still show where two chunk canvases meet inside a wide trodden area (each chunk clips its own tiles).
- If `art/path-lab/pesinav2.json` changes, update `src/data/pathStyle.js` (a test will fail until then).
