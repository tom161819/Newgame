# Training without a combat level

## What and why
Owner 19 Nov 2026, Barracks window: "proč nejde vycvičit rytíř i když mám brance a mám meč a brnění ve zbrojnici?" – the Knight needed Combat level 4 and a new recruit has 1; combat experience comes only from damage dealt (fights, hunting), so in a quiet village recruits never got there, and the greyed-out button did not say why. Then: "ty požadavky na vycvičení teď zruš".

## Files and systems
- `src/data/military.js`: `requiredCombatLevel` removed from every unit type.
- `src/systems/MilitarySystem.js` `blocker`: no `'skill'` reason any more.
- `src/ui/militaryPanel.js`: the card shows gold and time only (no "Combat N+"); i18n `military.cost` (en, cs).
- `src/systems/Wiki.js`: no "Combat level needed" fact; Wiki texts of the soldier, Swordsman, Knight, Halberdier, Royal Archer, Crossbowman, Light Cavalry and experience updated (en, cs).
- Test: `tests/military-units.test.js` now expects a level-1 recruit to train into a Swordsman and a Knight.

## Implementation decisions
- The combat skill still grows and still makes a soldier better (speed bonus of the skill, wage); it only no longer gates training.
- The i18n key `wiki.fact.combatLevel` stays unused for now (harmless).

## Save/Load impact
None. SAVE_VERSION stays 66.

## Testing
Full suite.

## Notes for the next agent
- If a gate comes back, show the reason on the greyed-out button (the owner could not see why it was off).
