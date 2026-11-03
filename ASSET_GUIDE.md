# Přidávání objektů a grafiky

Herní pravidla objektů jsou v `src/data/objects/`. Obrázky jsou vlastní soubory v `public/assets/`; Vite je kopíruje do sestavení beze změny. Současná hra má 21 typů, včetně čtyř povrchů pěšin: grass, dirt, stone, meat, gold, tower, castle, wall, king, rock_outcrop, rabbit, deer, wild_boar, horse, basic_sword, basic_armor, treasure_chest, grass_normal, grass_trampled_1, grass_trampled_2 a grass_trampled_3. Prázdné složky pro vodu, dřevo, železo, stromy a keře jsou příprava, nepřidávají nové herní mechaniky.

## Soubory a registr

| Kategorie | Definice | Obrázky |
|---|---|---|
| Terén | `src/data/objects/terrain.js` | `public/assets/terrain/{grass,dirt,water}/` |
| Suroviny | `src/data/objects/resources.js` | `public/assets/resources/{stone,wood,iron}/` |
| Budovy | `src/data/objects/buildings.js` | `public/assets/buildings/tower/` a další podsložky |
| Postavy | `src/data/objects/characters.js` | `public/assets/characters/king/` a další podsložky |
| Zvířata | `src/data/objects/animals.js` | `public/assets/characters/{rabbit,deer,wild_boar,horse}/` |
| Dekorace | `src/data/objects/decorations.js` | `public/assets/decorations/{rocks,trees,bushes}/` |

`src/data/objects/index.js` spojí seznamy kategorií. `ObjectRegistry` zkontroluje definice, odmítne chybějící údaje, neplatné hodnoty a duplicitní ID a uloží neměnné kopie. Nabízí `get(id)`, `require(id)`, `all()`, `byCategory(category)`, `buildables()` a `forGallery(category)`. `get` vrací pro neznámé ID `null`; `require` ohlásí chybu.

## Definice objektu

Každý objekt obsahuje:

```js
{
  id: 'tower',                    // jedinečné ID, malé znaky, čísla, _ a -
  name: 'Stone Tower',
  category: 'building',          // terrain/resource/building/character/decoration/animal/equipment/treasure
  sprite: '/assets/buildings/tower/tower.png',
  width: 2, height: 2,           // logická políčka, nikoli pixely obrázku
  walkable: false,
  collectible: false,
  buildable: true,
  cost: { stone: 10 },           // klíče jsou ID surovin
  interactions: ['enter', 'exit'],
  description: 'Kamenná strážní věž s horní plošinou.',
  renderMode: 'sprite',
  origin: { x: 0.5, y: 0.91 },
  visualHeight: 166,
  depth: { offset: 0 },
  platform: { x: 0, y: -118 },  // nutné pro budovu s interakcí enter
}
```

Cena, rozměry, průchodnost a interakce se čtou ze stejné definice v galerii, Buildings i při platbě a umístění. Cena věže 10 je zapsána v jediné definici. `Inventory.pay(cost)` odečte všechny požadované suroviny až tehdy, pokud jsou všechny dostupné.

`renderMode: 'procedural'` a `renderer` ponechávají původní animovanou kresbu krále, kámen a rozdělené cimbuří věže. Jejich PNG slouží i jako náhledy v UI. Pro přechod na obrázek nastav `renderMode: 'sprite'`; logika pohybu, sběru a obsazení se nemění. Je podporováno PNG, WebP a SVG. Animované spritesheety používají PNG nebo WebP a stejně velké snímky.

## Nová budova

1. Vlož obrázek do `public/assets/buildings/<id>/`.
2. Přidej definici do pole v `buildings.js`, s `category: 'building'`, `buildable: true` a `renderMode: 'sprite'`.
3. Nastav půdorys, cenu a origin. Nabídka Buildings i galerie ji zahrnou automaticky. Není potřeba měnit UI ani `GameScene`.
4. Pro prostou blokující stavbu použij `walkable: false` a `interactions: []`. Pro vstup na plošinu přidej `enter`, `exit` a `platform`.

Náhled se přichytí na mřížku, kontroluje celý půdorys a nepřekryje suroviny, jinou budovu ani probíhající krok krále. Po stavbě se zaplatí cena z definice a neprůchozí políčka se ihned promítnou do A*. Tato rozšíření používají stávající mechanismy; produkce, boj nebo jiné nové chování vyžadují samostatný systém.

