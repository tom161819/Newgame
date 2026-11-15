# Hit points of all buildings, fire damage, repairs by Builders

## What and why
Plan item m-budovy-hp. Owner 14 Nov: he wants to see a building's hit points; 15 Nov 05:04: "Životy budov ano teď". Before, only fortifications had hit points and nothing used them.

## Files and systems
- `src/game/buildingHealth.js` – `buildingMaxHP` for all buildings (`BUILDING_HP_RULES`: base 100, 8 per price unit, repair share .5, minimum repair work 3 s); `repairPlan`.
- `src/systems/RepairSystem.js` (new) – automatic repair jobs on `building.repair`, Builder work via the construction system (like demolition), hit points follow the work.
- `src/systems/ConstructionSystem.js`, `BuilderAI.js`, `WorkerAI.js` – repair sites (`site.repair`, task kind `repair`).
- `src/systems/NightThreatSystem.js` – a fire starts from the building's hit points and writes them down as it burns; a fire cancels a repair.
- `src/game/GameScene.js`, `GameStateLoader.js` – create, update, rebuild.
- `src/systems/GameStateSerializer.js` – saves and validates `repair` and `repair` tasks.
- `src/ui/DemolitionUI.js`, texts – hit points line with the repair state.
- Tests: new `tests/building-repair.test.js`; `save-animal-retaliation` adjusted.

## Implementation decisions
- **Automatic repair**, no button: every second a damaged, finished building that is not burning, demolished or unverified gets a job when the stores can pay. Paid at the start (from the stores, like the Castle upgrade); no refund if the job stops – the materials went into the work.
- **Cost**: for each resource of the price `ceil(price × missing share × 0.5)`; for a Castle with levels the level's upgrade price is used too. **Work**: the construction time × missing share (at least 3 s).
- **Fire**: hit points = max × fire health; a building that was damaged starts its fire at that share. Burning down at 0 is unchanged.
- Hit points of other buildings are a first guess; balance later with enemies.

## Save/Load impact
Optional `repair` record on buildings and `repair` worker tasks. Save version stays 62; `hp` may now appear on any building with hit points.

## Testing
Full suite; new tests (hit points, repair with save/load and validation, fire). Browser harness /tmp/perfdiag/rep.mjs: a damaged House, the Builder repaired it in about 13 s of game time, detail text checked.

## Notes for the next agent
Enemies attacking buildings should call `damageBuilding`; at `destroyed` remove the building (`detachLostBuilding`).
