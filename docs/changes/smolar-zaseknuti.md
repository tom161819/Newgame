# Oprava: smolárna po první dávce přestane vyrábět

## What and why
Vlastník 13. 11.: „mám sklad, mám dřevo, vyrobí první dávku a pak už nic“. Smolárna střídá recepty (smola /
pochodně). Hotové zboží jednoho receptu zůstalo ve výstupu dílny, když se recept přepnul. Nová várka čeká na
prázdný výstup, ale smolař (a u jiných dílen nosiči) nosil jen výrobek aktuálního receptu a stál u pece
s úkolem „Vyrábí“ navždy.

## Files and systems
- `src/systems/FoodProductionSystem.js`: `outputResources()` vrací vše, co leží ve výstupu (aktuální výrobek
  první); `updateWorker` vynáší i zbytky jiného receptu; pracovník čekající u pece na várku, která nemůže
  začít kvůli plnému výstupu, úkol zruší a jde výstup vynést.
- `src/systems/LogisticsTaskManager.js`: nosiči dostanou úlohu pro každé zboží ve výstupu dílny.
- `scripts/pitch-kiln-smoke.mjs`: nový prohlížečový test (smolárna, sklad, dřevo, smolař, 16 vzorků).

## Implementation decisions
- Rezervace kapacity výstupu (`outputReservation`) se použije jen pro výrobek aktuálního receptu; zbytky
  hledají cíl přes `findDestination`.
- Čekající pracovník odejde od pece jen tehdy, když výstup nevynáší jiný pracovník téže dílny.

## Save/Load impact
Žádný. SAVE_VERSION zůstává 62. Uložená hra se zaseknutou smolárnou se po načtení sama rozběhne.

## Testing
- `scripts/pitch-kiln-smoke.mjs`: starý build FAIL („output buffer stuck“ – 6 pochodní ve výstupu, smolař
  „Producing pitch“ bez várky), nový build PASS (11 várek za 160 s, výroba pokračuje po přepnutí receptu).
- `--torches` smoke prošel; `npm test`: 1294 testů prošlo.

## Notes for the next agent
- Stejná past hrozí u každé dílny s více recepty (`recipes` + `recipeChoice`/`recipeMode`); oprava je obecná.
