# Day and night N2: pitch, torches and night safety

## What and why
Plan item `m-noc-n2-pochodne` (brief `zadani-den-noc.md`, part N2, approved 7 Nov). After N1 the nights are dark. N2
lets the player light the village:
- Pitch and Torches from a Pitch Kiln;
- fuelled light places (Torch Post, Brazier, tower holders) that Haulers refill;
- soldiers with torches on the night watch;
- a Safety penalty for houses left in the dark.

## Files and systems
- **Data:**
  - `src/data/torches.js`: `TORCHES` (torch target 20; places with resource, store, fuel per night and radius in tiles;
    refill priority 25; Pitch Maker from midday; hand torch 3 tiles; tend range 8; dark house 6 tiles / −30).
  - `src/data/production.js`: `PITCH_RECIPES`.
  - Pitch Maker in jobs, workplaces, wages, employment sectors and looks.
  - Prices: pitch 4, torch 2; merchant stocks; carry weights.
  - XP for the Pitch Kiln and the Torch Post.
- **Objects:**
  - `pitch`, `torch` (resources, hidden in the bar at 0) and `pitch_kiln` (provisional drawing) in
    `src/data/objects/smelting.js`;
  - `torch_post` (approved `torch-post-iron` sprite) and `fuel` on the brazier in `src/data/objects/lighting.js`;
  - `fuel` on the tower in `src/data/objects/buildings.js`.
- `src/systems/FoodProductionSystem.js`: `chooseRecipes()` makes Torches while the stores hold fewer than 20 and Pitch
  is at hand, otherwise Pitch. A running batch keeps its own recipe.
- `src/systems/LightFuelSystem.js`:
  - fuel stores (`fuel-<id>`, kind `fuel`); lighting at dusk (fuel used at once) and lights out at day;
  - one notice;
  - Haulers' `candidates()`; `help(worker)` for Pitch Makers and soldiers with Tend torches;
  - hand torches; save state.
- `src/systems/FoodStorageSystem.js` / `FoodStateValidation.js`: the fuel location. A missing one is accepted, because
  it is created on registration or on the first refill.
- `src/systems/LogisticsTaskManager.js`: fuel jobs in the catalog; `updateWorker(…, {fuelOnly, near})`.
- `src/systems/WorkerAI.js`: `update` = step + `lightFuel.help` + `porches.check`.
- `src/game/LitBuildingView.js`: a fuelled place has no flame and no light unless it burns tonight.
- `src/systems/DayNightSystem.js`:
  - the reach of a fuelled light is its own radius;
  - tower holders count for sight only with a watcher within 3 tiles;
  - hand torches (`extraLights`);
  - `flameLights`, `darkAt`.
- `src/systems/NeedsSystem.js`: the Safety factor `dark` −30 at night for a house with no burning light within 6 tiles.
- `src/game/NightOverlay.js`: hand torches glow. `src/game/FuelIcons.js`: the "No fuel" sign.
- `src/ui/UnitPanel.js`: the soldier's "Tend torches" checkbox. `src/ui/InventoryBar.js`: `inventoryHideZero`.
- Save: `lightFuel {lit, hands, litDay, wasDark}` and the soldier's `tendTorches`. SAVE_VERSION 56.
- Tests: `tests/torches.test.js`, plus updated lists and counts. `scripts/torches-smoke.mjs` (`--torches`).

## Implementation decisions
- **Sprite radii kept:** the approved sprites keep the light radii from their Studio export. The game uses the
  brief's reach in tiles (5, 6, 5) for sight and safety. The light map draws the sprite's glow.
- **Fuel is used up at dusk**, all of it at once, so a refill at night no longer helps that night. A place that missed
  dusk stays dark until the next evening.
- **Refill order:**
  - Haulers via the normal delivery list (priority 25: under construction, over ordinary hauling);
  - a waiting Pitch Maker after midday when no Hauler is free;
  - a patrolling soldier with Tend torches, only places within 8 tiles of him (also at night).
- **Hand torches:** taken from the nearest store at dusk, without walking (simplified).
- **Not done yet:**
  - **Wall torch holders** on wall segments: they need a per-segment placement or toggle. Towers have their holders.
  - The **group** checkbox for Tend torches: only single soldiers so far.
  - Pitch Kiln and Pitch Maker art (provisional drawing, woodcutter look) until `g-noc-grafika`.

## Save/Load impact
SAVE_VERSION 56 (lit places, hand torches, Tend torches). Alpha policy: older saves do not load.

## Testing
- `npm test` (974 pass), with the N2 tests:
  - recipes and the recipe choice;
  - fuel at dusk, 1 a night, dark without fuel, out in the morning;
  - refill jobs and who takes them;
  - hand torch, sight and tower watch;
  - dark house −30 at night only;
  - save.
- `npm run smoke -- --current-only --torches`:
  - the kiln makes Pitch first;
  - a Hauler fills a post, which lights at dusk;
  - the empty post stays dark with the sign;
  - screenshot `torches.png`.
- Also run: `--day-night --porch --policy`.

## Notes for the next agent
- N3 adds the Campfire as a place without fuel (it burns one night by itself). Add it to `DAY_NIGHT.litTypes`
  (`campfire` is there already) and to `TORCHES` if it needs data. Fires (N3) start from flames: use
  `lightSources.lights()`, which now lists only burning lights.
- Wall holders: give `wall` a `fuel` block only on segments with a holder (e.g. `b.torch=true`), and keep
  `fuel.watched`.
