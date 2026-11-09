# Building windows: explanations behind an "i" icon

## What and why
Owner, 9 Nov 2026 (Grafika chat): use the same style as the Lumberjack Hut window in every building window, so there is not much text and the info shows on hover.

## Files and systems
- **src/ui/compactHints.js** (new):
  - In the open windows of HINT_WINDOWS, the explanatory paragraphs whose text is one of HINT_KEYS get `.ui-hint`, which hides them.
  - Their texts are joined into the title of an "i" icon in the window heading, placed before Close.
  - The check runs every 400 ms while a window is open, because panels re-render their texts.
- **src/main.js:** calls `initCompactHints()`.
- **src/style.css:** styles for `.ui-hint` and `.ui-hint-icon`.

## Implementation decisions
- **Match the texts by i18n key.** No panel code changes, and data, statuses and warnings stay visible.

## Save/Load impact
None.

## Testing
- npm test.

## Notes for the next agent
- To move a new explanatory text behind the icon, add its i18n key to HINT_KEYS.
