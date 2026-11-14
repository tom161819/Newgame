# Well and Fountain: the ground cut repaired (v2)

## What and why
Owner, 14 Nov 2026: the base of the Fountain and the Well is cut poorly, pieces of texture are missing. In v1 the flood that removed the dirt also ran into the dark joints between stones and left notches and a ragged rim; in the 180° and 270° views whole pieces of shaded stone were gone.

## Files and systems
- `art/sprites/well/well-render-*.v2.*`, `art/sprites/fountain/fountain-render-*.v2.*` (v1 files removed); `art/assets/decorations/{well,fountain}/asset.json`; `art/approvals.json` (version 2).
- `src/data/objects/approvedArt.js`, `public/assets/buildings/{well,fountain}/*-render-0.v2.png`.

## Implementation decisions
- Ground = saturation (9 px median) over 0.40, or over 0.32 when bright; shaded stone reaches 0.35 but is dark.
- After the flood the kept shape is closed (7 px), holes filled, strongly orange pixels dropped, spikes opened away in the lower part, the rim smoothed. Original pixels are used inside the shape.
- New file names (v2) so no browser shows a cached v1.

## Save/Load impact
None.

## Testing
- All eight views checked on a magenta background by eye; Studio tests; full suite.

## Notes for the next agent
- The cutter is `/tmp/wf/cut.py` (workspace only): `cut.py in.png out.png <first row where ground may be>`.
