# Soft change between lit and remembered buildings

## What and why
Owner, 14 Nov 2026 (after point 37): the border between lit and dark walls is hard and the switching is distracting. Asked for a smoother change.

## Files and systems
- src/game/sightFade.js: `SIGHT_FADE`, `edgeLight`, `fadeStep`.
- src/game/GameScene.js (building visibility loop, `scene.sightFade`), src/game/MapMemoryRenderer.js (dark copy drawn with the remaining alpha).

## Implementation decisions
- Space: a finished building outside the sight range but within 3 tiles of it is lit 3/4, 1/2 or 1/4 (Chebyshev distance of its nearest tile). Time: every change moves at 1/400 ms.
- The lit view is drawn opaque below; the remembered (dark) copy lies over it with alpha 1 − lit. So nothing shows through to the ground.
- Only finished buildings that have a memory entry; building sites switch as before. The lit view shows the present state up to 3 tiles past the range.
- `edgeLight` is cached for each building by `fog.revision`.

## Save/Load impact
None.

## Testing
tests/owner-14-nov.test.js; browser screenshot of a wall running out of the sight range (/tmp/perfdiag/wall-shot5.mjs); full suite.

## Notes for the next agent
Trees, rocks and other remembered objects still switch hard; the same idea could be used for them.
