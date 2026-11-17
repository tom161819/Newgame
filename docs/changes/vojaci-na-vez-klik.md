# Soldiers to Towers, Gates and walls by their picture (0.143.11)

## What and why
Owner 17 Nov 2026: "let soldiers and the King be sent to walls, towers and gates – I keep asking and it still does not work: when I click the tower the soldier goes to the meadow behind it". The post order (m-vojaci-na-hradby) matched the building only by the tile under the pointer; a Tower is drawn high above its two tiles, so a click on its body hit a tile behind it and became a plain move. Verified in the browser: a click on the Tower's body was tile 52,45 while the Tower stands at 54,47.

## Files and systems
- `UnitSelection.down`: the target is `scene.towerAtPoint(worldX, worldY, tile)` (the picture, as the King's orders use), falling back to the tile. With the King chosen, `kingOrder` runs on the same click (before, the post order returned before the King was told).
- `WallPatrol`: `PLATFORM_SLOTS` (four places on a platform); `postTiles(…, takenSlots)` gives free platform places first, then the walls beside; `post` keeps the places of men already up there; the climb puts a man on his place.
- Save: `wallPatrol.post.slot` (1–3, only with `tower`) is saved and strictly validated (an optional field, no SAVE_VERSION change).

## Implementation decisions
A single man still takes place 0 (the middle), as before.

## Save/Load impact
Optional `slot` in a soldier's post; older saves load unchanged.

## Testing
tests/military-units.test.js (platform places, the man already there keeps his, save/validation of slot); npm test; browser: Test map, a Tower, three Archers, right click on the Tower's body – all three stand on the platform.

## Notes for the next agent
Use the building picture (`towerAtPoint`/`pickInteraction`) for every click order on buildings, never only `pointerTile`.
