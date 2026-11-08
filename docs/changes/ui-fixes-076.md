# UI fixes from the 0.76.0 playtest (m-ui-prekryvy-076, m-drobnosti-076)

## What and why
Two approved plan items from the 0.76.0 playtest report (points 4–12; shots 03, 04, 05, 07, 08, 09).

m-ui-prekryvy-076 (points 4–7), things lying over each other:
- **Tutorial bubble and tips (4).** The bubble and the tips no longer cover an open window: the Build menu, Population, the job menu, the Policy and Employments cards, Settings, the Royal tasks card, the unit command bar and any open dialog (such as a resident's card). They take the free spot nearest to the arrow. If the target is inside a window (such as a category in the Build menu), the arrow comes from above. So in the "Storage and workshop" step neither the bubble nor the arrow covers Infrastructure.
- **Royal tasks card (5).** While the Build menu is open, the card moves up above the menu. If it would then go under the HUD, it folds to its title first and opens again when the menu closes.
- **Event feed (5).** Lines stay left of the side tabs (34 px margin, like the Royal tasks card), wrap to at most two lines, and show the full text as a tooltip.
- **Policy × Employments (6).** In the 0.76.0 run the Employments tab opened the Castle window, and that window also holds the Kingdom policy section. The playtester saw Policy and Employment priorities in one card, one over the other. Now, when Employments is opened from its tab, it shows only the priorities and a "Kingdom Policy ›" link that switches to the Policy card. When the Castle opens it, the window is unchanged, policy included, as the owner wanted in side-cards. The shared manager (`SideCards`) still opens one card at a time. It now also covers the docked unit panel (the King panel or a resident's card): opening that panel closes Policy and Employments, and opening either of those closes the panel. Population keeps the resident card open beside it.
- **King panel (7).** The skill rows in the unit panel use narrower, shrinkable columns, and descriptions wrap. The hauler-capacity note goes onto its own line under its row, and the + buttons stay in the last column. The panel no longer scrolls sideways.

m-drobnosti-076 (points 8–12):
- **8.** The HUD "More" toggle is built before the language is read, so it stayed "More". It now carries `data-i18n`/`data-i18n-attr`, so `initLanguage()` relabels it ("Více").
- **9.** Once the game has run faster than ×1, the Speed step stays done (remembered in the browser like "Next" on it), even after slowing down. Step order is unchanged.
- **10.** Every Woodcutter's felling set the status line "6 wood lies by the stump. Carry it to storage." That is why it stayed up for days. Now only the King's own felling shows it, while he is the unit in hand (no residents selected), and the text says Haulers will carry the wood. A test confirms that Haulers already pick up the King's wood drop (`LogisticsTaskManager` lists every loose managed drop). Logistics needed no change.
- **11.** Czech number forms:
  - New `pluralCategory(count)` / `pluralForm(forms,count)` in `src/i18n/index.js` (cs: 1 / 2–4 / fraction / 5+). t() already picks dictionary objects by `params.count`.
  - Fixed strings:
    - Royal task rewards: "10 kamenů", "2 kameny", "1 kámen".
    - Food notice: "na 2 dny", "1 den", "5 dní".
    - Feast cooldown ("za 2 dny") and feast time left (decimal, "1.5 dne").
    - Caravan time in the Marketplace ("1 den", "3 dny", "1.5 dne").
  - The death line is "zemřel" or "zemřela" by `identity.sex`, with "zemřel(a)" kept for residents without an identity.
  - All 100 Czech origins in `src/data/names.cs.js` were checked: every genitive is right ("z Hrnčíř" is right, from Hrnčíře), so nothing changed. A test keeps "ze" before s/z/š/ž + consonant.
- **12.** The HUD counter "Sklady 28 / 700" is now "Materiál" (en "Materials"). Its tooltip says what it counts and that food is kept in the Granary and the Farmhouse, not here.

## Files and systems
- `src/systems/Tutorial.js`:
  - `tutorialPlacement({…,windows})`.
  - New pure `freeBubbleSpot()`: the nearest free spot, or the one covering least.
  - New `rememberSpeed()`.
- `src/ui/TutorialGuide.js`:
  - `TUTORIAL_WINDOWS` and `openWindowRects()`, passed to the placement of steps and tips. The arrow-less bubble uses `freeBubbleSpot` as well.
  - `progress()` remembers the Speed step.
- `src/ui/RoyalGoalsPanel.js`:
  - Pure `goalsCardPlacement()` and `clearBuildMenu()`, called from `update()` and measured at most every 150 ms, only while the menu is open.
  - Rewards pass `count`.
- `src/ui/SideCards.js`: card mode of Employments (`cardMode()`, the `.side-card-link`), plus a wrap of `unitPanel.open` and closing the unit panel from `openCard()`.
- `src/ui/EventFeed.js`: `deathLine()` and the line tooltip.
- `src/ui/CompactHud.js`: the i18n data attributes.
- `src/systems/NaturalResourcesSystem.js`: `stumpMessageShown()`.
- `src/ui/noticeText.js` and `src/ui/PolicyPanel.js`: pass `count`.
- `src/i18n/index.js`: `pluralCategory` and `pluralForm`.
- `src/i18n/en.js`, `src/i18n/cs.js`:
  - Plural objects: `notice.foodLow`, `goals.res.stone`, `policy.feastNo.cooldown`, `market.days`.
  - New keys: `feed.diedOf.m`, `feed.diedOf.f`.
  - Texts: `hud.storeCapacity`, `hud.storeCapacityHint`, `status.woodBesideStump`, `policy.feastRunning`, `needs.feastLine`.
- `src/style.css`: three small localized blocks (event feed, King or unit panel skill rows, `.side-card-link`).
- `tests/ui-fixes-076.test.js` (7 tests).
- `scripts/ui-fixes-076-smoke.mjs`, registered in `scripts/browser-smoke.mjs` as `--ui-fixes-076`.

## Implementation decisions
- **Placement.** The free-spot search is a small grid scan (16 px), plus the edges of every blocked box, scored by covered area and then by distance to the arrow. Without `windows` the old placement is kept bit for bit (tested), so the existing tutorial tests and behaviour stay as they were.
- **Windows list.** It is a selector list in `TutorialGuide`, not a registry, so no window class had to change. A closed window is skipped by the existing `visible()` check (hidden, `visibility:hidden`) and by a viewport test.
- **Royal tasks.** Moving the card keeps it readable. Folding is only the fallback when there is no room above. The fold is undone only if it was automatic.
- **Employments.** It is not split from the Castle window. The policy section is only hidden in tab mode, so `#policy-tax` and the other ids (and `policy-smoke`, `side-cards-smoke`) keep working.
- **"King selected".** The King is the player's avatar, so it means that no residents are selected. At the moment of felling he always stands at the stump.

## Save/Load impact
None. `SAVE_VERSION` stays 60. Everything here is UI and texts. The Speed-step memory uses the existing browser key `newgame.tutorial.speedSeen`.

## Testing
- `npm test`: 1126 pass (1119 + 7 new in `tests/ui-fixes-076.test.js`):
  - bubble geometry against open windows (shots 03, 04, 05);
  - Royal tasks placement;
  - side windows exclude each other (fake DOM);
  - Czech plurals, death lines by sex, More data attributes, the Materials label;
  - "z / ze" origins;
  - the Speed step stays done;
  - the King's wood drop is hauled, and the stump message is shown only for the King.
- `npm run build -- --base=/Newgame/` succeeds.
- Browser smoke: not run (a parallel agent uses the browser). To run later: `node scripts/browser-smoke.mjs --ui-fixes-076` (with `SMOKE_SHOTS=<dir>` for screenshots of the places of points 4–7), and with it `--side-cards --policy --employment --population --tutorial --ui-windows --king-xp`, the existing scenarios that touch the same windows.

## Notes for the next agent
- New windows that the tutorial bubble must avoid go into `TUTORIAL_WINDOWS` in `src/ui/TutorialGuide.js`.
- `SideCards` wraps `employmentPanel.open` (it now takes `{card}`), `populationSidebar.setOpen` and `unitPanel.open`. Code that calls `employmentPanel.open()` without `card:true` gets the whole Castle window.
- For a Czech count, give the dictionary value as `{one,few,many?,other}` and pass the number as `count`. A decimal shown with `toFixed` takes the `many` form ("1.5 dne").
- Other "{count} {resource}" lines (harvest, carrying, thieves) still use the resource name in the nominative. They need resource names with case forms, which is a bigger task. Not done.
