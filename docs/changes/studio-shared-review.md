# Asset Studio: shared review in the Studio page (replaces the GitHub hand-over)

## What and why
The GitHub account is suspended, so the Studio can no longer run on GitHub Pages, and the planned GitHub hand-over (#210 AR-3 Submit Review, AR-4 revision issues) cannot work. The Studio is now published as a page in Claude ("Medieval Kingdom – Asset Studio", slug `d772dccf-fd89-4d2c-8d0a-36bbb102e3ce`). The owner and the other reviewers decide there. Each decision is saved in the page's database as soon as it is clicked, and Claude takes the decisions over into `art/approvals.json` at the start of a chat. The owner asked for more than one reviewer.

## Files and systems
- `studio/src/lib/sharedReview.js` (new, pure): document ids, `layerFromDocs` (database documents → the Studio's local-layer manifest; invalid rows are ignored), `docWrites` (layer change → document writes), `reviewerIds`, and `takeOver` (Claude's merge into the manifest, revision list and documents to delete).
- `studio/src/lib/approvals.js`: `updateLocal` takes an optional reviewer id `by`, stored as `decidedBy` on the record and `by` on comments. `validateManifest` accepts `decidedBy`.
- `studio/src/main.js`: `connectShared()` uses `window.claude.use('db' | 'user' | 'downloads')` when the page runs in Claude. It subscribes once to `reviews` and `preferred` and replaces the local layer with the shared one. Decisions are written one at a time through a queue. Reviewer names come from `user.profiles`; only ids are stored. Viewers without write access get disabled decision buttons. Downloads go through `downloads.save`. GitHub links are gone: repository paths are shown as text, and there is no `review.issue` link. The export dialog becomes "Review hand-over" in shared mode, with no discard.
- `studio/index.html`, `studio/src/styles.css`: dialog text and steps for Claude instead of GitHub; `[hidden]` inside the dialog.
- `scripts/studio-sync.mjs` (`npm run studio:sync -- <docs.json> [--dry-run]`): writes `art/approvals.json` from the documents Claude read and prints decisions, revisions, ignored rows and `remove` (path + version).
- Page declaration: `db` with rule `{path:"", read:"view", write:"interact"}` (Contributors and up decide, Viewers read), `user` with scope `profile`, `downloads`.

## Implementation decisions
- One document per variant and one per asset preference, not one big document, so two reviewers never overwrite each other's unrelated decisions. The data shape is exactly the old local layer, so the review UI, filters, `pendingChanges` and export needed no new logic.
- The database holds only decisions not yet taken over. After Claude commits them and republishes the Studio with the new manifest, it deletes the documents at the version it read. A decision changed in the meantime has a newer version, so the delete is refused and nothing is lost.
- Outside Claude (`npm run studio`, tests) nothing changes: the review stays in localStorage, and the export dialog tells you to hand `approvals.json` to Claude.
- `decidedBy` and comment `by` are opaque per-page ids. They are kept in `approvals.json` for history, but names are only resolved inside the page.

## Save/Load impact
None. No game change, so no release; SAVE_VERSION stays 36.

## Testing
- `npm test`: 778 pass, including the new `tests/studio-shared-review.test.js` (ids, writes, layer round trip with two reviewers, untrusted rows, take-over, `studio:sync` dry run).
- `npm run studio:smoke`: all checks pass. A new block stubs the page runtime: a decision is written with the reviewer id, another reviewer's decision appears live with a name, a forged row is ignored, there is no discard, and `approvals.json` and PNG downloads are offered through the page.
- On the published page: the database rules were checked with the artifact tools (a Contributor-level write was accepted, a Viewer-level write was refused). A real click in claude.ai was not tested from here.

## Notes for the next agent
Take-over at the start of a chat:
1. `db_list` the collections `reviews` and `preferred` on the Studio page.
2. Save the documents as `{reviews:[{id,version,data}], preferred:[...]}`.
3. Run `npm run studio:sync -- <file>`, then commit `art/approvals.json` with a change record.
4. Export approved sprites if they go into the game, and turn `revisions` into tasks.
5. `npm run studio:build` and republish the Studio to the same slug (mode `replace`).
6. Only then `db_write` deletes for `remove`, with `ifVersion`.
