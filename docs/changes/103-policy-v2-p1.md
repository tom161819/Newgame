# Policy v2 P1: change from the morning, gradual effect, overview (7 Nov 2026)

## What and why
Plan item `m-politika-v2-p1` (owner-approved concept, `zadani-politika-v2.md` part P1). It fixes two problems:
- **Tax dodging.** The Happiness effect used to apply immediately while taxes were taken only in the morning. Switching to Very high just before dawn and back to No taxes afterwards earned 1.5 Gold per resident and a whole day of +10 Happiness.
- **Missing overview.** Residents reacted instantly, and the player could not see the daily balance.

## Files and systems
- `src/data/policy.js`: `POLICY_RULES {effectPerDay: 5, tradeAverageDays: 3}`.
- `src/systems/PolicySystem.js`:
  - **Pending policy.** `set()` now stores a **pending** policy. Choosing the policy already in force clears it, and `cancel()` drops it. `apply()` puts it in force at the next morning, inside `collect()` and before the taxes, so taxes and rations always follow the policy in force.
  - **Gradual effect.** The Happiness effect (`effect`, used by `happiness()`) moves towards `target()` by 5 points per game day, smoothly through `gameTime.onAdvance`, in both directions. A new game starts at the target of the default policy (0).
  - **Overview data.** `balance()` gives Castle income, taxes (also tomorrow's when a change is pending), the average trade result of the last 3 ledger days ("Trade Sale" − "Trade Purchase"), wages, and the total. `food()` gives production, consumption, net and the days the stores last. `daysToTarget()` gives how far the effect still has to move.
- `src/ui/PolicyPanel.js` and the Castle panel in `index.html`:
  - The selects show the chosen (pending) values.
  - A line "From tomorrow: High taxes, Small rations." with **Cancel**.
  - A **Kingdom overview** with gold per day (and from tomorrow), food per day and the days the stores last, the Happiness forecast ("Happiness 52 → 62 over 2 day(s)") and the residents at risk of a strike.
  - Refreshed every second while the panel is open.
- `src/systems/NeedsSystem.js` adds `policyTarget` to the resident's status. `src/ui/NeedsDisplay.js` shows "Kingdom policy: Happiness −4 (moving to −10)" while the effect is moving.
- i18n en/cs.
- Save: `SAVE_VERSION` 45 (policy `pending` and `effect`).
- Tests: `tests/policy.test.js` (updated, plus two new tests).
- Smoke: `scripts/policy-smoke.mjs` (`--policy`, rewritten for the next-morning change).

## Implementation decisions
- **One effect for the kingdom.** The brief allowed a per-resident effect only if it were equally simple; a single value for the kingdom is.
- **Overfeeding is gone too.** Rations change both portions and Happiness from the next morning, so feeding a lot just before dawn no longer pays either.
- **Trade line.** The trade line reads the ledger, so it starts working as soon as caravans trade (F1 is done since 0.11.0).
- **The forecast is a projection.** It is the kingdom's average Happiness plus the remaining change of the policy effect. Other needs can still move it.

## Save/Load impact
`SAVE_VERSION` 45. The policy save gains `pending` (null or a policy that differs from the one in force) and `effect`, which must lie within the possible policy effects (−35 … +20). Saves from 0.16.0 cannot be loaded.

## Testing
- `npm test` passes: 870 tests.
- Smokes pass: `--policy`, `--ledger`, `--needs`, `--employment` and `--population`.

## Notes for the next agent
- P2 (rations through the Food need, contextual penalties) builds on `effect`/`target()`. Its new +5 "well fed" bonus belongs in `target()`, so it moves gradually too.
- P3 (meal variety): fish is already in `EDIBLE_RESOURCES` (0.15.0), so use 4 kinds.
