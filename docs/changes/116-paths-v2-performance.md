# #116 Paths V2: faster rebuilds and painting (7 Nov 2026)

## What and why
Plan item `m-pesiny-v2-vykon`, the follow-up to 0.16.0. Walking in Fog of War over newly seen paths rebuilt the V2 geometry of the whole map, and frames were 20–30 % slower than with N12.

## Files and systems
- `src/game/pathV2.js` (the game copy of the lab geometry):
  - **Numeric keys.** Map keys are numbers instead of strings (tile nodes, edges, the area grid, buckets); the iteration order is unchanged and there is less garbage.
  - **Shorter bucket reach.** A shape is put only into the buckets within the distance where it can still change what is drawn: 16 + 6 + 22 × areaSmoothness + 4 px instead of the lab's 40 + 30 × areaSmoothness. Beyond that a shape is farther than the drawn edge (halo + softness + edge noise) plus the smooth-minimum range.
- `src/game/PathV2Layer.js`: capsules every third centerline point (12 ground px); the curve differs by less than 0.3 px at the tightest corner.
- `tests/path-v2.test.js`: the field still has to equal the lab's wherever the surface is drawn (distance ≤ 15 px); farther away the game may skip far shapes.

## Implementation decisions
- **No incremental rebuild yet.** Rebuilding only the changed chains is not done: the remaining cost is spread over topology, centerlines and buckets, and the measured gain was enough. It is still possible later.
- **The faint chunk line stays.** The faint line where two chunk canvases meet in a wide trodden area is unchanged (each chunk clips its own tiles).

## Performance
Node, dense test village of about 545 worn tiles:
- geometry rebuild: median 9.2 → 7.4 ms;
- painting a dense chunk without cache: 30–45 → 17–26 ms;
- median chunk: 3.2 → 2.0 ms;
- whole map: 841 → 506 ms.

Browser (headless Chrome with software GL, very noisy here), walking with Fog of War over new paths:
- one run 16.9 ms V2 against 16.7 ms N12;
- another run 24.0 ms against 17.1 ms;
- the earlier runs (0.16.0) were 20–28 ms against 17–22 ms.

Standing still is about 16.7 ms for both.

## Save/Load impact
None.

## Testing
- `npm test` passes.
- The `--paths-v2` smoke passes (run twice).

## Notes for the next agent
- If exploring still feels slow on real devices, the next steps are an incremental chain rebuild or moving the rebuild to a Web Worker.
