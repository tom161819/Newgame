# Studio: animation key frames for children's games and fishing; revision take-over

## What and why
The remaining animation items of g-deti-naves-grafika and g-rybarstvi:
- children: running, tagging, hoop and stick, kicking a ball, a swing, throwing a snowball, rolling a snowman, jumping into hay;
- fishing, man and woman: casting, waiting with the line in the water, pulling out a fish.

The owner's Studio decisions of 7 Nov evening are taken over:
- approved: deer, roe, fox, hare, night icons (badges), torch brackets;
- revision requested: boar, horse, roof fire.

## Files and systems
- studio/src/generators/figure.js: new `action` parameter.
  - Hands and feet are placed at target points with `limbTo` cylinders.
  - The figure is lifted for jumps.
  - Each action draws its props (ball, hoop, swing, snowball, hay, rod line and fish). They are marked overhang.
- art/assets/units/child: new variants.
- art/assets/units/fishing (new): the fisher's key frames. They live in their own asset, because the profession test expects exactly one man and one woman per profession.
- tests/asset-studio-units.test.js: `fishing` is excluded from the profession list.
- art/approvals.json.

## Implementation decisions
- Action variants use `facing: 0`, so they are stills without a walk sheet.
- Existing figures are unchanged: their sprite hashes are identical.

## Save/Load impact
None.

## Testing
- npm test passes (992 tests).
- validate.mjs passes.
- The sprites were checked by eye.

## Notes for the next agent
The game will need key frames for the other facings too. The `action` parameter combines with `facing`.
