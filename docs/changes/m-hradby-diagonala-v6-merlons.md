# m-hradby-diagonala – diagonal wall pieces v6: merlons only on the band

## What and why
The owner asked for a revision of both straight diagonal pieces (`wall-diagonal-se`, `wall-diagonal-ne`, v5) in the Studio on 15 Nov: "to cimbuří je nějaký divný, oprav to". The cause was in the generator: each side of the band got 8 merlons spread over 2.5 tiles, while the band itself is only 1.5 tiles long, so the outer merlons hung in the air beyond the wall (posts above and below the end-on piece, loose teeth left and right of the face-on piece).

## Files and systems
- `studio/src/generators/wallkit.js` (`diagonalPiece`): 4 merlons per side instead of 8, at the same fixed places (every √2/4), so a run over several tiles still shows one even row.
- `art/assets/buildings/wall-diagonal/asset.json`, `art/approvals.json`: both variants revised to v6 with `npm run art:revise`, status `review`.
- New sprites `art/sprites/wall-diagonal/wall-diagonal-{se,ne}.v6.{png,json}`; v5 files stay unchanged as history.

## Implementation decisions
- Elbows are not touched: their merlons are already clipped to the wall outline, and the owner approved most of them. The 4 elbows he rejected (nw-00, nw-01, nw-10, se-00) are a separate question.
- The game is not changed and no game version is released; the `diagonal-walls` branch still uses v5 until the owner approves v6.

## Save/Load impact
None; SAVE_VERSION unchanged.

## Testing
`node --test tests/asset-studio-buildings.test.js` and the full `npm test`; enlarged previews of v6 checked by eye (merlons sit on the band in both pieces).

## Notes for the next agent
- `art:revise` re-exports every variant of the asset: revising one variant regenerated the other variant's previous version (`wall-diagonal-ne.v5.png`) with the new code. It was restored with `git checkout`; check `git status` after each `art:revise` on a multi-variant asset.
- The Studio's assembly previews (`wall-kit-preview-diagonal*`, approved v5) draw diagonal pieces with the same function, so a re-export would change them too.
- After the owner approves v6: integrate it into the game on top of `diagonal-walls` (rebased onto 0.146.18 locally in the Mechaniky chat, not pushed) and release.
