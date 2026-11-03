# Přidávání objektů a grafiky

Herní pravidla objektů jsou v `src/data/objects/`. Obrázky jsou vlastní soubory v `public/assets/`; Vite je kopíruje do sestavení beze změny. Současná hra má 25 typů, včetně čtyř povrchů pěšin: grass, dirt, stone, meat, gold, tower, castle, wall, quarry, hunting_lodge, barracks, king, peasant, rock_outcrop, rabbit, deer, wild_boar, horse, basic_sword, basic_armor, treasure_chest, grass_normal, grass_trampled_1, grass_trampled_2 a grass_trampled_3. Prázdné složky pro vodu, dřevo, železo, stromy a keře jsou příprava, nepřidávají nové herní mechaniky.

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

## Individuální zkušenosti

`src/data/experience.js` obsahuje jedinou křivku levelů 1–50, celkové prahy a tabulku odměn. Definice lidské postavy může zadat `experience: {initialLevel: 1, maxLevel: 50, enabled: true, gainMultiplier: 1}`. Model `character.experience` drží celkový postup a slovník budoucích násobitelů; `character.skills` obsahuje nezávislé skilly. Oba používají stejné `createProgress`/`addProgressXP`/`checkProgressLevelUp`. Zvířata zkušenosti nezískávají.

Dokončující systém publikuje na `GameActivityBus` událost s konkrétním `actor`, typem činnosti a objektu. Sběr se hlásí až po odstranění položky a připsání inventáře, lov až při skutečné smrti se známým původcem útoku a stavba až po úspěšné platbě a dokončení. Řada hradeb posílá počet nových segmentů. `ExperienceSystem` má `addXP`, `getXPRequired`, `checkLevelUp`, `getLevelProgress`, `on('levelUp', listener)` a `on('xp', listener)`. Ostatní systémy nepřepisují XP přímo.

Bus přiděluje monotónní ID `activity-N`. Experience System si zpracované ID pamatuje i v save, takže opakované doručení téže události nic nepřidá. Nové akce na stejném políčku dostanou nové ID a fungují běžně. `CombatSystem` posílá `damage(target, amount, attacker)` a `death(target, killer)`; rozhodující příspěvek při smrti je deterministický při shodě podle ID a nezávisí na pořadí ani FPS. Prozatím se odměňuje dokončený lov; částečné poškození nepřidává celkové XP.

`ExperienceFeedback` vykresluje HUD a krátké efekty s viditelností podle kamery a Fog of War. `UnitPanel` je společný přehled lidských jednotek; král ho otevírá z horní lišty, poddané poskytuje `GameScene.selectableHumans()`. Panel nemění králův aktuální příkaz. `exportState`/`importState` systému uchovává čítač a zpracované události, jednotlivé postavy ukládají vlastní XP model. Import bez XP bezpečně použije level 1 a žádné historické odměny.

## Poddaní a pracovní AI

`src/data/jobs.js` je společná konfigurace šesti skillů, sedmi profesí, pracovních rychlostí, zotavování a migrace. Peasant má v registry vlastní procedurální pohled a SVG náhled, statistiky, dostupné profese a seznam skillů. `WorkerController` používá původní živý controller a sdílené hledání cesty, pohyb i rezervace probíhajícího kroku; nevzniká druhá implementace navigace.

`WorkerSystem` drží jednotlivé fyzické poddané a jejich ID, počáteční tři obyvatele a každodenní příchod jednoho nového do kapacity 20. Migrant se vytvoří na dosažitelném okraji a dojde domů. Domovem je první hrad nebo původní osada. `JobSystem.assign` ruší starý úkol, útok a cíle, ale zachová skilly a celkové XP. Nabízí změnový hook pro další systémy a `setConstructionProvider` pro skutečná staveniště. Jeho implementací je BuilderAI napojená na ConstructionSystem. `assignedWorkplaceId` odkazuje na skutečný objekt pracoviště.

