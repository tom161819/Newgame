# m-prehled-kralovstvi-pozice – Kingdom overview in the bottom-left bar, draggable Notices, full-width building strip (plan point 81, rework)

## What and why

Plan point 81 asked for a fixed place for the "Přehled království" panel. The owner's rework comments (9 Nov) decide the
details: (1) the overview has a fixed place in the bottom-left corner, always in the same bar, not a popup; (2) the
Notices bar can be dragged anywhere with the mouse; (3) the building strip, when open, spans from the left edge to the
right edge of the screen. So:

1. **Kingdom overview bar** `#kingdom-bar` (in `.viewport`, `index.html`): a permanent bar with residents / housing,
   unemployed, the five average needs, the average mood and the Kingdom Attractiveness (its factors and "chance a migrant
   settles" in the row's tooltip; the settle-block line below). 13 px text (was 11 / 12), values bold (750), title 14 px.
   It folds to a one-line strip ("👥 12 / 20 · ☺ 65 %"); folded or not is kept in `localStorage`
   `newgame.kingdomBar.collapsed`. Its own title button and the top-bar chips (`#kingdom-overview`, now a toggle with
   `aria-expanded`) fold / unfold it. The old hover popup `#kingdom-overview-panel` is gone.
2. **Placement** (`KingdomOverview.place()` → `hudLayout.placeBottomLeft`): the bar sits in the map's left column, as low
   as it can, stacked above whatever is in the way: camera chips, Notices (also when the player moved them there),
   event feed, minimap (a UI layout with the corner stack at the left), the unit command bar, the Settings / Dev tool
   buttons, side tabs, the HUD and the open building strip. Only when the left column has no room down to the HUD does
   it try a spot just right of an obstacle. Runs every 200 ms in `update()`, on resize and on the `hud-layout` document
   event (BuildingBar and NoticesPanel send it).
3. **Draggable Notices**: a grip `⠿` (`#notices-grip`) in the heading, and the slid-away tab, drag the bar. The place is
   kept as the nearest map corner plus distances (`newgame.notices.position`, `hudLayout.anchorPosition`), so it stays put
   when the window grows and is clamped fully on screen (`resolvePosition`). Double-click on the grip = back to the
   corner stack (key removed). Slid away, a moved bar folds to its nearer side edge (`edgeTabLeft`, beside a side tab at
   the same height like 0.81's `placeTab`); the peek shows next to the tab there (row-reversed on the left edge). An
   unmoved bar behaves exactly as in 0.81 (slides off to the right of the corner stack).
4. **Full-width building strip**: `.buildings-bar:not([data-ui-free]) > .buildings-panel` is `left:calc(50% - 50vw);
   width:100vw` (the bar is centred in the window). While it is open `BuildingBar.updateLift()` sets `--buildings-lift`
   on `.viewport` (how far the strip reaches into the map, `hudLayout.bottomLift`; 0 when it opens downwards with the
   buildings bar at the top). The camera chips and the corner stack (Notices, events, minimap) use it in their `bottom`,
   so they move up above the strip; the overview bar stacks above them. Chosen over "overview sits above the strip
   permanently" because that would waste the map's bottom edge while the strip is closed, and over "strip stops at the
   overview" because the owner asked for edge to edge.

## Files and systems

- `src/ui/hudLayout.js` (new, pure): `placeBottomLeft`, `bottomLift`, `overlaps`, overview fold persistence, Notices
  position (`anchorPosition`, `resolvePosition`, `normalizePosition`, read/write/clear), `edgeTabLeft`.
- `src/ui/KingdomOverview.js` – `KingdomOverview` rewritten (bar, fold, place); `kingdomOverview()` values unchanged;
  `KINGDOM_BAR_AVOID` lists the obstacles; `kingdomBarSummary()`.
- `src/ui/NoticesPanel.js` – grip, `dragStart/Move/End`, `resetPosition`, `applyPosition`; `placeTab()` hands over to
  `applyPosition()` while the bar is moved; listens to `hud-layout`.
- `src/ui/BuildingBar.js` – `updateLift()` on toggle / close / render / resize; `destroy()` clears the variable.
- `src/style.css` – `.kingdom-bar*`, `.notices-grip`, `.notices-panel.notices-moved*`, full-width strip rule, lift in
  `.camera-controls` and `.corner-stack`; the old `.kingdom-overview-panel` rules removed.
- `index.html` – `#kingdom-bar`; `#kingdom-overview` without the popup. `src/ui/TutorialGuide.js` – `#kingdom-bar` in
  `TIP_CLEAR` (tips keep clear of it). i18n: `overview.collapse`, `overview.expand`, `notice.drag` (EN + CS).

## Implementation decisions

- UI free placement (`art/ui/uiConfig.js`, 0.80.1) is respected: a free frame on `.buildings-bar` keeps the old panel
  (the full-width rule needs `:not([data-ui-free])`); free-framed minimap / Notices / camera chips are simply obstacles at
  their real rects; a free frame on `#notices-panel` stays the base and the player's drag is applied as a CSS `translate`
  offset from it (`applyFree` rewrites `position/left/top/…` on every DOM mutation, but never `translate`). Without a
  frame a moved bar is `position:fixed` via `--notices-left/--notices-top`, which `applyFree` does not touch either.
- `#kingdom-bar` is not added to `FREE_REGIONS` (that file is shared with the Studio UI Lab, which another chat owns);
  the bar places itself and avoids whatever the design moved into its corner.
- The overview bar is placed from measured rects rather than fixed CSS offsets so the many layout options (camera chips
  left/right/top, corner stack left/right, HUD top/bottom, free frames) all work without per-option CSS.

## Save/Load impact

None. SAVE_VERSION unchanged (61). The fold and the Notices position are browser preferences in `localStorage`.

## Testing

- `npm test` (1219 tests pass), new `tests/kingdom-bar-layout.test.js`: the bar's rect clear of HUD, chips, Notices,
  minimap, Settings / Dev buttons and side tabs at 1920×1080 and 1366×768, expanded and folded, with the strip closed and
  open (full width, lifted chips / corner stack); the strip opening downwards lifts nothing; Notices position round trip,
  resize clamp, storage (broken JSON, blocked storage), reset; edge tab beside a side tab; fold toggled by the top-bar
  chips and the bar's toggle, kept across a new instance.
- `npm run build -- --base=/Newgame/` passes.
- Browser smoke **written but not run** (the browser was in use by another chat): `scripts/kingdom-bar-smoke.mjs`,
  `npm run smoke -- --current-only --kingdom-bar`; `scripts/kingdom-overview-smoke.mjs` (`--overview`) updated to read
  the needs from the bar instead of the removed hover popup.

## Notes for the next agent

- Needs browser verification: real placement at 1920×1080 and 1366×768 (also with the HUD on two rows and the Dev tool
  button shown), the strip edge to edge with the lifted chips / minimap, dragging the grip and the slid-away tab (the
  click after a tab drag must not slide the bar out), the left-edge fold and peek, a resize, the double-click reset, and
  how the UI Lab styles (rivets frame, light theme) draw the new bar.
- Phones (≤ 760 px): the expanded bar takes up to 330 px of a small map; consider starting folded there.
- The UI Lab snapshot of the game screen (`art/ui/snapshots`) does not have `#kingdom-bar` yet; if Grafika wants to style
  or free-place it, add a `kingdomBar` region in `FREE_REGIONS` together with the Lab.
