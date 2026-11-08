# Fisherman's Hut: approved Studio art (m-svet-vzhled-2, owner request 32)

## What and why
The Fisherman's Hut was still drawn by code (the temporary `workplace` renderer). The owner approved and marked preferred
the Studio variant `fisherman-hut-stilt-net-loft` (art/approvals.json → `assets.fisherman-hut`, version 2, specHash
`69d826b5`): a timber hut on stilts with a big net on its front wall, a landing stage, an upturned boat, a rod rack, a
water tub, an eel trap and drying fish. The game now draws this sprite.

## Files and systems
- `public/assets/buildings/fisherman_hut/fisherman-hut-stilt-net-loft.v2.png` — byte-for-byte copy of
  `art/sprites/fisherman-hut/fisherman-hut-stilt-net-loft.v2.png`.
- `src/data/objects/approvedArt.js` — `APPROVED_BUILDING_ART.fisherman_hut` (sprite, artSource, origin, visualHeight).
  `withApprovedArt` turns the definition into `renderMode:'sprite'`; `AssetManager.createView` builds a
  `SpriteBuildingView`.
- `tests/approved-art-deploy.test.js` — new test "32: …" (file exists, sha256 equals the export, approved + preferred,
  version/specHash, origin = baseOrigin, visualHeight, no lights, footprint 2 × 2 in game, export and spec).
- `scripts/approved-art-smoke.mjs` — the shore hut the smoke already builds must use texture `asset:fisherman_hut:main`
  at Studio size 131 × 125 with origin y 0.984; screenshot `/tmp/shots/fisherman-hut.png`. The smoke's existing
  "no 404s under /assets/" check covers the new file.

## Implementation decisions
- Footprint: the export metadata and the spec (`art/assets/buildings/fisherman-hut/asset.json`) are both 2 × 2, the
  game's current footprint, so it is kept. (The owner's v1 comment asked for 3 × 3 variants too, but the approved,
  preferred v2 is 2 × 2; no 3 × 3 variant exists.)
- Wired like the other approved buildings: hand-written entry in `APPROVED_BUILDING_ART`, origin = the export's
  `baseOrigin` (0.49618, 0.984: the footprint's front corner), `visualHeight` 123 replaces the placeholder 110.
  `scripts/export-approved-art.mjs` / `approvedDeployArt.js` were not touched: they cover wildlife, vehicles, children,
  fishing loops, icons and ground, not buildings.
- Seasonal/lit variants: the approval has only the base variant and the metadata has no `gameLights`, so there are no
  night, lit or winter versions; none are wired.
- Fallback: the definition keeps `renderer:'workplace'`; if the PNG fails to load, `createView` uses the procedural hut.
- Shore: buildings cannot stand on water tiles, so the hut stands on the land next to the shore. In the screenshot the
  stilts stand on the grass tiles of the footprint, the front props reach to the sand, nothing overhangs the water.

## Save/Load impact
None. Footprint unchanged (2 × 2), no new state; SAVE_VERSION stays 59.

## Testing
- `npm test` (node scripts/test.mjs): 1097/1097 pass (1096 + the new test).
- `npm run build -- --base=/Newgame/`: OK.
- `node scripts/browser-smoke.mjs --base=/Newgame/ --approved-art`: PASS (hut texture, size, origin, no 404s);
  `--fishing`: PASS; `--world-look-2`: PASS.
- Screenshot `/tmp/shots/fisherman-hut.png` checked by eye: hut on its footprint by the beach, stilts on the ground.

## Notes for the next agent
- The hut was added to `TIMBER_SCAFFOLD_BUILDINGS`, so its construction site shows the timber scaffold.
- The landing stage in the sprite points to the screen right (east); on shores facing another way it stands on grass.
  A mirrored or per-direction variant would need a Studio export; flipping the sprite in code would mirror the net and
  the lighting.
- If the owner later approves a 3 × 3 hut, change `width/height` in `src/data/objects/buildings.js`, bump SAVE_VERSION
  (alpha policy) and update the pinned tests; `tests/asset-studio.test.js` and `tests/world-look-2.test.js` already
  enforce export footprint = game footprint.
- The hut is wooden but is not in `TIMBER_SCAFFOLD_BUILDINGS`; add it there if its construction should show the timber
  frame scaffold.
