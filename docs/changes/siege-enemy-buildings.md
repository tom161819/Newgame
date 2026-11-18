# Owner 18 Nov 2026 – enemy buildings on the Test map and melee attacks on walls

## What and why
The owner asked (18 Nov 2026) to switch to the enemy on the Test map and build enemy walls and buildings, and for melee units to be able to attack walls. The Test panel got a "Build for: Kingdom / Enemy" switch; buildings placed for the enemy carry `building.enemy`, are drawn with `ENEMY_TINT` and enemy Gates are closed (their tiles blocked). Selected melee soldiers right-clicked on an enemy building surround it and take its hit points (`damageBuilding`); at zero it is removed like a burnt building and its ground is walkable again.

## Files and systems
- `src/systems/SiegeSystem.js` (new): `siegeable`, `canSiege`, `siegeTiles`, `markEnemyBuilding`, `SiegeSystem` (order, per-soldier update, destroy, HP bar). Owned by `MilitarySystem` as `military.siege`.
- `MilitarySystem.updateSoldier`: when no enemy unit is a target, the siege takes over; `orderAttack` ends a siege.
- `UnitSelection`: right click on an enemy building orders the siege (before wall posting); the attack cursor shows over enemy buildings.
- `UnitCommands.interrupt` (move/hold) ends a siege. `CombatFeedback` plays the attack pose while a soldier hits a building.
- `sandboxMode.js`: the side switch (`scene.sandboxSide`), `sandboxBuilt`, Charge falls back to the nearest enemy building. `GameScene.refreshWallConnections` repaints enemy walls with the tint; `confirmWallLine` marks sandbox wall lines.
- `RepairSystem.damaged` ignores enemy buildings.

## Implementation decisions
Buildings have no owner model yet, so `enemy` is a plain flag used only on the Test map. Damage is the soldier's attack DPS × `SIEGE_RULES.damageShare` (0.5) per second, outside `CombatSystem` (which is unit-vs-unit). Fallen buildings leave no ruin. Archers are left out on purpose (the owner asked for melee).

## Save/Load impact
SAVE_VERSION unchanged. The Test map is never saved; `enemy` and `siegeTargetId` are runtime fields.

## Testing
`tests/siege.test.js`: siege tiles, enemy marking and closed Gate, four swordsmen breaking an enemy wall while an archer stays, a move order ending the siege. Full `npm test` passes.

## Notes for the next agent
Enemy units do not yet attack our walls, and enemy soldiers do not use enemy walls or Towers. Wall patrols (`WallPatrol`, `wallStops`) still see enemy walls as walls; filter them when buildings get a real owner. An enemy wall touching ours joins it visually.
