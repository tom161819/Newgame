# Studio revision: wild animals, horses, wheelbarrow loads and horse wagons (owner, 7 Nov 2026 evening)

## What and why
The owner's review of the first wild-animal and vehicle batch.
- **Animals** (horse, deer, roe, boar, fox, hare, bear), note: "more realistic, more variants". They were remade and given new looks:
  - horse: palomino, dun, piebald, dapple grey and draught;
  - deer: pricket, calf and a running hind;
  - roe: fawn and a running buck;
  - boar: a sow; the boar itself was rebuilt as a real wild boar, low with a wedge head ("tohle je nějakej pakun");
  - fox: pale and cross fox;
  - hare: grey and white hare, and a running hare;
  - bear: dark, grizzled and a cub.
- **Wheelbarrow:** the plank barrow (empty) is approved. The note "load the barrow more and make it with each material" brought heaped loads: stone, wood, iron ore, iron bars, fish, meat, bread and a mixed load.
- **Horse wagon**, note: "more realistic, more variants, use the new horses".
  - Every wagon got plank seams, corner stakes, iron fittings and leather traces, and uses the revised horses.
  - New variants: farm wagon with firewood, covered wagon, ore cart and a two-draught-horse wagon.
  - The tipping tumbril was rejected and removed.
- The owner's notes are now standing art rules for every future design.

## Files and systems
- studio/src/generators/animal.js:
  - new plans (draught, fawn, cub);
  - new plan knobs: legK, socks, hips, hindK, skullH and skullW, wedge with headDown, ridge, feather, muzzle;
  - new breed markings.
- studio/src/generators/props-vehicles.js: heaped loads, new load kinds, carpentry details, traces, and the covered and ore kinds.
- art/style-guide.json: new materials bread, bread_crust, meat, meat_raw and fish.
- Assets, sprites, art/approvals.json.

## Implementation decisions
- Horses and boars now have a 2×2 footprint, because they are realistic in size.
- Approved dogs and wolves are unchanged: their sprite hashes are identical.

## Save/Load impact
None.

## Testing
- npm test passes (992 tests).
- validate.mjs passes for all the changed assets.
- Sprites were checked at 5× zoom.

## Notes for the next agent
Hooking up the approved wheelbarrow in src/game/VehicleViews.js is a task for Mechaniky. The game needs a barrow sprite for each load material.
