# Studio: Tripo Tower and Gate, walls in their stone

## What and why
Owner 20 Nov 2026: the game art still looked basic, so the owner bought Tripo and generated 3D models: a 2 × 2 watchtower
(`watchtower_v1.glb`, "je to dobrý", stone colour to keep) and a 2 × 2 gatehouse (`stone_tower_3d_model.glb`). He could not
get a good wall from Tripo: "zeď dopracuj podle věže a brány". All of it goes to the Asset Studio for review first; the game
takes it after approval.

## Files and systems
- `scripts/blender/render_glb.py`: renders a GLB with the helpers of `render.py` (game projection, style sun, shadow catcher,
  4× supersampling, 1x and 2x crops). Fits the model on its footprint (margin 0.08), `--rot` turns it, `--sx` stretches it
  across, `--front <main render.json>` renders only what stands above the deck on the camera side (the front layer for
  units on top), cropped like the main picture. It also prints the deck height (ray cast) for the game's platform.
- `scripts/blender/render.py`: with `MK_STONE_TEXTURE` the stone materials (`stone`, `stone_dark` ×0.74, `stone_light`
  ×1.12) use that masonry tile on world UVs (one tile edge wide, so wall tiles continue) with a bump from it; parts are lifted
  0.6 mm each so coplanar tops (mitred elbow caps) do not render black.
- `art/textures/stone-tripo.v1.png`: seamless masonry tile cut from a straight-on, unlit render of the Tripo tower face.
- `scripts/blender-bake.mjs`: `baked.stoneTexture`, `baked.glb` (+ `rotation`, `stretchX`, `--glb-dir`), `--from <folder>`
  to take an earlier render; positional arguments no longer swallow flag values (`--samples 64`).
- Studio variants (v1, for review):
  - `watchtower/watchtower-tripo` (door front-left, turned 90°);
  - new asset `gate` (2 × 2): `gate-tripo` (walls north–south) and `gate-tripo-axis-x` (walls east–west), stretched 12 %
    across to fill the tiles;
  - `wall-kit/*-tripo` (block, four parapets) and `wall-diagonal/*-tripo` (se, ne and all 16 elbows, the four rejected ones
    redone too) – the same recipes in the Tripo stone.

## Implementation decisions
- The Studio page holds at most 512 files and one script at most 16 MB, so the diagonal `*-tripo` pieces have no 2x file
  (the Studio shows their 1x picture at 2×); the inline limit stays 24 KB.
- The GLB files (78 and 44 MB) are not in the repo; `baked.glb` names them, the PNG renders are committed.
- The Tripo texture atlas is fragmented, so the wall stone is taken from a straight render of the tower face instead.
- Walls keep the approved recipes (size, wall walk, merlons), only the stone changes, so every joint stays as it is.

## Save/Load impact
None (Studio only).

## Testing
- `npm test` (asset-studio: sprites exist and match their spec hash).
- Browser preview (local, not released): Tripo towers, both gate axes and the walls together on the test map.

## Notes for the next agent
- Deploy after approval: tower `watchtower-tripo.v1` (+ renders at 180° door right and 270° no door, front layer, origin
  0.36932/0.9918, platform −195.3, visualHeight 242, torch −12/−84); gate main + `art-axis-x` (canvas 150 × 157, origin
  0.44/0.98726, `flipGateView` picks the picture instead of mirroring); walls: the approved `*-tripo` pieces into
  `APPROVED_WALL_ART` / `DIAGONAL_WALL_ART` (kit origin = baseOrigin, diagonals = origin).
- New Tripo model: `python render_glb.py -- <model.json> <file.glb> <prefix> --rot <deg>`, check the door side in a quick
  12-sample render first.
