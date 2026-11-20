# Conquest mode (owner point 86b)

## What and why
Owner, 20 Nov 2026: a Conquest mode under the Test map in the menu – start on a map with my army and take the enemy Castle (kill the King unless the template sets another goal). The attacker has no economy; at the start he picks his supplies (horse wagons with food, stones for the Catapults, torches). The enemy plays actively (counter-attacks).

## Files and systems
- New `src/game/conquest.js` — `Conquest` (supply wagons at the start, the goal checked every 0.5 s, counter-attacks, the end), `conquestGoal` (a King goal with no King in the template is played as "the whole army"; "hold" waits for Defence), `conquestState` (won / lost / on; only the template's enemies count, walls do not count for the Castle goal), `clampSupplies`, `showConquestEnd` (Victory / Defeat, time, soldiers left, Play again, Main menu).
- `src/data/scenarios.js` — `BUILTIN_SCENARIOS` for templates the owner approves (empty now).
- `src/data/objects/animals.js` — the enemy King (`enemy_king`: 420 HP, armour 35, stays near his place); provisional look: the enemy Knight with a gold crown drawn by `HumanView`. Also on the Test panel.
- `src/game/sandboxMode.js` — a Conquest start removes our Castle and first store (`removeStartBuildings`), puts the template down, starts `Conquest` and shows no Test panel.
- `src/ui/GameApplication.js` — `chooseConquest()` (template list, goal and armies, wagons 0–5 per kind), `startConquest()`; `index.html` — the "Conquest" button under the Test map.
- `src/game/GameScene.js` — `conquest.update` each frame.
- i18n `conquest.*`, `menu.conquest`, the enemy King's name; `src/style.css` — the two windows.

## Implementation decisions
- The world is the template's own (made with our Castle), so the Castle is removed rather than never made: the trees and rocks stay where the author saw them.
- Counter-attacks: when one of our soldiers comes within 18 tiles of an enemy building, half of the free enemy soldiers (not the King, not those on walls) march on our army; then every 3 game hours a third of the rest.
- Supply wagons are the existing military wagons: food 40 bread, stones 60, torches 30 each; soldiers eat, Catapults load and torches are taken from them as in the main game.

## Save/Load impact
None: Conquest, like the Test map, is not saved.

## Testing
New `tests/conquest.test.js` (goal, supplies, won / lost, Castle goal and walls, counter-attack and waves without the King). Browser: a template with an enemy Tower, the enemy King and 5 enemy soldiers against 5 Swordsmen; Conquest from the menu with 1 food and 2 stone wagons – no Castle of ours, 3 wagons, the goal shown; the counter-attack came when our army got close; the King fell and Victory showed.

## Notes for the next agent
Known: the economy HUD and the low-food notice still show in Conquest. Defence (86c) can reuse `Conquest` with the hold goal and enemy waves on our Castle.
