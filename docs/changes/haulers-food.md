# Haulers: full loads of food, Hauler and Builder are not "without a workplace"

Plan item `m-nosici-trakar-pracoviste` (owner requests 62 and 65 from the 0.50 playtest).

## What and why

**62 – Wheelbarrow also for food.** Checked on the current code (0.66.0) first:

- Carry capacity is already the same for food and materials. `carryCapacity()` in `src/data/logistics.js` works by load weight. Food weighs 1, so a Hauler carries 40 food by hand, 200 with a Wheelbarrow and 400 with a Horse Wagon. No separate task type or per-unit booking for food is left. Moving food from the Starter Stockpile to the Granary, from drops (meat), and between the stores and the Marketplace already used a full load (verified in a test).
- The bug that remained was supplying food workshops. A Hauler brought the Mill or Bakery only the inputs for one batch (4 Wheat, 2 Flour), and only between batches. So even with a 200-unit Wheelbarrow he went back and forth with 4 Wheat each time. That is the "one at a time" the owner saw.
- Fixed. A Hauler with a Wheelbarrow or Horse Wagon now fills a food workshop's input buffer with as many whole batches as it holds (Mill: 5 × 4 = 20 Wheat; Bakery: 10 × 2 = 20 Flour) in one trip. He also tops it up while a batch is running.
- A Hauler without a vehicle and the workshop's own workers carry as before (one batch, between batches).

**65 – Hauler and Builder are not "without a workplace".** The bug was still there. `candidateGroups()` put everyone without an `assignedWorkplaceId` into the "Without a workplace" group, Haulers and Builders included. Now they are in the last group with the people working in buildings, and the row still says "Now: Hauler/Builder". The group heading changed from "Working in another building" to "Already working" (cs: "Už pracují").

- The Population tooltip showed "Not assigned" for a Builder. It now shows his Builder's Workshop, or "whole kingdom" without one, as it already did for a Hauler.
- The unemployed counters (Population summary, kingdom overview, tips, tutorial, newcomers) already count only `profession === 'idle'`, so they had no bug.

## Files and systems

- `src/systems/FoodProductionSystem.js`: new `inputTarget(building, resource, {bulk})` (how far a carrier fills one input) and `bulkCarrier(worker)` (a Hauler holding a vehicle).
- `src/systems/LogisticsTaskManager.js`: the input-supply catalog uses `inputTarget(..., {bulk:true})` and also runs while a batch is in progress. `updateWorker` trims the amount to the carrier's own target.
- `src/ui/workplaceCandidates.js`: new `worksWithoutBuilding(worker)` (a profession with `JOBS[p].workplace === null`: Hauler, Builder). Such workers go to the `employed` group.
- `src/ui/WorkplacePanel.js`: comment only.
- `src/ui/populationData.js`: workplace line for a Builder.
- `src/i18n/en.js`, `src/i18n/cs.js`: `workplace.group.employed` text only.
- Tests: new `tests/haulers-food.test.js`. `tests/workplace-candidates.test.js` was updated because a Hauler now belongs to `employed`.

## Implementation decisions

- **Food workshops only.** Bulk filling applies only when every input of the recipe is food (Mill, Bakery). Non-food workshops (Wheelwright, Smelter, Pitch Kiln, Bowyer…) keep one batch per trip. Filling them would hoard Wood, Iron and so on that construction sites need. To extend it, change the `FOOD_RESOURCE_IDS` condition in `inputTarget`.
- **Vehicle only.** As specified, a Hauler without a vehicle carries as today. The catalog offers the vehicle target, and `updateWorker` reduces it to one batch between batches (0 during a batch) for anyone else, so the old behaviour is unchanged for them.
- **Output side unchanged.** A producer starts a new batch only once its output buffer is empty, and that output (3 Flour, 4 Bread) carries its own capacity booking. A Hauler already takes the whole batch in one trip, the same as from a material pile, which he empties whenever it holds anything. Letting several batches pile up would delay food and needs a save-format change (`record.outputReservation` vs `cycle`), so it was left alone.
- The input buffer is a non-stock location, so the up to 20 Wheat or Flour waiting in a Mill or Bakery do not count in the top bar or in "days of food". Before, at most 4 sat there.

## Save/Load impact

None. SAVE_VERSION stays 59 and there are no new fields. Input-buffer stock is limited only by buffer capacity, which validation already checks. Trip amounts stay within `carryCapacity()` and are validated as before. The test saves and reloads mid-supply with a Wheelbarrow and a Horse Wagon, and the result is identical.

## Testing

- `tests/haulers-food.test.js` (5 tests):
  - Stockpile to Granary takes a full load by hand, by Wheelbarrow and by Horse Wagon (40 / 200 / 250 of 250 Wheat; capacity 40 / 200 / 400).
  - A Mill supplied by a Hauler with a Wheelbarrow or Horse Wagon gets 20 Wheat in the first trip and never one-batch top-ups. By hand it is still 4 per trip. Save/Load round trip.
  - `inputTarget` for the Mill, the Bakery and the Wheelwright.
  - Picker groups: Hauler and Builder are `employed`, and the counters are checked.
  - Population tooltip workplace for a Hauler and a Builder.
- `npm test`: 1064/1064 pass. `npm run build -- --base=/Newgame/` succeeds.
- No browser smoke, as the spec allows.

## Notes for the next agent

- Not in CHANGELOG.md and not in the package version. Add a player-facing line at release, for example: "A Hauler with a Wheelbarrow or Horse Wagon fills a Mill or Bakery with several batches at once. Haulers and Builders are listed as already working in a building's worker picker."
- To fill output in bulk as well, look at `FoodProductionSystem.update()` (the `used(output)` gate) and `FoodStateValidation` (a `cycle` excludes `outputReservation`).
- `worksWithoutBuilding` is keyed on `JOBS[p].workplace === null`. A new building-less profession joins the group automatically.
