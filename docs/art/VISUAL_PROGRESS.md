# Visual tasks: progress

Claude's visual master tasks (V01–V03) and what they wait for. Rules: [AGENTS.md](../../AGENTS.md), register: [COORDINATION.md](../COORDINATION.md), studio workflow: [ASSET_STUDIO.md](ASSET_STUDIO.md).

| Task | State | Depends on | Notes |
|---|---|---|---|
| V01 studio part: seasonal ground, oak and pine, transition preview | Done, [#16](https://github.com/tom161819/Newgame/pull/16) | none (studio only) | Draft variants in the studio; `seasonBlend` proposes the uneven per-tile change. |
| V01 runtime: gradual season change in the game | Waiting | Codex C01 merged | Must touch `TerrainRenderer`, `TreeView`, `MapMemoryRenderer`; starts only when no Codex task holds them. Plan below. |
| V02 military buildings and equipment concepts | Waiting | Codex C06 (ids, footprints) and C07 (final building definitions) | Bowyer, swordsmith, armorer, armory, stables, equipment icons; at least 3 variants per key building. |
| V03 four soldier classes | Waiting | Codex C08 (unit registry, slots, directions) | Archer, soldier, swordsman, knight on a horse; builds on the `figure` recipe and tilted parts. |

The C01–C08 definitions are in Codex's own master prompt, which is not in the repository; Claude checks GitHub branches, pull requests and `docs/COORDINATION.md` before starting each waiting task.

## V01 runtime plan (after C01)

- Seasons keep their current rules (`SeasonSystem`); only the display blends. On a season change the renderer keeps the previous season as `from`, the new one as `to`, and a display progress from the season's elapsed time over its first 15 % (game time, so Save/Load and background catch-up give the same picture).
- Per tile: `seasonBlend(progress, x, y)` (stable hash + slow noise). Chunks redraw at most a few times per second while a transition runs and only when visible; no per-tile timers, no full-map passes per frame.
- Trees take the season of their tile's blend (above 0.5 → new look). Fog of War: unexplored stays black; remembered tiles keep the season they were seen in (Map Memory already stores it).
- Seasons OFF: summer, no animation. Turning seasons on blends from summer over the same window.
- New art (seasonal grass, snow, seasonal trees) replaces the procedural tints only after the developer approves the studio variants.
