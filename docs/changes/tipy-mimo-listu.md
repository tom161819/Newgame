# Tips clear of the HUD, fold into Notices, one at a time (m-tipy-mimo-listu)

## What and why
Playtest report 0.83.0 point 2 (shots 03, 04, 11): the "Night" tip lay over the speed buttons and part of the resource bar, the cat tip covered the open Dev tool and "Na krále · mezerník", and the cat tip stayed up from day 3 to day 25.
- **Placement.** A tip now keeps clear of the top bar (`.inventory`), the side tabs (`.population-tab`), Settings, the Dev tool button and panel, "Follow the king" / "Dismount", the bottom bar, the Notices bar, the event lines, the minimap and the night speed-up tip, on top of the open windows the tutorial bubble already avoids (`TUTORIAL_WINDOWS`). It never sits higher than the top bar's bottom edge.
- **Fold away.** A tip with no reaction for `TIP_PARK_DAYS` (1) game day folds into the Notices bar as a row "Tip: …". Slid away, the bar shows its "!" tab and peeks the row like a new notice. A click on the row opens the tip again; × drops it.
- **One at a time.** Tips that come up while one is open wait in a queue (first come, first shown) and show once the bubble is gone, if they still hold. The night speed-up tip (NightSpeedTip) waits while a tip bubble is open, and no tip opens while it is visible.

## Files and systems
- `src/ui/tipQueue.js` (new): `TipQueue` – pure state: current tip, waiting queue, seen set, parked tips; `next`, `due`, `close`, `park`, `reopen`, `drop`, `parkedList`. Game time in ms.
- `src/data/tips.js`: `TIP_PARK_DAYS`.
- `src/ui/TutorialGuide.js`: `TIP_CLEAR`, `tipWindowRects`, `tipTop`, `tipPlacement` (pure, built on `tutorialPlacement` / `freeBubbleSpot`); `openWindowRects` takes an optional selector. The guide keeps a `TipQueue` (`this.tips`); `tip` and `tipsSeen` are getters over it (smoke scripts still set `tutorial.tip`). New `showTip`, `parkTip`, `parkedTips`, `reopenTip`, `dropTip`, `placeTipBubble`. `place()` routes to `placeTipBubble` while a tip is shown and the tutorial is not active. `transitionend` of the HUD boxes also re-places a tip.
- `src/ui/NoticesPanel.js`: lists `scene.tutorial.parkedTips()` after the notices (`data-notice-tip`, `data-dismiss-tip`), counts them for the "!" tab and the peek; tips ignore category muting.
- `src/systems/NightSpeedUp.js`: `checkTip()` waits while `scene.tutorial.tip` is set (it is not used up).
- `src/style.css`: `.notice-tip`.

## Implementation decisions
- The time is game time (`gameTime.totalElapsed`), so a paused game does not fold a tip; the pointer over the bubble holds it too.
- Folding marks the tip seen (it never pops up again by itself); the parked list lives only in the page (lost on reload, like the bubble). Tips stay a browser matter – not in the save.
- Parked tips are not diagnostics issues: `ProductionDiagnostics` forgets issues its `detect()` does not find, so a separate list in the guide merged by NoticesPanel is simpler and keeps the save untouched.
- The tip's position is still computed every frame while it shows (`updateTips → placeTip`), so a panel that opens or closes moves it on the next frame; resize and `transitionend` re-place it at once.
- The tutorial bubble's own placement is unchanged (it was fixed in 0.78.0 and points at things inside the top bar).

## Save/Load impact
None. SAVE_VERSION unchanged; tips and their seen list stay in localStorage (`newgame.tipsSeen`).

## Testing
- `tests/tipy-mimo-listu.test.js`: placement clear of the top bar, side tabs, Dev tool and "Follow the king" at 3 screen sizes (shots 03 and 11) and with no target; re-placement when a window opens; `tipTop`; folding after a game day (not before, not while hovered), the notice row and the "!" tab, reopen and drop; one tip at a time with the queue; the night speed-up tip waits.
- `npm test` (1193 pass), `npm run build -- --base=/Newgame/` OK.
- Browser: **not run** (the other agent used the browser). New smoke `scripts/tips-hud-smoke.mjs` (step `tips-hud` in `browser-smoke.mjs`) is written but has not been run.

## Notes for the next agent
- Run the `tips-hud` smoke once and look at its shots (`SMOKE_SHOTS`); if the free spot in a small window is poor, the list in `TIP_CLEAR` is the knob.
- The cat/dog tip far off screen still puts its arrow at the screen edge (it may sit next to Settings); only the bubble avoids the HUD.
