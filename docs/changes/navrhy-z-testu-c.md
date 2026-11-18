# Battle-test proposals, part C: archers in sieges, unit roles and balance

## What and why
Owner 18 Nov 2026: "ok udělej všechny návrhy oprav z testu" (project document `claude/test-bitev-0.146.md`). Third of four parts: point 3 and the unit balance.

- **Point 3 – archers in sieges.** Archers only watched a siege: no shot went over a wall and they never shot at buildings.
  - *Lobbed shot* (`LOB` in `CombatSystem.js`): a soldier with a bow or crossbow, and an enemy archer, hits a target within 4 tiles over at most 2 blocking tiles for half the damage. `inAttackRange` accepts it, `shotFactor` halves the damage in `CombatSystem.update`. Hunters and the King still need a clear line. An archer whose target is cut off walks to a tile he can lob from (`MilitarySystem.cutOff`).
  - *Fire arrows* (`FIRE_ARROWS` in `military.js`, `SiegeSystem.fireArrows`): a siege order on a wooden enemy building (`burns` = what the night fires can burn) takes the ranged soldiers too. They stand inside their range, do 35 % of their attack to the building and after 20 archer-seconds it catches fire (`NightThreatSystem.ignite`). Our people do not put out an enemy building. At stone they still do not shoot.
- **Balance and roles.**
  - Enemy armour came closer to ours: Recruit 2 → 5, Swordsman 6 → 20, Knight 10 → 30.
  - Halberdier: armour 35 → 30, the same as the Swordsman (he won every match-up; a first try with 25 broke the p70 rule that his plate armour gives at least 30), `bonusVs.mounted` 1.5.
  - Crossbowman: `pierce` 0.5 (half of the target's armour is ignored).
  - Light Cavalry: `charge` – after a ride of 5 tiles since his last blow, the first blow on a new target does 35 hit points at once (before armour).

## Files and systems
- `src/game/lineOfSight.js` (`blockersBetween`), `src/systems/CombatSystem.js` (`LOB`, `canLob`, `shotFactor`, hooks `pierce` and `bonus`).
- `src/systems/MilitarySystem.js`: `spec`, `pierce`, `mounted`, `bonus`, `charge` (sets the combat hooks in its constructor), lob place in `cutOff`, `worker.chargeFrom` / `worker.chargeTarget`.
- `src/systems/SiegeSystem.js`: `canFireArrows`, `burns`, `fireArrows`, `drawArrow`, `lastOrder`; `order` returns melee + archers + engines.
- `src/systems/NightThreatSystem.js`: no firefighting at an enemy building; its own message when one is set alight.
- `src/data/military.js`, `src/data/objects/animals.js` (numbers), `src/ui/UnitSelection.js` (status text), i18n (en, cs): `siege.orderFire`, `siege.setAlight`, work messages, Wiki texts of the Archer, Halberdier, Crossbowman and Light Cavalry.
- Tests: `tests/battle-fixes.test.js` (lob, lob place, fire arrows, roles).

## Implementation decisions
- The lob is decided from the map only (blocking tiles), so it also goes over a tree or a rock at short range. That is on purpose simple; it is limited to soldiers and enemy units so hunting does not change.
- Role numbers live in `UNIT_TYPES` and reach the combat through two hooks, so `CombatSystem` still knows nothing about unit types.
- The charge needs a new target and a ride: a rider who is attacked where he stands gets none. `chargeFrom` is set when the unit gets its stats and after every blow.
- The fire uses the existing building fire (health, flames, spreading only when night fires are on). Arrows alone would also bring the building down; the fire makes it faster.
- No enemy riders exist yet, so the Halberdier's bonus shows only once they do (part D or later).

## Save/Load impact
None. New worker fields (`chargeFrom`, `chargeTarget`, `lobWait`, `arrowWait`) and the fire-arrow heat are runtime only. Unit numbers are recalculated from `UNIT_TYPES` on load. SAVE_VERSION stays 65.

## Testing
- `node --test tests/battle-fixes.test.js` and the full suite.
- Headless battles: 10 v 10 match-ups for every unit (results in the project document), fort sieges A–E.
- Browser (Test map): four archers ordered at an enemy House – arrows fly, the House catches fire after about 6 s and falls.

## Notes for the next agent
- Match-ups vary a lot between runs (the Light Cavalry against Knights ended between 1/10 lost and 9/10 won). Do not tune from one run.
- The flying arrow is a small flame drawn by code; ordinary shots still draw nothing. Arrow art is a Grafika task.
- An enemy House on the Test map counts as housing for our people (older quirk of the sandbox, not touched here).
