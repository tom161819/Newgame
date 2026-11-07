# Studio: horses, wild animals and new vehicles (owner, 7 Nov 2026)

## What and why
The owner asked for horses and more wild animals, and for new versions of the caravan, the wheelbarrow and the horse wagon, with several kinds of each. All of them are proposals in the Studio waiting for approval.
- Animals: horse (bay, chestnut with a blaze, grey, black, pony; saddled, harnessed and galloping), red deer (stag, hind), roe deer (buck, doe), wild boar (boar, piglet, charge), fox, hare and brown bear.
- Wheelbarrow: plank and tub barrows, a hand cart and a sack barrow, empty and loaded.
- Horse wagon: farm wagon, hay wagon, tipping tumbril, timber wagon and a two-horse wagon.
- Merchant caravan, revision 2: striped wagon, house wagon and a long two-horse caravan. The old variants stay in place.

## Files and systems
- studio/src/generators/animal.js: new species on the anatomical skeleton, with hooves, mane, antlers, tusks, long and round ears and a shoulder hump.
- studio/src/generators/props-vehicles.js (new): the `barrow`, `horseWagon` and `caravan` props, imported by workshop.js.
- art/style-guide.json: new materials `antler` and `bone`.
- art/assets/units/{horse,deer,roe,boar,fox,hare,bear,wheelbarrow,horse-wagon}, merchant-caravan, and their sprites.

## Implementation decisions
- The new animals reuse the dog and wolf skeleton, extended by plan settings.
- Vehicles draw their horses with the animal recipe instead of the old shapes.horse.
- The bear has a 2×2 footprint because its attack pose is large.

## Save/Load impact
None. These are art proposals only.

## Testing
- npm test passes.
- validate.mjs passes for all the new assets.
- Sprites were exported and checked by eye.

## Notes for the next agent
- The game still draws a procedural wheelbarrow and wagon in src/game/VehicleViews.js, which belongs to Mechaniky. Hooking up the approved sprites is their task.
- The wild animals have no game objects yet (plannedGameObjectId only).
