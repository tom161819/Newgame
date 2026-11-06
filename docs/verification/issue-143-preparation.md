# Issue143: workplace staffing output preparation

Started 2026-11-06 by Codex on `codex/workplace-staffing-output`, stacked from PR164 head4f6a788. Issues49/50/131 are closed/done. PR164 must merge and deploy before this task merges.

## Source audit

- `data/workplaces.js` already centrally owns capacity, profession and skill. Definitions copy those values; registry deeply freezes them and currently validates capacity only.
- `WorkplaceSystem` owns assignment and physical `atWorkplace`, while its saved records repeat capacity. Authored capacity changes must reconcile all existing buildings and safely unassign excess employees before the next Save. Auto Employment must not immediately reclaim those employees.
- Production batches already sum participant skill speeds. A staffing curve represents total building output; applying the curve once per participant would incorrectly multiply aggregate output by the headcount. Normalize the per-participant factor so equal-skill workers together produce exactly the requested 3/2/1 ->100/50/20 percent. Preserve skills and earned-work contributions.
- Outdoor mining, forestry and crops work at remote physical task goals. Counting only the Farmhouse/hut perimeter would stop all real outdoor work. Count physically arrived eligible workers at their actual work positions, never those walking or carrying goods. Keep the existing physical path and task ownership.
- Asset Library currently has no authoring controls. Add narrowly scoped workplace authoring rather than implement unrelated blocked general editor Issue91. Authored definitions stay outside game saves; export/import validates the complete override set and applies definitions atomically. A save with incompatible authored workplace data must fail before mutating the world.
- Pending Claude Issue163 owns the intermittent Stables smoke; do not edit that fixture as part of143.

## Implementation checkpoint

Central curves use total full-workplace output. Each active participant receives `capacity * curve[present] / present` alongside its existing skill multiplier; absent curves retain the original per-worker speed. Quarry defaults to 0/20/50/100 percent. Presence excludes travel, cargo and Hold, and uses actual physical remote work goals for outdoor jobs (including adjacent taming). Existing production/crop/mining/forestry/hunting collection, training and taming providers retain their task and resource ownership.

Asset Library has an explicitly opened Developer authoring section with capacity/curve preview, apply and JSON import/export. Registry validates all overrides before changing any definition; roles and all non-workplace data cannot be overridden. Per-browser authoring is loaded before save validation and is not part of saves. Existing records are reconciled and excess residents safely become held Unemployed. Persistent game model remains schema30; saves continue to require the matching authored capacity and reject inconsistent records before world replacement.

662/662 full tests passed. Seven added cases cover exact real Quarry game-time ratios/skills, travel/cargo/Hold exclusion, atomic authoring, safe capacity reduction with wages/current-schema roundtrip, actual recipe work contributions, and immediate paused-save cancellation/refund of excess military/taming jobs. The existing hunger timing test now measures native work rate and accounts for the 25ms completion frame instead of assuming the old Quarry speed; it retains exact 25% hunger slowdown, physical quantity and movement assertions. Changelog validation and production build passed. Combined browser --workplace-output --granary-capacity --farmer-tending --employment-exclusions --employment --staffing --military --wheelwright --stables passed, including actual native production, taming and training. Final focused --current-only --workplace-output browser smoke passed after the last safe-detach/selected-definition changes. Native Stables and Barracks changes are timer multipliers only; Claude163's flaky Stables smoke is untouched.

Actual predecessor PR164 merged da21f0c; its Pages42159725044 is still required before this feature merges. No143 PR/merge/deployment is claimed yet.
