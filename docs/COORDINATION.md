# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the merge.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Agreed merge order

None pending. Add entries here when one pull request must wait for another.

## Active

| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| Approved tower and brazier in the game | Claude | `claude/approved-tower-brazier` | — | In progress | `src/data/objects/buildings.js` (tower), `src/data/objects/lighting.js`, `src/data/objects/index.js`, `src/data/experience.js` (brazier XP), `src/systems/ObjectRegistry.js` (lights validation), `src/systems/SpriteViews.js` (pixel hit test), `src/systems/LightSourceSystem.js`, `src/game/LitBuildingView.js`, `src/game/GameScene.js` (3 lines), `public/assets/buildings/{tower,brazier}/`, related tests |
| Stage10 Quarry Placement & Iron Smelter | Codex | `codex/stage-10-smelter` from main97b3381 | Not yet created; API policy unchanged | PhaseA/B verified:434 tests/build/targeted native furnace and Save14. Current main03a3de3/Claude PR10 integrated with both additions retained; 437/437 combined tests and Pages build pass; full native gate pending. User now authorizes resolving routine conflicts autonomously; no conflict confirmation required. Visual Polish is Claude-owned by user instruction. | New smelting definitions/assets/tests; data jobs/workplaces/recipes/economy; existing production/logistics/storage/skill/validation/panel; smokes and own progress/docs. Necessary shared edits: objects/index registry and experience reward table, preserving Claude graphics/brazier changes. Avoid Studio/art, SpriteViews/renderer, tower definition and GameScene graphics. |

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch; fully merged through #3 and #4. Delete it when the developer agrees.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- 2026-11-04 [#9](https://github.com/tom161819/Newgame/pull/9) Stage 09 Daily Resource Statistics & Ledger, Save schema 13 (Codex).
- 2026-11-04 [#8](https://github.com/tom161819/Newgame/pull/8) Asset Studio recipes: house, oak, pine, wall, quarry (Claude).
- 2026-11-04 [#7](https://github.com/tom161819/Newgame/pull/7) Asset Studio published on GitHub Pages under `/studio/` (Claude).
- 2026-11-04 [#1](https://github.com/tom161819/Newgame/pull/1) Stages 07 Forestry and 08 Extended Zoom Out (Codex).
- 2026-11-04 [#2](https://github.com/tom161819/Newgame/pull/2) Collaboration rules, `CLAUDE.md` and this register (Claude).
- 2026-11-04 [#3](https://github.com/tom161819/Newgame/pull/3) Alpha save policy: only the current save schema loads (Claude).
- 2026-11-04 [#4](https://github.com/tom161819/Newgame/pull/4) Optional Canvas/WebGL renderer switch (Claude).
- 2026-11-04 [#5](https://github.com/tom161819/Newgame/pull/5) Asset Studio MVP (Claude). Claude keeps `studio/**`, `art/**`, `docs/art/**`, `scripts/studio-*.mjs` and `tests/asset-studio.test.js`; ask before changing them.
