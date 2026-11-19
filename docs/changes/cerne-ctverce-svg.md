# Black squares on the map (dropped Wood and Ore)

## What and why
Owner 19 Nov 2026 (screenshot near a Lumberjack Hut): "v mapě se vytvářejí černé tečky". They were the piles a Woodcutter drops beside a stump (and Ore, Iron, Flour, Bread piles): their sprites are SVGs with only a `viewBox`. Chrome cannot upload such an image to WebGL (console: "texImage2D: bad image data"), so the texture stayed black and the pile showed as a black square. Reproduced in headless Chrome by dropping Wood and Iron Ore next to the Castle.

## What changed
- All 24 SVGs in `public/assets` without an intrinsic size got `width`/`height` on the root: height 150 and the width from the viewBox ratio – exactly the size Chrome used before, so nothing changes in size (resources are drawn at 28 × 28 anyway).
- Test `tests/svg-intrinsic-size.test.js` keeps every SVG asset sized.

## Files and systems
24 SVGs under `public/assets/buildings/*` and `public/assets/resources/*`; test `tests/svg-intrinsic-size.test.js`.

## Implementation decisions
- Fixed the files instead of rasterising in the loader: one place, no runtime cost, and the Studio/UI previews are unaffected.

## Save/Load impact
None. SAVE_VERSION unchanged.

## Testing
- Headless Chrome: Wood, Stone, Iron Ore and Meat dropped by the Castle – before: Wood and Ore black squares and 8 "bad image data" errors; after: a log and an ore pile, no errors.
- `npm test`.

## Notes for the next agent
- Any new SVG sprite needs `width`/`height` on `<svg>` (the test fails otherwise).
