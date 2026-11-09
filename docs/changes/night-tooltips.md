# Night speed-up on the speed indicator, building tooltips (m-noc-zrychleni, m-budovy-tooltip)

## What and why

- **82 – m-noc-zrychleni.** Nights were sped up ×3 by default and the speed indicator stayed at 1×. Now:
  - Settings → **Auto speed-up at night** (the old "Speed up nights": Off / ×2 / ×3) is **off by default**. A value
    the player chose earlier in this browser (`newgame.nightSpeed`) is kept: `3` stays on, `1` stays off.
  - With it on, the night raises the **game speed itself** to that step: the indicator shows **☾3×** (moon, light
    blue) until dawn; at dawn speed and indicator return to the value before the night. A speed the player sets at
    night (buttons, keys 1–3) wins and the automatic keeps out until the morning; the next night it works again.
    The pause always wins (it is separate from the speed). A player already at 3× (or at the chosen step) sees no
    change.
  - After **1 game year** (day 21), once per game and only when the option is off: a small tip below the speed
    buttons "Nights can pass faster – turn on Auto speed-up at night in Settings." with **Turn on** (sets ×3) and
    **No thanks**.
- **86 – m-budovy-tooltip.** Resting the pointer **0.8 s** on a building shows a small tooltip at the cursor: at
  most 4 lines, 11 px, semi-transparent background.
  - Every building: name + status icons ⛔ not working (no workers, employment off, depleted, production paused or a
    notice for it), ⏳ missing input, 🔥 fire, 🐀 rats.
  - Workplaces: "Workers 2 / 3" and for recipe workplaces "Bread – 60 %", "Waiting for Flour" or "Production paused".
  - Stores (Farmhouse, Material Yard, Warehouse, Granary, Marketplace, Starter Stockpile, Armory …): up to the 4
    largest goods with icon and count, then "120 / 200" – on one line.
  - House: "Residents 3 / 5" + happiness icon (☺ 😐 ☹ ⚠, mood of the residents' average; title with the %).
  - Construction site: "Construction 45 %" and "Needs 4 Wood, 2 Stone" (what is not delivered yet).
  - Not in build mode, while dragging (a held button / drag rectangle), for the selected building, on touch input,
    and not with Settings → **Building tooltips** off (default on).
  - The delay is data (`BUILDING_TOOLTIP.delayMs` 800) and a slider in the developer Balance panel (0.2–2 s, Dev
    mode only), as the owner asked.

## Files and systems

- `src/systems/NightSpeedUp.js` (new) – the night speed state machine (`engaged`, `before`, `manual`) and the
  once-per-game tip check; `NIGHT_SPEED_TIP_DAY` = 21.
- `src/ui/NightSpeedTip.js` (new) – the tip element (built in JS, no markup).
- `src/ui/SpeedControls.js` – `setSpeed` tells NightSpeedUp about a manual change; `applyAuto(speed)` sets the speed
  without remembering it; `render` shows ☾ on the held step (`.is-night-auto`).
- `src/ui/NightControls.js` – comment, `syncSpeed()` for the Settings select after "Turn on".
- `src/data/dayNight.js` – `defaultNightSpeed: 1`, `speedTipYears: 1`, `validNightSpeedTipState`.
- `src/game/GameScene.js` – creates/destroys `nightSpeedUp`; the frame loop calls `nightSpeedUp.update()` and
  `dayNight.speed(1)` (no extra steps per frame at night; Skip to dawn still ×8); `updateHover` passes `allowed`
  to the tooltip.
- `src/data/buildingTooltip.js` (new) – delay, limits, icons, the on/off setting, `buildingTooltipAllowed`.
- `src/ui/buildingTooltipContent.js` (new) – the content as plain data + `buildingTooltipText` for tests.
- `src/ui/StorePreview.js` – the one tooltip system: the top-bar store gauge preview (0.6 s, unchanged) and the map
  building tooltip (`hoverBuilding`, class `building-tooltip`, redrawn only when its content changes).
- `src/data/devBalance.js`, `src/ui/DevBalancePanel.js` – tooltip delay (seconds) stored with the dev values,
  "Building tooltip – Delay" section, Reset returns 0.8 s, Copy adds `tooltipDelaySeconds` when changed.
- `src/systems/GameStateSerializer.js`, `GameStateLoader.js` – optional `nightSpeedTip`.
- `index.html` (label + the Building tooltips switch), `src/i18n/en.js`, `cs.js` (one new line each), `src/style.css`
  (one block after the store preview rules).
- Tests `tests/night-tooltips.test.js` (new), `tests/day-night.test.js` (default now off).
- Smokes `scripts/building-tooltip-smoke.mjs` (new), registered in `scripts/browser-smoke.mjs` as
  `--building-tooltip` and `--night-speed`.

## Implementation decisions

- **The setting stays a select (Off / ×2 / ×3), relabelled.** That keeps any earlier browser choice exactly
  ("whoever already changed it keeps their value") and needs no migration; the tip's Turn on picks ×3. ×2 users get
  the indicator at 2 with the moon.
- **The night speed is now the game speed.** Before, the night multiplied simulation steps per frame on top of the
  game speed, invisible in the indicator. Now `gameSpeed` itself is raised (not written to `newgame.gameSpeed`), so
  the indicator is honest and the game runs the same number of steps as a manual 3×.
- **Skip to dawn and "attention" (fight, wolves near, a fire)** take the speed back to the one before the night
  while they last (Skip runs its own ×8 steps, not 8×3 = 24 per frame – the 0.80.0 performance budget); after them
  the automatic returns, unless the player changed the speed.
- **The tip is marked shown at the first check after a year** even when the option is already on (nothing to
  offer) – so turning the option off later does not pop a tip about it. It waits while the tutorial is active.
- **One tooltip system:** the map stores' 0.6 s preview is now the building tooltip (0.8 s) with the same stock
  cells (`.store-preview-item`, group tints); the top-bar gauge keeps its own 0.6 s preview in the same element.
  `hoverBuilding(null)` no longer clears a gauge preview.
- **"Selected building"** = `selectedBuildingIds` (the one clicked last and the one whose panel is open) – the same
  selection that shows the footprint. Most building panels are modal, which already stopped hover.
- **Touch:** Phaser's `pointer.wasTouch` or `matchMedia('(hover: none)')`.
- Resource names in lines use the registry names, like the building panels.

## Save/Load impact

SAVE_VERSION stays **60**. New optional top-level field `nightSpeedTip: true` (absent = tip not yet shown); any
other value fails validation. Old saves load unchanged; a game already past year 1 gets the tip once after loading
(if the option is off). The night speed-up itself is not saved (it follows the clock; `gameSpeed` stays a browser
setting). The building tooltip saves nothing (setting and dev delay are in this browser).

## Testing

- `npm test` (node scripts/test.mjs): 1162 tests, all pass. New `tests/night-tooltips.test.js`: default without
  speed-up; ☾3 at night and back at dawn (also from 2×, nothing at 3×, pause wins, Skip/fight); a manual change at
  night wins until morning; the tip once after a year, not with the option on, not in the tutorial, restored
  "shown"; tooltip content by type (Granary, Farmhouse, Material Yard, Bakery waiting/producing/paused, House,
  fire/rats, construction site with "Needs 10 Wood"), at most 4 lines; delay from data / Dev value, clamps, storage,
  Reset; allowed conditions; StorePreview delay/hide/switch/gauge; save field round-trip and strict validation.
- `npm run build -- --base=/Newgame/`: OK.
- Browser smokes written, **not run** (parallel agent): `node scripts/browser-smoke.mjs --building-tooltip
  --night-speed` (also part of `--full`).

## Notes for the next agent

- Run the two smokes; check the tooltip's look (see-through `color-mix` background, line ellipsis) and the ☾3× on
  the speed buttons on mobile widths; `SMOKE_SHOTS=/tmp/shots` gives `building-tooltip.png`.
- `scripts/resource-groups-smoke.mjs` hovers the Starter Stockpile with 250 + 700 ms waits; with 0.8 s it should
  still pass (950 ms), its text still says 0.6 s.
- The tutorial step "speed" (src/systems/Tutorial.js, other agent's area) counts `gameSpeed > 1`; the automatic
  could satisfy it at night if the option is on during the tutorial (off by default, so unlikely).
- Non-recipe workplaces (Lumberjack, Hunter, mines) show only workers + status icons; a per-type production line
  (e.g. "Wood today 12") could be added in `buildingTooltipContent.js`.
- House capacity in data is 5 (the owner's example said 3 / 4).
- Smoke fix (`--building-tooltip`, "not for the selected building"): the smoke pressed Escape twice after build mode;
  the second Escape opened the Game Menu. Game bug found there: a building tooltip whose 0.8 s delay started just
  before a dialog opened still appeared over the dialog (the map then gets no pointer events, so nothing cancelled it).
  Now the frame loop cancels a pending/shown map tooltip while the pointer is off the map (`input.manager.isOver`
  false) and StorePreview does not open a building tooltip while a blocking dialog is open (unit test in
  `tests/night-tooltips.test.js`). The smoke presses Escape only while build mode is on and checks no dialog is open.
