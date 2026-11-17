# 66: the Barracks' automatic hiring slider blinked (0.143.12)

## What and why
Owner 17 Nov 2026 (66): "at the Barracks the automatic number of recruits blinks or does not show at all". The slider (point 58) and the building's issue line (WorkplacePanel) both put themselves right after the window heading (or its picture). Every render one moved past the other, so the slider jumped between the top and further down – in the browser 62 moves in 15 s while six people were being hired.

## Files and systems
`militaryPanel.renderMilitary`: the slider goes right after the issue line (`#workplace-issue`, which WorkplacePanel keeps first), or after the heading/picture when there is none, and takes that place in the UI Lab's remembered order too.

## Implementation decisions
No change to the issue line itself, so other workplaces keep their layout.

## Save/Load impact
None.

## Testing
npm test; browser: Test map, a Barracks with six idle people – the slider's place sampled 150× over 15 s: before 62 moves, after none.

## Notes for the next agent
Two elements must never both be placed "after the heading"; give each its own anchor.
