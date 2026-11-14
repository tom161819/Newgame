# Sight border: slivers and hairlines on lifted ground

## What and why
Owner's screenshot (14 Nov 2026): bright slivers of lit ground and thin lines outside the dark edge of the sight range, seen right after starting a game. Present since the lifted terrain (also in 0.117.1), on the Canvas renderer.

## Files and systems
- src/game/FogEdgeLayer.js `project` (Canvas path with relief).
- src/game/GroundComposite.js: a chunk that left or changed its box is wiped where it was (found on the way; not the cause).

## Implementation decisions
- The soft edge mask was laid in blocks of 3 × 3 tiles lifted by the lift of the block's middle; on a slope the mask sat off the ground (slivers). Now every tile that holds darkness is laid with its own lift: first with one tile of overlap, then the tile itself.
- Each piece was drawn with 'copy' inside a soft clip. That clears and then draws with the edge coverage, so edge pixels came out lighter: a hairline round every piece. Now the piece is wiped with 'destination-out' and added with 'lighter' under the same clip, which restores the exact value.

## Save/Load impact
None.

## Testing
Browser screenshots before/after with a fixed random seed (/tmp/perfdiag/edge-run.mjs); frame rate at zoom 1 and 0.35 on a 200 × 200 map unchanged within noise; full suite.

## Notes for the next agent
WebGL uses one filtered image and was not changed.
