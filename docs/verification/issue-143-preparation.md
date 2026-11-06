# Issue143: workplace staffing output preparation

Started 2026-11-06 by Codex on `codex/workplace-staffing-output`, stacked from PR164 head4f6a788. Issues49/50/131 are closed/done. PR164 must merge and deploy before this task merges.

## Source audit

- `data/workplaces.js` already centrally owns capacity, profession and skill. Definitions copy those values; registry deeply freezes them and currently validates capacity only.
- `WorkplaceSystem` owns assignment and physical `atWorkplace`, while its saved records repeat capacity. Authored capacity changes must reconcile all existing buildings and safely unassign excess employees before the next Save. Auto Employment must not immediately reclaim those employees.
- Production batches already sum participant skill speeds. A staffing curve represents total building output; applying the curve once per participant would incorrectly multiply aggregate output by the headcount. Normalize the per-participant factor so equal-skill workers together produce exactly the requested 3/2/1 ->100/50/20 percent. Preserve skills and earned-work contributions.
- Outdoor mining, forestry and crops work at remote physical task goals. Counting only the Farmhouse/hut perimeter would stop all real outdoor work. Count physically arrived eligible workers at their actual work positions, never those walking or carrying goods. Keep the existing physical path and task ownership.
- Asset Library currently has no authoring controls. Add narrowly scoped workplace authoring rather than implement unrelated blocked general editor Issue91. Authored definitions stay outside game saves; export/import validates the complete override set and applies definitions atomically. A save with incompatible authored workplace data must fail before mutating the world.
- Pending Claude Issue163 owns the intermittent Stables smoke; do not edit that fixture as part of143.

No implementation or validation is claimed by this preparation checkpoint.
