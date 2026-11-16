# Bandit camp, ruins and an abandoned mine with its inside (0.142.2)

## What and why
Owner 16 Nov 2026: "let there also be a bandit camp, crumbling ruins with a treasure, and an abandoned mine you can enter after exploring it, like a dungeon" (m-mapa-kraje).

## Files and systems
- `src/data/scouting.js`: zone types `bandits`, `ruins`, `mine`.
- `src/game/zoneFeatures.js` (new): `shapeZoneWorld(world, zone, random)` changes the generated world before it is drawn (camp clearing; ruins: rock-tile walls with gaps and doors; mine: a rock hill with an entrance; dungeon: all rock with rooms joined by two-tile corridors) and returns the feature (chests with gold, bandit and rat spots, entrance).
- `src/game/zoneMode.js`: rewritten around `z.records` (the party carried from map to map), `collectParty`, `nextMap` (into the mine and out), `populateZone` (chests through `TreasureSystem.create` with gold only, bandits, rats, a dark mouth at the entrance), auto-loot by any party member next to a chest, `z.loot`, `z.taken`, `z.cleared`, banner buttons Enter the mine / Leave the mine.
- `GameApplication.enterMine/leaveMine`. `GameScene`: `scene.zoneFeature`, no default treasure in a zone, no wildlife in the mine, `zoneLook` for trees and deposits (mine inside: iron × 3).
- New animals `bandit` (renderer `bandit`, `BanditView` – provisional procedural figure) and `cave_rat` with `gameplay.guardRadius` (AnimalSystem attacks the nearest party member within it) and `zoneOnly` (never spawned by the world or wildlife respawn).
- `ScoutingSystem`: party `loot.gold` paid into the treasury on arrival; zones remember `taken` chests and `cleared` camps (validated).

## Implementation decisions
Ruins and mine walls are rock tiles (provisional look, rock mounds); approved ruin and camp art can replace them later. The mine inside is a third map, swapped like the land itself; time runs on from the land.

## Save/Load impact
SAVE_VERSION unchanged; optional `scouting.zones.<id>.taken|cleared` and `scouting.party.loot`.

## Testing
tests/scouting.test.js (features, validation, loot in homeAfterZone); browser: bandits attack and wound a soldier, ruins chest 300 gold taken and brought home, mine entrance → inside (8 rooms, 2 chests, rats) → out to the entrance → home, no errors.

## Notes for the next agent
Bandit loot is the chest only; tents, a fire and real ruin/camp/mine art are still to come. Zone changes other than taken chests and a beaten camp are not kept.
