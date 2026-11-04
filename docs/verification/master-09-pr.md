Title: Draft: Stage 09 resource ledger and daily economy details

Base: main
Head: codex/stage-09-ledger
Status: draft request prepared; a GitHub PR has not been created yet.

## Dependencies and merge order

Built on `claude/alpha-save-policy` cf4c542, as explicitly permitted by the developer.
Merge #1 → #2 → #3 before this PR. The branch includes #1/#3 until those land;
their commits are dependencies, not changes authored again by this task.
Only the developer merges or publishes main. This task creates no release/tag.

## Purpose and current progress

Track actual resource production/acquisition and irreversible consumption once,
keeping reservations and physical transfers out of income/expenses. Show the last
completed day's net changes and source details, with30-day history and current-
schema Save13 restoration. This is in progress, not ready to merge.

Reviewed original WIP is preserved separately as `codex/stage-09-ledger-wip`
feb19d2; useful foundation files are ported individually. No blind WIP merge.

## Validation so far

- ALPHA base:383 tests and build:pages passed.
- Adapted foundation:387 tests and build:pages passed.
- Full final economic/browser/archive gate remains pending.
- GitHub website verifies PRs1–5 OPEN, main still27bb4f1.

## Save/Load and files held

The persisted journal will use SAVE_VERSION13. No older-save migrations. Preserve
current-schema resource/task/reservation checks and incompatible-slot protection.
Held files are listed in `docs/verification/master-09.md`; necessary overlap with
#3 is serializer/browser smoke above its actual policy implementation. English
Unreleased changes/progress will be updated. No existing coordination file exists
on this base; the developer instructed not to invent one. Do not modify Claude's
Studio/art, renderer/main entry or save menu/application files.

## Delivery limitation

Git fetch/push and public github.com pages work. Both REST and GraphQL at
api.github.com are denied by the managed network policy, so an automatic draft PR
cannot be created here yet. This file is the reviewable draft body, not a claim
that a PR exists. When supported API access is available, open a draft from this
branch into main using this body, then update its actual URL/status.