`WorkerAI` rozlišuje hledání, přesun, práci, čekání, návrat a zotavování. Miner zpracuje kámen až po příchodu a odpracování 1500 ms upravených efektivitou. Hunter používá stejný CombatSystem jako král a po skutečné smrti dojde k dropu, který sbírá 700 ms upravených Hunting efektivitou. Oba pak nesou náklad zpět a předají ho až u přiřazené budovy. `TaskReservationSystem` přiděluje cíl právě jednomu pracovníkovi a uvolňuje ho při dokončení, změně profese, nedostupnosti nebo smrti. Nezaměstnaní se procházejí, ostatní dosud nepodporované práce čekají bez fiktivní produkce. Poddaní jsou zahrnutí do rezervací pro stavění/spawny, regenerace, překrývání, health barů, Fog of War a vyšlapávání cest.

`SkillSystem` poslouchá již přijaté dokončené aktivity a udělí Mining, Hunting nebo Construction XP. Události poškození rozvíjejí Combat, nejvýše 40 základních XP na dvojici útočník/protivník; neudělují navíc celkovou odměnu za tentýž lov. Všechny kanály sdílejí ledger událostí ExperienceSystem. `activitySkill.attackMultiplier` se aplikuje pouze při příslušném útoku a po jeho ukončení se zruší; násobí DPS až po vybavení. Například Sword a Hunting 50 dávají `15 × 2 × 1.49 = 44.7 DPS`. Základní statistiky a množství surovin zůstanou stejné.

Save obsahuje každý skill, pracovní stav a úkol, rezervaci, postup práce, cíle, migraci a damage XP limity. Obnova znovu naváže reference a rezervace před první aktualizací. Starší save bez poddaných inicializuje tři nové obyvatele s talenty. Existujícím poddaným se zachovají skilly, talent se stabilně odvodí z ID a uloží; královy chybějící skilly začínají na 1. Další načtení již obnoví uložená data. Smrt poddaného ponechá datový záznam pro zachování historie, ale odstraní pohled, práci i rezervace.

## Vyšlapávání terénu

`src/data/pathWear.js` obsahuje prahy, rychlosti, dobu zarůstání a ID čtyř povrchů. `PathWearSystem` drží číselná pole skóre, úrovní a posledních průchodů pro 10 000 buněk a množinu aktivních buněk pro denní zarůstání. Při změně dne zpracuje pouze tuto množinu. Podklad `terrainGrid === 0` je nyní tráva; pro budoucí typy terénu lze předat `isGrass`.

Sdílené `advanceMovement` dělí čas na hranicích skutečných logických buněk, respektuje rychlost aktuálního povrchu a volá `enteredTiles`. Diagonální překročení rohu nepočítá boční buňky a vysoká rychlost nevynechá navštívené buňky. Jednotky kategorie `character` na zemi vytvářejí pěšiny; vlastnost `gameplay.tramplesTerrain` může toto chování výslovně upravit. Stejný hook je připravený pro budoucí NPC; zvířata a volní koně ho nepoužívají. Při přidání NPC používej tentýž pohyb, nevytvářej druhé počítání průchodů.

Registry povrchy `grass_normal`, `grass_trampled_1/2/3` používají vlastní SVG 64 × 32 a metadata barvy/šířky propojení. Obrázky lze vyměnit v definici bez změny pravidel. `TerrainRenderer` překreslí při změně úrovně jen dotčené bloky 10 × 10 a bloky sousedních spojů; ostatní změny skóre neinvalidují běžný terén. Neviditelné bloky čekají na příchod kamery. Debug používá jednu sdílenou vrstvu Graphics a výpis pod myší, nikoli tisíce textových objektů.

Save data `pathWear` obsahují skóre, odvozené úrovně, den posledního průchodu a poslední zpracovaný den. Import nevyvolává průchody ani denní události. Nepřítomná položka ve starším save bezpečně obnoví nuly. Při změně prahů v budoucí verzi doplň migraci odvozených úrovní.

`stats.hpRegenPerSecond` je univerzální vlastnost: King a Peasant mají 0.2, zvířata mají výchozí 0. `RegenerationSystem` nehojí mrtvé a omezí HP maximem. Během DPS souboje se regenerace integruje současně s příchozím poškozením; CombatSystem vrací pokryté časy jednotek, aby se zbytek snímku nevynechal ani neléčil dvakrát. Výsledek tak odpovídá i různému FPS a smrti útočníka uvnitř časového kroku.

