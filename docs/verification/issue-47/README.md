# Issue47 — M2 v0.3.0 release audit, 2026-11-04

## Final result (2026-11-05)

M2 v0.3.0 is **RELEASED** (2026-11-05). Issue47 was finished by Claude at the owner's
request: PR79 (Codex head 5b094ea + main) merged as d9e91258a15e79b64c774ffe45ff413f47066d72;
the first tag-aware Pages run 41975989872 succeeded; Verify published release 41976289989
passed the exact tag v0.3.0 → 02a3a43, frozen notes, 71 deployed archive blobs and the live
catalog/manifest (SHA-256 4bce4d36cb4ed15aeb0fb956bc5432300d1c2634813d18690cf1d2b4c596f2ac).
Issue47 is closed as done; only Issue48 (C01) was moved to ready.

The sections below are the original Codex audit and handoff, kept unchanged as history.

Authoritative task: https://github.com/tom161819/Newgame/issues/47
Branch: `codex/issue-47-m2-release`, based on main65b4bf8a439686253dd5e933a8d5555e83c01922.

## Actual results

- PR22 was merged as cfe51fafd0e3a509c7335d6564fa206193165e20. Do not reopen or
  duplicate its mechanics/archive work. Claude's N02 is merged through PR62;
  this task changes none of its Hauler, Warehouse, Granary or Save15 logic.
- Remote tag `v0.3.0` is now actually published and re-read with `git ls-remote`.
  Its annotated object is b20628dec0f21068c23b713a3fe0bfeb5e30b115 and its exact
  source is02a3a43ace8adc993aea7a392424d7cdf4e7dec9 (tree49b1e79b6bf90152c2e69e9fbc01ad74221208d2).
  Only that explicit ref was pushed; no force, public tag replacement, main push,
  version bump, archive rebuild or changes to existing saves.
- Source package0.3.0 and released notes match the current0.3.0 entry exactly.
  All10 completed prerequisite stage commits are ancestors of the frozen source.
- All71 Git blobs, including the raw manifest, in the frozen02a archive match
  the actual successfully deployed main65b4bf8. The archive keeps Save14; the
  later live N02 uses Save15. This difference is intentional, with separate
  archive storage namespaces; neither schema was rewritten or migrated.
- Pages41924183243 for exact main65b4bf8 is genuinely **Success**. Its mandatory
  workflow executes all nine release prerequisite checks, and its actual source
  changes select `full` in ci-smoke. That includes full simulation tests,
  immutable SHA archives, production build, canonical HTTP byte/MIME checks,
  full native browser/Save-Load and Studio. No duplicate local npm ci, full test,
  build or browser run was started. The standalone release:gate CLI was **not**
  rerun; evidence explicitly credits the actual existing CI execution.
- The candidate adds audit/coordination documents and a read-only post-deployment
  verification workflow. Existing runtime, build configuration, test and
  dependency files stay byte-identical to the CI-tested source.

Structured proof: [evidence.json](evidence.json).
Existing successful run: https://github.com/tom161819/Newgame/actions/runs/41924183243
Public source tag: https://github.com/tom161819/Newgame/tree/v0.3.0
Canonical archive: https://tom161819.github.io/Newgame/versions/02a3a43ace8adc993aea7a392424d7cdf4e7dec9/

## What is still pending

The existing successful deployment was built **before** tag publication. A new
main Pages deployment must fetch the public tag and regenerate the catalog; the
current pages workflow does not trigger on tag pushes. Final release:verify must
confirm that actual live catalog entry is available and points to02a, and that
its served manifest exactly matches the immutable snapshot. Until then M2 is
not RELEASED and Issue47 is not done; do not unblock Issue48.

The managed runtime currently reports restricted HTTP with api.github.com absent.
An actual `gh issue view47` fails `Post https://api.github.com/graphql: Forbidden`.
This is the known environment gateway issue, not evidence of unsafe PR or weak
branch protection. Issue claiming/labels/STARTED, PR creation, workflow dispatch
and a merge-help comment have not been reported as successful. Do not repeatedly
retry the same denied API or use private endpoints/proxies to bypass policy.

The final public-catalog HTTPS request also fails at CONNECT403. Use the ordinary
supported connection of an authorized helper for this read, not a false pass.

## Read-only post-deployment verifier prepared

