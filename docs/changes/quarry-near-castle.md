# Quarry deposit near the castle (m-kamenolom-u-hradu)

## What and why
Playtest 0.76.0 #13 and the owner: within 35 tiles of the castle the playtester found no Stone Deposit a Quarry could be built on, so stone only came from marked rocks. Every new world now has at least one Stone Deposit whose centre is 8–16 tiles from the castle's centre and that takes a Quarry under the game's own placement rules: the whole 3×3 footprint is buildable, building it cuts nothing off the map, a work position stays reachable, and it keeps clear of the castle and the Starter Stockpile. Manual rocks within 10 tiles were already guaranteed (the start walls of the first prototype); a test now checks it. Iron deposits do not change. The tutorial's Stone step mentions the grey deposit near the castle, and with the Quarry chosen in the build menu its arrow points at that deposit.

## Files and systems
- `src/data/minerals.js`: `START_QUARRY` (`min` 8, `max` 16, `clearance` 3, `rocksWithin` 10, `keepClearOf` castle and starter_stockpile).
- `src/systems/MineralSystem.js`: `startCentre()`, `startFree()`, `startQuarrySite(anchor)` (a valid Quarry anchor over a placed or planned deposit, or null) and `ensureStartQuarry(random)`.
- `src/game/GameScene.js`: New Game calls `ensureStartQuarry(this.worldRandom('start-quarry'))` right after the random deposits, before the world fingerprint. A loaded game decodes its world code with `current:null`.
- `src/data/worldCode.js`: `WORLD_GENERATOR_VERSION` 3. `decodeWorldCode(code,{current:null})` accepts any generator version.
- `src/systems/GameSettings.js`: a world code of any generator version is valid in settings, so saved games keep theirs.
- `src/ui/TutorialGuide.js`: `quarryDeposit()` (the free Stone Deposit nearest to the castle). While the Stone step is on and the Quarry is chosen, `target()` returns that deposit with the text `tutorial.step.stoneQuarry`.
- `src/i18n/en.js`, `src/i18n/cs.js`: new `tutorial.step.stone` text, new `tutorial.step.stoneQuarry`.
- Tests: new `tests/quarry-near-castle.test.js`. `tests/world-code.test.js` and `tests/world-configuration.test.js` move to generator 3. `tests/helpers/workerScene.js` takes a `start` option (default 40,40, as before).
- Smokes: `MKW2-` became `MKW3-` in every `scripts/*-smoke.mjs`, including `studio-smoke.mjs`, whose World Lab uses the game's version. The generator message in `world-code-smoke.mjs` now says "uses version 3".

## Implementation decisions
- **A post-pass, not a change to the random placement.** `generate()` is unchanged. Afterwards `ensureStartQuarry` first looks for an existing Stone Deposit that already qualifies. If one does, nothing is added. Otherwise it adds one more Stone Deposit (a 6th) at a random qualifying spot, using its own world stream `start-quarry`. The five random stone deposits and all iron deposits stay exactly where generator 2 put them for the same seed. Only the extra deposit differs.
- **Distance** is centre to centre: the castle footprint's centre to the deposit's centre (x+1, y+1). The candidates are the deposit anchors in that ring whose four tiles pass the same rules as the random deposits: open map, not a ford, no resource, not reserved, not on the map's border tile. They are shuffled with the stream and tried in order.
- **"Buildable"** mirrors `placementError`: every non-deposit tile of the 3×3 Quarry footprint is open ground that is not a ford, holds no resource (loose stones and saplings included) and no reserved unit or building. Neither the Quarry nor the deposit comes within footprint distance 3 of the castle or the Starter Stockpile, and the King's tile stays free. Blocking the Quarry plus deposit tiles may only remove those tiles from the reachable area (nothing gets cut off), and a Quarry side tile stays reachable. Footprints that fully cover the deposit are tried first.
- **Fog is unchanged.** At 8–16 tiles the deposit is usually outside the starting sight, so the player has to walk there or send someone, as with any deposit. The tutorial arrow shows the way: an off-screen arrow points toward it.
- **Generator 3, and saves.** Old world codes (MKW2) are refused by New Game ("generator version 2; this build uses version 3"), which matches the alpha policy that old codes no longer give the same world. A save stores its world code in `gameSettings`, and validating it with the strict check would have rejected every 0.77.x save. So the settings check and the load path accept any generator version, and only new-game generation needs the current one.
- **Tutorial**: the step order and the step check are unchanged. Only the stone texts and the arrow-while-placing-the-Quarry changed.

## Save/Load impact
`SAVE_VERSION` is unchanged. The extra deposit is an ordinary `stone_deposit` resource, already saved and validated. Saves with a generator-2 world code (all 0.77.x saves) still validate and load: `gameSettings` accepts the old code, and GameScene decodes it with `current:null` on load. Nothing new is stored.

## Testing
- `tests/quarry-near-castle.test.js`:
  - 200 seeds (default settings, without the forest for speed) plus 10 seeds with the starting forest. Each has a Stone Deposit 8–16 tiles from the castle where the real `placementError` (with `accessError`) accepts a Quarry. The test also checks that the Quarry keeps clear of the start, keeps the map connected, and has a reachable side and a reachable castle.
  - Each of those seeds also has a terrain rock within 10 tiles with a reachable side, and its iron deposits are identical before and after the post-pass.
  - Determinism: the same seed gives the same deposits. The random stone deposits are kept, and nothing is added when one already qualifies or when the pass runs a second time.
  - Other settings keep the guarantee: no river, dense forest, many rocks, a tributary with three lakes.
  - Tutorial: the en and cs texts, the arrow at the nearest free deposit while the Quarry is chosen, and the usual arrow otherwise.
- `npm test`: 1131 tests, all passing (the new file takes about 50 s in parallel).
- `npm run build -- --base=/Newgame/` succeeds.
- No browser smokes were run (another agent works in parallel). Run later: `world-code-smoke`, `mineral-smoke`, `tutorial-smoke`, `e1-smoke`, `world-smoke`, `world-editor-smoke`, `start-v2-smoke`, `getting-started-smoke`, `rock-mining-smoke`, `depleted-mine-smoke`, `save-transfer-smoke` (load a 0.77.x save) and `studio-smoke` (World Lab codes are now MKW3).

## Notes for the next agent
- The other agent is moving the lumberjack step in `src/data/tutorial.js`. This change does not touch that file. The only tutorial edits are in `TutorialGuide.target()`, `quarryDeposit()` and the two i18n keys.
- `studio/` was not touched. The Studio World Lab imports `WORLD_GENERATOR_VERSION`, so its codes now read MKW3, and its saved favourites with MKW2 show as an old generator.
- Trees spread over time and may later grow onto the Quarry tiles. Saplings can be built over, grown trees cannot. The guarantee holds at the start of a game only.
- If the generator changes again, bump `WORLD_GENERATOR_VERSION` and replace `MKW3-` in the smokes and tests.
