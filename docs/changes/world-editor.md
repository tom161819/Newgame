# World Editor screen (m-world-editor-obrazovka)

## What and why

Owner request 8 Nov 2026: a full World Editor screen in the game with all World Lab options the game can use.

- Main menu: **World Editor** button right under Load Game; New Game → Custom settings → World has an **Open World Editor** link.
- Full screen (not a dialog): option tabs on the left (Water, Land, Ground look, Plants, Stones, River look, Preview season, Saved worlds), each with a small ↺ that resets just that tab; on the right the whole map from above (click moves the close-up) and an isometric close-up; bottom bar with the world code (editable, validated), New seed, Copy world code, Default (inline confirmation), Back, Start Game and a status line.
- Labels in Czech and English (`editor.*`, `editor.look.*`, `menu.worldEditor`, `setup.openEditor`, `setup.editorNote`; generator labels reuse `setup.gen.*`).

World Lab audit (studio/src/world-lab, read only): generator = the 12 WORLD_SETTINGS sliders; ground = GROUND_SETTINGS sliders, per-kind opacity, zone and water colours + water presets, time of day, season, weather; plus dev-only things (A/B compare, overlays, favourites in the shared DB, default/ground proposals). The game uses: all 12 generator settings (world code) and, via groundStyle.json, the ground sliders, opacities and colours; time/weather/season come from the game's own systems; fish come from the game's FishShadows (not from the ground settings).

## Files and systems

- `src/ui/WorldEditor.js` (new): the screen, tabs, previews (`drawIsoPreview`), presets UI.
- `src/data/groundLook.js` (new): editable ground keys, strict validation, override state (`setGroundOverride`, `groundOverride`, `groundSettings`).
- `src/data/worldEditorStore.js` (new): presets / last used settings in localStorage, record normalisation, error reasons.
- `src/game/TerrainRenderer.js`, `src/game/RiverLife.js`: read `groundSettings()` instead of importing groundStyle.json directly (RiverLife now also honours `flow` and `duckFamilies` from it).
- `src/systems/GameStateSerializer.js`: optional `groundLook` save field.
- `src/ui/GameApplication.js`: editor wiring, ground override set in `start()`; `src/ui/NewGameSetup.js`: offers the last editor levels, editor link.
- `index.html`, `src/style.css`, `src/i18n/en.js`, `src/i18n/cs.js`.
- Tests `tests/world-editor.test.js`; smoke `scripts/world-editor-smoke.mjs` (`--world-editor`).
- Smokes that click the game canvas with `canvas:not(.minimap-canvas)`: the selector now also excludes `.world-preview`, `.we-map`, `.we-iso` (the 0.73.0 generator canvas already made it ambiguous in strict mode).

## Implementation decisions

- **No edits to `continuousGround.js` / `groundStyle.json`** (Grafika chat). The engine takes `settings` as a parameter and has no global override hook, so the override lives in `groundLook.js` and the game's two callers (TerrainRenderer, RiverLife) ask `groundSettings()` = `{...GROUND_DEFAULTS, ...groundStyle.settings, ...override}`. No hook in continuousGround is needed.
- Ground options offered: all GROUND_SETTINGS sliders except fish amount/size/opacity (game fish are FishShadows, which ignore them). Not offered (kept for a later round): per-kind opacity sliders, zone/water colour pickers, time of day, weather (game-controlled). Preview season is preview only (not stored).
- **Iso close-up**: the game's continuous ground engine (`paintContinuousGround`, `plantsFor`, `waterObjectsFor`, `drawPlant`) over an 18×18-tile window at 64×32, with rock outcrop and bush sprites from `decorations.js`; trees, buildings and animals are not drawn (trees are placed at game start from forest weights). It starts on the river bank nearest the castle. About 0.4–0.7 s per redraw; redraws are debounced (140 ms).
- Top-down preview reuses `previewWorld` / `previewPixels` from the 0.73.0 WorldGenerator, so the preview is the exact `generateWorld` call the game makes.
- Storage keys `newgame.worldEditor.presets` (max 30, names ≤ 40 chars, same name replaces) and `newgame.worldEditor.last` (written 300 ms after each change and on Start/Back). Records `{levels, seed, ground}`; `ground` keeps only values differing from the game look (null = game look). Broken records are skipped; writes return `full` / `unavailable` and the editor shows a message.
- The ground look of the last used editor settings applies to every new game started in this browser (`GameApplication.start`), a loaded game uses its save's `groundLook` (or the game look), a game-over restart keeps the current one.
- New Game offers the last editor **levels with a fresh seed** (same seed every time would repeat the same map); a note says so; "Reset to Defaults" drops the offer. Start Game in the editor plays exactly the previewed code (with the setup's other choices when opened from New Game, NEW_GAME_DEFAULTS from the main menu).
- Default resets levels to `defaultWorldLevels()` and the ground to the game look, keeps the seed and the presets; confirmation is inline (no native `confirm()`).

## Save/Load impact

New optional top-level field `groundLook` (only present when an override is active): object of known ground keys, finite numbers within slider ranges, `duckFamilies` integer; anything else rejects the save like other invalid fields. SAVE_VERSION stays 60; older saves without the field load with the game look.

## Testing

- `npm test`: 1111/1111 (1104 + 7 new in `tests/world-editor.test.js`: preset save/load/delete with mock storage, full/blocked storage, Default code + game look, world code follows each slider, corrupt records ignored, ground validation/override, optional save field round trip and rejection).
- `npm run build -- --base=/Newgame/` OK.
- `node scripts/browser-smoke.mjs --current-only --world-editor`: PASS (own browser context; button under Load Game, full screen, both previews drawn, preset + last settings after reload, New Game offers levels, ↺, Default with cancel/confirm keeps presets, full storage message, Start game = preview ground, `groundLook` in the save). Screenshot `/tmp/shots/world-editor.png`.
- Alone: `--world-code`, `--e2`, `--start-v2`, `--world-look-2`, `--approved-art`, `--getting-started` PASS. `--world` FAILS on "deep water is blue ({r:74,g:91,b:76})": its assertion expects blue water but groundStyle.json's approved "Czech river" colours are green-brown; the editor does not touch water colours and the default override is null, so this is from the 0.72–0.74 ground releases, not this change.

## Notes for the next agent

- `--world` smoke's blue-deep-water check needs updating to the approved river colours (Grafika chat's area).
- If the Grafika chat adds keys to GROUND_SETTINGS, they appear in the editor automatically only if a tab lists their group (`EDITOR_TABS` in WorldEditor.js uses groups ground/plants/stones/water/waterObjects/life) and need `editor.look.<key>` labels in both languages.
- Possible follow-ups: opacity and colour controls, trees in the iso preview, a hook in continuousGround if other painters appear (today only TerrainRenderer and RiverLife paint the game ground).