Castle má `production: { resource: 'gold', amount: 5, interval: 'day', label: 'Castle income' }`. `ProductionSystem` sčítá všechny aktuální budovy podle těchto dat a eviduje poslední zpracovaný den. Stejný den se nevyplatí dvakrát, nová budova nemá zpětný příjem. `dailyIncome()` poskytuje přehled pro budoucí ekonomické UI.

`UnitStats` uchovává neměnný základ a skupiny modifikátorů `unit.statModifiers`. `EquipmentSystem` zapisuje jen skupinu `equipment` a vše znovu odvodí, nikoli vynásobí již upravené DPS. Položka Equipment obsahuje například `equipment: { slot: 'weapon', modifiers: { attackBonus: 100 } }`; brnění má slot `armor` a `modifiers: { armor: 30 }`. Modifikátory mohou ovlivnit maxHP, attackBonus, Armor nebo hpRegenPerSecond. Vlastnictví předmětů používá původní Inventory, slot pouze odkazuje na ID. Odložení nemaže vlastnictví a opakované equip nevrství bonus.

Pořadí surovin v UI řídí `inventoryOrder`: Gold 0, Stone 10, Meat 20 a ostatní implicitně 100. Kategorie Equipment a Treasure jsou také v galerii. Registr kontroluje platnost produkce, modifikátorů, obsahu pokladu i odkazů na jiné definice ještě před změnou celé dávky.

## Truhly

Definice `treasure_chest` používá kategorii `treasure`, interakci `open`, neprůchozí půdorys 1 × 1 a metadata `treasure: { initial: 1, goldMin: 50, goldMax: 100, equipment: ['basic_sword', 'basic_armor'] }`. Každá instance má jedinečné ID, vygenerovaný neměnný obsah, `opened`, `opening` a `looted`. Až Take All jednou přidá obsah do inventáře a automaticky vybaví získané položky.

Truhla zůstává po vyzvednutí neprůchozí. Navigace k ní používá stejné hledání dostupných sousedních políček jako ostatní interakce. `ChestView` má samostatné animované víko a přesný zásah myší i v otevřené poloze. Při přechodu na obecný sprite může `visual.openFrame` označit otevřený snímek; logika jednorázového vyzvednutí zůstává stejná. Nepoužívá se nové losování při otevření či změně dohledu.

## Natural Talents a mzdová ekonomika

`src/data/economy.js` konfiguruje šest talentů, XP bonus 20 %, intervaly počátečních skillů a základní mzdy. `NaturalTalentSystem` jednorázově vytváří profil nového poddaného pomocí stejné XP křivky. `naturalTalent` je jediný skill ID a `initialSkills` je nezávislý původní snapshot. Starší postavy dostanou deterministický talent a snapshot stávajících skillů bez přelosování. Král talent nedostává. `SkillSystem.addXP` násobí pouze odpovídající skillové XP; celkové odměny i 40bodový základní limit bojových XP zůstávají samostatné.

`GameTimeSystem.onAdvance` předává aktivní čas rozdělený na hranicích dnů. `WageSystem` sčítá sazbu × milisekundy pomocí kompenzovaného součtu, bez průběžného zaokrouhlování; uzavřený den vydělí 120000. Sazba je základ profese + `floor((skillLevel - 1) / 10)`, při nezaměstnanosti či smrti 0. Herní čas se účtuje před novou prací daného snímku, takže nově získaný level ovlivní další časové úseky. Produkce hradů je registrovaná před výplatou. Ledger dluhů `{workerId, day, amount}` se hradí od nejstaršího dne včetně dluhů nezaměstnaných a mrtvých. Kontrola `lastProcessedDay` brání duplicitní výplatě.

Používá se původní `Inventory`; pouze Gold podporuje zlomkové platby. Kameny, vybavení a ostatní suroviny nadále vyžadují celé ceny. `EconomyPanel` je pevné HTML a každý snímek přepočítá očekávané příjmy a mzdy podle aktuálních budov, živých pracovníků, profesí a skutečných skillů. Dluh zůstává oddělený od dosud nevyplacených nákladů aktuálního dne. Událost `onPayroll` připravuje vazbu na další systémy bez zavádění morálky.

