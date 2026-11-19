# m-test-n02-nahodny – flaky N02 Builder/Hauler test

## What and why
The test "N02: the Builder carries only while no Hauler is free…" (`tests/logistics-construction.test.js`) failed now and then on GitHub; on 18 Nov 2026 it failed the Pages build of 0.146.12, so that release was not deployed. With a seeded `Math.random` it reproduces locally (seed 34 of 40; idle Haulers wander by `Math.random` in `WorkerAI`). Cause: the test flagged the Builder when its cargo appeared while a Hauler was free, but the Builder books the load when both Haulers are busy and picks it up later; by then the second Hauler had finished and stood free. The game behaved correctly; the test measured the wrong moment.

## Files and systems
`tests/logistics-construction.test.js`, and `scripts/building-menu-smoke.mjs`: its expected menu order now also applies the owner's `BUILDING_MENU_ORDER` (15 Nov 2026, point 63), as `buildingsInCategory` does. No game code changed.

## Implementation decisions
The test now wraps `logisticsTasks.updateWorker` and checks `freeHauler()` at the moment a booking for the Builder succeeds, which is exactly the rule in `BuilderAI.carryMaterials`. It also asserts the Builder did book at least once, so the check cannot pass vacuously. The unique-booking and stone-count checks are unchanged.

## Save/Load impact
None; SAVE_VERSION unchanged. The final `snapshot(s)` validation stays.

## Testing
Seeded sweep of the test body: before the fix 1 failure in 40 seeds, after it 0 in 180 seeds (including seed 34). Full `npm test`, `changelog:validate` and `version:check` pass. `npm run smoke -- --current-only`: the building-menu step now passes; the run then stops at the next stale scenario (browser-smoke.mjs:362, the King picking up a clicked stone times out), which fails on main as well.

## Notes for the next agent
Neither the old nor the new version catches a Builder that ignores `freeHauler()` (mutation `true||stuck`): in this scene the Haulers always book before the Builder in the same tick. A stronger test would need a Hauler that is free but cannot reach the yard yet. The PR CI (`pr-quality.yml`) still runs the browser smoke as blocking, while Pages runs it with continue-on-error since 15 Nov; the remaining stale smoke scenarios keep PR CI red until they are updated. Test-only change, so no game release; the next push to main redeploys Pages with 0.146.12.
