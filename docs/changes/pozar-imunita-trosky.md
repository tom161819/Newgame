# Fire immunity after extinguishing; Builders clear Burnt Ruins

## What and why
The owner reported (13 Nov 2026) that a fire could not be stopped even with three Wells: buildings caught fire again right after being put out. Now a building that was put out cannot catch fire for half a game day. The owner also asked that Burnt Ruins can be removed by Builders.

## Files and systems
- src/data/nightThreats.js: `fires.safeAfterDays: .5`.
- src/systems/NightThreatSystem.js: `fireSafe` map (building id → game time), `fireproof()`, `protect()`. `igniteFires` and `spread` skip protected buildings. Export/import/validation of `fireSafe`.
- src/systems/DemolitionSystem.js and GameStateSerializer.js: `burnt_ruins` is eligible for demolition although it is not buildable.
- src/data/objects/lighting.js: Burnt Ruins `constructionTime` 8000 (the demolition work).

## Implementation decisions
- Direct `ignite()` (scripted/test fires) ignores the protection; only random ignition and spreading respect it.
- The save stores the remaining protection in ms, so it is independent of the game clock value.
- Ruins cost nothing, so the demolition refund is empty.

## Save/Load impact
Optional `nightThreats.fireSafe: [{id, ms}]`. SAVE_VERSION stays 62. Old saves load without it.

## Testing
- tests/night-threats.test.js: m-pozar-imunita (protection, no re-ignition, save/load, expiry).
- tests/demolition-work.test.js: m-trosky (ruins can be marked and are cleared by a Builder).
- Full suite.

## Notes for the next agent
If fires still feel too strong, tune `safeAfterDays` or the spread chance in src/data/nightThreats.js.
