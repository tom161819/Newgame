# Unit bar out of the Army tab, icon orders, livelier camp (0.143.7)

## What and why
Owner 17 Nov 2026 (screenshot): move the unit bar to the bottom left, joined to the Army tab like an open tab; larger kind boxes with the unit's picture and count; orders as icons with a name and explanation on hover; soldiers' stand-still moves 50 % more often; a more detailed bandit camp (tents, a fire with a cauldron in the middle…).

## Files and systems
- `UnitSelection.placeAboveBar`: with a soldier chosen and the Army tab shown, the bar is `docked` (left 8 px, width to the tab's right edge, bottom at the tab's top; `--neck` = tab width) and the tab gets `joined`; otherwise as before (`undock`). `iconButton` sets icon, `data-tip-title`/`data-tip` (CSS tooltip) and aria-label. `kindPicture` cuts the standing frame of the first man's look from the loaded sheet into a 36×50 canvas (cached per look; retried while the sheet loads).
- `soldierIdle`: waits 1.0–5.7 s first, then 1.7–7 s between moves.
- `zoneFeatures` bandits: `feature.camp` (fire at the centre, 4 tents at 4.3–4.8 tiles facing it, seats, crates, rack, bedrolls); the chest moves before the chief's tent; guards stand between the tents. `src/game/BanditCamp.js` draws it with Phaser graphics (provisional art), the fire flickers and smokes on a 100 ms timer; `populateFeature` calls it.
- i18n: command tips, formation names and tips, `command.kindTip`, `command.formationHint`.

## Implementation decisions
The camp pieces do not block the way (no tile changes), so units may brush through a tent corner. Workers alone (no soldier) keep the centred bar.

## Save/Load impact
None.

## Testing
tests/unit-command-bar-place.test.js (docking), soldier-anim tests; npm test; browser: Test map bandit camp, 12 soldiers chosen – docked bar with pictures, tooltips, formation drag.

## Notes for the next agent
Studio art for the camp can replace BanditCamp.js piece by piece (tent, fire, crates). Command icons: COMMAND_ICONS / STANCE_ICONS in UnitSelection.
