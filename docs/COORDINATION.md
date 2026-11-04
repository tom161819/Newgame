# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the merge.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Agreed merge order

None pending. Add entries here when one pull request must wait for another.

## Active

| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| Asset Studio recipes: house, oak, pine, wall, quarry | Claude | `claude/studio-recipes` | — | In progress | `studio/**`, `art/**`, `docs/art/**`, `tests/asset-studio.test.js` |
| Stage 09 Daily Resource Statistics & Ledger | Codex | `codex/stage-09-ledger` (ALPHA base, normal merge of current main69e5e57) | Prepared body: [report](verification/master-09-pr.md); creation blocked by network API policy | Implementation verified:419/419 tests, full browser, Pages build, archive/catalog/71-URL HTTP checks passed on integrated main. Save13, no migrations. HOLD for developer review per explicit handoff; no self-merge/release. WIP preserved in codex/stage-09-ledger-wip feb19d2. Stage10 waits for merge or actual PR09. | Ledger data/system/validator/tests; GameScene/buildings/inventory; GameTime/serializer/loader; existing production/food/storage/treasure/wages/construction/drop/workplace source owners; InventoryBar/new tooltip/CSS; browser/CI/forestry/mineral/ledger smokes and helper; Unreleased/progress/verification and this task row. No Studio/art/renderer/main-entry/save-menu changes. |

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch; fully merged through #3 and #4. Delete it when the developer agrees.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- 2026-11-04 [#7](https://github.com/tom161819/Newgame/pull/7) Asset Studio published on GitHub Pages under `/studio/` (Claude).
- 2026-11-04 [#1](https://github.com/tom161819/Newgame/pull/1) Stages 07 Forestry and 08 Extended Zoom Out (Codex).
- 2026-11-04 [#2](https://github.com/tom161819/Newgame/pull/2) Collaboration rules, `CLAUDE.md` and this register (Claude).
- 2026-11-04 [#3](https://github.com/tom161819/Newgame/pull/3) Alpha save policy: only the current save schema loads (Claude).
- 2026-11-04 [#4](https://github.com/tom161819/Newgame/pull/4) Optional Canvas/WebGL renderer switch (Claude).
- 2026-11-04 [#5](https://github.com/tom161819/Newgame/pull/5) Asset Studio MVP (Claude). Claude keeps `studio/**`, `art/**`, `docs/art/**`, `scripts/studio-*.mjs` and `tests/asset-studio.test.js`; ask before changing them.
