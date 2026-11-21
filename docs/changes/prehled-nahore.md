# Kingdom overview panel in the top bar

## What and why
Owner 21 Nov 2026: move the Kingdom overview panel from the bottom-left corner of the map up into the top bar, in
place of the summary chips that were there ("👥 30 / 42 · Unemployed 3 · ☺ 89 %").

## Files and systems
- `index.html`: `#kingdom-bar` (class `kingdom-bar-hud`) now sits in `.hud-left-slot` instead of `#kingdom-overview`.
- `src/ui/KingdomOverview.js`: the chips are optional (`this.chips`); without them the bar is the root and its
  toggle opens and folds the list. `place()` no longer moves a top-bar panel; it puts the dropped-down list just
  under the whole top bar (on narrow screens the bar has more rows). The strip summary also shows the unemployed
  when there are any.
- `src/style.css`: `.kingdom-bar-hud` – inline in the row, the list drops down under the bar; the left slot grows
  to fit the title and summary.
- `scripts/kingdom-overview-smoke.mjs`, `scripts/kingdom-bar-smoke.mjs`: selectors (the bar-placement smoke still
  expects the old corner layout and needs updating before it is run again).

## Implementation decisions
- The folded/open state stays the same remembered setting as before.

## Save/Load impact
None.

## Testing
- `npm test`; browser at 1280 × 800 and 480 × 900: title and summary in the top bar, the list opens under the bar
  and folds again.

## Notes for the next agent
- `scripts/kingdom-bar-smoke.mjs` checks the bottom-left placement; rewrite it for the top bar.
