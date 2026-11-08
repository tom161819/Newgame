# Event messages with a place, danger marks and causes of death (m-hlasky-udalosti)

## What and why
Owner request: messages should show where something happened, a death should say why, and dangerous places should be marked. Feed lines with a target are clickable and move the camera there; attacks, deaths, fires and wolves leave a red danger mark; deaths record a cause shown in the feed and in a Deceased list.

## Files and systems
- `src/ui/EventFeed.js`: `push(key,text,{important,target})`; lines with a target get `.is-locatable` and call `scene.focusOn(target)`.
- `src/game/GameScene.js`: `focusOn(target)` resolves a live object, a building (tiles centre) or a point and sets `WorldCamera.panTarget` (Phaser `cameras.main.pan` is overridden every frame by WorldCamera, so it cannot be used). `onUnitDeath` sets `unit.deathCause` and a danger mark.
- `src/ui/DangerMarks.js`: `DANGER`, `mark/ping/update`, `deathCauseText`.
- `src/systems/WorkerSystem.js`: `recordDeath`, `deceased` (last 50) in the exported state.
- Domestic animals, caravans and NightThreat (fire, wolves) pass targets to the feed.
- `src/ui/PopulationSidebar.js`: `renderDeceased` (`#population-deceased`).

## Implementation decisions
- The i18n key for the list heading is `population.deceasedCount`; `population.deceased` already existed as the status label of a dead resident.
- A target that no longer exists keeps its last known place.

## Save/Load impact
`workers.deceased` is saved and validated (cause `wounds` or `killed:<type>`, at most 50). SAVE_VERSION stays 58 (the field is optional).

## Testing
Unit tests (1019 pass); `scripts/events-smoke.mjs` (camera moves to the event, danger mark, cause in the feed, Deceased list, Save/Load); event-feed, fire, wolves and population smokes pass.

## Notes for the next agent
Use `scene.focusOn(target)` for any new message that has a place.
