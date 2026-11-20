# Merlons at the joint of a diagonal wall (owner report 20 Nov 2026)

## What and why
Owner, 20 Nov 2026 (screenshot): the merlons join the diagonal wall badly. The joint was a straight wall meeting a diagonal run through the tile's back (NW) corner – elbow `NW-10`, one of the four elbows the owner rejected on 15 Nov (NW-00, NW-01, NW-10, SE-00). Without its art the tile is a plain block, and the block drew merlons on its N and W sides right where the band runs in, so a cluster of merlons stuck out of the joint.

## Files and systems
- `src/game/walls.js` — `bandSides(elbow)`: the two sides beside the corner the band leaves through.
- `src/game/FortificationView.js` — `paintArt`: a plain block standing in for a missing elbow leaves out the parapets of those two sides.

## Implementation decisions
- Only the four elbows without approved art change; approved elbows and diagonal pieces are untouched.
- The full fix is new elbow art for the four rejected variants (Grafika, owner review); this keeps the joint clean until then.

## Save/Load impact
None.

## Testing
New test in `tests/diagonal-walls-sites.test.js` (the owner's layout is `NW-10`; `bandSides`). Browser: a straight wall of 7 tiles with a 6-tile diagonal run leaving its end through the back corner – before, merlons stuck out of the joint; after, the wall walk runs on into the band.

## Notes for the next agent
When the owner approves new art for NW-00/01/10 or SE-00, `art:integrate` adds it to `DIAGONAL_WALL_ART` and this fallback stops applying to it by itself.
