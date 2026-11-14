# Approved art deployed: Stables, Lumberjack Hut, Fisherman's Hut, Pitch Kiln

## What and why
The owner approved the four new buildings in the Asset Studio and asked to deploy them (14 Nov 2026).

## Files and systems
- art/approvals.json (reviews taken over with `npm run studio:sync`; preferred set to `stables-gpt-0`, `lumber-camp-yard-0`, `fisherman-hut-render-0`, `pitch-kiln-render-0`).
- src/data/objects/approvedArt.js: the four entries with `legacyVisual`; PNGs in public/assets/buildings/.
- src/data/objects/vehicles.js: Stables 6 × 8, `legacyFootprint` 5 × 5.
- src/data/objects/naturalResources.js: Lumberjack Hut 4 × 2, `legacyFootprint` 2 × 2.
- src/systems/StableSystem.js `paddock`: horse spots for the 6 × 8 Stables.
- art/sprites/stables, art/sprites/lumber-camp: footprints corrected.

## Implementation decisions
- **Footprint orientation.** In the game the edge from the front corner to the right corner has the length of `height`, the edge to the left corner the length of `width`. /tmp/fit/overlay.py draws them the other way round, so the Studio variants of 0.119.1 and 0.119.2 had width and height swapped (8 × 6 and 2 × 4). Corrected to 6 × 8 (Stables) and 4 × 2 (Lumberjack Hut). For square buildings it makes no difference.
- The stable building stands along the back edge (rows 0–2), the paddock is in front; horses stand at [0,5], [2,6], [4,6], [5,4].
- The Lumberjack Hut picture stays as approved (graded). It looks darker than its neighbours in the game; an ungraded version is an option if the owner asks.

## Save/Load impact
None in the format. Stables and Lumberjack Huts without `size` (older saves) keep 5 × 5 and 2 × 2.

## Testing
Full suite (stables, forestry, workplace and approved-art tests adjusted to the new footprints), Studio smoke, game screenshot of the four buildings.

## Notes for the next agent
When using /tmp/fit/overlay.py for a building that is not square, pass the footprint as (height, width).
