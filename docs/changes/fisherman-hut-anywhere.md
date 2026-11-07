# Fisherman's Hut anywhere (0.32.0)

## What and why
Plan task m-rybarska-chata-kdekoli (owner request, 7 Nov). Changes the Fishing R1 rule (0.15.0): the hut no longer has to touch water and Fishers no longer stay within 8 tiles.

## Files and systems
- `src/game/buildings.js` – the "Must be built next to water" placement error is gone.
- `src/systems/FishingSystem.js`:
  - `shoreFrom(starts)`: one breadth-first search over walkable tiles. It returns every reachable shore tile with its walking distance, nearest first.
  - `spots(hut)` uses it from the hut's door tiles, cached per hut until the map topology or the building count changes, or for at most 10 s of game time.
  - `distance(hut)`, `previewDistance(anchor, definition)`.
  - `hutBody` = the most common body among the nearest 12 spots.
  - The Fisher offers the nearest 12 free spots (not overfished, not reserved) to the path search. Reservations still keep two Fishers off one tile.
  - The summary starts with "Water: N tiles away".
- `src/data/fishing.js` – `radius` removed; `nearestSpots: 12`, `spotCacheMs: 10000`.
- `src/data/objects/buildings.js` – `fishing:{}`, new description (en/cs object strings).
- `src/systems/ProductionDiagnostics.js` – `noWater` issue for a finished hut with no reachable shore (notice + sign via `IssueIcons`).
- `src/game/GameScene.js` – the placement status adds "Water N tiles away" / "No reachable water nearby" for the hut.
- i18n: `fishing.water`, `fishing.previewWater`, `fishing.previewNoWater`, `fishing.noWater` = "No reachable water", `notice.noWater`.
- Tests: `tests/fishing.test.js` (placement anywhere; nearest-first distances; a hut 20 tiles away still fishes but catches fewer than one by the water; two Fishers on different spots; no water → no spots, the Fisher waits, `noWater` issue). Smoke `--fishing` now builds the hut 15–25 tiles' walk from water.

## Implementation decisions
- Distances are 4-neighbour walking steps from the hut's door tiles, close to the real path length. The real route is still found by the existing path search, but only among the nearest 12 free spots, so a hut with hundreds of reachable shore tiles stays cheap.
- No extra penalty for distance: fewer fish come only from the longer walks (one basket per trip).

## Save/Load impact
None (spots are derived; fish stocks unchanged).

## Testing
`npm test`, smoke `--fishing` (hut 16 tiles from water, 5 fish delivered).

## Notes for the next agent
- The 10 s spot cache is per hut; if many huts appear on a big map and the frame time rises, key the cache on a map revision only.
