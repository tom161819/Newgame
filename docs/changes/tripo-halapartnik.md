# Tripo Halberdier with combat moves

## What and why
Owner 20 Nov 2026: "tady je model halapartníka" (a Tripo GLB). Same treatment as the Knight: rig, animations, the game.
The owner asked earlier for varied fighting ("víc druhů útoků, obranu"), so the Halberdier also gets several moves.

## Files and systems
- `scripts/blender/rig-tripo-halberdier.py <glb> <blend> 2.0`: one-mesh rig with the bone names `render-soldier.py`
  animates. Weights: inverse distance to the bones, each loose piece limited to its three nearest bones. The halberd
  (every vertex near the shaft line plus the blade) goes with `hand.R`. The body column (red tabard, everything below the
  hands and behind the forearm line) never goes with the forearms or hands: the left forearm lies across the belly and
  carried the tabard away with it.
- `scripts/blender/render-soldier.py --combat` with kind `halberd`: `attack2` two-handed thrust (5 frames, lunge),
  `attack3` sweep (5 frames, body twist), `block` (3 frames: shaft held across the body). The base `attack` stays the
  overhead chop. 37 columns in all.
- `public/assets/characters/villagers/army-halberdier.v3.walk.png`; `soldierAnimArt.js` halberdier line.
- `tests/soldier-anim.test.js`: the halberdier's moves.

## Implementation decisions
- 37 columns, not 47 like the Knight: the long shaft makes wide frames (234 × 178), so the sheet is 17 per row,
  3978 × 3204, and must stay under 4096 px. Shorter moves are fine: `combatColumn` holds a move's last frame.
- No enemy Halberdier: the enemy army has no such unit.
- The left hand is a separate bone and is posed to stay near the shaft; it does not follow it exactly.

## Save/Load impact
None.

## Testing
- `npm test`.
- Renders checked from the side and the back (thrust, sweep, guard); browser test map with Halberdiers fighting.

## Notes for the next agent
- The source GLB and the rigged .blend are outside the repo (`/home/claude/work/glb/halberd.glb`, `halberd.blend`).
- The joint table in the rig script is in the model's units (1.0 tall including the halberd).
