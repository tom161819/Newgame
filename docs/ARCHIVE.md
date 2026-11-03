# Archiv historických verzí

Archiv je na **https://tom161819.github.io/Newgame/versions/**. Aktuální hra zůstává na **https://tom161819.github.io/Newgame/**. Odkazy v menu i spodní liště otevírají novou záložku.

První archiv obsahuje 36 skutečných commitů hlavní vývojové historie od `7291dc3` po `e104791`, včetně kontrolních bodů. Každý prošel svými původními testy, vlastním Vite buildem a spuštěním v Chromium. Kontrolovaly se vstupní stránka, vykreslená mapa, načítané obrázky a chyby HTTP či JavaScriptu. Nevydané pracovní stash commity se nepublikují.

Po dokončení kroků 18b a 19 byl archiv rozšířen na **41 verzí**, nejnovější je `f22ded0` (pokročilá konfigurace světa). Dřívější snapshoty zůstaly beze změny.

## Co je neměnné

Každá verze má adresu `versions/<celý-commit-sha>/` a vlastní soubory v `public/versions/<celý-commit-sha>/`. `snapshot.json` zaznamenává commit, Git tree, datum, popis, výsledky kontrol a SHA-256 každého herního souboru.

Historická hra se exportuje příkazem `git archive` z daného commitu do dočasné složky, testuje a sestaví s vlastní URL. Současný checkout se nepřepíná ani nepřepisuje. Při archivování dalšího commitu se ze zdrojového exportu odstraní již existující složka archivů, aby nevznikaly vnořené kopie.

Existující snapshot se při dalším běhu pouze zkontroluje a přeskočí. `npm run archive:verify` odmítá chybějící či změněné soubory, neúplný seznam a změnu nebo smazání již sledovaného snapshotu. Pages kontrola má dva commity historie, aby mohla porovnat novou verzi s předchozí. Změny přehledu a přidání nového adresáře jsou povolené.

Artefakty jsou záměrně uložené v Git. Běžný Vite build je kopíruje beze změny do dalšího nasazení; nepotřebuje minulý artefakt, cache ani zvláštní publikační větev. `.gitattributes` zachovává přesné bajty i při checkoutu na jiném systému.

## Uložené hry

Malý nasazovací skript před spuštěním historické hry oddělí IndexedDB a nastavení podle celého commitu. Herní zdroje a mechaniky zůstávají z původní verze. Starší Save/Load tak nečte ani nepřepisuje aktuální pozice; jednotlivé historické verze také nesdílejí svá úložiště. Aktuální hra si zachovává původní databázi.

## Přidání dalších verzí

Vyžaduje úplnou historii Git, Node.js, nainstalované závislosti a Playwright s Chromium. Tento krok se provádí ve vývojovém prostředí; pro hraní uživatel nic nestahuje.

```bash
npm ci
npm run archive:build -- --base /Newgame/ --through HEAD
npm run archive:verify
npm test
npm run build -- --base=/Newgame/
```

Pokud Playwright a prohlížeč poskytuje prostředí mimo projekt, použij proměnné `PLAYWRIGHT_MODULE` s cestou k modulu a `CHROMIUM_EXECUTABLE` s cestou k prohlížeči. Generátor nevkládá další závislosti do starých commitů. Využívá stejné již nainstalované závislosti pouze při shodném lockfile; pro odlišný lockfile připraví samostatnou dočasnou instalaci.

Po ověření přidej nové snapshoty, přehled a manifest do dalšího commitu. Neupravuj soubory v již existujících adresářích jednotlivých verzí. Nové úpravy hry patří do současného `src/`.
