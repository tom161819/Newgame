# Wiki v2, část (a) (m-wiki-v2, plán 36)

## What and why
Vlastník chtěl mnohem podrobnější Wiki s návaznostmi: co a proč objekt dělá. Část (a) přináší novou stavbu
stránek, výrobní řetězce z dat, stránku Všechny řetězce, tlačítko „?“ v oknech a texty pro chlebový řetězec
jako vzor. Části (b) a (c) doplní texty ostatních budov, surovin a profesí a nové oddíly (jednotky, zvířata,
systémy, návody, živý stav).

## Files and systems
- `src/systems/Wiki.js`: `sections` u každé stránky (why, how, chain, numbers, tips, unlock), `wikiGraph`,
  `chainInto`, `chainFrom`, `buildingChain`, `resourceChain`, `allChains`, `wikiTextCoverage`, hledání v textu.
- `src/data/wiki.js`: `WIKI_TEXT_PARTS`, `wikiTextKey`, `WIKI_SINKS`, kategorie `chains`.
- `src/ui/WikiPanel.js`: kreslení oddílů a řetězců, `attachWikiHelp` a `WIKI_HELP_DIALOGS` (tlačítko „?“).
- `src/style.css`: styly oddílů, kroků řetězce a tlačítka „?“.
- `src/i18n/en.js`, `cs.js`: názvy oddílů a údajů, konce řetězců, texty chlebového řetězce (11 stránek).
- `scripts/wiki-smoke.mjs`, `tests/wiki.test.js`.

## Implementation decisions
- Řetězce se čtou z dat budov (`productionChains.js`: recepty, plodiny, těžba, sběr) plus palivo (`fuel`) a
  výstroj kasáren (`kit`). Konce řetězců: jídlo → „Jedí lidé“, stavební materiál → „Na stavby“, vozíky a vozy
  → „Vozí nosiči“. U vstupu se jde po prvním vstupu dílny (jako dosavadní `chainTo`), všechny vstupy budovy
  jsou vidět na její stránce.
- Ručně psané části jsou v i18n pod `wiki.text.<druh>.<id>.<why|how|tips>`. Když chybí, „K čemu je“ ukáže
  popis z dat; ostatní ruční oddíly se nezobrazí. Texty odpovídají kódu (statek 15 políček a 200 obilí/mouky,
  mlýn 4 → 2 za 30 s, pekárna 1 → 6 za 30 s, vlastní sklad 20, zimní růst 0, krysy a kočky).
- Tlačítko „?“ se vkládá do hlavičky oken a skryje se, když okno nemá stránku (např. král v okně jednotky).
- Výchozí stránka Wiki je teď Všechny řetězce.

## Save/Load impact
Žádný. SAVE_VERSION zůstává 62.

## Testing
- `tests/wiki.test.js`: pořadí oddílů, řetězce pekárny a věže, stránka Všechny řetězce, hledání v textu,
  texty chlebového řetězce v cs i en, texty jen pro existující stránky, dialogy tlačítka „?“ existují.
- Prohlížeč `--wiki`: „?“ ve skladu otevře stránku startovní skládky, Všechny řetězce → Pekárna se všemi oddíly.
- `npm test`: 1294 testů prošlo.

## Notes for the next agent
- `wikiTextCoverage(pages, has)` vrací chybějící klíče; v části (c) z toho udělat povinný test (vše vyplněno).
- Části (b) a (c) podle plánu 36. Texty piš podle kódu, ne podle popisů.
