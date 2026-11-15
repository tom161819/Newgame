# Oaks in the wind

## What and why
Owner 15 Nov 2026, 05:47: the oaks should move – when felled as now, and in the wind. Keep the model, textures, scale and proportions exactly; the trunk almost still; main branches bend a little, small branches and leaves more; natural and uneven, not the whole crown swinging in step; each tree a random time offset; far trees may use the still picture.

## Files and systems
- `scripts/oak-wind.py` (new) – makes the wind frames from the approved season oaks (2x exports, warped, scaled down; frame 0 is the 1x picture itself). One sheet per look and season: rows = the four views, 12 frames, a common anchor. Writes `src/data/objects/oakWind.js`.
- `public/assets/resources/oak_tree/wind/*.png` – 12 sheets (≈17 MB together; loaded only when a tree of that look and season is close on screen).
- `src/render/oakWind.js` (new) – tracking of live oaks, lazy sheet loading, the per-scene update: frame by time with the tree's own phase and pace.
- `src/game/TreeView.js` – `showWind`, `stopWind`, tracking, hit test uses the frame.
- Tests: `tests/oak-wind.test.js`.

## Implementation decisions
- **2D warp of the approved pictures** instead of a new render: the owner's Blender files are not usable here (no Blender), and a warp keeps colours, texture and proportions exactly. The shift grows with the height above the foot (trunk ≈ 0); a smooth sway plus a gust that travels up the crown bends it (≈ 3 px at the top of the big oak); a moving noise field adds leaf flutter (≈ 1.5 px), stronger on leaf-coloured pixels.
- **Not in step**: phase and pace (0.85–1.15) come from a hash of the tile, so they stay the same after loading.
- **Far trees still**: only oaks inside the camera view (plus a margin) at zoom ≥ 0.7 animate; the rest show the approved picture. Trees remembered under the fog never move.
- 12 frames over 3.2 s (about 4 frames a second): the shifts are small, so the steps do not show.
- Felling keeps its shiver (rotation of the whole tree).

## Save/Load impact
None.

## Testing
Full suite; browser harness /tmp/perfdiag/wind.mjs: 40 oaks animating at zoom 1.6 with different frames, none at zoom 0.5, frame rate unchanged within noise.

## Notes for the next agent
If the season pictures change, run `python3 scripts/oak-wind.py` again. Pines could get the same treatment.
