# Stage 09 — Daily Resource Statistics and Ledger

Status: implementation and integrated verification complete; PR creation blocked
by the managed environment's GitHub API policy. Owner: Codex.
Branch: `codex/stage-09-ledger`. No merge into main, deployment, release or tag was made.

## Recovery and integration

Original unpushed work is preserved on `codex/stage-09-ledger-wip` at
`feb19d250da20a60826798d106e6f3ba6028b0d6`, based exactly on c106cc4. That WIP
passed 399 tests and a build; it is a recovery checkpoint, not the final feature.
Reviewed foundation files were ported individually, without merging the WIP.

The implementation started on the explicitly permitted ALPHA-policy base
`cf4c542db021eb09e6cf32a2b75634061cae0cf2`. While work proceeded, PRs #1–#8
landed externally. After fetching main `69e5e57b7053bcf67d1a113194449ad186085e63`,
a clean merge-tree preflight and normal merge brought it into this task branch
at `cf88c3b0a0b89cf354f4b9215ec1991f069950fc`. No rebase, force push or overwrite.
The changed lockfile was installed with `npm ci`; all final checks use this
integrated source. The earlier #1/#3 dependencies are now merged.

`docs/COORDINATION.md` was absent on the initial base and was not invented there.
Once it arrived through main, only this task's row was updated. Current AGENTS
permits agent self-merge/release, but the user's explicit uploaded handoff
prohibits it. Follow that higher-priority instruction: HOLD for developer review.

## Result

- One central journal records genuine acquisition, production and irreversible
  consumption, with stable receipt IDs, game time/day and actor/building context.
  It reads the existing stock owners; it is not another inventory.
- Mining, forestry, harvests, hunting, processing, construction, castle payouts,
  treasure, meals and actually paid wages use their existing authoritative paths.
  Pickup, cargo, storage, reservations and delivery do not create extra income.
- Reversible recipe inputs remain owned buffers until processing completes.
  Construction records actual consumption or cancellation losses; returned
  materials are transfers. Unpaid wage debt is not a cash expense.
- The Resource Bar shows the last completed day's smaller coloured net changes,
  or — before any completed day. A shared, bounded, scrollable tooltip shows
  current storage, gross income/expenses and source breakdown for every resource.
  Keyboard focus and scrolling do not move or zoom the camera. Reopening starts
  at the heading rather than retaining the previous scroll position.
- The journal retains 30 completed days and the current partial day. Save schema
  **13** persists these and processed IDs, validates totals/continuity and restores
  without replaying events. No older-save migrations were added. Other schemas
  are rejected before world changes, with the stored slot retained.
- No new trade, smelter, building or background simulation was added. The later
  stages can use the same transaction API when those mechanics actually exist.

## Verification — 2026-11-04

| Check | Actual result |
|---|---|
| `npm test` on integrated main | **419 passed, 0 failed, 0 skipped** |
| `npm run changelog:validate` | Passed |
| `npm run build:pages` | Passed |
| `npm run smoke -- --base=/Newgame/ --full` | Passed on integrated main |
| `npm run smoke -- --base=/Newgame/ --current-only --ledger` | Passed after final tooltip scroll-reset fix |
| `npm run archive:verify` / `npm run versions:validate` | Passed; all 71 immutable snapshots retained |
| `npm run archive:verify-site` | 71 canonical play URLs, 2,314 HTTP files, 116,659,963 bytes; SHA-256 and MIME match |

Model tests cover real 1/3-worker scenarios, finite mining, forestry, ground/cargo
restoration, all processing, reversible batches, construction/cancellation,
arrears, meals/day lengths, duplicate receipts, 30-day retention, corrupted
journals and incompatible-schema rejection. Native browser checks exercise actual
castle/wage/meal/treasure events, IndexedDB journal/receipt roundtrips, prior-day
display during current-day income, all-resource mobile bounds and real scrolling.
The full suite also verifies the existing map, movement, zoom/Fog, population,
staffing, construction, forestry/mining, physical logistics and earliest archive.
The final tooltip screenshot was captured and visually inspected. No tests were removed to obtain these results.

A preliminary timing sample varied between 44 and 50 FPS, so a controlled
comparison exported actual main69e5e57 source separately (no worktree/history
changes), then tested main and this branch sequentially using the same seeded
world. Both fingerprints were **1593626242**. With default Canvas, 1440×1000,
0.25 zoom, 20 residents, Fog and a moving king, both recorded **59.51 FPS** over
360 cold frames and **59.84 FPS** over 360 frames after opening/closing Archives.
No archive requests, retained development rows or per-frame staffing checks were
observed during normal play. This comparison found no regression; it is a local
measurement, not a performance guarantee for every machine.

Logs and screenshots remain in `/workspace/scratch/`:
`Newgame-master09-{merged-full,merged-archives,merged-http,handoff-tests,handoff-pages,final-ledger}.log`,
`Newgame-master09-performance-comparison.log`,
`Newgame-master09-compare-{baseline,ledger}.json` and
`Newgame-master09-final-ledger.png`.

## Scope and delivery

Changed: ledger data/system/validator/tests; inventory and existing economic event
owners; GameTime/serializer/loader/GameScene; InventoryBar/new tooltip/CSS; relevant
browser/CI/forestry/mineral smokes/helpers; Unreleased/progress/verification and
this task's coordination row. See the branch diff for exact paths.

Unchanged relative to integrated main: Studio/art and their scripts/tests,
renderer/main entry, `src/style.css`, SaveLoadMenu/GameApplication, AGENTS/CLAUDE,
package manifests, historical builds, public URLs and save namespaces.
The game version remains 0.2.0; Save13 is independent of a release number.

Both GitHub REST and GraphQL PR requests returned Forbidden. The managed runtime
policy allows github.com transport but excludes api.github.com, and no GitHub
connector is available. Git fetch/push work; do not bypass that restriction or
claim a PR exists. The verified branch and final body are ready for supported
PR creation: [body](master-09-pr.md),
[open branch PR](https://github.com/tom161819/Newgame/pull/new/codex/stage-09-ledger).

Next: developer/Claude opens the PR and reviews it. Stage10 remains unstarted
until Stage09 is merged or an actual Stage09 PR exists to stack upon. Prepare
the M2 gate only after Stage10; do not issue a release without the explicit
developer instruction required by the uploaded handoff.

## Merge authorization and graphics check — 2026-11-04

The user now explicitly authorizes merging this completed task into main through
its PR; the previous HOLD is lifted for Stage09. Do not infer a numbered release,
tag or permission to merge the other agent's unfinished graphics. Main remains
69e5e57 and the verified product source is unchanged since f3310a1.

Fetched remote Claude branches. `claude/approved-tower-brazier` at2c95aec contains
an approved watchtower/brazier integration not yet in main. That branch was only
read, never checked out, modified or pushed. A `git merge-tree --write-tree
--messages HEAD origin/claude/approved-tower-brazier` preview found no game-code
conflicts; the only conflict is adjacent task rows in `docs/COORDINATION.md`.
Resolve those later by retaining both agents' task information, without replacing
one branch's code wholesale. The preview did not apply a merge to the worktree.

The actual GitHub CLI request was retried and again failed with
`Post https://api.github.com/graphql: Forbidden`. Runtime and local policy still
exclude that API host, and tool discovery found no supported GitHub connector.
Public github.com and Git transport work; do not bypass the API restriction or
push directly to main instead of the required PR. No PR/merge or successful
Pages deployment is claimed. The branch and prepared body remain the concrete
handoff for manual web creation/merge or a supported API-enabled environment.
