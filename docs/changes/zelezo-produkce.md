# Iron production faster and fairly shared (owner point 75)

## What and why
Owner, 19 Nov 2026: "zvýšit produkci železa z dolu i z hutě, je to moc pomalý a pořád se čeká na železo a když mám víc budov co potřebují železo tak se na ně nikdy nedostane".
- Iron Mine: one Ore takes 10 s at level 1 (was 20 s).
- Smelter: 2 Ore + 2 Wood (Wood is the fuel) → 1 Iron in 25 s (was 3 + 3 in 40 s).
- Fair sharing: a workshop that has waited longer for an input is offered it first. Before, every workshop input had priority 20 and the tie went by distance, so the nearest workshop always took scarce Iron.

## Files and systems
- `src/data/minerals.js` — `iron_mine` duration 10000.
- `src/data/production.js` — smelter recipe; old recipes kept in `RECIPE_HISTORY` so saved batches still finish.
- `src/data/logistics.js` — `LOGISTICS_RULES.inputWaitScale` (120000 ms).
- `src/systems/LogisticsTaskManager.js` — `inputWaits` map (building:resource → game time the wait began); priority `20 + 0.9·exp(-waited/inputWaitScale)`, so it stays between 20 and 21 and never crosses other task classes.
- `src/i18n/en.js`, `cs.js` — Wiki texts.

## Implementation decisions
- The wait also counts while the kingdom has none of the input, so the first Ore after a shortage goes to the longest-waiting workshop.
- The wait resets when the input is satisfied; waits of removed workshops are pruned.
- Waits are runtime only (not saved): after a load all start equal, which is harmless.

## Save/Load impact
None. SAVE_VERSION unchanged. Active batches of the old recipe finish through `RECIPE_HISTORY`.

## Testing
- Updated `minerals`, `smelting`, `smelting-integration`, `production-fuel` tests to the new numbers.
- New test in `tests/smelting.test.js`: the longer-waiting, farther Smelter gets the better priority.

## Notes for the next agent
If other inputs (e.g. swords needing iron) still starve, the same `inputWaits` priority applies to every workshop input already.
