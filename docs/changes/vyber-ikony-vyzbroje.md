# Weapon and armour icons on the unit boxes of the selection panel

## What and why
Owner 18 Nov 2026: "udělej ještě nad danou třídou nad podobiznou vojáka u horního okraje čtverečku ikonu zbraně kterou používá a brnění". Each kind box (picture and count) now shows along its top edge the weapon and then the armour of that kind.

## Files and systems
- `src/ui/gearIcons.js` (new): `GEAR_ICONS` – small line SVG icons for Sword, Halberd, Bow, Crossbow, Armor and Light Armor; `gearOf(equipment)` – weapon first, then armour.
- `src/ui/UnitSelection.js`: `kindGear(kind,workers)` from the unit's real equipment (`military.unit(w).equipment`); the icons go into `.unit-kind-gear`; the tooltip title adds the item names.
- `src/style.css`: `.unit-kind-gear` (top of the box, dark badges; weapons gold, armour grey).
- Test: `tests/unit-command-bar-place.test.js`.

## Implementation decisions
- The item pictures in the game share images (Halberd uses the Sword picture, Crossbow the Bow, Light Armor the Armor), so they could not tell the kinds apart. Code-drawn icons are used instead. They are provisional UI icons, not approved art; drawn icons can replace the SVG strings in `GEAR_ICONS`.
- What a unit really carries is shown: an older unit trained before Light Armor joined its kit shows only its weapon. Recruits, Catapult crews, Wagons, the King and workers show nothing.

## Save/Load impact
None.

## Testing
- `node --test tests/unit-command-bar-place.test.js` and the full suite.
- Browser: one of each unit selected – Soldier sword; Swordsman, Knight sword + armour; Halberdier halberd + armour; Archer bow; Royal Archer bow + light armour; Crossbowman crossbow + light armour; Light Cavalry sword + light armour; Catapult none. Tooltip "Halberdier: 1 · Halberd · Armor".

## Notes for the next agent
- The horse of the Light Cavalry is not shown (the owner asked for weapon and armour).
