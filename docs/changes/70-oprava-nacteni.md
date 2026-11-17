# 70 fix: older saves with an Armory load (0.143.17)

## What and why
0.143.16 added Halberds, Crossbows and Light Armor. The Armory store, every Barracks kit store and the Marketplace now allow them, but the save check compared the stored list with the new one exactly, so a game saved before 0.143.16 with any of them did not load.

## Files and systems
- `FoodStateValidation`: a saved location whose `allowed` list is a subset of today's list takes the new list. This was already done for workshop buffers; it now covers stores, the Starter Stockpile, kit stores and market space.

## Implementation decisions
Only widening is accepted; a stored good that is no longer allowed still fails the check.

## Save/Load impact
None to the format.

## Testing
tests/new-units.test.js: a save with the older Armory, kit and market lists loads (fails without the fix); npm test.

## Notes for the next agent
Adding a good to a store's list needs no migration now.
