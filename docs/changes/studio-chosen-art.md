# Studio art chosen for the game

## What and why
On 7 November the owner picked Studio art for the game. The plan item `m-studio-vybrane-do-hry` asks to wire the
chosen versions into the game:
- House v3, Builder's Workshop v4, Farmhouse v2 (thatched farmstead) and Bakery v3 replace older art.
- Iron Mine, Barracks, Marketplace and Wheelwright's Workshop get approved art for the first time.
- The merchant caravan gets the approved wagon (full and empty).

## Files and systems
- `src/data/approvedArt.js`: APPROVED_BUILDING_ART entries (sprite, artSource, origin, visualHeight, lights from the Studio
  metadata), and the new APPROVED_CARAVAN_ART {full, empty}.
- `public/assets/buildings/<id>/*.png` and `public/assets/vehicles/caravan/merchant-caravan-{full,empty}.v1.png`.
- `src/data/farming.js`: farmhouse footprint 3×3. `src/data/foodProduction.js`: bakery footprint 3×2.
- `src/game/CaravanViews.js`: loads the approved wagon and falls back to the procedural one if loading fails.
- `src/systems/SaveSystem.js`: SAVE_VERSION 55.
- `scripts/chosen-art-smoke.mjs` (`--chosen-art`).

## Implementation decisions
- Origin and visual height come straight from the Studio metadata (`baseOrigin`, `gameLights`), so no hand tuning.
- Already in the game before this task (no change needed): watchtower, bowyer, stables, armorer forge, gate, armory.
- Skipped because they are not game objects: ruins and the iron torch post.

## Save/Load impact
The footprints changed, so SAVE_VERSION goes to 55. Alpha policy: older saves do not load.

## Testing
- `npm test` (956 pass): builder workshop, farming, food production and asset studio tests updated; new caravan art test.
- `npm run smoke -- --current-only --chosen-art`: all eight buildings draw their approved sprites (screenshot with
  SMOKE_SHOTS).

## Notes for the next agent
- New Studio picks go into APPROVED_BUILDING_ART the same way: copy the PNG and take origin and lights from the metadata.
- If a picked art has a different footprint, change the definition, raise SAVE_VERSION and update the tests that
  hard-code the size.
