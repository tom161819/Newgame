# Tripo Tower, Gate and walls in the game

## What and why
Owner 20 Nov 2026: "hradby brána a věž jsou schválený". The Studio approvals (26 variants, 20:55 UTC) are taken into
`art/approvals.json` and the pictures replace the old Tower, Gate and wall kit.

## Files and systems
- `art/approvals.json`: `watchtower-tripo` (preferred), `gate-tripo` (preferred) and `gate-tripo-axis-x`, the five
  `wall-kit-*-tripo` and eighteen `wall-diagonal-*-tripo` records from the Studio database.
- Tower (`buildings.js`): the approved export byte for byte, front layer `watchtower-tripo.v1.front.png` (also written
  to `art/sprites/watchtower`), origin 0.36932/0.99177, platform −195.3, torch −12/−84 (recorded in the export's
  metadata); the door-right (180°) and no-door (270°) renders on the same canvas and feet point.
- Gate: `public/assets/buildings/gate/gate-tripo.v1.png` (walls north–south) and `.axis-x.png` (walls east–west) on one
  150 × 157 canvas, origin 0.44/0.98726; `GameScene.flipGateView` picks the picture by axis instead of mirroring
  (preview included).
- Walls: `APPROVED_WALL_ART` and `DIAGONAL_WALL_ART` point at the `*-tripo` exports; the four elbows rejected in v5
  (NW-00, NW-01, NW-10, SE-00) are approved in the Tripo stone, so all sixteen elbows have art now.
- Old Tower, wall kit and diagonal PNGs removed from `public/`.
- Tests: wall kit / tower / damage paths, eighteen diagonal pieces, asset count 183 (+1 Gate picture).

## Implementation decisions
- The Studio database decisions were copied as recorded (owner's user id, approved); the review documents stay in the
  database until the next "spustit revizi".

## Save/Load impact
None.

## Testing
- `npm test`.
- Browser (test map): towers, both gate axes, straight and diagonal walls.

## Notes for the next agent
- `FortificationView` still keeps the "elbow without approved art" fallback; with all elbows present it is unused.
