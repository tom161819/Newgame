# Master04 — Circular Fog of War and Map Memory

## Phase A — verified

Baseline:317/317 tests, production build. The pre-change recoverable checkpoint is62bdf4f (published archive optimization0135b6e remains on public main).

Sight uses squared Euclidean distance in logical grid coordinates. Former20-tile diameter becomes radius10; horse radius15, occupied Tower20, Castle/Wall17.5. Climbing/descent use ordinary sight until actually on the platform. Active circles union without activating unrelated buildings. Fractional motion updates exact boundaries; stationary source profiles retain their cached tile set. Fog OFF is a display override and does not change ordinary sight.

320/320 tests passed,0 failed,0 skipped. Relevant checks cover exact circle edges/corners, fractional motion, map clipping, multi-source union/removal, stationary caching, actual mount/unmount and roof-state modifiers. Production build and native Chromium current-only smoke passed: movement/pickup/physical delivery, exact IndexedDB restoration in transit, no duplicated stock/XP, zero historical or archive catalog requests. Save schema remains8 in this phase because no persistent data changed. Phase A commit contains this record.

## Remaining phases

B: Exploration states, visual fog and runtime/setup switches.
C: Persistent frozen static-object/terrain memory, never render live hidden changes.
D: Save migration, strict model validation, interaction/UI leak prevention and full browser/performance integration. Overall stage04 is PARTIAL, never claimed complete before these checks.
