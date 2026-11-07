# Studio: cat and hunting dog icons

## What and why
The last part of `g-domaci-zvirata-grafika`: icons of the cat and the hunting dog for the trade window
(Cat 30 gold, Hunting dog 120 gold) and the animal panels. The animal sprites themselves come from the Grafika chat
(store n79, `studio/src/generators/animal.js`).

## Files and systems
- `studio/src/generators/icon.js`: set `pets` (levels cat, dog) with looks `seated` (sitting in profile) and
  `heads` (heads from the front); existing palette colours only, the style guide is unchanged.
- `art/assets/ui/pet-icons/asset.json`, sprites `art/sprites/pet-icons/*` (SVG, PNG 1× and 2×).
- `tests/asset-studio-icons.test.js`: growth checks only for the slider sets; a pet icon test.

## Implementation decisions
A parallel animal generator from the Mechaniky chat was dropped in favour of the Grafika chat's one (kept on the
local branch `zvirata-mechaniky` only).

## Save/Load impact
None.

## Testing
`npm test`, `npm run studio:smoke`.

## Notes for the next agent
After the owner picks a look, the game can use `art/sprites/pet-icons/pet-icons-<look>.v1.<cat|dog>.svg` in
TradeWindow and the cat / dog panels.
