# Automatic Haulers and Builders, hunger, rebuilding ruins, unreachable notice

## What and why
Owner's answers to the big test of 0.118.0 (14 Nov 2026): Builders should join by themselves when a workshop stands; the game should keep a wanted number of Haulers (set in a side panel, recommended number marked); hunger should move Happiness and with it arrivals and departures; the Kingdom Overview explanations vanished with every change; Burnt Ruins should offer "Build again"; the game should say when a store cannot be reached.

## Files and systems
- src/data/employment.js `FREE_ROLES`, `recommendedHaulers`, `wantedBuilders`; src/systems/EmploymentSystem.js `fillFreeRoles`, `setHaulers`, `checkFreeRoles`; src/ui/EmploymentPanel.js, index.html, src/style.css.
- src/data/needs.js `NEEDS.food.starving`, `starvingPenalty`; src/systems/NeedsSystem.js (`unfedDays`); src/ui/NeedsDisplay.js.
- src/ui/KingdomOverview.js (rows updated in place while hovered).
- src/game/ruinRebuild.js, GameScene.rebuildRuin, src/ui/DemolitionUI.js.
- src/systems/LogisticsTaskManager.js `noteUnreachable`, src/systems/ProductionDiagnostics.js `accessIssues`, notice `unreachable`.
- tests/owner-14-nov.test.js.

## Implementation decisions
- Haulers: `employment.haulers` is null (recommended: 1 for every 10 residents, at least 1) or the owner's number (0–30). Automatic employment fills Haulers and Builders before the workplace seats. Lowering the number lets the surplus go at once; nobody is released when the recommended number falls.
- Builders: only with a finished Builder's Workshop; 1 for every 2 sites, at least 1, at most the places of all workshops. Never released automatically.
- Hunger: after the first full day without food −12 Happiness for every further day, at most −50. The existing strike (< 25) and leaving (< 15) rules do the rest.
- Rebuilding: the ruin is taken out, the building is placed by `placeBuilding` with reserved materials; on any error the ruin is put back.
- Unreachable: remembered on a failed carrier trip, reported while it is fresh (8 s) and lasts 10 s like other notices.
- Checked, no change: the cause of death is already saved and shown (Population → deceased); Wildlife Respawn exists and is chosen in the New Game setup.

## Save/Load impact
Optional `employment.haulers` (integer 0–30) and optional `unfedDays` in a needs record. SAVE_VERSION stays 62.

## Testing
- tests/owner-14-nov.test.js; tests/auto-employment.test.js and tests/drevorubci-stromy.test.js fixtures set Haulers to 0.
- Full suite. Browser: Castle panel screenshot, 30-day economy run (/tmp/perfdiag/econ.mjs).

## Notes for the next agent
- Open in the plan (`pripraveno`): more income sources; workers carrying their own goods and Haulers with wheelbarrows.
- Tests that build an EmploymentSystem with idle residents now get one Hauler hired unless `haulers` is 0.
