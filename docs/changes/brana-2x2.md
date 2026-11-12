# Gate 2 × 2

## What and why
Owner, 12 Nov 2026 (plan 27): the Gate should be 2 × 2 and join the walls better. If the save level would have to change,
old gates could be removed from saves.

## Files and systems
- `src/data/objects/buildings.js`: new building `gate` (2 × 2, walkable, replaces wall segments, 12 Stone, 20 s,
  repeat placement); the 1 × 1 `wall_gate` stays for older saves with `buildable:false`. Texts `object.gate.*`; the old
  one is named "Gate (old 1 × 1)".
- `src/game/walls.js`: `isWallAccess` counts a finished Gate like a Tower (walls touching it are where the King climbs);
  `gateAxis` for a 2 × 2 Gate looks at walls along its four sides; `gateAxisLocked` uses it.
- `src/game/GameScene.js`, `src/game/WorldCamera.js`: R / Shift+wheel, preview flip, saved axis and orientation for `gate`.
- `src/systems/GameStateSerializer.js`: `gateAxis` saved for `gate`; the old `wall_gate` passes the check although no
  longer buildable. Clearing and fire lists include `gate`.

## Implementation decisions
- A new building type instead of resizing the old one: older saves keep their 1 × 1 Gates working unchanged, nothing
  is removed and SAVE_VERSION stays 62 (the owner's fallback of removing old gates was not needed).
- The new Gate is not itself part of the wall walk (like a Tower): the King climbs from the walls beside it.
- Provisional art: the 1 × 1 gate picture scaled to the footprint until Grafika draws a 2 × 2 gate.

## Save/Load impact
None for older saves; new optional use of `gateAxis` on `gate`.

## Testing
- `npm test` (walls-2 rewritten for the 2 × 2 Gate, access beside a finished Gate, the old Gate unbuildable).
- Smoke `--gate`: the menu places a 2 × 2 Gate; the old 1 × 1 Gate fixture still lets the King climb and come down.

## Notes for the next agent
- Grafika: a proper 2 × 2 gate (open / closed, both axes); wall ends that meet its sides.
