# World v2 step 1: seeded worlds, the world code and World choices in New Game (#100, plan m-svet-kod-sveta, 7 Nov 2026)

## What and why
The first step of World v2, approved by the owner on 7 Nov (brief `zadani-svet-v2.md`, step 1a). Every new game's starting world now comes from a **world code** such as `MKW1-155515555555-7KQ9X2`. It holds the generator version, one digit per world setting, and a base36 seed. The same code always gives the same world, so a world can be shared or replayed. The Studio's World Lab (`g-world-lab`, Grafika) will import the same generator and `worldCode.js`.

## Files and systems
- `src/data/worldCode.js` (new):
  - constants: `WORLD_GENERATOR_VERSION = 1`, `WORLD_SETTINGS` (12 settings in code order, level ranges, descriptions), `DEFAULT_WORLD_LEVELS`;
  - functions: `encodeWorldCode`, `decodeWorldCode` (errors "Invalid world code" and "This world code is for generator version N; this build uses version M."), `settingsFromLevels`, `randomWorldCode`, and the simple choices `WORLD_PRESETS` / `applyPresets` / `presetsFromLevels`.
- `src/game/seededRandom.js` (new): `worldRandom(seed, part)` / `worldStreams(seed)`, built on sfc32 with a hash of `seed:part`. Each part of the world has its own stream, so adding a part never shifts the others.
- `src/game/worldGeneration.js` and `src/game/map.js`: `generateWorld(random, {levels, streams})` uses one stream per part. Separate streams are used for rocks, the river, each lake, the desert and the bushes. `createMap` takes the number of rock outcrops.
- `src/game/GameScene.js`:
  - A new game picks or uses `gameSettings.worldCode` and draws everything it places at the start from named streams:
    - `resource:<id>` and `resource-fill:<id>` (loose stones and other spawned resources);
    - `trees` (count from the Forest setting) and `minerals`;
    - `animals`, `treasures` (positions and chest gold);
    - `villagers` (the first villagers' tiles; they also decide where trees may stand).
  - `startWorldFingerprint` / `worldFingerprint()` hash the starting world (terrain, water, bushes, resources, animals, chests), with a hash per part.
- `src/systems/WorkerSystem.js`: `spawnInitial(random)`.
- `src/systems/GameSettings.js`: `worldCode` (null or a valid code of this generator).
- `src/systems/GameStateSerializer.js`: `SAVE_VERSION` 50. The code is saved in `gameSettings`.
- `src/ui/NewGameSetup.js`, `index.html`, `src/style.css`, i18n en/cs:
  - New Game Setup has a **World** section: the World code field (a fresh random code is proposed; empty means random), **New seed**, **Copy**, and the Water (Low / Normal / High), Desert (Off / On) and Forest (Sparse / Normal / Dense) choices.
  - The code updates live. A code with other levels shows **Custom**, and a broken code shows the error and does not start.
- `src/ui/GameApplication.js`: the game menu shows the world code with **Copy world code**.
- `scripts/world-sync.mjs` (`npm run world:sync -- <file>`): "převzít svět" for the Studio's `worldDefaults`. `AGENTS.md` item 11 describes the steps.
- Tests:
  - `tests/world-code.test.js` (5);
  - the settings test now covers `worldCode`.
  - `scripts/world-code-smoke.mjs` (`--world-code`).

## Implementation decisions
- **Level meanings (generator 1).** Level 5 (or the listed default) is exactly the 0.14.0 value. Levels scale the 0.14.0 numbers in `WORLD_GENERATION`:

  | Setting | Effect of the level |
  |---|---|
  | rivers | 0/1 |
  | river width | ×0.6–1.4 |
  | meanders | ×0–1.8 |
  | fords (spacing) | ×1.8–0.55 |
  | lakes | 0–3 |
  | desert | 0 = none, 1–9 = ×0.6–1.4 radius |
  | sandy banks (beach width) | ×0–1.8 |
  | bank vegetation | bushes removed by the water below 5, extra clusters along the water above 5 |
  | forest | ×0.15–1.9 of 200 trees |
  | rocks | ×0.2–1.8 of 65 outcrops |
  | bushes | ×0–2 of 26 clusters |
  | grass zone scale | reserved; no effect until generator 2 |

  The default code is `MKW1-155515555555-<seed>`.
- **Simple choices.** Water sets rivers, river width and lakes (Low 3/0 lakes, Normal 5/1, High 8/3). Desert sets 0 or 5, and Forest sets 2, 5 or 8, as the brief says. If a choice's own level is outside its options, that choice shows Custom. If any other setting differs from the default, all three show Custom.
- **The same world from the same code.** Two New Games with the same pasted code give identical terrain, water, bushes and start fingerprint (resources, animals, chests). The browser smoke checks this, and a different seed gives a different fingerprint.
  - Seeding the first villagers was needed: their tiles are reserved while trees are placed, so random villager positions changed the forest.
- **Unchanged.**
  - The start position (castle and stockpile) is fixed, as before, and is therefore the same for every code.
  - Randomness during play stays random: respawns, weather, caravans, wander timers, villagers' talents.
  - Without `streams`, `generateWorld(random)` draws everything from one `random` in the 0.14.0 order, so the existing seeded tests are unaffected.
- **Statistics.** With the default levels, average water, desert and bushes over 25 worlds stay within 20 % of the 0.14.0 generator. Every one of the 25 worlds has > 99 % of walkable tiles reachable and a clear start.
- **world:sync.**
  - Takes a proposal object or a list (the newest valid one wins).
  - Rewrites only the `DEFAULT_WORLD_LEVELS` line.
  - Reports applied (per setting from → to), ignored (with the reason) and remove (documents to delete from the Studio afterwards).

## Save/Load impact
`SAVE_VERSION` goes from 49 to 50. `gameSettings.worldCode` is saved and validated (null or a valid code of generator 1). The world itself is still saved as before (terrain, ground, bushes, objects), so loading never regenerates it.

## Testing
- `npm test` passes (902).
- `npm run smoke -- --current-only --world --world-code --background` passes.
- Screenshots of the World section and the game menu were checked.

## Notes for the next agent
- Step 2 (`m-svet-revize-generatoru`) must raise `WORLD_GENERATOR_VERSION` to 2, add new settings only at the end, and give "grass zone scale" its meaning.
- A new part of the starting world must take its own stream from `scene.worldRandom('<part>')`. Never use `Math.random`, or the same code stops giving the same world (the smoke catches it).
- The Studio imports `generateWorld`, `worldCode.js` and `seededRandom.js` read-only.
