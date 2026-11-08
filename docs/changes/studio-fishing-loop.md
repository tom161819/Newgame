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
