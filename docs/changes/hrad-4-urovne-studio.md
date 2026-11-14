# Castle in four levels: renders in the Studio

## What and why
Owner, 14 Nov 2026: graphics for the Castle in four levels (folders 1–4, four views each). Level 1 is built at the start when chosen in the game setup, otherwise it costs 40 Wood; level 2 costs 70 Wood, level 3 50 Stone, level 4 100 Stone. The upgrade is offered after a click on the Castle; when the bigger footprint has no room, the game says the ground must be cleared.

## Files and systems
- `art/assets/buildings/castle/asset.json`: variants `castle-l1-*` … `castle-l4-*` (0, 90, 180, 270).
- `art/sprites/castle/castle-l?-*.v1.{png,x2.png,json}`.

## Implementation decisions
- One scale (0.3137) for all sixteen pictures, so the hall keeps its size from level to level. With it the ground of the pictures is 249, 192, 206 and 237 px wide: footprints 4 × 4, 3 × 3, 3 × 3 and 4 × 4. Level 1 is wider than level 2 only because of its bare yard.
- Height × 0.88 and the usual grade as for the other renders. The ground under the pictures stays.
- Only the art is prepared. The levels and the upgrade are the plan item `m-hrad-urovne`.

## Save/Load impact
None. Studio content only.

## Testing
- Studio tests; sizes checked against the footprint widths (192 px for 3 × 3, 256 px for 4 × 4).

## Notes for the next agent
- For a 3 × 3 level 1 the bare yard has to be cut to the footprint (the ground cutter of the Well, `/tmp/wf/cut.py`, limited to the area outside the diamond).
