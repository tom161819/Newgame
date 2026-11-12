# The wolf stays, Towers turn with R, deposits on the minimap

## What and why
Owner, 12 Nov 2026 (plan 17, 29, 31): a wolf that attacked someone should stay nearby for days so soldiers can hunt it;
a Tower should turn with R like a Gate; the minimap should mark found Stone and Iron deposits.

## Files and systems
- `src/data/nightThreats.js` `wolves.lurk` (2–4 days, den 15–25 tiles, roam 6, back to the den below half health).
- `src/systems/NightThreatSystem.js`: a wolf remembers an attack on a person (`state.attacked`); at dawn `lurk` picks a
  walkable den with the most trees around, stays until `until`, roams by day, hunts at night, then leaves; notice
  `threats.wolfLurks`; `lurkingWolves()`; optional saved `lurkers` (id, den, until, victim) restored by `lurkSaved`.
- `src/systems/MilitarySystem.updateSoldier`: `worker.huntWolfId` chases a wolf anywhere (not saved).
- `src/ui/ArmyPanel.js`: order button "Hunt the wolf" (disabled with a reason when no wolf lurks); row order "Hunting a wolf".
- `src/game/GameScene.js`: `rotateGate` turns a Tower (`towerFacing` 0–3, placed as `fields.facing`), preview and
  finished Towers mirrored for odd facings; `WorldCamera` Shift+wheel too. Saved optional `buildings[].facing` (1–3).
- `src/ui/Minimap.js`: `DEPOSIT_MARKS`, `minimapDeposits`, toggle buttons ⛰ / ◈ beside + / −, marks drawn in the overlay
  (free bright, bound dim), a click near a mark centres on it; remembered in localStorage.

## Implementation decisions
- The hunt order is a transient worker field (a reload drops it; the wolf stays saved).
- Towers have four facings in data but two looks (mirror) until Grafika draws four views.
- Deposits on the big map are not outlined yet (minimap only).

## Save/Load impact
SAVE_VERSION stays 62. Optional `nightThreats.lurkers` and `buildings[].facing`.

## Testing
- `npm test`: wolf lurks and leaves (night-threats), soldier hunts a far wolf (military-units), tower facing saved,
  minimap deposit list.
- Smokes `--minimap`, `--wolves`, `--walls`, `--recruits`, `--gate` pass. `--walls-2` and `--soldiers` fail the same way on 0.102.0 (pre-existing: Tower over wall segments; slope too steep for the Armory with lifted terrain).

## Notes for the next agent
- Grafika: four Tower views (facings) and minimap icons can replace the mirror and the diamonds.
