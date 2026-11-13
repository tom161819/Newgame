# Wiki v2, část (c) (m-wiki-v2, plán 36)

## What and why
Poslední část plánu 36: stránky jednotek, zvířat, systémů a návodů a živý stav ve hře.

## Files and systems
- `src/data/wiki.js`: `WIKI_ENTRIES` (33 stránek: 8 jednotek, 6 zvířat, 14 systémů, 5 návodů), kategorie
  `guides`, `units`, `systems`.
- `src/systems/Wiki.js`: stránky z `WIKI_ENTRIES`; čísla jednotek z `military.js` (`UNIT_TYPES`, `RECRUIT`,
  `MILITARY_RULES`) a `economy.js` (`BASE_DAILY_WAGES`), zvířat z registru (`stats`, `gameplay`); nadpisy oddílů
  podle druhu stránky (`wiki.section.<part>.<kind>`, u návodů „Proč“ a „Postup“); `wikiTextCoverage` hlídá
  i nové druhy.
- `src/ui/WikiPanel.js`: oddíl „Ve tvém království“ (`live`): počet postavených, ve stavbě, bez pracovníků,
  hlášené potíže (`buildingIssueLine`), u suroviny zásoba (`inventory.count`).
- `src/i18n/cs.js`, `en.js`: názvy, texty, popisky čísel; `wiki.tiles` se skloňuje.
- `src/style.css`, `scripts/wiki-smoke.mjs`.

## Implementation decisions
- Útok jednotky: základ 6 + procenta zbraně (meč 100 %, luk 40 %) + bonus jednotky; zbroj = bonus jednotky +
  30 za zbroj. Mzda = základ vojáka 2 + příplatek jednotky (branec 1); úroveň dovednosti přidává dál.
- Krysy a psi zůstávají jako dosavadní témata; kočka má novou stránku zvířete s odkazem na krysy.
- Texty systémů podle dat: `seasons.js`, `pathWear.js`, `naturalResources.js` (FORESTRY), `minerals.js`,
  `needs.js` (nálady a rychlost), `jobs.js` (WORK_RULES 1 %/úroveň), `economy.js` (mzda +1 za 10 úrovní),
  `children.js`, `trade.js` (EXPEDITION), `nightThreats.js`, `torches.js`.

## Save/Load impact
Žádný. SAVE_VERSION zůstává 62.

## Testing
- `tests/wiki.test.js`: úplnost textů teď i pro jednotky, zvířata, systémy a návody (cs i en).
- Prohlížeč `--wiki`: živý stav skládky („Built: 1“), čísla rytíře, nové kategorie.
- `npm test`: 1294 testů prošlo.

## Notes for the next agent
- Plán 36 je hotový. Nová budova, surovina, profese nebo položka v `WIKI_ENTRIES` potřebuje texty v obou
  jazycích, jinak test neprojde.
