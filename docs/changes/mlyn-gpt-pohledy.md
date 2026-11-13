# GPT windmill in the Asset Studio

## What and why
The owner sent the Mill as a GPT turnaround sheet for review in the Asset Studio.

## Files and systems
- `art/assets/buildings/windmill/asset.json`: variants `windmill-gpt-{0,90,180,270}`.
- `art/sprites/windmill/windmill-gpt-*.v1.*`: scale 0.466 (door ≈ 103 px in the cut-out → ≈ 48 px), 2 × 2 footprint, base set by hand on the 0° view.
- `scripts/studio-smoke.mjs`: checks the four cards.

## Implementation decisions
- Same cut as the logger's cabin (1536 × 1024 sheet), then an extra pass clears the backdrop seen through the lattice sails (small pale, low-saturation components); the cloth on the drying rack stays. Then `scripts/gpt-sprite-grade.py`.
- The sails are painted into the picture. The game's Mill turns its sails as a separate layer (`rotor`: still body + sails), so before this art can replace the Mill it needs a body without sails and the sails alone (a second GPT picture), or the owner accepts sails that do not turn.

## Save/Load impact
None.

## Testing
`node --test tests/asset-studio*.test.js`, `npm run studio:smoke`.

## Notes for the next agent
When the owner approves, ask for (or cut) a sail-less body and a sails-only picture so `APPROVED_BUILDING_ART.mill.rotor` keeps turning; pivot = the hub on the 0° view.
