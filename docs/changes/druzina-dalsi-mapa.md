# The party goes on to a neighbouring map (owner point 83)

## What and why
Owner, 19 Nov 2026: when the party is on another map, the only choice is to send it home; add sending it on to another neighbouring map.

## Files and systems
- `src/data/scouting.js` — `zoneNeighbours(id)`: the next zone each way round the home map (one side step in the 3 × 3 grid: North → North-west, North-east).
- `src/systems/ScoutingSystem.js` — `moveOn(zoneId)`: a party that is there goes `away` to the neighbour (same `travelDays`, `since` reset). On arrival the zone record keeps what was taken there before (it was overwritten).
- `src/game/zoneMode.js` — `homeAfterZone(scene,{next})`: leaving a zone map with a next zone sets the party `away` to it; the zone banner gets "Go on to another map" (opens the World window).
- `src/ui/GameApplication.js` — `leaveZone(next)`.
- `src/ui/WorldPanel.js` — under "Switch to the party / Send home" a row "Go on to:" with the neighbours (found icon or "?"). On the zone map it returns home with the party on the road.
- `src/i18n/en.js`, `cs.js` — `scouting.movedOn`, `scouting.moveOnTo`, `zone.moveOn`.

## Implementation decisions
- Only the two zones next to the current one, not across the home map, so the way stays short (half a day like the other trips).
- Going on from the zone map shows home while the party marches, as sending home does.

## Save/Load impact
None: the same party fields (`zone`, `phase`, `since`, `at`).

## Testing
`tests/scouting.test.js`: neighbours, `moveOn` (not to a non-neighbour), a second visit keeps `taken`, `homeAfterZone` with `next`. Browser: the World window shows "Go on to: North-east, North-west" for a party in the North and a click sends it on.

## Notes for the next agent
The minimap squares (point 82) show the march hours for the new zone too.
