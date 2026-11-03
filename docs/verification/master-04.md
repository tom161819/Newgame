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
