# Studio: World v2 textures and decorations (plan g-svet-textury)

## What and why
Step 2b of the World v2 brief, as Drafts for review:
- **Six grass zones**: meadow, lush, dry, forest floor, flowering and stony. Each has four interchangeable seamless 64×32 tiles, and its own summer, spring, autumn and winter (snow) variant.
- **Ford and shores** (`shore-ground`): the FORD shallow with pebbles and ripples, the MUD bank, the SHORE_ROCKS bank, and a foamy water edge.
- **Reeds**: three clumps and two dry winter versions.
- **Ford stones**: four sizes.
- **Ground decals**: grass tufts, dry tufts, three kinds of flowers, pebbles and fallen leaves.

## Files and systems
- art/assets/terrain/grass-zone-{meadow,lush,dry,forest,flowers,stony}
- art/assets/terrain/shore-ground
- art/assets/decorations/{reeds,ford-stones,ground-decals}
- studio/src/generators/props-nature.js (new): props `reeds`, `fordStones` and `decals`. It is imported by workshop.js.
- the exported sprites

## Implementation decisions
The ground tiles use the existing ground recipe: periodic noise, so the tiles join without seams.

## Save/Load impact
None.

## Testing
- npm test passes.
- validate.mjs passes.
- The tiles and sprites were checked by eye.

## Notes for the next agent
- Hooking these up in the game is Mechaniky's task m-svet-revize-generatoru (2a).
- After approval, the World Lab draft-art switch should get these tiles.
