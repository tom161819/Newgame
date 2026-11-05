# M2 publication checkpoint — RELEASED

## Final result — 2026-11-05

M2 v0.3.0 is **RELEASED** (2026-11-05). Issue47 was finished by Claude at the owner's
request: PR79 (Codex head 5b094ea + main) merged as d9e91258a15e79b64c774ffe45ff413f47066d72;
the first tag-aware Pages run 41975989872 succeeded; Verify published release 41976289989
passed the exact tag v0.3.0 → 02a3a43, frozen notes, 71 deployed archive blobs and the live
catalog/manifest (SHA-256 4bce4d36cb4ed15aeb0fb956bc5432300d1c2634813d18690cf1d2b4c596f2ac).
Issue47 is closed as done; only Issue48 (C01) was moved to ready.


## Current Issue47 audit — 2026-11-04

The old checkpoints below are historical, not the live task queue. PR22 is
actually merged; main65b4bf8 also includes Claude N02/Save15 through PR62.
Pages41924183243 for that exact main is Success and its full CI supplied all9
prerequisite checks, so identical checks were reused rather than rerun.

Public tag v0.3.0 is now actually pushed and verified by ls-remote, targeting the
unchanged frozen source02a3a43ace8adc993aea7a392424d7cdf4e7dec9. Its71archive
blobs match the actual deployed Git tree; no new archive/version/schema change.
Final M2 completion remains pending: fresh tag-aware Pages and actual public
catalog/manifest verification are still required. API writes and public Pages
HTTPS are genuinely blocked by this runtime; Issue47 status is not fabricated.

See [current structured evidence and safe handoff](issue-47/README.md) and
[MERGE_QUEUE](../MERGE_QUEUE.md). C01 WIPdd728a0 is safely pushed and parked;
Issue48 and later tasks remain blocked until47 actually completes.

## Final upload and actual merge attempt — 2026-11-04

Candidate e574f75 is pushed to PR22. The newer maina09de58/PR27 adds only the
pull-request quality workflow and was merged normally; game/assets/scripts and
archives are unchanged from the476-test/scaffold-verified source. No repeated
full game suite is warranted for this CI-only integration.

The actual authorized `gh pr merge22 --merge --match-head-commit e574f75…` still
returns `Post "https://api.github.com/graphql": Forbidden`. A fresh supported
`gh pr view22` query fails identically. No merge, public tag or final Pages/gate
success is claimed. The reordered queue is safely pushed: M2 → C01–C08 →
master11–15. Resume by fetching main and preserving any intervening work, then
finish the actual publication steps below when the API limitation is resolved.
Do not chase unrelated art changes by retagging/rebuilding frozen02a, bypass
managed networking or push directly to main.

## Latest approved-scaffold integration — 2026-11-04

Main4857ba7/PR26 scaffold art was normally merged as06ff55a. Only COORDINATION
conflicted; preserved both authors and the user's new queue order. Current
source476/476models, validators and Pages build pass. Native `--fog` also exits0:
real scaffold/static memory, hidden blueprint handling, menu/camera/mobile,
current IndexedDB roundtrip and historical games. Game/art paths match that main;
no production AI/model changed, so earlier full and tree-specific proofs below
remain applicable to their recorded scopes. New logs:
Newgame-M2-scaffold-integration-{tests,pages,smoke}.log in workspace/scratch.
Frozen02a and every archive directory remain unchanged.

## Tree integration and queue update — 2026-11-04

Main2ce3cd7/PR25 approved tree art was normally merged as46cd448; only the
coordination register conflicted, both histories preserved. Actual game/art
paths match main byte-for-byte. This follow-up passes475/475models, validators,
Pages build and targeted native `--zoom --fog --season-transition --forestry`,
including real tree clicks/chopping/cargo, last-seen visuals, seasons, current
IndexedDB and historical games. The prior full production/construction suite
below applies to main14071b1; unchanged production logic was not rerun needlessly.
New logs: Newgame-M2-tree-integration-{tests,pages,smoke}.log in workspace/scratch.
Frozen02a and all73archive directories stay unchanged.

The user then reordered the queue: finish M2, then C01–C08, then master11–15.
Task IDs and M3–M5 gates are retained; the Stables/Knight dependency is explicit
in CODEX_PROGRESS. No queued task was marked implemented by this documentation.

## Verified prior ground/building integration — 2026-11-04

