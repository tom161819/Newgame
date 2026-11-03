# Master04 — Circular Fog of War and Map Memory

## Phase A — verified

Baseline:317/317 tests, production build. The pre-change recoverable checkpoint is62bdf4f (published archive optimization0135b6e remains on public main).

Sight uses squared Euclidean distance in logical grid coordinates. Former20-tile diameter becomes radius10; horse radius15, occupied Tower20, Castle/Wall17.5. Climbing/descent use ordinary sight until actually on the platform. Active circles union without activating unrelated buildings. Fractional motion updates exact boundaries; stationary source profiles retain their cached tile set. Fog OFF is a display override and does not change ordinary sight.

320/320 tests passed,0 failed,0 skipped. Relevant checks cover exact circle edges/corners, fractional motion, map clipping, multi-source union/removal, stationary caching, actual mount/unmount and roof-state modifiers. Production build and native Chromium current-only smoke passed: movement/pickup/physical delivery, exact IndexedDB restoration in transit, no duplicated stock/XP, zero historical or archive catalog requests. Save schema remains8 in this phase because no persistent data changed. Phase A commit contains this record.

## Phase B — verified

324/324 tests,0 failed,0 skipped; production build and native current-only browser with --fog passed. UNEXPLORED black ground, EXPLORED30% brightness/15% saturation and VISIBLE normal terrain are distinct. Exact pixel values were checked in the real Phaser terrain canvas for black/grey/normal display. Exploration and Fog switches work independently in setup/runtime; neither testing override marks undiscovered tiles. Ground/outcrops/paths/seasons use only observed tile memory outside ordinary sight. Cached visible chunks update for changed knowledge/visibility, and all existing movement/delivery/IndexedDB checks pass after using the switches.

New exploration persistence and static-object snapshots remain explicitly incomplete until C–D. Public main stays at the completed archive optimization; this partial stage is backed up only.

## Phase C — verified

327/327 tests,0 failed,0 skipped; build and native --current-only --fog smoke passed. MapMemory stores detached visual snapshots, including construction progress, crop stage/season, wall links and chest lid pose. Hidden removal/replacement/new construction stays unknown until ordinary sight returns; rediscovering an empty old footprint removes the stale copy. Dynamic actors, loot, inventories and production state are excluded. The same actual asset/rendering factories create camera-culled visual copies, with no registry/occupation/stock/work registration. Full-height graphics and shared texture derivatives are desaturated/darkened without per-object GPU filters.

Native Chromium rendered eight actual graphics types: tower scaffold, castle, wall, granary, wheat, orchard, stone and opened chest; frozen crop season/stage and lid pose matched. All live buildings/workers/resources/stocks/farming/production remained unchanged. Existing collection/delivery/XP/exact IndexedDB regression also passed after these checks. New memory persistence remains pending D and this partial stage is not public main.

## Remaining phases

D: Save migration, strict model validation, interaction/UI leak prevention and full browser/performance integration. Overall stage04 is PARTIAL, never claimed complete before these checks.

## Phase D — verified

Save9 adds validated exploration bit indices, compact observed terrain records and detached static visual snapshots. Real browser migrations of actual schema2,7 and8 archives have passed, including permanent Summer. Legacy migrations can be validated twice, preserve input and discover only the loaded king circle; stale visual copies never recreate physical stock/objects. Hidden mouse commands, blueprint footprints, debug wear and raw stone counts are filtered before reading hidden live contents. A diagonal path cannot infer an unseen corner collider.335/335 tests currently pass. Full native/browser integration after incremental rendering passed, including actual schemas2/7/8→9. The final black-background/seam fix additionally passed335 tests/build and native current-only --fog pixel, interaction, in-transit IndexedDB, pickup/delivery/XP and mobile regression. Public main remains the completed archive optimization until the M1 publication gate.

A moving20-NPC Fog ON profile caught a severe unpublished chunk repaint bottleneck:180 frames averaged519.516/738.674ms (1.92/1.35FPS cold/after archive). Incremental tile patches, without full chunk repaint on each sight change, now repaint609/926 tiles per180-frame sample; both samples60FPS, p95 16.7/16.8ms. Actual simulation advanced3033.2/3016.5ms and the king entered10/8 tiles; no archived game/catalog request on cold play,0 retained technical cards. A short60-frame probe also achieved60FPS. These are local fixed-seed77123,1440x1000 measurements, not device guarantees. Saved raw reports: scratch/Newgame-master04-runtime.json and runtime-optimized.json.

One uncontrolled random food-chain fixture failed once without a retained diagnostic trace.100 deterministic scenario runs (20 consecutive seeds plus80 distributed seeds) passed and the product issue did not reproduce. The recipe/transport regression now uses a scoped deterministic seed and reports detailed world state on any failure; no production AI, food or weather logic was bypassed to make it pass. All335 tests and the real physical production/construction browser scenarios subsequently passed.

Visual review found antialiased diamond seams showing the ordinary olive background in black unexplored areas. Camera background is now explicitly black under Fog and restored when testing Fog OFF. The final native pixel check also tests an undiscovered tile seam, not just the tile centre. The native final-canvas pixel at an undiscovered diamond vertex is now exactlyRGBA(0,0,0,255); Fog uses an opaque black camera background and testing OFF restores its original background. This last fix is confirmed.

Phase D implementation commit contains this completed verification record. Source integrity still passes for all69 immutable archives and their actual metadata. No official version/tag is created for this individual stage; package0.1.0, Save9. The full completed-stage source SHA is recorded in UPGRADE_PROGRESS in the following checkpoint. Next: master05 Population Sidebar.
