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

## C05 verified completion — 2026-11-05

Issue52 is closed/done after [PR107](https://github.com/tom161819/Newgame/pull/107) merged as 0b6b1631adf90ba09965b63bac720a5aa60d35b8. Local 561/561 tests, changelog, build:pages and 43 full browser scenarios passed. [Current-head CI42019031980](https://github.com/tom161819/Newgame/actions/runs/42019031980) and [Pages42019289576](https://github.com/tom161819/Newgame/actions/runs/42019289576) build/deploy succeeded. Current-schema21 round trips preserve movement, Hold and cargo. C04 #106 was integrated without losing notices; intentionally held workers are excluded from active production/transport diagnostics. Only immediate successor #53 was moved to ready, retaining its approved agent:claude owner.