Save ukládá profily a `wages: {lastProcessedDay, accruals, arrears}` včetně kompenzace součtu. Loader obnoví ledger před prvním aktivním snímkem. Starší save začíná bez zpětné mzdy a dluhů; jeho aktuální den se označí jako již zpracovaný. Validace odmítá neznámý talent, poškozené XP křivky, chybné reference dluhů, záporné částky nebo nesoulad výplatního dne.

## Pracoviště a fyzická doprava

`src/data/workplaces.js` definuje kapacity a vazby Quarry → 3 Miner/Mining, Hunting Lodge → 2 Hunter/Hunting, Barracks → 5 Soldier/Combat a časy sbírání/hlídkování. Budovy jsou běžné registry objekty s `workplace: {capacity, profession, skill}`; jejich ceny a půdorysy ověřuje původní stavění. `WorkplaceView` kreslí vlastní geometrii, stíny, náhled a klikací polygon v původních izometrických souřadnicích. SVG ikony jsou místní soubory v odpovídajících složkách budov.

`WorkplaceSystem` eviduje jednu sadu míst a statistiky doručení pro každou budovu. Přiřazuje skutečného poddaného přes existující JobSystem, nikoli nový exemplář. Změna zaměstnání, odebrání a smrt uvolní místo a rezervace; nedoručený náklad předají DropSystemu. Horník umí sebrat i takový kamenný drop. Aktuální XP, talenty, HP a již vzniklé mzdové náklady se neztrácejí.

WorkerAI nejprve fyzicky dojde k přístupnému sousednímu políčku pracoviště, potom hledá skutečné cíle v pracovním okolí a vrací se s `cargo`. Vybrané resource/drop události a Hunting kill odměny se uloží do `pendingWorkRewards`. Doručení nejdříve vymaže náklad i události, přičte inventář/statistiku a pak emituje skutečné dokončení do původního ExperienceSystemu. Bojové XP za skutečně způsobené poškození zůstávají okamžité. Jeden sloučený kamenný drop odmění skutečné množství kamenů; balíček masa nadále přidává dvě celkové XP. Neúspěšný návrat nic nepřidá. Voják hlídkuje bez automatického cílení zvěře a útok zahájí jen jako obranu na již napadený vlastní model.

Pro pracovníky se použije původní A* nad pohledem mapy s rezervacemi ostatních fyzických jednotek. Volitelný `canEnterTile` ve sdíleném pohybu zkontroluje nový krok a jeho diagonální rohy, takže nová kolize zruší trasu a AI ji obnoví. Ostatní controllery používají tentýž původní pohyb. Nevzniká druhá implementace cest, inventáře, bojů, XP ani mezd.

Save obsahuje `workplaces.records` s ID, kapacitou, pracovníky a doručenými surovinami a u poddaného `workplaceReached`, `cargo` a `pendingWorkRewards` vedle původního pracovního úkolu. Validátor kontroluje obousměrné vazby, jedinečnost, kapacitu, profesi, skutečné budovy, náklad a povolené události. Loader obnoví vše před prvním snímkem. Save z doby před pracovišti ruší nepřiřazené zaměstnání do Idle, přitom zachová dosažené hodnoty a dosud naběhlé mzdy.

## Postupná výstavba

Budovy mají registry údaj `constructionTime` v milisekundách; ceny zůstávají v původním `cost`. Umístění stále provádí jediné `placeBuilding` nebo atomické `placeWallLine`. Po úspěšné platbě `ConstructionSystem.plan` inicializuje `building.construction` a přidělí monotónní ID. Blueprint zůstává stejným objektem v `scene.buildings`; nevytváří se druhý svět ani duplicitní inventář. `buildingIsComplete` vrací true i u starších objektů bez těchto dat.

`ConstructionSite` uchovává `state`, `requiredWork`, `workDone`, `progress`, `investedMaterials`, `contributions`, `assignedBuilders` a `rewardsGranted`. `BuilderAI` používá původní osmisměrné A* a TaskReservationSystem s globálními klíči `construction-slot:x,y`, takže se ani sousední staveniště nepodělí o jedno obsazené pracovní místo. Kapacita je v `data/construction.js`, nyní tři včetně krále. Staticky nedosažitelná místa se ukládají do cache do změny navigace; dočasně blokovaná jednotkami se zkoušejí s odstupem. Změna profese a smrt uvolní rezervaci přes původní WorkerAI.cancel.

