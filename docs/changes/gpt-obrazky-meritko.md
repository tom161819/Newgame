# GPT building art at one scale (doors ≈ 48 px)

## What and why
Owner, 13 Nov 2026: the houses were proportionally bigger than the Bakery; doors and windows should be the same size on every building (a building itself may be bigger). Also the light rim under the houses was still visible.

## Files and systems
- Doors measured on the GPT cut-outs (0° view): house ≈ 170 px, bakery ≈ 165 px, logger's cabin ≈ 190 px, armory gate ≈ 200 px.
- New export scales: house 0.282 (was 1/3), bakery 0.291 (was 1/3.6), logger's cabin 0.253 (was 0.3), armory 0.27 (was 1/3, its double gate a little larger than a door). Doors are about 48 px at 1×.
- All 28 GPT exports re-made (same versions); bases, lights and footprint anchors scaled with them; `src/data/objects/approvedArt.js` and `public/assets/buildings/{house,bakery,armory}/` updated.
- `scripts/gpt-sprite-grade.py`: the ground-halo pass also takes darker, more textured grey ground (saturation < 0.16, deviation < 19, lowest 40 %) and the anti-aliased rim; the stone plinths and door steps stay.

## Implementation decisions
- The houses are now a little narrower than their 2 × 2 footprint and the Armory narrower than 3 × 3; the scale follows the doors, as the owner asked.

## Save/Load impact
None.

## Testing
`node --test tests/house-looks.test.js tests/asset-studio*.test.js tests/world-look-2.test.js tests/assets.test.js`; screenshot in a loaded village.

## Notes for the next agent
For a new GPT building, measure its door on the cut-out and scale so the door is about 48 px.
