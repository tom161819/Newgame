# Studio – animace rybáře (g-animace-rybar)

- Generátor postav: 12 póz smyčky rybaření (nahození ve 3 fázích, sezení na pařezu s klidem, zaškubání,
  záběr s ohnutým prutem, namotávání, vytažení ryby a uložení do košíku). Košík stojí vždy vedle rybáře.
- Nové varianty `fishing-male-loop` a `fishing-female-loop` s definicí klipů (`cast`, `sit-idle`, `twitch`,
  `bite`, `reel`, `store`) a smyčky, 5 snímků/s.
- Studio: záložka **Animation** – přehrává celou smyčku nebo jednotlivé klipy v 8 směrech.
- Export schválené smyčky: `<varianta>.v<N>.anim.png` (8 řádků směrů × pózy, společná kotva u nohou) a v metadatech
  `anim` (sloupce, klipy jako indexy sloupců, smyčka, fps) – podklad pro m-animace-rybar.
- Asset fishing má footprint 2×2, aby se prut a splávek nad vodou vešly do kontroly přesahu (kotva zůstává u nohou).
- Smoke Studia upravený po úklidu 8. 11. (strážní věž má jen jednu variantu, testy schvalování běží na smyčce rybáře).

## What and why
Full fishing animation loop for plan g-animace-rybar (approved 8 Nov).

## Files and systems
studio/src/generators/figure.js (fishing poses, FISH_ROD), studio/src/main.js (Animation tab, anim sheet export), scripts/studio-export.mjs, art/assets/units/fishing, art/sprites/fishing/*.anim.png.

## Implementation decisions
One sheet per variant: 8 facing rows × 12 poses, shared anchor; meta.anim lists clips as column indices. Fishing footprint 2×2 so rod and float fit the overhang check.

## Save/Load impact
None.

## Testing
Unit test for anim sheets, studio smoke, npm test.

## Notes for the next agent
Game playback: m-animace-rybar reads meta.anim (fps 5, loop order).
