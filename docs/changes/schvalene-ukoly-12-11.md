# Approved small tasks of 12 Nov 2026

## What and why
The owner approved (plan status `planovano`) five small tasks from his play notes of 12 Nov:
`m-drevorubec-dosah`, `m-stromy-bez-hp`, `m-smolar-pochodne`, `m-necinni-pohyb`, `m-kral-panel-prekryv`.

## Files and systems
- **Woodcutter range** – `src/systems/ForestryWork.js`: `eligible(building)` lists mature trees of the whole map sorted
  by distance from the hut (inside the old radius always, further only on explored ground), cached for one second of
  game time per hut; a search routes to the 24 nearest free ones. `nearestDistance`, `FORESTRY_FAR_TILES` (40).
  `src/systems/ProductionDiagnostics.js`: `noMatureTrees` now means none on the known map; new `treesFar`.
  `src/ui/noticeText.js`, `NoticesPanel.js`, texts. The hut's `workRadius` still boosts growth and feeds the window.
- **Trees without a bar** – `src/game/TreeView.js`: `showWork` shivers the tree at each of 7 blows, no bar.
- **Pitch Kiln** – `src/systems/FoodProductionSystem.js`: `recipeMode` ('auto' or a recipe) and `torchTarget` in the
  production record; `chooseRecipes` leaves a manual choice alone. `src/ui/WorkplacePanel.js`: Automatic option, the
  reason line and the target slider. Cause of the bug: `chooseRecipes` overwrote the player's choice every update.
- **Idle residents** – `src/systems/IdleGathering.js`, `src/data/idleGathering.js`: own dwell time per worker and
  claim (`chance`, a hash of id and a counter), a first wait after start/load, one of four random spots.
- **King's cargo panel** – `index.html` (`#king-cargo` wrapper), `src/style.css`.

## Implementation decisions
- Open questions answered by the proposal in each spec: only trees lose the bar (rocks keep theirs); only the
  Woodcutter loses the range (Hunter, Fisher unchanged).
- Idle residents: the chat between two residents, visiting a fire or a well and sitting down from the spec are not
  done; the rhythm and the random spots are.
- The Pitch Kiln fields are optional in the record, so old saves load and `SAVE_VERSION` stays 62.

## Save/Load impact
No format change. A kiln's choice and target are saved with its record.

## Testing
- `npm test`: 1258 pass. Browser: `--woodcutter-trees` (updated for the whole map), `--hud-cargo`, `--torches` pass.

## Notes for the next agent
- No browser smoke clicks the new Automatic option or the slider.
- With no range, Auto Employment staffs a hut whenever a mature tree stands anywhere on the known map.
