# Knight: several attacks, shield block and guard

## What and why
Owner 20 Nov 2026: "rytíř vypadá dobře, můžeš vylepšit animace, udělat víc druhů útoků, obranu, nastavení štítu ať to
vypadá víc jako boj a ne jenom jednotvárné sekání".

## Files and systems
- `scripts/blender/render-soldier.py --combat` (sword-and-shield figures): new columns `attack2` overhead chop, `attack3`
  thrust, `attack4` shield bash (6 frames each, with a lunge) and `block` (5 frames: shield up in front of the face, sword
  cocked back, knees bent).
- `scripts/blender/pack-soldier-sheets.py`: wider rows when 12 per row would pass 4096 px (the Knight: 19 per row,
  3914 × 4080); writes `attacks` (all attack moves) and `block` into the look.
- `src/data/objects/approvedArt.js` `combatColumn`: a figure with `attacks` and `block` plays one move per slot (one
  attack length): 60 % a random attack, 30 % the block, 10 % a held guard (block frame 1); slot 0 is always a strike.
  Moves come from a per-view seed (`HumanView.combatSeed`) and the slot, so fighters next to each other are not in step.
  Figures without them loop their one attack as before.
- `public/assets/characters/villagers/{army,enemy}-knight.v4.walk.png` (47 columns); `soldierAnimArt.js` knight lines.
- `tests/soldier-anim.test.js`: column count with the extra moves, the mix, the seed, the old loop.

## Implementation decisions
- Purely visual: hits and damage are unchanged; the block is not tied to an incoming blow.
- The fifth block frame was rendered with the shield at 70 % (the script now says 60 %); not visible in play.

## Save/Load impact
None.

## Testing
- `npm test`.
- Browser (test map): four Knights against four enemy Knights; overhead chops, thrusts and raised shields mixed.

## Notes for the next agent
- Other figures get the same with `--combat` once they have a shield; spear/bow figures need their own move sets.
