# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the developer merges.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Merge order awaiting the developer

1. [#1](https://github.com/tom161819/Newgame/pull/1) Stages 07–08 (Codex) → `main`.
2. [#2](https://github.com/tom161819/Newgame/pull/2) Collaboration rules (this file, `AGENTS.md`, `CLAUDE.md`); independent, may merge earlier.
3. [#3](https://github.com/tom161819/Newgame/pull/3) Alpha save policy, after #1 and before Codex starts stage 09.
4. [#4](https://github.com/tom161819/Newgame/pull/4) Canvas/WebGL renderer switch, after #1.
5. [#5](https://github.com/tom161819/Newgame/pull/5) Asset Studio MVP; independent, any order.

## Active

| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| Stages 07 Forestry + 08 Extended Zoom | Codex (work), Claude (PR only) | `claude/merge-stages-07-08` = `c106cc4` from `backup/master-progress` | [#1](https://github.com/tom161819/Newgame/pull/1) | Verified, waiting for review | — (Codex work, unchanged) |
| Collaboration rules | Claude | `claude/collaboration-rules` | [#2](https://github.com/tom161819/Newgame/pull/2) | Waiting for review | `AGENTS.md` (top section), `CLAUDE.md`, `docs/COORDINATION.md` |
| Alpha save policy | Claude | `claude/alpha-save-policy` (on stages 07–08) | [#3](https://github.com/tom161819/Newgame/pull/3) | Waiting for review; merge before stage 09 | `src/systems/GameStateSerializer.js`, `src/ui/SaveLoadMenu.js`, `src/ui/GameApplication.js`, `scripts/browser-smoke.mjs`, `scripts/ci-smoke.mjs`, save-related tests, `AGENTS.md`, `README.md`, `CHANGELOG.md`, orchestrator/roadmap/release checklist |
| Canvas/WebGL renderer switch | Claude | `claude/renderer-switch` (on stages 07–08) | [#4](https://github.com/tom161819/Newgame/pull/4) | Waiting for review | `src/main.js`, `src/systems/RendererSelection.js`, `index.html`, `src/style.css`, `README.md`, `CHANGELOG.md` |
| Asset Studio MVP | Claude | `claude/asset-studio-mvp` (on `main`) | [#5](https://github.com/tom161819/Newgame/pull/5) | Waiting for review; independent of #1–#4 | `studio/**`, `art/**`, `docs/art/**`, `scripts/studio-*.mjs`, `tests/asset-studio.test.js`, `package.json` / `package-lock.json` (three.js dev dependency, studio scripts), `.gitignore` |
| Stage 09 Daily Resource Statistics & Ledger | Codex | `codex/stage-09-ledger` (to create) | — | Blocked until the alpha save policy is merged. Unpushed local work must be moved onto current `main`; expect conflicts in `GameStateSerializer.js` | — |

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch. Its content is now split into the two branches above; delete it only after both are merged.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- (none yet)
