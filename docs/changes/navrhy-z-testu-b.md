# Battle-test proposals, part B: attack-move, guard shifts, night glow, enemy Gate

## What and why
Owner 18 Nov 2026: "ok udělej všechny návrhy oprav z testu" (project document `claude/test-bitev-0.146.md`). This is the second of four parts: points 5, 8, 9 and 10.

- **Point 8 – attack-move.** A move order made the soldiers walk past enemies (they only hit back when attacked). A move given with the new button in the stance bar (or with Ctrl held on the right click) is an attack-move: on the way a soldier fights like his stance says (`MilitarySystem.advance` → `updateSoldier` with his current tile as the held place), then replans the route and goes on. Hold position soldiers and vehicles just walk.
- **Point 9 – guard shifts.** From day 2 every soldier rested in the first third of the day, so nobody was on watch then. Now there are two shifts (`DAY_NIGHT.soldierRest.shifts`): by the number in the worker id one half rests in the first third of the day, the other in the second. Evening and night: all on watch.
- **Point 10 – night.** A night battle was almost invisible. Selected soldiers and every unit in a fight (attackers and targets, both sides) get a small pale light in the night overlay (`battleGlow`, at most 60). A soldier with a torch in hand has his own light and gets none. Torches from the Military Wagon were already taken automatically (`LightFuelSystem.takeTorch`), nothing changed there.
- **Point 5 – enemy Gate.** `EnemyGates` (new): an enemy Gate is closed (map tiles blocked) and shows closed doors in its arch. It opens (tiles walkable for everybody, doors hidden) while a melee defender with a target stands within 7 tiles of it, stays open 4 s after the last such moment and never closes on a unit standing in it. Enemy archers do not open it.

## Files and systems
- `src/systems/UnitCommands.js`: `move(..., {attack:true})` sets `worker.attackMove` on soldiers; `update` runs `military.advance` before the route step while `MovingToHold`; cleared on arrival and in `interrupt`.
- `src/systems/MilitarySystem.js`: `advance`; `cutOff` returns false for soldiers on a move order (standing or on the way) – they do not start breaching walls by themselves.
- `src/ui/UnitSelection.js`: attack-move toggle button (`data-unit-command="attackMove"`), Ctrl + right click, status text. i18n `command.attackMove*` (en, cs).
- `src/data/dayNight.js` (`soldierRest.shifts`), `src/systems/DailyRest.js` (`soldierShift`, `isSoldierRestTime(gameTime,worker)`).
- `src/game/battleGlow.js` (new), `src/game/NightOverlay.js` (`sources`), `src/render/lightLab.js` (`resolveLights` accepts `scale` and `color` on a source).
- `src/systems/EnemyGates.js` (new), created in `GameScene`, updated from `WorkerSystem.update`.
- Tests: `tests/battle-fixes.test.js` (points 5, 8, 9, 10), `tests/siege.test.js` (morning helper follows the shift).

## Implementation decisions
- Attack-move reuses the soldier brain instead of a new state: the command stays `MovingToHold`, the fight is a detour. After a fight the path and the retry counters are cleared so the route is planned again from where he stands.
- The shift comes from the worker id, not from a saved field: no save change, and it stays the same for a soldier all his life.
- The glow is a scaled, dimmed `lantern` light in a cold colour. It is weak on purpose (20 % of a lantern): units in a melee stand close and their glows add up.
- The Gate state lives only in `EnemyGates.state` (not on the building), so saves and their validation are untouched. A loaded enemy Gate starts closed.
- The closed doors are drawn by code over the approved Gate picture (a polygon in the arch, mirrored with the sprite). It is provisional and not approved art; a drawn closed Gate belongs to the Grafika plan item for damage stages.

## Save/Load impact
None. `worker.attackMove`, `worker.attackFought` and the Gate state are runtime only. SAVE_VERSION stays 65.

## Testing
- `node --test tests/battle-fixes.test.js tests/siege.test.js` and the full suite.
- Browser (Test map): two enemy Gates (both axes) show closed doors; the Gate opened when four enemy soldiers went for five swordsmen and they fought in it; attack-move button and tooltip; night glow.

## Notes for the next agent
- Enemy units exist only on the Test map so far. Part D (enemy army) will use `animal.marching` and must decide how an attacking army treats our Gates.
- An attack-move soldier who cannot reach an enemy (behind a wall) ignores him and walks on. A siege still needs an order.
- If the glow should be stronger, change `UNIT_GLOW.on` in `battleGlow.js`.
