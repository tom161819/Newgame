# Full-window map, new top bar layout and a Getting started window

## What and why
Owner, 9 Nov 2026 (Grafika chat, annotated screenshot of the top bar):
- a) The game window should reach from the left to the right edge of the monitor and down to the bottom. The panel with Buildings and marking should float over the game.
- b) In the top bar:
  - move the Kingdom overview to the bottom-left corner of the bar (red);
  - put "Food for x days" beside it (yellow);
  - move the day and weather to the top right (blue);
  - remove the King's info bar (purple);
  - move Getting started to the right under the bar, as its own window that can be folded away (green).

## Files and systems
- **index.html:**
  - The HUD now has two rows:
    - `.hud-row-top`: resources, then `.hud-clock` with `#game-time` and `#season-weather`;
    - `.hud-row-bottom`: `.hud-left-slot` (overview / King's cargo), `.food-status`, `.hud-status` (speed, day part, Skip to dawn, night plans), More and Wiki.
  - The King's health and level are in a hidden `.hud-king`. They are still updated, so the code that writes them is unchanged.
  - The "?" button and the help arrow are gone.
  - `#help-dialog` is now a `<details class="help-window">` inside `.viewport`, with a summary (title, `#help-count`, arrow) and a body (summary text, steps).
- **src/style.css** (block at the end):
  - The page has no margin and `main` takes the full width.
  - The viewport has no frame.
  - `.status-row` and `.buildings-bar` are absolutely positioned and centred at the bottom of the map. The bar stays centred, so the full-width strip (50% − 50vw) still works.
  - The corner stack and camera chips keep their old 12 px from the window edges.
  - The left HUD slot is now a fixed 17 rem, which keeps the #101 no-reflow rule, and the cargo button is compact.
  - Styles for the help window: the body is capped and scrolls.
- **src/ui/GettingStartedPanel.js:** the window is non-modal and docked under `.inventory`. The ResizeObserver and window resize keep `top` right. The folded state is stored in `newgame.gettingStarted.collapsed`. `show()`/`open()` unfold it and `close()` folds it. A step still opens the Buildings menu, and the window stays open.
- **src/ui/hudLayout.js:** `bottomLift` tells the strip's side by its centre. A tall strip over the floating bar may now reach above the middle of a low window.
- **src/ui/KingdomOverview.js:** the overview bar keeps a 20 px margin from the window edge.
- **src/ui/WikiPanel.js:** the Wiki button goes after More when there is no "?".
- **src/ui/TutorialGuide.js:** the tutorial bubble keeps clear of `#help-dialog`.
- **src/ui/PanelDismiss.js:** `help-dialog` is no longer a right-click dismissible dialog. A right-click move order must not fold a permanent window.
- **Tests and smokes:**
  - panel-dismiss dialog count;
  - getting-started, kingdom-overview, tutorial, king-xp, ui-fixes-076 and kingdom-bar smokes;
  - ui-lab-capture;
  - every smoke that pressed Escape after the start dialog now folds the window instead, because Escape would open the pause menu.

## Implementation decisions
- **Keep the King's HUD elements hidden in the DOM.** Combat and XP feedback keep writing to them and nothing else changes. The King's panel still opens by clicking the King.
- **Keep the id `help-dialog`.** UI Lab panel config and many smokes refer to it, and `[open]` works for `<details>` too.
- **Do not let Escape fold the window.** Escape keeps opening the pause menu.
- **Remember the folded state.** It persists across new games.

## Save/Load impact
None. The folded state is a browser preference.

## Testing
- npm test.
- Smokes: getting-started, wiki, ui-windows, king-xp, tutorial, tutorial-v3, ui-fixes-076, tips-hud, overview, kingdom-bar and hud-cargo (#101 still keeps the bar's exact layout), plus a full smoke run.
- Screenshots at 1440×900, 1920×1080 and 1366×768 in Czech:
  - the map reaches the edges;
  - the bar and status float at the bottom;
  - the top-bar layout is as asked;
  - Getting started is under the bar at the right, clear of the side tabs and the minimap;
  - the window folds to one line.

## Notes for the next agent
- HelpArrow (KingdomOverview.js) no longer has a "?" button or an arrow element and does nothing. Remove it if no one wants it back.
- The `html[data-ui-buildings-bar="top"]` theme variant puts the floating bar at top 44 px. It is not checked by a smoke.
