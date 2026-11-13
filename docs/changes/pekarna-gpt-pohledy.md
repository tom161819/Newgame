# GPT Bakery views and the Armory roof fix

## What and why
- The owner sent the Bakery as a GPT turnaround sheet (0°, 90°, 180°, 270°) for review in the Asset Studio.
- The owner requested a revision of `armory-gpt-0`: the roof was cut at the top. Cause: when removing the "0° (Front-Right)" label, a 220 × 60 px rectangle was blanked, and the roof ridge reaches into it.

## Files and systems
- `art/assets/buildings/bakery-house/asset.json`: variants `bakery-house-gpt-0/90/180/270` (`baked.renderer:'image'`, spec of `bakery-house-yard-oven`).
- `art/sprites/bakery-house/bakery-house-gpt-*.v1.{png,x2.png,json}`: scaled 1/3.6 (about 165 px wide for the 3×2 footprint; anchor = base − 40 px).
- `art/assets/buildings/armory/asset.json`, `art/sprites/armory/armory-gpt-0.v2.*`: new version v2; v1 files removed.
- `art/approvals.json`: Studio decisions taken over (90°, 180°, 270° approved; 0° revision → v2 in review with history).
- `scripts/studio-smoke.mjs`: checks the bakery cards.

## Implementation decisions
- Only the label pill is blanked now (172 × 50 px). The same bug had cut the bakery chimney in 90° and 270°; fixed before release.
- The bakery shadow is a smooth light grey; the backdrop growth also takes low-texture pixels (local deviation < 7) with saturation < 0.075, so the textured stone plinth stays.
- The approved armory 90°/180°/270° files were left unchanged.

## Save/Load impact
None.

## Testing
`node --test tests/asset-studio*.test.js tests/asset-review*.test.js` (64 pass), `npm run studio:smoke`.

## Notes for the next agent
Delete the Studio DB documents `reviews/armory__armory-gpt-{0,90,180,270}` (version 1) after the Studio is republished.
