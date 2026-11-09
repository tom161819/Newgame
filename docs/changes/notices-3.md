# Notices 3 – the same notice once, the bar slides to the edge (m-hlasky-jednou, m-notice-bar-zasunuti)

## What and why

Owner points 79 and 80 (plan priority 1). They replace the 0.68.0 repeat intervals and the 2 s flash line
(docs/changes/notices-2.md).

- **79 – the same notice only once.** A notice with the same key (reason + building or resource) is in Notices once.
  While its row is open, nothing repeats it: a lasting problem is not reminded, and a problem that goes away and
  comes back returns quietly to its row (×N, updated time, same place in the list, no `productionIssue` event, no feed
  line, no slide-out). When the player closes the row, the same notice comes back at the earliest **4 game days after
  the close** – whether the problem lasted or went away and came back meanwhile. Danger is never held back. The chain
  advice (Wheat Field without a Mill, Bakery without a Mill) follows the same rule (before: its own 3 days). The close
  times are saved, so closed notices do not come back right after Load.
- **80 – the bar slides into an icon.** The fold button (▸ in the header), the title click and right click (PanelDismiss)
  slide the Notices bar fully past the right edge in ~0.3 s; only a small tab stays at the edge: an arrow ◂ (click =
  slide out) and "!" with a small count while there are unread notices. Remembered in the browser (same key as 0.68,
  `newgame.notices.collapsed`). A new notice while away slides the bar out to one message for 4 s, then back; "!"
  stays until the bar is slid out. The pointer over it holds it out (1 s more after leaving). Several at once: the most
  important (danger > warning > info, newer on a tie) with "+N". A click on the message opens it like a row. A quietly
  updated notice does not slide out.

## Files and systems

- `src/data/diagnostics.js` – `NOTICE_REPEAT_DAYS` now `{info:4,warning:4,danger:0}` (days after a close, also the
  quiet-return window); `noticeRepeatDays(reason,severity)`; `NOTICE_REPEAT_MAX_DAYS`; `CHAIN_ADVICE.repeatDays`
  removed; `NOTICE_CLOSED_LIMIT` (500) and `validNoticeState(state,totalElapsed)` for the save field.
- `src/systems/ProductionDiagnostics.js` – issues carry `severity` (found.severity or `noticeSeverity`) and
  `updatedAt`; new `closed` map (memory key → close time); rewritten `observe` (closed → hidden and counted; gone and
  back while open → quiet; lasting open → never repeated; closed and lasting → new notice once 4 days passed);
  `dismiss` records the close time (not for danger); memory entries keep `seenAt` (window measured from when the
  problem was last seen); `prune`, `exportState`, `importState`.
- `src/systems/GameStateSerializer.js` / `GameStateLoader.js` – optional save field `notices` (`{closed:[[key,time],…]}`).
- `src/ui/noticeBar.js` – rewritten: `NOTICE_BAR` (`peekMs` 4000, `hoverGraceMs` 1000, `slideMs` 300), pure
  `NoticeBarState` (`observe(issues,now)` → peek `{issue,count,more,until}`, `hover`, `expire`, `alert`, `unread`),
  `noticeRank`, `mostImportant`. "Seen" is a map key → report time that keeps keys whose row left (a quiet return is
  not new).
- `src/ui/NoticesPanel.js` – `#notices-tab` (arrow, `.notices-alert` "!", `.notices-unread` count) and `#notices-peek`
  created in JS (index.html unchanged); the flash line and its timers removed; page timers drive the peek; pointer
  enter/leave hold it. The panel stays visible while slid away if there are unread notices.
- `src/style.css` – the Notices fold block replaced: transform slide with `transition: transform .3s`,
  `.collapsed` = `translateX(calc(100% + 12px))` (12px = corner-stack offset), `.peeking`, tab, peek, "+N";
  reduced motion = no transition.
- `src/i18n/en.js`, `cs.js` – `notice.collapse` / `notice.expand` texts changed (slide away / out), new `notice.more`.
- Tests: `tests/notices-3.test.js` (new, 5 tests); `tests/notices-2.test.js` and `tests/production-diagnostics.test.js`
  updated to the new rules (intent kept: one row with a count, one feed line, closed stays closed, chain advice).
- Smoke: `scripts/notices-2-smoke.mjs` rewritten for the new behaviour (same flag `--notices-2`, **not run**).

## Implementation decisions

- **Same notice** = memory key `issue.key + ':' + params.resource` (as in 0.68).
- **Quiet return while open**: a row that went away on its own (problem solved) and comes back within 4 days of when
  it was last seen goes back to its row quietly (same `lastNotified`, so it keeps its place and the bar does not treat
  it as new). After a longer absence it is a new notice. This keeps flickering causes from spamming (request 72).
- **Lasting open rows are never reminded** (0.68 reminded every ½ / 1 day). A closed row that is still lasting comes
  back as a new notice (count reset, new feed line, slide-out) exactly 4 days after the close.
- **Danger** (`severity:'danger'`, repeat 0): every new occurrence is reported at once; closing a danger row stores no
  close time; a lasting closed danger stays closed until it goes and comes again. No diagnostics reason is danger
  today (attack/fire/disease/death lines come from EventFeed / NightThreatSystem, which are unchanged); a producer can
  pass `severity:'danger'` in a found issue.
- **Bar time is page time** (performance.now), not game time; the game is often paused while reading.
- "!" = unread count > 0 while slid away; it is cleared only by sliding the bar out (clicking the peek message opens
  the building but keeps "!").
- The tab sits in the panel (absolute, `right:100%`), so it moves with the slide and is next to a peek; the collapsed
  panel turns `overflow:visible` so the tab is not clipped.

## Save/Load impact

SAVE_VERSION stays **60** (no bump). New optional top-level field `notices: {closed: [[memoryKey, closedAt], …]}`:
exactly that one key; at most 500 entries; keys `/^[A-Za-z0-9_:.-]{1,200}$/`, unique; `closedAt` finite,
`0 ≤ closedAt ≤ time.totalElapsed`. Anything else rejects the save. Absent = nothing closed (older saves load). Only
close times still inside the 4-day window are written. Open rows and the quiet-return memory are not saved: after
Load a problem must last again (10 s) and an open notice comes back as a new one; a closed one stays hidden until 4
days after its close. The slide-away state is a browser preference, not in the save.

## Testing

- `npm test` (node scripts/test.mjs): 1153 tests, all pass.
- `npm run build -- --base=/Newgame/` succeeds.
- Browser smokes not run (shared browser). To run later: `node scripts/browser-smoke.mjs --notices-2` (rewritten),
  plus `--chain-notices`, `--notices`, `--e1`, `--storage-notices`, `--depleted-mine`, `--right-click`,
  `--side-cards`, `--ui-fixes-076` (they read or fold the Notices panel; texts and fold behaviour changed).

## Notes for the next agent

- Check in the browser that the tab at the right edge does not overlap the side tabs (Population / Employments, fixed
  at the right edge) at small heights; move `.notices-tab` `top` if it does.
- A smoke that slides the panel away (right click) leaves it slid away for later scenarios in the same context; the
  `--notices-2` smoke clears the key at its end.
- To add a danger notice to Notices, push a found issue with `severity:'danger'`; it then wins the peek and is never
  held back.
- The 4 days are `NOTICE_REPEAT_DAYS` (per severity) in `src/data/diagnostics.js`.
