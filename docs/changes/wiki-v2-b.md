# Wiki v2, část (b) (m-wiki-v2, plán 36)

## What and why
Druhá část plánu 36: ručně psané oddíly „K čemu je“, „Jak to funguje“ a „Tipy a časté potíže“ pro všechny
zbývající budovy (32), suroviny (14) a profese (13), česky i anglicky.

## Files and systems
- `src/i18n/cs.js`, `src/i18n/en.js`: klíče `wiki.text.<budova|surovina|profese>.<id>.<why|how|tips>`.
- `tests/wiki.test.js`: úplnost je teď povinná – každá stránka budovy, suroviny a profese musí mít všechny
  tři texty v obou jazycích.

## Implementation decisions
- Texty jsou psané podle dat a kódu, ne podle popisů: noční hrozby (`nightThreats.js`: vlci se drží mimo
  světlo, utečou před 3 vojáky do 4 políček, zloději cílí sklady a hrad bez světla do 6 políček, plamen do
  2 políček od dřevěné budovy může zapálit), pochodně (`torches.js`: zásoba 20, smolař doplní do poledne,
  tmavý dům −30 bezpečí), světlo věže dává dohled jen s někým do 3 políček (`DayNightSystem`), rybaření
  (`fishing.js`), lov 34 políček (`workplaces.js`), lom s 1 / 2 / 3 horníky = 20 / 50 / 100 %, stavitelé bez
  dílny 50 %, stáje (`stables.js`), vojsko (`military.js`), mzdy (`economy.js`).
- Počáteční posádka u hradu je jen se zapnutou volbou v nové hře (výchozí vypnuto) – text to tak říká.

## Save/Load impact
Žádný. SAVE_VERSION zůstává 62.

## Testing
- `tests/wiki.test.js`: žádný chybějící text u budov, surovin a profesí (cs i en).
- Prohlížeč `--wiki` prošel; `npm test`: 1294 testů prošlo.

## Notes for the next agent
- Nesoulad v datech: kolářská dílna má u kolečka v receptu 300 s, popis budovy říká 30 s (vůz 90 s sedí).
  Wiki ukazuje číslo z receptu. Neměnil jsem; rozhodne vlastník.
- Část (c): jednotky, zvířata, systémy, návody a živý stav.
