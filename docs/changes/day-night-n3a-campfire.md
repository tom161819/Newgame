# Day and night N3a: threat switches and the campfire

## What and why
First part of plan item `m-noc-n3-hrozby` (brief `zadani-den-noc.md`, N3). N3 is large, so it ships in parts:
- N3a: threat switches and the campfire;
- then wolves, thieves and fires.

The owner wants every threat to be switchable, and a campfire that can be lit anywhere so that people on an expedition
are safe from wolves at night.

## Files and systems
- `src/data/nightThreats.js`: threat ids, campfire rules (wood within 6 tiles, radius 5, ashes for 1 day).
- `src/systems/GameSettings.js`: `nightWolves`, `nightThieves`, `nightFires` (default true). Setup switches are in
  `index.html` and `NewGameSetup`.
- `src/systems/NightThreatSystem.js`:
  - `enabled` (from the game settings; changed in Settings);
  - campfire life cycle: lit at dusk or at once at night, ashes in the morning, removed a day later;
  - `makeCampfire(actor)`;
  - save state and validator.
- Campfire definition in `src/data/objects/lighting.js`:
  - cost {}; light type `campfire` (already counted by `DAY_NIGHT.litTypes`); provisional `CampfireView`
    (stones and logs, ashes).
- Campfire rules:
  - `src/game/buildings.js`: the placement rule (`campfireWood`, bushes map and trees);
  - `src/systems/LightFuelSystem.js`: `isLit` asks the threat system for campfires.
- UI:
  - Settings switches `#settings-threat-*` (NightControls, synced after Load);
  - unit panel button `#unit-campfire` for soldiers.
- Save: `nightThreats {enabled, campfires}`. SAVE_VERSION 57.
- Tests: `tests/night-threats.test.js`; world-configuration defaults; lists and counts.
- `scripts/campfire-smoke.mjs` (`--campfire`).

## Implementation decisions
- **The switches belong to the game,** saved with it and set from the New Game setup, not to the browser. Changing them
  in Settings changes this game only.
- **A campfire works like a building:**
  - builders build it from a blueprint like any other building (no materials);
  - a soldier's button makes it at once on a free tile within 2 tiles of him that has wood nearby;
  - gathering brushwood takes no time yet;
  - the King's command and the group command come with the wolves part (N3b), where resting at a campfire is needed.
- **Light:** a campfire is a flame light for sight, safety and the light map. Wolves will keep away from its radius
  (N3b).

## Save/Load impact
SAVE_VERSION 57. Alpha policy: older saves do not load.

## Testing
- `npm test` (978 pass):
  - switches;
  - local wood rule;
  - one night, ashes, removal; burning at once at night;
  - save.
- `npm run smoke -- --current-only --campfire`:
  - setup and Settings switches;
  - a campfire by a tree burns at night and is ashes in the morning;
  - screenshot `campfire.png`.

## Notes for the next agent
- **N3b (wolves):** use `scene.nightThreats.enabled.wolves`. For lights to avoid, use `scene.dayNight.flameLights()`
  (tiles, includes campfires and hand torches). Make `dayNight.attention()` true when wolves come near houses.
- **Soldiers resting at a campfire** (expedition): in `DailyRest.goals`, prefer a burning campfire within ~10 tiles
  over walking home.
