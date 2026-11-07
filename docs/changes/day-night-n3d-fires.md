# Day and night N3d: fires and firefighting

## What and why
Last part of plan item `m-noc-n3-hrozby` (brief `zadani-den-noc.md`, N3, "Požár"). Light has a price:
- flames near wooden buildings can start a fire;
- residents fight it with buckets;
- the Well (D2) gets its first function.

## Files and systems
- `src/data/nightThreats.js` `fires`:
  - chance 2 % a night within 2 tiles of a flame; Drought ×2, Rainy ×0.3, Winter ×0.5;
  - burns down in 0.25 of a day at full intensity; regrows 2 per second; a bucket takes 15;
  - spread check every 5 s at 15 %;
  - 6 helpers within 15 tiles; 1 s to fill, 0.8 s to throw; starts at intensity 60.
- `burnt_ruins` (2×2, approved `burnt-building-timber`) in `src/data/objects/lighting.js`.
- `src/systems/NightThreatSystem.js`:
  - `flammable(b)`: more Wood than Stone in the cost, never the castle, towers, walls, gates, light places or ruins;
    `flammable` in a definition overrides it;
  - `igniteFires(day)`: one roll per building a night, at nightfall;
  - `ignite`, `updateFires(delta)`: growth, damage, spread;
  - `burnDown`: goods burn, workers are dismissed, the building is removed, 2×2 ruins stay;
  - `waterGoals`: the nearest Well within 25 tiles, otherwise a shore;
  - `firefight(worker, delta)`: walk to water, fill, walk to the fire, throw.
  - Save: `fireDay`, `fires` (optional, schema 57).
- `src/systems/WorkerAI.js`: firefighting runs before the worker's own step (it also wakes a resting resident).
- `src/game/FireViews.js`: provisional flames and smoke on the roof, and the fire's glow in the light map.
- `src/game/GameScene.js`: `dayNight.attention()` is true while anything burns.
- Texts in both languages. Tests in `tests/night-threats.test.js`. Smoke `scripts/fire-smoke.mjs` (`--fire`).

## Implementation decisions
- **Helpers:** only residents with free hands help (no task, no cargo), so deliveries and reservations are never cut
  off. Firefighting is not saved per worker; after Load the residents take up the buckets again.
- **Well vs shore:** the trips decide the speed (a Well beside the house means short trips). There is no separate
  bonus.
- **Ruins:**
  - a 1×1 building (haystack) burns away without ruins;
  - larger buildings leave 2×2 ruins at their corner;
  - the ruins are an ordinary building, so they can be demolished.

## Save/Load impact
Optional `nightThreats.fireDay` and `fires`. SAVE_VERSION stays 57, and older saves of the 57 line load.

## Testing
- `npm test` (986 pass), new test:
  - wooden vs stone; weather risk;
  - set alight by a torch; put out by two residents with a Well;
  - burnt down to ruins; switched off = none.
- `npm run smoke -- --current-only --fire`:
  - a House on fire at night with flames and a notice;
  - residents with buckets from a Well put it out;
  - screenshot `fire.png`.

## Notes for the next agent
- The firefighter with a bucket and the fire loop art come with `g-noc-grafika`. Replace the drawing in
  `FireViews.update`.
- N3 is complete with this part (switches and campfire in 0.43.0, wolves 0.44.0, thieves 0.45.0, fires 0.46.0).
