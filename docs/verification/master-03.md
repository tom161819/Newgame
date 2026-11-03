# Master 03 / 33 — optional seasons with exact remembered progress

Game version remains `0.1.0`. Save schema is now **8**, accepting versions 1–8; game release numbers remain separate.

## Implemented

- Seasons defaults ON in Advanced New Game Setup. OFF starts permanent effective Summer. The live Settings switch reads the same SeasonSystem and stores no independent global/localStorage season setting.
- Turning seasons OFF preserves the real calendar and partial day exactly. Ordinary game days, food, wages, income and daily weather continue. Weather uses Summer probabilities while OFF. Toggles do not reroll the current day's weather.
- ON resumes the remembered season and fraction of its day without advancing through the disabled interval. One compensated seasonal clock is advanced by the central Game Time; it is not a second wall-clock timer. The central time can split at a resumed seasonal boundary, apply old-season growth through the entire preceding interval and then commit the new phase. This preserves exact biological growth across 1/30/144 FPS and large time steps.
- Wheat and orchards use effective Summer while OFF, including actual farmer harvesting and physical delivery; remembered Winter resumes its growth restriction when ON. Existing crop progress and harvested stocks are preserved. The later Forestry stage will use the same effective-season getter; no new tree system or background mode was added out of order.
- Terrain and crop textures update on toggles, including while Settings pauses simulation. OFF is labeled `Summer (Seasons OFF)` and both switches explain that game days continue.
- Save8 stores the enabled flag, remembered calendar, compensated partial-day progress, effective season and weather. Validators reject contradictory metadata or clocks ahead of game time. Actual schema7 migrates to ON with its previous calendar and elapsed day preserved. Loading stored weather avoids an extra constructor weather roll.

## Actual checks

- **307 tests passed, 0 failed, 0 skipped**: 294 existing plus 13 specific season-switch cases. Full regression includes physical production/logistics, construction/cancellation, XP, wages, migration, FoW and prior save migrations.
- Verified partial Autumn OFF for ten ordinary days and exact ON resumption; default OFF Spring memory; independent daily weather and probabilities; repeated toggles/pause; seasonal boundaries at different FPS; Winter OFF growth and real wheat/apple harvesting/carrying with one reward; ongoing daily income/payroll/food; exact current Save/Load; legacy7 normalization and corrupt-state rejection.
- Production build with `/Newgame/` passed. Existing Phaser size advisory is informational.
- Actual full Chromium smoke passed: New Game OFF; Settings switch; visible ground-texture pixels change Summer/Winter while paused; ten ordinary days leave the remembered partial Winter unchanged; IndexedDB restores the complete serialized OFF state exactly; ON restores that same Winter and texture; original state can be restored exactly.
- The same run passed full physical Granary→Farmhouse construction, live category/unlock UI, blueprint restoration, dependent-field completion after prerequisite removal, normal Tower cancellation, actual movement/stone delivery/XP and current IndexedDB restoration.
- Actual frozen official schema2 and actual `fcdb80f` schema7 Winter saves loaded into schema8. Time, partial day, royal position, stock, XP and calendar remained correct. Archived databases/localStorage stayed separate. Earliest playable prototype, static archive and mobile UI passed without JS/HTTP errors.
- Changelog/catalog and all65 immutable snapshots verified. No archive bytes/URLs/history were modified by this stage.

One long browser run was interrupted by environment renewal and was rerun successfully rather than counted as passed. A screenshot equality assertion originally compared an entire rehydrated scene; it now compares the same visible terrain texture, independently of actors/camera layout, while still proving the actual Winter/Summer graphical change. An FPS fixture's naive elapsed sum was replaced with an exact input interval so its sub-microsecond arithmetic did not distort the expected simulation duration.

The completion checkpoint records the exact implementation commit in [UPGRADE_PROGRESS.md](../UPGRADE_PROGRESS.md). Before stage04, handle the user's additional [archive performance/storage review](../requests/archive-optimization.md); then resume the prescribed master order. M1 release remains pending after stage06.
