# Follow-up Codex master — C01–C08

Source: [original CODEX_MASTER.md](requests/CODEX_MASTER.md), supplied2026-11-04.
The latest explicit user reorder (2026-11-04) is authoritative: finish the
active M2 publication after master01–10, then **C01–C08**, then original master
**11–15**. Keep task IDs and milestone gates. This supersedes the earlier
instruction to wait for all15 master stages; the original request stays intact.
AGENTS.md, alpha save policy and Claude's ownership remain in force.

| Order | Task | Status | Dependencies / evidence |
|---|---|---|---|
|1|C01 Fog, unknown-ground movement and provisional blueprints|PENDING|M2 publication after master01–10 complete/deployed; audit current Fog first.|
|2|C02 Staffing picker and Granary indicator|PENDING|C01 merged and deployed; inspect actual Granary workplaces.|
|3|C03 Auto employment and Castle priorities|PENDING|C02 merged/deployed; extend existing staffing instead of a second scheduler.|
|4|C04 Production diagnostics and notices|PENDING|C03 merged/deployed; reuse authoritative work states and activity events.|
|5|C05 Unit selection, Move and Hold|PENDING|C04 merged/deployed; preserve jobs, cargo and reservations.|
|6|C06 Stables audit and equipment contract|PENDING|C05 merged/deployed; audit current horses/equipment and record planned Stage12 Stables/vehicles as not implemented; do not duplicate them.|
|7|C07 Weapon production and Armory|PENDING|C06 merged/deployed; real Wood/Iron Bar/logistics/ownership contract; visuals may use clear temporary fallbacks.|
|8|C08 Military recruitment and combat|PENDING|C07 merged/deployed and stable equipment contract. Knight availability still requires actual completed Stables/reservable horse; dependent unlock/integration follows deferred Stage12.|

Stables dependency after reordering: C06 audits what actually exists and defines
the equipment/horse contract without claiming deferred Stage12 is done. C08 must
keep the real Stables requirement and locked Knight state when absent; record
the dependent unlock/integration checks for Stage12, rather than inventing a
building, bypassing the requirement or silently moving the whole Stage12 ahead.
After C08 continue master11–15; report any deferred coverage explicitly.

Each completed task records actual commit/PR/deployment, passed/failed/skipped
checks, current-schema Save/Load and unresolved limitations here and in
COORDINATION. Audit already fulfilled requirements instead of implementing them
again. No per-task version bumps; follow the actual milestone policy. Resume
automatically when dependencies and environment access permit, without a new
approval prompt or promises of work outside a running session.

Claude retains V01–V03 and art/Studio ownership. C01 unblocks V01; C06/C07 provide
the V02 contract; C08 provides the V03 unit contract. Those dependencies do not
authorize Codex to replace or approve Claude's graphics.
