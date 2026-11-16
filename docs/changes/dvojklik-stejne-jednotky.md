# Double click chooses the same units on screen (0.143.1)

## What and why
Owner 16 Nov 2026: "a double click on a soldier selects all the same units in the current view (what I see on the monitor)".

## Files and systems
`src/ui/UnitSelection.js`: on a plain click on a selectable resident, a second click on the same unit within `DOUBLE_CLICK_MS` (400 ms) selects every live, selectable, present resident of the same kind (`kindOf`: soldiers by military unit type, others by profession) whose view lies in `camera.worldView`; the unit detail opened by the first click is closed; a status line tells how many.

## Implementation decisions
"Same kind" for soldiers is the unit type (Soldier, Archer, Swordsman, Recruit), as RTS players expect; the view is the camera's world view, so zoom decides the area.

## Save/Load impact
None.

## Testing
Full suite; browser on the Test map: 10 Soldiers + 10 Archers, double click on an Archer → 10 Archers chosen, no Soldiers.

## Notes for the next agent
Ctrl+double click to add to a selection could follow.
