# #211 – Approvals manifest: revision requests, rejections, comments and history (AR-1 of #210)

## What and why
[#210](https://github.com/tom161819/Newgame/issues/210) builds a full review loop for graphics: designs → the owner's decisions → Submit Review to GitHub → Claude's revisions → approval → In Game. Stage 1 extends the data model that every later stage uses. It covers new decisions, comments tied to an exact version, revision history, and a derived In Game state.

## Files and systems
- `studio/src/lib/approvals.js`:
  - `STATUSES` = draft, review, **revision-requested**, approved, **rejected**, **blocked**; `BASIC_STATUSES` = the three the current UI shows until AR-2.
  - `validateManifest` checks the optional `comments[]` ({version, text, at}), `history[]` ({version, specHash, status, at}, always older than the record) and `review` ({issue, submissionId}). A revision request must carry a comment for its own version.
  - `reviewState` adds `revisionRequested`, `rejected`, `blocked` and `awaitsOwner`. `awaitsApproval` no longer counts rejected variants.
  - `updateLocal(..., {comment})` appends a comment for the current version and refuses a revision request without one.
  - `buildExportManifest` keeps repository comments and history and appends local comments once.
  - `nextRevision(record, {version, specHash})`: Claude's new version starts in **review**; the old record goes to `history`; approval never carries over.
  - `gameArtSources({definitions, villagerArt})` and `inGame(paths, sources)`: In Game is derived from the game data (an `artSource` naming exactly the variant's exported metadata of this version) and never stored.
- `studio/src/main.js` uses `BASIC_STATUSES` for its buttons, so the UI is unchanged until AR-2.
- Tests: `tests/asset-review-manifest.test.js` (5); `tests/asset-studio.test.js` status list.

## Implementation decisions
- **Additive within schema 1:** existing records stay valid and no data migration is needed; the committed manifest is checked by a test.
- **Derived over stored:** Outdated and In Game cannot drift from the files. Generating will be the open revision issue (AR-4).
- **History is append-only and older than the current version**, so any number of revisions is possible and none can overwrite a newer one.

## Save/Load impact
None (Studio data only).

## Testing
- `npm test` passes, including 5 new tests: the committed manifest is valid; a revision needs a comment; rejection; a revision never inherits approval and an older approval shows as outdated; export merging without duplicates; In Game for the Mill, a miner look, an unapproved sibling and a v2.
- `npm run studio:smoke` passes (the UI is unchanged).

## Notes for the next agent
- AR-2 (#212) builds the buttons Approve / Request Revision / Reject / Preferred, comments, history, filters and the In Game badge on this API. Use `awaitsOwner` for "Waiting for My Review".