## Nová sběratelná surovina

Vlož obrázek do `public/assets/resources/<id>/` a přidej definici do `resources.js`. Použij `category: 'resource'`, `collectible: true`, `interactions: ['collect']`, `buildable: false`, `cost: {}` a `renderMode: 'sprite'`. Volitelné `symbol`, `inventoryLabel` a `quantityNames: [jednotné, malé_množné, velké_množné]` ovlivňují text inventáře a ceny.

```js
spawn: { initial: 10, interval: 20000, max: 40 }
```

`spawn` je volitelné. Pokud je uvedeno, stejný generátor vytvoří počáteční objekty a později další do limitu daného typu. Kontroluje dosažitelnost, celý půdorys, všechny ostatní suroviny a chráněná políčka krále. Průchozí suroviny se sbírají po dojití na políčko; neprůchozí po dojití k sousednímu políčku. Sběr přidá jednu jednotku podle ID do existujícího inventáře, jehož lišta se sestaví z registrovaných sběratelných surovin.

## Origin, výška, stín a překrývání

Origin je relativní bod obrázku: `{x: 0.5, y: 1}` znamená dolní střed. U postavy jej nastav k chodidlům. U budovy se váže k přednímu rohu půdorysu `gridToWorld(x + width, y + height)`. U suroviny se váže ke středu půdorysu. Rozměry obrázku neurčují obsazená políčka.

`visualHeight` pomáhá ponechat v záběru vysoké objekty, jejichž základna leží mimo obraz. `depth.offset` jemně rozliší vrstvy ve stejné hloubce. Volitelné `visual.displayWidth/displayHeight` mění zobrazovanou velikost obrázku, nikoli kolize.

Stín lze dodat v obrázku (`shadow.baked: true`) nebo vykreslit zvlášť:

```js
shadow: { x: 0, y: 3, width: 28, height: 12, color: 0x30291c, alpha: 0.25, baked: false }
```

Pro sprite věže s postavou za předním cimbuřím rozděl kresbu na zadní obrázek `sprite` a průhledný `frontSprite` se stejnými rozměry a originem. Volitelný `frontOrigin` dovolí jiný origin přední vrstvy. Zadní část se kreslí v hloubce základny, král na plošině v `+0.2`, přední část v `+0.3`. Bez přední vrstvy stojí král před celým obrázkem budovy. Současná procedurální věž už má obě vrstvy.

## Animovaná postava

V definici postavy nastav `renderMode: 'sprite'`, cestu k spritesheetu a velikost snímku. Pro každý logický směr N, NE, E, SE, S, SW, W, NW definuj stavy idle a walk, například:

```js
spritesheet: { frameWidth: 64, frameHeight: 80 },
animations: {
  mode: 'spritesheet',
  clips: [
    { name: 'idle-s', state: 'idle', direction: 'S', frames: [0], frameRate: 1, repeat: -1 },
    { name: 'walk-s', state: 'walk', direction: 'S', frames: [1, 2, 3, 4], frameRate: 8, repeat: -1 },
    // Totéž pro dalších sedm směrů podle rozložení vlastního spritesheetu.
  ],
},
visual: { previewFrame: 0 },
```

Čísla snímků začínají nulou. Směry jsou logické směry mapy, nikoli směr nahoru/dolů na obrazovce. Otočení zůstane po zastavení zachováno. Nahrazením grafiky definice `king` zůstává použité současné ovládání a osmisměrný pohyb.

`AssetManager` vytváří sdílené textury a animační klipy jednou pro každý typ. Padesát instancí stejné budovy proto nenačítá padesát obrázků. Galerie získá náhled z už načtené textury, u spritesheetu ze zvoleného snímku. Cesty automaticky respektují Vite `BASE_URL`, včetně `/Newgame/` na GitHub Pages.

## Chybějící obrázky a kontrola

Při chybě načtení se hra nezastaví: známý procedurální typ použije svou kresbu, ostatní typy sdílený náhradní obrázek. Galerie ukáže upozornění u chybějícího souboru. Chybnou definici však registr odmítne s uvedením ID, aby nenastala skrytá změna pravidel.

