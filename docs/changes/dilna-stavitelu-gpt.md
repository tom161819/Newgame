# GPT builder's workshop: wooden in the game, stone for later

## What and why
Owner, 13 Nov 2026: Builder's Workshop in stone and wood, "základní bude dřevěná".

## Files and systems
- `art/assets/buildings/builders-workshop/asset.json`: variants `builders-workshop-gpt-{wood,stone}-{0,90,180,270}`.
- `art/sprites/builders-workshop/builders-workshop-gpt-*.v1.*`: scale 0.47 (double door ≈ 45 px); the paved yard fits the game's 3 × 3; lantern light on the wooden 0° view.
- `art/approvals.json`, `src/data/objects/approvedArt.js`, `public/assets/buildings/builder_workshop/`: the game uses the wooden 0° view.
- `scripts/studio-smoke.mjs`: checks the eight cards.

## Implementation decisions
- This sheet has a green grid backdrop and no labels (row 1 stone, row 2 wood; columns 0°, 90°, 180°, 270°). Background = green pixels near the backdrop colour connected to the cell border; enclosed green between the crane and the roof removed with a looser green test in the upper two thirds (ground grass kept). Column borders set in the gaps between buildings (the cranes reach past the even quarters).
- No light ground patch, so only the colour grade (no halo/rim pass).

## Save/Load impact
None.

## Testing
`node --test tests/asset-studio*.test.js tests/world-look-2.test.js tests/assets.test.js`, `npm run studio:smoke`, full `npm test`.

## Notes for the next agent
Material choice: see the Granary note (wood and stone share scale and base).