Sdílený pohyb vrací zbývající milisekundy po skutečném příchodu do cíle. ConstructionProgress rozděluje každý snímek v okamžicích příchodů a integruje pouze aktivní práci jednotlivých postav. Na konci stavby příspěvky ořízne na skutečný okamžik dokončení; pozdě příchozí nedostane podíl za čas před příchodem ani po dokončení. Construction efektivita se započítává jednou. Král používá původní příkaz move, sesedání a síť sestupů z hotových plošin; střešní nebo přechodová animace neposkytuje pracovní čas.

Funkce budov kontrolují `buildingIsComplete`: ProductionSystem, pracoviště, výběr domova, vstup a pohyb po hradbách. `wallIndex` standardně obsahuje pouze hotové segmenty; plánovač řady používá variantu včetně blueprintů kvůli ochraně již zaplaceného materiálu. Dokončení překreslí původní renderer, aktualizuje terén a spoje a aktivuje pracoviště. ConstructionView má vlastní dočasné základy, lešení a bar postupu nad původním průhledným rendererem; všechny vrstvy respektují culling a Fog of War.

Před dokončovacími callbacky se nastaví complete a rewardsGranted a uvolní rezervace. Původní ExperienceSystem přijímá u buildingCompleted `contributionRatio`, rozděluje tak základní XP pool podle skutečně odpracovaného váženého postupu. Osobní skillové modifikátory včetně talentu platí až na přidělený podíl; celkový základní pool se tím nemění. Zrušení před prací vrátí celý původní materiál, později floor(50 %) každé položky a žádné XP. ID zrušené stavby se znovu nepoužije.

DTO ukládá konstrukční data přímo u budovy a `constructionSystem: {nextId, kingSiteId, kingGoal}`; pracovník má původní workTask s kind build. Validace kontroluje cenu, čas, součet příspěvků, procenta, stav odměny, obousměrné vazby, kapacitu a pracovní místa. Obnova obnoví objekty a reference před první aktivní aktualizací, materiál zůstane zaplacený a odměny se neopakují. Starší dokončené budovy bez konstrukčních dat se nepřevádějí na blueprinty.

## Neměnné historické verze

`public/versions/<full-commit-sha>/` obsahuje hotové historické sestavení včetně všech tehdejších obrázků. Vite je kopíruje do každého nového nasazení beze změny. Tyto soubory se neopravují podle současných definic objektů ani se znovu nepřekreslují aktuálními renderery. Každý snapshot má manifest s původním Git commitem, stromem, datem, výsledkem sestavení/testů/prohlížeče a kontrolními součty. `.gitattributes` zakazuje změny konců řádků těchto artefaktů.

`scripts/build-archive.mjs` exportuje jednotlivé commity do dočasných složek, sestaví je s vlastní Pages cestou, ověří spuštění i grafiku a přidá pouze chybějící snapshoty. Při dalším běhu existující složky jen zkontroluje a nezasahuje do nich. Archivní runtime slouží pouze k oddělení IndexedDB a nastavení podle commitu; herní zdroj se sestavuje z originální historie. `npm run archive:verify` před každým Pages buildem kontroluje shodu všech archivovaných souborů. Nový vývoj patří do `src/`, nikoli do archivovaných bundleů.

GameSettings se nepřepisuje do globální ObjectRegistry. `configuredStats` odvozuje HP/DPS jednotky při jejím vytvoření; načtení obnoví skutečně uložené baseStats. ResourceSpawner má vlastní spawnSettings, takže kapacita jedné hry nemění definice ani další hry.

Pokročilá konfigurace: `GameSettings.js` je jediný zdroj výchozích parametrů/validace/obtížností/populace/intervalů. `WorldGenerationConfig.js` umístí dokončený počáteční hrad před objekty. `WildlifeRespawnSystem.js` používá původní AnimalSystem.create, rezervace a dostupnost mapy. GameTimeSystem drží délku dne na instanci a přesně sčítá čas; WageSystem počítá poměrné náklady proti této délce. Save v2 s migrací v1 ukládá skutečný stav a žádné začáteční bonusy při Load neprovádí.
