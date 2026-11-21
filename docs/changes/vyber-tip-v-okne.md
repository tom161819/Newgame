# Unit selection hover texts stay in the window

## What and why
Owner 21 Nov 2026: hovering a unit box in the soldiers' selection bar showed its description partly outside the
screen (a CSS bubble centred over the button).

## Files and systems
- `src/ui/UnitSelection.js`: the bar gets a `GameTip` (the game's hover panel, which is clamped to the window).
- `src/ui/KingdomOverview.js`: `GameTip` also reads `data-tip-title` (heading) next to `data-tip`.
- `src/style.css`: the old `.unit-icon-command::after` bubble is switched off.

## Implementation decisions
- The same panel as the Kingdom overview hover texts, so they look alike.

## Save/Load impact
None.

## Testing
- `npm test`; browser 420 × 860: the leftmost unit box's text stays inside the window.

## Notes for the next agent
- The one-line `data-tooltip` bubbles of the command icons are still CSS; move them to `GameTip` if they clip too.
