# Chosen units by kind; a group marches in lanes (0.143.3)

## What and why
Owner 16 Nov 2026: "in the bottom bar of chosen units show an icon of the kind and the number of soldiers of each kind" and, after 0.143.2, "now it is one long file with many soldiers inside each other – a compromise?".

## Files and systems
- `UnitSelection`: `.unit-kinds` chips (`KIND_ICONS`, `kindName`, `drawKinds`): one chip per kind (soldiers by unit type, others by job, the King) with icon and count; a click keeps that kind.
- `UnitCommands.move`: for 3+ units a leader route from the group's middle to the click; `laneRoute` follows it with waypoints every `LANE_STEP` 4 tiles shifted by the unit's slot offset × `LANE_SPREAD` 1.6 (clamped to `LANE_MAX` 5), snapped by `nearestOpen`, joined with short searches; the plain route when a piece is missing.
- CSS: `.unit-kinds`, Notices hidden on the Test map.

## Implementation decisions
Lanes keep the 0.143.2 soft passing (nobody waits) but give everyone his own line, so the group stays a block.

## Save/Load impact
None.

## Testing
tests/combat-review.test.js (lanes apart, fallback); browser, 30 soldiers 25 tiles: file 27 long × 15 wide (0.143.1, half waiting) → block about 12 × 10, nobody waiting, all in by 36 s; 12 soldiers block 5 × 8; chips 🛡️ 3 🏹 2 ⚔️ 2, a click keeps the Archers.

## Notes for the next agent
Some overlap remains where lanes meet obstacles.
