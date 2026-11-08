# Notices 2 – less repetition, foldable Notice bar, food and mill advice (m-notice-bar-hlasky)

## What and why

Owner requests 66, 70 and 72 from the 0.50 playtest.

- **72 – less repetition.** The same notice (same reason + same building or resource) now comes again at most once per
  game day for informative notices and once per half day for warnings (before: every 30 s, and a problem that went
  away for a moment and came back produced a new event-feed line such as "the Quarry has run out of stone" each time).
  A problem that returns within its interval goes quietly back to its one row with a count ("×3"): no new feed line,
  no new `productionIssue` event, and a dismissed row stays dismissed. Danger (attacks, fire) is not throttled by this;
  those lines come from EventFeed / NightThreatSystem with their own rules.
- **72 – foldable Notice bar.** Already done in 0.64.0: right click (PanelDismiss) and a click on the title fold the
  card (`NoticesPanel.setCollapsed`). Added: a fold button (▾/▸) in the header, the folded state remembered in the
  browser, and while folded a new notice shows one line next to the button for 2 s, then fades out over 1 s; the
  button keeps an unread count until the bar is unfolded. Unfolded it behaves as before.
- **66 – low food and the fisherman.** The low-food notice lists every food source, built from data: "Food for only
  1 day(s) left. Build more food: Orchard (Farmhouse), Hunting Lodge, Fisherman's Hut near water or Wheat Field →
  Mill → Bakery."
- **70 – missing mill.** A completed Wheat Field with no Mill (built or planned) gives "Wheat is piling up – build a
  Mill to make flour."; a Bakery with no Mill gives "The Bakery needs flour from a Mill." At most once per 3 game days
  while the link is missing.

## Files and systems

- `src/data/diagnostics.js` – `NOTICE_REPEAT_DAYS` (info 1, warning 0.5, danger 0), `NOTICE_SEVERITY` (reason →
  severity, default warning), `CHAIN_ADVICE` (repeatDays 3, resources = `FOOD_RESOURCE_IDS`), `noticeSeverity`,
  `noticeRepeatDays`. Removed `DIAGNOSTICS.reminder` (30 s) and `COMPLETION_SOURCES` (hand-written mill/bakery map).
- `src/data/productionChains.js` (new) – pure helpers over building definitions: `buildingOutputs` (recipe output,
  crop resource, `GATHER_OUTPUTS`), `buildingInputs`, `producersOf`, `consumersOf`, `isRawSource`, `chainTo`,
  `foodSources` (from `EDIBLE_RESOURCES`), `chainLinks`.
- `src/systems/ProductionDiagnostics.js` – one issue pipeline: `track` / `observe` / `notify` / `forget`, a `memory`
  map (memory key → last report, count, dismissed) that holds resolved notices for the repeat interval, `chainIssues()`
  for chain advice (replaces the separate `completionNotices` map). `completed()` still gives chain advice right away
  when a building is completed. `resolveCompletionNotices()` is still there (the chain-notices smoke uses it).
  `issue.reminders` was replaced by `issue.count`.
- `src/ui/noticeText.js` – `foodSourceList(scene)`, texts for `missingChainSource` and the new `chainNoConsumer`.
- `src/ui/noticeBar.js` (new) – `NOTICE_BAR` (storage key `newgame.notices.collapsed`, flash 2000 ms, fade 1000 ms),
  `readCollapsed` / `writeCollapsed` (try/catch), `NoticeBarState` (unread count, what counts as new).
- `src/ui/NoticesPanel.js` – fold button `#notices-toggle` and `.notices-flash` added in JS (index.html unchanged),
  `.notice-count` on rows with count > 1, folded state read on start and written by `setCollapsed` (also from the
  right-click PanelDismiss path).
- `src/style.css` – fold button, unread badge, flash line with a 1 s opacity transition, count chip.
- `src/i18n/en.js`, `src/i18n/cs.js` – `notice.foodLow` (new `{sources}`), `notice.missingChainSource` (new text),
  new `notice.chainNoConsumer`, `notice.foodSource.water`, `notice.foodSource.farm`, `notice.or`, `notice.repeated`,
  `notice.repeatedTip`, `notice.collapse`, `notice.expand`, `notice.unread`.
