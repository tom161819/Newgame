# GPT market square in the Asset Studio

## What and why
The owner sent the Marketplace as a GPT turnaround sheet for review in the Asset Studio.

## Files and systems
- `art/assets/buildings/marketplace/asset.json`: variants `marketplace-gpt-{0,90,180,270}`.
- `art/sprites/marketplace/marketplace-gpt-*.v1.*`: scale 0.274, the paved square fits the game's 3 × 3 footprint; base on the front corner of the paving.
- `scripts/studio-smoke.mjs`: checks the four cards.

## Implementation decisions
- The sheet draws a yellow dashed footprint outline around the paving; near the outside edge, yellow pixels are filled with the colour of the surrounding paving.
- The backdrop test is stricter here (`dist < 9`, ≥ 30 px), because the cream awning stripes are almost the backdrop colour.
- No game lights yet (several small stall lanterns).

## Save/Load impact
None.

## Testing
`node --test tests/asset-studio*.test.js`, `npm run studio:smoke`.

## Notes for the next agent
Same footprint as the game (3 × 3): on approval it can go straight into `APPROVED_BUILDING_ART.marketplace`.
