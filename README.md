# První cesta — Královská hlídka

Izometrická 2.5D strategická hra v JavaScriptu s **Phaser 4.2.1** a **Vite 8.3.5**. Vlastní procedurální středověká grafika: písčitá krajina, kamenné překážky, korunovaný král s červeným pláštěm a strážní věže. Bez backendu a databáze. Vlastní PNG/WebP grafika a náhledy jsou součástí projektu.

**[Hrát v prohlížeči](https://tom161819.github.io/Newgame/)** — bez instalace a přihlášení.

## Ovládání

| Ovládání | Akce |
|---|---|
| Levý klik na průchozí políčko | Král k němu dojde po nejkratší cestě. Další klik změní cíl. |
| Levý klik na koně | Dojde k pohybujícímu se koni a nasedne. Rychlost vzroste přesně na dvojnásobek. |
| Dismount nebo H | Sesedne na volné sousední místo; stejný kůň se vrátí k putování. |
| ⚙ Settings | Zasouvací panel s přepínačem Fog of War. Volba se pamatuje mezi obnoveními stránky. |
| Levý klik na zvíře | Pronásleduje pohybující se zvěř a uloví ji až z dosahu sousedního políčka. |
| Levý klik na maso | Dojde k balíčku a přidá jeho skutečné množství. Najeď myší pro údaj Meat ×N. |
| Levý klik na kámen | Dojde ke kameni a přičte jej do inventáře. |
| Levý klik na věž nebo její střechu | Dojde k dostupnému sousednímu políčku a vyleze na plošinu. |
| Klik na mapu z věže | Nejprve sleze, potom dojde k cíli. Kámen sebere až po sestupu. |
| WASD nebo šipky | Ručně posouvají kameru a pozastaví její sledování krále. |
| Mezerník nebo „Na krále“ | Znovu zapne plynulé sledování krále. Nový platný příkaz k pohybu ho také obnoví. |
| Kolečko myši nad mapou | Zoom od 0,45× do 1,8×. |
| Asset Library | Otevře prohlížeč definic objektů s kategoriemi, náhledy a podrobnými údaji. |
| Buildings → Castle | Náhled hradu 3 × 3 políčka za 10 kamenů; vstup a sestup fungují jako u věže. |
| Buildings → Stone Wall | Kliknutím postaví jeden segment, tažením rovnou řadu v dominantní logické ose. Platí se 1 kámen za nový segment. |
| Buildings → Tower | Zapne náhled stavby 2 × 2 políčka za 10 kamenů. |
| Levý klik v režimu stavění | Postaví věž na platném místě. Zelená = lze stavět, červená = neplatné místo nebo málo surovin. |
| Esc, pravý klik nebo Zrušit | Zruší režim stavění bez platby. |

Horní inventář a spodní Buildings jsou mimo herní kameru a při pohybu nebo zoomu mapy zůstávají na obrazovce. Informace o věži lze otevřít i s prázdným inventářem.

## Mapa, kameny a stavby

- Logická mapa má **100 × 100 políček**. Každé se kreslí jako kosočtverec **64 × 32 px**. Král začíná na `(50, 50)`.
- Při načtení vznikne **30 náhodných kamenů** na různých dosažitelných průchozích políčkách mimo start krále.
- Každých **20 sekund herního času** vznikne jeden nový kámen. Na mapě může současně ležet nejvýše **80 nesebraných kamenů**, včetně těch mimo aktuální obraz kamery.
- Generátor vždy znovu ověří dosažitelnost po změnách mapy. Vynechá budovy, překážky, existující kameny a aktuální i právě procházené políčko krále. Pokud není dostupné místo, daný pokus přeskočí. Po uvolnění limitu pokračuje při dalším dvacetisekundovém intervalu.
- Kameny neblokují pohyb. Sbírá se pouze kámen vybraný kliknutím. Nový levý klik zruší původní požadavek i při neplatném cíli; pravý klik mimo stavění ho nemění.
- Král chodí v **osmi logických směrech**. Diagonála je plynulý přímý úsek, nikoli střídání vodorovných a svislých kroků. Rychlost 3,5 políčka/s se vztahuje k logické délce pohybu: diagonální krok délky √2 trvá odpovídajícím způsobem déle než přímý krok délky 1.
- Cestu hledá **A*** s osmi sousedy a heuristikou octile. Diagonála je povolená pouze tehdy, když jsou průchozí cíl i obě sousední boční políčka. Mezi rohy zdí ani věží proto nelze projít.
- Věž stojí přesně **10 kamenů**, obsadí přesně **2 × 2 logická políčka** a vytvoří neprůchozí překážku pro A*. Nesmí překrývat kameny, budovy, překážky ani krále a jeho probíhající krok; u diagonály se chrání také obě boční políčka.
- Lze postavit více věží, hradů i řad hradeb. Výběr stavby zruší zbývající cestu a sběr; už rozběhnutý krok se dokončí plynule. Po postavení jedné věže režim stavění skončí.
- Ke vstupu se vybírá sousední políčko s nejkratší dosažitelnou cestou. Následuje animace lezení, ne přesun z dálky. Král nahoře nechodí po mapě ani nesbírá. Sestup vybere sousední políčko s dostupnou cestou k cíli; pokud takové není, král zůstane nahoře.
- Během animace výstupu a sestupu se nové příkazy nepřijímají. Vstup/výstup lze opakovat, včetně přechodu z jedné věže do druhé.
- Po obnovení stránky začíná nová hra: inventář je nulový, budovy zmizí a kameny se vygenerují znovu. Zatím používá okamžitý lov bez HP, bojových statistik a penalizací za nedostatek jídla.

## Hrad a hradby

Castle obsadí **3 × 3** neprůchozí políčka a stojí **10 kamenů**. Král k němu přijde po zemi, vystoupí na viditelnou horní plošinu a může z ní znovu sestoupit. Před vstupem z koně automaticky sesedne.

Stone Wall zabírá **1 × 1** a stojí **1 kámen za nový segment**. Držení a tažení levého tlačítka vytvoří náhled rovné řady podle dominantní osy logické mapy. Stavba se potvrdí až uvolněním tlačítka: všechny nové segmenty musí být platné a hráč musí mít na celou řadu. Jinak nevznikne nic a nic se nezaplatí. Existující segmenty hradeb v řadě se použijí bez opakované platby. Po úspěšné řadě režim stavění skončí, stejně jako u ostatních budov.

Sousední segmenty sdílející hranu se vizuálně spojí; cimbuří se vykreslí po vnějším obvodu a změna aktualizuje i sousedy. Fungují konce, rovné úseky, rohy, T i křížení. Zemní navigace přes hradby neprochází.

Kliknutím na hradbu král dojde k dostupnému sousednímu políčku a vyleze. Pak lze klikat na propojené segmenty a chodit po jejich vrcholu. Navigace po hradbách má vlastní síť sdílených hran: diagonálně se dotýkající segmenty ani mezery nelze přejít vzduchem. Klik na nespojenou hradbu vyžaduje sestup a běžnou cestu. Pro návrat na zem se hledá dostupný výstup i na dalších propojených segmentech, takže král nezůstane uvězněný uprostřed velké souvislé konstrukce.

## Zvěř, lov a potrava

Při nové hře vzniknou tři zajíci, tři srny a tři divočáci na různých volných dosažitelných políčkách. Pomalu putují k náhodným blízkým cílům a mezi cestami odpočívají. Sdílí s králem osmisměrné A* i normalizovaný pohyb bez průchodu rohy; nová stavba nesmí překrýt zvíře nebo jeho probíhající krok.

Kliknutí na zvíře zahájí pronásledování se změnami cesty podle pohybu cíle. Lov proběhne až ze sousedství, bez teleportace. Jiný klik lov zruší. Zajíc zanechá balíček 5 masa, srna 10 a divočák 15. Odměna se nepřipíše automaticky: balíček zůstane ležet až do ručního sběru. Stejné suroviny na jednom políčku se sloučí.

Každých 60 sekund aktivní hry se spotřebuje jedno maso, nejvýše do nuly. Horní lišta ukazuje zbývající čas a nenápadné Out of food; hlad zatím nemá žádné další následky. Přehled knihovny nepozastavuje běžící hru.

## Dohled a kůň

Fog of War je ve výchozím stavu **OFF**. Zapíná se v levém panelu Settings. Terén mapy zůstává celý viditelný; mimo aktuální logický dohled se skrývají pouze objekty, včetně skal, budov, surovin a zvěře. Skryté objekty nelze nově vybrat. Jejich pohyb, časovače a ostatní logika pokračují. Posun a zoom kamery dohled nemění.

Dohled pěšího krále je **20 × 20 políček**, na koni **30 × 30**, na horní plošině věže **40 × 40**, na hradě a hradbě **35 × 35**. Bonusy se nesčítají. Král na koni automaticky sesedne před příkazem ke vstupu do věže; pokud pro koně není vhodné sousední políčko, vstup se neprovede. Při nedostatku místa nelze ani ručně sesednout.

Při nové hře vznikne jeden nelovitelný kůň. Kliknutí zahájí pronásledování, nasednutí nastane až zblízka. Jezdec a kůň pak používají králův původní osmisměrný pohyb s rychlostí **7 místo 3,5 políčka/s**; lze dále lovit a sbírat. Nasedání nepřidává další instanci koně. Po sesednutí se obnoví původní rychlost a dohled a na stejného koně lze znovu nasednout.

## Knihovna objektů

Třináct současných typů (grass, dirt, stone, meat, tower, castle, wall, king, rock_outcrop, rabbit, deer, wild_boar, horse) má centrální definice v `src/data/objects/`. Registr kontroluje unikátní ID a platné parametry; stejná cena a půdorys budovy řídí galerii, nabídku Buildings, platbu i kolize. Galerie je pouze prohlížeč a nemění mapu nebo inventář.

`AssetManager` načítá sdílené PNG/WebP textury a spritesheety se správným základem URL pro GitHub Pages. Chybějící obrázek použije procedurální kresbu nebo společný náhradní obrázek. Nová surovina či budova používající stávající mechanismy se přidává definicí a obrázkem; inventář i nabídka se přizpůsobí automaticky. Podrobný postup, origin, vrstvy věže a animace postavy popisuje **[ASSET_GUIDE.md](ASSET_GUIDE.md)**.

## Instalace a spuštění pro vývoj

Potřebuješ **Node.js 22.12+**, doporučeno Node.js 24 LTS, a npm.

```sh
npm ci
npm run dev
```

Otevři adresu vypsanou Vite. V cloudovém prostředí lze použít `npm run dev -- --host 0.0.0.0`.

```sh
npm test                         # souřadnice, A*, směry, generování, inventář, stavby a stavy krále
npm run build                    # produkční soubory do dist/
npm run build -- --base=/Newgame/ # sestavení pro projektovou cestu GitHub Pages
npm run preview                  # místní kontrola produkčního buildu
```

Upozornění Vite na velikost balíčku souvisí s přibaleným Phaserem a nebrání sestavení.

## Struktura projektu

| Soubor | Odpovědnost |
|---|---|
| `src/main.js` | Phaser, velikost plátna podle dostupného místa a spuštění scény. |
| `src/game/config.js` | Velikost mapy, rozměry kosočtverce a start krále. |
| `src/game/map.js` | Logická mapa, původní překážky a průchodnost. Budovy se zapisují jen do kopie mapy konkrétní hry. |
| `src/game/isometric.js` | Projekce, inverze, středy/polygony políček a hranice světa. |
| `src/game/TerrainRenderer.js` | Sdílené textury terénu, cache bloků 10 × 10 a fond viditelných bloků/překážek kolem kamery. |
| `src/game/WorldCamera.js` | Plynulé sledování, WASD/šipky, zoom a omezení hranic. |
| `src/game/pathfinding.js` | Osmisměrné A* s minimální haldou, cenami 1/√2 a zákazem průchodu rohy; také hledání dosažitelné oblasti pro generátor. |
| `src/game/PlayerController.js` | Logická desetinná poloha, cesta a stavy `ground`, `enteringTower`, `onTower`, `onWall`, `exitingTower`. |
| `src/game/directions.js` | Osm názvů logických směrů a jejich převod na izometrické pózy. |
| `src/game/KingView.js` | Koruna, plášť, končetiny a osm odlišných natočení s chůzí a klidem. Lze nahradit profesionálním spritem bez změny herní logiky. |
| `src/game/stones.js` | Náhodné dosažitelné pozice, dvacetisekundový generátor, limit a vlastní kresba kamene se stínem. |
| `src/game/inventory.js` | Počty surovin podle názvu a bezpečná platba; připraveno i pro další suroviny. |
| `src/game/buildings.js` | Cena, půdorys, validace, blokování mapy a plánování vstupu/výstupu. |
| `src/game/walls.js` | Atomická stavba řad, propojení podle sousedů a samostatná navigace/výstupy po vrcholu hradeb. |
| `src/game/FortificationView.js` | Parametrická geometrie hradu a spojených hradeb s předním/zadním cimbuřím. |
| `src/game/TowerView.js` | Izometrické stěny, plošina, cimbuří, stín, zásah myší a průhledný náhled. |
| `src/game/GameScene.js` | Propojení vstupu, kamery, krále, sběru, generátoru, stavby a UI. |
| `src/data/objects/` | Datové definice terénu, surovin, budov, postav, dekorací a zvířat, včetně jediné ceny věže. |
| `src/systems/ObjectRegistry.js` | Validace a vyhledávání neměnných definic. |
| `src/systems/AssetManager.js`, `SpriteViews.js` | Sdílené obrázky/animace, fallback, origin a obecné sprite pohledy. |
| `src/ui/BuildingBar.js`, `InventoryBar.js` | Nabídka a inventář sestavené z registru objektů. |
| `src/systems/AnimalSystem.js`, `HuntingSystem.js` | Spawn a pohyb zvěře, zaměření, pronásledování a samostatná funkce lovu. |
| `src/systems/DropSystem.js`, `FoodSystem.js` | Obecné balíčky s množstvím, slučování, ruční sběr a pravidelná spotřeba potravy. |
| `src/game/movement.js` | Společný krok pohybu pro krále i zvěř. |
| `src/systems/FogOfWarSystem.js`, `VisibilityModifiers.js` | Logický čtverec dohledu a nesčítané bonusy koně a budov. |
| `src/systems/MountSystem.js`, `src/ui/SettingsPanel.js` | Nasedání/sesedání bez duplicit, levé nastavení s bezpečným localStorage. |
| `src/ui/AssetGallery.js` | Prohlížeč knihovny s filtry a detailem. |
| `index.html`, `src/style.css` | Pevné rozhraní kolem mapy. Žádné CSS otáčení herního světa. |
| `tests/` | Testy souřadnic, navigace, generování, časování, limitů, inventáře, stavby a vstupu/výstupu. |

## Souřadnice a pořadí kreslení

Logické rohy políček používají jednotky mřížky; středy jsou `(x + 0.5, y + 0.5)`. Projekce do herního světa je:

```text
worldX = originX + (gridX - gridY) * 32
worldY = originY + (gridX + gridY) * 16
```

Při kliknutí se nejprve odstraní posun a zoom kamery pomocí `camera.getWorldPoint` / `pointer.updateWorldPoint`. Inverzní projekce vrátí logickou polohu, ze které se vezme příslušné políčko. Stejná projekce určuje pohyb, kameny, půdorys i náhled věže. Rychlost krále je **3,5 logického políčka za sekundu** a na zoomu nezávisí.

Natočení se určuje z posledního skutečného logického vektoru pohybu. Například logické `NE` se na obrazovce promítá doprava, `SE` dolů a `NW` nahoru. Vzhled nabízí čelní, zadní, profilové i částečně otočené pózy; končetiny se při chůzi pohybují ve směru jejich projekce. Při zastavení zůstane poslední natočení zachované. Nový příkaz uprostřed úseku nejprve dokončí tento úsek a další cestu naplánuje z jeho konce, bez poskočení.

Výběr vstupu a výstupu věže porovnává skutečnou délku cesty s diagonálami, nikoli pouhý počet políček. Testy kontrolují i shodu A* s nezávislou Dijkstrou, všechny čtyři rohy věže, normalizovanou rychlost a ochranu rohů během stavění.

Objekty se řadí podle promítnuté polohy nohou či přední části základny. Věž má zvlášť zadní část a přední parapet; král na plošině je mezi nimi. Výška objektu proto nemění jeho logickou polohu nebo obsazená políčka.

## Výkon

Existuje celá logická mapa a pathfinding na všech 10 000 políčkách. Šest procedurálních textur země se jednou skládá do bloků **10 × 10 políček**. Vykreslují se jen viditelné bloky s rezervou pro okraje; obrazy bloků i překážek se skrývají a znovu používají. Statický výřez se nepřestavuje každý snímek. Kameny a věže mimo kameru se také nekreslí.

Pro tento procedurální prototyp je vybraný renderer **Phaser Canvas**, který s cache terénu dobře funguje také na strojích bez hardwarové akcelerace WebGL. Místo tisíců objektů země tak scéna kreslí desítky obrazových bloků. Logické kolize a cesta nadále rozlišují každé jednotlivé políčko.

Kamera je omezená obdélníkovými hranicemi promítnutého světa; její střed se navíc drží uvnitř kosočtverce mapy. U okrajů tak lze vidět obrys světa, ale kamerou nelze odjet do nekonečného prázdna. Inventář a Buildings patří do HTML, nikoli do posouvané kamery.

## Zveřejnění a návrat k původní verzi

GitHub Pages je nastavené na **GitHub Actions**. Push do `main` spustí `.github/workflows/pages.yml`: instalaci z lockfilu, testy, build se správnou základní cestou a nasazení. Web je nezávislý na publikování cloudového prostředí Codexu.

Před převodem na izometrii byl vytvořen checkpoint commit **`bf049d5`**. Obsahuje původní funkční verzi se sběrem, inventářem a věžemi; lze jej použít pro porovnání nebo návrat.

Před zavedením Asset Library vznikl checkpoint **`4d3d63f`** s funkčním osmisměrným pohybem.

Fronta dalších zadaných úkolů a jejich původní znění jsou v **[docs/TASK_QUEUE.md](docs/TASK_QUEUE.md)**.
