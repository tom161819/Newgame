# #101 – Stone pickup "flicker": the top bar reflowed

## What and why
[#101](https://github.com/tom161819/Newgame/issues/101) reported a brief flicker when the King picks up a stone, probably when zoomed far out. A reproduction at zoom 0.25 and 1.0 recorded every frame (Chrome screencast) around a real pickup with a fixed camera.

The map itself does not flicker: no frame differs from both its neighbours, no chunk repaint happens, and Fog of War reveals nothing. The visible jump is the top bar. When the first stone enters the King's cargo, `#king-cargo-deliver` and `#king-cargo-status` appear in the inventory row (`flex-wrap`). That pushes Food onto another line and moves the clock, health and XP, about 6 % of the bar's pixels in one frame. Delivering reverses it. Zoomed out, the map is static, so the jump stands out.

## Files and systems
- `src/style.css`: on desktop (≥761 px) both cargo elements keep their slot while `[hidden]` (`visibility:hidden` instead of `display:none`). The status has a fixed width of 17rem with an ellipsis. Phones keep the earlier wrapping layout.
- `src/game/GameScene.js`: the cargo status also sets its full text as `title`, so truncated text stays readable.
- `scripts/hud-cargo-smoke.mjs` (`--hud-cargo`, also in `--full`):
  - spawns a test stone at zoom 0.25 and lets the King pick it up for real;
  - checks that the bar's elements keep their rows, heights and positions (±3 px for the running clock text);
  - checks the tooltip and phone visibility;
  - restores the game snapshot afterwards.

## Implementation decisions
- Reserving the slot was chosen over moving cargo into an overlay: the button stays where players already know it, and nothing else in the HUD changes.
- The `hidden` attribute and `isVisible()` behaviour are unchanged. Hidden controls are invisible and cannot be focused, so other smokes and keyboard use are unaffected.
- The smoke restores a snapshot because a real pickup grants King XP and cargo, which later default checks count exactly.

## Save/Load impact
None. SAVE_VERSION stays 35.

## Testing
- The new smoke fails on the previous build (`#inventory-items` moved 6 px) and passes with the fix, twice in a row, together with the default current smokes.
- Frame analysis before the fix shows the only one-frame change at pickup is the HUD region.
- `npm test` (743 pass), `changelog:validate`, `build:pages` and `version:check` (0.7.0 → 0.7.1 patch) pass. After merging main (#185), `--hud-cargo --castle-gathering --needs` pass.

## Notes for the next agent
- New HUD elements that appear during play should also reserve their place on desktop, or the bar jumps.
- Pickup rules are a separate task (AUD78) and were not changed.
