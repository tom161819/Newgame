# The party meets at the Barracks before it leaves (owner point 81)

## What and why
Owner, 19 Nov 2026: when the party is sent to another map, everyone first meets at the Barracks and then they leave together.
Before, every member walked straight to the map edge from wherever he stood.

## Files and systems
- `src/systems/ScoutingSystem.js` — `gathering` (runtime: `barracksId`, `until`), `barracks()`, `nearBarracks()`, `gatherGoals()`; `send` starts the meeting; `updateSoldier` walks to the Barracks while it lasts; `update` waits until all members (and the King) stand within `gatherReach` tiles, then resets `party.since`, turns the King's order to the edge and reports it in the feed.
- `src/data/scouting.js` — `gatherHours:3`, `gatherReach:3`.
- `src/i18n/en.js`, `cs.js` — `scouting.gathering`, `scouting.together`.

## Implementation decisions
- The meeting has a limit (3 game hours) so one stuck soldier cannot hold the party for ever; the Barracks being gone also ends it.
- The walk-to-edge limit (`leaveHours`) counts from the meeting, so a long walk to the Barracks does not cut it short.
- The meeting is not saved: a loaded party that is leaving goes straight to the edge. This keeps the save format (SAVE_VERSION 66) unchanged.

## Save/Load impact
None (see above).

## Testing
`tests/scouting.test.js`: the fixture Barracks has tiles; new test for the meeting, the walk goals, the time limit and the load.

## Notes for the next agent
Point 82 (minimap squares and march time) builds on the same party.
