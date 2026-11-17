# 69: bodies stay three days, blood stains in fights (0.143.13)

## What and why
Owner 17 Nov 2026 (69): "let the dead lie where they died for at least 3 days; battles should leave blood stains".

## Files and systems
- `src/systems/BattleMarks.js`: corpses `{x, y, at, look, facing}` (only figures with an approved look; a soldier's sheet plays the fall, others lie down as their standing frame turned and dimmed) for `corpseDays` 3; stains `{x, y, at, size}` at most one per unit every 450 ms on a damage event, plus a pool under each body, fading over `stainDays` 2; caps 300 / 400; drawn under the fog layer (stains depth −64) and hidden by fog state; checked once a second.
- `GameScene`: creates it, adds a stain on every `combat` damage, a corpse on each death (worker or animal) instead of the 0.143.5 fading body (`HumanView.playDeath` removed), updates it each frame.
- Save: optional `battleMarks` with strict `validBattleMarks` (no SAVE_VERSION change); loader restores and redraws (loading a look's sheet first when needed).
- `HumanView`: a view with a fixed look (enemy soldiers) takes it at once in the constructor.

## Implementation decisions
Procedural figures (bandits, raiders, wolves) leave blood but no body. A body does not block the way.

## Save/Load impact
Optional `battleMarks`; older saves load without it.

## Testing
tests/battle-marks.test.js (three days, stain throttle/fade/cap, save/load/validation); npm test; browser: Test map, four of ours against four enemies – four bodies in blue and the stains of the fight.

## Notes for the next agent
Durations in BATTLE_MARKS. A body could later be buried (a task for the Gravedigger/zone `buryFallen`).
