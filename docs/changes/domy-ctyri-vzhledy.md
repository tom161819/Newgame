# Four House looks; GPT Bakery and Armory in the game

## What and why
- Owner, 13 Nov 2026: "nasaď do hry schválený modely" (Armory 0° v2 and the Bakery views were approved in the Studio) and "dům má 4 varianty, ať se při stavbě vždycky změní a postaví se jiná varianta jako další".
- The game has no view rotation yet, so each building uses its 0° (front-right) view.

## Files and systems
- `art/assets/buildings/house/asset.json`, `art/sprites/house/house-gpt-{bench,woodshed,porch,garden}-{0,90,180,270}.v1.*`: 16 imported-image variants (scale 1/3).
- `art/approvals.json`: Studio decisions taken over; preferred armory-gpt-0, bakery-house-gpt-0, house-gpt-bench-0; the four house 0° views approved on the owner's chat request (other views in review).
- `art/sprites/armory/armory-gpt-0.v2.json`, `bakery-house-gpt-0.v1.json`: base set by hand on the front plinth corner; the bakery oven light (gameLights).
- `src/data/objects/approvedArt.js`: house (with `artSprites` per look and `artLooks`), bakery, armory.
- `src/game/buildings.js`: `nextBuildingLook` (placement), `buildingLook` (view; old saves fall back to a look by id).
- `src/systems/SpriteViews.js`: SpriteBuildingView draws the building's look.
- `src/systems/ObjectRegistry.js`: validates `artLooks`.
- `src/systems/GameStateSerializer.js`: optional `look` on buildings, validated against the type's looks.
- `public/assets/buildings/{house,bakery,armory}/`: the exports, byte for byte.
- `tests/house-looks.test.js`.

## Implementation decisions
- The next look follows the newest standing House of that type (cycle bench → woodshed → porch → garden). Demolishing a House does not reset the cycle in a way that repeats a neighbour.
- A House without `look` (older saves) gets a stable look from its id, so old villages also become varied without changing the save.
- The GPT camera is a little flatter than the game's 2:1; the front corner of the plinth is placed on the footprint's front corner. Props (bench, crates, banner) stand slightly in front of the footprint.

## Save/Load impact
SAVE_VERSION stays 62. New optional field `buildings[].look` (only for types with `artLooks`).

## Testing
`node --test tests/house-looks.test.js tests/asset-studio.test.js tests/approved-art-deploy.test.js`, full `npm test`, a screenshot of the four houses, the bakery and the armory in a loaded village.

## Notes for the next agent
Other views (90°, 180°, 270°) are in the Studio for the future view rotation. Delete the Studio DB review documents taken over in this change after the Studio is republished.
