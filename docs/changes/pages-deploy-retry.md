# Pages deploy: retries instead of a longer timeout

## What and why
#203 raised the `deploy-pages` timeout to 30 minutes after deployments of verified main commits were cancelled with `Timeout reached, aborting!`. The next run showed the input has no effect: the action stops after its hard 10-minute limit anyway. Run 42259519190 for d7ea2cb was cancelled after exactly 10 minutes, this time still in `deployment_queued`. The build artifact was fine each time, and re-running the deploy job succeeded (2dc39c4). So the deploy job now retries by itself.

## Files and systems
- `.github/workflows/pages.yml`, deploy job: `Publish website` (`continue-on-error`), then `retry 1` and `retry 2`, each running only if the previous attempt failed. The last one has no `continue-on-error`, so the job still fails after three failed attempts. The environment URL takes the output of whichever attempt succeeded. The ineffective `timeout` input is removed.
- This record replaces `docs/changes/pages-deploy-timeout.md` from #203, whose explanation was wrong. The workflow comment says what really happens.

## Implementation decisions
- Each attempt deploys the same uploaded artifact, so a retry cannot publish anything different from the checked build.
- The concurrency group still cancels the whole run when a newer main commit arrives.
- Job and run names stay unchanged for the release gate (`pagesRunEvidence` reads the run's conclusion), which still means "published".

## Save/Load impact
None.

## Testing
- The YAML parses; `npm run version:check` passes.
- The real check is this PR's own Pages run after the merge. The failed d7ea2cb run was re-run manually meanwhile.

## Notes for the next agent
- If all three attempts fail repeatedly, check githubstatus for Pages incidents and the artifact size (about 140 MB) before changing anything else.
