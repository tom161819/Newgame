# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the merge.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Agreed merge order

None pending. Add entries here when one pull request must wait for another.

## Active

| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| Visual polish and Asset Studio concepts (phases A–E) | Claude | `claude/visual-polish-and-asset-studio` | pending | In review: phases A–E verified | `index.html` (game layout), `src/style.css`, `src/main.js`, `src/ui/CompactHud.js`, `package.json` (fonts), `src/game/ConstructionView.js`, `src/game/ConstructionDust.js`, `src/game/TerrainRenderer.js`, `src/systems/AssetManager.js` and `src/systems/ObjectRegistry.js` (terrain `spriteVariants`), `studio/**`, `art/**`, `docs/art/**`. Necessary edit of Codex's `scripts/zoom-smoke.mjs`: it runs at 1440×900 so the 0.25× floor stays reachable with the taller map. |

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch; fully merged through #3 and #4. Delete it when the developer agrees.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- 2026-11-04 [#11](https://github.com/tom161819/Newgame/pull/11) Stage 10 Quarry placement and Iron Smelter, Save schema 14 (Codex).
- 2026-11-04 [#10](https://github.com/tom161819/Newgame/pull/10) Approved watchtower and Brazier in the game, runtime flames and light sources (Claude).
- 2026-11-04 [#9](https://github.com/tom161819/Newgame/pull/9) Stage 09 Daily Resource Statistics & Ledger, Save schema 13 (Codex).
- 2026-11-04 [#8](https://github.com/tom161819/Newgame/pull/8) Asset Studio recipes: house, oak, pine, wall, quarry (Claude).
- 2026-11-04 [#7](https://github.com/tom161819/Newgame/pull/7) Asset Studio published on GitHub Pages under `/studio/` (Claude).
- 2026-11-04 [#1](https://github.com/tom161819/Newgame/pull/1) Stages 07 Forestry and 08 Extended Zoom Out (Codex).
- 2026-11-04 [#2](https://github.com/tom161819/Newgame/pull/2) Collaboration rules, `CLAUDE.md` and this register (Claude).
- 2026-11-04 [#3](https://github.com/tom161819/Newgame/pull/3) Alpha save policy: only the current save schema loads (Claude).
- 2026-11-04 [#4](https://github.com/tom161819/Newgame/pull/4) Optional Canvas/WebGL renderer switch (Claude).
- 2026-11-04 [#5](https://github.com/tom161819/Newgame/pull/5) Asset Studio MVP (Claude). Claude keeps `studio/**`, `art/**`, `docs/art/**`, `scripts/studio-*.mjs` and `tests/asset-studio.test.js`; ask before changing them.
