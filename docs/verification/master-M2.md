# M2 — Resources, economy and iron — local preflight verified

Latest update: main2ce3cd7 trees preserved;475/475models, production build and
native zoom/Fog/season-transition/forestry/current Save14/historical games pass.
Prior full suite through main14071b1 remains recorded below. New user order:
M2 publication → C01–C08 → master11–15 (IDs and later milestone gates unchanged).

Status: FROZEN RELEASE CANDIDATE; public publication pending in
[PR22](https://github.com/tom161819/Newgame/pull/22). Source02a has its own459-test
archive (73total,72older unchanged),0.3.0/Save14 and coherent release notes.
The previously verified ground/building integration preserved approved art through
main14071b1:474models, validators, Pages build,73canonical archive URLs/2456HTTP
files and Studio smoke pass. The complete current-game native suite also exits0, including physical
production/construction, Fog/zoom, seasons, current Save14 and historical games.
Final verification now hashes exact archive blobs from the actual deployed Git
commit; preflight still requires the reviewed live source to match that deploy.
See [the current publication checkpoint](M2-release-publication.md) for exact
SHAs, results, the private tag and the actual network blocker. No tag/main/Pages
success or formal final gate is claimed before it really occurs. Automatic M2–M5
publication is already authorized; no new approval is needed.

## Verified implementation commits

| Stage | Actual source |
|---|---|
|07Forestry & Natural Resources|d195a39f5090643c7785c9c9b56db746e57f9991|
|08Extended Zoom|c106cc4f4b0d1afb73a444500d0d1adabc92fb05|
|09Daily Resource Ledger|f3310a105223654a595f5bff205c56f5668c15cc; merged PR9|
|10Quarry & Iron Smelter|069bf90df39e97f92394e167678a7be84505f29c; graphics integration0f76b96/PR11; final Quarry save fix0f4ebce931d912c18ff33a6148697b9514bb9249|

## Actual checks

- 438 passed,0failed/skipped. The actual forest->timber->physical mine construction
 ->finite Ore->Hauler->Smelter->Warehouse chain crosses an active-cycle Save/Load
 with exact raw/fuel/product ownership,XP and receipts.
- New Game/current Save14: pickup, all recipe inputs, partial production, loaded
 output, restored jobs/reservations and refusal of corrupt/other schemas.
- Whole combined native suite passed: ledger,40s furnace recipe, real construction,
 Haulers, automatic staffing, XP, finite mines/depletion, forestry, zoom0.25,Fog/
 static memory,Population200/mobile, vacancy indicators,seasons, locks,
 construction completion/cancellation and original historical games. The later
 small neighbouring-Quarry validator fix has a dedicated real restored/depleted
 regression, full438model suite and current native roundtrip. No full-smoke result
 is misattributed to a later artifact.
- Changelog/catalog validation, production Pages build and71immutable SHA archives
 pass. Local production HTTP checks71original URLs/2314files/116659963bytes/MIME.
- Standalone profile 20 NPC,100x100,Fog,moving king,Canvas,0.25zoom:59.34FPS cold and
 60.00after closing Archives; actual simulation/passages, no historical game
 requests or retained archive rows, no per-frame staffing scans.
- Claude's approved graphics/Studio files and renderer remain unchanged relative to
 integrated main. No force push, history rewrite or direct main push. Existing
 historical saves/namespaces are untouched; alpha schemas are not migrated.

## Earlier preflight sequence (superseded by the publication checkpoint above)

1. Merge the final small Quarry validation/evidence follow-up through PR into main.
   Main7012635 already contains the main Stage10 feature through PR11.
2. Verify successful GitHub Pages for the exact final mainSHA. This cloud environment
   still blocks GitHub API PR creation; do not replace it with a direct main push.
3. The user subsequently authorized M2 and standing automatic M1–M5 releases.
   The previous Stage10 stop/release-confirmation requirement is superseded.
   Complete the actual gates and publication without another approval prompt;
   only genuine access/environment blockers can pause progress.
4. Run the existing formal command with actual evidence, never fabricated IDs:
   npm run release:gate -- M2 --pages-run=ACTUAL_RUN --pages-commit=ACTUAL_FULL_SHA
   --report=/tmp/m2-gate.json. It verifies clean source/deployment and all checks.
   It has NOT been run/passed here, because matching deployed source is pending.
5. Only then prepare the next MINOR using the established workflow, verify metadata,
   commit/tag the real release source and build its immutable archive from that
   exact commit. Preserve all71existing snapshots/URLs and verify real deployment.
   Then record RELEASED and continue C01–C08, then deferred master11–15. No premature0.3.0claim.

Visual Polish & Art Pass is cancelled from Codex's queue, owned by Claude. Routine
merge conflicts are now resolved autonomously while preserving both authors.
