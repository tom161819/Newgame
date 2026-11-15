# Start guide, Getting started tasks, tips and WebGL by default (0.138.5)

## What and why
Owner 15 Nov 2026: cancel the tutorial; at the start a big arrow at the Wiki ("information about the game and mechanics", gone when the Wiki opens), then an arrow at Getting started saying that a click on a task opens its place; then tips in a set order (Alt+Enter, K, Shift and more). Getting started gets his task list and disappears when all are done. Tips, tasks and their order and texts are edited on a new Studio page and sent for processing. WebGL by default.

## Files and systems
- `src/data/guide.js` (new): `GUIDE` {intro, tasks, tips, tipGap}, `guideText`. Single source for the three lists.
- `src/data/tutorial.js`: `TUTORIAL_STEPS` = the two intro steps; `TUTORIAL_PATH_BUILDINGS` = the build tasks. `src/systems/Tutorial.js`: checks `wiki` and `ack`.
- `src/ui/TutorialGuide.js`: intro once per browser (`newgame.guide.intro`), big arrow class, the Getting started arrow beside the panel, texts from the guide, 'sequence' tips after the intro with `tipGap` seconds of game time between them.
- `src/data/tips.js`: `TIPS` from the guide, `TIP_GAP_SECONDS`.
- `src/data/gettingStarted.js`, `src/systems/GettingStarted.js`: task kinds build/job/king/water, `waterFound`, latched flags; `src/ui/GettingStartedPanel.js`: guide texts, task click by kind, a 1 s refresh, hidden when all done.
- `src/systems/RendererSelection.js`, `index.html`: WebGL default.
- Studio: `studio/guide.html`, `studio/src/guide/*`, `studio/src/lib/guideDraft.js`, nav links, vite input. `scripts/guide-sync.mjs` (`npm run guide:sync`), AGENTS.md rule 12 („převzít průvodce“).

## Implementation decisions
- The tutorial machinery stays and runs the two intro steps; the old stone/quarry arrow code remains for reuse.
- King/water/job tasks also count as done when a later build task is finished, so no save field is needed (no SAVE_VERSION change). The selected king and found water latch for the session in `scene.guideFlags`.
- Event tips keep their triggers; only their text is editable (empty text = the i18n text).

## Save/Load impact
None.

## Testing
New and rewritten tests: getting-started, tutorial (intro, sequence tips), guide-studio (draft helpers, guide:sync output imports), renderer-selection. Browser: new game shows the big Wiki arrow, opening the Wiki moves to the panel arrow, "Got it" ends it; a task click opens the Population list / selects the king and ticks the king task; WebGL renderer. Studio Guide page: edit keeps focus, reorder, add tip, Send.

## Notes for the next agent
The old tutorial tests about its 15 steps were replaced by tests of the start guide. The CI browser smoke scenario `--tutorial` is stale (non-blocking on Pages).
