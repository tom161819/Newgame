# GPT pitch works (Smolárna) in the Asset Studio

## What and why
The owner sent the Pitch Kiln ("Smolárna") as a GPT turnaround sheet for review in the Asset Studio.

## Files and systems
- `art/assets/buildings/pitch-kiln/asset.json`: variants `pitch-kiln-gpt-{0,90,180,270}` (the asset is already 3 × 3).
- `art/sprites/pitch-kiln/pitch-kiln-gpt-*.v1.*`: scale 0.31, the paved base fits 3 × 3; the arched double gate is ≈ 45 px. Lantern and the cauldron fire as game lights on the 0° view.
- `scripts/studio-smoke.mjs`: checks the four cards.

## Implementation decisions
- This sheet has labels top-right, a title badge with icons top-left and painted chimney smoke; all blanked by boxes before the cut (static smoke would not move in the game; the game has its own chimney smoke and fire effects).
- Backdrop under the wood lean-to removed with the smooth-backdrop test; the paved base kept (ground pass with 12 iterations).

## Save/Load impact
None.

## Testing
`node --test tests/asset-studio*.test.js`, `npm run studio:smoke`.

## Notes for the next agent
The game Pitch Kiln is 2 × 2 and already shows the 3 × 3 Studio art at 2/3 (`visual.displayWidth/Height`). On approval: either keep 2 × 2 and show this at 2/3 (gate ≈ 30 px, smaller than other doors) or grow the kiln to 3 × 3 with `legacyFootprint` like the Farmhouse — ask the owner.
