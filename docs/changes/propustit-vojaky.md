# Dismiss soldiers, after a question (owner point 73)

## What and why
Owner, 19 Nov 2026: add a way to dismiss soldiers; the game asks whether I really want to dismiss them.
Before, a soldier could only be discharged from his unit type back to a recruit (Barracks window); he stayed a soldier.

## Files and systems
- `src/systems/MilitarySystem.js` — `dismiss(workers)`: for every living soldier on the map: off the wall, stops fighting, `release` (kit back to the store as on a discharge), stance and squad cleared, job Idle, back to normal work. Returns the count.
- New `src/ui/confirmAsk.js` — an in-game Yes / No dialog (no browser `confirm`, which would block the game's input). Styles `.confirm-ask` in `src/style.css`.
- `src/ui/UnitSelection.js` — a Dismiss button (🚪) in the soldiers' part of the selection bar; it asks with the count and then dismisses the chosen soldiers.
- `src/i18n/en.js`, `cs.js` — `command.dismiss*`.

## Implementation decisions
- Soldiers away with the party (or walking to it) are not dismissed.
- A dismissed man is an ordinary Idle resident, so the employment priorities may give him a job at once (in the browser check he became a Hauler).

## Save/Load impact
None.

## Testing
New `tests/dismiss-soldiers.test.js`. Browser: the button shows for a chosen Swordsman, the question shows the count, Yes makes him a resident.

## Notes for the next agent
Space is the "select the King" key now; point 84 (Space flattens buildings) has to take that into account.
