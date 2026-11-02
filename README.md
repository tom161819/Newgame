# První cesta — Královská hlídka

Izometrická 2.5D strategická hra v JavaScriptu s **Phaser 4.2.1** a **Vite 8.3.5**. Vlastní procedurální středověká grafika: písčitá krajina, kamenné překážky, korunovaný král s červeným pláštěm a strážní věže. Bez backendu, databáze a externích obrázků.

**[Hrát v prohlížeči](https://tom161819.github.io/Newgame/)** — bez instalace a přihlášení.

## Ovládání

| Ovládání | Akce |
|---|---|
| Levý klik na průchozí políčko | Král k němu dojde po nejkratší cestě. Další klik změní cíl. |
| Levý klik na kámen | Dojde ke kameni a přičte jej do inventáře. |
| Levý klik na věž nebo její střechu | Dojde k dostupnému sousednímu políčku a vyleze na plošinu. |
| Klik na mapu z věže | Nejprve sleze, potom dojde k cíli. Kámen sebere až po sestupu. |
| WASD nebo šipky | Ručně posouvají kameru a pozastaví její sledování krále. |
| Mezerník nebo „Na krále“ | Znovu zapne plynulé sledování krále. Nový platný příkaz k pohybu ho také obnoví. |
| Kolečko myši nad mapou | Zoom od 0,45× do 1,8×. |
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
- Věž stojí přesně **10 kamenů**, obsadí přesně **2 × 2 logická políčka** a vytvoří neprůchozí překážku pro BFS. Nesmí překrývat kameny, budovy, překážky ani krále a jeho probíhající krok.
- Lze postavit více věží. Výběr stavby zruší zbývající cestu a sběr; už rozběhnutý krok se dokončí plynule. Po postavení jedné věže režim stavění skončí.
- Ke vstupu se vybírá sousední políčko s nejkratší dosažitelnou cestou. Následuje animace lezení, ne přesun z dálky. Král nahoře nechodí po mapě ani nesbírá. Sestup vybere sousední políčko s dostupnou cestou k cíli; pokud takové není, král zůstane nahoře.
- Během animace výstupu a sestupu se nové příkazy nepřijímají. Vstup/výstup lze opakovat, včetně přechodu z jedné věže do druhé.
- Po obnovení stránky začíná nová hra: inventář je nulový, budovy zmizí a kameny se vygenerují znovu. Hra nepřidává boj, nepřátele ani jiné budovy.

## Instalace a spuštění pro vývoj

Potřebuješ **Node.js 22.12+**, doporučeno Node.js 24 LTS, a npm.

```sh
npm ci
npm run dev
```

Otevři adresu vypsanou Vite. V cloudovém prostředí lze použít `npm run dev -- --host 0.0.0.0`.

```sh
npm test                         # souřadnice, BFS, generování, inventář, stavby a stavy krále
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
| `src/game/pathfinding.js` | BFS s číselnými indexy a typed arrays; také hledání dosažitelné oblasti pro generátor. |
| `src/game/PlayerController.js` | Logická desetinná poloha, cesta a stavy `ground`, `enteringTower`, `onTower`, `exitingTower`. |
| `src/game/KingView.js` | Koruna, plášť, končetiny, směry, chůze a klid. Lze nahradit profesionálním spritem bez změny herní logiky. |
| `src/game/stones.js` | Náhodné dosažitelné pozice, dvacetisekundový generátor, limit a vlastní kresba kamene se stínem. |
| `src/game/inventory.js` | Počty surovin podle názvu a bezpečná platba; připraveno i pro další suroviny. |
| `src/game/buildings.js` | Cena, půdorys, validace, blokování mapy a plánování vstupu/výstupu. |
| `src/game/TowerView.js` | Izometrické stěny, plošina, cimbuří, stín, zásah myší a průhledný náhled. |
| `src/game/GameScene.js` | Propojení vstupu, kamery, krále, sběru, generátoru, stavby a UI. |
| `src/ui/BuildingBar.js` | Spodní záložka Buildings, nabídka Tower a dostupnost kamenů. |
| `index.html`, `src/style.css` | Pevné rozhraní kolem mapy. Žádné CSS otáčení herního světa. |
| `tests/` | Testy souřadnic, navigace, generování, časování, limitů, inventáře, stavby a vstupu/výstupu. |

## Souřadnice a pořadí kreslení

Logické rohy políček používají jednotky mřížky; středy jsou `(x + 0.5, y + 0.5)`. Projekce do herního světa je:

```text
worldX = originX + (gridX - gridY) * 32
worldY = originY + (gridX + gridY) * 16
```

Při kliknutí se nejprve odstraní posun a zoom kamery pomocí `camera.getWorldPoint` / `pointer.updateWorldPoint`. Inverzní projekce vrátí logickou polohu, ze které se vezme příslušné políčko. Stejná projekce určuje pohyb, kameny, půdorys i náhled věže. Rychlost krále je **3,5 logického políčka za sekundu** a na zoomu nezávisí.

Objekty se řadí podle promítnuté polohy nohou či přední části základny. Věž má zvlášť zadní část a přední parapet; král na plošině je mezi nimi. Výška objektu proto nemění jeho logickou polohu nebo obsazená políčka.

## Výkon

Existuje celá logická mapa a pathfinding na všech 10 000 políčkách. Šest procedurálních textur země se jednou skládá do bloků **10 × 10 políček**. Vykreslují se jen viditelné bloky s rezervou pro okraje; obrazy bloků i překážek se skrývají a znovu používají. Statický výřez se nepřestavuje každý snímek. Kameny a věže mimo kameru se také nekreslí.

Pro tento procedurální prototyp je vybraný renderer **Phaser Canvas**, který s cache terénu dobře funguje také na strojích bez hardwarové akcelerace WebGL. Místo tisíců objektů země tak scéna kreslí desítky obrazových bloků. Logické kolize a cesta nadále rozlišují každé jednotlivé políčko.

Kamera je omezená obdélníkovými hranicemi promítnutého světa; její střed se navíc drží uvnitř kosočtverce mapy. U okrajů tak lze vidět obrys světa, ale kamerou nelze odjet do nekonečného prázdna. Inventář a Buildings patří do HTML, nikoli do posouvané kamery.

## Zveřejnění a návrat k původní verzi

GitHub Pages je nastavené na **GitHub Actions**. Push do `main` spustí `.github/workflows/pages.yml`: instalaci z lockfilu, testy, build se správnou základní cestou a nasazení. Web je nezávislý na publikování cloudového prostředí Codexu.

Před převodem na izometrii byl vytvořen checkpoint commit **`bf049d5`**. Obsahuje původní funkční verzi se sběrem, inventářem a věžemi; lze jej použít pro porovnání nebo návrat.
