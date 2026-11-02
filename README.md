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
npm test          # testy BFS a průchodnosti mapy
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

Mapa má přesně **20 × 15 políček po 32 × 32 px**, tedy 640 × 480 herních pixelů. Na menším displeji se plátno úměrně zmenší. Hráč začíná na souřadnicích `(2, 2)`, počítaných od nuly.

## Struktura

- `index.html` – stránka, kontejner hry a české pokyny.
- `src/main.js` – vytvoření Phaser hry, rozměry a přizpůsobení plátna.
- `src/game/map.js` – mapa (`0` = volno, `1` = překážka), rozměry a převod na středy políček.
- `src/game/pathfinding.js` – BFS nezávislé na vykreslování.
- `src/game/GameScene.js` – geometrické vykreslení, klikání a pohyb hráče.
- `src/game/stones.js` – náhodné rozmístění bez opakování a geometrické vykreslení kamenů.
- `src/game/inventory.js` – počty surovin podle názvu; stejným rozhraním lze později evidovat dřevo, železo nebo zlato.
- `src/style.css` – jednoduché rozvržení stránky.
- `tests/pathfinding.test.js` – nejkratší obchůzka, neplatné a nedosažitelné cíle, platnost cest do všech volných políček.
- `tests/stones.test.js` – pravidla náhodného rozmístění a počítání surovin v inventáři.
- `package-lock.json` – přesné verze pro opakovatelnou instalaci přes `npm ci`.

## Jak to funguje

Kliknutí převede souřadnice myši na políčko pomocí dělení velikostí dlaždice. BFS prochází sousedy ve čtyřech směrech, pamatuje si jejich předchůdce a z nich sestaví nejkratší cestu. Diagonály nepoužívá; všechny kroky mají stejnou délku.

Scéna v každém snímku posune hráče směrem ke středu následujícího políčka. Rychlost 144 px/s se násobí časem snímku, takže nezávisí na FPS. Po dosažení středu pokračuje dalším krokem. Při změně cíle dokončí pouze právě probíhající krok a z jeho konce naplánuje novou cestu. Díky tomu nikdy neřeže roh překážky ani neposkočí. Nedosažitelný cíl zobrazí zprávu a zachová původní cestu.

Pro první úpravy změň rozmístění překážek v `map.js` nebo `speed` v `GameScene.js`. Poloměr hráče ponech menší než polovinu políčka.
