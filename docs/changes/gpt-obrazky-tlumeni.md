# GPT building art: no light rim, toned to the game

## What and why
Owner, 13 Nov 2026 (screenshot): the new buildings had a white frame where they meet the ground, and they were too bright ("moc svítí") next to the rest of the game.
Measured on opaque pixels: Studio-rendered game buildings average luminance ~85 (90th percentile ~125); the GPT sprites ~105 (~155).

## Files and systems
- `scripts/gpt-sprite-grade.py`: the post-process for a GPT cut-out (full resolution): (1) pale, low-saturation, low-texture ground pixels connected to the outside in the lower part of the image, and the pale anti-aliased rim there, become the soft black contact shadow; (2) grade: gamma 1.1, × 0.86, saturation × 0.93.
- Re-exported (same versions, same anchors relative to the image bottom): `art/sprites/{armory,bakery-house,house,lumber-camp}/*-gpt-*` and the game copies in `public/assets/buildings/{house,bakery,armory}/`.
- `armory-gpt-180` is 2 px taller: it now uses the cut with the small label blank (its roof top was clipped before).

## Implementation decisions
- Same versions and spec hashes: the owner asked for this change to the approved art, so the approvals stand.
- The grade is baked into the exports, so the Studio still shows exactly what the game draws.

## Save/Load impact
None.

## Testing
`node --test tests/house-looks.test.js tests/asset-studio*.test.js tests/world-look-2.test.js tests/assets.test.js`; screenshot of the houses, bakery and armory in a loaded village.

## Notes for the next agent
Run every new GPT cut-out through `scripts/gpt-sprite-grade.py <in> <out> <backdrop luminance>` before scaling.
