# Statistics switched on (0.138.4)

## What and why
Owner 15 Nov sent his GoatCounter site (hra1616). `TELEMETRY.goatcounter` is set, so the GitHub Pages build sends the anonymous statistics from 0.138.3.

## Files and systems
`src/data/telemetry.js`.

## Implementation decisions
The game sends its own pixel requests (`/count?p=…`); the owner's count.js snippet is not needed.

## Save/Load impact
None.

## Testing
tests/telemetry.test.js; full suite.

## Notes for the next agent
Paths in GoatCounter: `/play/<version>` (visits, unique players), `/game/new|load`, `/day/<n>`, `/time/<n>min`.
