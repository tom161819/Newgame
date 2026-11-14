# Point 37: remembered Stone Walls are dimmed like Towers

## What and why
Owner's screenshot (14 Nov 2026): Towers and a Gate outside the sight range are dark, the walls between them fully lit. The Towers were right; the walls were wrong.

## Files and systems
- src/game/MapMemoryRenderer.js: `parts` also walks a view's `art` and `shadows` groups; `muteLater`; exported `memoryParts`.
- src/game/FortificationView.js: `afterPaint` hook at the end of `paintArt`.

## Implementation decisions
The Fog of War memory copy of a building is dimmed by walking its parts. FortificationView keeps the wall kit images in plain objects (`art`, `shadows`), which the walk skipped. Wall art that loads or is repainted later is muted through `afterPaint`.

## Save/Load impact
None.

## Testing
tests/owner-14-nov.test.js (bod 37); browser screenshot of remembered walls, Towers and a Gate (/tmp/perfdiag/wall-shot4.mjs); full suite.

## Notes for the next agent
A new view that keeps images outside `list` and the names in `parts` needs the same care.
