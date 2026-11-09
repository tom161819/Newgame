# Building window: ban icons, the issue first, the dismantle note on hover

## What and why
Owner, 9 Nov 2026 (Grafika chat, annotated screenshot of the Lumberjack Hut window):
- The two employment bans become two icons at the top right, and their texts show only on hover.
- "Výstup je plný" (Output is full) goes to the top as the most important message, with a blinking orange "!".
- The dismantle explanation shows only on hovering the button. The refund text stays.

## Files and systems
- **src/ui/WorkplacePanel.js:**
  - The exclusion labels are icon toggles (⊘ this building, ⛔ the type), with an invisible checkbox over each icon. They are moved into `.dialog-heading` before Close.
  - The status and help paragraphs are hidden, and their text plus the label goes into each toggle's `title`. A ban that is on gets the `.on` class.
  - `#workplace-issue` is moved right after the heading (after the building picture). The UI Lab layout's remembered order (`__uiOriginalOrder`) is updated too, because `applyUiConfig` restores that order through its MutationObserver.
- **src/ui/DemolitionUI.js:** before dismantling starts, the note is hidden and becomes the Dismantle button's `title`. A reason, or progress while dismantling, still shows as text.
- **src/style.css:** icon toggles, the issue box and the `issue-blink` animation (static when the user prefers reduced motion).

## Implementation decisions
- **Keep the checkboxes.** Smokes and the state logic keep working; only the look changes.
- **Update the UI Lab's remembered order.** Without it, the issue line would jump back to its old place.

## Save/Load impact
None.

## Testing
- npm test.
- Browser screenshot of a Lumberjack Hut window with an output-full issue: the icons are at the top right with hover titles, the orange issue box is under the title, and the dismantle note is gone with the refund line kept.

## Notes for the next agent
- Any section moved by code in a window that the UI Lab can lay out must also update `__uiOriginalOrder`, or `applyUiConfig` puts it back.
