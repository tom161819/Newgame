# #118 Builder's Workshop (7 Nov 2026)

## What and why
Plan item `m-118-dilna-stavitelu` (owner's concept): a building for Builders.
- Builders with a place in a finished workshop work at full speed and wait there when there is nothing to build.
- Builders without a place build and demolish 50 % slower.

## Files and systems
- `src/data/objects/buildings.js`: `builder_workshop`, "Builder's Workshop".
  - 3×3, Industry menu, available from the start, `cost {wood:20, stone:10}`, construction time 30 s.
  - `builderWorkshop: {capacity: 4}`. It is deliberately **not** a `workplace`, so Builders never need it to work, auto-employment never hires into it, and uniforms are unchanged.
- `src/data/objects/approvedArt.js` and `public/assets/buildings/builder_workshop/`: the approved Studio art builders-workshop material yard v2.
  - `art/approvals.json`: `preferred` switched from open-shed (still in review) to material yard, the only approved variant, as the plan item states.
- `src/data/builderWorkshop.js`: `BUILDER_WORKSHOP {capacity 4, unservedSpeed .5}`.
- `src/systems/BuilderWorkshopSystem.js` (`scene.builderWorkshops`): the derived assignment.
  - Finished workshops and living Builders are matched in id order, each Builder to the nearest workshop with a free place. It is recomputed when either set changes.
  - `factor(actor)` returns 1 or 0.5 (Builders only).
  - The first slowed Builder posts an EventFeed notice (once per session).
  - `summary()` gives the counts for the panel.
- `src/systems/ConstructionSystem.js` `workSpeed`: multiplies by `builderWorkshops.factor`. This covers construction, demolition (`DemolitionSystem` uses the same `workSpeed`) and the time estimate.
- `src/data/idleGathering.js` `idleHomes`: a Builder with a place waits at his workshop, using the existing "Waiting near workplace" gathering ring. A Builder without one keeps today's behaviour and waits where he is.
- `src/ui/BuilderWorkshopPanel.js` and `#builder-workshop-dialog` in `index.html`:
  - "3 / 4 builders", their names, and how many Builders in the kingdom have no place.
  - The demolition section is attached.
  - Opened from the GameScene click dispatch.
- `src/ui/UnitPanel.js`: a Builder's workplace line names his workshop, or shows "No Builder's Workshop: −50 % work speed".
- `src/data/gettingStarted.js`: a new step "Build a Builder's Workshop" after the Warehouse.
- i18n in en/cs, `object.builder_workshop.*`.
- Tests: `tests/builder-workshop.test.js` (new), and counts in `assets`, `building-categories` and `getting-started`.
- Smoke: `scripts/builder-workshop-smoke.mjs` (`--builder-workshop`).

## Implementation decisions
- The penalty depends only on having a place, not on the distance to the site (as specified).
- A workshop under construction serves nobody. Demolishing or losing a workshop reassigns everyone on the next query.
- In test scenes without `scene.builderWorkshops` the factor is 1, so existing timing tests are unchanged.
- The once-per-session notice is not saved. After a Load it may show again, which explains the slower building in older games.

## Save/Load impact
None. The workshop is saved like any building, and the assignment is derived again after loading. Games from 0.14.0 load; their Builders work 50 % slower until a workshop is built.

## Testing
- `npm test` passes: 854 tests.
- The `--builder-workshop` smoke passes, plus `--housing`, `--stables`, `--military`, `--demolition`, `--building-unlocks`, `--farmer-establishment`, `--pavement`, `--gate`, `--marketplace` and `--minerals`.

## Notes for the next agent
- Later (#98) Builders may sit on porches. The hook is `idleHomes` (kind `workplace`).
- The price is a first guess. The owner can change it in the Asset Library or Studio ("převzít ceny").
