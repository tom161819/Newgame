# Castle Gate; the wall walk only via a Gate or Tower (#97, 7 Nov 2026)

## What and why
Owner request AUD69–70 (plan item `m-97-brana-hradu`): a working gate in the wall, and walls reached only from a tower or the gate. The plan item had no brief; the decisions below were made in the original chat and written to the plan item.

## Files and systems
- `src/data/objects/buildings.js`: `wall_gate` "Gate", 1 × 1, 4 Stone, 12 s, `walkable: true` (ground units pass), `navigation: { walkableTop: true, access: true }` (part of the wall walk, an access point), interactions like a wall, provisional sprite `public/assets/buildings/wall_gate/wall-gate-open.v1.png` (Studio concept "Gate, open", origin from its art JSON).
- `src/game/walls.js`: `isWallAccess(wall, buildings)` (a Gate, or a wall segment orthogonally next to a finished Tower), `wallAccessPoints`; `planRoofExit` only descends at access points.
- `src/game/PlayerController.js`: an Enter order on a plain wall routes the King to the nearest reachable access point of that wall network (`pendingWall`), and after climbing he walks along the top to the clicked segment; `climb()` re-routes if asked to climb a plain segment; a network without access gives "This wall has no Gate or Tower to climb up from."
- `src/game/GameScene.js`: `orientGates()` mirrors the Gate sprite when it stands in an east–west wall, on `buildings:changed` and when its view is created.
- i18n (status, object names). Tests: `tests/walls.test.js` (fixtures now include a Gate; new access test), registry counts; smoke `scripts/gate-smoke.mjs` (`--gate`, in `--full`).

## Implementation decisions
- "From the tower" is a wall segment touching a Tower (its stair): Towers and walls stay separate climbing states, so no Tower↔wall walking was added. The King climbs that segment from the ground next to the Tower.
- The Gate is always open (there are no enemies that would need it shut); the closed and portcullis concepts stay in the Studio for later.
- No save change: the Gate is an ordinary building; the access rule is computed from the buildings.

## Save/Load impact
None.

## Testing
`npm test` passes (834). `npm run smoke -- --current-only --gate`, `--walls`, `--right-click`, `--pave-under`, `--fog` pass.

## Notes for the next agent
- When the owner approves gate art in the Studio, replace the sprite; `orientGates` expects the opening on the right face in the unmirrored image.
- Soldiers do not use the wall walk; if they ever do, use `isWallAccess` for their way up and down too.
