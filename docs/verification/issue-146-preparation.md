# Issue146: farm plot ownership

Started2026-11-06 by Codex, `codex/farm-plot-ownership`, stacked from PR165 head0e9159b. Issue122 is actually deployed by Pages42157299626. Merge order: actual164 ->165 ->146 foundation ->145 farmer construction. Each PR waits for its predecessor deployment. NEW17/NEW18 refer to each other;146 establishes the ownership contract used by the later145 implementation, without changing construction prices or workers here.

Plan: one canonical `farmId` per field/orchard, count incomplete/provisional plots against four slots, choose the nearest completed in-range Farmhouse deterministically. Unconnected plots remain visible and cannot be tended/harvested; a later valid farm may connect them. Releasing/removing farms safely reassigns plots and cancels stale work through existing ownership. Current-only schema31 validates farm IDs, range and cardinality before world mutation; no migration. Selected Farmhouse displays visible links and X/4; visible orphan plots get an outline and an explanatory panel message. Keep fog and native physical paths intact.

Implementation complete: central deterministic farm assignment counts every crop, including planned/provisional sites, against four slots. Existing valid ownership stays stable. New farms and released slots reconnect orphans; removing farms releases employees and stale exclusive work through existing cancellation. Actual Farmers use canonical ownership for tending/harvest and still route physically. No price, construction worker or XP changes here.

Schema31 persists farmId for every crop and validates type/range/cardinality plus active harvest ownership before world mutation. Loader suppresses reconciliation until all buildings are restored, preserving a plot linked to a later-created farm. No migration. Visible orphan outlines and selected-farm links respect current fog; closed panels remove links immediately. Panels show X/4, the owner and orphan guidance. Native blueprint placement warns when no farm has room.

670/670 full tests PASS, including eight new ownership cases (nearest/ties/mixed slots, provisional claims, actual farmer isolation, farm removal, later-farm Load ordering, corrupt/range/fifth rejection before mutation, fog-safe links, cancellation freeing a slot). Changelog:validate and build:pages PASS. Browser --current-only --farm-plots --farmer-tending PASS, including actual mouse placement of the fifth blueprint, warning, live count/links, new-farm reconnection and current-schema Load; prior real tending/harvest regressions retained. Historical archives and dependencies untouched.

PR165 final head0e9159b has exact-head CI42160766881 success; predecessor Granary Pages42159725044 is still running its final checks. No146 merge/deployment claimed. Integrate actual165 merge and verify its Pages before146 can merge.

Actual165 merge90eb356 is integrated without source conflict. Predecessor164 Pages42159725044 succeeded in normal failed-job retry;123 closed/done. Await165 Pages before166 merge; fresh integrated checks/CI follow.

Fresh checks after actual90eb356 integration:670/670 tests, changelog:validate, build:pages and --current-only --farm-plots --farmer-tending browser PASS. PR166 remains draft pending actual165 Pages42163373128 and exact-head CI.
