# E2 · Speed, a calmer first screen and a quick start (report 0.48.0)

## What and why
Plan tasks m-e2-rychlost-hry, m-e2-zklidneni-obrazovky, m-e2-menu-rychly-start. The report found no way to speed the
game up, a top bar of 19 mostly-zero counters, developer tools in the bottom bar and a long setup form before play.

## Files and systems
- `src/ui/SpeedControls.js` (new): ‖ 1× 2× 3× in the HUD (`#speed-controls`), keys P and 1–3, speed in localStorage
  `newgame.gameSpeed`. `GameScene.update` runs the same `simulationStep`s `gameSpeed` times per frame; the player's pause
  skips the simulation only (map, building and panels keep working, unlike the Game Menu pause).
- `InventoryBar`: Gold, Stone and Wood always; other resources once the kingdom has had some (session), `inventoryHideZero`
  resources only while above zero.
- Time: `hud.day` = "Day N" with `GameTimeSystem.tooltip`; `hud.season` = "Season · weather" with `SeasonSystem.tooltip`.
- `index.html`: Asset Library, older versions, camera mode and sight moved into the More panel (`.hud-more-tools`,
  `.hud-more-camera`); smokes open More through `openAssetLibrary`.
- `BuildingBar`: opens on the last used category (localStorage `newgame.buildingCategory`), Food & Farming first time.
- Main menu: Continue (newest compatible save, `GameApplication.latestSave`), New Game, Load; archive and changelog as
  small links.
- New Game setup: quick starts Calm / Normal / Challenge (`SETUP_PRESETS` in `NewGameSetup.js`) and Start on top; the
  form folds under `#setup-custom` (open state remembered, `newgame.setupCustom`).

## Implementation decisions
- Locked buildings were not moved to the end of the strip: the owner's #132 menu order stays.
- "Mark rocks / Unmark rocks" stay in the bottom bar: stone gathering is a first-day need (tutorial step 7).
- Language already follows the browser on first run (`readLanguage`).
- Smokes set `newgame.setupCustom=open` through an init script so their setup steps still see the form.

## Save/Load impact
None.

## Testing
`tests/economy-time.test.js`, `tests/world-configuration.test.js` (labels); browser smoke `--e2` (speed, pause,
building while paused, time label, hidden resources, More) and its menu part (links, quick start Calm, folded form).

## Notes for the next agent
- E3 should open the building menu on the category of the current tutorial step (`buildingBar.selectCategory`).