- Tests: `tests/notices-2.test.js` (new), `tests/production-diagnostics.test.js` (updated for the new intervals and
  chain advice).
- Smokes: `scripts/notices-2-smoke.mjs` (new, registered as `--notices-2` in `scripts/browser-smoke.mjs`, **not run**);
  `scripts/chain-notices-smoke.mjs` text regexes updated to the new chain texts (not run).

## Implementation decisions

- **Same notice** = same issue key (`entity:reason`, or the chain key) plus `params.resource`. Kingdom-wide notices
  (entity 0) are therefore one per reason.
- **Repeat interval in game days** (`gameTime.dayDuration`), so it scales with the 60/120/240 s day setting. A
  lasting problem is reminded once per interval (the row comes back if dismissed, the count goes up). The first report
  still needs `DIAGNOSTICS.persistence` (10 s) of the problem lasting.
- **Danger = 0 days**: no hold-back between separate events; a lasting one would still not be repeated more often
  than `persistence`. No diagnostics reason is danger today.
- **Chain rules from data.** Links come from recipes (`input`/`output`), crops (`crop.resource`) and `GATHER_OUTPUTS`.
  `CHAIN_ADVICE.resources` picks which chains get advice (now the food resources; other chains – e.g. iron – can be
  turned on by adding their resources, the rules are generic). Rules:
  1. a completed consumer whose input has no planned/built producer → `missingChainSource` (Bakery → Mill, Mill →
     Wheat Field);
  2. a completed producer whose non-edible output has no planned/built consumer → `chainNoConsumer`. A raw source
     (field, gatherer) always counts; a workshop (Mill without Bakery) only once its output is in the stores, so an
     idle Mill does not complain about flour.
  One notice per chain (key `chain:<type>:<resource>`), pointing at the lowest-id building. Chain advice is
  `informational`: it gives way to a real blocker of the same building and is not shown as the building's own issue.
- **Food sources**: one entry per edible resource; a raw source is one building (with "near water" for buildings with
  `fishing`, "(Farmhouse)" for crops with a required farm), processed food lists its whole chain. Names come from the
  registry, so Czech works; the text uses a list after a colon to avoid Czech case endings.
- **Notice bar**: "new" = issue key + `lastNotified`, so a reminder flashes again but a quiet return does not. The
  first render after the page opens only learns what is there (no flash of old notices). Muted categories do not count.
  The flash uses page timers (UI only, not game time). Unread count shows up to "9+".

## Save/Load impact

None. SAVE_VERSION stays 59. Diagnostics (including the repeat memory) are not saved, as before: after Load a
problem must last again before it is shown, then chain advice comes back. The folded state is a browser preference in
localStorage, not in the save.

## Testing

- `npm test` (node scripts/test.mjs): 1071 tests, all pass (5 new in `tests/notices-2.test.js`: repeat data, a
  flickering depleted Quarry gives one row ×6 and one feed line within a day, low food lists the Fisherman's Hut (en +
  cs), Wheat Field without Mill at most once per 3 days and the Bakery text, folded storage + unread logic).
- `npm run build -- --base=/Newgame/` succeeds.
- Browser smokes were not run (another agent uses the browser). To run later: `node scripts/browser-smoke.mjs
  --notices-2` and `--chain-notices` (its texts were changed).

## Notes for the next agent

- Run `--notices-2` and `--chain-notices` once the browser is free; also `--notices`, `--e1`, `--storage-notices`
  (they read the Notices panel; the folded state is cleared by the new smoke at its end, but a smoke that folds the
  panel by right click would now leave it folded for later scenarios in the same browser context).
- Severity per reason lives in `NOTICE_SEVERITY`; add new reasons there if they are informative.
- `ProductionDiagnostics.memory` is pruned after `CHAIN_ADVICE.repeatDays` days (the longest interval); if a longer
  interval is added, prune by the longest one.
