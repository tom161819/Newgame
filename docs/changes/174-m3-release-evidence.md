# #174 – Release gate reads Pages evidence from the GitHub API; M3 stages recorded

## What and why
This prepares the first release under the #174 scheme, the M3 milestone `0.4.0` (shown `v0.04.00`). The release gate verified Pages by scraping the public HTML run page. That page is blocked in the agents' cloud environment (proxy 403). Its "pushed <sha> main Status Success" text also changes after a failed-job re-run, which made `verify-published-release` fail for the re-run of the #170 deployment. The GitHub REST API run object is reachable and structured, so the gate now uses it. The M3 stages 11 and 12 were merged but still recorded as REVIEW/PENDING; the gate requires DONE with commits.

## Files and systems
- `scripts/release-gate-lib.mjs` `pagesRunEvidence()` (new). `scripts/release-gate.mjs` fetches `api.github.com/repos/tom161819/Newgame/actions/runs/<id>` with curl, used by both `release:gate` and `release:verify`.
- `docs/UPGRADE_PROGRESS.md` rows 11 and 12 are DONE with their merge commits and PRs.
- `tests/release-gate.test.js`.

## Implementation decisions
- Required: the Pages workflow (`.github/workflows/pages.yml`), a push to `main`, this repository, the exact deployed SHA, and `completed`/`success`. Any run attempt counts, because a successful re-run of failed jobs deploys the same push.
- The old HTML `pagesEvidence()` stays exported (and tested) for reference, but the gate no longer calls it.
- Stage 12 was merged in five parts; its row cites the final part (`a9aa16f`, Horse Wagon) as the implementation commit and links all parts.

## Save/Load impact
None.

## Testing
- New `pagesRunEvidence` test: accepts a successful re-run; rejects another run, SHA, branch, event, workflow, conclusion, status or repository.
- Checked live against the real Pages run 42193129545 (`84f23d5`, success): accepted. A wrong SHA is rejected.
- `npm test`, `npm run changelog:validate`, `npm run version:check`.

## Notes for the next agent
- `release:verify` still downloads the published catalog from github.io, which is blocked in the cloud environment. The `verify-published-release` workflow runs it on GitHub's runners after each Pages deployment.
- Next: when this is deployed, run `npm run release:gate -- M3 --pages-run=<id> --pages-commit=<sha>`. Then `npm run release:prepare -- minor --milestone --title "M3: …"`, PR, merge, tag `v0.4.0` on the release source commit, `npm run archive:build`, archive PR.
