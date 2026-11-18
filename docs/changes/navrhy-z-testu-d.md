# Battle-test proposals, part D: an enemy army that attacks

## What and why
Owner 18 Nov 2026: "ok udělej všechny návrhy oprav z testu" (project document `claude/test-bitev-0.146.md`). Last of four parts: point 2 ("the enemies are passive: they stand until someone comes within 9 tiles, never attack our buildings or walls, cannot climb walls; our archers on walls are untouchable").

- **Enemy army with an order** (`src/systems/EnemyArmy.js`). `march()` gives every enemy soldier on the ground `animal.marching` (the goal: the tiles around our Castle, else the middle of our buildings or soldiers). A marching enemy (`lead`, called from `AnimalSystem.update`): fights anyone of ours within his guard radius and chases without the 18-tile leash; walks on to the goal; when no route is left (our walls) a melee enemy picks our building most on his way (walls and Gates first) and hits it (half his attack, the ram stand-in); at the goal he attacks our buildings within 9 tiles. The Castle takes 15 % of his attack and never drops under a quarter of its hit points (there is no defeat by siege yet). Destroyed buildings use `SiegeSystem.destroy(b,{ours:true})` with its own message.
- **Test panel button** "⚔ Enemy attacks" (`sandbox.enemyAttack`). Outside the Test map there is no enemy army yet; this is the system the armies of other castles will use.
- **Archers on their own walls.** An enemy archer placed on an enemy wall, Tower or Gate tile goes up (`EnemyArmy.mount`, `animal.onWall`): drawn on the wall top, he never moves and shoots whoever of ours is in reach (wall bonus +2 tiles, no line of sight needed, as our wall archers). Nobody with a blade reaches a unit on a wall (`inAttackRange`, both sides). Our melee soldier sent at such an archer breaks the wall under him (`MilitarySystem` marks him cut off → breach); when the wall falls the archer comes down with 30 % damage.
- **Our Gate shuts** (`EnemyGates`, `OUR_GATE.closeRadius` 7) while a hostile unit is near, never on someone standing in it, with closed doors drawn; it opens again when the enemy is gone.

## Files and systems
- `src/systems/EnemyArmy.js` (new), created in `GameScene` (`scene.enemyArmy`).
- `src/systems/AnimalSystem.js` (wall archers, marching hook), `src/game/AnimalController.js` (a unit on a wall stays drawn on top).
- `src/systems/CombatSystem.js` (no blade against a unit on a wall), `src/systems/MilitarySystem.js` (melee at a wall archer → breach), `src/systems/SiegeSystem.js` (`destroy(b,{ours})`, archers fall), `src/systems/EnemyGates.js` (our Gates).
- `src/game/sandboxMode.js` (button; enemy archers onto walls), i18n `army.*`, `sandbox.enemyAttack`, `sandbox.noArmy` (en, cs).
- Tests: `tests/battle-fixes.test.js` (march and Castle floor, breaking through and our Gate, wall archers).

## Implementation decisions
- Ladders are not done: a melee enemy breaks the wall instead. Climbing would need a wall walk for enemies (WallPatrol is ours only); left for later.
- The Castle floor stands in for a real defeat rule. When the owner wants a lost Castle to end the game, raise `castleFloor` to 0 and decide what happens.
- Our Gate also shuts for our own people while the enemy is near (it is one door). Soldiers inside fight from the walls or with lobbed shots; a melee sortie needs the enemy to come to the Gate or the player to wait for it to open.
- Marching enemies repath every ~1.5 s (random spread) to keep the path search cheap.
- Everything here is runtime: `marching`, `onWall`, `armyBuilding` and Gate states are not saved; a loaded game has the enemies standing again.

## Save/Load impact
None. SAVE_VERSION stays 65.

## Testing
- `node --test tests/battle-fixes.test.js` and the full suite.
- Browser (Test map): three enemy archers onto an enemy wall (they stand on top), ten enemy soldiers sent by the button marched on the Castle and brought it to its floor.

## Notes for the next agent
- Enemies stack on few tiles around a building; `lead` spreads them over free siege tiles, but a big army still crowds.
- Enemy units never retreat or heal. A morale or retreat rule for them is the next step if battles feel flat.
