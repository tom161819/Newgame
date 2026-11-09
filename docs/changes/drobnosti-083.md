# Small fixes from the 0.83.0 playtest (m-drobnosti-083)

## What and why
Playtest report 0.83.0 points 3, 4, 6, 7 and 8 (shots 02, 08, 09).
- **3 – Quarry arrow.** The tutorial looked only for `stone_deposit` and pointed into unexplored land. It now takes the whole stone family (`stone_deposit_large` too), ranks visible deposits first, then explored, then unexplored, and the nearest to the Castle within each. The arrow points at the footprint's centre (3 × 3 for large ones).
- **4 – Czech.** 25 wait/work messages of Woodcutters, Miners, Fishermen and others had no `work.message.*` key ("No mature trees in working radius"); they are translated. The construction window passed `{resource:name,...row}`, so the row's own `resource` id overrode the name ("wood:"); now `materialLine()` puts the name last. The marking line says what was marked by kind with the right plural ("Označeno k odstranění: 4 skály, 1 houština."), counting each rock tile, tree, single bush and thicket once even when a drag passes a group again; cancelling has plural forms too. Other strings in that window (phase, builders, ETA, unreachable reason) were already translated.
- **6 – Duplicate notices.** Rows with the same text (two Wheat Fields waiting for their farm's Farmer) are one row "×2"; × closes all of them, a click opens the first building.
- **7 – Barracks / workplaces.** The output line tells free places (`capacity − assigned`) from assigned workers not at work now (`assigned − present`): "Výkon 0 % – chybí 4 pracovníci, 1 je mimo budovu".
- **8 – Night speed-up.** The icon look sets `font-size:0` on the speed buttons, so the "☾" in the text never showed. The held step gets a small moon badge (`::after`) in its corner.

## Files and systems
- `src/systems/Tutorial.js`: `tutorialQuarryDeposit(deposits,centre,seen)`, `depositCentre`; `src/ui/TutorialGuide.js` `quarryDeposit()` uses them with `fog.displayState`.
- `src/i18n/cs.js`, `en.js`: `work.message.*` (25 keys), `rock.marked` (now `{list}`), `rock.markedNone`, `rock.kind.{rock,tree,bush,thicket}`, plural `rock.unmarked`, `staffing.output/open/away` (replace `staffing.status`), `notice.merged/mergedTip`, `tips.reopen`.
- `src/systems/RockMiningWork.js`: `markTile/markOne(tile,enabled,tally)`, `newTally`, `tallyCount`, `clearingSummary`; `src/ui/RockMiningTool.js` uses them. Return values of `markTile` are unchanged.
- `src/ui/ConstructionUI.js`: `materialLine`.
- `src/ui/noticeBar.js`: `mergeNotices`; `src/ui/NoticesPanel.js` renders merged rows (`data-dismiss-notice` may hold several keys separated by spaces).
- `src/systems/StaffingStatus.js`: `staffingLine(summary)`; `src/ui/WorkplacePanel.js` uses it.
- `src/style.css`: `.speed-controls .speed-button.is-night-auto::after`.
- Smokes adjusted to the new staffing text: `scripts/farmer-tending-smoke.mjs`, `scripts/workplace-output-smoke.mjs` (not run).

## Implementation decisions
- Marking: a rock group counts its tiles (each is mined separately and yields 10 Stone; the report expected "4 skály" for a 2 × 2 rock), a thicket counts as one. The list form ("Označeno k odstranění: …") avoids Czech verb agreement with mixed kinds.
- Notices merge by their rendered text, so different buildings with different names never merge; the bar's unread count still counts each notice.
- The moon is CSS only; SpeedControls already sets `is-night-auto` on the held step. No change in `art/ui` (the UI config has no speed-button option).

## Save/Load impact
None. SAVE_VERSION unchanged.

## Testing
- `tests/drobnosti-083.test.js`: deposit choice (large, visible first, explored before dark, family only); Czech work messages, material line, marking summary with plurals in cs/en; tally on a real scene (thicket = 1, 2 × 2 rock = 4, no double count); merged notices; staffing line for shot 09 and other cases in cs/en; the CSS badge rule.
- `npm test` (1193 pass), `npm run build -- --base=/Newgame/` OK. No browser run.

## Notes for the next agent
- Browser check still needed: the moon badge position over the ×3 button in both UI styles, a merged notice row, and the barracks line in the real window.
- Other English work messages may appear later: any literal passed to `wait(worker,'…')` or `workMessage='…'` needs a `work.message.*` key in both languages (the i18n test only checks parity, not coverage).
