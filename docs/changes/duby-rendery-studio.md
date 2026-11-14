# Oak renders in the Studio

## What and why
Owner, 15 Nov 2026: new oaks – young (small, about as tall as a person), broad, mature (2 × 2, taller and bigger than now). Forests may leave a wider gap where a 2 × 2 oak can grow; where there is no room the oak stays the middle one. Oaks may also stand alone or in twos to fours, not only in clumps.

## Files and systems
- `art/assets/trees/oak-tree/asset.json`: variants `oak-tree-render-young|broad|mature-0…270`.
- `art/sprites/oak-tree/oak-tree-render-*.v1.*`.

## Implementation decisions
- Heights: young 45 px (was 79), broad 125 px (was 104), mature 195 px on 2 × 2 (was 120 on one tile). No height squash (a tree stands upright); the usual grade.
- The anchor is the foot of the trunk (mean of the lowest 40 source rows), a little above the root tips.
- Only the summer look exists. The game's oaks also have spring, autumn and winter pictures; the renders need those before they can replace the current art.
- The 2 × 2 old oak, gaps in forests and solitary oaks are the plan item `m-duby`.

## Save/Load impact
None. Studio content only.

## Testing
- Studio and nature art tests.

## Notes for the next agent
- `/tmp/fit/import2.mjs` takes `"dir":"trees"`.
