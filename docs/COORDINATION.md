# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the merge.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Agreed merge order

None pending. Add entries here when one pull request must wait for another.

## Active

| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| Approved tower and brazier in the game | Claude | `claude/approved-tower-brazier` | — | In progress | `src/data/objects/buildings.js` (tower), `src/data/objects/lighting.js`, `src/data/objects/index.js`, `src/data/experience.js` (brazier XP), `src/systems/ObjectRegistry.js` (lights validation), `src/systems/SpriteViews.js` (pixel hit test), `src/systems/LightSourceSystem.js`, `src/game/LitBuildingView.js`, `src/game/GameScene.js` (3 lines), `public/assets/buildings/{tower,brazier}/`, related tests |
| M2 release and standing automatic milestone publication | Codex | `codex/m2-release` (main7012635 + verified Stage10 follow-up98b91de) | Not created; GitHub API network prerequisite being prepared | User authorizes M2 now and automatic M1–M5 releases after gates, with no further prompt. Preserve all tests, archives and Claude graphics. | AGENTS and release/queue/progress docs, version/changelog/release archive metadata; verified final Quarry fix/test. Network draft adds only api.github.com and tom161819.github.io, activation pending. |

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch; fully merged through #3 and #4. Delete it when the developer agrees.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- 2026-11-04 [#11](https://github.com/tom161819/Newgame/pull/11) Stage10 Smelter, physical Ore/fuel production and autonomous conflict rule (Codex), merged main7012635; final neighbouring-Quarry validation follow-up remains in the active row.
- 2026-11-04 [#9](https://github.com/tom161819/Newgame/pull/9) Stage 09 Daily Resource Statistics & Ledger, Save schema 13 (Codex).
- 2026-11-04 [#8](https://github.com/tom161819/Newgame/pull/8) Asset Studio recipes: house, oak, pine, wall, quarry (Claude).
- 2026-11-04 [#7](https://github.com/tom161819/Newgame/pull/7) Asset Studio published on GitHub Pages under `/studio/` (Claude).
- 2026-11-04 [#1](https://github.com/tom161819/Newgame/pull/1) Stages 07 Forestry and 08 Extended Zoom Out (Codex).
- 2026-11-04 [#2](https://github.com/tom161819/Newgame/pull/2) Collaboration rules, `CLAUDE.md` and this register (Claude).
- 2026-11-04 [#3](https://github.com/tom161819/Newgame/pull/3) Alpha save policy: only the current save schema loads (Claude).
- 2026-11-04 [#4](https://github.com/tom161819/Newgame/pull/4) Optional Canvas/WebGL renderer switch (Claude).
- 2026-11-04 [#5](https://github.com/tom161819/Newgame/pull/5) Asset Studio MVP (Claude). Claude keeps `studio/**`, `art/**`, `docs/art/**`, `scripts/studio-*.mjs` and `tests/asset-studio.test.js`; ask before changing them.
