# UI Lab in the game (0.34.0)

## What and why
Plan task m-ui-lab-do-hry. The owner designed the interface in the Studio's UI Lab (art/ui/ui-config.json from the Grafika chat, store n24 + n35): olive tokens, Cinzel small capitals, iron rivets, 4 px frame, 19 px radius, and a reordered Settings, Employment and HUD details. The game now applies that config to its own document with the Studio's `applyUiConfig`, so the game looks like the Lab.

## Files and systems
- `src/main.js` – imports `art/ui/ui-fonts.js` (Cinzel, EB Garamond, IM Fell; loaded only when a style uses them) and `art/ui/ui-theme.css` (every rule is scoped under `html[data-ui-theme]`), and calls `applyUiStyle()` before the main menu. The MutationObserver inside `applyUiConfig` reorders windows the game opens or refills later.
- `src/ui/UiTheme.js` – `UI_STYLES`: `studio` (the owner's config, default), the four presets (`olive`, `wood-iron`, `parchment`, `stone-castle`) and `classic` (no config = the original look). `applyUiStyle(id)` undoes the previous config and applies the new one; the choice is kept in `localStorage` (`newgame.uiStyle`), never in a save.
- `index.html` + `src/ui/SettingsPanel.js` – a new "Interface style" row. It is a `div.ui-style-setting`, so it does not shift the `label.setting-row~N` section keys the owner's order uses; as an unlisted section it comes after the listed ones.
- `tests/asset-studio.test.js` – the "game never imports studio/art" guard now allows exactly the shared UI Lab files in `art/ui/` (config, presets, `uiConfig.js`, fonts, theme CSS).
- Tests: `tests/ui-theme.test.js` (all six styles validate without problems; the owner's design carries Cinzel, rivets and small capitals and reorders Settings; the stored choice and its fallback).
- Smoke: `scripts/ui-theme-smoke.mjs` (`--ui-theme`). It checks the default style, switches through all six styles in Settings, checks that the Buildings tab and the Settings button are not covered, that the building menu and the Storage window work, and takes a screenshot per style. `browser-smoke.mjs` has `SMOKE_UI_STYLE=<id>` to run any smoke in a given style.

## Implementation decisions
- The owner's config is the default for everyone; the four presets and the original look are only a Settings choice (optional point 5 of the brief, done).
- The UI Lab snapshots are from v0.13. Sections added since then (e.g. Run in Background, Developer rows) are not in the owner's order lists, so they stay in the game's order after the listed ones. Nothing became unusable: the default smoke ran in the owner's style and in Stone castle (buildings bar on top). The `--employment`, `--notices` and `--ui-theme` smokes ran with every style.
- No collisions were found that need the Grafika chat. The screenshots (`/tmp/shots/ui-*.png` from the smoke) show all six styles with the Storage window open.

## Save/Load impact
None.

## Testing
`npm test`. Smokes: default (owner's style), `SMOKE_UI_STYLE=stone-castle` with `--employment --notices`, `--ui-theme` (six styles).

## Notes for the next agent
- New windows or sections should keep stable ids/classes. The owner's section order refers to `tag.class~N` keys, and inserting an element of an existing kind before others shifts those numbers. To be safe, add a new element kind or give it an id.
- Next tasks built on this: m-okno-sklad, m-politika-soupatka, m-leve-karty-politika-zamestnani.
