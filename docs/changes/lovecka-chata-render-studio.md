# Hunting Lodge render in the Studio

## What and why
Owner, 14 Nov 2026: "zpracuj novou loveckou chatu" with four renders. As with the Stables, Lumberjack Hut, Fisherman's Hut and Pitch Kiln, the views go to the Asset Studio for review; the game changes after "nasaď schválené".

## Files and systems
- `art/assets/buildings/hunting-lodge/asset.json`: variants `hunting-lodge-render-0`, `-90`, `-180`, `-270`.
- `art/sprites/hunting-lodge/hunting-lodge-render-*.v1.{png,x2.png,json}`.

## Implementation decisions
- Cropped to the picture, height × 0.88 (the render is steeper than the game's 2:1 view), the usual grade, scale 0.24: the plinth is 189 px wide, a 3 × 3 footprint (192 px). On 2 × 2 the cabin would be too small next to the other rendered buildings.
- The dirt plinth stays (the kennel, bowl and steps stand on it), unlike the Well and the Fountain.
- One torch light in the 0° view at the porch post.

## Save/Load impact
None. Studio content only.

## Testing
- Footprint overlay of all four views checked by eye; Studio tests; `npm run studio:smoke`.

## Notes for the next agent
- Deploying it means growing the Hunting Lodge to 3 × 3 with `legacyFootprint` 2 × 2 (as the Fisherman's Hut), and checking the hunter's dog spot.
