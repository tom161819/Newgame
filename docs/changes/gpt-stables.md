# Asset Studio: GPT Stables for review

## What and why
The owner sent a 4-view sheet of thatched Stables with a paddock (14 Nov 2026) and asked to add it to the Studio for approval.

## Files and systems
- art/assets/buildings/stables/asset.json: variants `stables-gpt-0/90/180/270`.
- art/sprites/stables/stables-gpt-*.v1.{png,x2.png,json}.

## Implementation decisions
- Footprint 8 × 6 (owner's choice; the game Stables are 5 × 5). Nothing changes in the game until the owner approves and the footprint is changed with `legacyFootprint`.
- The sheet's view is a little steeper than the game's 2:1 view, so the pictures are scaled 0.9 wide and 0.81 high; the fence then lies on the footprint. The gate is about 42 px.
- The sheet is small (1115 × 909), so the 2× files are enlarged from it.
- Colours graded with scripts/gpt-sprite-grade.py; torch beside the gate in `gameLights`.

## Save/Load impact
None.

## Testing
tests/asset-studio*.test.js, Studio build and Studio smoke.

## Notes for the next agent
Deploying needs the 5 × 5 → 8 × 6 change: horse places, Stablehand spots and the paddock area in the Stables code depend on the footprint (src/data/objects/vehicles.js, STABLE_RULES).
