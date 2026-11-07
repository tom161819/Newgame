# Browser smoke: --keep-going and fixtures for the E1 prices (0.49.0)

## What and why
The full browser smoke stopped at the first failure, so every fix needed another 20–25 minute run. With
`--keep-going` a failing scenario is reported (`FAIL --<flag> (s): message`) and the run goes on; the end prints
`FAILED n: --flags` (exit code 1) or `ALL SMOKES PASSED`. Scenarios on the shared main page may then start from an
unusual state, so a failed one is re-run alone with its own flag.

## Files and systems
- `scripts/browser-smoke.mjs`: `step(name,run)` wraps every flagged scenario.
- `scripts/building-menu-smoke.mjs`: `placeBlueprint` adds only the missing materials of the building's price first,
  so scenarios keep testing their own feature after price changes.
- Fixtures updated for the E1 prices and start (wooden basic buildings, Stone Tower 20 Stone, threats after the start,
  food notice, hidden resources): builder workshop, wolves, thieves, smelting, notices, demolition, repeat placement,
  zoom, building unlocks, ledger, employment (pitch maker in the Food preset), paths V2 (paused while measuring), fog
  (measured in daylight; subject sight halves at night), event feed (Royal tasks card on top of the corner column).

## Implementation decisions
- Fixtures were adapted to the new prices instead of keeping old prices for tests, so the smoke plays the real game.

## Usage
`npm run smoke -- --current-only --full --keep-going`; for one task only its own flags.

## Save/Load impact
None.

## Testing
Every scenario passed, the main-page ones also alone with their own flag.

## Notes for the next agent
- Run `--keep-going` for a whole batch, then only the failed flags alone; chained main-page failures often cascade.
- Timing checks (paths V2 repaint) are sensitive to a busy machine; do not run unit tests in parallel with the smoke.
