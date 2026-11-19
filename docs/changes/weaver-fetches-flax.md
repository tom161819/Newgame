# Owner 19 Nov 2026 – weavers fetch Flax themselves

## What and why
The owner asked: "zaměstnanci tkalcovny ať si chodí sami pro len do skladu". Since 0.135.0 a workshop worker waits up to half a game day for a Hauler to bring inputs before fetching them himself; for the Weaver that left the looms idle.

## Files and systems
- `src/data/objects/textiles.js`: the Weaver definition gets `fetchesOwnInputs: true`.
- `src/systems/LogisticsTaskManager.js` (`waitForHauler`): for inputs, a building with `fetchesOwnInputs` never waits for a Hauler.

## Implementation decisions
- A new flag rather than `selfSupplied` (Pitch Kiln): `selfSupplied` also takes all Hauler jobs away, including carrying the output. Here Haulers may still bring Flax and still carry Cloth away (outputs wait the usual moment).
- Only the Weaver; the Tailor is unchanged until the owner asks. Any other workshop can get the flag in its definition.

## Save/Load impact
None; SAVE_VERSION unchanged.

## Testing
New case in `tests/noseni-zamestnanci.test.js` (weaver input no wait, output still waits, tailor unchanged); full `npm test`, build and the browser smoke.

## Notes for the next agent
If the owner wants the same for other workshops (mill, bakery, tailor…), add `fetchesOwnInputs: true` to their definitions.
