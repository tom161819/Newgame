# The grand oak on 2 × 2, lone oaks in new worlds

## What and why
Owner 15 Nov 2026: "velký má 2x2 jinak 1x1, při tvorbě lesa může být někde větší mezera aby mohl vyrůst na 2x2, tam kde není místo tak zůstane ten střední, jinak duby můžou být po mapě i samostatně nebo po 2-3-4 ne jenom ve shlukách". The renders were deployed in 0.131.0; this is the mechanic.

## Files and systems
- `src/data/naturalResources.js` – `GRAND_OAK` (wood 10, ageDays 14, worldShare .14, lone groups), `grandTiles`, `tileHash`, `oakCanSpread`, `oakStartsGrand`, `isGrand`.
- `src/systems/NaturalResourcesSystem.js` – `grandRoom`, `setGrand`, `growGrand` (in `flushGrowth`), `removeTree`, `generateOaks`; `goals` works for four tiles; `flushGrowth({spread})`.
- `src/game/GameScene.js` – `addResource` gives a grand oak its four tiles; `generateOaks()` after all other world generation.
- `src/data/devBalance.js` `devObjectWood`; used by `ForestryWork`, `NaturalResourcesSystem.work`, `FoodStateValidation`, `NaturalResourcePanel`.
- `src/game/TreeView.js` – a grand oak is drawn on the middle of its 2 × 2 (16 px lower) and sorted by that point; map memory keeps `grand`.
- `src/systems/GameStateSerializer.js`, `MapMemoryValidation.js`, `MapMemoryRenderer.js` – optional `grand: true`.
- Tests: `tests/oak-renders.test.js`; `tests/helpers/workerScene.js` (four tiles for a grand oak).

## Implementation decisions
- **State.** One optional field on the tree: `natural.grand = true` (only oak, only stage 3). The tree object keeps its tile as the anchor; the three extra tiles are x+1, y+1. `object.tiles` has four tiles, so the existing occupancy and blocking code (`restoreTiles`, `refreshOccupancy`, site obstacles) works unchanged.
- **Growing.** A grown oak at least 14 days old tries once per day of its age (`object.grandTry`, not saved). Room = three plain fertile tiles with nothing on them, no plan, no unit (the `reserved()` set covers King, people, animals, buildings, drops), no path wear, and `blockKeepsReach` says nobody is cut off. If only a full flood could tell, the oak does not spread (cheap and safe).
- **Half of the oaks** can spread (`oakCanSpread`, a fixed hash of the tile). Otherwise every forest edge would turn into big oaks.
- **Felling.** `setGrand(false)` first, then the usual stump/sapling on the anchor tile. Wood: 10 (Dev tool factor applies). The Woodcutter carries one load, the rest stays for Haulers (existing rule for more than one load).
- **Saving never spreads an oak** (`flushGrowth({spread:false})` in the serializer and `exportState`), so a save and its reload are identical.
- **World.** `generateOaks` runs after trees, minerals, start quarry and iron mine and uses its own number sequence, so everything else in a world code stays where it was. Lone groups keep 6 tiles from any tree and 4 tiles from deposits. Oaks picked by `oakStartsGrand` lose the trees on their three tiles (the gap) and start grand.
- Reachability uses the King's tile as origin, like tree growth always did. While the King is closed in somewhere, oaks do not spread that day.

## Save/Load impact
Optional field `grand` on oak resources and in remembered tree visuals. Save version stays 62 (older saves load unchanged; their oaks spread over time where there is room).

## Testing
- Full suite; five tests in `tests/oak-renders.test.js` (spread, block, goals, wood, save/load, felling, no room, world).
- Browser: a new world (141 oaks, 18 grand, 23 in lone groups, save validates); owner-style save with oaks spreading; pictures in summer, autumn and winter checked.

## Notes for the next agent
- Open question for the owner: wood of the grand oak (10 now) and the share that can spread (half now).
- A building plan over any of the four tiles marks the oak for felling like a normal tree.
- Winter picture of the grand oak is the old bare oak scaled 1.6 (a bit soft) until the owner's season renders arrive.
