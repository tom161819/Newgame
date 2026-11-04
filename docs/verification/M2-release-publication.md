# M2 publication — uploaded in PR15, external merge BLOCKED

## Current checkpoint — 2026-11-04

- Actual open PR: https://github.com/tom161819/Newgame/pull/15,
  `codex/m2-release-candidate` -> `main`. The older preflight PR14 is superseded;
  merge PR15, not both. Public GitHub HTML confirms PR15 contains f053be1.
- Candidate version0.3.0, Save14. Latest main
  `c2c2862596558a63e53d20718162a06565e3749c` was merged normally as
  `f053be1879beb2af3814972caecc8768b8f1ad90` and pushed. All Claude runtime,
  Studio, seasonal concept and art changes are preserved byte-for-byte. The only
  conflict was the coordination register; retain Claude's current waiting task,
  merged-task history and Codex's release row. No graphics were edited by Codex.
- User explicitly said to upload now and test afterwards. The candidate was
  uploaded first. No additional approval is needed for this release, ordinary
  conflicts or subsequent master milestones. The PR workflow remains in force.
- Integrated checks: clean npm ci,455/455 tests,0fail/skip, changelog/catalog
  validation, build:pages, native --current-only smoke all exit0. The browser
  verifies real movement, pickup, physical delivery, exact IndexedDB Save14
  in transit, no copied stock/XP, controls and mobile tabs, and zero archive
  requests during cold current-game startup. Before this merge, the complete
  5f6009c browser log also records every full-suite scenario PASS; those results
  are not attributed to the newer graphics build.
- All71existing snapshots stay unchanged. Pages composition copies2314files;
  historical URLs and save namespaces are untouched. The earlier source5f6009c
  archive preview is local only, at /workspace/scratch/Newgame-M2-archive-preview;
  it must not be published as the final merged/tagged M2 archive.
- Actual `gh pr merge 15 --repo tom161819/Newgame --merge` failed with
  `Post "https://api.github.com/graphql": Forbidden`. Runtime still spec3;
  api.github.com and tom161819.github.io remain outside its allowed hosts.
  Git push works. A supported network draft is saved but not activated. Do not
  bypass the denial through proxies, alternate endpoints, or an Actions job.
- No new v0.3.0 tag, final M2 archive, successful deployment or RELEASED claim.
  Work is checkpointed because of actual external access, not a permission hold.

## Resume without another approval

1. Fetch current main and PR15 state. If it is still open, merge it through the
   authorized GitHub API once supported access works, or its existing web Merge
   button. Never substitute a direct main push. Preserve any intervening work.
2. Verify the exact merge's actual Pages run. Only after the release source is
   an ancestor of main, publish the annotated v0.3.0 tag for the real release
   source (f053be1 is the verified integrated game/version source; later changes
   here are documentation). Check for an existing tag first; never move it.
3. Generate the final immutable archive from the actual tagged source, verify
   tests/build/browser/SHA and preserve all71existing builds. Submit the archive
   and catalog through a new branch/PR, then verify its successful Pages deploy
   and release:verify with real run/source evidence. The old preview is not a
   replacement for this step. Report unperformed gates honestly.
4. Mark M2 RELEASED only with tag/archive/deployment evidence. Continue master
   Stage11 Stone Pavement & Courtyards, then12–15. Visual Polish is Claude-owned.

## Earlier preparation record

User explicitly authorized release now and automatic milestone releases without
another prompt. The previous Stage10/M2 approval hold is superseded in AGENTS,
which Claude also imports. PR-only merges, actual gates and immutable archives
remain required. Visual Polish stays Claude-owned.

Branch codex/m2-release starts at main7012635, normally merges the verified final
Stage10 follow-up98b91de, and preserves the current approved graphics. No history
rewrite, force push or direct main push.

Running environment spec3 still excludes api.github.com and tom161819.github.io;
Git transport and public github.com work. A supported configuration draft was
saved, preserving the package-manager preset and all scripts/repositories, adding
only those two required hosts. Tool reports saved/requires_publish:true. This is
not an active runtime change; the user must review/save/publish it through the
product. Do not bypass the proxy or claim API access before actual verification.
Continue independent release preparation and tests while that prerequisite waits.

Pre-release final game source:438 tests, production build and final native current
Save14 roundtrip pass. Earlier combined full native gate passed before the last
narrow two-Quarry validator correction, covered by dedicated restored mining and
forged-binding tests. Final release candidate requires new metadata/UI/build/
archive checks. Formal gate still needs exact successful Pages evidence.

Candidate preparation is separate: codex/m2-release preserves the0.2.0 preflight
source and standing authorization; codex/m2-release-candidate prepares package/
lock/Changelog0.3.0 with M2 metadata, preserving the game/Save14 model and all prior
releases. No tag or publication is claimed. The API draft activation is a technical
prerequisite, not another release approval. Continue with local candidate checks
and an actual-source archive preview before reporting the external blocker.

Prepared0.3.0 candidate: clean npm ci,438/438 model tests, changelog/catalog validation
and build:pages pass. Source evidence retains all71archives. Actual existing main
7012635 has successful Pages run41853854762, but that source lacks the final small
Quarry correction and release metadata. It is not proof of the prepared release.
No new release tag exists yet. The candidate source will be committed/pushed,
then archived as a real-commit preview and exercised in the full browser suite.
