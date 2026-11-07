# Policy v2 P3: meal variety and the Feast (7 Nov 2026)

## What and why
Plan item `m-politika-v2-p3` (`zadani-politika-v2.md` part P3). All food used to be interchangeable: a resident always ate the first available kind (apple, then bread, then meat), so producing several kinds made no sense. This change rewards a varied diet and adds a costly Feast.

## Files and systems
- `src/data/policy.js`:
  - `MEAL_VARIETY`: 3 days; 2/3/4 kinds give +3/+5/+7 (4 kinds because fish has been food since 0.15.0); bread adds +2.
  - `FEAST`: 1 food and 1 Gold per resident, +15 for 2 days, again after 5 days.
- `src/systems/FoodSystem.js`:
  - **Eating order.** `eat()` takes the available kind the resident ate longest ago (never eaten first, then the usual food order). It is deterministic, and the day each kind was last eaten is kept in the resident's meal record (`meals`).
  - **Variety.** `recentKinds()` and `varietyBonus()` give the kinds eaten in the last 3 days and their bonus.
  - **Switch for tests.** `variety=false` keeps the old fixed order; two tests that count exact food stock use it.
- `src/systems/PolicySystem.js`:
  - `feastStatus()` says whether a Feast can be held, or why not: cooldown with days left, not enough food, not enough Gold, no residents.
  - `holdFeast()` makes every resident eat one meal through `eat()` with ledger source "Feast" (so it counts for variety) and pays the Gold (ledger source "Feast").
  - The Feast gives +15 for 2 days; `feastBonus()` and `feastDaysLeft()` report it.
  - The event feed says "The kingdom holds a feast!".
- `src/systems/NeedsSystem.js`: the variety bonus and the Feast add to Happiness at once. The status gains `variety`, `varietyKinds`, `feast` and `feastDaysLeft`.
- `src/ui/NeedsDisplay.js`: lines "Varied meals (3 kinds): Happiness +5" and "Feast: Happiness +15 (1.2 day(s) left)".
- `src/ui/PolicyPanel.js` and `index.html`: a **Hold a feast** button in the Castle panel. Beside it is the cost, the time left of a running Feast, or why it is not possible ("Available in 3 day(s)").
- Saves: `SAVE_VERSION` 47.
  - Policy: `feastUntil` and `lastFeastAt` (both null, or a Feast exactly 2 days long).
  - Food residents: `meals`, with edible kinds only and whole days up to today.
- i18n en/cs; ledger source `ledger.Feast`.
- Tests: `tests/policy.test.js` (two new tests).
  - `tests/farming.test.js` and `tests/logistics-integration.test.js` pin the old food order via `variety=false`.
- Smoke: `--policy` now holds a Feast.

## Implementation decisions
- **Variety counts by game day.** A kind counts while today minus the day it was last eaten is below 3.
- **The King eats varied food too,** but bonuses go only to residents' Happiness.
- **Residents do not gather for the Feast.** The brief made gathering at the Castle optional, so it is left out to keep the Feast simple.

## Save/Load impact
`SAVE_VERSION` 47. Saves from 0.18.0 cannot be loaded.

## Testing
- `npm test` passes: 873 tests.
- Smokes pass: `--policy`, `--needs` and `--ledger`.

## Notes for the next agent
- Policy v2 (P1–P3) is complete.
- Possible next steps:
  - residents gathering at the Castle during a Feast;
  - a Feast animation;
  - variety in the Food Economy panel.
