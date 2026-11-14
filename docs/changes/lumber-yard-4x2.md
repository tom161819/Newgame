# Asset Studio: Lumberjack Hut with saw yard (4 × 2) for review

## What and why
The owner sent four renders (0°, 90°, 180°, 270°, transparent background) of a Lumberjack Hut on 4 × 2 tiles (14 Nov 2026) and asked to add it.

## Files and systems
- art/assets/buildings/lumber-camp/asset.json: variants `lumber-camp-yard-0/90/180/270`.
- art/sprites/lumber-camp/lumber-camp-yard-*.v1.{png,x2.png,json}.

## Implementation decisions
- Footprint in the 0° view (the one the game uses): 2 wide, 4 deep.
- The renders are a little steeper than the game's 2:1 view: scaled 0.2207 wide and 0.87 of that high so the yard lies on the footprint. The door is about 28 px (smaller than the 48 px rule; the footprint was given by the owner).
- Colours graded with scripts/gpt-sprite-grade.py; lantern in `gameLights`.

## Save/Load impact
None.

## Testing
tests/asset-studio*.test.js, Studio build and Studio smoke.

## Notes for the next agent
Deploying needs the Lumberjack Hut footprint 2 × 2 → 2 × 4 with `legacyFootprint` (see docs for the farmhouse and barracks).
