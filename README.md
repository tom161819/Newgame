# První cesta

Jednoduchý 2D top-down prototyp pro výuku JavaScriptu a Phaseru. Používá Phaser **4.2.1** a Vite **8.3.5** (stabilní verze při vytvoření). Bez backendu, databáze a externích obrázků.

## Instalace a spuštění

Potřebuješ Node.js **22.12+** (doporučeno Node.js 24 LTS) a npm.

```sh
npm ci
npm run dev
```

Otevři adresu vypsanou Vite v terminálu. V cloudovém prostředí lze server spustit příkazem `npm run dev -- --host 0.0.0.0`.

```sh
npm test          # testy BFS, surovin, stavby a pohybu mezi mapou a věží
npm run build    # produkční soubory do dist/
npm run preview  # lokální kontrola produkčního buildu
```

Vite může při buildu upozornit na velikost balíčku: prototyp zahrnuje celý Phaser. Upozornění nebrání sestavení.

## Hraní v prohlížeči přes GitHub Pages

Pro hraní bez instalace je připraven postup v `.github/workflows/pages.yml`.
Samotná přítomnost tohoto souboru hru ještě nezveřejňuje.

Po schválení veřejného zveřejnění:

1. Nahraj projekt do větve `main` repozitáře `tom161819/Newgame`.
2. Na GitHubu otevři **Settings → Pages** a jako **Source** nastav **GitHub Actions**.
3. V záložce **Actions** otevři **Publish game to GitHub Pages** a spusť **Run workflow**, pokud poslední běh neproběhl úspěšně. Další změny v `main` už spustí publikování automaticky.
4. Po úspěšném dokončení otevři adresu webu uvedenou v **Settings → Pages** nebo u nasazení `github-pages`.

Hra i kód budou veřejné. Hráčům stačí odkaz a webový prohlížeč; nepotřebují účet, Node.js ani stahovat projekt. GitHub Pages je nezávislé na publikování cloudového prostředí Codexu.

Workflow používá Node.js 24, instaluje závislosti z lockfilu, spouští testy a sestavuje hru se správnou cestou k souborům. Stejný build pro projektovou adresu lze lokálně ověřit příkazem `npm run build -- --base=/Newgame/`.

## Ovládání

Levým tlačítkem klikni na volné políčko. Modrý kruh se plynule přesune do jeho středu a obejde šedé překážky. Další kliknutí změní cíl i za pohybu. Pravé tlačítko a kliknutí mimo mapu či na překážku nemění cestu.

Při každém načtení hry se náhodně rozmístí **15 kamenů** na různá volná políčka mimo start hráče. Kliknutím na kámen zahájíš cestu k němu. Po příchodu do středu jeho políčka zmizí a horní inventář se okamžitě zvýší o jeden kámen. Kameny jsou kreslené geometricky: tři šedé plochy a stín jim dávají prostorový vzhled. Stávající mapa a pohled shora zůstávají zachované.

Každý další levý klik do mapy zruší předchozí požadavek na sběr, včetně kliknutí na překážku či nedosažitelný cíl. Pokud nový cíl není platný, původní pohyb se dokončí, ale původní kámen se nesebere. Pravé tlačítko požadavek nemění. Nedosažitelný kámen zůstane na místě. Kameny neblokují cestu a pouhé projití přes jiný, nevybraný kámen ho nesebere. Inventář po obnovení stránky začíná znovu od nuly; ukládání ani další suroviny zatím nejsou přidané.

Mapa má přesně **20 × 15 políček po 32 × 32 px**, tedy 640 × 480 herních pixelů. Nad mapou je navíc 56 px pro střechy věží u severního okraje; celé plátno proto měří 640 × 536 px. Na menším displeji se úměrně zmenší. Hráč začíná na souřadnicích `(2, 2)`, počítaných od nuly.

## Buildings a Tower

1. Nasbírej alespoň **10 kamenů**.
2. Ve spodní liště otevři **Buildings** a vyber **Tower**. Informace i náhled si můžeš otevřít také bez dostatku surovin; samotná stavba pak neprojde.
3. Myší vyber levé horní políčko půdorysu **2 × 2**. Náhled se přichytává k mřížce. Zelená znamená platné místo i dostatek surovin, červená neplatné umístění nebo nedostatek kamenů.
4. Levým kliknutím potvrď. Odečte se přesně 10 kamenů a režim stavění skončí. Neplatný pokus nic nestojí. **Esc**, **pravý klik** nebo **Zrušit** ukončí stavění bez platby.

