# People and soldiers under a new blueprint (owner point 76)

## What and why
Owner, 19 Nov 2026: a person standing under a blueprint gets stuck; he should go on and then avoid the blueprint, and a soldier there should go and stand outside it.
Before, a unit holding a place (Holding, or ordered to a tile under the site) was never asked to move, so it stayed inside and the building could not start. A resident deep inside a site whose neighbouring tiles were all taken could not step off either.

## Files and systems
- `src/systems/ConstructionSystem.js`
  - `occupied(site)`: a Holding unit, or one whose move goal lies under the site, gets `holdAside`.
  - `holdAside(worker,site,inside)`: the nearest free tile in a ring of 1–3 tiles round the site that no other unit holds or heads for becomes the new hold goal (`MovingToHold`); the way out is walked with the site tiles opened (`steppingAside`).
  - `stepAside` falls back to a wider ring (2–3 tiles) when the tiles beside the site are taken.
  - New helper `ringGoals`.

## Implementation decisions
- The hold stays a hold: the unit keeps its stance and fights from the new place as before.
- Claimed goals of other units are skipped, so a group spreads to distinct tiles.
- Walking residents were already fine: they finish the step and replan round the site (covered by a new test).

## Save/Load impact
None. The new goal is a normal `commandState`; SAVE_VERSION unchanged.

## Testing
New `tests/blueprint-step-aside.test.js`: a held soldier moves beside the site and keeps holding; five held units spread to distinct tiles; a walker across the site reaches his goal.

## Notes for the next agent
The king and animals were not changed: the king can always step, animals have their own step-aside (AnimalController).