Work is uploaded to [PR22](https://github.com/tom161819/Newgame/pull/22), branch
`codex/m2-smelting-smoke`. Main14071b1 (Claude PR19–24: seasonal transitions,
Studio concepts, approved ground and production-building art) was normally merged
as3d5ac80. Only CHANGELOG/COORDINATION conflicted; both authors’ work is preserved.
Later approved ground/building changes stay Unreleased. Codex did not rewrite
art, gameplay or the Save14 model.

M2 source stays **02a3a43ace8adc993aea7a392424d7cdf4e7dec9**, version0.3.0,
Save14, tree49b1e79b6bf90152c2e69e9fbc01ad74221208d2. Do not recut it whenever
live development advances. The actual source archive is already in this PR:
`/Newgame/versions/02a3a43ace8adc993aea7a392424d7cdf4e7dec9/`.
It has70hashed payload files plus its manifest; all72previous snapshots, URLs,
Git history and isolated save namespaces remain unchanged. There are73snapshots
and33logical milestones. No additional MINOR bump or duplicate archive is needed.

## Actual verification

| Scope | Result |
|---|---|
| Frozen source02a | Own459/459 tests, build and real Chromium startup; exact source tree. |
| Corrected native fixtures | Full combined source8b suite passed, including real40s Smelter, late Hauler, UI obstruction, seasons and current-save restoration. See M2-smelter-smoke.md. |
| Prior source after approved ground/building merges | 474/474 tests,0failed/0skipped; changelog/catalog validation; production Pages build passed. |
| All73 local canonical archives | 2456HTTP files,121455383bytes, correct MIME/SHA-256; immutable archive validator passed. |
| Updated Studio | Canvas/WebGL/export/mobile smoke exit0; no console/network errors. |
| New actual-deployment archive proof | 13/13 targeted Git/gate tests; all71 actual02a Git files at local integration3d5ac80 verified. Current public main correctly refused. |
| Full native integration through main14071b1 with approved ground/buildings | Exit0: ledger/Smelter/mines/forestry/zoom/Fog/Population200/staffing/seasons/real construction and cancellation/current Save14/historical games/mobile. |

Logs in `/workspace/scratch/`: `Newgame-M2-deployed-archive-final-tests.log`,
`Newgame-M2-deployed-archive-pages.log`, `Newgame-M2-approved-art-http.log`,
`Newgame-M2-approved-art-studio.log`, `Newgame-M2-approved-art-full.log`.
The frozen source’s actual builder report is
`/tmp/newgame-version-archive-ei9bJz/report.json` (source02a,1new,0skipped).
Earlier exact failure-state replay and fixture checks are documented in
[M2-smelter-smoke.md](M2-smelter-smoke.md).

The final verifier now proves the exact archive was included in the **actual
successful deployment’s Git commit**, independently of newer live development.
It checks every blob and manifest byte, exact file set, source/package/tree,
released notes, public tag and version index/catalog. It also reads the actual
public catalog and manifest, refusing a pre-tag unavailable entry or different
served manifest even if the local tag/catalog look correct. Missing/extra/symlink or
corrupted deployed files fail even when the local archive is good. Preflight
still requires deployed live-source equality and all nine commands.
See [M2-deployed-archive.md](M2-deployed-archive.md).

## Public state and actual limitation

No public v0.3.0 tag exists as last checked. The prepared **local-only** annotated
tag v0.3.0 objectb20628dec0f21068c23b713a3fe0bfeb5e30b115 targets02a. Before refining
that unpublished local reference, the former candidate tag objecta0eebc1704e37b5ba7cab5572cbfab1dcff22f1e
was preserved at `refs/tags/candidate/v0.3.0-f053be1`. The earlier published f053
snapshot stays immutable/playable; no public tag or Git history was moved.

Actual earlier deployments: [41877748443](https://github.com/tom161819/Newgame/actions/runs/41877748443)
for main7595b80 (PR15), and [41883338166](https://github.com/tom161819/Newgame/actions/runs/41883338166)
for mainb554b4e (PR18), both Success. These do not prove deployment of PR22.
The Actions index can be stale; the normal public `commit/FULL_SHA/checks` page
reliably identifies each real run. Do not invent or reuse a different source’s
successful run.

Actual `gh pr edit22` and authorized `gh pr merge22 --merge` attempts previously
failed with `Post "https://api.github.com/graphql": Forbidden`. A fresh ordinary
HTTPS request now confirms `CONNECT tunnel failed, response403` from the managed
network gateway before GitHub. Git push to github.com still works. The current
runtime does not allow api.github.com; the user’s screenshot shows unrestricted
access in the draft but `Couldn't publish environment`. Internal publish logs
and historical network observations are unavailable; this does not establish why
merging may have worked in an earlier runtime. No repository-rights change or
network-policy bypass is justified by this evidence.

M2 is **not RELEASED**. Master11–15 and C01–C08 are unstarted; the latter remains
queued before deferred master11–15, after M2, per the latest user reorder. No further release authorization is required.

## Resume without another permission request

1. Full native integration is now recorded as exit0; push the final verification
   checkpoint and review the exact PR source.
2. Merge PR22 normally after checks, preserving any later main work. Never push
   directly to main. If API access remains blocked, keep this complete checkpoint.
3. Verify actual Pages Success for that main SHA, then run formal `release:gate`
   M2 against that exact deployment. Do not report earlier local runs as this gate.
4. Confirm02a is an ancestor of main and the remote tag remains absent; publish
   only `refs/tags/v0.3.0`. Do not publish private candidate refs or prepare another
   MINOR:0.3.0 is already prepared,0.4.0 belongs to the next milestone.
5. Ensure a tag-aware Pages build refreshes the generated catalog. Verify its
   actual Success and run `release:verify` with the exact deployed SHA/run.
6. Only then record M2 RELEASED and begin C01 automatically, followed by C02–C08 and then master11–15. Save real
   technical blockers; never fabricate publication or promise background work.

## Earlier formal gate failures, retained as evidence

The formal gate after PR18 passed its first8commands, then timed out in a test
that waited sequentially for Hauler cargo and partial furnace work. A real late
carrier can receive a finished Bar first, after partial work ends. The fix waits
for the Hauler’s physical arrival and jointly observes carried Ore/fuel and
partial production. A dedicated model covers that actual fallback and exact
receipts/XP/cargo Save14. The original timeout did not capture exact app state.

A separate diagnostic full rerun passed the Smelter but later clicked a live
Granary staffing DOM control instead of the Tower canvas location. Its actual
snapshot/screenshot and replay proved valid10Stone stock and an obstructed click.
The fixed helper settles the camera and clicks exposed canvas within the same
anchor diamond, with a permanent real-DOM regression. Those failed runs were not
relabeled as passing; later complete corrected runs actually exited0.
