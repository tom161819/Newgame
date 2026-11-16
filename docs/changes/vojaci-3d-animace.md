# The owner's 3D soldiers with animations (0.143.5)

## What and why
Owner 16 Nov 2026 sent `Medieval_Kingdom_Vojaci_3D.zip` (four rigged Blender figures: Rytíř, Lučištník, Šermíř, Branec) with "deploy them straight into the game and make the animations". The owner made the models and asked for them in the game directly, so they skip the Studio review; the animation poses are ours.

## Files and systems
- `scripts/blender/render-soldier.py`: opens a model with the `bpy` module (Blender 4.3, `python3.11`), sets the game camera (2:1, elevation 30°, azimuth 45°, 30 px/m, 3× supersample, Cycles 12 samples + denoise) and renders 8 facings × 19 columns: idle, walk 0–7, attack 0–6 (`sword` swing, `spear` overhand thrust, `bow` draw and release), die 0–3 (knees give, falls on his back). Poses are FK rotations of the shared bone names about the figure's axes; the owner's lights stay, the armature turns.
- `scripts/blender/pack-soldier-sheets.py`: reduces to 1×, crops all frames of a model to one box, writes `public/assets/characters/villagers/army-<rank>.v1.walk.png` and generates `src/data/soldierAnimArt.js` (`SOLDIER_ANIM_ART`, `SOLDIER_ANIM_LOOKS`).
- `approvedArt.js`: `militaryLook` returns the rank's animated look; `soldierFrame` picks attack > walk > idle.
- `HumanView`: looks with `anim` step through `soldierFrame`; `setAttackPose` sets `attacking`, faces the target and plays the attack loop; `playDeath` leaves a fading body playing the fall frames. `GameScene` calls it only for a death in fight, not for leaving or the Test map's removal.

## Implementation decisions
One look per rank for men and women (the owner sent four figures). Mapping: Knight → Rytíř, Archer → Lučištník, Swordsman → Šermíř, Recruit (soldier) → Branec. The old painted looks stay in the data for the Studio.

## Save/Load impact
None.

## Testing
tests/soldier-anim.test.js (looks, sheet sizes, frame choice); npm test; browser on the Test map: soldiers walk, fight and fall.

## Notes for the next agent
Re-render: `python3.11 -m pip install bpy==4.3.0`, then `python3.11 scripts/blender/render-soldier.py -- <model>.blend <dir> sword|spear|bow` per model and `python3 scripts/blender/pack-soldier-sheets.py <root> public/assets/characters/villagers src/data/soldierAnimArt.js`. The army colour can be changed in the models (node "Army cloth", Hue) for enemy armies.
