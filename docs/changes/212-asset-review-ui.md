# #212 – Asset Studio review UI: decisions, comments, history, filters, In Game (AR-2 of #210)

## What and why
Stage 2 of [#210](https://github.com/tom161819/Newgame/issues/210). The owner decides on each variant in the Studio itself: **Approve**, **Request revision** (with a comment), **Reject**, or **Preferred**. The owner sees each variant's history and whether the game already uses it, and can filter the library by review state. It builds on the AR-1 data model (#211, PR #217).

## Files and systems
- `studio/src/main.js`:
  - **Variant card:** decision buttons (Approve / Request revision / Reject / Back to review, by `data-status`); a comment field for this version, where a revision request without text shows an error and stores nothing; a status pill with **Outdated** when the record is for another version; an **In game** pill; a collapsible **History**, with older versions from `history[]` and comments from `comments[]`; a link to the related review issue (`review.issue`, filled in from AR-3/AR-4). Preferred (★) stays.
  - **Library filters:** All, **Waiting for my review** (the former Needs review, `data-review="pending"`), **Revision requested**, **Approved**, **In game**, each with a count. They are the same catalog and filter function with a different predicate.
  - In Game uses `gameArtSources(withApprovedArt(objectDefinitions), APPROVED_VILLAGER_ART)` from AR-1.
- `studio/src/styles.css`: pills for the new statuses and In game; wrapping decision buttons, comment, history.
- `scripts/studio-smoke.mjs`:
  - the approval step clicks "Approve";
  - a new block covers the In game filter and badges (Mill tower yes, post windmill no), a revision request refused without a comment, then stored with version and text, the Revision requested filter, the history text, and Reject.

## Implementation decisions
- Decisions are stored only in the local layer, exactly as before, until Submit Review (AR-3) sends them. Nothing is sent or committed by clicking.
- The former free-form note on change is replaced by the comment saved with a decision, so every comment is tied to a version and a status.

## Save/Load impact
None.

## Testing
- `npm test` passes; `npm run studio:smoke` passes all 16 checks, including the new review block and the 390 px phone check.

## Notes for the next agent
- AR-3 (#213): the Submit Review button and dialog read `pendingChanges` plus local `comments` to build the payload; sent decisions get `review: {issue, submissionId}`.
