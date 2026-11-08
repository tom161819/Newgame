# Studio revision: Fire Lab, realistic horses, proportionate boar

## What and why
This change answers the owner's Studio review of 7 Nov, late evening.

- **Fire on a roof.** Owner's note: "a full rework of fire and smoke, a separate Studio section where I put a building, start a fire and tune it, more realistic".
  - A new page, **Fire Lab** (fire-lab.html), linked from every Studio page.
  - **What it shows:**
    - any exported building sprite on the ground;
    - day, dusk and night scenes, at 1×, 2× and 3×;
    - Ignite, Put out and Reset buttons;
    - fire spots, which the owner clicks onto the building; without them, spots are placed automatically along the roof line;
    - fire that spreads from the middle of the roof outwards.
  - **Particle system:**
    - Flames are additive soft blobs. They cool from white-yellow through orange to deep red while they rise and narrow, with turbulence and wind.
    - Smoke is a soft grey plume that grows, darkens with the fire and drifts downwind.
    - Embers are sparks thrown up and blown away.
    - A flickering glow lights the walls and the ground, and the building chars where it burns.
  - **15 parameters**, plus presets: Smouldering, Burning, Blaze and Dying out.
  - **Saving:** named settings go to the page database (collection `fireSettings`). One setting can be proposed for the game (`fireProposal/proposal`); Claude takes it over on „revize“.
  - The roof-fire sprites stay as they are, as the old approach for comparison.
- **Horses, revision 3.** Owner: "a realistic hand-painted look, not low-poly; muscular, natural head and neck, slim legs with hooves, detailed mane and tail, soft gradients; for all horses, the horse wagons and the merchant caravans".
  - Muscle masses over the skeleton: shoulder, forearm, croup and gaskin.
  - Slim cannon bones.
  - Cheeks, nostrils and a soft muzzle.
  - Mane, forelock and tail as hanging strands.
  - A lighter sheen along the back and a darker belly.
  - Dark points on bays and duns.
  - The merchant's old wagon variants now use the same horse (props.js `wagon`).
- **Boar, revision 3.** Owner: "the head is too long, make the proportions accurate".
  - A big wedge head about a third of the body.
  - A short disc snout, carried low.
  - Deep, heavy forequarters.

## Files and systems
- studio/fire-lab.html, studio/src/fire-lab/{main.js, fire.js, fire-lab.css}
- studio/vite.config.js
- the Studio pages' navigation
- studio/src/generators/animal.js and props.js
- the horse, horse-wagon, merchant-caravan and boar assets and their sprites
- art/approvals.json

## Implementation decisions
- The fire runs on canvas 2D with particles, so the game can reuse fire.js for its own fire effect.
- Randomness is seeded and deterministic.
- At most 1500 flame particles are kept alive at once.

## Save/Load impact
None.

## Testing
- npm test passes (992 tests).
- The Fire Lab was checked in a browser with screenshots of each preset.
- The sprites were checked at 4–5× zoom.

## Notes for the next agent
- At game sprite size (a 64 px tile), "hand-painted" detail is limited by resolution.
- If the owner wants more, the next step is rendering at 2× with a painterly post-process, or the Blender pipeline from the Blender pilot brief.
