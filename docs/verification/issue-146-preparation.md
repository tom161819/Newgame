# Issue146: farm plot ownership

Started2026-11-06 by Codex, `codex/farm-plot-ownership`, stacked from PR165 head0e9159b. Issue122 is actually deployed by Pages42157299626. Merge order: actual164 ->165 ->146 foundation ->145 farmer construction. Each PR waits for its predecessor deployment. NEW17/NEW18 refer to each other;146 establishes the ownership contract used by the later145 implementation, without changing construction prices or workers here.

Plan: one canonical `farmId` per field/orchard, count incomplete/provisional plots against four slots, choose the nearest completed in-range Farmhouse deterministically. Unconnected plots remain visible and cannot be tended/harvested; a later valid farm may connect them. Releasing/removing farms safely reassigns plots and cancels stale work through existing ownership. Current-only schema31 validates farm IDs, range and cardinality before world mutation; no migration. Selected Farmhouse displays visible links and X/4; visible orphan plots get an outline and an explanatory panel message. Keep fog and native physical paths intact.

No146 implementation or validation claimed by this checkpoint.
