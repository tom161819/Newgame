# Men on Tower and Gate platforms stand behind the front merlons

## What and why
Owner 20 Nov 2026 (screenshot of three Knights on a Tower): "jednotky na věži překrývají texturu věže".

## Files and systems
- `src/data/objects/buildings.js` tower `platform.y` −195.3 → −206 (and the same in the export metadata
  `art/sprites/watchtower/watchtower-tripo.v1.json`, filled in by hand at integration). −195.3 was the top of the front
  parapet, so the men stood on its edge in front of the merlons. −206 is the deck floor in the middle, measured on the
  approved sprite.
- `src/game/buildings.js` `elevatedDepth(building, offset)`: someone up on a Tower, Gate or Castle platform is drawn at
  `buildingDepth + .2` ± at most .08 (his place on the platform only orders the men up there), so always under the
  front layer (+.3). A wall tile keeps the old screen order (`+ offset`). Used by `WallPatrol.place`,
  `EnemyArmy` (enemy archers on walls) and the King on walls (`PlayerController`). Before, a man in the front slot got
  `+ 9.8` and was drawn over the front merlons.
- Gate (`buildings.js`): `platform {x:0, y:-118}` (the Tripo deck; the Gate had none since 0.149.8, so posted men stood
  on the ground in the gateway), `frontSprite` and `artSprites['axis-x-front']`:
  `public/assets/buildings/gate/gate-tripo.v1{,.axis-x}.front.png`. `GameScene.flipGateView` switches the front layer
  with the axis.
- Tests: `tests/walls-2.test.js` (depth band, Gate platform), `tests/assets.test.js` (185 files to load).

## Implementation decisions
- The Gate front layers are cut from the same Tripo render with the approved camera, rotation and stretch
  (`render_glb.py --front`, aligned to the game sprites pixel for pixel). They add no new drawing; the Studio export has
  `frontLayer: false`, so they are provisional until the Studio exports them (AGENTS rule 8).

## Save/Load impact
None.

## Testing
- `npm test`.
- Browser: three Knights posted on a Tower and on a Gate of each axis stand on the deck, merlons in front of their legs.

## Notes for the next agent
- When the Gate is re-exported from the Studio, export its front layer too (`frontLayer: true`) and replace these files.
