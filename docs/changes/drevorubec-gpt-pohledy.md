# GPT logger's cabin in the Asset Studio

## What and why
The owner sent the Lumberjack Hut ("dřevorubecká chatka") as a GPT turnaround sheet for review in the Asset Studio.

## Files and systems
- `art/assets/buildings/lumber-camp/asset.json`: variants `lumber-camp-gpt-{0,90,180,270}` (`baked.renderer:'image'`).
- `art/sprites/lumber-camp/lumber-camp-gpt-*.v1.{png,x2.png,json}`: scale 0.3 (about 176 px with the props, the cabin about 130 px for the 2 × 2 footprint). The 0° view has its front corner set by hand and the lantern as a game light.
- `scripts/studio-smoke.mjs`: checks the four cards.

## Implementation decisions
- This sheet is 1536 × 1024 (quadrants 768 × 512), so the cut uses separate quadrant width and height.
- The light sandy ground patch drawn under the cabin is removed (it reads as a white halo on grass); backdrop seen through the shed gaps is removed too. The saw blade and the sign stay.

## Save/Load impact
None. Not in the game until approved.

## Testing
`node --test tests/asset-studio*.test.js`, `npm run studio:smoke`.

## Notes for the next agent
When the owner approves the 0° view, wire it into `APPROVED_BUILDING_ART.lumberjack_hut` like the Bakery (origin = baseOrigin, lights = gameLights) and set it preferred.
