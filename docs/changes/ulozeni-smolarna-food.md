# Oprava: uložení selže s „kontrola: food“ u smolárny

## What and why
Vlastník 13. 11. (0.111.1): „Hru se nepodařilo uložit (kontrola: food)“. Hotová várka smolárny čeká ve výstupu
s rezervací místa ve skladu (`outputReservation`, např. pochodně). Smolárna mezitím přepne recept (na smolu).
Kontrola uložení brala výrobek podle aktuálního receptu, takže rezervace pochodní neseděla a celé uložení selhalo.
Chyba existovala už dřív, ale smolárna se dřív v tom stavu zasekla; po 0.111.1 nastává při každém střídání.

## Files and systems
- `src/systems/FoodStateValidation.js`: čekající hotová várka se kontroluje podle receptu, jehož výstup odpovídá
  rezervaci (`waitingKey`), ne podle aktuálně zvoleného receptu.
- `src/systems/FoodProductionSystem.js`, `LogisticsTaskManager.js`: rezervace výstupu se použije pro to zboží,
  na které byla udělána (i když dílna už přepnula recept).
- `scripts/pitch-kiln-smoke.mjs`: při každém vzorku zkusí hru uložit; chyba uložení = FAIL.

## Implementation decisions
- Běžící várka dál používá `cycle.recipe`; mění se jen případ „várka hotová, čeká na odnos“.

## Save/Load impact
SAVE_VERSION zůstává 62. Formát se nemění; stav, který dřív kontrolou neprošel, teď projde.

## Testing
- `scripts/pitch-kiln-smoke.mjs`: 0.111.1 FAIL (uložení selhalo ve 13 z 16 vzorků, kontrola food); nový build
  PASS (11 várek, žádná chyba uložení).
- `save-compat-smoke`, `--torches` smoke a `npm test` (1294) prošly.

## Notes for the next agent
- Stažení uložené hry do souboru v artefaktu nefunguje (prohlížeč blokuje stahování z vloženého okna);
  v plánu jako m-ulozeni-soubor-artefakt.
- Pozor: `vite build --outDir` do existující složky selže (EEXIST) a nechá starý build – před měřením složku smaž.
