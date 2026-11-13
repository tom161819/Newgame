# Topení v domech a dřevo jako palivo (m-topeni-domu 37, m-palivo-vyroba 38)

## What and why
Vlastník 13. 11.: dřevo se hromadí, protože kromě staveb a prodeje nemá využití. Domy teď v zimě topí dřevem
(teplo = spokojenost, zima = postih) a pekárna potřebuje dřevo do pece. U tavírny a kováren se dřevo ukazuje jako palivo.

## Files and systems
- `src/data/heating.js`: kapacita dřevníku 12, spotřeba podzim 1 / zima 3, mráz ×1,5, bonus +6, postih −12,
  podzim poloviční účinek, plnění od léta, priorita 26, vlastní donáška pod 6.
- `src/systems/HeatingSystem.js`: dřevník `heat-<id>` (druh 'fuel', vzniká až když je potřeba), ranní spálení,
  stav vytopeno/studeno, `happiness`, `isCold`, `candidates` pro nosiče, `help` (obyvatel bez práce nosí dřevo
  domů), odhad na zimu, hlášky, uložení `heating`.
- `src/systems/NeedsSystem.js`: `heat` ve spokojenosti; studený dům = odpočinek jako v osadě.
- `src/systems/LogisticsTaskManager.js` (katalog + filtr `heatFor`), `WorkerAI.js` (volá `heating.help`).
- `src/systems/FoodStateValidation.js`: dřevníky domů nepovinné; vstupní/výstupní buffer starší hry dostane
  nový seznam surovin (pekárna + dřevo).
- `src/systems/GameStateSerializer.js`, `GameStateLoader.js`, `GameSettings.js` (`winterHeating`).
- Recepty: `foodProduction.js` (pekárna `input {flour:1,wood:1}`, `fuel {wood:1}`), `production.js`
  (`fuel` u tavírny 2, kováře a zbrojíře 1; `withoutFuel`; RECIPE_HISTORY pekárny), `FoodProductionSystem.js`
  (`fuelled`, rozpracovaná várka si drží své vstupy, hromadné nošení i s palivem).
- UI: `index.html` (volba v nové hře a v nastavení, řádek Dřevo na zimu), `NewGameSetup.js`, `NightControls.js`,
  `FoodEconomyPanel.js`, `NeedsDisplay.js`, `buildingTooltipContent.js` (+ ikona ❄), `WorkplacePanel.js`
  (řádek paliva), Wiki (stránka Topení v zimě, fakt „Z toho palivo“, texty pekárny, tavírny a návodu Zima).
- Testy `tests/heating.test.js`, `tests/production-fuel.test.js`; prohlížeč `scripts/heating-smoke.mjs`.

## Implementation decisions
- Otázky vlastníka zůstaly bez odpovědi, proto výchozí volby: topí jen domy, spotřeba stejná za dům, tavírna
  dál 2 dřeva (jen označená jako palivo), udírna a uhlíř nejsou. Všechna čísla jsou v datech.
- Plnění dřevníků začíná v létě, aby byly na začátku podzimu plné (podzim jen s plněním znamenal první dny zimu).
- Měření na vesnici s 30 lidmi a jedním nosičem: jen přes nosiče se dřevo do domů nedostalo (nosič stále vozil
  jídlo), proto obyvatel, který čeká bez práce, donese dřevo do svého domu sám. Pak bylo 5 ze 6 domů vytopených
  celý podzim i zimu; zásoba dřeva klesla ze 187 na 22 s jedním dřevorubcem – dřevo má teď reálnou spotřebu.
- Prázdný dům netopí. Krb nezvyšuje riziko požáru.

## Save/Load impact
SAVE_VERSION zůstává 62. Nepovinné `heating` (stav dne a vypínač) a dřevníky `heat-<id>`; staré hry začnou
s prázdnými dřevníky. Rozpracovaná várka pekárny ze staré hry se dopeče bez dřeva.

## Testing
- `tests/heating.test.js` (3), `tests/production-fuel.test.js` (3); upravené testy pekárny (dřevo do pece).
- `scripts/heating-smoke.mjs`: vytopeno +6, studeno −12, řádek Dřevo na zimu, volba zapnutá.
- `save-compat-smoke`, `--wiki`, `--torches` prošly; `npm test`: 1300 testů prošlo.

## Notes for the next agent
- Grafika (kouř z komínů, hranice polen) je úkol g-topeni-vzhled.
- Otevřené otázky vlastníka: výše bonusu a postihu, spotřeba podle počtu lidí, topení hradu a kasáren, tavírna
  +1 dřevo, udírna, uhlíř.
