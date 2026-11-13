# Volba velikosti mapy (m-velikost-mapy, plán 34)

## What and why
Vlastník chtěl volit velikost mapy na startu hry: 100, 150, 200, 250, 300 políček na stranu. Nová hra má výběr
„Velikost mapy“ (výchozí 100). Větší mapa má úměrně víc stromů, kamenů, ložisek, jezer, skal, keřů a zvěře; hrad
je dál uprostřed. Nahraná hra si velikost bere ze svého uloženého terénu.

## Files and systems
- `src/game/config.js`: `COLUMNS`/`ROWS` jsou živé exporty (`export let`), `MAP_SIZES`, `setMapSize`,
  `withMapSize`, `onMapSize`, `mapArea`. `PLAYER_START` se mění na místě (střed mapy).
- `src/game/isometric.js`: `ORIGIN` a `WORLD_BOUNDS` se přepočítají přes `onMapSize`.
- `src/game/worldGeneration.js`: střed řek, skály, keře, jezera, poušť a „původní zdi“ u startu podle velikosti.
- `src/systems/GameSettings.js`: `mapSize` v nastavení (nepovinné, výchozí 100), `byArea`, `wildlifeTarget`,
  počty kamenů (`resourceSpawnSettings`) podle plochy. `WildlifeRespawnSystem` cílí na `wildlifeTarget`.
- `src/systems/MineralSystem.js`, `NaturalResourcesSystem.js`: počty a hranice podle velikosti; rychlá kontrola cest.
- `src/game/pathfinding.js`: `reachableMask`, `blockKeepsReach` (místní test + souběžné hledání), viz níže.
- `src/game/GameScene.js` `init`: `setMapSize` před stavbou světa (nahraná hra: výška `terrain`).
- `src/systems/GameStateSerializer.js`: kontrola uložení běží ve velikosti dané hry (`withMapSize`).
- Pevné 99/98/97/95/100 v `FoodStateValidation`, `RockMiningState`, `RockMiningTool`, `FoodStorageSystem`,
  `FogEdgeLayer` nahrazeny velikostí mapy.
- UI: `index.html` výběr `#setup-map-size` a poznámka o výkonu, `NewGameSetup`, náhled `WorldGenerator`
  generuje ve zvolené velikosti; texty cs/en.

## Implementation decisions
- Místo předávání velikosti do ~160 míst zůstaly `COLUMNS`/`ROWS`, jen jsou živé (ES moduly je propisují). Moduly,
  které si z velikosti něco spočítají při načtení, se přihlásí přes `onMapSize`.
- Při 100 × 100 dává generátor i rozmístění stromů a ložisek přesně stejný svět jako dřív (ověřeno porovnáním
  dvou kódů světa ve starém a novém buildu; testy světa beze změn).
- Kód světa velikost neobsahuje: stejný kód + stejná velikost = stejný svět (text u kódu to říká).
- Výkon: kontrola „strom nesmí odříznout cestu“ dělala dvě záplavy celé mapy na každý strom; na 300 × 300 to
  znamenalo minuty a ve hře 2 FPS (růst stromů). Teď nejdřív místní test (okolí 3 políček), pak souběžné
  hledání ze sousedů, které skončí, jakmile se spojí nebo se malá kapsa uzavře; záplava jen ve vzácném případě.
  Odpovědi jsou stejné jako záplava (test na náhodných mapách).
- Měření (headless, canvas, nová hra, rychlost 3): start 100: 3,4 s / 50 FPS; 200: 5,1 s / 47 FPS;
  300: 5,9 s / 39 FPS, posun kamery 33 FPS. Uložení 300: 160 ms.

## Save/Load impact
SAVE_VERSION zůstává 62. `gameSettings.mapSize` je nepovinné; staré hry jsou 100 × 100. Při načtení se velikost
bere z výšky `terrain` a do nastavení se dopíše. Kontrola uložení běží ve velikosti ukládané hry, takže seznam
uložených her funguje i při běžící hře jiné velikosti.

## Testing
- `tests/map-size.test.js`: živá velikost a projekce, generátor 150/200 (úplný, opakovatelný, víc skal),
  svět 100 beze změny, kontrola uložení v jeho velikosti, rychlý test cest = záplava.
- `tests/world-configuration.test.js`: `mapSize` ve výchozím nastavení, neplatné velikosti odmítnuty.
- Prohlížeč: nová hra 200 → uložení → hra 100 → načtení uložené (mapa 200, hrad 100,100) bez chyb;
  obrazovka nové hry s výběrem 250 a náhledem.
- Celá sada `npm test`: 1292 testů prošlo.

## Notes for the next agent
- World Lab a Editor světa zatím pracují jen se 100 × 100 (běží v menu, kde je velikost 100).
- Část (b) plánu: zjednodušená simulace daleko od kamery a minimapa po dílech zatím nejsou; měření ukázalo,
  že 300 × 300 jde i bez nich. Kreslení země je po dílech (chunks) už dřív.
- Řeky: na větší mapě je dál jedna řeka (+ přítok); jezera, poušť a skály rostou s plochou.
