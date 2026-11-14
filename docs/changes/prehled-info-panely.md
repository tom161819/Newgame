# Kingdom overview: styled info panels, arrivals and Attractiveness explained

## What and why
Owner, 14 Nov 2026: show on hover of Residents how arrivals and departures work, on Attractiveness what moves it; the info panels should look like the game, not a white box with text.

## Files and systems
- `src/ui/KingdomOverview.js`: `overviewExplain` (lines `residents`, new `attractiveness`), `kingdomOverview().detail` (`perDay`, `striking`, `leaving`, `atRisk`, `base`), new `GameTip` and `tipParts`.
- `src/style.css`: `.game-tip*`.
- `src/i18n/cs.js`, `en.js`: `explain.arrivals`, `explain.departures`, `explain.departuresNow`, `explain.attractiveness*`.

## Implementation decisions
- Rows and top-bar chips carry the text in `data-tip` instead of `title`, so the browser shows nothing of its own.
- One `.game-tip` element under `body`; shown on pointer over or focus, placed above the row (below when there is no room), kept inside the window. It re-reads the text on every overview refresh, so moving numbers no longer hide it.
- First line is the heading; lines ending with a signed number are factor lines; a line starting with "Tip:" is set apart.
- Only the Kingdom overview uses `GameTip` now. Other native `title` texts in the game are unchanged.

## Save/Load impact
None.

## Testing
- `tests/kingdom-overview.test.js` (new case for `tipParts`), full suite.
- Browser (headless Chrome, 30-resident save): panels for Residents, Attractiveness, Happiness and the top-bar chip checked on screenshots.

## Notes for the next agent
- `GameTip(doc,roots,options)` can serve other panels: give elements `data-tip` and pass their root.
