# Master04 — Circular Fog of War and Map Memory

## Phase A — verified

Baseline:317/317 tests, production build. The pre-change recoverable checkpoint is62bdf4f (published archive optimization0135b6e remains on public main).

Sight uses squared Euclidean distance in logical grid coordinates. Former20-tile diameter becomes radius10; horse radius15, occupied Tower20, Castle/Wall17.5. Climbing/descent use ordinary sight until actually on the platform. Active circles union without activating unrelated buildings. Fractional motion updates exact boundaries; stationary source profiles retain their cached tile set. Fog OFF is a display override and does not change ordinary sight.

320/320 tests passed,0 failed,0 skipped. Relevant checks cover exact circle edges/corners, fractional motion, map clipping, multi-source union/removal, stationary caching, actual mount/unmount and roof-state modifiers. Production build and native Chromium current-only smoke passed: movement/pickup/physical delivery, exact IndexedDB restoration in transit, no duplicated stock/XP, zero historical or archive catalog requests. Save schema remains8 in this phase because no persistent data changed. Phase A commit contains this record.

## Phase B — verified

324/324 tests,0 failed,0 skipped; production build and native current-only browser with --fog passed. UNEXPLORED black ground, EXPLORED30% brightness/15% saturation and VISIBLE normal terrain are distinct. Exact pixel values were checked in the real Phaser terrain canvas for black/grey/normal display. Exploration and Fog switches work independently in setup/runtime; neither testing override marks undiscovered tiles. Ground/outcrops/paths/seasons use only observed tile memory outside ordinary sight. Cached visible chunks update for changed knowledge/visibility, and all existing movement/delivery/IndexedDB checks pass after using the switches.

New exploration persistence and static-object snapshots remain explicitly incomplete until C–D. Public main stays at the completed archive optimization; this partial stage is backed up only.

## Remaining phases

C: Persistent frozen static-object/terrain memory, never render live hidden changes.
D: Save migration, strict model validation, interaction/UI leak prevention and full browser/performance integration. Overall stage04 is PARTIAL, never claimed complete before these checks.
