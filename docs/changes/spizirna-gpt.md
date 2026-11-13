# GPT pantry (Granary): wooden in the game, stone for later

## What and why
Owner, 13 Nov 2026: Granary as a GPT sheet with two materials, "udělat 2 verze – dřevěná a kamenná (později půjde vybrat materiál, zatím použijeme dřevěnou pro hru)".

## Files and systems
- `art/assets/buildings/granary-store/asset.json`: variants `granary-store-gpt-wood-{0,90,180,270}` and `granary-store-gpt-stone-{0,90,180,270}`.
- `art/sprites/granary-store/granary-store-gpt-*.v1.*`: scale 0.48 (door ≈ 100 px → ≈ 48 px); the building is smaller than the 3 × 3 footprint (allowed by the owner's rule), centred on it; lantern light on the wooden 0° view.
- `art/approvals.json`: wooden 0° approved on the owner's chat decision and preferred; the rest in review.
- `src/data/objects/approvedArt.js`, `public/assets/buildings/granary/granary-store-gpt-wood-0.v1.png`: the game uses the wooden 0° view.
- `scripts/studio-smoke.mjs`: checks the eight cards.

## Implementation decisions
- New sheet layout (2 rows × 4 views, cream backdrop, banners, labels under each view, a frame): cut per cell between the banner and the labels; the background test is relaxed for the cream backdrop (saturation ≈ 0.065); only the largest component is kept (frame lines removed).
- Material choice is not built yet; both materials use the same scale and base so they can swap later.

## Save/Load impact
None.

## Testing
`node --test tests/asset-studio*.test.js`, `npm run studio:smoke`, full `npm test`.

## Notes for the next agent
For the material choice, reuse the House look mechanism (`artSprites` + a per-building field), with the player picking the material.
