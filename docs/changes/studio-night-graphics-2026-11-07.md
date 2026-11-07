# Studio: night icons, torch brackets and roof fire (plan g-noc-grafika)

## What and why
These are the remaining pieces from the day-night graphics brief (g-noc-grafika). All of them go to the Studio as Drafts for review.
- **Night icons:**
  - Six icons: pitch, torch, no torch, wolves, thief and fire.
  - Two looks: plain icons, and round dark badges where the threats get a red ring.
  - Exported as SVG and as PNG at 1× and 2×.
- **Torch bracket:**
  - Two holders on the town wall: a plain iron arm, and a forged scroll with a drip tray.
  - Two holders on a tower: high up in a wind cage, and low beside the door.
  - Each has a torch light and a soot mark above the flame.
- **Fire on a roof:**
  - Three stages: smouldering (smoke only, ember glow in the window), burning and ablaze.
  - Two roofs: thatch and shingles.
  - The flames are brazier lights that flicker at runtime, so the fire loops. The smoke is a column of puffs leaning downwind, and burnt patches of roof turn to soot.

## Files and systems
- studio/src/generators/icon.js: the `night` set.
- studio/src/generators/props-night.js (new): `wallTorch`, `towerTorch` and `roofFire`; imported by workshop.js.
- art/assets/ui/night-icons, art/assets/decorations/torch-bracket and art/assets/decorations/roof-fire, plus their sprites.

## Implementation decisions
- The flames are lights, not geometry. This is the same approach as the torch post and the campfire: the renderer draws the flicker, so the loop is free.

## Save/Load impact
None.

## Testing
- npm test passes.
- validate.mjs passes.
- The night previews were checked in a browser.

## Notes for the next agent
- Hooking these into the game is a Mechaniky task (N2 and N3).
- The firefighter and the burnt-building ruin already exist in the Studio.