`.github/workflows/verify-published-release.yml` is a normal post-deployment
check after a successful Pages **main push**. It executes reviewed verifier code
from the default branch, checks the event's actual deployed SHA/run, and calls
the existing strict release:verify. It fetches the actual public catalog and
manifest; its JSON success evidence is retained in the job summary.

Permissions are contents:read only; there are no Issue/PR/tag/main writes. No
install, build, game tests, Studio smoke or archive staging is repeated. No
retry loop masks Forbidden or other failures. Missing current milestone tags
are explicitly reported as **not verified**, never as a successful release.
The report header is written only after verification exits0 and its report
file exists. Older cancelled/superseded Pages runs do not trigger this check.

YAML, trusted-main event guards, pinned checkout/setup-node actions, read-only
permissions and all Bash blocks were checked locally. All13 existing verifier/gate
regressions passed. The exact workflow tag step also passed against the real
repository, an empty-tag Git fixture and an actual Git error (fail closed).
No dependencies were installed. The workflow itself still requires a real main merge
and a real first run. It is not claimed executed or successful in advance.

Actual standalone release:verify against41924183243 was attempted once after
publishing the tag. The tag/notes/archive checks passed; it failed exactly at
public artifact HTTPS: `Cannot verify the actual published release artifact
through the configured HTTPS connection.` No success report was produced.

## Actual PR creation is blocked

After pushing a1a0b3319ee262d44e3d002894412d704131e769, one standard `gh pr create`
for this branch was attempted. It returned `Post https://api.github.com/graphql:
Forbidden`; no PR was created. Do not turn this into a fictitious PR/MERGE-HELP
number or claim that the new workflow has run. No Issue label/STARTED/comment
write is claimed either. Current Codex-ready search still returns only47.

An authorized helper can open the prepared branch directly:
https://github.com/tom161819/Newgame/pull/new/codex/issue-47-m2-release

Re-read the branch's actual head before acting; later commits may only update
this evidence. Standard required CI and review still apply to the exact PR head.
A successful main merge will enable the proposed read-only verification job.
No existing public tag or immutable archive may be changed to work around this.

## API retry and confirmed network blocker (2026-11-05)

The owner requested a new attempt rather than creating a PR manually. The
standard retry failed again before reaching GitHub API. The HTTPS proxy returns
CONNECT403; the saved draft permits the required hosts but the running instance
does not. Full sanitized evidence and the supported recovery boundary are in
[the network-access diagnosis](network-access-2026-11-05.md). No PR was created,
and no GitHub permission change is justified by this transport failure.

## Safe authorized-agent handoff

1. Re-read live Issue47, main, this branch's exact head and open PRs. Avoid duplicate
   claims or requests. Record STARTED or blocked status on the existing Issue
   using an integration that can actually write; Codex could not apply it.
2. Open a **release evidence/read-only CI** PR from this existing branch if none exists.
   No duplicate functional M2 PR. Recheck its live head, required checks, reviews,
   branch protection and dependencies. Old green CI is not proof of green checks
   for a new PR head. Standard merge commit only after all required checks pass.
3. A standard main merge starts a tag-aware Pages build; alternatively an
   authorized helper may run the existing Pages workflow on main. Verify the
   successful run contains the tested commit or a newer descendant; a cancelled
   superseded deployment is not a failure. Never push directly to main.
4. The new verifier should run after that actual successful main-push deployment;
   inspect its real successful run and JSON summary. It must prove the actual
   catalog/manifest/tag/source checks. Record the resulting final release report
   (or perform the same strict release:verify using the real run/full SHA).
5. Only after all release conditions pass: update progress/Issue47 to done and
   close it; re-evaluate and unlock **only Issue48**. Later tasks stay blocked.

No MERGE-HELP Issue for PR22: it is already merged. A merge-only handoff is valid
only for a real existing, fully checked unmerged PR. If PR/Issue creation is also
blocked, this pushed checkpoint is the fallback allowed by AGENTS.md.

## Safely preserved earlier C01 work

Remote branch `codex/fow-exploration-blueprints` retains WIPdd728a0. It contains
only the reproduced lost-visibility-delta terrain fix and its regressions;12
focused checks passed on its older base. C01 unknown movement/provisional sites
are not implemented. Do not merge that branch's obsolete AGENTS/queue overrides
into current main. Once Issue48 is actually ready, audit the latest main renderer
and current save schema and recover only the relevant tested code. This WIP is not a
ready PR and is not included in the release branch.
