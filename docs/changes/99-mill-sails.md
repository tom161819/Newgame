# #99 – The Mill's sails turn while it grinds

## What and why
[#99](https://github.com/tom161819/Newgame/issues/99) asks to check whether the Mill's sails turn and, if not, to animate only the sails. The approved look of the building, its sprite and its anchor must stay. An audit showed the sails were baked into the approved `windmill-tower` sprite, and nothing in the game moved them.

## Files and systems
- **Asset Studio:**
  - `studio/src/generators/workshop.js`: the windmill's hub and sails are tagged as layer `rotor`, and the model returns the hub as `rotor.at`.
  - `studio/src/render/spriteRenderer.js` renders, in the same frame and crop:
    - a **still** image, with the rotor hidden;
    - a **rotor** image, with only the rotor, occluded exactly as in the full sprite;
    - the pivot in sprite pixels.
  - Metadata gains `rotor.pivot` and `rotor.gamePivot` (relative to the game base). `specs.js` paths `spriteStill`/`spriteRotor`, `main.js` and `scripts/studio-export.mjs` write `.still.png` and `.rotor.png`.
- **Re-export of the approved `windmill`** (`npm run studio:export -- windmill`): the approved main PNG is **byte-identical** (checked with `cmp`). `.still.png`, `.rotor.png` and the metadata's `rotor` are new. The unapproved `windmill-post` variant got the same layers.
- **Game:**
  - `public/assets/buildings/mill/windmill-tower.v1.{still,rotor}.png`;
  - `approvedArt.js`: `mill.rotor = {still, sprite, pivot, origin}`, validated in `ObjectRegistry`;
  - `AssetManager` loads the `still` and `rotor` layers;
  - `SpriteViews.SpriteBuildingView` draws the still body and a rotor image at the hub (depth just above the body; tint, alpha, visibility and destroy handled);
  - `MapMemoryRenderer` includes the rotor in remembered copies, as a still image.
- **New `src/game/MillSails.js`:** `millGrinding` checks for a Miller with a `produce` task at this Mill while a cycle runs. `stepSails` eases the speed up or down over 2.5 s, at 0.16 turns per second. `MillSails.update(activeDelta)` is called from `GameScene.update` with the game time that advanced this frame.
- Tests: `tests/mill-sails.test.js` (3); `tests/assets.test.js` now queues 92 images (+2 layers). Smoke `scripts/mill-sails-smoke.mjs` (`--mill-sails`, also in `--full`).

## Implementation decisions
- **No new art:** the approved model's own sails are split off, so still + rotor composite back to the approved image. The only difference is the sails' baked shadow on the tower and ground (about 2.5 % of pixels), which a turning rotor must not leave fixed. No new approval was needed.
- **Game time, not frames:** the motion uses the active game delta, so it stops while paused and in menus, follows the game speed, and never jumps or speeds up without bound.
- **Purely visual:** nothing is saved, so a loaded game starts with the sails at rest. Collisions, the Mill's speed and costs are unchanged.
- **Hidden Mills:** a Mill under Fog of War, shown through Map Memory, stays still. Only live views turn.

## Save/Load impact
None. SAVE_VERSION is unchanged.

## Testing
- `npm test` passes.
- Smoke `--mill-sails` passes: a real Mill shows the still body and the sails at the hub; the sails stay still while idle, turn while grinding and freeze while paused; the snapshot is restored. The screenshot was inspected.
- `npm run studio:smoke` passes. `build:pages`, `changelog:validate` and `version:check` pass.

## Notes for the next agent
- Any building can get a rotor the same way: tag the parts `layer: 'rotor'`, return the pivot as `rotor.at` from the recipe, export, then copy the two PNGs and `rotor` into `approvedArt.js`.
