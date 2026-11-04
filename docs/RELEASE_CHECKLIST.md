# Milestone release gate

Automatická vydání M1–M5 jsou uživatelem výslovně zadaná; nový pokyn2026-11-04 ruší dřívější stop po10 a čekání na další release svolení. Po úspěšném gate vydat, ověřit skutečnou publikaci a automaticky pokračovat masterem. Běžné pracovní commity jsou Unreleased. Skript `release:prepare` nadále pouze připravuje soubory; autorizovaný orchestrátor pak provede skutečný Git/publikaci samostatně.

1. Ověřit všechny etapy daného milníku v progress, reálné commity, čistotu rozsahu změn a aktuální verzi/tagy. Nevydávat historická či duplicitní čísla.
2. Spustit plné automatické testy, relevantní integrační scénáře, dostupný browser smoke, New Game, Save/Load aktuálního schématu včetně odmítnutí savu jiného schématu (ALPHA: starší savy se nemigrují), logistiku, rušení staveb, více NPC, FoW a výkon. Zapsat skutečné výsledky a neověřené části.
3. Ověřit `npm run changelog:validate`, `npm run archive:verify` a produkční `npm run build:pages` a `npm run archive:verify-site`. Před milníkovým vydáním potvrdit funkční Pages deploy dokončeného kódu.
4. Připravit MINOR podle skutečné aktuální verze (`0.MINOR.0`), přesunout dokončené Unreleased pomocí existujícího workflow, datum podle Europe/Prague. GameVersion a SaveSchema zůstávají oddělené.
5. Znovu ověřit metadata, UI, změny a build. Commitnout konkrétní release zdroj a z něj skutečný neměnný hratelný archiv, bez přepisu předchozích snapshotů.
6. Publikovat na main a ověřit skutečné Pages Success pro přesný SHA; nový nezaměnitelný tag směřuje na odpovídající commit vydané verze. Zkontrolovat jeho skutečné nahrání a odkazy archivu, nic nevymýšlet.
7. Teprve potom zapsat RELEASED do progress včetně verze, SHA, tagu, archivu a run ID a automaticky pokračovat další etapou. Opravit selhání; při neřešitelném oprávnění/limitaci přesně zaznamenat release kandidáta a blocker, neprohlašovat nevydanou verzi za vydanou.

## Spustitelný postup

Vyžaduje Node dle package.json, úplnou Git historii (`fetch-depth: 0`), `npm ci` a instalovaný Chrome/Chromium a curl. `CHROMIUM_EXECUTABLE` může určit vlastní binárku; `playwright-core` je uzamčen v lockfile. Chybějící prohlížeč znamená chybu, nikoliv přeskočený smoke test.

- Po poslední etapě milníku zveřejni otestovaný vývojový zdroj na main a ověř skutečný Pages run. Progress tabulka musí mít všechny příslušné a předchozí etapy DONE s existujícími implementačními commity.
- `npm run release:gate -- M1 --pages-run=RUN_ID --pages-commit=FULL_DEPLOYED_SHA --report=/tmp/m1-gate.json` ověří čistý checkout, historii, dokončení etap, skutečný Pages Success a shodu nasazených zdrojů. Potom spustí čistou instalaci, validace, všechny testy včetně migrací/logistiky/staveb, SHA-256 archivy, build a skutečný browser/IndexedDB smoke. Nemění číslo, Git ani publikaci. Analogicky M2–M5.
- Teprve po úspěchu proveď `npm run release:prepare -- minor`, validace/testy/build/smoke, commit zdrojů a skutečný tag `v<package version>` na tomto commitu. Číslo se neodvozuje z počtu commitů. Příprava bere datum podle Europe/Prague, pokud není výslovně zadáno jiné.
- `npm run archive:build -- --through=RELEASE_SOURCE_SHA --base=/Newgame/` sestaví skutečný tagovaný zdroj. Export dostává pouze ověřené SHA/datum/tag; uvnitř není další hratelná kopie archivu. Původní snapshoty zůstávají beze změny. Ověř `npm run archive:verify`, commitni přidaný archiv a publikuj main i skutečný tag. Čekej na Pages Success přesného nasazovacího commitu.
- `npm run release:verify -- --pages-run=RUN_ID --pages-commit=FULL_DEPLOYED_SHA --report=/tmp/m1-release.json` ověří skutečný vzdálený tag, jeho přesný source tree, hratelný neměnný archiv, katalog a shodu vydaných a úspěšně nasazených zdrojů. Pak zaznamenej RELEASED s důkazy a pokračuj další etapou.

Gate čte veřejný GitHub Actions run a kontroluje jeho skutečný odkaz na plné SHA a stav nasazení. Přímý přístup k Pages URL není v tomto cloudovém prostředí povolen; lokální produkční smoke ověřuje stejné soubory a serverové nasazení potvrzuje skutečný Actions run. Nezaměňovat síťové omezení s úspěšným HTTP testem veřejné hry.

Samostatné kontroly: `npm run versions:validate`, `npm run changelog:validate`, `npm test`, `npm run archive:verify`, `npm run build -- --base=/Newgame/`, `npm run smoke -- --base=/Newgame/ --full`. Plný smoke zahrnuje skutečný průchod fyzickou výstavbou Granary→Farmhouse, zámky/menu, obnovu blueprintu, zachování starší stavby po ztrátě předpokladu a zrušení nové stavby; běžná varianta bez `--full` rychle ověřuje menu, pohyb, přepravu, Save/Load aktuálního schématu a hlášení nekompatibilního savu ze skutečné archivní verze. Changelog a jeho metadata jsou jediná ručně psaná historie. Katalog vzniká z nich, skutečného Gitu a ověřených snapshotů. `+archive.N` označuje zpětně doložený milník; `+git.FULL_SHA` je technický snapshot, ne další vydání; `+dev.FULL_SHA` označuje aktuální vývoj. Původní package čísla a URL se nepřepisují.

Běžný build po optimalizaci obsahuje jen současnou hru; pro kompletní vydání použij build:pages nebo přidej archive:stage. Preview doplní archivy automaticky. Release gate vždy explicitně skládá a ověřuje celý web; běžné CI používá rozsah browser smoke podle skutečně změněných zdrojů. Viz [ARCHIVE_WORKFLOW.md](ARCHIVE_WORKFLOW.md).
