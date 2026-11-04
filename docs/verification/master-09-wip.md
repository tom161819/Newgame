# Stage09 — recovered WIP foundation

This checkpoint preserves the originally unpushed edits from the exact stage08
source `c106cc4f4b0d1afb73a444500d0d1adabc92fb05`. It is deliberately incomplete.
Branch: `codex/stage-09-ledger-wip`. Do not merge it into the ALPHA branch.

Implemented as a foundation only:

- `src/data/resourceLedger.js`: empty journal state and per-resource/source aggregation.
- `src/systems/ResourceTransactionLedger.js`: unique receipts, current/completed days,
  last30 days, duplicate protection, standalone state export/import and selected
  existing activity listeners. This class is not instantiated by the game yet.
- `src/systems/GameTimeSystem.js`: a day-closed callback after all daily financial
  callbacks, so income/payroll registered later cannot fall into the wrong day.
- `src/game/inventory.js`: optional transaction details and an optional ledger;
  existing callers with no attached ledger retain their original behavior.
- `tests/resource-ledger.test.js`: day closure, simulated multi-day updates,
  receipts/roundtrip/history, transfers producing no journal entries, partial
  starts and safe category aggregation.

Recovery validation:399/399 automated tests passed,0 failures/skips, and the
production build passed. Logs: `/workspace/scratch/Newgame-master09-wip-tests.log`
and `Newgame-master09-wip-build.log`. Earlier pre-limit attempts did not execute;
these results are from the subsequent successful recovery run. No stage09 full
browser, Pages build or final archive gate has been claimed for this WIP.

Still missing: integration with the live scene and all authoritative economic
sources/sinks; correct construction losses and reversible production inputs;
Save13 serialization/strict validation; current-schema restoration; Resource Bar
daily changes and accessible bounded/scrollable tooltips; full economic and
browser regression tests, final English Unreleased entry and reviewable PR.

Follow the developer's newer collaboration instructions. Base the actual stage09
task on current main when PRs1/3 are merged, otherwise on the explicitly permitted
`origin/claude/alpha-save-policy`. Manually port useful code and test it; do not
blindly merge this WIP. No older-save migrations: increase SAVE_VERSION to13 when
the journal is added to persistent game state. Keep current-schema validation and
immutable archives. Do not change Claude's held renderer, Studio or save-menu files.

No coordination register exists at this checkpoint's base; none was invented.
The five source/test files above are held by this WIP. Complete task delivery is
via a `codex/*` branch and PR to main; only the developer merges and publishes.
