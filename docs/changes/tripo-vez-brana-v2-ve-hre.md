# Tripo Tower and Gate v2 in the game

## What and why
Owner 21 Nov 2026: "je to svchálený ve studio" – the v2 renders of 0.149.20 (foot fills the 2 × 2 tiles) approved in
the Studio (reviews `watchtower__watchtower-tripo`, `gate__gate-tripo`, `gate__gate-tripo-axis-x`, version 2).

## Files and systems
- `art/approvals.json` via `npm run studio:sync` (the three variants approved at version 2; the file is rewritten in
  sorted order, only these entries changed).
- Tower: `public/assets/buildings/tower/watchtower-tripo.v2{,.front,.door-e,.no-door}.png` – the main sprite and front
  layer are the Studio export byte for byte; the turned views (`door-e` 180°, `no-door` 270°) rendered with
  `render_glb.py --fill` and placed on the main canvas by the render anchor. Origin 0.36813/0.99187, visual height
  244, torch −14/−80 (measured on the render), platform −206 (deck unchanged in height). The export metadata
  `watchtower-tripo.v2.json` gets platform, front layer and light filled in as for v1.
- Gate: `public/assets/buildings/gate/gate-tripo.v2{,.axis-x}.png` = the two Studio exports byte for byte (each with
  its own origin), front layers `gate-tripo.v2{,.axis-x}.front.png` (render_glb `--fill --front` with the export's
  canvas). Visual height 158.
- The v1 game files are removed. `WALL_STUB` .22 → .06 (the corners of the foot are bevelled).
- Tests updated for the v2 paths.

## Implementation decisions
- The provisional turned Tower views and Gate front layers are cut from the same approved model and camera; they
  stay provisional until the Studio exports them.

## Save/Load impact
None.

## Testing
- `npm test`.
- Browser: Gate on both axes and Tower with walls on the front and back rows and along a face – joined without gaps;
  three Knights on the Tower and on the Gate stand on the deck behind the front merlons.

## Notes for the next agent
- When the Studio exports the turned Tower views and the Gate front layers, replace the provisional files.
