# Unit command bar above the build bar (0.141.1)

## What and why
Owner 16 Nov 2026: clicking the King, his action window was hidden behind the bar with Buildings and Army (the build bar moved to the bottom of the screen).

## Files and systems
`src/ui/UnitSelection.js`: `placeAboveBar()` sets the command bar's `bottom` above the topmost of `.buildings-bar` and `.status-row` when they are in the lower half of the screen; run when the bar's content changes and at most every 0.7 s while it is shown (window size, the bar growing).

## Implementation decisions
Measured, not a fixed CSS offset: the build bar's height changes with the window width (it wraps) and can be placed elsewhere.

## Save/Load impact
None.

## Testing
tests/unit-command-bar-place.test.js; browser check at 1280 × 800 and 1000 × 640.

## Notes for the next agent
Other bottom windows (unit detail etc.) were not part of the report.
