# Defence and attack 3: Battering Ram and ladders

## What and why
Owner 20 Nov 2026: "zpracuj postupně všechny ty návrhy na obranu / útok. zatím udělej nějaký základní assety a modely
pak dodělám". Point 3 of the list in `claude/obrana-utok-plan.md`.

## Files and systems
- `src/data/military.js`: `UNIT_TYPES.ram` (crew of a Ram, vehicle `ram`, +90 HP, armour 25, slow), `RAM` (70 a blow
  every 2.5 s on Gates, walls and Towers, half on other buildings; arrows ×0.25; 40 Wood + 4 Iron, 35 s), `LADDER`.
- `src/data/objects/vehicles.js`: `ram_site` (built beside a Builder's Workshop like the Catapult) and the `ram` vehicle.
- `src/systems/SiegeEngines.js`: `orderEngine` (shared by `orderCatapult` / `orderRam`); `ram()`: the crew rolls to the
  ordered enemy building (or, in a fight, the nearest enemy Gate or wall within 12 tiles), strikes every `reload`,
  never fights people; a short shove of the figure on each blow.
- `src/systems/SiegeSystem.js` `order`: Ram crews take the building as their target like Catapult crews.
- `src/systems/MilitarySystem.js`: `roofed(unit)` – ranged attacks on a Ram crew (ours or the enemy's) do
  `RAM.arrowShare`; the crew is on duty when an enemy building near it is contested.
- `src/ui/BuilderWorkshopPanel.js`: second button "Build a Battering Ram" and its status line.
- Enemy ram `enemy_ram` (`src/data/objects/animals.js`): hostile, never fights people (`AnimalSystem.onAttacked`
  skips it), marches with the army; `EnemyArmy.hit` uses the RAM damage for it. Not counted in morale.
- Ladders (`EnemyArmy.ladder`): enemy Recruits and Swordsmen (`gameplay.ladder`) at one of our wall tiles, straight
  across it with free ground behind: raise 4 s, climb 2.5 s, then they stand on the other side and march on. One of
  ours up on the wall within 2.5 tiles throws the ladder down after 2 s: the climber takes 20 and starts again after
  2.5 s. The ladder is drawn in code. `EnemyArmy.update` removes ladders of the dead or the redirected.
- `EnemyArmy.lead`: a melee enemy no longer stands under an archer up on our wall (he cannot reach him); he marches on.
- Views (provisional, in code): `VehicleViews.ramTexture` (roof, log with an iron head, four wheels, a pennant – red
  ours, blue the enemy's); `BanditView.RamView` for the enemy ram.
- i18n, Wiki page `unit:ram`; Test panel: Ram (ours) and Enemy Battering Ram.
- Tests: `tests/siege-engines.test.js` (ram breaks a wall, arrow share; ladder over the wall, thrown down).

## Implementation decisions
- A Moat stops the ram (wheels factor .02, point 2); Stakes too (.08).
- Ladders only for enemies so far; our soldiers still break enemy walls (or get ordered over them later).
- The ram is runtime state like the Catapult crew; the `ram` vehicle is saved like other vehicles.

## Save/Load impact
None beyond the new vehicle type (saved like the Catapult; no new fields). SAVE_VERSION unchanged.

## Testing
- `npm test`.
- Browser, Test map: an enclosure of our walls with 6 enemy Recruits and an enemy Ram inside, the army ordered to
  march: the ram broke a wall in a few blows, a Recruit raised a ladder and climbed out.

## Notes for the next agent
- Ladders for our soldiers against enemy walls, and filling a Moat, are not done.
