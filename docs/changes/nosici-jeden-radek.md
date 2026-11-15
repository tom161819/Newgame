# Haulers box on one line (0.138.8)

## What and why
Owner 15 Nov ("ten počet nosičů překrývá zaměstnance – ať je to jenom jeden řádek, info se objeví až po najetí myší"): the Haulers box in the Population panel took about 190 px and left room for one resident row.

## Files and systems
`src/ui/haulerBox.js` (the note, recommended button and Builders line in `.hauler-info`), `src/style.css` (one-line box, details as a panel above it on `:hover` / `:focus-within`).

## Implementation decisions
CSS only for showing: keyboard focus on the − / + buttons opens the details too, so the recommended-number button stays reachable.

## Save/Load impact
None.

## Testing
Full suite; browser: the box is one line (about 40 px), hovering shows the details above it over the list.

## Notes for the next agent
The soldiers block under it is still tall; the owner did not ask to change it.
