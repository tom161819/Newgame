# Fires easier to put out (0.144.5)

## What and why
Owner 17 Nov 2026: "the fire is still too strong, it takes ages to put out even though I have Wells". With the old numbers a fire grew back by 2 a second, while a bucket put out 15. One resident fetching water from a Well 8 tiles away therefore never won, and two needed about 45 s. A Well 15 tiles away needed 4 residents (about 50 s). Residents busy with any task did not help at all.

## Files and systems
- `data/nightThreats.js` fires:
  - `regrowPerSecond` 2 → 0.5;
  - `bucket` 15 → 20;
  - `startIntensity` 60 → 50;
  - `helpers` 6 → 8;
  - `helperRange` 15 → 20.
- `NightThreatSystem.firefight`: a resident with a task (but no cargo) cancels it (`WorkerAI.cancel` releases reservations) and helps.

## Implementation decisions
Measured times (s), Well distance against the number of helpers:

| Well distance | Helpers | Before | After |
| --- | --- | --- | --- |
| 3 tiles | 1 | 22 | 11 |
| 3 tiles | 2 | 13 | 8 |
| 8 tiles | 1 | never | 31 |
| 8 tiles | 2 | 45 | 18 |
| 8 tiles | 4 | 22 | 11 |
| 15 tiles | 1 | never | 55 |
| 15 tiles | 2 | never | 33 |
| 15 tiles | 4 | 52 | 17 |

The 10 % chance that a building is lost despite the buckets stays.

## Save/Load impact
None.

## Testing
- `tests/night-threats.test.js` (new test): one busy resident with a Well 8 tiles away drops his task and puts the fire out in under 45 s.
- The earlier fire tests still pass.
- `npm test`.

## Notes for the next agent
The measuring scene is the new test; change the numbers there if the owner asks for a different pace.
