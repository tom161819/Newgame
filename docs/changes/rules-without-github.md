# Repository rules for work without GitHub (plan task, 7 Nov 2026)

## What and why
`AGENTS.md`, `CLAUDE.md` and `docs/COORDINATION.md` still described pull requests, GitHub Issues as the task queue, MERGE-HELP, the Codex queue and GitHub Pages. Since the GitHub account was suspended on 6 Nov 2026 the work runs in Claude chats with a shared store page and a plan page. Tracked on the plan page as `o-pravidla-bez-githubu`.

## Files and systems
- `AGENTS.md`: new first part – chats and their areas, the store page as the remote, the plan page as the task register, linear `main` with cherry-pick on top of the store tip, committing named files only, checks before finishing, publishing a version to the game page, Studio publishing, provisional sprites. The project workflow, version rules and the alpha save policy stay, reworded where they named pull requests, CI or the tag workflow.
- `CLAUDE.md`: Claude notes for the chats (Czech with the owner, start of a chat, next task by itself, change records with notes for the next agent).
- `docs/COORDINATION.md`: areas table, a short Active rule, a Done section for the work without GitHub; the GitHub-era register is kept below as history.

## Implementation decisions
- The GitHub-era rules are not deleted from history: the new text says where to find them if GitHub returns.
- The plan page is the only task register, so `COORDINATION.md` no longer lists tasks.

## Save/Load impact
None.

## Testing
Documentation only. `npm test` and `npm run version:check -- --base=HEAD^1` pass.

## Notes for the next agent
- When GitHub is restored, the owner decides whether to return to pull requests; the old rules are in `AGENTS.md` at commit `3fb20b4`.
