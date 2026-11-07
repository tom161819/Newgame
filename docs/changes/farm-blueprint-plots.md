# Wheat Field: planned Farmhouses count (no "no Farmhouse" notice)

## What and why
Owner request (7. 11. 2026, with a screenshot of Notices): after drawing a Farmhouse blueprint and its fields, every
field reported "Wheat Field: no Farmhouse has room for this plot. Build another Farmhouse." – four identical lines.
Plot ownership only counted finished Farmhouses, so plots of a planned Farmhouse were orphans until it was built.

## Files and systems
- `src/data/farmPlots.js` – `farmInRange` accepts any Farmhouse (blueprint, unverified, under construction); new
  `farmReady`; `availableFarm` prefers a finished Farmhouse with room before distance.
- `src/systems/ProductionDiagnostics.js` – plots of an unfinished Farmhouse raise nothing; orphan plots give one
  `noFarm` issue on the lowest plot id with `params.count`; `hasPlanned(type)` silences `noProducer`, `noField` and
  the `missingChainSource` completion advice while the producer is planned.
- `src/ui/noticeText.js` – `noFarm` with count > 1 uses `notice.noFarmMany`.
- `src/ui/FarmingPanel.js` – `farmPlots.waitingFarm` when the owner Farmhouse is not finished.
- i18n en/cs: `notice.noFarmMany`, `farmPlots.waitingFarm`.

## Implementation decisions
- Ownership is preserved by `reconcileFarmPlots` as before, so a plot keeps its planned Farmhouse once it completes.
  A plot is not moved later from a planned Farmhouse to a finished one; only new plots prefer the finished one.
- Removing (cancelling) a planned Farmhouse already emits `buildings:changed` → reconcile → plots become orphans and
  the summary notice returns.
- The summary keeps the reason `noFarm` (stable key `firstPlotId:noFarm`) so a changing count does not restart the
  persistence timer; only the text switches.
- Farmers only exist for finished Farmhouses, so the existing rules (a farmer establishes only plots of its own home)
  are unchanged.

## Save/Load impact
SAVE_VERSION stays 57. Saves can now contain `farmId` pointing to an unfinished Farmhouse; validation uses the same
`farmInRange`, so they load. Older saves load unchanged and orphan plots near blueprints connect at the next reconcile.

## Testing
- `tests/farm-plots.test.js` – planned Farmhouse takes plots; finished Farmhouse with room wins over a nearer planned one.
- `tests/production-diagnostics.test.js` – a planned Mill silences the build-a-Mill advice.
- `tests/farmer-establishment.test.js` – blueprint Farmhouse + 4 plots → no notice; 2 extra → one notice with count 2;
  cancelling the Farmhouse → one notice with count 6.
- Browser smoke `--farm-blueprint`: Farmhouse blueprint and 4 fields drawn through the menu, no notices, fifth field orphan.

## Notes for the next agent
- `m-upozorneni-dul-sklad` style grouping is not a general system yet; other repeated per-entity notices
  (`noFarmer`, `outputFull`) are still one per entity.
- The construction-site panel of an unbuilt plot shows no "waiting for Farmhouse" line; only the FarmingPanel does.
