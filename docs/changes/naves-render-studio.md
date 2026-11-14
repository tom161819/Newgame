# Village Green render in the Studio

## What and why
Owner, 14 Nov 2026: four renders of a new Village Green, "rozměr 4x4". The views go to the Asset Studio for review; the game changes after "nasaď schválené".

## Files and systems
- `art/assets/buildings/village-green/asset.json`: variants `village-green-render-0`, `-90`, `-180`, `-270`.
- `art/sprites/village-green/village-green-render-*.v1.{png,x2.png,json}`.

## Implementation decisions
- Cropped, height × 0.88, the usual grade, scale 0.272: the ground square is 257 px wide, a 4 × 4 footprint (256 px).
- The bare-ground square stays in the picture.

## Save/Load impact
None. Studio content only.

## Testing
- Footprint overlay of all four views checked by eye; Studio tests; `npm run studio:smoke`.

## Notes for the next agent
- Deploying: the game Village Green is 3 × 3, walkable, drawn by the `village_green` renderer on the ground layer, and children and residents use spots on it. Going to 4 × 4 needs `legacyFootprint` 3 × 3, new spots (bench around the tree, the square), and the tree, bell and board drawn above walkers who pass behind them (one flat picture cannot do that – split it into a ground layer and standing props).
