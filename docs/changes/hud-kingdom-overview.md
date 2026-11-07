# Top bar: kingdom overview and a clearer help button

## What and why
Plan item `m-horni-lista-prehled` (owner request 7 Nov with a screenshot):
- the empty left part of the top bar's second row should show the most important numbers, with more on hover;
- the "?" button should be easier to notice at the start.

## Files and systems
- `index.html`: `.hud-left-slot` holds `#kingdom-overview` (three chips plus the `#kingdom-overview-panel` tooltip)
  and the existing King cargo controls. `#help-arrow` sits under "?".
- `src/ui/KingdomOverview.js`:
  - `kingdomOverview(scene)`:
    - residents (`liveSubjects`) and `workerSystem.capacity()`;
    - the unemployed (profession `idle`);
    - average happiness, food, rest, housing and safety from `needs.status`; mood via `moodFor`;
    - attractiveness value and factors (food shortage −40 and the `attractiveness.modifiers`, e.g. happiness).
  - `KingdomOverview`: chips with tones (good / warn / bad); the panel on hover, focus or click; refreshed twice a
    second.
  - `HelpArrow`: shown until the help is opened once (`localStorage newgame.helpSeen`) or for the first 10 minutes of
    game time.
- `src/style.css`:
  - the slot keeps the #101 fixed width on desktop;
  - inside the slot, hidden cargo controls take no room;
  - the overview hides while a cargo control is visible (`:has`);
  - the arrow bobs and glows in a 1.8 s ease-in-out loop, without flashing; static with `prefers-reduced-motion`.
- `src/game/GameScene.js`: creates, updates and destroys both. Texts in both languages.
- Tests: `tests/kingdom-overview.test.js`. Smoke `scripts/kingdom-overview-smoke.mjs` (`--overview`).

## Implementation decisions
- **Why the gap was there:** the empty place was the King's cargo controls' reserved space (#101: they stay invisible
  so the bar does not reflow when he picks something up). The overview uses that slot while he carries nothing, so
  both goals hold: no empty gap and no jumping bar.
- **"Kept in the save or the settings":** the arrow's "seen" flag lives in the browser (like the other player
  settings), so it does not come back after loading a save.
- Values come from the existing systems; nothing new is computed or saved.

## Save/Load impact
None.

## Testing
- `npm test` (988 pass), new tests:
  - counts, averages, mood, attractiveness and the food factor;
  - the arrow shown at the start, gone after 10 minutes, gone for good once the help is opened.
- `npm run smoke -- --current-only --overview`:
  - at 1280, 1920 and 900 px wide: chips present, no overlap with the food status or the clock row, the hover panel
    lists all averages and the attractiveness;
  - the arrow until the help is opened, and not back in a new game;
  - screenshots `overview-*.png`.

## Notes for the next agent
- The smoke sets the viewport back to 1440×1000 at the end. Without that, the following default smokes in the same
  context (building strip wheel) time out.
- At 1280 px the first row of resources still wraps its last item (160 / 160); that is older than this change.