Po změně spusť `npm test` a `npm run build -- --base=/Newgame/`. V prohlížeči ověř Asset Library → All a osm kategorií, detail objektu, sběr, cenu/půdorys stavby, chůzi kolem budovy a vstup/sestup z věže. Pro nový spritesheet zkontroluj všechny směry a klidovou animaci. Pro fallback dočasně změň cestu obrázku na neexistující místní soubor a po kontrole ji vrať.

Terén stále používá blokovou cache a culling; knihovna nepřidává tisíce samostatných obrázků políček. Galerie je pouze prohlížeč definic, bez editace a vkládání objektů do mapy.

## Zvířata, balíčky a spotřeba

`animals.js` registruje typy v kategorii `animal`. Jejich `gameplay` obsahuje `movementSpeed`, `initialCount`, `behavior: 'wander'`, `huntable`, `meatDrop` a `wanderRadius`. Pohled `AnimalView` používá vlastní jednoduché tvary; SVG poskytuje náhledy. `AnimalSystem` eviduje samostatná ID a pohyb instancí a `HuntingSystem.attack(animal)` zahajuje univerzální souboj spravovaný CombatSystem. Přirozený pohyb a odvetné pronásledování patří do AnimalSystem.

`DropSystem.create(resourceId, tile, amount)` vytvoří ručně sběratelný balíček nebo sloučí množství se stejným typem na stejném políčku. Množství není v definici typu masa: patří do konkrétní instance dropu. Dropy sdílí původní inventář a evidenci obsazených políček pro stavění a generování surovin. Nemají časový limit zmizení.

Definice masa má `consumption: { amount: 1, interval: 60000 }`. `FoodSystem` pracuje s uplynulým aktivním časem hry a zbytkem intervalu; nevyužívá opakované prohlížečové `setInterval`. Při prázdném inventáři zůstává počet nulový.

## Dohled a jezdecká zvířata

Základní čtverec dohledu určuje `king.gameplay.baseSight`. Věž má `visibility: { multiplier: 2 }`; jezdecký kůň má `gameplay.visionMultiplier: 1.5` a `mountedSpeedMultiplier: 2`. `VisibilityModifiers` vybírá právě jeden bonus podle aktuálního stavu, nikoli součet. Nová budova s plošinou může používat stejnou definici bonusu. Fog of War mění jen vykreslení a možnost nového výběru, nikoli navigaci či spawn.

Kůň je registrovaný jako `animal` s `interactions: ['mount']`, `huntable: false` a `meatDrop: 0`. Při jízdě zůstává stejná instance v AnimalSystem, pouze má `mounted: true`, její vlastní pohyb a původní pohled se skryjí a poloha se synchronizuje s králem. Jezdecká kresba je jen grafickou vrstvou krále.

## Hrad a propojené hradby

Castle používá původní stavění a interakci `enter`/`exit`, s půdorysem 3 × 3 a vlastní plošinou. `FortificationView` generuje z rozměrů a `visual.wallHeight` kamenné stěny, horní plochu a cimbuří ve dvou hloubkových vrstvách. Nové SVG soubory mají origin zarovnaný k přednímu rohu skutečného izometrického půdorysu, takže je lze vyměnit bez změny logiky.

Wall přidává `construction: { mode: 'line' }`, `navigation: { walkableTop: true }` a interakci `walk_top`. Tyto příznaky vyžadují půdorys 1 × 1. `wallLine` přichytí náhled k dominantní ose logické mapy. `wallLinePlan` nejprve validuje celou řadu a cenu, `placeWallLine` provede jednu platbu a teprve potom vytvoří modely všech nových segmentů. Již existující segmenty stejné sítě se vynechají bez platby.

Propojení N/E/S/W vzniká z logických sousedů a určuje obvodové cimbuří. Stěny sousedních těles se překrývají podle hloubky; zachované plochy zabraňují otevřenému řezu při skrytí souseda za hranicí Fog of War. Síť vrcholů je oddělená od neprůchozí zemní mapy; používá jen společné hrany. Pohyb po ní používá stejný normalizovaný posun jako král na zemi, s projekcí na výšku plošiny. Data o obsazených políčkách a modely budov zůstávají společné pro všechny systémy. Připojování bran nebo věží může v budoucnu rozšířit stejné vyhledávání sousedů.

