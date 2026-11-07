# Food menu: no locks, red warnings for a missing earlier building (0.33.0)

## What and why
Plan task m-food-menu-odemceni (owner request, 7 Nov). Some Food buildings were locked until an earlier one was complete (#132: the Hunting Lodge and the Fisherman's Hut needed a Granary; the Farmhouse needed a Granary; fields needed a Farmhouse). The owner wants every Food building selectable at once, with a red warning while the earlier building is missing. This intentionally lifts the #132 and Fishing R1 locks.

## Files and systems
- Data: `requiresCompletedBuildings` in the Food category becomes `recommendsCompletedBuildings`:
  - Farmhouse, Hunting Lodge, Fisherman's Hut → Granary;
  - Wheat Field, Orchard → Farmhouse;
  - new: Mill → Wheat Field, Bakery → Mill (the existing chain advice, `COMPLETION_SOURCES`).
  - Their `unlockDescription` is removed.
- `src/systems/ObjectRegistry.js` – validates `recommendsCompletedBuildings` like requirements (known buildings, no duplicates, not itself).
- `src/systems/BuildingUnlockManager.js` – an unlocked building gets `warnings` and `warning` (text) for recommended buildings that are not complete. The text is `unlock.needs.<id>` when present ("Needs a Granary to store food", "Needs a Farmhouse to tend it", "Needs a Wheat Field", "Needs a Mill for flour"), otherwise "Needs a {name}". Locks (`requiresCompletedBuildings`, `maxCount`) work as before for other categories (Marketplace, Village Green).
- `src/ui/BuildingBar.js` – the warning is shown in red (`.building-warning`) in the availability line and in the card tooltip, together with any missing materials.
- `src/ui/AssetGallery.js` – a "Recommended first (warning only)" row.
- `src/systems/GettingStarted.js` – the order check also respects recommended buildings, so the guide order stays as it was.
- Tests: `tests/building-unlocks.test.js` rewritten for warnings (Food never locked, warnings appear and clear with completion, losing the earlier building brings them back, other categories still locked, Save/Load derives warnings). `workplaces`, `fishing`, `getting-started` adjusted. Smokes: `building-menu-smoke.mjs` (menu and the Granary→Farmhouse gameplay run) now check warnings instead of locks. `getting-started-smoke.mjs` was stale since 0.14.1 (it expected 7 steps; there are 8 with the Builder's Workshop) and is fixed.

## Implementation decisions
- A planned but unfinished earlier building keeps the warning (it disappears only when that building is complete), as asked.
- Buildings work as well as they can without their earlier building (a Hunter with nowhere to bring meat waits; an orphan field waits for a Farmhouse). The existing per-building notices stay.

## Save/Load impact
None (nothing about unlocks is saved).

## Testing
`npm test`. Smokes: default, `--building-unlocks --getting-started --farm-plots --farmer-establishment`.

## Notes for the next agent
- Old `object.<id>.unlock` strings for these Food buildings are unused now; remove them in a cleanup if the i18n check starts flagging unused keys.
