# Knight from the owner's Tripo model

## What and why
Owner 20 Nov 2026: "tady je pak nový model rytíře, udělej k němu rig a animace a nasaď ho do hry"
(`knight_warrior_3d_model.glb` from Tripo: one mesh of ~2 850 loose pieces, no skeleton, standing with the sword down in the
right hand and the shield on the left arm). As with the owner's earlier soldier models (16 Nov, deployed straight to the
game), the Knight's sheets are replaced directly.

## Files and systems
- `scripts/blender/rig-tripo-knight.py`: imports the GLB, scales it to 1.7 m, builds the armature with the bone names
  `render-soldier.py` animates (pelvis, spine, head, thigh/shin/foot, upper_arm/forearm/hand .L/.R), weights by distance
  to the two nearest bones, gives whole pieces to the sword hand (`hand.R`) and the shield arm (`forearm.L`) by their
  centre (red tabard pieces never go with the sword: piece colour from the texture), adds the "Army cloth" hue node,
  a style sun and sky, and saves a .blend.
- `scripts/blender/render-soldier.py` (unchanged): 8 facings × 24 columns (idle, walk, sword attack, die, 5 stand-still
  moves), ours and the enemy colour (`--hue 0.15`).
- `scripts/blender/pack-soldier-sheets.py`: `--only <folder>` re-packs one model and replaces just its lines in
  `soldierAnimArt.js`; `--ver` sets the sheet's file version.
- `public/assets/characters/villagers/{army,enemy}-knight.v3.walk.png` replace the v2 sheets; `src/data/soldierAnimArt.js`
  knight entries (frame 206 × 199).

## Implementation decisions
- Weights are computed, not Blender's bone heat: the mesh is many loose pieces, which bone heat handles badly.
- The enemy colour is a hue shift of the whole texture; steel stays grey, only the red tabard and shield turn blue.

## Save/Load impact
None.

## Testing
- `npm test` (soldier-anim: frames, facings, columns).
- Browser (test map): three Knights and three enemy Knights fighting – walk, attack and fall.

## Notes for the next agent
- The GLB is not in the repo (owner's download). Re-render: `python rig-tripo-knight.py -- knight.glb knight.blend 1.7`,
  `render-soldier.py -- knight.blend <root>/01_Rytir sword --samples 24` (and `--hue 0.15` into the enemy root),
  `pack-soldier-sheets.py <root> <enemy root> public/assets/characters/villagers src/data/soldierAnimArt.js --only 01_Rytir --ver 4`.
