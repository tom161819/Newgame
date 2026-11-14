# Asset Studio: Fisherman's Hut render for review

## What and why
The owner sent four renders (0°, 90°, 180°, 270°, transparent background) of a Fisherman's Hut (14 Nov 2026) and asked to add it.

## Files and systems
- art/assets/buildings/fisherman-hut/asset.json: variants `fisherman-hut-render-0/90/180/270`.
- art/sprites/fisherman-hut/fisherman-hut-render-*.v1.{png,x2.png,json}.

## Implementation decisions
- Footprint 3 × 3, the same as the game hut, so deploying needs no footprint change.
- The renders are a little steeper than the game's 2:1 view: scaled 0.228 wide and 0.885 of that high so the ground lies on the footprint. The door is about 39 px.
- Colours graded with scripts/gpt-sprite-grade.py; lantern in `gameLights`.

## Save/Load impact
None.

## Testing
tests/asset-studio*.test.js, Studio build and Studio smoke.

## Notes for the next agent
Renders with a transparent background need no cutting: crop, squash, grade, /tmp/fit/import.mjs.
