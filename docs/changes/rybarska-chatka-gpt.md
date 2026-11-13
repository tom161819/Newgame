# GPT fishing hut in the Asset Studio

## What and why
The owner sent the Fisherman's Hut as a GPT turnaround sheet for review in the Asset Studio.

## Files and systems
- `art/assets/buildings/fisherman-hut/asset.json`: variants `fisherman-hut-gpt-{0,90,180,270}`.
- `art/sprites/fisherman-hut/fisherman-hut-gpt-*.v1.*`: scale 0.4 (door ≈ 120 px in the cut-out → ≈ 48 px); sidecar footprint 3 × 3 (the yard with ladder, drying rack and bench fills 3 × 3 at this scale), lantern as a game light on the 0° view.
- `scripts/studio-smoke.mjs`: checks the four cards.

## Implementation decisions
- Backdrop seen through nets and traps removed only where it is smooth and of the backdrop colour (`dist < 22`, local deviation < 6, ≥ 12 px), so the silver fish stay whole.
- The game hut is 2 × 2 and its placement depends on the shore; the owner decides at deployment whether it grows to 3 × 3 (then reuse `legacyFootprint`, like the Farmhouse) or is shown smaller.

## Save/Load impact
None.

## Testing
`node --test tests/asset-studio*.test.js tests/world-look-2.test.js`, `npm run studio:smoke`.

## Notes for the next agent
Before deploying, check the Fisherman's Hut shore rules (`src/data/objects`, fishing placement) for a 3 × 3 footprint.
