# Population list: quick job choice

## What and why
Owner request (7. 11. 2026, with a screenshot of the expanded Population panel): a button with a job menu between the
resident's name and Locate, so work can be handed out without opening each resident.

## Files and systems
- `src/ui/jobChange.js` (new): `changeProfession` (the former UnitPanel change handler: hold for Unemployed, release
  otherwise, `jobs.assign`, `workplaceSystem.assignFree`), `freeSeats` (free seats per profession in finished, open
  workplaces), `jobChoices` (JOBS order without Unemployed; `free` null for professions without buildings).
- `src/ui/UnitPanel.js` uses `changeProfession`.
- `src/ui/PopulationSidebar.js`: `.population-job` button per row (⚒+ highlighted for the unemployed, ⇄ otherwise),
  one shared `#population-job-menu` appended to body; `openJobMenu`, `positionJobMenu`, `jobMenuKey` (arrows, Esc),
  `chooseJob`, `closeJobMenu`. Outside pointerdown (capture), viewport scroll and closing the panel close the menu.
- `src/style.css`, i18n en/cs (`population.assignJob`, `changeJob`, `jobMenu`, `jobFree`, `jobFull`, `unemploy`).

## Implementation decisions
- While the menu is open `refresh()` returns early, so sorting cannot move the row under the pointer; closing the
  menu forces one refresh, which applies the change and any new order.
- Professions with no seat are offered (owner: selectable, the resident stays without a building – "No free workplace").
- Menu item colour stripe uses the profession's portrait colour instead of a separate icon set.

## Save/Load impact
None.

## Testing
- `tests/population-job-menu.test.js`: choices, free seats, full professions, seatless professions, assign, full →
  no workplace, Unemploy frees the seat.
- Browser smoke `--job-menu`: assign to an unemployed resident, current job ticked and disabled, Unemploy, Escape closes
  only the menu, outside click closes it. Screenshot `population-job-menu.png` with `SMOKE_SHOTS`.

## Notes for the next agent
- Seat counts ignore auto-employment priorities; they are plain capacity minus staff.
