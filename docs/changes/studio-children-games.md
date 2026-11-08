# Studio – animace dětských her (g-deti-naves-grafika)

- Generátor postav: druhé snímky her (krok běhu a honěné zrcadlením, obruč, nápřah ke kopu, zhoupnutí dozadu,
  dohození koule, další postrčení sněhové koule, dopad do sena).
- 8 nových variant `child-play-*` (honěná – honí / chytá, obruč, míč, houpačka, koulování, sněhulák, skok do sena),
  každá s jedním klipem a smyčkou 4 snímky/s, náhled v záložce Animation, export `.anim.png` po schválení.

## What and why
Children's game animations for plan g-deti-naves-grafika (for review).

## Files and systems
studio/src/generators/figure.js (second poses), art/assets/units/child (child-play-* variants).

## Implementation decisions
Two-frame loops; running/tag second frame is the mirrored first pose.

## Save/Load impact
None.

## Testing
node --test tests/asset-studio*.test.js.

## Notes for the next agent
After approval export .anim.png like the fishing loop.
