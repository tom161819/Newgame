# Owner's points 38, 40, 43, 46, 49, 50, 52 (batch A)

## What and why
Owner's list of 14 Nov 2026 (points 38–52). This batch: greyed professions without a free seat (38), Haulers box in the Population panel (40), Shift keeps the building (43), numbers behind professions (46), click on Gate and Tower (49), saving fails on animals (50), the King selected like other units with a health bar (52).

## Files and systems
- `src/systems/GameStateSerializer.js`: `retaliationId` saved only for a unit still in the game; the check accepts animals too.
- `src/ui/jobChange.js`: `jobStats`, `jobStatLabel`, `jobBlocked`; `jobChoices` rows carry `stat`.
- `src/ui/PopulationSidebar.js`, `src/ui/UnitPanel.js`: labels with numbers, blocked choices disabled; `src/ui/haulerBox.js` (moved from `EmploymentPanel.js`), box `#population-haulers`.
- `src/game/GameScene.js`: `handleClick` (left click: windows only), new `kingOrder(pointer)`; Shift in the placement branch.
- `src/ui/UnitSelection.js`: `king` flag, `onKing`, right click calls `kingOrder`; `src/ui/CombatFeedback.js`: the King's bar.

## Implementation decisions
- 50: the loader already resolved animals; only the check refused them. A target that is gone is written as null.
- 38: "blocked" = the profession has workplace buildings and no free seat in a finished, open one. The current profession stays selectable.
- 46: capacity is the sum of finished workplaces; Hauler shows the wanted number, Builder the workshop places; no capacity → only the count.
- 52: left click never orders the King. Right click with the King selected runs the old order logic (move, collect, hunt, mount, enter, chest, drop, build a site). Trees and deposits still open their window. Workers selected with him move too.
- 49: buildings have no hit points in the game, so the detail shows the description and demolition only. Hit points for buildings are a new mechanic (plan item).

## Save/Load impact
None; SAVE_VERSION stays 62. Saves that could not be written now can.

## Testing
- `tests/save-animal-retaliation.test.js` (new); full suite.
- Browser (headless Chrome): left click on ground does not move the King; a click selects him, opens his window and shows the bar; right click orders him.
- Not checked in a browser: the Haulers box in the Population panel, greyed professions, Shift placement, drag selection of the King.

## Notes for the next agent
- Smoke scripts that moved the King by a left click must select him first (`scene.unitSelection.set([scene.character])`) and right-click, or call `scene.character.command(...)`.
- The tutorial texts do not mention the new way of moving the King yet.
