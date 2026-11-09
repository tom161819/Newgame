# m-drevorubci-stromy – woodcutters without trees (playtest 0.83.0 #1)

## What and why

Report 0.83.0 point 1 (severity high): from day 14 to 22 wood stayed at 26, the first Lumberjack Hut had "Known mature
trees in working radius: 0", Notices were empty and automatic employment kept sending people there (5 Woodcutters, 3
waiting). The tutorial's hut, placed second, was finished only on day 3.5 and wood fell to 4. Changes:

1. **Notice** `noMatureTrees` (Notices 3, once per state): "The Lumberjack Hut has nothing to fell – build a new one near a
   forest" / "Dřevorubecká chata nemá co kácet – postav novou u lesa". It replaces the hut's old `depleted` notice (which
   fired only with no tree object at all, young ones included). Gone as soon as a mature tree is in range. A click pans the
   camera to the hut (and opens its window as before).
2. **Automatic employment**: a hut offers `min(capacity, mature trees in radius)` seats. A Woodcutter with no felling work
   for `FORESTRY.surplusDays` (1 game day) leaves a hut that has more Woodcutters than mature trees (becomes Unemployed;
   automatic employment then places him elsewhere). Only while automatic employment is on.
3. **Regrowth**: after a Woodcutter's felling, with the Dev chance (default 50 %) the stump becomes a sapling at once
   (skips the 1-day stump stage). Stumps and young trees inside a finished hut's radius grow ×1.5 (Dev value).
4. **Builder priority**: the first Granary site, then the first Lumberjack Hut site (while none of the type is finished)
   are taken first by Builders and their materials carried first by Haulers (`CONSTRUCTION_RULES.firstPriority`).
5. **Hut window**: "Young trees in working radius: N · next mature tree in ~X days" (`#forestry-young`).
6. **Dev tool** group "Forest and wood" (`DEV_FOREST_KEYS`): forest growth ×0.25–×4, sapling chance 0–100 % (default
   50), growth near a hut ×1–×3 (default 1.5), woodcutter radius ×0.5–×2, chop time ×0.25–×4 (7 s today), wood per tree
   ×0.5–×3. Economy overview line "Forest: N mature / M young trees in the radius of K Lumberjack Huts · Wood X a day".

## Files and systems

- `src/data/naturalResources.js` – `FORESTRY.saplingChance`, `hutGrowthBoost`, `surplusDays`.
- `src/data/devBalance.js` – `DEV_FOREST_KEYS`, per-key `devRange(key)` / `devDefault(key)`; export, validation,
  `devBalanceChanged` and Reset now compare with each key's default (not ×1); `devTreeWood(rule,factor)`, `devChopDuration`.
- `src/systems/NaturalResourcesSystem.js` – growth clock × `forestGrowth`; flush applies the hut boost; a matured tree
  calls `employment.request()`; `work()` uses the Dev chop time and wood, plants the sapling (`this.random`, tests set it).
- `src/systems/ForestryWork.js` – `radius()` (× woodRadius), `inRadius()`, `huts()`, `trees()`; summary `young`,
  `nextDays` (`nextMatureDays`: stage days left, seasons calendar, Dev growth, hut boost; null over 120 days).
  A felled tree's Wood above one load (`carryCapacity`, 8) stays on the ground for the Haulers.
- `src/systems/ProductionDiagnostics.js` – `noMatureTrees` in `depletionIssues`.
- `src/systems/EmploymentSystem.js` – seat limit in `seats()`, `releaseSurplusWoodcutters()` from `update()`.
- `src/systems/ConstructionSystem.js` (`priorityRank`), `BuilderAI.js`, `ConstructionMaterialsSystem.js` (`priority`),
  `src/data/construction.js` (`firstPriority`).
- `src/ui/WorkplacePanel.js`, `src/ui/DevBalancePanel.js` (forest fold, per-key ranges, "50 %" output, overview line),
  `src/systems/DevTools.js` (`forestOverview`), `src/ui/NoticesPanel.js` (`NOTICE_CAMERA` in `openEntity`),
  `src/game/WorldCamera.js` (`lookAt`), `src/systems/ResourceTransactionLedger.js` (event `wood`).
- Save checks: `FoodStateValidation.js` (a chop task amount = the save's Wood per tree, or one load),
  `GameStateSerializer.js` (partial chopping up to the save's chop time; the growth clock may run up to ×4 ahead of
  the age clock × 1.25 with the Dev forest growth).
- i18n en/cs: `notice.noMatureTrees`, `workplace.youngTrees`, `workplace.nextTree(None)`, `dev.tool.forest`,
  `dev.balance.key.*` (6), `dev.overview.forest`; `dev.tool.resetDone` now says "defaults".

## Implementation decisions

- **Sapling semantics.** Stumps already regrew by themselves (1 + 3 + 4 days, winter 0 – the playtest's 8 empty days
  were mostly autumn ×0.75 and winter). The planted sapling therefore only skips the stump day; I did not make unplanted
  stumps stop regrowing (that would shrink forests). Never planted by the King, on a tree marked for removal, or under a
  building plan.
- **Notice uses live trees**, not the fogged memory (the Woodcutters know their forest). The window's "known" count stays.
- **Idle = no felling work** (no `chopTree`/`clearMark` task, no wood cargo, no harvest pickup) since the last check;
  rest, meals and walking home do not reset the day. Not string-matched on work messages (another chat translates them).
- **Priority is general**, not tutorial-only: the first Granary and first Lumberjack Hut of any kingdom go first. A
  Builder already working elsewhere keeps his site.
- **Dev values** use one grid (0.05) and one save field; sapling chance is a probability, shown as a percentage.

## Save/Load impact

SAVE_VERSION stays 61. `devBalance` may now hold the six new keys (only when they differ from their default); ranges
are checked per key. Tree states are unchanged (a planted sapling is stage 1). The surplus-Woodcutter waiting times are
not saved: after Load the day starts again.

## Testing

- `npm test`: all pass (new `tests/drevorubci-stromy.test.js`, 8 tests: notice once/gone/texts, employment seat limit,
  surplus leaves after a day (and not with automatic employment off), planting rules and hut boost, Granary/hut
  priority for Builders and Haulers, young-tree count and estimate incl. winter, Dev ranges/defaults/chop time/wood/
  radius/save round trip, overview). Updated: `forestry-workers`, `production-diagnostics`, `balance`, `dev-tool`; the
  test helper sets `naturalResources.random` so felling leaves a stump unless a test raises the chance.
- Browser smoke `--woodcutter-trees` (new): PASS. Also PASS: main `--current-only`, `--tutorial`, `--tutorial-v3`,
  `--dev-tool` (now 23 sliders), `--dev-balance`, `--storage-notices`, `--forestry-workers`, `--employment`,
  `--notices`, `--notices-2`, `--chain-notices`, `--e1`, `--depleted-mine`.

## Notes for the next agent

- `--storage-notices` and `--employment-spread` placed their hut on a treeless spot of world `…-1`; with the new seat
  limit the fixtures now grow three mature trees beside it. `--employment-spread` still fails later at "took the free
  Quarry seat" – it fails the same way at v0.83.0 (not caused here). `--forestry` and `--minerals` fail at v0.83.0 too.
- Not checked in a long play-through: whether 50 % / ×1.5 keeps a 3-Woodcutter hut busy over a winter. Tune with the
  Dev tool and copy the values into `FORESTRY`.
