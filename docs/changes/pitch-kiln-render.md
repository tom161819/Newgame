# Asset Studio: Pitch Kiln render for review

## What and why
The owner sent four renders (0°, 90°, 180°, 270°, transparent background) of a Pitch Kiln (14 Nov 2026) and asked to add it.

## Files and systems
- art/assets/buildings/pitch-kiln/asset.json: variants `pitch-kiln-render-0/90/180/270`.
- art/sprites/pitch-kiln/pitch-kiln-render-*.v1.{png,x2.png,json}.

## Implementation decisions
- Footprint 3 × 3, the same as the game Pitch Kiln, so deploying needs no footprint change.
- Scaled 0.226 wide and 0.885 of that high (the render is steeper than the game's 2:1 view). The gate is about 34 px.
- Colours graded with scripts/gpt-sprite-grade.py; lantern and the fire under the cauldron in `gameLights`.

## Save/Load impact
None.

## Testing
tests/asset-studio*.test.js, Studio build and Studio smoke.

## Notes for the next agent
Same steps as docs/changes/fisherman-hut-render.md.
