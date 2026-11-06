# #92 – Building concepts: Barracks, Wheelwright Workshop, Iron Mine

## What and why
The #92 audit (`docs/audits/92-visual-fallbacks.md`, from the profession PR) lists the working buildings that are still drawn procedurally. This adds Asset Studio concepts for the three that need one: Barracks, Wheelwright Workshop and Iron Mine. Each has two variants, all in Review. Nothing changes in the game until one is approved.

## Files and systems
- `art/assets/buildings/barracks-hall/asset.json` (`plannedGameObjectId: barracks`):
  - timber hall with a fenced training yard;
  - stone barracks in the approved Armory style (preferred proposal).
- `art/assets/buildings/wheelwright-yard/asset.json` (`wheelwright_workshop`):
  - workshop with an open shed and a cart being built (preferred proposal);
  - stone workshop with stacked wheels.
- `art/assets/buildings/iron-mine/asset.json` (`iron_mine`):
  - timbered adit with ore heaps (preferred proposal);
  - thatched hut with a sheltered ore yard.
- `art/sprites/<id>/*.v1.{png,json}`, exported, and `art/approvals.json` (Review).

## Implementation decisions
- Built only from the existing `workshop` recipe and prop catalogue (weapon racks, armour stand, banners, wheels, carts, ore, charcoal), so the style, materials and lights match the approved production buildings. No generator change.
- The 3 × 3 footprints of the game objects are kept; every part stays inside them (studio tests). Yards face the camera, so workers stay visible.

## Save/Load impact
None.

## Testing
- `npm test` passes; the asset-studio tests validate the specs, footprints, prop variety and committed sprite hashes. No existing sprite changed.
- `npm run studio:smoke` passes. The exported sprites were inspected (the preview grid is in the PR).

## Notes for the next agent
- After approval:
  1. copy the chosen PNG to `public/assets/buildings/<game id>/`;
  2. add its metadata (baseOrigin, visualHeight, lights) to `APPROVED_BUILDING_ART`;
  3. adjust the image count in `tests/assets.test.js`.
- The castle keep remains open (the walls use the approved wall kit).
