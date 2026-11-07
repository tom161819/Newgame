# Studio concepts for every task waiting on art (7 Nov 2026)

## What and why
The owner asked the Grafika chat to go through the plan and draw Studio concepts wherever a task waits for art, including tasks still queued or awaiting approval. New or revised concepts:
- **#119 Builders' workshop** → 3 × 3 (owner's comment on #118, 7 Nov): all three concepts as v2 (open lean-to shed, workshop house with awning, material yard) plus a Blender render of the house-with-awning layout (`builders-workshop-blender`).
- **#97 Castle gate**: new asset `wall-gate` (closed, open, half-raised portcullis, the other passage direction, and a stair up to the wall walk) and `wall-kit-preview-gate` (enclosure with a gate and an inner stair).
- **Obchod F1 (#59)**: `marketplace` 3 × 3 (market square, market hall, stalls and wagon bay), `merchant-caravan` (full, unloading, empty wagon with its own horse, along grid x) and `merchant` (man, woman).
- **#100 World generation**: `wild-ground` tile sets (beach sand, desert sand, shallow and deep water) and `bush` (meadow, berry, flowering, dry scrub).
- **Blender pilot: barracks** (planned task): `barracks-hall-blender`, the Stone barracks layout rendered by Blender.

## Files and systems
- `studio/src/generators/props.js`: new props `stall`, `goodsPile`, `well`, `scales`, `hitchingPost`, `wagon` (the whole rig centred on its point, turned by `angle`; loads `full`/`unloading`/`empty`), `planks`, `beams`, `sawhorse`, `ladder`, `mortarTub`.
- `studio/src/generators/workshop.js`: body `hall` (open market hall); `shed` may be up to 2.6 wide (existing specs unaffected).
- `studio/src/generators/wallkit.js`: pieces `gate` (axis, state) and `stair`; `assembly` takes `gates` and `stairs`. Gate tiles keep the wall height so the walk continues over them; the passage has no masonry.
- `studio/src/generators/tree.js`: kind `bush` (berries, dry scrub).
- `art/style-guide.json`: palette `sand`, `sand_light`, `sand_dark`, `dune`, `dune_shade`, `water_deep`, `water`, `water_light`, `foam`, `olive_scrub`, `grass_scrub`; materials `olive_scrub`, `grass_scrub`. Style version unchanged.
- Generator versions unchanged: existing variants keep their hashes and sprites (checked: no committed sprite changed).
- `art/approvals.json`: new variants in review; builders' workshop v1 records moved into history.

- `scripts/blender/render.py`: only small stone boxes (ruins) get the chipped field-stone treatment; big blocks (walls, plinths) stay straight with a slight bevel. Materials with the style textures `bricks`, `shingles` and `planks` get matching procedural brick patterns on world-unit UVs (roof courses parallel to the ridge). The first barracks render had lumpy, cloth-like walls; this fixes it. All three Blender variants re-baked (`ruined-wall-blender`, `barracks-hall-blender`, `builders-workshop-blender`; 110–160 s each at 96 samples).
- `art/assets/decorations/profession-porch`: themed porches for #114/#98 (woodcutter, farmer, baker, smith, hunter), each with its `seats`.
- Marketplace concepts carry two marked loading places (`loadingBay`); the caravan's cover is red so it differs from the player's carts; one view along grid x, mirrored by the game like `VehicleViews` does for carts.

## Implementation decisions
- The caravan is drawn along grid x only; the mechanic needs the other directions, which can be rendered from the same prop with `angle` once the owner picks a look.
- Water tiles are flat and calm (ground recipe in grass mode, no blades). Shore blending and animated water belong to the #100 mechanics.
- Baked Blender sprites have no runtime lights yet (torches of the barracks are not in the baked sidecar).

## Save/Load impact
None. No game change, no release.

## Testing
- `npm test`: new tests for the gate (no masonry in the passage, doors closed/open, walk height), the stair, the wagon loads and turning, bushes, 3 × 3 footprints. Profession test excludes the visiting merchant.
- `npm run studio:smoke` and sprite exports; contact sheets checked at 2×.

## Notes for the next agent
- When the owner approves: workshop → #118 sprite swap; gate → #97 mechanics; marketplace/caravan/merchant → obchod F1; ground and bushes → #100.
