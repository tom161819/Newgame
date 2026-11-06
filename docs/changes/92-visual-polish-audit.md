# #92 – Visual fallbacks audit and profession look concepts

## What and why
[#92](https://github.com/tom161819/Newgame/issues/92) asks for an exact list of the placeholder looks still used for professions and buildings, and for themed designs through the Asset Studio, without unapproved art in the game. This change adds the audit (`docs/audits/92-visual-fallbacks.md`) and concepts for the six professions without their own look. The building concepts follow separately.

## Files and systems
- `docs/audits/92-visual-fallbacks.md`: the professions and buildings that still use fallbacks, and why.
- `studio/src/generators/figure.js`: new tools `tongs`, `mallet`, `stave` and `bucket` (cases in `tool()` only); `sword` is now listed among the documented tool values. Existing specs produce the same models, and their sprites are unchanged.
- `art/assets/units/{smelter-operator,swordsmith-worker,armorer-worker,bowyer-worker,wheelwright,stablehand}/asset.json`, each with a man and a woman. Ids with `-worker` avoid clashing with the building assets `swordsmith`, `armorer` and `bowyer`.
- `art/sprites/<id>/*.v1.{png,json}` (exported) and `art/approvals.json` (all `review`).
- `tests/asset-studio-units.test.js`: the profession list includes the six new figures, with the same checks (a man and a woman, human scale, one tile, a visible tool).

## Implementation decisions
- Colours and tools differ from the existing trades, so each one reads at game scale: Smelter red kerchief and tongs, Swordsmith blue and sword, Armorer grey hood and hammer, Bowyer ochre with apron and stave, Wheelwright brown with mallet, Stablehand green with brimmed hat and bucket.
- No game change: `PROFESSION_LOOKS` stays as it is until the owner approves.
- Women soldiers: the approved `military-soldier-woman` exists, but mapping it changes how soldiers look in the game, so it is listed for the owner's decision.

## Save/Load impact
None.

## Testing
- `npm test` passes, including the studio unit tests (the new figures are valid and every existing sprite is unchanged).
- The exported sprites were inspected visually (a preview strip is in the PR).
- `npm run studio:smoke` passes.

## Notes for the next agent
- After approval:
  1. export the eight walking directions (`studio:export` writes facings for approved units);
  2. copy them into `public/assets/characters/villagers/`;
  3. add the entries to `APPROVED_VILLAGER_ART` and `PROFESSION_LOOKS`.
- Building concepts for #92: barracks, wheelwright workshop, iron mine.
