# #214 – GitHub intake for asset reviews and a CI guard against self-approval (AR-4 of #210)

## What and why
Stage 4 of [#210](https://github.com/tom161819/Newgame/issues/210). After Submit review (AR-3) creates the owner's issue, GitHub validates it, explains it and hands it to Claude. Approvals in the repository must then provably come from the owner, never from Claude.

## Files and systems
- `scripts/asset-review-lib.mjs` (pure):
  - `loadCatalog` reads the current variant versions and hashes from `art/assets` with the Studio's own catalog code;
  - `parsePayload` reads the fenced `asset-review` block, including a comment check for revision requests;
  - `checkItems` returns ok, stale (main has another version or hash) or unknown;
  - `summaryComment`, plus `supersededBy` for older open reviews of the same variants;
  - for the CI guard: `approvalsNeedingProof` and `proofProblem`.
- `scripts/asset-review-intake.mjs` + `.github/workflows/asset-review.yml`:
  - triggers on an issue opened, edited or labelled whose body contains the block;
  - posts **one** summary comment, updated on edit (marker);
  - for the owner, closes superseded open reviews (`not_planned`, with a link) and adds `asset-review`, `agent:claude`, `status:ready`;
  - a non-owner's issue is summarised as ignored;
  - permissions `contents: read, issues: write`; it never writes to the repository; `--dry-run` for tests.
- `scripts/approval-guard.mjs` + a `pr-quality` step "Approvals need the owner's review (#214)" (`issues: read`):
  - every variant that becomes approved in `art/approvals.json` (new, or with a new version or hash) must carry `review: {issue, submissionId}`;
  - that issue must be by `tom161819`, hold that submission, and approve exactly that variant, version and hash;
  - existing approvals are unaffected.
- Tests: `tests/asset-review-intake.test.js` (5), including a dry run of the intake on a fixture event.

## Implementation decisions
- **Action, not app:** the repository's own `GITHUB_TOKEN` in Actions comments and labels. No token or secret is ever in the Studio, and there is no paid service.
- **Writes only through PRs:** the Action never commits. Claude records decisions in `art/approvals.json` through a PR. The guard makes a self-approval impossible to merge, because an approval without the owner's matching submission fails CI.
- **Stale protection:** decisions made on an older version or hash are listed as "not applicable on main", so an older review can never approve a newer variant.
- **Manual approvals:** a hand-edited approval (old Export review path) now also needs the owner's review issue. Submit review is the way to approve from now on.

## Save/Load impact
None.

## Testing
- `npm test` passes (5 new tests: payload parsing and rejection; ok/stale/unknown against the real main catalog; summary for owner/non-owner/supersede; supersede only for the same variants; guard pass/missing/foreign author/wrong hash/wrong submission/revision-not-approval/unchanged; intake dry run).
- `node scripts/approval-guard.mjs` on this branch: no new approvals, PASS. YAML of both workflows parses.
- The live workflow is verified on the first real Submit review after the merge (AR-6).

## Notes for the next agent
- When applying a review issue, copy `review: {issue, submissionId}` into every approved record, or CI fails. Revision requests and rejections need no proof, but keep the reference anyway for history.
- AR-5 (#215) adds `art:revise` and `art:integrate` and documents the whole procedure in AGENTS.md.