Věž nelze postavit přes překážku, jinou budovu, kámen, hráče ani právě dokončovaný krok. Výběr stavby zruší zbytek naplánované cesty a sběr; probíhající krok hráč plynule dokončí. Obsazená čtyři políčka jsou neprůchozí a BFS hledá cestu kolem nich. Postavené věže jsou samostatné objekty s vlastní pozicí, identifikátorem a půdorysem.

Klikni na postavenou věž nebo její plošinu. Hráč dojde k dostupnému sousednímu políčku po nejkratší cestě a potom animovaně vyleze nahoru. Z dálky se nepřesouvá skokem. Na plošině nechodí po mapě a nesbírá. Kliknutím na volné políčko nebo kámen nejprve sleze na dostupné sousední políčko a až pak pokračuje. Pokud neexistuje dostupný výstup s cestou k cíli, zůstane nahoře. Kliknutí na jinou věž naplánuje sestup, chůzi a vstup do druhé věže. Během samotného lezení a slézání se další příkazy nepřijímají, aby se animace nepřerušila do neplatného stavu.

Věže používají procedurální stěny, plošinu, žebřík a cimbuří. Pořadí překrývání vychází z pozice základny; hráč na plošině se kreslí mezi zadní částí a předním parapetem. Stávající mřížka i její pohled zůstávají zachované.

Systém podporuje více věží, pokud má hráč dost kamenů. Na současné mapě je stále původních **15 kamenů**, takže běžná hra zatím umožní jednu věž a zůstane 5 kamenů. Žádné nové zdroje ani obnovování kamenů nejsou přidané. Po obnovení stránky zmizí také budovy a inventář začíná znovu od nuly.

## Struktura

- `index.html` – stránka, kontejner hry a české pokyny.
- `src/main.js` – vytvoření Phaser hry, rozměry a přizpůsobení plátna.
- `src/game/map.js` – mapa (`0` = volno, `1` = překážka), rozměry a převod na středy políček.
- `src/game/pathfinding.js` – BFS nezávislé na vykreslování.
- `src/game/GameScene.js` – propojení mapy, klikání, sběru, stavby a uživatelského rozhraní.
- `src/game/PlayerController.js` – původní plynulý pohyb a stavy `ground`, `enteringTower`, `onTower`, `exitingTower`.
- `src/game/buildings.js` – cena a půdorys věže, validace umístění, blokování mapy a plánování vstupu/výstupu.
- `src/game/TowerView.js` – procedurální věž, náhled, zásah myší a pořadí překrývání.
- `src/ui/BuildingBar.js` – spodní záložka Buildings, nabídka Tower a dostupnost surovin.
- `src/game/stones.js` – náhodné rozmístění bez opakování a geometrické vykreslení kamenů.
- `src/game/inventory.js` – počty surovin podle názvu; stejným rozhraním lze později evidovat dřevo, železo nebo zlato.
- `src/style.css` – jednoduché rozvržení stránky.
- `tests/pathfinding.test.js` – nejkratší obchůzka, neplatné a nedosažitelné cíle, platnost cest do všech volných políček.
- `tests/stones.test.js` – pravidla náhodného rozmístění a počítání surovin v inventáři.
- `tests/buildings.test.js` – platba, půdorys, překážky, více věží a dosažitelnost vstupu/výstupu.
- `tests/player.test.js` – postupné stavy chůze a lezení, zákaz sběru nahoře a opakovaný vstup/výstup.
- `package-lock.json` – přesné verze pro opakovatelnou instalaci přes `npm ci`.

## Jak to funguje

Kliknutí převede souřadnice myši na políčko pomocí dělení velikostí dlaždice. BFS prochází sousedy ve čtyřech směrech, pamatuje si jejich předchůdce a z nich sestaví nejkratší cestu. Diagonály nepoužívá; všechny kroky mají stejnou délku.

`PlayerController` v každém snímku posune hráče směrem ke středu následujícího políčka. Rychlost 144 px/s se násobí časem snímku, takže nezávisí na FPS. Po dosažení středu pokračuje dalším krokem. Při změně cíle dokončí pouze právě probíhající krok a z jeho konce naplánuje novou cestu. Díky tomu nikdy neřeže roh překážky ani neposkočí. Nedosažitelný cíl zobrazí zprávu a zachová původní cestu.

Pro první úpravy změň rozmístění překážek v `map.js` nebo `speed` v `PlayerController.js`. Poloměr hráče ponech menší než polovinu políčka. Cena věže je v `buildings.js` jako `TOWER_COST`.