Castle i Wall mají `visibility: { multiplier: 1.75 }`; skutečný pobyt na vrcholu tedy mění základní dohled 20 na 35. Při výstupu/sestupu se bonus neuplatňuje.

## Bojové statistiky živých objektů

Každý typ `character` nebo `animal` musí obsahovat `stats: { maxHP, attackDPS, armor, attackRange }`. HP musí být kladné, DPS a dosah nezáporné, základní Armor mezi 0 a 90. Registry odmítne neúplné nebo neplatné hodnoty. Tyto údaje jsou viditelné v Asset Library.

`createCombatStats` vytvoří vlastní currentHP a další aktuální hodnoty instance a neměnnou kopii základních statistik. Definice typu se během souboje nemění. `CombatSystem.startAttack`, `stopAttack`, `applyDamage` a událost `death` fungují pro všechny jednotky. Veřejné `applyDamage` přijímá příchozí poškození před Armor; vnitřní DPS integrátor používá již zredukované poškození, aby se obrana nepočítala dvakrát.

Současné útoky se integrují až k okamžiku nejbližší smrti, takže odvetný zásah netrvá o celý snímek déle nebo kratší dobu podle pořadí a FPS. Smrt se oznámí pouze jednou. Herní scéna na událost naváže odstranění zvířete a vytvoření dropu nebo Game Over pro krále.

Pro sprite animace lze nově použít i `state: 'attack'` s osmi logickými směry. Procedurální král má vlastní jednoduchou útočnou pózu. Volitelné `visual.healthBarOffset` upravuje výšku health baru nového obrázku zvířete. Krátká odezva zásahu nemění statistiky ani délku útoku.

## Čas, regenerace, produkce a vybavení

`GameTimeSystem` má centrální `DAY_DURATION = 120000`, den, čas v aktuálním dni a celkový aktivní čas. `onNewDay(listener)` vrací odpojení listeneru. Delší aktualizace se rozdělí na jednotlivé hranice dní; callback vidí právě začínající den s nulovým elapsed. Pauza zastaví aktualizace přes `GameScene.setPaused(true)` včetně pohybu, soubojů, časovačů a animací. Stejné aktivní delta řídí potravu a generování kamenů.

Simulace používá skutečné `game.loop.rawDelta`; vyhlazené a ořezané Phaser delta by při nižším FPS prodlužovalo den. První snímek po vytvoření scény, zrušení pauzy nebo návratu z neaktivní záložky nezapočítává čekání. Skrytá záložka pozastaví simulaci a animace; nevzniká zpětná produkce za dobu mimo hru.

## Save/Load a životní cyklus scény

`MainMenu` spouští `GameScene` až po New Game nebo úspěšné validaci save. `GameApplication` spravuje stálé DOM nabídky a jediný `SaveGameManager`. IndexedDB `newgame-saves` obsahuje samostatné záznamy v úložišti `saves`; jeden atomický zápis uchovává metadata i stav. Potvrzení přepsání/smazání je součástí `SaveLoadMenu`. Nastavení a herní menu používají `PauseManager` s množinou důvodů.

`serializeGameState(scene)` vrací pouze JSON data s `saveVersion`. `validateGameState` kontroluje verzi, rozměry mapy, definice, ID/reference, obsazení, rozsahy statistik a časovačů. `loadGameState` rekonstruuje instance a jejich vzájemné reference před prvním aktivním snímkem. Při obnovení se přeskočí všechny počáteční spawny; obsah truhly se nepřegeneruje. `Inventory`, čas, potrava, spawny, produkce a vybavení mají `exportState`/`importState`; serializace jednotek a příkazů převádí reference na ID. Nové trvalé vlastnosti přidej do DTO, validace, obnovy a testů v `tests/save-load.test.js`. Phaser GameObjects, textury a callbacky se nikdy neukládají.

## Vyšlapávání terénu

`src/data/pathWear.js` obsahuje prahy, rychlosti, dobu zarůstání a ID čtyř povrchů. `PathWearSystem` drží číselná pole skóre, úrovní a posledních průchodů pro 10 000 buněk a množinu aktivních buněk pro denní zarůstání. Při změně dne zpracuje pouze tuto množinu. Podklad `terrainGrid === 0` je nyní tráva; pro budoucí typy terénu lze předat `isGrass`.

