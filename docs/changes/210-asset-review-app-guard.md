# #210 Asset review: agent-opened or edited reviews never approve

## What and why
Claude's GitHub tools act under the owner's login (`tom161819`). So a review issue that Claude opened would have passed the intake and CI approval guard, which only checked `issue.user.login`. That would break the rule that Claude never approves its own art. GitHub marks such issues with `performed_via_github_app` (for example `claude`). The owner's Submit review opens a pre-filled issue in the browser, which carries no app mark.

## Files and systems
- `scripts/asset-review-lib.mjs`:
  - new `authorProblem(issue, {edited})`;
  - `summaryComment` takes the `problem`;
  - `proofProblem` uses `authorProblem` and the issue's `lastEditedAt`.
- `scripts/asset-review-intake.mjs`: a review opened through an app, or one whose body was edited, gets an "ignored for approvals" summary. Such a review gets no labels and supersedes nothing.
- `scripts/approval-guard.mjs`: reads `lastEditedAt` with GraphQL using the workflow `GITHUB_TOKEN`. If that read fails, it fails closed.
- `tests/asset-review-intake.test.js`.

## Implementation decisions
- An edited review block is rejected rather than trusted. An agent could have changed it, and REST shows no editor. The owner submits again from the Studio, which creates a new submission and supersedes the old one.
- If the guard cannot tell whether a review was edited, it rejects the approval. It never passes it.

## Save/Load impact
None (tooling only; no game or save data).

## Testing
- `npm test`.
- New unit and dry-run tests cover three cases:
  - an app-opened issue is ignored;
  - an edited body is ignored;
  - a browser-opened, unedited owner issue still approves.
- The GraphQL `lastEditedAt` read could not run from the agent session, where GraphQL is blocked. Verify it on the first real approval PR (AR-6 #216).

## Notes for the next agent
Never open, or edit, an `asset-review` issue yourself, not even as a test. If one is needed for a test, the owner opens it from the Studio.
