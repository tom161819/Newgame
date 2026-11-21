# Archer and Crossbowman from the owner's Tripo models

## What and why
Owner, 21 Nov 2026: "tady je model lučištníka a kušiníka, zpracuj je". The owner sent two Tripo GLBs:
- `archer_man_3d_model.glb`;
- `kusinik_….glb`.

Each is one mesh of a standing figure without a skeleton:
- the Archer holds a longbow upright in the left hand;
- the Crossbowman lets the crossbow hang from the right hand.

These get the same treatment as the Knight and the Halberdier (20 Nov): rig, animations, then a direct replacement of the sheets in the game.

## Files and systems
- `scripts/blender/rig-tripo-ranged.py -- <glb> <blend> archer|crossbow`
  - A joint table per model, in the model's own units. The model is 1.0 tall to the bow tip or the hat.
  - The point between the feet becomes the origin. The Crossbowman's body stands off-centre in the GLB because the crossbow sticks out to the side.
  - Weights:
    - inverse distance to the bones;
    - each loose piece is limited to its three nearest bones.
  - Body gear never moves with the arms. This covers red pieces (tabard, sash) and pieces centred near the body column below the chest (belt, quivers, pouches).
  - The weapon, as whole pieces, goes rigidly with its hand: the bow with `hand.L`, the crossbow with `hand.R`.
- `scripts/blender/render-soldier.py`: new environment values `XBOW_AIM` and `XBOW_YAW`, in degrees. They turn a crossbow that hangs in the rest pose up (about the figure's X axis) and straight ahead (about Z) while the figure raises, aims and lowers it. The Tripo Crossbowman uses `XBOW_AIM=-90 XBOW_YAW=-50 XBOW_TILT=0`. Other models leave the defaults.
- Enemy colour: the "Army cloth" hue shift is mixed in only where the texture is red (linear R − 3·G, ×30). With a whole-texture shift, skin, leather and bow turned purple.
- Sheets replace the v2 sheets:
  - `public/assets/characters/villagers/army-archer.v3.walk.png`;
  - `enemy-archer.v3.walk.png` (rendered with `--hue 0.15`);
  - `army-crossbowman.v3.walk.png`.
- `src/data/soldierAnimArt.js`: the lines for these three looks.

## Implementation decisions
- The Royal Archer keeps his own model (08_Kralovsky_lucistnik).
- The enemy army has no Crossbowman, so there is no enemy sheet for him.
- The crossbow is carried hanging while the figure walks and stands, the way the model holds it. It is raised only to shoot.

## Save/Load impact
None.

## Testing
- `npm test` (soldier-anim).
- Test renders from the side, checking the bow draw and the crossbow aim.
- Browser test map with archers and crossbowmen.

## Notes for the next agent
The GLBs and the .blend files are outside the repo: `/home/claude/work/glb/archer.glb`, `xbow.glb`, `archer.blend`, `xbow.blend`.

To re-render:
1. `python rig-tripo-ranged.py -- archer.glb archer.blend archer`
2. `render-soldier.py -- archer.blend <root>/02_Lucistnik bow --samples 12` (and `--hue 0.15` into the enemy root).
3. `XBOW_TILT=0 XBOW_YAW=-50 XBOW_AIM=-90 render-soldier.py -- xbow.blend <root>/06_Kusnik crossbow --samples 12`
4. `pack-soldier-sheets.py <root> <enemy root> public/assets/characters/villagers src/data/soldierAnimArt.js --only 02_Lucistnik --ver 3` (and the same with `--only 06_Kusnik`).
