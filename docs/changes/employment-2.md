# Employment 2: one-click job pick, dismissal while working, staffing signs (m-zamestnani-2)

## What and why
Owner requests 7 Nov 2026 (points 19, 35, 50, 58).

## Files and systems
- `src/ui/UnitPanel.js` (19): the resident panel refreshed its job list all the time (option texts and value were
  rewritten), which closed or reset an open list, so the first pick was lost. Texts change only when they differ and
  the value is left alone while the list has focus; after a pick the list shows the real profession.
- `src/ui/WorkplacePanel.js` (35): while someone works the rows redraw (status text), replacing the "Remove worker"
  button between press and release. Redraws pause while a button in the panel is held down.
- `src/systems/EmploymentSystem.js` (35): switching employment off (this building or the whole type) dismisses the
  current workers at once, also in the middle of a task (`dismiss`); before, they stayed. Cargo is dropped as on any
  dismissal, a production cycle stays with the building.
- `src/systems/StaffingStatus.js`, `src/ui/MissingWorkersIndicators.js`, `src/style.css` (50, 58; changes 0.30.0):
  nobody = yellow warning (pulses), some missing = quiet grey, employment off = dark red crossed stop sign with its
  own tooltip ("Employment disabled"); the sign follows employment changes.
- i18n: `staffing.disabled`, `staffing.disabledHint`, updated `employment.exclude.help`.

## Implementation decisions
- The dismissed workers are not held: automatic employment may place them elsewhere (as Remove worker would if the
  owner did not hold them).

## Save/Load impact
None.

## Testing
`tests/employment-2.test.js`, `tests/auto-employment.test.js` (dismissal while working); browser smoke
`--employment-2` (pick sticks during refresh, Remove worker during redraws, sign colours) and `--employment-exclusions`.

## Notes for the next agent
- Other panels that redraw while busy can use the same "pause while pressed" guard.
