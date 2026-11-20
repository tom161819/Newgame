# The 2 × 2 Gate drawn over its own tiles (owner report 20 Nov 2026)

## What and why
Owner, 20 Nov 2026 (screenshot with Space flattening): "brána se vykresluje jinde, než je" – the Gate's picture did not cover its 2 × 2 ground plan.
The 2 × 2 Gate uses the 1 × 1 Gate art (86 × 115 px, its ground diamond 64 px wide) drawn at 150 × 200 – 1.74 tiles, anchored at the front corner. So its back and sides fell about a quarter of a tile short of the real tiles, and the wall running along its back row seemed to meet it in the wrong place.

## Files and systems
- `src/data/objects/buildings.js` — `gate`: `visual` 172 × 230 (exactly twice the art), `visualHeight` 207.

## Implementation decisions
- The anchor (front corner, origin from the art) stays; only the scale changed, so the picture's ground diamond is the 2 × 2 plan exactly.
- The 1 × 1 `wall_gate` of older saves is untouched.

## Save/Load impact
None.

## Testing
Browser: a wall line with a Gate, the flattened plans laid over the pictures – before, the Gate's picture was 150 × 200 and short of its plan; after, 172 × 230 and its front corner on the plan's front corner (checked from the sprite's bounds and the view's base). `npm test` passes.

## Notes for the next agent
`npx vite build --outDir /tmp/wdist` fails when the folder already holds assets (EEXIST); use `--emptyOutDir`, else a browser check runs an old build.
