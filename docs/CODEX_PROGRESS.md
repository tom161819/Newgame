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

NEW08-B verified completion: [PR137](https://github.com/tom161819/Newgame/pull/137), merge8871f6086e7aae9c2c8a9675baf3e7a776873a62. Integrated C08/S11 schema24, 609 tests plus changelog/build and browser notices/C04/pavement PASS; current-head CI42072991047 succeeded. [Pages42073363443](https://github.com/tom161819/Newgame/actions/runs/42073363443) completed full browser/Save/Load, unchanged archive, Studio build and actual deploy successfully for the exact merge. Issue125 closed/done.

## NEW14 implementation — 2026-11-05

Issue131 extends the existing EmploymentSystem with blocked building IDs and blocked type IDs. Type exclusion wins; a local allow never bypasses it. WorkplaceSystem rejects all new automatic/manual assignments centrally before detaching anyone, while existing employees stay. Unblocking requests a normal scheduler pass, respecting capacities and held residents. WorkplacePanel shows both independent controls and the reason; a successful manual assignment alone clears the resident hold. Removed instances are pruned from the local set; type exclusions remain for future buildings. Both sets are included in the exact validated employment state. Schema26 is reserved after Claude's S12 phase A/schema25; integrate that actual merged source before marking the PR ready. No cargo/production/storage logic changes. Browser schema assertions read the authored SAVE_VERSION instead of stale literals.

Validation before S12 integration: 614 tests, changelog:validate and build:pages PASS. Browser --current-only --employment-exclusions --employment --staffing PASS, including real local/type controls in two same-type buildings, disabled manual Assign, retained employees, safe auto resume, exact rule Save/Load and original staffing/priority regressions.

Checkpoint: draft [PR138](https://github.com/tom161819/Newgame/pull/138), source4b8a9d8. Final 614/614 tests, changelog:validate, build:pages and exact-source --current-only --employment-exclusions --employment --staffing browser checks PASS. Issue131 is blocked only on the actual S12 phase A/schema25 merge; preserve its weight model, integrate here with reserved schema26, then rerun integrated checks and mark ready for current-head CI/merge/Pages. No merge/deployment is claimed for131.
