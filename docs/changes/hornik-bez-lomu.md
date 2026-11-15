# Miner without a quarry (0.138.2)

## What and why
Owner 15 Nov ("v tutoriálu nejde vybrat horník, když nemám postavený kamenolom"): the job menu blocked the Miner while no quarry had a free seat, so the tutorial step could not be done before a quarry existed.

## Files and systems
- `src/data/jobs.js`: `miner.noSeatNeeded: true`.
- `src/ui/jobChange.js`: choices carry `anywhere`; `jobBlocked` never blocks such a job.

## Implementation decisions
Only the Miner gets the flag: he has work without a workplace (marked rocks, RockMiningWork). The Hunter also has `requiresWorkplace:false` but would only wait, so he stays blocked. The menu still shows the quarry seats.

## Save/Load impact
None.

## Testing
New test in tests/population-job-menu.test.js; full suite.

## Notes for the next agent
A Miner without a quarry and without marked rocks waits ("Waiting for workplace").
