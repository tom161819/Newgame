# GPT Armory views in the Asset Studio

## What and why
The owner made the Armory with GPT as one sheet with four views (0° front-right, 90° rear-right, 180° rear-left, 270° front-left) for a future 90° view rotation, and asked to put them into the Asset Studio for review. It tests the 2D-image route of plan item #40 (g-novy-postup-grafiky).

## Files and systems
- `art/assets/buildings/armory/asset.json`: variants `armory-gpt-0/90/180/270` with `baked: {renderer:'image', source:'gpt', view}` and the spec of `armory-fortified` (needed by the spec validation; the image does not use it).
- `art/sprites/armory/armory-gpt-*.v1.png`, `.x2.png`, `.json`: the cut-out images at 1/3 (about 195 px wide, like the 3×3 footprint) and 2/3, with sidecars.
- `studio/src/main.js`: the baked note says "Imported image (GPT), view N°" for `renderer:'image'` instead of the Blender text.
- `scripts/studio-export.mjs`: skip message is generic for any pre-made image.
- `scripts/studio-smoke.mjs`: checks the four cards.

## Implementation decisions
- Cut-out: gray backdrop and label removed, contact shadow kept as semi-transparent black, enclosed backdrop holes removed (sword racks stay whole).
- Anchor: base = bottom of the opaque image, centred; anchor = base − 48 px (half the 3×3 diamond). Set by eye; the GPT camera is a bit steeper than the game's 2:1, so the footprint fit is approximate.
- specHash in the sidecars is the Studio hash of each variant, so the cards are not shown as outdated.

## Save/Load impact
None. The game does not use these images yet.

## Testing
`node --test tests/asset-studio*.test.js` (59 pass), `npm run studio:smoke` (new GPT check passes), `npm test`.

## Notes for the next agent
If the owner approves the route, the game needs a view-rotation system before the four views matter; until then only one view (0° or 270°) could replace the Armory sprite. The Studio is published separately (slug d772dccf-…).
