# Rations and variety set the Food need (m-pridely-procenta)

## What and why
Owner request 68 from the 0.50 playtest. Before, rations only capped the Food need (Small 60, Normal/Generous 100), Generous added +5 Happiness and meal variety (Policy v2 P3) added +3/+5/+7 (+2 bread) Happiness. Rations and variety now act through one number: the resident's Food need.
- Target = rations base (Small 30 %, Normal 60 %, Generous 80 %) + 5 % for each different kind of food (`EDIBLE_RESOURCES`: apple, bread, meat, fish) the resident ate in the last 3 game days, at most 100 %. A resident who got no food (missed meal) has a target of 0 %.
- The stored Food value moves towards the target at the existing rates (rises 100, falls 50 per game day), never jumps.
- Portions per day unchanged (0.5 / 1 / 1.5).
- Removed: the P3 "Varied meals" Happiness bonus and the P2 Generous +5. Kept: the P2 situation penalties (taxed but unpaid, promised food missing, taxes while hungry) and the Feast.
- Food tooltip: "Normal rations 60 % + 3 kinds of food 15 % = 75 %" (cs: "Běžné příděly 60 % + 3 druhy jídla 15 % = 75 %"); a resident without food keeps the "Missed meals…" text.

## Files and systems
- `src/data/policy.js`: `RATIONS` now `{portions,food}` (no `happiness`, no `foodCap`); `MEAL_VARIETY={days:3,perKind:5,max:100}`; new `foodNeedTarget(rations,kinds,hungry)`; `LEGACY_RATIONS_EFFECT=5` (save validator only).
- `src/systems/NeedsSystem.js`: `foodDetail(worker)`; `step()` moves Food towards the target; `status()` drops `foodCap/variety/varietyKinds`, adds `foodRations, foodBase, foodKinds, foodVariety, foodTarget, foodUnfed`; variety no longer added to Happiness.
- `src/systems/PolicySystem.js`: `target()` = tax effect only; `foodCap()` → `foodBase()`; `promisedFood` is a flat 10.
- `src/systems/FoodSystem.js`: `varietyBonus()` removed (`recentKinds()` and the alternating meal order stay).
- `src/systems/GameStateSerializer.js`: policy `effect` range = tax effects, upper bound + 5 for old saves.
- `src/ui/NeedsDisplay.js`: new Food tooltip; "Varied meals" line removed. `src/ui/PolicyPanel.js`: rations line shows the base.
- `src/i18n/en.js`, `cs.js`: `needs.tip.food` (template), `needs.tip.rations.{small,normal,generous}`, `needs.tip.foodKinds` (plural), `policy.rationsEffect` reworded; `needs.tip.foodCap` and `needs.varietyLine` removed.
- `scripts/policy-smoke.mjs`: expectation updated to base 30 (not run, see Testing).

## Implementation decisions
- Without a PolicySystem (some test scenes) the rations count as Normal, so a fed resident heads for 60 %, not 100 %.
- "Got no food" = the FoodSystem `hungry` flag (missed meal), same signal as before; the tooltip shows the hunger text when that flag is set or Food < 20.
- New residents still start at Food 100 and drift down to their target (no jump on day 1).
- The 3-day window is the existing P3 one (`day − lastEaten < 3`). With Normal (1 meal a day) a resident has 2 or 3 kinds in the window depending on the time of day of his meal, so Normal + all kinds gives 70–75 %; 4 kinds (80 %) only with Generous. Residents who all eat exactly at day change (e.g. all created at t=0) stay at 2 kinds (70 %).

## Save/Load impact
Nothing new is saved; the Food target is derived from the saved rations and the saved meal days. SAVE_VERSION stays 59. The `policy.effect` validator now allows tax effect range [−20, +10] plus 5 above it, so saves made with Generous before this change (effect up to +15) still load; the effect then moves to the new target at 5 points/day.

## Testing
- `tests/policy.test.js`: new tests for 30/60/80, +5 per kind, cap 100, hunger 0, smooth movement, unchanged portions; tooltip en + cs; no Generous bonus / no variety bonus; legacy `effect` 15 accepted, 15.01 rejected. Old P2/P3/Feast/rations tests updated (same intent).
- `tests/needs.test.js`: fed resident heads for 60 % gradually; a resident with 4 kinds recovers to 80 %.
- `npm test`: 1066 pass, 0 fail. `npm run build -- --base=/Newgame/`: OK. No browser smoke (per the task).

Headless balance simulation (workerScene + PolicySystem + subscribed FoodSystem, 6 idle residents in settlement quarters, Castle near: Rest 100, Housing 100, Safety 70; 10 game days; average Happiness at steady state, old → new):

| Scenario | Food old → new | Happiness old → new | Strikes |
|---|---|---|---|
| Normal, 1 kind | 100 → 65 | 96 → 83 | 0 |
| Normal, 2–3 kinds | 100 → 70 | 99–100 → 85 | 0 |
| Small, 1 kind | 60 → 35 | 82 → 73 | 0 |
| Generous, 1 kind | 100 → 85 | 100 → 90 | 0 |
| Normal, 1 kind, High tax | 100 → 65 | 86 → 73 | 0 |
| Normal, 1 kind, Very high tax | 100 → 65 | 76 → 63 | 0 |
| Normal, 1 kind, homeless | 100 → 65 | 71 → 58 | 0 |
| Small, 1 kind, homeless, Very high tax | 60 → 35 | 37 → 28 | 0 (strike below 25) |

Worse case by formula (working, Rest 40, Safety 45, Normal + 1 kind): with a home 64.5 (neutral), homeless 39.5 (unhappy, work ×0.8; old 52 neutral). Result: Normal + 1 kind = 65 % does not start strikes in a normal early game; the balance change ships. Side effects: a typical working resident (Rest 60–70) is at about 73–76 instead of 85–88, i.e. below 80, so Kingdom Attractiveness loses the +15 "happy kingdom" modifier that an early game used to get easily (immigration slower); homeless residents fall from neutral to unhappy sooner; the extreme Small + homeless + Very high tax is 3 points above the strike line.

## Notes for the next agent
- If the owner finds immigration too slow after this, options: Normal base 65 (Normal + 1 kind = 70), or the attractiveness threshold 80 → 75. Not changed here.
- `needs-smoke`/other browser smokes were not run; `policy-smoke.mjs` was updated blind (base 30, "Food need is 30 %").
