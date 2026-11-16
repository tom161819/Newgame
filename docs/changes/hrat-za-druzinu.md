# Playing a zone with the scouting party (0.142.0)

## What and why
Owner 16 Nov 2026: "when the party arrives in the new land, let me play there for them" (m-mapa-kraje, steps 2–3 of concept v1).

## Files and systems
- `src/game/zoneMode.js` (new): `ZONE_LOOK` (levels and deposit factors per zone type), `zoneWorldCode` (from the home code and the zone), `zoneStart(home)`, `setupZone(scene)` (party soldiers with their ids, names, health, experience, equipment, at the edge facing home; the King hidden in a corner and out of fights; home guides hidden; banner with "Send the party home"), `updateZone` (whole party fallen → home), `homeAfterZone` (health and experience back, party returning, fallen ids), `buryFallen` (they die at home through `onUnitDeath`).
- `GameApplication`: `enterZone()` (home = `snapshot()`, start a zone game), `leaveZone()` (validated home after the zone), `snapshot()` in a zone returns home; `start(state,settings,zone)`.
- `GameScene`: `init({zone})`; zone games skip the Castle, stockpile, starting goods, residents, garrison, start quarry/iron mine and the King's start place; time from home; `canFight` excludes the King in a zone.
- `MineralSystem.generate`: deposit counts × the zone factor. `NeedsSystem.closeDay`: no strikes or emigration in a zone.
- `ScoutingSystem`: a new phase `there` (waits until sent home), `sendHome()`. `WorldPanel`: Switch to the party / Send home.
- CSS: `.zone-banner`, `body.in-zone` hides the build tab, royal tasks, notices and the kingdom box.

## Implementation decisions
The map size is global and every system is built for one map, so the two maps take turns: home is held as a validated save state while the zone runs. Home time stands still meanwhile (owner told). Zone maps are 100 × 100, the smallest size the game supports (not 40 × 40).

## Save/Load impact
SAVE_VERSION unchanged. The optional `scouting.party.phase` may be `there`. A save made in a zone is the home state with the party in the zone.

## Testing
tests/scouting.test.js (phase there, sendHome, zone code, zoneStart, homeAfterZone); browser: send, switch, play, kill a soldier, send home – home loads, party returning with 3 of 4, no errors.

## Notes for the next agent
Step 4: keep changes in the zone, mining and carrying goods home, enemies, more place types (caves, ruins, bandit camps, castles); maybe let home run in the background.
