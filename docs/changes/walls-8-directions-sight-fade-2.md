# Walls in eight directions; softer sight border on buildings

## What and why
Owner, 14 Nov 2026: (1) walls should be buildable in eight directions; (2) the lit/dark change of 0.121.2 still had a hard edge from piece to piece – he wants it gradual like the edge of visibility on the ground.

## Files and systems
- src/game/walls.js `wallLine`: diagonal drags.
- src/game/sightFade.js `edgeLight`, src/game/GameScene.js: gradient on both sides of the border.
- tests/walls.test.js, tests/owner-14-nov.test.js.

## Implementation decisions
- A diagonal wall is a stair of tiles (x step, then y step), so pieces share sides: the existing links, wall walk, patrol stops and the closed-ring test work unchanged. A drag counts as diagonal when the smaller of |dx|, |dy| is more than half of the larger.
- Sight gradient: measured from the building's middle tile to the nearest tile of the other kind (seen/unseen), Euclidean, up to 4.5 tiles; lit = 0.5 ± (d − 0.5)/8. Steps of about 1/8 from piece to piece. A building just inside the range is already slightly dark.
- Tried and dropped: drawing the soft ground edge (FogEdgeLayer) above the objects. It lies on the ground plane, so standing walls did not follow it.

## Save/Load impact
None.

## Testing
Unit tests; browser screenshots of diagonal walls and of a wall crossing the sight border; full suite.

## Notes for the next agent
A gradient inside one wall piece (pixel by pixel) would need gradient-masked copies of the dark textures; not done.
