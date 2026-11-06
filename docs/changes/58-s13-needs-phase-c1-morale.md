# #58 S13 phase C, part 1 – mood work speed and Happiness in Kingdom Attractiveness

## What and why
Phase A of [#58](https://github.com/tom161819/Newgame/issues/58) (0.5.0) measured needs and Happiness but they had no effect. This part applies the two effects that need no new saved data:
- the mood's work factor: Happy ×1.10, Neutral ×1.00, Unhappy and Critical ×0.80;
- Kingdom Happiness as a modifier of the existing Kingdom Attractiveness.

Strikes and emigration (part 2) need saved day counters and a new SAVE_VERSION. They follow separately so this part stays a PATCH release (0.6.1).

## Files and systems
- `src/data/needs.js`: `HAPPINESS_ATTRACTIVENESS` (≥80 +15, 50–79 0, 30–49 −20, <30 −45) and `attractivenessFor()`.
- `src/systems/NeedsSystem.js`:
  - `refresh()` runs after every needs update (at most once per second) and after `importState`. It caches each resident's `workModifier` and sets `attractiveness.modifiers.happiness`.
  - `workModifier(worker)` returns 1 for the King, visitors and anyone not yet measured.
  - `destroy()` removes the modifier.
- `src/systems/SkillSystem.js` `workEfficiency` multiplies in `scene.needs.workModifier`. Every work path (mining, chopping, building, farming, food production, hunting) already goes through it. Movement, combat and XP do not.
- `src/ui/NeedsDisplay.js` adds the "Work speed: ×1.10" line (`needs.workLine`, EN/CS).
- `tests/helpers/workerScene.js` has a new option `morale` (default false): it disables `refresh` so the existing exact base-timing tests keep checking skills, hunger and buildings alone. Morale tests pass `morale:true`.

## Implementation decisions
- Cached per update instead of computed per work tick. `status()` scans buildings for Safety, which is too expensive for every frame and worker.
- Nothing new is saved. The factor and the modifier are derived from the saved needs, and rebuilt on Load by `importState → refresh`.
- The spec formula is FinalWorkSpeed = base × skill × HappinessModifier. The existing hunger multiplier stays as well. Hunger also lowers Food and so Happiness, so a long-hungry worker can reach ×0.8 × 0.8. This is intended and listed in the CHANGELOG.
- Attractiveness has base 100 capped at 100, so the +15 bonus only offsets penalties such as the food shortage −40. A larger rework of attractiveness is outside this issue.

## Save/Load impact
None. SAVE_VERSION stays 34 (from #130); the factor is derived.

## Testing
- `npm test` passes, including 2 new tests in `tests/needs.test.js`:
  - the work factor stacks on top of skill and hunger, and the King stays at ×1;
  - attractiveness has no effect without residents, gets a bonus or penalty, rebuilds on Load and is removed on destroy.
- Smoke `--needs` now also checks that the panel's work-speed line equals the applied factor, and that the attractiveness modifier exists. `--event-feed` passes. A full smoke run was made (see the PR).

## Notes for the next agent
- Part 2 (strikes after 2 days below 25, end at 45; emigration after 3 days below 15) needs per-record day counters, i.e. SAVE_VERSION +1 and a MINOR release. Coordinate the number with Codex #185, which also raises SAVE_VERSION.
- Use `scene.needs.workModifier(worker)`, never `status()`, in per-frame code.
