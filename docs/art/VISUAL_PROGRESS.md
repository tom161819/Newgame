# Visual tasks: progress

Claude's visual master tasks (V01–V03) and what they wait for. Rules: [AGENTS.md](../../AGENTS.md), register: [COORDINATION.md](../COORDINATION.md), studio workflow: [ASSET_STUDIO.md](ASSET_STUDIO.md).

| Task | State | Depends on | Notes |
|---|---|---|---|
| V01 studio part: seasonal ground, oak and pine, transition preview | Done, [#16](https://github.com/tom161819/Newgame/pull/16) | none (studio only) | Draft variants in the studio; `seasonBlend` proposes the uneven per-tile change. |
| V01 runtime: gradual season change in the game | Done, [#19](https://github.com/tom161819/Newgame/pull/19) (started before C01 at the developer's request) | — | `src/game/SeasonTransition.js`; terrain tint and live trees blend per tile over the first 20 % of a season. |
| V02 military buildings and equipment concepts | Draft concepts done, [#20](https://github.com/tom161819/Newgame/pull/20) (started before C06/C07 at the developer's request) | Codex C06/C07 to confirm ids and footprints | Bowyer, swordsmith, armorer (2×2), armory (3×3), stables (5×5), 3 variants each; bow, sword, armour and horse items. `plannedGameObjectId` until the buildings exist. |
| V03 four soldier classes | Draft concepts done, [#20](https://github.com/tom161819/Newgame/pull/20) | Codex C08 for the unit registry, slots and directions | Archer, soldier, swordsman, mounted knight, 3 variants each incl. women; 8-direction reference sheet. Animations not made yet. |

The C01–C08 definitions are in Codex's own master prompt, which is not in the repository; Claude checks GitHub branches, pull requests and `docs/COORDINATION.md` before starting each waiting task.

## V01 runtime (implemented)

- Seasons keep their current rules (`SeasonSystem`); only the display blends. `transitionState` derives `from`, `to` and progress from game time over the first 20 % of a season (one game day), so Save/Load and background catch-up give the same picture and nothing new is saved. No transition in the first season of a game.
- Per tile: `seasonBlend(progress, x, y)` (stable hash + slow noise), shared with the studio preview. Progress moves in 24 steps and each tile in 8 levels; a step queues the 10 × 10 chunks whose tiles changed level; up to 10 repaint per frame while playing (all at once while paused), each in one pass so the picture equals a fresh draw. Measured in headless Chromium at 0.25× (whole map): one unbudgeted step cost 80–100 ms, the per-frame budget keeps it to roughly a tenth. No per-tile timers, no per-frame full-map work.
- Live trees take the season of their tile's blend (from half way). Fog of War: only visible tiles blend; unexplored stays black and remembered tiles and trees keep the season they were seen in.
- Seasons OFF: summer, no animation. Turning seasons back on inside the window continues the blend from the previous season.
- New art (seasonal grass, snow, seasonal trees) replaces the procedural tints only after the developer approves the studio variants.
