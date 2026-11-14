# Castle levels resized: 4 × 4, 4 × 4, 5 × 5, 6 × 6

## What and why
Owner, 15 Nov 2026: level 1 on 4 × 4, level 2 on 4 × 4 (the same ground, only a palisade and a tower were added), level 3 on 5 × 5, level 4 on 6 × 6 – "we try it like this and see".

## Files and systems
- `art/sprites/castle/castle-l?-*.v2.*` (v1 removed), `art/assets/buildings/castle/asset.json`.

## Implementation decisions
- Levels 1, 3 and 4 fill their footprint (scales 0.3228, 0.4878, 0.5079). Level 2 uses the scale of level 1, so the hall does not change size; its smaller ground sits in the middle of the 4 × 4 footprint.
- So the hall grows about 1.5 times from level 2 to level 3. That follows from the chosen footprints.

## Save/Load impact
None. Studio content only.

## Testing
- Footprint overlay of the four 0° views checked by eye; Studio tests.

## Notes for the next agent
- Mechanics: plan item `m-hrad-urovne`.