Sdílené `advanceMovement` dělí čas na hranicích skutečných logických buněk, respektuje rychlost aktuálního povrchu a volá `enteredTiles`. Diagonální překročení rohu nepočítá boční buňky a vysoká rychlost nevynechá navštívené buňky. Jednotky kategorie `character` na zemi vytvářejí pěšiny; vlastnost `gameplay.tramplesTerrain` může toto chování výslovně upravit. Stejný hook je připravený pro budoucí NPC; zvířata a volní koně ho nepoužívají. Při přidání NPC používej tentýž pohyb, nevytvářej druhé počítání průchodů.

Registry povrchy `grass_normal`, `grass_trampled_1/2/3` používají vlastní SVG 64 × 32 a metadata barvy/šířky propojení. Obrázky lze vyměnit v definici bez změny pravidel. `TerrainRenderer` překreslí při změně úrovně jen dotčené bloky 10 × 10 a bloky sousedních spojů; ostatní změny skóre neinvalidují běžný terén. Neviditelné bloky čekají na příchod kamery. Debug používá jednu sdílenou vrstvu Graphics a výpis pod myší, nikoli tisíce textových objektů.

Save data `pathWear` obsahují skóre, odvozené úrovně, den posledního průchodu a poslední zpracovaný den. Import nevyvolává průchody ani denní události. Nepřítomná položka ve starším save bezpečně obnoví nuly. Při změně prahů v budoucí verzi doplň migraci odvozených úrovní.

`stats.hpRegenPerSecond` je univerzální vlastnost: King má 0.2, ostatní typy výchozí 0. `RegenerationSystem` nehojí mrtvé a omezí HP maximem. Během DPS souboje se regenerace integruje současně s příchozím poškozením; CombatSystem vrací pokryté časy jednotek, aby se zbytek snímku nevynechal ani neléčil dvakrát. Výsledek tak odpovídá i různému FPS a smrti útočníka uvnitř časového kroku.

Castle má `production: { resource: 'gold', amount: 5, interval: 'day', label: 'Castle income' }`. `ProductionSystem` sčítá všechny aktuální budovy podle těchto dat a eviduje poslední zpracovaný den. Stejný den se nevyplatí dvakrát, nová budova nemá zpětný příjem. `dailyIncome()` poskytuje přehled pro budoucí ekonomické UI.

`UnitStats` uchovává neměnný základ a skupiny modifikátorů `unit.statModifiers`. `EquipmentSystem` zapisuje jen skupinu `equipment` a vše znovu odvodí, nikoli vynásobí již upravené DPS. Položka Equipment obsahuje například `equipment: { slot: 'weapon', modifiers: { attackBonus: 100 } }`; brnění má slot `armor` a `modifiers: { armor: 30 }`. Modifikátory mohou ovlivnit maxHP, attackBonus, Armor nebo hpRegenPerSecond. Vlastnictví předmětů používá původní Inventory, slot pouze odkazuje na ID. Odložení nemaže vlastnictví a opakované equip nevrství bonus.

Pořadí surovin v UI řídí `inventoryOrder`: Gold 0, Stone 10, Meat 20 a ostatní implicitně 100. Kategorie Equipment a Treasure jsou také v galerii. Registr kontroluje platnost produkce, modifikátorů, obsahu pokladu i odkazů na jiné definice ještě před změnou celé dávky.

## Truhly

Definice `treasure_chest` používá kategorii `treasure`, interakci `open`, neprůchozí půdorys 1 × 1 a metadata `treasure: { initial: 1, goldMin: 50, goldMax: 100, equipment: ['basic_sword', 'basic_armor'] }`. Každá instance má jedinečné ID, vygenerovaný neměnný obsah, `opened`, `opening` a `looted`. Až Take All jednou přidá obsah do inventáře a automaticky vybaví získané položky.

Truhla zůstává po vyzvednutí neprůchozí. Navigace k ní používá stejné hledání dostupných sousedních políček jako ostatní interakce. `ChestView` má samostatné animované víko a přesný zásah myší i v otevřené poloze. Při přechodu na obecný sprite může `visual.openFrame` označit otevřený snímek; logika jednorázového vyzvednutí zůstává stejná. Nepoužívá se nové losování při otevření či změně dohledu.
