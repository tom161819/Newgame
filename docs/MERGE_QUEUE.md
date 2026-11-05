# Merge queue — latest access diagnosis, 2026-11-05

GitHub Issues and live PR state are authoritative. This file records fallback
handoffs; it cannot bypass required checks, holds, ownership or dependencies.

## Verified but unmerged Codex PRs

None at this audit. PR22 is actually merged. No new PR number is invented for
`codex/issue-47-m2-release`; its evidence documents and read-only post-deployment verifier are prepared on that branch.
Required CI of a new PR head still needs to complete before a standard merge.

The only public open PR observed was Claude PR31 (scheduler smoke test), explicitly
HOLD. It is excluded from the merge queue and must not be merged as assistance.

## Actual PR-creation attempt

At the owner's request, one further standard PR-creation attempt was made on
2026-11-05 at exact head `a758ae583b3985c916b807877cd70cd4cd08e9af`. It again
returned `Post https://api.github.com/graphql: Forbidden`; no PR was created.
A direct transport diagnostic proved HTTPS proxy CONNECT403 before GitHub API.
The saved draft includes the API/Pages hosts but the running policy excludes
them. See [sanitized evidence and supported recovery](verification/issue-47/network-access-2026-11-05.md).
Do not ask the owner to create a PR as a substitute for restoring agent access.
Actual fetched main is now `1b73c2c62d9f5c0dd7cbcc43cfc4398efa8b996e` (PR77);
the CI evidence below remains attributed to its historical exact source SHA.
Only HOLD PR31 remains publicly open at this check.

The prepared branch head a1a0b3319ee262d44e3d002894412d704131e769 was pushed.
One normal `gh pr create` was attempted, with the exact-head body prepared in a
file. It returned `Post https://api.github.com/graphql: Forbidden` before a PR
was created. No PR number, current-head green CI, merge or MERGE-HELP Issue is
invented. Do not retry the unchanged denied API in a loop.

Create/review link for an authorized helper:
https://github.com/tom161819/Newgame/pull/new/codex/issue-47-m2-release

The source branch may receive evidence-only checkpoints; always re-read its
actual live SHA and wait for that PR head's required checks. The observed
current open PR31 is HOLD and is not an eligible substitute. A fresh public
Codex-ready Issue search still returned only47;48–60 are dependency-blocked.

## Release/publication handoff — Issue47

- Issue: https://github.com/tom161819/Newgame/issues/47
- Prepared branch: `codex/issue-47-m2-release` from main65b4bf8a439686253dd5e933a8d5555e83c01922.
- Exact CI-tested game source:65b4bf8a439686253dd5e933a8d5555e83c01922;
  Pages41924183243 **Success**, all nine mandatory release prerequisite commands
  and full browser scope verified from the actual workflow. The branch adds documentation and read-only release verification CI, not
  another version of M2 mechanics.
- Public tag: v0.3.0 really targets02a3a43ace8adc993aea7a392424d7cdf4e7dec9.
- Blocker: managed API connection returns Forbidden; actual public Pages HTTPS
  returns CONNECT403. This is not a branch-protection exemption or evidence
  that a PR is mergeable. Issue status/claim was not successfully changed.
- Dependencies/order: no further mechanics dependency for the metadata handoff;
  a tag-aware Pages build and final actual artifact verification are required
  before Issue47 can close/unlock48. Never advance the blocked dependency chain.
- Assistance: create the evidence-only PR if no duplicate exists; verify its
  exact live head, required CI, reviews, conflicts and holds; standard merge.
  Then verify the tag-aware Pages deployment and live catalog/manifest. Full
  instructions/evidence: [Issue47 audit](verification/issue-47/README.md).
- Recommended manual order: this evidence/verification-CI handoff first; Issue48+ only after
  real M2 closure. Never tag unmerged code or merge multiple PRs blindly.

No live MERGE-HELP Issue or PR comment is claimed. A request cannot name a
nonexistent PR, and merged PR22 needs no merge help. If a real PR is created and
its only remaining blocker is integration permission, create one request with
`agent:claude` + `status:ready`, the exact current head SHA and actual CI links;
first search for an existing request for that same PR. Do not substitute older
CI or a guessed SHA. If all API writes fail, keep this pushed checkpoint and
report the actual manual action.

## Parked WIP, not ready to merge

`codex/fow-exploration-blueprints` / dd728a0: preserved partial C01 fix. Issue48
is blocked by47. No complete C01, PR, merge, deployment or release is claimed.
