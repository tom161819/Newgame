# E3 · Tutorial with an arrow (report 0.48.0)

## What and why
Plan task m-e3-tutorial-sipka. The report: the Getting started window listed 8 buildings at once over a blocked map, in
an order the starting stores could not pay. The tutorial now leads one step at a time with a bubble and an arrow.

## Files and systems
- `src/data/tutorial.js`: 10 steps (king, builder, granary, farm, hunting lodge, lumberjack hut, stone, house, storage,
  speed) with how each is checked.
- `src/systems/Tutorial.js`: `tutorialProgress(scene,{seen,skipped})` derived from the world (planned / finished
  buildings, a Builder, marked rocks or a Quarry, game speed); no save field.
- `src/ui/TutorialGuide.js`: bubble (`#tutorial-bubble`: step count, one sentence, Show me / Next / Skip, ×), arrow
  (`#tutorial-arrow`) at a DOM target or a world point (edge arrow when off screen, from above for the bottom bar), ✓
  after a step; Settings switch `#settings-tutorial` (`newgame.tutorial`), speed step remembered in the browser.
- `GameApplication`: a New Game from the setup starts the tutorial instead of opening Getting started (it opens the
  window only when the tutorial is off); a loaded game resumes it while it is on and not finished.
- `src/data/gettingStarted.js`: the checklist under "?" follows the tutorial order.
- i18n `tutorial.*`, CSS for bubble, arrow and tick (reduced motion: no animation).

## Implementation decisions
- Progress from the world instead of a saved step: a loaded game resumes correctly and older saves need nothing new.
- While placing the step's building there is no arrow; the bubble says to click a green spot.
- Smokes switch the tutorial off by default (init script) because 33 of them expect the Getting started window; the
  tutorial has its own smoke.

## Save/Load impact
None.

## Testing
`tests/tutorial.test.js`, `tests/getting-started.test.js`; browser smoke `--tutorial` (every click guided by the arrow,
Skip, Settings off/on) and `--getting-started`.

## Notes for the next agent
- Arrow and bubble look is provisional CSS; the designed look comes from g-e3-tutorial-vzhled (UI Lab).

## Tips (plan m-e3-tipy)
- `src/data/tips.js`: one-time tips (each shown once, remembered in `newgame.tipsSeen`) for moments after the tutorial,
  shown in the same bubble with an arrow by `TutorialGuide` (Got it / No more tips).
- Settings switch `#settings-tips` (`newgame.tips`); switching it off closes an open tip. Smokes switch tips off by
  default; the tutorial smoke checks one tip.
