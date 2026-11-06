# #58 S13 phase D, part 1 – need tooltips and a 100-resident check

## What and why
The S13 spec ([#58](https://github.com/tom161819/Newgame/issues/58), section 12) asks for graphic indicators with tooltips that explain why a resident is dissatisfied. It also asks that the game stay stable with 100 active residents (acceptance criteria). Workplace and wages were already shown in the villager panel. This change adds the explanations and a performance guard. No save change; PATCH release 0.7.2.

## Files and systems
- `src/systems/NeedsSystem.js`: `safetyDetail(worker,record)` returns `{value,factors}`, where factors are `[['base',45],['castle',25],…,['attack',-n]]`. `safety()` uses it, and `status()` now also returns `safetyFactors`.
- `src/ui/NeedsDisplay.js`: `needTooltip(id,status)` sets the `title` of each need row (food, rest, housing, safety, happiness).
- i18n `needs.tip.*` and `needs.safety.*` in EN and CS.
- `tests/needs.test.js`: 2 new tests, for the tooltip contents with factors adding up to Safety, and for 100 residents (one needs update must stay under 50 ms; it measures about 1.2 ms locally).
- `scripts/needs-smoke.mjs`: checks the Safety and Food tooltips in the real panel.

## Implementation decisions
- Safety is computed once from its factors, so the value and the explanation can never disagree. The attack factor is rounded per factor, a difference of at most 1 point against the previous unrounded sum.
- Tooltips use `title`, like the rest of the HUD. No new hover component.

## Save/Load impact
None. SAVE_VERSION stays 35.

## Testing
- `npm test` passes, including the 2 new tests.
- Smoke `--needs` passes with the tooltip checks. `build:pages`, `changelog:validate` and `version:check` pass.

## Notes for the next agent
- Remaining #58 work:
  - phase B: stored homes and walking home to rest;
  - phase C part 2: strikes and emigration, which need a new SAVE_VERSION and a MINOR release; coordinate the number with Codex #194 and #196;
  - the rest of phase D, once B and C exist: economy integration, Save/Load of AI states and the strike status in the panel.
