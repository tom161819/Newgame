# m-vytezeny-dul-ctverecky – depleted mine and footprint squares (owner requests 63, 64)

## What and why
Request 64 (0.50 playtest): checked on the current code first – an Iron Mine (or a finite Quarry) whose deposit hit 0 kept its three Miners forever, waiting with "Deposit Depleted", and the "has run out of" notice came back every game day. Now such a mine becomes a **Depleted Iron Mine / Depleted Quarry** (cs "Vytěžený důl" / "Vytěžený lom"): no seats, no production, a darker sprite (the procedural fallback gets crossed boards across the adit/pit, the Iron Mine torch goes out), the Miners leave (a free Miner seat elsewhere, else Unemployed), one notice "The Iron Mine is exhausted." and it can be demolished with the usual half-price refund. The output pile stays until the Haulers empty it.

Request 63: the highlighted squares were the **footprint layer** that every building view draws on the ground (depth −90, light fill 0.2–0.25 alpha plus an outline on every tile): `SpriteBuildingView` (all approved-art buildings), `TowerView`, `FortificationView` (walls, towers, gates) and the procedural `WorkplaceView`; also the same layer of remembered buildings outside sight (`MapMemoryRenderer`). Porches (0.40.0) are buildings and had the same squares. They were drawn under every finished building in normal play. Not changed, because they are intentional: work tiles are not drawn; farm plots and the Material Yard ground are the building art itself; the red outline of a field without a Farmhouse (`FarmConnections`) is a warning that must stay visible; the Village Green range only shows while its panel is open; `DecorationView` already showed its square only in preview.

## Files and systems
- `src/game/depletedMine.js` (new): `depletableMine`, `buildingName` (depleted names), `DEPLETED_TINT`.
- `src/systems/MineralSystem.js`: `updateDepletion()` (called every `simulationStep` in `GameScene`, also in the test scene tick) and `deplete(building)`.
- `WorkplaceSystem.assign/assignFree`, `EmploymentSystem.blockReason` ('depleted'), `StaffingStatus` (no missing-worker sign).
- `ProductionDiagnostics.depletionIssues/observe`, `noticeText` (`notice.mineExhausted`), `IssueIcons` (no lasting sign).
- Look: `SpriteViews.SpriteBuildingView.paint`, `WorkplaceView.paint`, `LitBuildingView`.
- UI: `WorkplacePanel` (name, info line instead of staffing, no empty seats, no employment checkboxes), `DemolitionUI` (name).
- `src/game/footprintHighlight.js` (new): `footprintShown`, `applyFootprint`, `selectedBuildingIds`; applied in `GameScene.refreshVisibility` and `MapMemoryRenderer.update`.
- i18n en/cs keys `building.depleted.*`, `building.depletedInfo`, `employment.exclude.depletedStatus`, `notice.mineExhausted`.
- `scripts/depleted-mine-smoke.mjs`, registered as `--depleted-mine` in `scripts/browser-smoke.mjs`.

## Implementation decisions
- A flag on the building (`building.depleted`) instead of a new building type or a derived definition: the type, definition, price, art, pile and demolition stay the same; only seats, look, name and the notice depend on the flag.
- The switch waits until no employee of the mine carries goods or has a `foodPickup`/`foodDeliver` task, so the last mined unit is handed over to the pile (a pile delivery counts only for the building's own worker). Then workers are detached; `assignFree` keeps the profession in another building with a free seat, otherwise `remove` makes them Unemployed (not held, so automatic employment may place them).
- The seat block lives in `WorkplaceSystem` itself (not only in `EmploymentSystem.blockReason`), so it holds with automatic employment off and in scenes without it.
- The notice reuses the existing `depleted` reason and key (one row per building); a depleted mine adds `params.exhausted` and `once`, and `observe` never repeats a `once` issue while it lasts. Before the switch the old "has run out of" text is used; normally the switch happens within the 10 s persistence, so the first and only feed line is "is exhausted". The warning triangle is not drawn for it (the look says it).
- Footprints: shown for placement previews and tinted paints, construction sites/blueprints, every building while `scene.buildMode` is on, and the selected building (`demolitionUI.selectedId`, or the building whose panel is open). The views keep drawing the layer; only its visibility changes per frame (no work when unchanged).

## Save/Load impact
SAVE_VERSION stays 59. Buildings get an optional `depleted: true`; the validator accepts it only on a finished Iron Mine or finite Quarry whose bound deposit has `remaining === 0`, and a depleted building's workplace record must have no workers. A save without the flag but with an exhausted deposit (older saves of this schema) becomes depleted on the first simulation step after Load.

## Testing
- New `tests/depleted-mine.test.js` (7 tests): no workers/production, one Miner moves to a free seat of another Iron Mine and the rest become Unemployed, no manual/automatic seat, no staffing sign; the last load reaches the pile first (Quarry); one non-repeating notice with the en/cs text; demolition returns 10 Wood and frees the deposit; Save/Load roundtrip and five rejected malformed states, flagless exhausted save converts; depleted tint vs placement tint; footprint visibility rules.
- Updated `tests/minerals.test.js` (exhausted Quarry: depleted, Miners left, instead of "Deposit Depleted" waiting) and `tests/smelting-integration.test.js` (the freed Miner would take the Smelter's second seat; he is given a job without a workplace so the XP checks stay exact).
- `npm test`: 1083/1083 pass. `npm run build -- --base=/Newgame/`: OK.
- The browser smoke `--depleted-mine` was written but **not run** (parallel agent; collision). Visual look not checked in a browser.

## Notes for the next agent
- Run `npm run smoke -- --current-only --depleted-mine` and look at `/tmp/shots/depleted-mine.png`; the tint (`DEPLETED_TINT`) and the boards are provisional – final "depleted" art may come from Grafika.
- Map memory does not store `depleted` for buildings, so a depleted mine remembered outside sight is drawn with the normal sprite until seen again.
- If more modes need footprints (e.g. a future zoning tool), pass them to `footprintShown` in `GameScene.refreshVisibility`.
