# Follow-up Codex master — C01–C08

Current state 2026-11-05: M2 v0.3.0 is **RELEASED** (2026-11-05). Issue47 was finished by Claude at the owner's request: PR79 (Codex head 5b094ea + main) merged as d9e91258a15e79b64c774ffe45ff413f47066d72; the first tag-aware Pages run 41975989872 succeeded; Verify published release 41976289989 passed the exact tag v0.3.0 → 02a3a43, frozen notes, 71 deployed archive blobs and the live catalog/manifest (SHA-256 4bce4d36cb4ed15aeb0fb956bc5432300d1c2634813d18690cf1d2b4c596f2ac). Issue47 is closed as done; only Issue48 (C01) was moved to ready. The parked C01 WIP dd728a0 on codex/fow-exploration-blueprints is preserved for Issue48. [Audit and fallback handoff](verification/issue-47/README.md).

> **Jednotná provozní fronta (2026-11-04):** GitHub Issues jsou nyní zdroj pravdy pro přidělení práce a stavy ready/blocked/review/done. Původní podrobné zadání v tomto souboru a v `docs/requests/CODEX_MASTER.md` zůstává závazné pro věcný rozsah. Neoznačujte níže uvedené PENDING za DONE bez skutečného PR, úspěšného nasazení a relevantního milníku. M2: [#47](https://github.com/tom161819/Newgame/issues/47); C01–C08: [#48](https://github.com/tom161819/Newgame/issues/48), [#49](https://github.com/tom161819/Newgame/issues/49), [#50](https://github.com/tom161819/Newgame/issues/50), [#51](https://github.com/tom161819/Newgame/issues/51), [#52](https://github.com/tom161819/Newgame/issues/52), [#53](https://github.com/tom161819/Newgame/issues/53), [#54](https://github.com/tom161819/Newgame/issues/54), [#55](https://github.com/tom161819/Newgame/issues/55). Master11–15: [#56](https://github.com/tom161819/Newgame/issues/56) až [#60](https://github.com/tom161819/Newgame/issues/60). Aktuálně je ready jen M2; další se odblokují po splnění závislostí. Codex si může brát Issue v běžící relaci, ale Issues jej samy nespouštějí.


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
|5|C05 Unit selection, Move and Hold|DONE|Issue52 / PR107; merge 0b6b163; 561 tests + 43 full browser smokes; Pages42019289576 succeeded. Schema21; C04 preserved. C06 remains Claude-owned.|
|6|C06 Stables audit and equipment contract|DONE|Issue53 / Claude PR111, merge868a2d3; descendant Pages42025802576 success; Issue closed/done by owner. C05 merged/deployed; audit current horses/equipment and record planned Stage12 Stables/vehicles as not implemented; do not duplicate them.|
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

## C05 verified completion — 2026-11-05

Issue52 is closed/done after [PR107](https://github.com/tom161819/Newgame/pull/107) merged as 0b6b1631adf90ba09965b63bac720a5aa60d35b8. Local 561/561 tests, changelog, build:pages and 43 full browser scenarios passed. [Current-head CI42019031980](https://github.com/tom161819/Newgame/actions/runs/42019031980) and [Pages42019289576](https://github.com/tom161819/Newgame/actions/runs/42019289576) build/deploy succeeded. Current-schema21 round trips preserve movement, Hold and cargo. C04 #106 was integrated without losing notices; intentionally held workers are excluded from active production/transport diagnostics. Only immediate successor #53 was moved to ready, retaining its approved agent:claude owner.

## AUD66 verified completion — 2026-11-05

Issue95 closed/done: [PR109](https://github.com/tom161819/Newgame/pull/109), merge6181d50. Rabbits/deer/boars keep a one-tile physical building/site clearance while wandering and spawning; retreat, diagonal gaps, hunting, horse, fog, performance and current-schema21 round trips are covered. Initial 570 tests and focused browser smoke passed. Failed Pages42021840338 exposed an invalid fixed fog sample, not a wildlife regression: [PR110](https://github.com/tom161819/Newgame/pull/110), mergec25fc7d, chooses a genuinely unknown corner while preserving exact black pixels and Claude's N12 renderer/king-only fixture. Integrated 579 tests and composed/focused browser checks passed. [Pages42025802576](https://github.com/tom161819/Newgame/actions/runs/42025802576) build and deploy actually succeeded for c25fc7d, including full smoke, save compatibility, archives and Studio.

## AUD63 implementation — 2026-11-05

Issue93 extends the existing N03 implementation, not a second logistics engine. A Hauler's existing Euclidean radius is the union around reachable complete Castles, stone-accepting stock locations and verified physical sites requiring stone. Physical connectivity is shared per connected component for the 500ms planning interval; structural revision changes invalidate it. The actual worker navigation still decides routes. Dedicated storage remains the normal destination with existing fallback/capacity rules; loose stone is never injected into site allocations. Real material/production deliveries preempt pickup, including a Hauler already at a stone. OFF, reduced radius or lost hub access release unstarted reservations. Cargo keeps the existing safe return behavior. No persistent fields or schema change (21). EN/CS radius labels describe collection generally.

Validation: 584/584 tests (12 focused idle-stone cases), changelog:validate and build:pages PASS. `npm run smoke -- --base=/Newgame/ --current-only --idle-stone` PASS: actual panel ON/radius, a new game with no Castle, physical pickup, current-schema cargo Save/Load and exactly one deposit; standard movement/IndexedDB/cold-start/browser checks also passed.

Verified completion: [PR112](https://github.com/tom161819/Newgame/pull/112) merged as afd5f88fe7eb316b2d1e1f72238eaceee002c304 after [current-head CI42028197212](https://github.com/tom161819/Newgame/actions/runs/42028197212) success for f2fcc7e. [Pages42028606962](https://github.com/tom161819/Newgame/actions/runs/42028606962) build and deploy succeeded for the exact merge, with 584 tests, unchanged archives, full browser/save compatibility (explicit AUD63 and C05 passes) and Studio checks. Issue93 is closed/done. Live queue check found no other open agent:codex + status:ready; C07 #54 remains agent:claude. Completion-record-only checks: 584/584 tests, changelog:validate, build:pages and current-only browser smoke PASS.

## AUD78 verified completion — 2026-11-05

[PR134](https://github.com/tom161819/Newgame/pull/134) merged as2d9a357 after current-head CI42057853531. 592 tests, changelog, build and real browser HUD/standing/cargo Save/Load plus Hauler regression passed. [Pages42058257302](https://github.com/tom161819/Newgame/actions/runs/42058257302) full browser/save/archive/Studio build and deploy succeeded for that exact merge. Issue102 closed/done; current schema22 unchanged, C07 and House preserved.

## NEW08-B implementation — 2026-11-05

Issue125 uses the existing completion ActivityBus event, ProductionDiagnostics and NoticesPanel. A completed Mill without a completed Wheat Field, or Bakery without a completed Mill, creates one informational production notice per missing structural link regardless of stock/staff. Multiple contributor events and new consumers do not repeat it. Dismissal lasts for that missing-link episode; completion of its predecessor clears it. Existing C04 blocking reasons retain panel priority and their 30-second logic. Advice is transient, never saved or replayed when loading existing buildings; no new schema/model fields. EN/CS text explicitly allows existing supplies. C08 systems and storage/production registries are untouched. Browser completion-event fixtures exercise the live bus/panel, dismiss, dedup, resolution and a real current-schema reload alongside the old C04 smoke.

Validation: 595/595 tests (8 diagnostics cases), changelog:validate, build:pages and browser --current-only --chain-notices --notices PASS.

Resumed after GitHub commit_refs_rules recovery: normal push succeeded. Integrated C08 main5737395/schema23 without changing its model; preserved both sides of changelog/coordination conflicts. Integrated 602/602 tests, changelog:validate, build:pages and --current-only --chain-notices --notices browser smoke PASS.

## NEW04 implementation — 2026-11-05

Issue122 adds low-priority seasonal tending directly inside the existing FarmingSystem. Farmers first check for harvest, then choose reachable perimeter positions near completed crops within their Farmhouse range. They use the existing farmer work pose, change position after a short interval and claim distinct idle destinations. Harvest preempts within 250ms; existing WorkerAI gives cargo delivery and manual Hold priority. Winter/missing/inaccessible crops return to Farmhouse waiting. Tending never changes resources, XP, growth or crop ownership. Temporary target claims are released on cancellation, job change, Hold, death or invalidation and rebuilt after Load; existing paths remain physical. No new workTask kind, persistent field or schema change. No WorkerAI, logistics/storage, renderer or asset edits.

Validation after S12 weights and FoW/save fixes maina6442d5: 618/618 tests including seven focused cases covering active seasons, harvest preemption, winter/removal/access, multiple farmers/Hold, in-flight exact current-schema roundtrip, real cargo priority and bounded path searches. Changelog:validate, build:pages and --current-only --farmer-tending browser PASS: actual movement, existing work animation, reposition, no idle XP/goods, reload and native harvest/physical delivery.
NEW08-B verified completion: [PR137](https://github.com/tom161819/Newgame/pull/137), merge8871f6086e7aae9c2c8a9675baf3e7a776873a62. Integrated C08/S11 schema24, 609 tests plus changelog/build and browser notices/C04/pavement PASS; current-head CI42072991047 succeeded. [Pages42073363443](https://github.com/tom161819/Newgame/actions/runs/42073363443) completed full browser/Save/Load, unchanged archive, Studio build and actual deploy successfully for the exact merge. Issue125 closed/done.

## NEW14 implementation — 2026-11-05

Issue131 extends the existing EmploymentSystem with blocked building IDs and blocked type IDs. Type exclusion wins; a local allow never bypasses it. WorkplaceSystem rejects all new automatic/manual assignments centrally before detaching anyone, while existing employees stay. Unblocking requests a normal scheduler pass, respecting capacities and held residents. WorkplacePanel shows both independent controls and the reason; a successful manual assignment alone clears the resident hold. Removed instances are pruned from the local set; type exclusions remain for future buildings. Both sets are included in the exact validated employment state. Schema26 is reserved after Claude's S12 phase A/schema25; integrate that actual merged source before marking the PR ready. No cargo/production/storage logic changes. Browser schema assertions read the authored SAVE_VERSION instead of stale literals.

Validation before S12 integration: 614 tests, changelog:validate and build:pages PASS. Browser --current-only --employment-exclusions --employment --staffing PASS, including real local/type controls in two same-type buildings, disabled manual Assign, retained employees, safe auto resume, exact rule Save/Load and original staffing/priority regressions.

Checkpoint: draft [PR138](https://github.com/tom161819/Newgame/pull/138), source4b8a9d8. Final 614/614 tests, changelog:validate, build:pages and exact-source --current-only --employment-exclusions --employment --staffing browser checks PASS. Issue131 is blocked only on the actual S12 phase A/schema25 merge; preserve its weight model, integrate here with reserved schema26, then rerun integrated checks and mark ready for current-head CI/merge/Pages. No merge/deployment is claimed for131.

NEW14 resumed: actual S12 phase A is merged via PR139, and current maina6442d5 also includes FoW performance/save fixes. Integrated all of them into PR138 while retaining schema26 and the original S12 weight model. Conflicts were only coordination, the schema number and smoke schema literals; selected the authored SAVE_VERSION checks and preserved both gameplay changes. Integrated 616/616 tests, changelog:validate, build:pages and browser --current-only --employment-exclusions --employment --staffing PASS. Dependency is satisfied; PR can now leave draft and run current-head CI.

NEW04 restored on2026-11-06: integrated current main9478976/schema29, preserving S12 vehicles/horses, pavement, Studio and later smoke fixes. Conflicts only in changelog/coordination, both sides retained. 646/646 tests, changelog:validate, build:pages and browser --current-only --farmer-tending --employment-exclusions --employment --staffing --seasons-menu PASS. Actual predecessor deployment is verified: Pages42109315944 succeeded for09df170 containing PR138 and PR151; Issue131 closed/done. PR142 reuses its original branch/PR and awaits fresh exact-head CI and deployment.

## NEW06 implementation — 2026-11-06

Issue123 extends the existing FoodStorageSystem with independent Granary raw200/food200 invariants. Accepted resource metadata selects one group; stock and incoming bookings share only that group. Resource-aware room checks propagate through existing production, logistics and royal delivery paths; reservations and stock keep their single current owner. StoragePanel shows both used/capacity/incoming/free rows. Warehouse/fallback/buffers retain shared limits. Schema30 enforces current-only saves; no migration.

Integrated actual farmer merge2329087 and current S12/schema29 source.655/655 tests (three grouping + six storage/logistics cases), changelog:validate, build:pages and --current-only --granary-capacity --farmer-tending browser PASS. Browser uses live counters, native two-Hauler booking/delivery and real pending-reservation Save/Load. Three existing production fixtures now fill the correct group and retain their original output/capacity/accounting assertions. Await predecessor Pages42157299626 before this feature's merge; exact-head CI and subsequent actual Pages still required.

NEW04 verified completion: PR142 merged232908750f063b17cfabe6ed9121d4278c0bdb22 after exact-head CI42157067169 success. Pages42157299626 build AND deploy completed successfully for that exact merge, including full browser/save/archive/Studio. 646 tests, changelog/build and combined farmer/employment/staffing/seasons browser PASS. Issue122 closed/done.

## NEW15 implementation — 2026-11-06

Issue143 / PR165: central authored staffing curves count physically present workers, including arrived outdoor task goals, excluding travel/cargo/Hold. Quarry total output is100/50/20percent for3/2/1 equal-skill Miners; per-participant normalization preserves skill multipliers and exact production contributions. Existing work providers retain all resources/tasks. Asset Library Developer section previews/edits capacity/percentages and atomically imports/exports authored data outside game saves. Capacity reductions safely release held Unemployed, including immediate cancel/refund for military and taming during pause. Live WorkplacePanel shows output/missing/present. Schema30 unchanged; current saves require matching authored capacity.

662/662 tests, changelog and production build PASS. Combined native browser editor/Granary/farmer/employment/staffing/military/wheelwright/stables PASS; final focused editor rerun also PASS after last UI/safe-detach improvements. Actual PR164 merge da21f0c integrated; await predecessor Pages42159725044 and current-head CI before merge, then require own actual Pages. Historical snapshots and dependencies unchanged; Claude163 smoke untouched.

## NEW18 implementation — 2026-11-06

Issue146 gives every plot a single canonical farmId, with at most four mixed fields/orchards per completed Farmhouse including planned/provisional claims. Deterministic nearest available farm selection preserves existing valid links; new farms or freed slots reconnect orphans. Farm removal safely cancels exclusive work and releases employees. Farmers only tend/harvest their own farm plots through existing navigation. Native placement warns about orphans; current-fog outlines and selected-farm connection lines plus X/4/owner panels expose the relationship.

Schema31 persists/validates ownership and suppresses Load-time reassignment until every building has been restored; no migration.670/670 tests (eight new ownership cases), changelog:validate, build:pages and browser --current-only --farm-plots --farmer-tending PASS. Actual fifth mouse-placed blueprint stays orphan, second farm connects it, and native Load preserves it. Price/Builder/King establishment changes remain in145. This branch is stacked on165; its actual merge/Pages must precede146 merge and own Pages.

NEW06 verified completion: PR164 merged da21f0c, CI42158316333 and655 tests/changelog/build/Granary+tending browser PASS. Pages42159725044 build AND deploy succeeded in normal retry after GitHub syncing_files timeout. Issue123 closed/done. PR165 subsequently merged90eb356 after exact-head CI42160766881; its own actual deployment is still pending. Public Pages HTTP read is blocked by session proxy CONNECT403; no bypass/configuration change.

NEW18 actual predecessor90eb356 integrated without source conflict. Fresh670 tests, changelog/build and native ownership+tending browser PASS; PR166 awaits exact-head CI and Pages42163373128 before merge.

NEW15 verified completion: PR165 merge90eb3561f1b70c80e3d2be2f031af23d62f19d3a, exact-head CI42160766881 and actual Pages42163373128 build+deploy SUCCESS.662 tests/changelog/build/combined native browser PASS. Issue143 closed/done.

NEW18 final visual validation: Farmhouse uses a nonmodal side inspector (bottom sheet on phones), preserving a clear map instead of covering/blurring its connections. Camera fits visible owned plots beside/above the inspector, respecting existing zoom limits/fog; Escape restores native input. Real browser asserts that farm/plot centers remain visible and outside the panel at1440px and390px.670 tests, changelog/build, ownership/tending and normal employment/staffing browsers PASS; final focused layout rerun and visual screenshot inspection PASS. Predecessor165 is deployed; await final166 CI then own Pages.

## NEW17 implementation — 2026-11-06

Issue145 makes fields/orchards free and routes their physical establishment through existing construction slots/progress, exclusively to Farmers of their canonical farmId. Builder and King are rejected centrally. Farming skill and staffing affect speed; completion awards Farming instead of Construction XP through the existing completion event. Harvest preempts within250ms, cargo/Hold retain priority, partial cancellation grants no goods/XP and releases normal leases. Growth starts on completion. ConstructionUI and C04 explain the required own Farmer and orphan state. Schema32 validates Farmer build tasks and blocks royal crop work; no migration.

677/677 tests, changelog:validate, build:pages and native --farmer-establishment --farm-plots --farmer-tending browser PASS, including actual mouse placement/Assign Worker, C04 wait, blocked royal action, partial Load with no jump and exact skill XP deltas. Seven focused regressions and updated old prerequisite/price fixtures retain resource, growth, relocking and cancellation coverage. Complete --full browser/save/archive regression PASS on published885388a (exit0). Actual166 merge4e29fe3 (including final responsive inspector a9fcf1a) is integrated; coordination conflict retained the actual deployment records and this own active row. Wait for actual166 merge/Pages before145 merge.
