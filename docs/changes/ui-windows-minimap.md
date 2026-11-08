# UI windows close on right click, minimap + / − (m-ui-okna-minimapa)

## What and why
Owner requests 28 and 55.
- 28: a right click inside any window closes (collapses) that window, like the Population tab already closed on a
  map right click. Works for every dialog panel (building detail, workplace, unit, storage, construction, farming,
  equipment, treasure, food economy, natural resource, asset gallery, help, marketplace, Wiki, village, cat/dog,
  builder workshop) and the side windows (Settings, Population, Kingdom Policy card, Employments, Notices, Royal
  tasks). Right click on the map is unchanged (closes open panels first, otherwise Move / cancel as before).
  In text inputs, textareas and selects the browser context menu stays and nothing closes.
- 55: small + and − buttons in the minimap's top-right corner change its on-screen size in 4 steps
  (0.75, 1, 1.35, 1.7 × the base size). The choice is remembered in this browser.

## Files and systems
- `src/ui/PanelDismiss.js`: the one central place. Registry `DISMISSIBLE_PANELS` (dialogs a right click closes),
  `NEVER_DISMISSED` (confirmations, pause, Save/Load, Game Over, catch-up/away summary, changelog, version archive),
  `SIDE_WINDOWS` (side window id → close function), `WINDOW_SELECTOR`, `keepsContextMenu`, `dismissWindow`.
  One delegated capture `contextmenu` listener on `document` (`installPanelDismiss`).
- `src/game/GameScene.js`: passes `scene` to `installPanelDismiss`.
- `src/ui/NoticesPanel.js` + `src/style.css`: Notices can collapse (`setCollapsed`, class `collapsed`); a click on
  the Notices title expands it again.
- `src/ui/Minimap.js`: `MINIMAP_SIZES`, `clampMinimapStep`, `readMinimapStep`, `writeMinimapStep`, buttons and
  `setSizeStep`. Root role is now `group` (the canvas carries `role="img"`) so the buttons are reachable.
- `src/style.css`: `.minimap` size uses `--minimap-scale` (also on phones); removed the stray fixed `height:106px`;
  `.minimap-size` buttons use the UI theme vars (`--glass`, `--line`, `--ink`, `--gold`, `--font-ui`).
- `src/i18n/en.js`, `src/i18n/cs.js`: `minimap.bigger`, `minimap.smaller`.
- Tests: `tests/panel-dismiss.test.js`, `tests/minimap.test.js`. Smoke: `scripts/ui-windows-smoke.mjs`
  registered as `--ui-windows` in `scripts/browser-smoke.mjs`.

## Implementation decisions
- Nearest root wins: the listener finds `target.closest(WINDOW_SELECTOR)`, so a Wiki opened over a building panel
  closes alone. Dialogs close through their own `cancel` handler (same path as Escape, restores input).
- A right click on a modal backdrop (target is the `<dialog>` itself) or on the game canvas keeps the old #121
  behaviour (close all ordinary panels; nothing if a blocking dialog is open).
- Right click inside a NEVER_DISMISSED dialog is swallowed (no browser menu) but closes nothing.
- Text-like inputs (text, search, number, ... and textarea, select, contenteditable) are exempt; checkboxes, range
  and buttons inside a window do close it.
- Policy card / Employments close via `scene.sideCards.close('policy')` / `scene.employmentPanel.close()` so tab
  `aria-expanded` stays in sync. Royal tasks (a `<details>`) folds. Notices had no close, so it collapses (page only).
- The event feed, tooltips, the population job menu and the minimap are not windows; nothing changes there.
- Minimap has no content zoom; the buttons change only the CSS size. Click/pan math already uses the canvas's real
  width, so navigation stays correct at every size. The + / − clicks do not pan the camera.

## Save/Load impact
None. SAVE_VERSION stays 58. The minimap size lives in `localStorage['newgame.minimap.size']` (try/catch, a broken
or blocked storage falls back to step 1). The Notices collapse state is not stored at all.

## Testing
- `npm test`: 1047 pass, 0 fail (3 new tests: right click inside every side window, every `<dialog>` in
  `index.html` / created in `src/ui` is in DISMISSIBLE_PANELS or NEVER_DISMISSED and every side window is in
  SIDE_WINDOWS; minimap step clamp/storage/buttons).
- `npm run build -- --base=/Newgame/` OK.
- `npm run smoke -- --current-only --keep-going --ui-windows`: ui-windows PASS.
- Re-run alone: `--population --wiki --event-feed --notices --minimap --zoom --right-click --side-cards` all PASS.

## Notes for the next agent
- New windows: add the dialog id to `DISMISSIBLE_PANELS` or `NEVER_DISMISSED`, or a side window to `SIDE_WINDOWS`;
  the unit test fails for an unregistered `<dialog>` / `<aside>`.
- Known harness issue (not caused by this change): after a long context-based smoke (`--ui-windows` or
  `--world-look-2` run alone) the always-run `buildingMenuSmoke` on the shared main page times out in its wheel-scroll
  check (`scripts/building-menu-smoke.mjs:12`); with shorter steps (e.g. `--wiki`) it passes.
