# #105 – Event feed above the minimap, no overlap with Notices

## What and why
[#105](https://github.com/tom161819/Newgame/issues/105) asks for a short feed of notable events above the minimap. The Notices panel (`position:fixed`, bottom-right) also covered the minimap added in #104. Both are fixed by one bottom-right column inside the map: Notices → event feed → minimap. Release 0.5.1 (PATCH, no schema change).

## Files and systems
- New `src/ui/EventFeed.js` (`EventFeed`, `FEED`, `cornerStack()`), created in `GameScene` right after the `Minimap`, updated each frame and destroyed with the scene.
- `index.html`: `#corner-stack` after `#game`, and `#notices-panel` moved into it. `src/style.css`: `.corner-stack`, `.event-feed`, `.feed-entry`; the Notices panel and the minimap are no longer positioned on their own.
- `src/ui/Minimap.js`: mounts in `#corner-stack`. The size comes from the CSS variable `--minimap-size` (150 px, 105 px under 760 px) instead of `transform:scale(.7)`, and clicks use the canvas's real `offsetWidth`.
- i18n `feed.*` (EN/CS, gender-neutral Czech). Tests `tests/event-feed.test.js`; smoke `scripts/event-feed-smoke.mjs` (`--event-feed`).

## Implementation decisions
- The feed has no queue of its own. It listens to existing sources: `seasons.onChange`, `GameActivityBus` (`buildingCompleted` deduplicated by building id because every builder emits it; `combatDamage` against residents, at most one message per resident per 30 s of game time), `workerSystem.subscribe` (it diffs the resident ids for arrival, death and leaving), and `foodSystem.shortage` turning on (checked in `update`).
- UI only and never saved. Baselines (season, residents, shortage) are taken at construction, so a loaded game shows no replayed history.
- At most five entries, newest on top. Each lasts 8 s, important ones 12 s. Real-time expiry is shifted by the paused duration, so paused play keeps the messages readable.
- The list has `pointer-events:none`, so it never blocks map clicks. It is `aria-live="polite"`.
- Lasting work problems stay in Notices (#51). The feed is for one-off moments.

## Save/Load impact
None. SAVE_VERSION stays 33; nothing in the feed is persisted.

## Testing
- `npm test` passes, including 2 new event-feed tests (sources, order, cap, dedupe, unpaused expiry, attack throttle, unsubscribe).
- Smoke `--event-feed --minimap --notices` passes: column order, no overlap on desktop and at 390 px, phone minimap click centres the camera on the clicked tile, entries kept while paused and faded after.
- `npm run build:pages`, `changelog:validate` and `version:check` pass.

## Notes for the next agent
- New feed messages: add a key under `feed.*` and call `scene.eventFeed.push(uniqueKey,text,{important})` from the source, or subscribe inside `EventFeed`. The key deduplicates.
- Anything else for the bottom-right corner goes into `#corner-stack`, not a separate fixed position.
- The smoke feeds `onActivity` directly: emitting on the real bus would also grant XP.
