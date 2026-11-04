# Master05 — Population Sidebar and Skill Sorting

Stage04 is DONE at0024c16; safe pre-change checkpoint b3b0e91. Baseline335 tests, build and native game/old-save migrations/60FPS verified in the prior stage. No new official version; M1 gate follows06.

Phase A (DONE): right collapsible non-modal sidebar, authoritative permanent residents and count, portraits matching current assets/procedural human palette, central profession colours and virtual rows. Observe WorkerSystem/JobSystem changes; no duplicate units/XP or unnecessary closed-panel portrait updates.

Phase B: compact hover/focus details from actual XP/skill/job/talent/food data, no invented Needs system.
Phase C: dynamic sorting/filter/search, existing character inspection and bounded camera Locate/selection without revealing hidden positions or changing jobs/routes.
Phase D: three full game-day Recent Deaths using existing worker records, strict save/migration and persistent preferences only for UI; native200-resident/mobile/Fog/Save integration. Every tested phase gets its own commit; stage remains PARTIAL until all complete.

Phase A verification:339/339 tests,0 failed,0 skipped; production build and native --current-only --population passed. Real200-resident fixture shows at most14 DOM rows, original matching-appearance portraits, live central profession colours, accurate resident/employment totals, and no visitor/death entries in the active list. Scroll does not zoom the map; camera keys still work outside the panel;390px mobile has no horizontal overflow. Closing removes row listeners/portraits; restoring the original world matches its entire Save9 snapshot and the ordinary collection/delivery/IndexedDB/XP flow still passes. Phase A commit contains this record. B–D remain pending, overall stage05 stays PARTIAL.
