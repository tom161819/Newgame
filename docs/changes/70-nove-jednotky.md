# 70: new units (0.143.16)

## What and why
Owner 17 Nov 2026 (70): "add new units – Knight (without a horse), Halberdier (new weapon halberd + armour; the Swordsmith makes it, switched in the building) attacks from 2 tiles, Royal Archer – an archer with the Swordsman's defence (bow), Crossbowman (new weapon + light armour; the Bowyer makes crossbows, switched in the building), Light Cavalry (sword + horse) (I will send the art later)".

## Files and systems
- `data/military.js`: `knight` has no `mount`; new `halberdier` (halberd + armor, attackRange +1 = 2), `royal_archer` (bow, +60 HP, armour 15, range 6 with the bow), `crossbowman` (crossbow + light_armor, range 5), `light_cavalry` (sword, mount horse, ×1.5 speed).
- `data/militaryEquipment.js`: items `halberd` (Swordsmith, 4 Iron + 3 Wood, +120 % attack), `crossbow` (Bowyer, 6 Wood + 1 Iron, +90 %), `light_armor` (Armorer, 2 Iron + 1 Wood, armour 15); `UNIT_ROLES` for the new units.
- `data/production.js`: `SWORDSMITH_RECIPES`, `BOWYER_RECIPES`, `ARMORER_RECIPES`; the workshops get `recipes`, so the building window shows the production switch.
- `data/objects/military.js`: the three items (pictures of Sword, Bow and Armor until own art); the Armory stores them. Weights (`logistics.js`) and prices (`trade.js`).
- `CombatSystem.isRanged(unit)` = range above 2. The Halberdier (range 2) stays a melee fighter (no arrows, no stepping back) but strikes from 2 tiles (`MilitarySystem.updateSoldier`).
- `approvedArt.STAND_IN_LOOKS`: Halberdier → Knight figure, Royal Archer and Crossbowman → Archer, Light Cavalry → Swordsman.
- `MilitarySystem.releaseUnusedHorses()` (after the Stables load): a horse held by a unit that no longer rides goes back.
- Test map, Army panel order, selection icons, expedition escort, wiki pages and texts (cs/en).

## Implementation decisions
Light armour is made by the Armorer for now; concept 71 (cloth) will move it to its own workshop and add it to the Royal Archer, Swordsman and Light Cavalry kits. Old saves of the three workshops have no recipe in their production record: the validator accepts that for these three and the import fills in the first recipe.

## Save/Load impact
No SAVE_VERSION change. New unit types and items are only additions.

## Testing
tests/new-units.test.js (training the four, ranges, recipe switch, older workshop save); military-units, stables (Light Cavalry and an older mounted Knight), contract, sandbox, assets and storage tests updated; npm test. In the browser the new ranks appear on the Test map with their stand-in figures.

## Notes for the next agent
When the owner sends the Light Cavalry art, render it like the other figures and drop its entry from `STAND_IN_LOOKS`. Concept 71 (cloth) moves `light_armor` to its own workshop.
