# Day and night N3b: wolves

## What and why
Second part of plan item `m-noc-n3-hrozby` (brief `zadani-den-noc.md`, N3, "Vlci"). Nights get a real danger:
- wolf packs that avoid fire;
- the reason to light the village, build campfires on expeditions and keep soldiers on watch.

## Files and systems
- `src/data/nightThreats.js` `wolves`:
  - chance per season (spring .35, summer .25, autumn .4, winter .7);
  - pack 2–4, spawn 28+ tiles from the King and houses within 4 tiles of the map edge;
  - hunt range 40, "near the houses" 12;
  - flee from 3 soldiers within 4 tiles;
  - repath 400 ms; leave within 40 s after dawn.
- `src/data/objects/animals.js`: `wolf` (HP 45, DPS 8, speed 1.6, meat 2, `nightPredator`), provisional procedural look
  and icon.
- Never in the world generation or the wildlife respawn: `animalInitialCount` returns 0 and `WildlifeRespawnSystem`
  filters `nightPredator`.
- `src/systems/NightThreatSystem.js`:
  - `spawnWolves(day)`: one roll per night when the night starts, if switched on;
  - `leadsWolf(wolf, delta)`, called by `AnimalSystem` for every wolf:
    - leave at dawn;
    - flee from soldiers;
    - step out of light;
    - pick the nearest prey outdoors and out of light;
    - attack via `CombatSystem`;
    - give up a target when the way leads through light.
  - `checkWolvesNear` sends one notice and sets `wolvesNear`.
  - Save: `wolfDay`.
- `src/game/GameScene.js`: `dayNight.attention()` is also true while wolves are near the houses.
- Tests in `tests/night-threats.test.js`. Smoke `scripts/wolves-smoke.mjs` (`--wolves`).

## Implementation decisions
- **Prey:**
  - wild animals, the King on the ground, and residents who are not asleep inside a house;
  - children are indoors at night;
  - dogs and cats are not prey yet: they live outside the combat system (DomesticAnimalSystem). Wolves at the hunter's
    lodge or by a cat's building can come later.
- **Light:**
  - "In light" means within a burning flame light (`dayNight.flameLights()` without hand torches);
  - a lone torch bearer stays a target, as the brief says.
- **Fighting back:** wolves are huntable. A resident who is attacked fights back by the existing rules (soldiers fight
  at once); hunters can hunt them for 2 meat.
- **Save:** wolves are ordinary animals in the save. After Load at night they go on hunting, and at dawn they leave.

## Save/Load impact
`nightThreats.wolfDay` is added. The schema stays 57: saves from 0.43.0 have no `wolfDay` and still load (it is
optional; a missing day just allows tonight's roll).

## Testing
- `npm test` (981 pass), new tests:
  - no wolves at world start or respawn; a pack at the edge at night; one pack a night; switched off = none;
  - a wolf hunts and attacks a resident; stays out of a torch's light; runs from three soldiers; gone after dawn;
  - one notice near the houses; saved `wolfDay`.
- `npm run smoke -- --current-only --wolves`: a pack at night, none in the light, gone after dawn.

## Notes for the next agent
- Wolf art (walk/run/attack, 8 directions) comes from `g-noc-grafika`. Switch the wolf to sprites when it is approved.
- Thieves (N3c) and fires (N3d) are still to do in `m-noc-n3-hrozby`.
