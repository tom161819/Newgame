# K selects the King

## What and why
Owner, 15 Nov 2026: a key to select the King (since 0.126.0 he is ordered with the right button after being selected).

## Files and systems
- `src/game/WorldCamera.js`: `selectKing` on `keydown-K` (beside Space = centre on the King).
- i18n: `status.kingSelected`, hint `hud.followKing`.

## Implementation decisions
- Ignored while a text field, list or select has the focus.
- The view does not move; Space still centres on him.

## Save/Load impact
None.

## Testing
- Full suite. Not pressed in a browser.

## Notes for the next agent
- None.
