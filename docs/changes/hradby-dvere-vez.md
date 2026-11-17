# Walls, Tower doors and Gates as one network (0.144.1)

## What and why
Owner 17 Nov 2026: soldiers on walls, Gates and Towers still behaved badly. The owner's rules:
- The walls are reached only from a Gate or a Tower.
- A Tower is reached from a wall, from another Tower, or from the ground on the side with its entrance door. That is why the way a Tower is built matters: the door must face into the castle, and nobody outside the walls may get on.
- A Gate is reached from the ground, a wall or a Tower directly joined to it.
- A wall joined to a Tower gets a door in the Tower so the way also shows.
- A soldier sent up ran somewhere far first.
The owner asked us to test it ourselves until it is logically right.

## Files and systems
- `game/buildings.js`: the Tower door side comes from `facing` (0 S, 1 E, 2 N, 3 W), set with R while placing. `sideTiles` and `entryTiles` give the ground tiles from which a building is climbed: a Tower only at its door, a Gate from its passage, a wall from the entries of the Towers and Gates touching it.
  - `approachTower` and `planTowerExit` use them, so the King goes up and down by the same rules. PlayerController passes the buildings to them in its routing options.
- `game/wallNetwork.js` (new): all raised tiles (finished walls, Towers, Gates) as one 4-neighbour network.
  - `planAscent` picks the entry with the smallest ground walk plus raised walk.
  - `planDescent` finds the nearest way down.
  - `elevatedRoute` gives a path along the raised tiles.
- `systems/WallPatrol.js` (rewritten core):
  - A soldier walks to the chosen entry and climbs there (`p.climb`), then walks along the network to the post or patrol stops.
  - A Tower post stands on its platform slot.
  - `set(false)` and `descend` walk him to the nearest way down (`worker.wallDescent`, not saved). `land` puts him on its ground tile and continues with the route he got meanwhile.
  - `leave` stays as the instant fallback (death, rest).
- `WorkerController`:
  - `moveTo` while descending plans from the foot of the way down.
  - The onWall branch lands him when the raised route ends.
- `UnitCommands.move`: a move ends a wall post. One on the wall descends first, and the ground route starts at his way down.
- `GameStateSerializer`:
  - A descending soldier is saved at his way-down tile.
  - A nature check failure names the object and its tile.
- Tower art:
  - `artSprites['door-e']` (door on the right face) and `'no-door'` (door on a hidden face) are cut from the approved sprite.
  - `GameScene.faceTowerView` picks the sprite by facing, without mirroring.
  - The placing preview marks the door tiles in gold, with a hint naming the side.
  - `TowerDoors` draws a door at wall-walk height on a visible Tower face where a wall joins.
- Test map: wall lines are free and finished at once.

## Implementation decisions
- One raised network, with steps between any touching raised tiles, matches the owner's list: wall-wall, wall-Tower, wall-Gate, Tower-Tower, Tower-Gate.
- The door sprites are provisional mechanics art cut from the approved Tower: the door patched out, then mirrored onto the right face. The Grafika chat can replace them with Studio views.
- A Tower door on the N or W side is on a face the viewer cannot see, so no door shows there. The gold tiles while placing show it.

## Save/Load impact
None to the format. `facing` was already saved. A soldier walking down is saved standing at his way down.

## Testing
- `tests/wall-access.test.js` follows real soldiers in small forts:
  - An inside-facing door gives the only way up.
  - An outside-facing door gives no way up from inside.
  - The shortest total way wins over a near stair.
  - Tower to Tower works, and a Gate is climbed from its passage.
  - A move order walks him along the wall, down at the door, and on to the goal; a save made meanwhile puts him at the door.
  - The way down and the upper doors are checked too.
- `buildings.test` (door-only entry and exit), `walls.test` and `military-units` were updated.
- `npm test` passes.
- Browser (Test map): a fort was built with the UI, including R turning, the door preview, two Towers, walls and a Gate.
  - Inside soldiers climbed at the Gate passage and at the inward Tower door.
  - A move order brought one down along the wall and through the Gate.
  - The right-face door view, the doorless view and the upper door above a joined wall were checked by screenshot.

## Notes for the next agent
- The owner reported a save failing the nature check in 0.144.0. The cause is unknown: wait for their bug data, which now names the object.
- The King's wall walk still uses his own roof routes (walls only). He gets up and down only at doors and Gates now, but he does not walk across Towers yet.
