# #58 S13 phase A – Villager needs, Happiness and mood (release 0.5.0)

## What and why
First phase of Master 13 (M4, `docs/upgrades/13_26_villager_needs_happiness.md`). Every permanent resident gets Food, Rest, Housing and Safety (0–100), a weighted Happiness (0.35/0.25/0.25/0.15, minus a separate unpaid-wage penalty counted once), a mood and a main problem. The villager panel, the Population sidebar and a new HUD Kingdom Happiness indicator show them. Phase A only measures and shows: work efficiency, strikes, emigration and the migration modifier are phase C. They depend on the daily rest at home (phase B); without it, busy villagers could not recover Rest.

## Files and systems
- `src/data/needs.js`: rules, weights, moods, `happinessOf()`, `mainProblem()`.
- `src/systems/NeedsSystem.js`: per-resident records `{food, rest, hp, attackedAt}`, updated from `GameTime.onAdvance` at most once per game second. This also runs off camera and under Fog of War, and stops when paused.
  - Food reads only `FoodSystem.residents[id].hungry`, the existing daily meal; it never consumes food.
  - Rest drains in active work states and recovers otherwise.
  - Housing is derived: the settlement's base places (`POPULATION.maximum`), then completed Houses, 5 each, in arrival order.
  - Safety: base 45; +25 finished Castle within 12; +15 tower within 10; +10 Barracks or a soldier within 10; −30 after an HP loss, fading over a day.
  - Summary and Kingdom Happiness (average of residents; null without residents).
- `src/ui/NeedsDisplay.js` (unit panel bars, HUD indicator), hooks in `UnitPanel`, `PopulationSidebar` (needs line, Happiness sort), `populationData.sortedPopulation(..., {happiness})`, `GameScene`, `index.html`, `style.css`, i18n en/cs.
- Save/Load: `needs` in `GameStateSerializer` (validated: one record per living permanent resident, values 0–100, attack time not in the future); `GameStateLoader`; `SAVE_VERSION` 33.

## Implementation decisions
- No second food system: Food is a smoothed view of the existing hunger flag (recover 100/day when fed, decline 50/day when a meal was missed).
- Homes are derived, not stored, in phase A. Phase B stores real home assignments and adds walking home to rest.
- Only living records are exported, so a resident who died since the last update never leaves an invalid record.
- The King and visitors have no needs (`status()` returns null).
- Release `0.5.0` (MINOR) because the save schema changed (#174 rule 3). The spec's request for old-save compatibility is overridden by the alpha save policy.

## Save/Load impact
`SAVE_VERSION` 32 → 33 (`needs.pending`, `needs.records[]`). Earlier saves are rejected with the incompatible-save notice. Within schema 33, Save/Load restores every record exactly.

## Testing
- `tests/needs.test.js` (8 tests):
  - formula, moods and main problem;
  - Food follows meals with no consumption, Rest follows work;
  - once-per-second cadence and pause;
  - housing capacity and homelessness;
  - Safety sources and attack fade;
  - summary, Happiness sort, King and visitors excluded;
  - exact Save/Load and rejected damaged records;
  - 200 residents in one step.
- Browser `--needs` (new): real panel bars, HUD value, sidebar summary and sort, Save/Load. `--population`, `--unit-commands` and the default Save/Load smokes pass.
- `npm test` 718, `changelog:validate`, `version:check`, `build:pages`.

## Notes for the next agent
- Phase B (Claude) waits for Codex #124 (idle gathering at the Castle in WorkerAI): rest at home in the last 25 % of the day, stored home assignment per House, homeless rest slower. Reuse `NeedsSystem.records` and replace `homes()`.
- Phase C: apply `status().workModifier` in `SkillSystem.workEfficiency`, strikes after 2 days below 25, emigration after 3 days below 15, and Kingdom Happiness in `KingdomAttractivenessSystem.modifiers`.
