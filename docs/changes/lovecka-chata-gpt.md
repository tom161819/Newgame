# GPT hunting hut in the Asset Studio

## What and why
The owner sent the Hunting Lodge as a GPT turnaround sheet for review in the Asset Studio.

## Files and systems
- `art/assets/buildings/hunting-lodge/asset.json`: variants `hunting-lodge-gpt-{0,90,180,270}`.
- `art/sprites/hunting-lodge/hunting-lodge-gpt-*.v1.*`: scale 0.287 (door ≈ 167 px in the cut-out → ≈ 48 px), fits the 2 × 2 footprint; lantern as a game light on the 0° view.
- `scripts/gpt-ground-rim.py`: new pass after the grade — the light outer band of a painted ground patch (warm, pale, lowest 40 %, up to 14 px from the outside) becomes a faint shadow, so the patch blends into the grass.
- `scripts/studio-smoke.mjs`: checks the four cards.

## Implementation decisions
- Backdrop in the cage trap and the basket trap removed with the strict smooth-backdrop test (as for the fishing hut); antlers, hide and map stay.

## Save/Load impact
None.

## Testing
`node --test tests/asset-studio*.test.js`, `npm run studio:smoke`.

## Notes for the next agent
Run `scripts/gpt-ground-rim.py` on future GPT buildings that come with a painted light ground patch.
