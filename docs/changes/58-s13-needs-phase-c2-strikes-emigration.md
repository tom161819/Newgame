# #58 phase C2 – strikes and emigration (S13 §8–9, 7 Nov 2026)

## What and why
The last behaviour part of stage 13 (plan item `m-58-potreby-zbytek`): long unhappiness now has consequences, so the kingdom policy (0.12.0), wages, food and homes matter.

## Files and systems
- `src/data/needs.js`: `DISCONTENT` (strike below 25 for 2 days, ends at 45; emigration below 15 for 3 days; retry 5 s for a blocked way out).
- `src/systems/NeedsSystem.js`: records gain `lowDays`, `criticalDays`, `strike`, `leaving`; `closeDay()` on `gameTime.onDayClosed` counts whole days and starts strikes/emigration (event feed); `step()` ends a strike at 45; `status()` exposes `strike`, `leaving`, `lowDays`, `criticalDays`; `summary()` counts strikers, leavers and residents at risk.
- `src/systems/Discontent.js` (WorkerSystem `discontent`, called by `WorkerAI` after daily rest): a striker finishes the task/cargo in hand, goes home and stays "On Strike"; an emigrant finishes what he carries, leaves his workplace (`detach`, profession idle), walks to a map edge ("Leaving Kingdom", retries without searching every frame) and departs: `isAlive=false`, HP 0, `onDeath` clean-up, `workState 'Left Kingdom'`, a feed notice. `recentDeaths()` excludes him.
- `WageSystem.dailyWage` is 0 during a strike (no double counting; earlier debts stay).
- `HumanView.setDiscontent` draws a small red "!" over strikers and leavers. `NeedsDisplay` lines for policy, strike, leaving and days of unhappiness.
- Save: `SAVE_VERSION` 41; needs records validated with the new keys; worker states `On Strike`, `Leaving Kingdom`, `Left Kingdom` (only for non-living workers).
- Tests `tests/discontent.test.js`.

## Implementation decisions
- Day counters only advance at the end of a day (whole days, as the brief says); the strike ends immediately when Happiness reaches 45.
- An emigrant stays in the worker list like the dead so wage records keep their worker id; he is never listed as a death.
- His home seat is freed when he is gone (homes are rebuilt from living residents).

## Save/Load impact
New schema 41 (minor 0.13.0). Mid-leave saves keep the leaving state (test).

## Testing
`npm test` passes (840). Smokes `--needs`, `--population`, `--employment`, `--ledger`, `--staffing` pass.

## Notes for the next agent
- Phase D left: economy integration beyond wages/taxes, a sortable residents list by Happiness (S13 §10) and an optimisation pass for 100 residents.
