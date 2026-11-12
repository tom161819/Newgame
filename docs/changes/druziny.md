# Army squads (družiny)

## What and why
Owner, 12 Nov 2026 (with a screenshot): when several soldiers are chosen in the Army panel, an icon at the right of
the rows makes a squad; squads show in the strip under the orders, each can be dissolved; a click on a squad chooses
all its soldiers.

## Files and systems
- `src/ui/armySquads.js` (new): `squads`, `makeSquad` (two or more soldiers, next free number, soldiers leave their
  old squad, a squad left with one soldier ends), `dissolveSquad`, `squadMembers`, `SQUAD_MAX` 99.
- `src/ui/ArmyPanel.js`: squad bar `#army-squads` (chips: click = choose, Shift = add, × = dissolve), ⚑ in the fifth
  grid column of chosen rows when two or more are chosen, the squad named in each row; `pick` / `pickSquad` share
  `focus` (map selection and camera).
- Save: optional `workers[].squad` (integer 1–99, soldiers only) in `GameStateSerializer` / `GameStateLoader`.
- Texts `army.squad.*`; styles in `src/style.css`; test in `tests/military-units.test.js`.

## Implementation decisions
- A squad is a number on its soldiers, not a separate list: it cannot point at a dead or departed soldier, and a
  soldier who leaves the army drops his number. SAVE_VERSION stays 62 (optional field).
- Squads have numbers, not names (renaming can come later).

## Save/Load impact
Optional field `workers[].squad`; older saves load unchanged.

## Testing
- `npm test`: 1265 pass. Browser: `--recruits` passes; squads made, chosen and dissolved by script in headless Chrome
  with screenshots.

## Notes for the next agent
- No browser smoke covers squads yet (checked by script only).
- A squad has no order of its own: Patrol / Guard and the right-click post apply to the chosen soldiers, so choose the
  squad first.
