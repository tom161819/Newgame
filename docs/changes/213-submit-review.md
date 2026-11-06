# #213 – Submit Review: one GitHub issue per review, confirmed receipt, no token (AR-3 of #210)

## What and why
Stage 3 of [#210](https://github.com/tom161819/Newgame/issues/210). The owner's decisions must reach GitHub, so Claude can act on them without comments being stuck in the browser. They must be sent without any GitHub token in the public Studio, and must not count as sent until GitHub confirms them.

## Files and systems
- `studio/src/lib/reviewSubmit.js` (pure):
  - `reviewItems` gives every decision with its exact version, spec hash, latest comment for that version, and preference.
  - `buildSubmission` creates `{schema, kind:'asset-review', submissionId, baseManifest, itemsHash, items}`. The same decisions reuse an earlier submission, so there is no duplicate issue.
  - `issueTitle`/`issueBody` produce a readable table plus a fenced `asset-review` JSON block for the AR-4 Action.
  - `issueUrl` builds a pre-filled `issues/new` link with the `asset-review` label. Above about 7.6 kB it falls back to the title and label in the link, with the text copied and pasted.
  - `confirmReceipt` searches the public GitHub API for the submission id. The result is confirmed only for an issue by the owner; otherwise waiting, offline, rate-limited, error or not-owner.
  - The outbox in localStorage holds submissions and their states, never a token.
- `studio/index.html`, `studio/src/main.js`, `styles.css`:
  - a **Submit review** button (primary; Export review stays as a fallback);
  - a dialog with the summary (Approved, Revision requested with comments, Rejected, Back to review, Preferred);
  - **Open the GitHub issue** opens GitHub in a new tab; **Check GitHub** confirms receipt; **Copy issue text** for long reviews;
  - an issue link and the last submissions.
- GitHub label `asset-review` created.
- Tests: `tests/review-submit.test.js` (4). `scripts/studio-smoke.mjs` gets a Submit review block with the GitHub API mocked: offline, not yet visible, confirmed, and a re-submit reusing the submission.

## Implementation decisions
- **No token in the browser:** the owner presses *Submit new issue* on GitHub, signed in. This is the safe fallback the assignment allows, because GitHub Pages cannot write to GitHub without an authorization.
- **Sent means confirmed:** clicking only opens GitHub. The state becomes `confirmed` only when the public API returns the owner's issue containing the submission id. Local decisions are kept in every case. They disappear from "local changes" only when Claude's PR records them in `art/approvals.json` (AR-4/AR-5).
- **Duplicates:** the submission id is derived from a fingerprint of the decisions. The same decisions reuse it, and the AR-4 Action will also supersede older open reviews of the same asset.

## Save/Load impact
None.

## Testing
- `npm test` passes (4 new tests: the payload with exact versions, the URL and label with long fallback, receipt states including foreign author/403/500/offline, and outbox reuse with no token and broken storage).
- `npm run studio:smoke` passes, including the new Submit review block.

## Notes for the next agent
- AR-4 (#214): the workflow parses the fenced `asset-review` block from the issue body, validates it against main, posts a normalised summary, supersedes older reviews and labels for Claude. The CI guard then requires `review: {issue, submissionId}` on every approval in `art/approvals.json`.
