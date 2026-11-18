# The owner's five new 3D soldiers (0.146.0)

## What and why
Owner 18 Nov 2026 sent `Medieval_Kingdom_Vojaci_5_trid_3D.zip` ("tady je balíček modelů nových jednotek"): rigged Blender figures for the Soldier (Voják), Crossbowman (Kušník), Halberdier (Halapartník), Royal Archer (Královský lučištník) and Light Cavalry (Lehký jezdec, with a rigged horse). Like the first four (0.143.5) they go into the game directly; the animation poses are ours.

## Files and systems
- `scripts/blender/render-soldier.py`: new attack kinds `crossbow` (raises the crossbow level to the shoulder, aims, kicks, lowers to span), `halberd` (winds back and chops the head down in front) and `cavalry` (the rider's sword swing, the horse tosses its head). For the cavalry the horse rig (`Rig_Kun`) is the one turned to each facing (the rider follows it through Child Of); the horse trots in the walk frames, folds its legs and rolls on its side in the fall, lowers its head, swishes its tail or paws the ground standing. `--to` renders up to a column; `XBOW_TILT` sets the crossbow's level.
- `scripts/blender/pack-soldier-sheets.py`: nine figures. `05_Vojak` dresses the trained Soldier (`army-soldier`); the Branec (`army-recruit`) now dresses untrained Recruits (unit key `recruit`); the enemy soldier keeps the Branec.
- `src/data/soldierAnimArt.js` regenerated; `public/assets/characters/villagers/army-{soldier,crossbowman,halberdier,royal-archer,light-cavalry}.v2.walk.png`.
- `HumanView.updateLook`: a soldier without a unit type is a Recruit and wears `militaryLook('recruit')`.

## Implementation decisions
- The Light Cavalry sheet includes the horse, so the rider needs no separate horse figure (his Stables horse stays reserved as before).
- The new units have no enemy versions yet (the enemy army keeps its four ranks).
- Rendered at 10 Cycles samples (the first four used 16); the difference is not visible at game size.

## Save/Load impact
None.

## Testing
`tests/soldier-anim.test.js`: all nine looks, sheet sizes and frame layout. Browser on the Test map: each new unit walks, attacks and falls.

## Notes for the next agent
Re-render one model: `python3.11 scripts/blender/render-soldier.py -- <model>.blend <root>/<folder> sword|spear|bow|crossbow|halberd|cavalry --samples 10`, then `python3 scripts/blender/pack-soldier-sheets.py <root> <enemy root> public/assets/characters/villagers src/data/soldierAnimArt.js` (the root needs all nine folders; the first four renders were in /tmp/rend and /tmp/rend-enemy).
