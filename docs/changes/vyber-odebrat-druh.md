# Right click on a unit box removes that kind from the selection

## What and why
Owner 18 Nov 2026: "udělej ať když kliknu na vybraný vojáky v panelu pravým tak se daná třída odoznačí z výběru". The selection panel shows a box per kind of unit (picture and count). A left click kept only that kind; now a right click takes that kind out of the selection.

## Files and systems
- `src/ui/UnitSelection.js`: `contextmenu` listener on each kind box (no browser menu, no move order), `dropKind(kind)` (the King too); with nothing left the selection is cleared.
- i18n `command.kindTip` (en, cs) mentions the right click.
- Test: `tests/unit-command-bar-place.test.js`.

## Implementation decisions
- The event is stopped at the box, so the right click never reaches the map as a move order.
- Taking out the last kind clears the selection (the panel closes as with the ✕ button).

## Save/Load impact
None.

## Testing
- `node --test tests/unit-command-bar-place.test.js` and the full suite.
- Browser: 3 archers and 2 knights selected, right click on the archer box → 2 knights stay selected, nobody got a move order.

## Notes for the next agent
- The kind boxes are rebuilt on draw; scripted clicks should use coordinates, not a held element handle.
