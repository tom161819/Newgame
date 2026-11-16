# Group movement: no waiting behind the ones in front (0.143.2)

## What and why
Owner 16 Nov 2026: "tune moving many units at once so they all go together – now half of them get stuck waiting for the units in front".

## Files and systems
- `WorkerSystem.navigationMap`: for a resident on a move order (`MovingToHold`) or a soldier hunting, fighting or leaving with a scouting party, our residents who are walking (next tile or path) or holding a spot on an order do not block; others (standing, working), the King and animals still block. Everyone else keeps the old blocking.
- `UnitCommands.update`: up to 5 replans before a blocked unit gives up (was 3).

## Implementation decisions
Soft collision only between our own moving people keeps the work traffic and doorways (#163) as before; a brief overlap while passing is accepted.

## Save/Load impact
None.

## Testing
tests/combat-review.test.js (blocking rules); browser on the Test map, 30 soldiers sent 25 tiles: before 28 of 30 stood waiting at the start and the last arrived after 38 s; after none stopped on the way, all arrived by 28 s; 60 soldiers by 25 s.

## Notes for the next agent
Marching spread still comes from different routes; a shared route for the group would tighten it.
