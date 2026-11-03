# MEDIEVAL KINGDOM – MASTER PROMPT PRO AUTONOMNÍ REALIZACI 15 ETAP

## Úkol

Jsi Codex vývojář existující browserové 2.5D izometrické hry Medieval Kingdom, postavené na Phaseru a spravované přes Git. Máš postupně realizovat původní kroky 25–37 v přesně určeném novém pořadí, rozdělené do **15 etap** a **5 vydavatelných milníků**. Všechna zadání jsou součástí jednoho souvislého vývojového úkolu. **Pracuj automaticky od etapy 01 až po etapu 15 bez vyžadování příkazu „pokračuj“ či potvrzování po jednotlivých etapách, pokud to aktuální vykonávací prostředí dovolí.** Každou etapu ale vyvíjej a ověřuj zvlášť; nikdy vše neimplementuj jedním obřím commitem.

**ZÁSADNÍ PRAVIDLO AUTOMATICKÉHO PRŮCHODU:** Připrav a do repozitáře ulož `docs/UPGRADE_ROADMAP_25_37.md`, `docs/UPGRADE_PROGRESS.md` a samostatné specifikace všech etap z tohoto dokumentu. Prozkoumej projekt, ověř výchozí build a **zahaj etapu 01 / původní krok 29A**. Po úspěšném testování a commitu **bez dalšího vyzvání přejdi na etapu 02**, analogicky až do etapy 15. Postupuj vždy sekvenčně; nezačínej dvě etapy současně. Po každé etapě aktualizuj `docs/UPGRADE_PROGRESS.md` a příslušné testovací výsledky. Po konci milníku vždy proveď release gate. Při skutečné nevyřešené blokaci, neúspěšném testu, nemožnosti pokračovat kvůli oprávněním či limitům prostředí se zastav bezpečně, zaznamenej přesný stav a požadované kroky pro obnovení; **nepřeskakuj problematickou etapu a netvrď, že jsi pokračoval na pozadí**.

Tento postup je záměrný: velký jednorázový zásah do ekonomiky, AI, dopravy a Save/Load by zvyšoval riziko regresí. Proto pokračuj automaticky, ale po **malých, důsledně testovaných a commitovaných etapách**. Jestliže jedna relace Codexu narazí na systémový limit délky, nelze zaručit nepřetržitý běh: ulož maximum ověřitelného stavu, přesný checkpoint a instrukce k bezpečnému obnovení. Nepředstírej, že běží samostatný agent mimo skutečně dostupnou relaci.

## Přesné pořadí implementace

| Etapa | Původní krok | Zadání | Milník | Soubor |
|---:|---:|---|---|---|
| 01 | 29A | Version Archive, Changelog & Release Foundation | M1 | `01_29A_version_archive_changelog.md` |
| 02 | 36 | Building Categories & Unlock Requirements | M1 | `02_36_building_categories_unlocks.md` |
| 03 | 33 | Seasons ON/OFF | M1 | `03_33_seasons_switch.md` |
| 04 | 28 | Circular Fog of War & Map Memory | M1 | `04_28_fog_of_war_map_memory.md` |
| 05 | 30 | Population Sidebar & Skill Sorting | M1 | `05_30_population_sidebar.md` |
| 06 | 32 | Missing Workers Indicator | M1 | `06_32_missing_workers_indicators.md` |
| 07 | 25 | Forestry & Natural Resources | M2 | `07_25_forestry_natural_resources.md` |
| 08 | 31A | Extended Zoom Out | M2 | `08_31A_extended_zoom.md` |
| 09 | 31B | Daily Resource Statistics & Ledger | M2 | `09_31B_daily_resource_statistics.md` |
| 10 | 35 | Quarry Placement & Iron Smelter | M2 | `10_35_quarry_iron_smelter.md` |
| 11 | 37 | Stone Pavement & Courtyards | M3 | `11_37_stone_pavement.md` |
| 12 | 34 | Wheelwright, Wagons, Stables & Housing | M3 | `12_34_wheelwright_stables_housing.md` |
| 13 | 26 | Villager Needs & Happiness | M4 | `13_26_villager_needs_happiness.md` |
| 14 | 27 | Merchants, Caravans & Trade | M4 | `14_27_merchants_trade.md` |
| 15 | 29B | Background Simulation & Catch-up | M5 | `15_29B_background_simulation.md` |

## Vydavatelné milníky

| Milník | Obsah | Etapy | Politika |
|---|---|---|---|
| M1 | Rozhraní, svět a pravidla hry | 01, 02, 03, 04, 05, 06 | MINOR release až po úspěšném release gate |
| M2 | Zdroje, ekonomika a železo | 07, 08, 09, 10 | MINOR release až po úspěšném release gate |
| M3 | Cesty a doprava | 11, 12 | MINOR release až po úspěšném release gate |
| M4 | Obyvatelstvo a obchod | 13, 14 | MINOR release až po úspěšném release gate |
| M5 | Simulace na pozadí a stabilizace | 15 | MINOR release až po úspěšném release gate |

# Režim provádění: automatický, sekvenční, bez potvrzování mezi etapami

- Tento dokument je **jediné hlavní zadání**. Není třeba k němu přikládat duplicitní `.txt` soubor stejného obsahu.
- Nejprve ulož do repozitáře všech 15 specifikací a manifest pořadí. Nevkládej je pouze do kontextu, který může být zkrácen při delší práci.
- Po každé úspěšné etapě ihned začni další. **Nečekej na lidské „pokračuj“ ani na souhlas s běžnými implementačními volbami** v rozsahu zadání.
- Testy a integrace jsou tvrdá brána. Při selhání oprav a přetestuj, neobcházej testy, neskrývej výsledky, nepokračuj s rozbitou hrou.
- Při neodstranitelném blockeru (chybějící přístup, nerozhodnutelné zadání, dlouhodobě selhávající test nebo vyčerpaný limit běhu) zachovej rozpracovaný stav bezpečně, zapiš checkpoint a zastav se. Nezavazuj se k neexistujícímu běhu mimo aktuální relaci.
- Průběžné reporty ukládej do `docs/UPGRADE_PROGRESS.md`; pokud prostředí podporuje průběžné textové zprávy, můžeš hlásit dokončené milníky, ale **nepřerušuj kvůli tomu realizaci**.

# Společná pravidla realizace a kvality – závazná pro každou etapu

1. Nezakládej nový projekt. Prozkoumej skutečný stav repozitáře a předchozí implementace; plán není důkaz, že funkce existuje. Nedělej paralelní registry, inventáře, úložiště ani duplicitní NPC/AI systém.
2. Nejdříve ověř výchozí build, existující testy a Git stav. Před první změnou zachovej bezpečný obnovitelný bod (commit pouze pokud jsou vlastní změny a je to bezpečné; nikdy svévolně necommituj cizí neuloženou práci). Pracuj v současné větvi, pokud projekt nemá jiné pravidlo.
3. Změny implementuj v malých ověřitelných dávkách; po každé fázi spusť dostupné testy, lint/typecheck/build, a krátký smoke test hry. Chybějící testovací infrastrukturu rozšiř rozumně, nevymýšlej falešný zelený výsledek.
4. Povinné invarianty: bez duplikace či ztráty surovin; přiřazení pracovníka max. jednou; kapacity ne do mínusu; žádné dvojí zpracování obchodních/výrobních transakcí; žádný únik aktuálních informací přes Fog of War; uložené hry kompatibilní nebo migrace podle Save Schema Version; žádné uvízlé rezervace.
5. Testuj minimálně: New Game, Save/Load (včetně staršího formátu), dokončení/rušení stavby, fyzickou logistiku, více NPC, FoW, plynulost při zoom out a relevantní specifické scénáře z této etapy. Pokud je dostupný Playwright nebo obdobný nástroj, použij i end-to-end smoke; jinak přesně vypiš neověřené UI testy.
6. Každou dokončenou ověřenou etapu/fázi zaznamenej do `CHANGELOG.md` sekce `Unreleased` a do `docs/UPGRADE_PROGRESS.md`. Vytvoř smysluplný Git commit; nevytvářej novou veřejnou verzi pro každý commit. Stav označ `DONE`, `PARTIAL` nebo `BLOCKED` s přesným důvodem.
7. **Release gate:** po poslední etapě milníku proveď integrační regresní test, ověř produkční build, Save/Load, nejdůležitější herní smyčku, žádné duplicity a funkční GitHub Pages deploy. POUZE při úspěchu zvyš MINOR v pre-1.0 semver (`0.MINOR.0`), případně PATCH pro samostatnou opravu chyby. Respektuj aktuální číslo i případné existující verze. Přesuň ověřené položky z Unreleased pod konkrétní vydanou verzi, sjednoť metadata verzí, vytvoř nezaměnitelný Git tag a skutečný neměnný archiv spustitelného buildu, pokud to práva a nasazení umožňují. Nikdy nevymýšlej historické verze nebo dostupné URL. Když publikace není možná, připrav release kandidáta, napiš konkrétní překážku a netvrď, že proběhl release.
8. GitHub Push / vytvoření tagu / deployment prováděj pouze se skutečnými oprávněními a podle existujících pravidel repozitáře. Neprováděj force-push ani přepis Git historie.
9. Po dokončení každé etapy zapiš krátký strukturovaný report do `docs/UPGRADE_PROGRESS.md`: co se změnilo, jaké testy prošly/neprošly, Git commit, stav milníku a číslo další etapy. **Pokud je etapa DONE a neexistuje blocker, bez dotazu automaticky pokračuj další etapou.** Finální zprávu pro uživatele vrať až po dokončení všech 15 etap, případně při skutečné blokaci nebo při limitu relace. Na začátku každé další etapy znovu čti plán a progress, aby bylo možné práci bezpečně obnovit.
10. Pokud etapa závisí na funkcionalitě, která chybí, přidej nejmenší kompatibilní integraci nebo nahlas blokaci. Nikdy nepředstírej splněné testy či dokončenou funkci. Priorita je funkční hra, ne počet commitů.


## Rozhodnutí, která řeší konflikty starších promptů (závazná)

1. **Quarry:** nové kamenolomy 3×3 lze založit pouze s překryvem alespoň 1 skutečného skalního políčka / finite stone_deposit a průchozím pracovním přístupem. Musí těžit z jednoznačně přiřazené konečné zásoby. Žádné automatické přepnutí na ložiska v okolí a žádná nekonečná alternativa přes volně ležící kameny. Existující legacy Quarry ze starého savu zůstávají zachované; nové pravidlo musí být implementováno už v etapě 25 a etapa 35 jej pouze doladí.
2. **House:** kapacita = 5 trvalých obyvatel na dokončený dům. Ve Villager Needs (26) nepoužívej starou hodnotu 4; migrace/save musí být kompatibilní. Při smrti záznam není aktivním obyvatelem.
3. **Iron Bar:** etapa 35 vytváří Iron Bar smeltováním 3 Iron Ore + 2 Wood -> 1 Iron Bar / 40 s. Teprve poté etapa 34 zavádí recepty pro trakaře (10 Wood + 2 Iron Bars) a koňské povozy (30 Wood + 6 Iron Bars + 1 ochočený a rezervovaný kůň). Iron Ore nelze zaměňovat za hotové železo. Kůň není spotřebovaná surovina.
4. **Fog of War:** krok 28 určuje poslední známou statickou mapu. Lesnictví, růst stromů, objekty, Quarry, vozidla, silnice, Population Locate a indikátory pracovníků NESMÍ používat živá data jako vizuální informaci v EXPLORED mimo VISIBLE. Dynamické NPC se mimo dohled nezobrazují. UNEXPLORED zůstane černé.
5. **Populace:** záznam mrtvého zůstane 3 celé herní dny v oddělené `Recent Deaths` sekci s přeškrtnutým portrétem a lebkou. Nesmí se počítat mezi živé, v pracovních kandidátech, kapacitě domu ani souhrnu.
6. **Systémy bez duplicity:** centrální Job/Skill/Building/Asset Registry, pouze autoritativní Inventory/Logistics/Transaction Ledger, jediný Game Time, jediný zdroj nastavení Seasons, jediné pravé Population UI, jedna Map Memory, jeden Save Schema; pro různé typy vozů použij sdílený Pathfinding a collision handling. Pokud funkce není v aktuálním kódu, neopírej se pouze o to, že byla napsaná v dřívějším promptu.
7. **Obchodní karavany:** jejich vlastní cizí povoz ani kůň NESMÍ být odečten ze stájí ani inventáře hráče; využívají jen společnou trasovací a kolizní infrastrukturu.
8. **Kategorie:** od etapy 36 připrav i kategorii Infrastructure, kterou pak etapa 37 naplní dlažbou. Odemykání jídla: Granary -> Farmhouse -> Wheat Field a Orchard, vždy podle skutečně dokončené budovy.
9. **Resource Ledger:** v etapě 31B rozliš výrobu/spotřebu/obchod od rezervací a interní přepravy; poslední dokončený herní den, tooltip income+expense, 30d historie a integrita transaction IDs. Pozdější etapy 35/34/27 jej rozšiřují, nikoliv nahrazují.
10. **Background:** `Run in Background OFF` znamená pauzu skryté karty. `ON` znamená bezpečný catch-up dle uplynulého času a skutečné simulace při návratu, protože prohlížeč může omezit timers. Maximum 15 minut na jeden catch-up; žádná neohlášená offline simulace po úplném zavření prohlížeče.

## Kritéria průběžného dokončení

- Každá etapa má implementovaný skutečný end-to-end herní scénář, odpovídající testy a funkční build.
- Žádná nová nestabilní funkce nenarušuje existující gameplay. Při regresi přeruš etapu, oprav chybu, jinak nahlas `BLOCKED` a nenavazuj další etapou.
- S každým milníkem se provádí release check: automatické testy + dostupný browser smoke + manuálně ověřitelné scénáře; release v0.MINOR.0 pouze po úspěšné kontrole, s reálným označeným buildem a changelogem.
- Po `M1` ověř hlavně UI, Fog/Memory a Save/Load; po `M2` surovinové cykly, Quarry, Iron Smelter a denní statistiky; po `M3` přepravu bez duplicit, koně, stáj a změněnou Housing Capacity; po `M4` potřeby NPC, migraci a obchodní objednávky; po `M5` background catch-up versus foreground.
- Mezi fázemi není nutné publikovat nefunkční rozpracovanou verzi; pracovní commity do Unreleased jsou v pořádku.

## Postup pro každou automaticky navazující etapu

1. Pročti `docs/UPGRADE_ROADMAP_25_37.md`, `docs/UPGRADE_PROGRESS.md`, soubor konkrétní etapy a aktuální kód.
2. Podle skutečných zdrojových souborů navrhni stručný plán dílčích změn. Neimplementuj budoucí etapy předčasně, kromě minimální kompatibilní vrstvy nutné pro tuto etapu.
3. Implementuj, spusť automatické testy a dostupné build/lint kroky, ověř Save/Load a regression smoke. V případě slabé test coverage vytvoř alespoň relevantní unit/integration scénáře.
4. Dokonči etapu, uprav Changelog/progress, vytvoř Git commit a do progress souboru připiš seznam testů a krátký popis. Pokud jde o opravitelné chyby, oprav je a znovu otestuj v rámci aktuální etapy. Při neodstranitelné blokaci přesně zaznamenej důvod, skonči bezpečně a nepřeskakuj dopředu.
5. Pokud jsi uzavřel celý milník, proveď release gate a jen při úspěchu číslo MINOR release + odpovídající Git tag / playable archive; neprohlašuj release bez skutečných artefaktů.
6. Pokud jsou kontrolní podmínky splněny, automaticky načti další nedokončenou etapu a začni ji implementovat. Po etapě 15 a úspěšném závěrečném release gate vrať souhrnný report. Nepotřebuješ žádné potvrzení mezi etapami.

---

# DETAILNÍ SPECIFIKACE JEDNOTLIVÝCH ETAP

Níže uvedená detailní zadání jsou součástí master promptu. Postupuj podle pořadí a jejich průběžných podmínek, nikoliv podle původních čísel kroků.


---

# ETAPA 01/15 – původní krok 29A: Version Archive, Changelog & Release Foundation

**Milník:** M1. **Důležitá úprava:** Připrav současně proveditelný release proces pro M1–M5. Nezvyšuj číslo jen kvůli této etapě.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Version Archive, Historical Changelog & Background Simulation

Rozšiř projekt o udržitelné Semantic Versioning, skutečný archiv funkčních historických sestavení a changelog. Volitelný běh simulace na pozadí zde ještě NEIMPLEMENTUJ; je to samostatná poslední etapa 29B.

Nezakládej nový projekt. Nejdříve analyzuj aktuální Git historii, existující archiv verzí, hlavní menu, Changelog, Game Time, Phaser lifecycle, Save/Load a aktuální způsob nasazení na GitHub Pages.

Zachovej stávající funkce hry a aktuální systém verzování.

ČÁST A – ARCHIV VERZÍ

1. Číslování archivovaných verzí

Vytvoř konzistentní číslování všech existujících archivovaných verzí hry.

Použij Semantic Versioning:

MAJOR.MINOR.PATCH

Příklad:

v0.1.0 – první archivovaná funkční alpha

v0.2.0 – další významný vývojový milník

v0.2.1 – opravná aktualizace

v0.3.0 – další významné rozšíření

To jsou pouze příklady, nikoliv skutečná historie projektu.

Základní pravidla:

Zachovej již existující oficiálně přidělené verze.

Starším archivovaným sestavením, které číslo nemají, přiděl zpětně jednoznačné archivní označení podle skutečné chronologie a rozsahu změn.

Rozlišuj zpětně přiřazené archivní označení od původního oficiálního vydání.

Nevymýšlej neexistující sestavení ani datum vydání.

Nepovažuj automaticky každý Git commit za samostatnou verzi.

Nejnovější aktuální verze musí mít jednoznačné označení a nesmí kolidovat s archivem.

Neupravuj historické commity ani Git historii pouze kvůli číslování.

Pokud už existuje archiv sestavení na samostatných URL, zachovej jeho funkčnost.

2. Centrální katalog verzí

Vytvoř jeden autoritativní katalog archivovaných verzí.

Každá položka obsahuje:

Version

Title

Date

Git Commit Hash

Archive URL

Short Description

Release Type

Historical/Reconstructed label, pokud bylo číslo přiděleno zpětně

Katalog může být JSON nebo jiná vhodná struktura.

Zajisti, aby archiv, hlavní menu a Changelog používaly konzistentní údaje.

Nedovol duplicitní čísla verzí ani odkazy na neexistující archivy.

Pokud starý build nemá dostupný spustitelný archiv, označ ho jako nedostupný a neuváděj nefunkční tlačítko Play.

3. Přehled archivu v hlavním menu

Pokud v hlavním menu již existuje položka Version Archive, uprav ji.

Jinak vytvoř položku:

Version Archive

Po otevření zobraz všechny dostupné historické verze.

Příklad:

VERSION ARCHIVE

v0.4.0 – Current Version
v0.3.0 – Previous Update
v0.2.1 – Bug Fixes
v0.2.0 – Feature Update
v0.1.0 – Initial Alpha

Záznamy jsou pouze ukázka.

Každý záznam má:

Číslo verze.

Datum sestavení nebo vydání, pokud je ověřené.

Krátký popis.

Tlačítko Play, pokud existuje hratelný archiv.

Tlačítko Changelog nebo View Changes.

Při spuštění archivované verze se musí spustit skutečný historický build, nikoliv aktuální hra s jiným číslem verze.

Zachovej původní funkční URL archivů. Pokud je potřeba zavést nové stabilní URL, zajisti kompatibilitu se starými odkazy.

Starší verze nesmějí přepisovat uložené pozice aktuální hry nekompatibilními daty. Použij oddělení uložených dat podle verzí nebo kompatibilního save schématu.

ČÁST B – HISTORICKÝ CHANGELOG

4. Rekonstrukce historie změn

Prozkoumej Git historii a skutečně dostupné archivované buildy.

Pro každou identifikovanou verzi zjisti:

Jaké funkce přibyly.

Jaké mechaniky se změnily.

Jaké chyby byly opraveny.

Jak se změnilo ovládání nebo grafika.

Jaké optimalizace byly provedeny.

Porovnávej odpovídající commity nebo archivovaná sestavení.

Nespoléhej pouze na názvy commitů, pokud nejsou dostatečně konkrétní.

Nedoplňuj mechaniky, které jsou pouze plánované, ale v dané verzi skutečně nebyly implementované.

Pokud nelze přesně zjistit nějakou změnu, neodhaduj ji.

5. Doplnění CHANGELOG.md

Aktualizuj existující CHANGELOG.md.

Každá vydaná nebo zpětně katalogizovaná verze musí mít vlastní stručný záznam.

Použij kategorie:

Added

Changed

Improved

Fixed

Balance

Removed

Zobrazuj pouze použité kategorie.

Každý záznam má být stručný a orientovaný na hráče.

Příklad formátu:

v0.X.0 – YYYY-MM-DD

Added

New building system.

Collectible natural resources.

Improved character movement.

Changed

Updated world generation.

Fixed

Fixed incorrect collision detection.

Tento příklad nepovažuj za skutečný záznam.

U zpětně označených archivů eviduj skutečné datum původního commitu/sestavení, nikoliv dnešní datum, pokud je dohledatelné.

Historické změny piš anglicky.

Udržuj existující sekci Unreleased.

6. Changelog ve hře

Uprav obrazovku Changelog v hlavním menu.

Každá verze musí mít:

Číslo verze.

Datum.

Stručný seznam změn.

Možnost rozbalení a sbalení.

Odkaz na odpovídající archiv, pokud existuje.

Nejnovější verze bude nahoře.

Historické záznamy se zobrazují ze stejného autoritativního zdroje jako CHANGELOG.md nebo z dat automaticky generovaných při buildu.

Nevytvářej dva nezávisle ručně udržované seznamy.

7. Propojení archivu a Changelogu

Z obrazovky Version Archive musí být možné otevřít změny příslušné verze.

Z Changelogu musí být možné přejít ke spustitelnému archivu příslušné verze.

Aktuální verze zobrazí informaci:

Current Version

U starší verze:

Archived Version

V každém archivovaném buildu ponech označení jeho skutečné historické verze, nikoliv aktuální číslo hlavní hry.

## Rozšíření etapy 29A – Automatické ověřování a proces vydání

- Zjisti skutečné aktuální číslo verze a aktuální release workflow. Pokud neexistují, navrhni jednotný zdroj čísla a aktualizaci UI bez přepisování historických commitů.
- Přidej `docs/UPGRADE_PROGRESS.md` a `docs/RELEASE_CHECKLIST.md` včetně stavu 15 etap. Umožni automaticky přecházet na další etapy při splněném release/test gate a bezpečně navázat po technickém přerušení bez opakování hotových kroků.
- Zachovej oddělené `GameVersion` a `SaveSchemaVersion`; každá migrace save může zvýšit SaveSchemaVersion bez veřejného release.
- Pro reprodukovatelný build ověř dostupné `package.json` scripts, `npm ci`/odpovídající instalaci, testy, build. Doplň rozumné regression/smoke scénáře z herního projektu (bez falešných green checks).
- Každá menší etapa: commit + Unreleased, nikoliv nové číslo. Vydání jen po úspěšném kompletním milníku M1–M5 s MINOR incrementem v řadě 0.x, případně PATCH pro samostatnou hotfix opravu.
- Release gate kontroluje konzistenci čísla v package/metadatech/UI, validní changelog, kompatibilitu Save/Load, funkční hratelný archiv odpovídající přesnému commit SHA, Git tag, skutečný nasazený build. Bez potřebných oprávnění pouze připrav release a explicitně nahlas, že jej nelze publikovat.
- Existující historická čísla, buildy a odkazy neměň; nevytvářej fiktivní historiografii ze stavu plánovaných funkcí.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 02/15 – původní krok 36: Building Categories & Unlock Requirements

**Milník:** M1. **Důležitá úprava:** Připrav kategorii Infrastructure už nyní. Granary → Farmhouse → Wheat Field / Orchard se odemyká podle dokončených budov.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Building Categories & Unlock Requirements

Uprav existující nabídku Buildings v Medieval Kingdom tak, aby byly budovy přehledně rozdělené do tematických záložek.

Zároveň implementuj centrální systém podmínek pro odemykání budov.

Hlavním cílem je odstranit chaotický seznam všech staveb a zavést logický postup výstavby, zejména u zemědělství.

Nezakládej nový projekt. Nejprve analyzuj existující Buildings Menu, Building Registry, Asset Library, Blueprint System, Construction System, New Game Setup, Save/Load a případné již existující podmínky odemykání.

Zachovej současný grafický styl a funkce hry.

1. Tematické záložky Buildings

Rozděl nabídku Buildings do následujících kategorií:

Castle & Defense

Castle

Tower

Walls

Barracks

Housing

House

Další budoucí obytné budovy

Food & Farming

Granary

Farmhouse

Wheat Field

Orchard

Hunting Lodge

Mill

Bakery

Mining & Industry

Quarry

Iron Mine

Smelter

Lumberjack Hut

Další budoucí výrobní budovy

Logistics & Trade

Warehouse

Marketplace

Stables

Wheelwright's Workshop

Infrastructure

Stone Pavement (zobraz až ve chvíli, kdy skutečně existuje v Building Registry)

All

Všechny dostupné i zamčené budovy

Používej skutečně implementované budovy. Pokud některé ještě neexistují, nevytvářej je pouze kvůli tomuto menu.

2. Rozhraní záložek

Zachovej stávající spodní Buildings panel.

V horní části panelu přidej řadu záložek s ikonami a názvy kategorií.

Příklad:

[All] [Defense] [Housing] [Food] [Industry] [Logistics]

Kliknutím na záložku se zobrazí pouze budovy příslušné kategorie.

Požadavky:

Aktivní záložka je vizuálně zvýrazněná.

Přepínání je okamžité.

Zachovej stávající náhledy a ceny budov.

Zachovej stavební tooltipy.

Zajisti horizontální scrollování záložek na menších obrazovkách.

Nepřerušuj ovládání kamery při práci s menu.

Pokud aktuálně vybraná budova není dostupná po změně kategorie, korektně ukonči její stavební náhled.

Záložky musí být přehledné i při větším množství budov.

3. Centrální systém kategorií

Každá budova musí mít v Building Registry definovanou kategorii.

Například:

category: ""food""

Kategorie:

defense

housing

food

industry

logistics

infrastructure (připrav už nyní pro Stone Pavement v kroku 37)

Použij stabilní ID kategorií.

Nevytvářej samostatné pevně zakódované seznamy budov přímo v UI.

Nově přidaná budova se musí automaticky objevit ve správné kategorii podle své registrace.

Pokud zatím nemá kategorii, zobraz ji alespoň v záložce All.

4. Systém odemykání budov

Implementuj centrální BuildingUnlockManager nebo rozšiř existující odpovídající systém.

Každá budova může mít definované stavební podmínky.

Příklad:

requiresCompletedBuildings: ["granary"]

Odemčení musí vycházet ze skutečného stavu herního světa.

Nestačí, že hráč budovu pouze umístil jako blueprint.

Podmínku splňuje až dokončená, funkční budova.

Pokud hráč nemá potřebnou budovu, další stavba zůstane zamčená.

5. Povinný postup zemědělství

Implementuj následující pravidla:

Granary

Sýpka je dostupná od začátku hry.

Nevyžaduje žádnou jinou budovu.

Farmhouse

Farma je zamčená, dokud hráč nemá alespoň jednu dokončenou Granary.

Po dokončení první sýpky se Farmhouse automaticky odemkne.

Wheat Field

Obilné pole je zamčené, dokud hráč nemá alespoň jednu dokončenou Farmhouse.

Orchard

Ovocný sad je zamčený, dokud hráč nemá alespoň jednu dokončenou Farmhouse.

Odemknutí Wheat Field a Orchard proběhne po dokončení Farmhouse.

Není potřeba samostatně odemykat každé pole nebo sad.

6. Další potravinové budovy

Pro první verzi zachovej ostatní současné podmínky budov.

Mill, Bakery a Hunting Lodge zůstanou dostupné podle existujících pravidel.

Nepřidávej jim nové závislosti bez výslovného zadání.

Systém ale připrav tak, aby bylo později možné přidat další návaznosti, například:

Farmhouse → Mill → Bakery.

Zatím tuto dodatečnou podmínku neaktivuj.

7. Zobrazení zamčených budov

Zamčené budovy musí zůstat viditelné ve správné kategorii.

Vizuálně:

Zašedlá ikonka.

Symbol zámku.

Neaktivní tlačítko stavby.

Tooltip s podmínkami odemčení.

Příklady:

Farmhouse – Locked

Requires: Build a Granary

Wheat Field – Locked

Requires: Build a Farmhouse

Orchard – Locked

Requires: Build a Farmhouse

Pokud je požadovaná budova již rozestavěná, zobraz:

Requires a completed Farmhouse

Zamčenou budovu nesmí být možné umístit na mapu ani pomocí alternativních UI akcí nebo klávesových zkratek.

8. Chování po zbourání budovy

Rozlišuj historické odemčení a aktuální funkčnost.

Pro tento upgrade používej průběžné požadavky:

Farmhouse lze nově postavit pouze při existenci dokončené Granary.

Wheat Field a Orchard lze nově postavit pouze při existenci dokončené Farmhouse.

Pokud hráč zbourá poslední Granary:

Již existující Farmhouse zůstane zachovaná.

Novou Farmhouse nelze postavit, dokud nebude znovu postavena Granary.

Pokud zbourá poslední Farmhouse:

Existující pole a sady zůstávají na mapě.

Nová pole a sady jsou zamčené.

Bez dostupných farmářů se plodiny nesklízejí podle stávajících pravidel.

Nemaž automaticky již postavené budovy ani prozkoumané objekty.

Pokud existuje rozestavěný blueprint a jeho požadovaná budova později zanikne, již platně založenou stavbu ponech rozestavěnou. Podmínky ověřuj při zahájení nové stavby.

9. Integrace s New Game Setup

Pokud hráč začne s volbou Starting Castle = ON, zachovej stávající pravidla počátečního hradu.

Tento hrad automaticky neodemyká zemědělské budovy.

Pokud hra obsahuje jiné počáteční budovy, zohledni jejich skutečný dokončený stav.

Při zahájení nové hry se stav odemčení musí správně vypočítat.

10. Integrace s Asset Library

Rozšiř definice budov o:

Category

Unlock Requirements

Unlock Description

V Asset Library zobraz kategorii a případné požadavky na odemčení.

Nezaměňuj dostupnost budovy v Asset Library s možností její stavby ve hře.

Asset Library může zobrazovat i zamčené budovy.

11. Save / Load

Nevytvářej duplicitní seznam odemčených budov, pokud lze stav bezpečně dopočítat z dokončených staveb.

Po načtení:

Zjisti skutečný stav dokončených budov.

Vyhodnoť podmínky odemčení.

Aktualizuj Buildings Menu.

Zachovej již existující stavby.

Neodemykej stavby na základě nedokončených blueprintů.

Starší uložené hry musí zůstat funkční.

Pokud starší save obsahuje existující Farmhouse nebo pole bez Granary, ponech tyto budovy zachované. Nové stavební akce však musí splnit aktuální pravidla.

12. Výkon

Podmínky odemykání nevyhodnocuj každý vykreslený snímek.

Aktualizuj je především při:

Dokončení budovy.

Zničení nebo zbourání budovy.

Načtení hry.

Zahájení nové hry.

Použij události existujícího Building Systemu.

13. Testování

Ověř:

Buildings Menu obsahuje tematické záložky.

Každá budova se zobrazuje ve správné kategorii.

Záložka All obsahuje všechny budovy.

Sýpka je dostupná od začátku.

Farmhouse je bez Granary zamčená.

Dokončení Granary odemkne Farmhouse.

Nedokončená Granary Farmhouse neodemkne.

Wheat Field je bez dokončené Farmhouse zamčené.

Orchard je bez dokončené Farmhouse zamčený.

Dokončení Farmhouse odemkne Wheat Field a Orchard.

Zamčené budovy mají ikonu zámku a vysvětlující tooltip.

Zamčené budovy nelze umístit na mapu.

Zbourání poslední Farmhouse zablokuje stavbu dalších polí a sadů.

Již existující pole a sady zůstanou zachované.

Save/Load správně obnoví dostupnost budov.

Starší uložené hry fungují.

UI neblokuje pohyb kamery.

Fungují existující blueprinty a stavební ceny.

14. Implementační postup

Rozděl upgrade na tři fáze:

Phase A – Building Categories
Záložky, kategorie a úprava Buildings Menu.

Phase B – Unlock Requirements
Centrální systém podmínek a konkrétní závislosti Granary → Farmhouse → Wheat Field / Orchard.

Phase C – Integration
Asset Library, Save/Load, UI a testování.

Před zahájením vytvoř bezpečný Git commit.

Po dokončení ověř build a zapiš skutečně dokončené změny do sekce Unreleased v CHANGELOG.md.

Nevydávej automaticky novou verzi hry.

Prioritou je přehledná nabídka budov a spolehlivé odemykání bez poškození stávajících staveb.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 03/15 – původní krok 33: Seasons ON/OFF

**Milník:** M1. **Důležitá úprava:** Při OFF efektivně trvalé léto a zachování původní sezóny v paměti, ne zpětné dohnání sezón.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Seasons ON/OFF

Rozšiř stávající systém ročních období o možnost jejich zapnutí a vypnutí při zakládání nové hry i během hraní.

Nezakládej nový projekt. Nejprve analyzuj existující Seasons System, Weather System, Game Time, New Game Setup, levý Settings panel, zemědělství, růst stromů a Save/Load.

Zachovej všechny existující funkce.

1. Nastavení při nové hře

Do New Game Setup, v sekci Advanced Settings, přidej:

Seasons: ON / OFF

Výchozí hodnota: ON.

ON – standardní střídání jara, léta, podzimu a zimy.

OFF – trvalé léto bez střídání ročních období.

Nastavení musí být součástí konfigurace nové hry.

2. Přepínač během hraní

Do existujícího levého Settings panelu přidej zaškrtávací přepínač:

Seasons: ON / OFF

Přepínač musí fungovat okamžitě, bez restartování hry.

Změnu ukládej do aktuální uložené hry.

Nevytvářej druhý nezávislý systém ročních období.

3. Chování při vypnutí

Když hráč vypne Seasons:

Aktuální roční období a postup v něm se uloží do paměti.

Aktivní roční období pro herní mechaniky se nastaví na Summer.

Přestane se počítat přechod mezi ročními obdobími.

Obilí a další plodiny rostou podle letních pravidel.

Ovocné sady mohou produkovat ovoce celoročně.

Stromy rostou podle letních pravidel.

Zimní omezení produkce přestanou platit.

Zimní grafika se změní na letní.

Game Time a střídání jednotlivých dnů pokračuje normálně.

Pokud existují systémy závislé na aktuální sezóně, musí používat efektivní sezónu Summer.

Weather System zůstává funkční, pokud je samostatně implementovaný. Roční období OFF nesmí vypnout samotné počasí.

Při vypnutých sezónách používej letní pravděpodobnosti jednotlivých typů počasí.

4. Opětovné zapnutí

Pokud hráč znovu zapne Seasons:

Obnov poslední skutečné roční období.

Obnov jeho uložený průběh.

Pokračuj ve střídání sezón od místa, kde byly vypnuty.

Aktualizuj grafiku, růst plodin a další sezónní modifikátory.

Příklad:

Hráč vypne Seasons ve třetím dni podzimu.

Následujících deset herních dnů hraje s trvalým létem.

Po opětovném zapnutí se obnoví třetí den podzimu a sezónní cyklus pokračuje dál.

Vypnutí nesmí způsobit přeskočení několika sezón při opětovném zapnutí.

Rozpracovaný biologický růst rostlin a stromů zachovej. Neprováděj opakované sklizně ani okamžité resetování růstových fází.

5. Uživatelské rozhraní

Pokud je Seasons ON, zobraz aktuální roční období standardním způsobem.

Pokud je Seasons OFF, zobraz například:

Summer (Seasons OFF)

Při najetí na přepínač zobraz tooltip:

Disable seasonal changes and keep permanent summer. Game days continue normally.

6. Save / Load

Ukládej:

Seasons Enabled.

Poslední skutečné roční období.

Postup v aktuálním ročním období.

Efektivní sezónu používanou herní simulací.

Po načtení se musí obnovit správný stav.

Starší uložené hry bez tohoto nastavení používej s výchozí hodnotou Seasons ON.

Neprováděj při Load Game nové inicializování sezónního cyklu.

7. Background Simulation

Pokud je implementované Run in Background:

Při Seasons OFF nesmí během simulace na pozadí docházet ke změně ročního období.

Růst plodin a stromů musí používat letní modifikátory.

Při Seasons ON musí sezónní cyklus normálně pokračovat.

Po návratu do hry nesmí dojít k duplicitním přechodům sezón.

8. Testování

Ověř:

V New Game Setup existuje Seasons ON/OFF.

Výchozí hodnota je ON.

Přepínač existuje také v levém Settings panelu.

Seasons OFF nastaví trvalé léto.

Herní dny normálně pokračují.

Obilí a ovocné sady produkují i během trvalého léta.

Stromy rostou podle letních pravidel.

Po opětovném zapnutí se obnoví původní sezónní cyklus.

Přepnutí během zimy správně změní grafiku.

Save/Load zachová nastavení a rozpracovaný cyklus.

Background Simulation respektuje nastavení.

Nedochází k duplicitní produkci nebo sklizni.

9. Implementace

Použij jeden centrální zdroj nastavení Seasons.

Nevytvářej duplicitní přepínače se samostatným stavem.

Před úpravami vytvoř bezpečný Git commit.

Po implementaci spusť testy a ověř funkční build.

Zapiš dokončené změny do sekce Unreleased v CHANGELOG.md.

Nevydávej automaticky novou verzi hry.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 04/15 – původní krok 28: Circular Fog of War & Map Memory

**Milník:** M1. **Důležitá úprava:** Jediná autoritativní viditelnost: unexplored/explored visible; poslední známé statické objekty, ne live informace.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Circular Fog of War, Exploration & Persistent Map Memory

Uprav stávající systém Fog of War v izometrické 2.5D hře Medieval Kingdom.

Cílem je nahradit současný čtvercový dohled kruhovým, vytvořit výraznější tmavě šedou mlhu a přidat skutečné prozkoumávání mapy s pamětí naposledy viděných objektů.

Nezakládej nový projekt. Nejprve analyzuj aktuální implementaci Fog of War, renderování izometrické mapy, objektů, kameru, UI nastavení, New Game Setup a Save/Load.

Zachovej všechny ostatní herní mechaniky.

1. Kruhový Fog of War

Současný čtvercový dohled změň na kruhový.

Viditelnost vyhodnocuj podle skutečné vzdálenosti od zdroje vidění:

distance² = dx² + dy²

Políčko je viditelné, pokud:

distance² <= radius²

Používej souřadnice herní mřížky, nikoliv obdélníkovou oblast na obrazovce.

Kruh musí zůstat geometricky správný také v izometrickém zobrazení.

Kruhový dohled musí fungovat při pohybu krále a všech změnách jeho View Range.

Zachovej existující bonusy dohledu:

King: základní dohled.

Mounted King: +50 %.

Tower: +100 %.

Castle: +75 %.

Walls: +75 % při odpovídajícím využití.

Respektuj stávající pravidla aktivace výhledu z budov.

Pokud nyní král vidí 20×20 políček, převeď hodnotu na přibližně 10 políček poloměru a odpovídajícím způsobem použij existující násobiče.

Nesmí dojít k nechtěnému výraznému zvýšení nebo snížení dosahu.

2. Tři stavy viditelnosti

Každé políčko mapy musí podporovat tři stavy:

UNEXPLORED

Hráč políčko nikdy neviděl.

Pokud je Exploration ON, oblast je úplně černá.

Terén a objekty nejsou viditelné.

Nejsou vidět žádné jednotky ani efekty.

Hráč nezná obsah této oblasti.

EXPLORED

Hráč již políčko viděl, ale momentálně není v dohledu žádného aktivního zdroje vidění.

Terén je viditelný ve výrazně tmavším, zašedlém provedení.

Pevné objekty zůstávají zobrazené v posledním známém stavu.

Pohybující se jednotky nejsou viditelné.

Informace se neaktualizují, dokud se oblast znovu nedostane do dohledu.

VISIBLE

Políčko je aktuálně v dohledu.

Terén má normální barvy.

Objekty jsou vykreslovány normálně.

Jednotky a zvířata jsou viditelné.

Hráč vidí aktuální stav světa.

Paměť prozkoumané oblasti se aktualizuje.

Odděl trvalý stav explored od dočasného stavu currentlyVisible.

Nevytvářej pouze jednu boolean hodnotu, která by nedokázala rozlišit prozkoumané a aktuálně viditelné oblasti.

3. Tmavší a výraznější mlha

Současnou mlhu uprav tak, aby byla výrazně tmavší.

Pro EXPLORED oblasti použij například:

Tmavě šedé až černošedé zabarvení.

Přibližně 65–75% ztmavení.

Výrazné snížení saturace.

Zachování rozpoznatelnosti terénu a budov.

Hodnoty implementuj jako konfigurovatelné parametry.

V oblasti VISIBLE musí být grafika normální, bez ztmavení.

Mezi viditelnou a prozkoumanou oblastí vytvoř jemný přechod, aby hranice nebyla nepříjemně ostrá.

Přechod může být vizuálně změkčený přibližně přes okraj jednoho políčka.

Samotná herní viditelnost ale musí respektovat přesný kruhový radius.

Vizuální přechod nesmí prozrazovat skryté objekty mimo skutečný dohled.

4. Paměť pevných objektů – Persistent Object Memory

Toto je zásadní část úpravy.

Pevné objekty, které hráč již jednou objevil, NESMÍ po opuštění View Range zmizet.

Podporuj zejména:

Trees

Stumps

Stones

Stone Deposits

Iron Deposits

Rocks

Buildings

Walls

Farms

Orchards

Fields

Other static world objects

Jakmile je objekt poprvé spatřen, uloží se jeho poslední viditelný stav do paměti mapy.

Pokud objekt následně opustí dohled hráče:

Zůstane vykreslený.

Bude výrazně zašedlý.

Jeho vzhled se přestane aktualizovat.

Zůstane na poslední známé pozici.

Příklad:

Král objeví dospělý dub.

Potom odejde a dub se dostane mimo View Range.

Dub zůstane viditelný jako zašedlý dospělý strom.

Mezitím jej dřevorubec pokácí.

V herní simulaci strom skutečně zmizí a vznikne pařez, ale na prozkoumané mapě hráč stále vidí poslední známý dospělý dub.

Teprve když se král vrátí do oblasti, zjistí, že strom byl pokácen, a paměť se aktualizuje na pařez.

Stejné pravidlo platí pro:

Nově postavené budovy.

Zbourané budovy.

Vytěžená ložiska.

Rostoucí stromy.

Změněné fáze obilných polí.

Ostatní statické objekty.

Pokud byla budova postavena v prozkoumané oblasti mimo aktuální dohled, nesmí se její nový vzhled automaticky objevit v paměti mapy.

5. Oddělení skutečného světa a paměti hráče

Vytvoř samostatný systém Map Memory.

Skutečný herní svět pokračuje v simulaci nezávisle na Fog of War.

Paměť hráče je pouze vizuální reprezentace posledního známého stavu.

Navrhovaná struktura:

WorldState: skutečný aktuální stav světa.

VisibilityState: aktuálně viditelné oblasti.

ExploredState: již objevené oblasti.

MapMemory: poslední známý stav terénu a pevných objektů.

Při přechodu objektu z VISIBLE do EXPLORED zachovej jeho poslední viditelný vzhled.

Nepoužívej živý stav objektu pro vykreslování v EXPLORED oblasti.

Uložený snapshot může obsahovat:

Object ID

Object Type

Tile Position

Sprite/Asset ID

Visual State

Growth Stage

Construction Stage

Orientation

Other visually relevant properties

Zvol datově úspornou strukturu.

Pokud hráč znovu vstoupí do oblasti, porovnej paměť se skutečným stavem a aktualizuj ji.

Pokud objekt již neexistuje, odstraň jeho starý obraz z mapové paměti až po jeho opětovném spatření.

Aktuální herní logika, pathfinding a kolize musí vždy používat skutečný WorldState, ne zastaralou paměť.

6. Pohybující se objekty

Dynamické objekty se v EXPLORED oblasti nezachovávají.

Platí pro:

Wildlife

Villagers

Travelers

Merchants

Caravans

Enemies

Other moving units

Jakmile opustí View Range, přestanou být viditelné.

Nadále však pokračují ve své skutečné simulaci.

Po opětovném vstupu do dohledu se zobrazí na aktuální pozici.

Nepoužívej pro ně poslední známou statickou kopii.

7. Nový Exploration Mode

Přidej nový režim:

Exploration Mode

Výchozí nastavení při zahájení nové hry: ON.

Pokud je Exploration Mode zapnutý:

Celá mapa začíná jako UNEXPLORED.

Mimo počáteční View Range je úplně černá.

Viditelná je pouze kruhová oblast kolem krále.

Při pohybu krále se postupně odkrývá nová část mapy.

Jednou objevená oblast zůstane prozkoumaná.

Když král odejde, změní se na tmavě šedou EXPLORED oblast.

Při opětovném příchodu se vrátí do plně viditelného stavu.

Prozkoumávání je trvalé v rámci dané uložené hry.

Při nové hře se mapa znovu začíná jako neprozkoumaná.

Exploration Mode nesmí ovlivňovat skutečnou AI, ekonomiku ani simulaci světa.

8. Přepínání Exploration Mode v levém menu

Do existujícího levého Settings panelu přidej dva samostatné přepínače:

Fog of War: ON / OFF

Exploration: ON / OFF

Oba přepínače musí skutečně fungovat za běhu hry, především pro testovací účely.

Chování:

Fog of War ON + Exploration ON

Standardní herní režim.

Neprozkoumaná mapa je černá.

Prozkoumaná oblast je tmavě zašedlá.

Aktuálně viditelná oblast je normálně barevná.

Fog of War ON + Exploration OFF

Testovací režim bez černého zakrytí mapy.

Terén celé mapy je viditelný.

Mimo View Range je tmavě zašedlý.

Pevné objekty, které hráč nikdy neviděl, zůstávají skryté.

Objevené pevné objekty se zobrazují podle Map Memory.

Dynamické objekty mimo View Range zůstávají skryté.

Fog of War OFF

Úplné testovací zobrazení mapy.

Celá mapa je viditelná.

Objekty mají normální barvy.

Zobrazuje se aktuální skutečný WorldState.

Černá ani šedá mlha se nevykresluje.

Exploration přepínač nemá při vypnutém Fog of War žádný vizuální efekt.

Přepínání musí okamžitě aktualizovat zobrazení.

DŮLEŽITÉ:
Vypnutí Fog of War pro testování nesmí automaticky označit všechna políčka jako prozkoumaná.

Po opětovném zapnutí Fog of War se musí obnovit původní paměť a skutečně objevené oblasti.

Totéž platí při přepnutí Exploration OFF/ON.

Testovací přepínače mění způsob zobrazení, nikoliv automaticky trvalou historii průzkumu.

9. New Game Setup

Přidej Exploration Mode také do existujícího New Game Setup, pokud obsahuje pokročilá nastavení.

Výchozí hodnoty:

Fog of War: ON

Exploration: ON

Pokud již existuje nastavení Fog of War, zachovej jej.

Nevytvářej duplicitní volby.

Při vytvoření nové hry inicializuj prozkoumanou mapu podle skutečného počátečního dohledu.

V průběhu nové hry musí fungovat i přepínače v levém Settings panelu.

10. Více zdrojů vidění

Navrhni Visibility System tak, aby mohl kombinovat více aktivních zdrojů dohledu.

Aktuálně podporuj existující pravidla hry:

King

Mounted King

King on Tower

King on Castle

King on Walls

Pokud již hra obsahuje další funkční zdroje vidění, zachovej je.

Do budoucna připrav možnost, aby vidění poskytovali také průzkumníci, vojáci nebo hlídkové věže, ale nepřidávej jim nové schopnosti bez existujícího herního pravidla.

Výsledná viditelná oblast je sjednocením kruhů aktivních zdrojů.

Zdroje vidění nesmějí automaticky odhalovat celou mapu.

11. Aktualizace mapové paměti

Paměť aktualizuj pouze pro políčka, která jsou skutečně VISIBLE v běžné herní viditelnosti.

Při změně viditelnosti:

Vypočítej aktuální kruhovou oblast dohledu.

Označ její políčka jako prozkoumaná.

Aktualizuj jejich poslední známý stav.

Pro políčka mimo dohled použij uložené snapshoty.

Nikdy nevykresluj nové živé objekty v EXPLORED oblasti.

Po opětovném odkrytí obnov aktuální stav.

Nedovol únik informací přes:

Selektování skrytých objektů.

Tooltipy a panely.

Zvýraznění při hoveru.

Stíny objektů.

Animace.

Zvuky vázané na vizuálně skryté události, pokud prozrazují přesnou polohu.

Efekty těžby nebo výstavby mimo dohled.

Pokud jsou skryté objekty stále fyzicky přítomné, jejich existence nesmí být zjistitelná pouze náhodným klikáním do mlhy.

U vlastních budov a jednotek zachovej dosavadní logiku správy, ale odděl informační UI od vizuálního odhalování okolí.

12. Grafická vrstva Fog of War

Implementuj efektivní renderovací systém pro izometrickou mapu.

Požadavky:

Kruhová viditelnost.

Výrazně šedé EXPLORED oblasti.

Černé UNEXPLORED oblasti.

Korektní překrytí objektů.

Správné vykreslování statických snapshotů.

Žádné problikávání při pohybu kamery.

Správná funkce při zoomování.

Správná funkce při pohybu krále.

Mlha musí respektovat také výšku grafických sprite objektů, například stromů a věží. Nesmí nastat situace, kdy je terén zašedlý, ale koruna stromu zůstane plně barevná.

Nepoužívej zbytečně nákladné překreslování všech objektů v každém snímku.

13. Save / Load

Rozšiř existující Save/Load.

Ukládej:

Stav Exploration Mode.

Stav Fog of War.

Prozkoumaná políčka.

Poslední známý stav statických objektů.

Poslední známý vizuální stav terénu, pokud se může měnit.

Potřebné informace pro obnovení viditelnosti.

Prozkoumaná mapa musí po načtení zůstat prozkoumaná.

Nesmí se automaticky odkrýt celá mapa.

Nesmí dojít ke ztrátě paměti statických objektů.

Nesmí se obnovit zastaralé objekty jako skutečné herní objekty.

Pro starší save soubory, které neobsahují Exploration data, použij bezpečnou migraci.

Zachovej oddělení Save Schema Version a Game Version.

14. Výkon

Mapa má 100×100 políček.

Systém musí být připraven na větší množství objektů a stovky NPC.

Optimalizuj:

Výpočet kruhové viditelnosti.

Aktualizace pouze změněných políček.

Ukládání prozkoumaných políček.

Snapshoty statických objektů.

Renderování mlhy.

Práci s Phaser objekty.

Nepočítej kompletní viditelnost celé mapy každý snímek, pokud se žádný relevantní zdroj vidění nezměnil.

Při pohybu krále aktualizuj viditelnost podle potřeby, aby mlha reagovala plynule.

Využij cache a datově úsporné reprezentace, pokud jsou kompatibilní se současnou architekturou.

15. Testování

Před implementací vytvoř Git commit funkční verze.

Ověř:

View Range má kruhový, nikoliv čtvercový tvar.

Kruh je správný v izometrickém zobrazení.

Mount a budovy zachovávají bonusy dohledu.

Prozkoumané oblasti jsou výrazně zašedlé.

Neprozkoumané oblasti jsou černé.

Král postupně odkrývá mapu.

Jednou prozkoumané oblasti zůstávají v paměti.

Strom mimo dohled nezmizí.

Pokácený strom mimo dohled zůstane v paměti v posledním známém stavu.

Po opětovném spatření se zobrazí aktuální pařez.

Nová budova postavená mimo dohled se nezobrazí před opětovným průzkumem.

Zbouraná budova zůstává ve staré paměti až do dalšího spatření.

Pohybující se NPC mimo dohled nejsou viditelné.

Skryté objekty nelze odhalit hoverem nebo kliknutím.

Exploration ON/OFF funguje okamžitě.

Fog of War ON/OFF funguje okamžitě.

Testovací odkrytí mapy nezmění trvalý průzkum.

Save/Load zachovává prozkoumané oblasti i jejich paměť.

Správně funguje zoom a pohyb kamery.

Hra zůstává plynulá na mapě 100×100.

16. Implementační postup

Rozděl upgrade do čtyř fází:

Fáze A – Circular Visibility
Převod čtvercového View Range na kruhový a sjednocení zdrojů vidění.

Fáze B – Exploration & Rendering
Černá neprozkoumaná mapa, šedé prozkoumané oblasti a přepínače.

Fáze C – Persistent Map Memory
Snapshoty statických objektů, zastaralé informace a aktualizace při opětovném spatření.

Fáze D – Integration
Save/Load, kompatibilita, výkon, UI a automatizované testy.

Po každé dokončené a otestované fázi vytvoř Git commit.

Zapiš skutečně dokončené změny do sekce Unreleased v CHANGELOG.md podle zavedeného verzovacího systému. Nevydávej automaticky novou verzi.

Prioritou je skutečný kruhový Fog of War a správná paměť prozkoumané mapy, nikoliv pouze kosmetické ztmavení současného systému.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 05/15 – původní krok 30: Population Sidebar & Skill Sorting

**Milník:** M1. **Důležitá úprava:** Při úmrtí ukazovat 3 herní dny v Recent Deaths se symbolem lebky, nikoliv jako aktivní obyvatele.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Population Sidebar, Villager Portraits & Skill Sorting

Rozšiř stávající izometrickou 2.5D strategii Medieval Kingdom o nový rozbalovací pravý panel, který bude sloužit jako přehled všech obyvatel království.

Hlavní cíl: Hráč musí mít možnost rychle zobrazit všechny poddané, zjistit jejich povolání, level, XP a individuální skilly, seřadit je podle libovolného skillu nebo profese a najít konkrétního obyvatele na mapě.

Každý obyvatel bude reprezentován malým portrétem s barevným pozadím podle aktuální profese.

Nezakládej nový projekt. Nejprve analyzuj existující UI, Population System, Worker AI, Job System, Experience System, Skill System, Character Registry, Map Camera, Asset Library a Save/Load.

Nevytvářej nové duplicitní systémy postav nebo zkušeností.

1. Nový pravý postranní panel

Na pravou stranu herní obrazovky přidej rozbalovací panel:

POPULATION

Panel musí být dostupný přímo během hraní.

Ve výchozím stavu bude sbalený, aby nezabíral místo na obrazovce.

Ve sbaleném stavu zobraz úzkou vertikální záložku s:

Ikonou obyvatel.

Nápisem Population.

Aktuálním počtem poddaných.

Kliknutím na záložku se panel vysune z pravého okraje obrazovky.

Opětovným kliknutím se zasune.

Animace vysunutí musí být plynulá.

Panel nesmí narušovat existující levý Settings panel, spodní nabídku Buildings ani ovládání kamery.

Po otevření panelu nesmí klikání a scrollování uvnitř panelu zároveň ovládat herní mapu.

2. Seznam všech poddaných

Zobraz všechny trvalé obyvatele království.

Každý záznam musí obsahovat:

Portrét postavy.

Jméno.

Aktuální povolání.

Celkový level.

Základní informaci o XP.

Barevné pozadí portrétu podle profese.

Nezobrazuj běžné procházející pocestné ani obchodní karavany, které nejsou trvalými obyvateli.

Král může být zobrazen v samostatné sekci King, ale nezapočítávej ho duplicitně do populace.

Pokud obyvatel zemře nebo opustí království, aktivní seznam se okamžitě aktualizuje. Nedávno zemřelé však zachovej dočasně v oddělené sekci Recent Deaths po 3 celé herní dny: přeškrtnutý portrét a malá lebka se zkříženými kostmi; tito lidé se nepočítají do populace, kapacity domů, zaměstnanosti ani do kandidátů na pracovní místo. Emigrovaní obyvatelé se ze seznamu odstraní po fyzickém opuštění mapy.

Pokud se někdo přistěhuje, musí se okamžitě objevit.

Doba zobrazení nedávno zemřelých: 3 celé herní dny; samostatná sekce Recent Deaths (nikoliv aktivní populace). 

3. Barevné portréty podle profese

Každá profese bude mít vlastní barevné pozadí portrétu.

Výchozí barevná paleta:

Unemployed: Grey

Builder: Orange / Brown

Miner: Blue / Steel

Woodcutter: Forest Green

Farmer: Yellow / Olive

Hunter: Dark Green

Soldier: Red

Hauler: Purple

Miller: Light Brown

Baker: Warm Orange

Všechny barvy definuj centrálně v konfiguraci profesí.

Pokud existují další profese, přidej jim odlišné vhodné barvy.

Zachovej dostatečný kontrast a čitelnost.

Barevně se mění především pozadí portrétu, nikoliv samotná postava.

Například:

Miner → portrét na modrém pozadí.

Farmer → portrét na žlutozeleném pozadí.

Soldier → portrét na červeném pozadí.

Při změně profese se barva automaticky změní.

Portréty musí používat skutečný vzhled postavy nebo odpovídající asset z Character/Asset Library.

Nepoužívej pro všechny postavy jeden identický emoji symbol jako finální řešení.

Pokud ještě nejsou dostupné individuální portréty, vytvoř kompatibilní fallback z existujících herních sprite nebo jednoduchý stylizovaný portrét.

4. Detail při najetí myší

Po najetí kurzoru na portrét nebo řádek poddaného zobraz přehledný tooltip.

Tooltip obsahuje:

Základní informace

Name

Profession

Overall Level

Current XP

XP required for next level

Current Job

Assigned Workplace

Skills

Woodcutting

Mining

Hunting

Construction

Farming

Combat

Logistics

Milling

Baking

Zobraz skutečně existující skilly podle současného Skill Systemu.

Pokud některý uvedený skill ještě neexistuje, nepřidávej jej pouze kvůli UI.

Každý skill zobraz jako:

Název

Level

XP progress

Progress bar nebo přehledná hodnota XP

Zvýrazni přirozený talent postavy, pokud existuje.

Příklad:

RADOVAN

Miner
Overall Level: 24
XP: 680 / 950

Skills:
Mining: 28
Construction: 6
Combat: 4
Woodcutting: 3

Natural Talent: Mining

Tooltip nesmí překrývat kritické ovládací prvky ani vystupovat mimo obrazovku.

Při přiblížení kurzoru k pravému okraji ho umísti vlevo od panelu.

U delšího seznamu skillů zajisti scrollování nebo kompaktní rozložení.

5. Řazení obyvatel

V horní části panelu přidej Sort By.

Podporuj:

Overall Level

Overall XP

Name

Profession

Individual Skills

U individuálních skillů musí být možné vybrat konkrétní skill.

Příklad:

Sort By → Mining

Výsledkem bude seznam obyvatel seřazených od nejvyššího Mining Levelu po nejnižší.

Pokud mají dvě postavy stejný skill level, rozhodne jejich XP v daném skillu.

Pokud mají stejné XP, rozhodne celkový level a potom jméno.

Přidej přepínač:

Descending

Ascending

Výchozí řazení:
Overall Level – Descending.

Pokud je zvolen konkrétní skill, zobraz jeho level také přímo v řádku postavy.

6. Filtrování podle profese

Přidej samostatný filtr:

Profession

Možnosti:

All

Unemployed

Builder

Miner

Woodcutter

Farmer

Hunter

Soldier

Hauler

Miller

Baker

Další skutečně dostupné profese

Filtr vytvoř dynamicky podle existujícího Job Registry, aby nebylo nutné při přidávání nové profese ručně přepisovat UI.

Příklad:

Profession: Miner
Sort By: Mining Level
Order: Descending

Zobrazí pouze horníky seřazené podle Mining Skill.

Filtrování a řazení musí fungovat současně.

7. Vyhledávání

Přidej jednoduché vyhledávací pole:

Search villagers...

Vyhledávání musí podporovat jména poddaných.

Nezáleží na velikosti písmen.

Vyhledávání musí fungovat současně s filtrem profese a řazením.

Při prázdném výsledku zobraz:

No villagers found.

8. Výběr poddaného

Kliknutím na řádek poddaného:

Vyber příslušnou postavu.

Zvýrazni ji na mapě.

Otevři existující detailní panel postavy, pokud je implementován.

Dvojklikem:

Vyber postavu.

Plynule přesuň kameru na její aktuální pozici.

Krátce ji vizuálně zvýrazni.

Přidej také malé tlačítko:

Locate

které přesune kameru na daného poddaného.

Pohyb kamery musí respektovat hranice izometrické mapy.

Výběr poddaného nesmí automaticky změnit jeho pracovní úkol, profesi ani trasu.

Fog of War musí být respektován.

Pokud je poddaný mimo aktuální dohled a nelze ho podle herních pravidel vidět, nesmí Locate automaticky odhalit okolí nebo obejít Exploration Mode.

Můžeš ukázat poslední známou pozici nebo oznámit, že pozice není viditelná, podle aktuálních pravidel hry.

9. Zobrazení informací o potřebách

Pokud již existuje Villager Needs System, zobraz v rozšířeném detailu také:

Happiness

Food

Rest

Housing

Safety

V základním řádku zobraz malou stavovou ikonu, pokud:

Postava hladoví.

Je velmi unavená.

Stávkuje.

Je bez práce.

Nemá bydlení.

Je ve vážném nebezpečí.

Při najetí na ikonu zobraz důvod upozornění.

Pokud Needs System zatím není dokončený, nezaváděj ho znovu pouze kvůli tomuto panelu.

10. Stavy postavy

U portrétu může být malá stavová ikona:

Working

Resting

Idle

Traveling

Striking

Leaving Kingdom

Stavy načítej ze skutečného Worker AI Systemu.

Nevytvářej nové paralelní stavy jen pro zobrazování v UI.

11. Souhrn v horní části panelu

V záhlaví Population zobraz:

Total Population

Employed

Unemployed

Pokud je implementován Happiness System:

Average Happiness

Příklad:

Population: 38
Employed: 32
Unemployed: 6
Happiness: 78 %

Souhrn se musí automaticky aktualizovat.

12. Layout a grafika

Zachovej současný vizuální styl Medieval Kingdom.

Panel má připomínat přehledné UI středověké strategické hry.

Doporučení:

Tmavé pozadí panelu.

Jemné zlaté nebo bronzové okraje.

Barevně rozlišené portréty.

Dobře čitelné písmo.

Přehledné selektory.

Jemné hover efekty.

Panel by měl mít šířku přibližně 280–340 px na desktopu.

Záznam jedné postavy přibližně 50–60 px na výšku.

Velikost portrétu přibližně 40–48 px.

Zajisti škálování pro menší obrazovky.

Panel nesmí zakrývat důležitá tlačítka a musí podporovat scrollování.

13. Výkon

Počítej s populací alespoň 200 obyvatel.

Panel nesmí při každém herním snímku kompletně překreslovat seznam.

Použij efektivní aktualizace:

Při přistěhování nebo odchodu.

Při změně profese.

Při změně levelu nebo XP.

Při změně relevantního AI stavu.

Při změně řazení nebo filtru.

Pokud počet obyvatel výrazně roste, použij virtualizaci seznamu nebo jiné efektivní renderování.

Při zavřeném panelu nesmí běžet zbytečné aktualizace všech portrétů a tooltipů.

14. Save / Load

Neukládej duplicitní informace o jednotlivých postavách.

Panel musí používat existující autoritativní data obyvatel.

Zachovej ukládání:

Jména.

Profese.

Celkového levelu.

XP.

Individuálních skillů.

Talentů.

Pracoviště.

Bydlení.

AI stavů.

Samostatně můžeš ukládat pouze preference rozhraní:

Open / Closed.

Sort By.

Sort Direction.

Profession Filter.

Po načtení uložené hry se seznam automaticky sestaví z aktuálních obyvatel.

Nesmí docházet k duplicitním portrétům nebo zastaralým informacím.

15. Integrace s novými profesemi

Systém musí být rozšiřitelný.

Pokud v budoucnu přidáme:

Blacksmith

Fisherman

Guard

Trader

Forester

musí být možné přidat jejich barvu a odpovídající data centrálně, bez přepisování celé komponenty.

Nové skilly se musí automaticky objevit v řazení a tooltipu, pokud jsou zaregistrované ve Skill Registry.

16. Testování

Před zahájením vytvoř bezpečný Git commit.

Ověř:

Na pravé straně je rozbalovací Population panel.

Panel se správně otevírá a zavírá.

Zobrazuje všechny skutečné poddané.

Nezobrazuje cizí pocestné jako vlastní obyvatele.

Každý poddaný má portrét.

Barva pozadí odpovídá profesi.

Změna profese okamžitě změní barvu.

Hover zobrazí správné informace.

Tooltip obsahuje level, XP a skilly.

Funguje řazení podle Overall Level.

Funguje řazení podle Overall XP.

Funguje řazení podle jednotlivých skillů.

Funguje filtrování podle profese.

Filtr a řazení fungují současně.

Funguje vyhledávání podle jména.

Kliknutí vybere správnou postavu.

Locate přesune kameru podle herních pravidel.

Panel respektuje Fog of War.

Noví přistěhovalci se automaticky objeví.

Odejití obyvatelé po opuštění mapy zmizí ze seznamu; zemřelí zůstávají 3 herní dny pouze v Recent Deaths.

Save/Load obnoví správná data.

UI zůstává plynulé při 200 obyvatelích.

Panel neblokuje ovládání kamery mimo svou oblast.

Existující levý panel a spodní Buildings panel fungují bez problémů.

17. Postup implementace

Rozděl upgrade do čtyř fází.

Phase A – Population Sidebar
Pravý rozbalovací panel, seznam postav a portréty.

Phase B – Villager Details
Hover tooltip, XP, skilly, statusy a barevné profese.

Phase C – Filtering & Navigation
Řazení, vyhledávání, filtry, výběr a Locate.

Phase D – Integration
Save/Load, Fog of War, optimalizace, UI testy a finální doladění grafiky.

Po každé dokončené a otestované fázi vytvoř Git commit.

Zapiš skutečně dokončené změny do sekce Unreleased v CHANGELOG.md.

Nevydávej automaticky novou verzi hry.

Prioritou je přehledný a rychlý panel, který hráči umožní spravovat i velké království se stovkami poddaných.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 06/15 – původní krok 32: Missing Workers Indicator

**Milník:** M1. **Důležitá úprava:** Indikátory jen dokončených pracovních budov s chybějícími pracovníky, skryté mimo aktuální dohled.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Missing Workers Indicator

Rozšiř stávající izometrickou 2.5D hru Medieval Kingdom o vizuální upozornění na nedostatek zaměstnanců v pracovních budovách.

Nezakládej nový projekt. Nejprve analyzuj současný Building System, Job System, Auto Employment, vykreslování izometrických budov, kameru a UI.

1. Ikonka nad budovou

Pokud dokončená pracovní budova nemá obsazená všechna pracovní místa, zobraz nad ní malou blikající ikonku pracovníků.

Použij dvě barevné varianty:

Červená: budova má 0 zaměstnanců.

Oranžová: budova má alespoň jednoho zaměstnance, ale není plně obsazená.

Bez ikonky: všechna pracovní místa jsou obsazená.

Příklady:

Quarry 0/3 → červená.

Quarry 1/3 → oranžová.

Quarry 3/3 → bez ikonky.

Bakery 0/2 → červená.

Ikonka musí být malá, přehledná a vizuálně odpovídat středověkému stylu hry.

Použij symbol pracovníků nebo jednoduchou siluetu postavy.

2. Umístění a animace

Ikonku vykresli nad střechou příslušné budovy.

Požadavky:

Správná pozice na izometrické mapě.

Pomalé, nenápadné blikání, například změna opacity v cyklu 1,5 sekundy.

Správná funkce při pohybu kamery a zoomování.

Ikonka nesmí překrývat jiné důležité ovládací prvky.

Při velkém Zoom Out zůstane rozpoznatelná, ale nebude nepřiměřeně velká.

Pokud stojí vedle sebe více budov, jejich ikonky se nesmějí zbytečně překrývat.

3. Hover informace

Po najetí myší na ikonku zobraz tooltip:

Missing Workers

Například:

Quarry
Workers: 1 / 3
Missing: 2

Kliknutím na ikonku otevři existující panel budovy s možností Assign Worker.

Ikonka nesmí při kliknutí způsobit pohyb krále ani zadání příkazu na mapě.

4. Automatická aktualizace

Stav ikonky aktualizuj při:

Dokončení budovy.

Přidělení zaměstnance.

Odebrání zaměstnance.

Automatickém zaměstnání přes Auto Employment.

Přeřazení pracovníka.

Úmrtí nebo emigraci zaměstnance.

Zrušení či zničení budovy.

Načtení uložené hry.

Pokud Auto Employment okamžitě obsadí všechna místa, ikonka zmizí.

Rozlišuj obsazené pracovní místo a momentální přítomnost pracovníka. Zaměstnanec, který spí, cestuje nebo právě odpočívá, se stále počítá jako obsazené pracovní místo.

Stávkující pracovník si rovněž zachovává pracovní místo podle existujícího systému.

5. Které budovy zobrazují upozornění

Ikonku zobrazuj pouze u dokončených budov, které mají pracovní místa a potřebují zaměstnance.

Například:

Quarry

Hunting Lodge

Farmhouse

Lumberjack Hut

Iron Mine

Mill

Bakery

Wheelwright's Workshop

Marketplace, pokud má skutečná pracovní místa

Další pracovní budovy podle Building Registry

Nezobrazuj ji u:

House

Castle, pokud nemá pracovní místa

Walls

Towers bez pracovních míst

Fields a Orchards bez vlastního pracovního obsazení

Nedokončených blueprintů

Budov s nulovou kapacitou pracovníků

Nepoužívej pevně zakódovaný seznam budov. Vycházej z existujícího Building/Job Registry.

6. Fog of War

Ikonky musí respektovat Fog of War a Exploration Mode.

V aktuálně viditelné oblasti se zobrazují normálně.

V prozkoumané, ale momentálně neviditelné oblasti se nezobrazují jako živé informace.

V neprozkoumané oblasti jsou skryté.

Nesmí docházet k prozrazování aktuálního stavu budov mimo dohled.

7. Výkon

Nedělej kompletní kontrolu zaměstnanců každým snímkem.

Používej existující události Job Systemu a změny stavu budov.

Animaci blikání implementuj efektivně, ideálně sdílenou animační logikou.

Při stovkách budov musí hra zůstat plynulá.

8. Save / Load

Neukládej duplicitní stav ikonek.

Po načtení hry jej automaticky dopočítej podle skutečného počtu přiřazených zaměstnanců v jednotlivých budovách.

Zachovej kompatibilitu starších uložených her.

9. Testování

Ověř:

Budova bez zaměstnanců má červenou blikající ikonku.

Částečně obsazená budova má oranžovou ikonku.

Plně obsazená budova nemá ikonku.

Ikonka po Auto Employment správně zmizí.

Zaměstnanec na odpočinku není považován za chybějícího.

Hover ukazuje správný počet zaměstnanců.

Kliknutí otevře panel budovy.

Nedokončené budovy ikonku nemají.

Fog of War správně skrývá ikonky.

Zoom a pohyb kamery fungují bez problémů.

Save/Load obnovuje správný vizuální stav.

Před úpravami vytvoř bezpečný Git commit.

Po dokončení ověř funkční build, doplň změnu do sekce Unreleased v CHANGELOG.md a vytvoř nový commit.

Nevydávej automaticky novou verzi hry.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 07/15 – původní krok 25: Forestry & Natural Resources

**Milník:** M2. **Důležitá úprava:** Jednotné konečné ložisko Stone a Quarry MUSÍ překrývat skálu alespoň 1 tile a mít dostupný vstup; těžba volných kamenů je samostatná mechanika.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade 3: Forestry & Natural Resources

Rozšiř stávající izometrickou 2.5D strategii ve Phaseru o komplexní, ale výkonný systém přírodních zdrojů, růstu stromů, lesnictví, kamenolomů a těžby železné rudy.

Hlavní cíl: Přírodní zdroje budou existovat fyzicky na mapě. Stromy budou růst a obnovovat se, zatímco kamenná a železná ložiska budou mít omezené zásoby.

Navazuj na stávající systémy:

Object Registry a Asset Library

Profese a individuální skilly 1–50

Worker AI a osmisměrný pathfinding

Logistics System a fyzickou přepravu surovin

Warehouse a Starter Stockpile

Construction System a blueprinty

Fog of War

Game Time, Seasons a Weather

Path Wear System

Save/Load

Nezakládej nový projekt. Nejdříve ověř, které systémy jsou skutečně implementované, a nevytvářej duplicity. Pokud některá závislost zatím neexistuje, navrhni jednoduchou kompatibilní integraci.

1. Generování lesů na mapě

Při vytváření nové hry generuj přírodní lesní oblasti.

Pro mapu 100 × 100 použij přibližně 150–250 stromů.

Stromy rozmísťuj především do nepravidelných skupin, aby vznikaly přirozené lesy, nikoliv rovnoměrně rozházené jednotlivé stromy.

Podporuj dva druhy:

Oak – dub

Pine – borovice

Každý strom má vlastní ID, pozici, typ, stáří a růstový stav.

Stromy nesmějí blokovat počáteční pozici krále, dostupnost jeho počátečního skladiště ani nezbytné průchody mapou.

Respektuj existující terén a budovy.

Novou hru generuj s již existujícími mladými i dospělými stromy, aby bylo možné dřevo těžit okamžitě.

2. Růst stromů

Každý strom bude mít následující fáze:

Stage 0 – pařez po pokácení

Stage 1 – malý semenáček

Stage 2 – mladý strom

Stage 3 – dospělý strom

Po pokácení stromu zůstane pařez.

Výchozí doby růstu:

Pařez → semenáček: 1 herní den

Semenáček → mladý strom: 3 herní dny

Mladý strom → dospělý strom: 4 herní dny

Celková doba obnovy dospělého stromu tedy bude přibližně 8 herních dnů.

Použij existující Game Time System.

Růst nesmí být závislý na FPS.

Pokud existuje systém Seasons a Weather, aplikuj jednoduché modifikátory:

Spring: +25 % rychlosti růstu

Summer: +10 %

Autumn: -25 %

Winter: růst pozastaven

Tyto modifikátory musí být konfigurovatelné.

Na políčku, které bylo mezitím zastavěno nebo jinak trvale obsazeno, strom znovu nevyroste.

V první verzi nemusíš simulovat samovolné šíření lesa na nová políčka. Stromy se obnovují především na původních místech.

3. Těžba dřeva

Dospělý strom lze pokácet.

Výchozí parametry:

Oak: 6 Wood

Pine: 5 Wood

Základní doba kácení: 15 sekund

Kácení provádí skutečná jednotka.

Postup:

Dřevorubec vybere dospělý strom.

Zarezervuje jej.

Fyzicky k němu dojde.

Začne kácet.

Postupně roste ukazatel vykonané práce.

Po dokončení strom přejde do stavu pařezu.

Na zemi vznikne odpovídající množství Wood.

Dřevorubec dřevo vyzvedne.

Odnese jej do dostupného skladu.

Získá Woodcutting XP.

Dřevo se nesmí okamžitě teleportovat do inventáře.

Pokud už existuje Logistics System, použij jeho systém nákladů, rezervací a fyzického doručení.

Pokud pracovník nemůže odnést celé množství najednou, zbytek zůstane na místě.

Dva pracovníci nesmějí současně dokončit kácení stejného stromu.

4. Lumberjack Hut – Dřevorubecká chata

Přidej novou budovu:

ID: lumberjack_hut

Velikost: 2 × 2

Cena: 8 Stone

Pracovní místa: 3

Profese: Woodcutter

Pracovní rádius: 18 políček

Budova se staví pomocí existujícího blueprint systému.

Po dokončení umožní přiřadit až tři dřevorubce.

Dřevorubci automaticky vyhledávají dospělé stromy v pracovním rádiusu.

Pokud nejsou dostupné stromy, čekají.

Pokud je sklad plný, přeruší těžbu a nesmějí vytvářet suroviny, které nelze bezpečně uložit nebo ponechat na zemi.

Do panelu budovy přidej:

Počet pracovníků

Počet dostupných dospělých stromů v okolí

Aktuální úkoly

Množství dosud vytěženého dřeva

Denní produkci dřeva

5. Woodcutting Skill

Použij existující Woodcutting skill s levely 1–50.

Vyšší skill zrychluje kácení podle stávajícího vzorce:

Efficiency = 1 + (SkillLevel - 1) × 0.01

Příklady:

Level 1: 100 %

Level 25: 124 %

Level 50: 149 %

Nezvyšuj automaticky množství dřeva získaného z jednoho stromu.

Za dokončené kácení:

Oak: 15 Woodcutting XP

Pine: 12 Woodcutting XP

Celkové XP postavy připisuj podle existujícího Experience Systemu, bez duplicit.

Přirozený talent Woodcutting musí nadále poskytovat svůj existující bonus k XP.

6. Ruční kácení králem

Král musí mít také možnost kácet stromy.

Kliknutím na dospělý strom:

Zobraz interakci Chop Tree.

Král automaticky dojde ke stromu.

Pokud jede na koni, nejprve sesedne.

Použije svůj Woodcutting skill.

Po dokončení vznikne dřevo na zemi.

Král jej může sebrat a odnést do skladu.

Král získává odpovídající XP.

Kácení krále lze přerušit jiným příkazem.

Rozpracovaný postup kácení může zůstat zachovaný, ale nesmí být započítán vícekrát.

7. Přírodní kamenná ložiska

Rozšiř současný systém získávání kamene.

Zachovej existující volně ležící kameny a jejich respawn podle nastavení New Game Setup.

Navíc přidej přírodní kamenná ložiska:

ID: stone_deposit

Kategorie: Natural Resource Deposit

Rozměr: přibližně 2 × 2 políčka

Počet na mapě 100 × 100: 5

Zásoba: náhodně 80–160 Stone

Ložiska budou vypadat jako skalní útvary.

Množství dostupného kamene musí být individuálně evidováno pro každé ložisko.

Ložiska generuj pouze na vhodném terénu a nesmějí blokovat nezbytné cesty.

Po vytěžení zásoby se ložisko změní na vyčerpaný skalní útvar.

Kamenná ložiska se zatím automaticky neobnovují.

8. Rozšíření existujícího Quarry – finální pravidlo platí již od této etapy

Nedělej druhý typ kamenolomu.

Quarry 3×3 lze NOVĚ umístit pouze tak, aby alespoň jedno políčko půdorysu překrývalo skutečný objekt skalní překážky / stone_deposit s konečnou zásobou Stone; přístup pro dělníky ze skutečně průchozí oblasti mapy musí zůstat zachován. Při placingu povol pro Quarry tuto specifickou výjimku z kolize se skálou, nikoliv s jinými objekty nebo budovami. Preview musí rozlišit chybějící skálu a blokovaný přístup. Skála má unikátní ID, zásobu a je navázána na Quarry; stejný kámen nelze vytěžit dvakrát.

Quarry těží pouze z platně překrytého/přiřazeného skalního ložiska. Volně ležící kameny zůstávají samostatně sběratelné existující mechanikou King/Collector, ale NESLOUŽÍ jako alternativní nekonečný zdroj automatické produkce Quarry. Neskenuj automaticky vzdálená ložiska v okolí 12 políček. Při vyčerpání přiřazeného ložiska se produkce zastaví a zobrazí Deposit Depleted; případné znovupřipojení vyžaduje explicitní platné pravidlo, ne neviditelné přeskakování ložisek.

Pracovníci musí fyzicky dojít na přístupné pracovní místo u Quarry, nesmějí stát uvnitř neprůchozí skály. Základní těžba: 1 Stone / 12 sekund aktivní práce, 5 Mining XP. Materiál je fyzicky doručen do skladu podle Logistics Systemu. Zachovej existující Quarry ve starých savech i bez překryvu (legacy výjimka pouze pro již postavené budovy, bez přidávání skály pod ně); nová pravidla se vztahují na nové stavby.

Krok 35 později toto pravidlo pouze dořeší a otestuje společně se Smelter, nemá jej změnit zpět na těžbu z okolí.

9. Železná ložiska – Iron Deposits

Přidej nový přírodní zdroj:

ID: iron_deposit

Rozměr: 2 × 2 políčka

Počet na mapě 100 × 100: 4

Zásoba: náhodně 60–120 Iron Ore

Graficky musí být rozpoznatelný od kamenného ložiska.

Například tmavší skály s načervenalými rudnými žílami.

Ložiska mají omezenou zásobu.

Po vytěžení se označí jako Depleted.

Zatím se automaticky neobnovují.

10. Iron Mine – Železný důl

Přidej novou budovu:

ID: iron_mine

Velikost: 3 × 3

Cena: 12 Stone + 8 Wood

Pracovní místa: 3

Profese: Miner

Potřebuje dostupné Iron Deposit

Důl lze postavit pouze v dosahu železného ložiska.

Umístění musí být platné na izometrické mřížce a nesmí překrývat samotný přírodní objekt.

Maximální vzdálenost dolu od ložiska: 4 políčka.

Po dokončení dolu mohou přiřazení horníci začít těžit.

Výchozí těžba:

Jedna operace: 1 Iron Ore

Základní čas: 20 sekund

Odměna: 8 Mining XP

Rychlost těžby ovlivňuje existující Mining Skill.

Horníci musí fyzicky dojít na dostupné pracovní místo u ložiska.

Vytěžená ruda musí být fyzicky přepravena do Warehouse.

Pokud je sklad plný, těžba se pozastaví nebo se bezpečně zachová vytěžený materiál na místě.

11. Nové suroviny

Zaregistruj:

Wood

Iron Ore

Wood je stavební materiál.

Iron Ore je zatím surová ruda, nikoliv hotové železo.

Nepřidávej zatím hutě, tavicí pece ani výrobu ingotů.

Zachovej Gold, Stone, Meat, Wheat, Apple, Flour a Bread.

12. Využití dřeva při stavění

Rozšiř stavební náklady u vybraných budov.

Nové ceny:

Lumberjack Hut: 8 Stone

Iron Mine: 12 Stone + 8 Wood

U ostatních současných budov zatím zachovej jejich existující ceny.

Systém výstavby ale musí nyní správně podporovat budovy s více druhy vstupních surovin.

Doprava stavebního materiálu musí respektovat existující Logistics System.

Pokud není dostatek Wood, stavbu Iron Mine nelze zahájit.

13. Vliv na Pathfinding a terén

Dospělé stromy a velké skalní útvary představují překážky pro pohyb.

Po pokácení stromu se políčko stane průchozím, pokud na něm není jiná překážka.

Pařez může zůstat jako nízká dekorace.

Při opětovném růstu stromu se aktualizuje průchodnost odpovídající růstové fáze.

Strom nesmí vyrůst přímo pod stojící nebo procházející jednotkou. Pokud je políčko obsazeno, růst do neprůchozí fáze odlož.

Zachovej osmisměrný pohyb a ochranu proti diagonálnímu procházení rohy překážek.

Dřevorubci a horníci přispívají ke stávajícímu systému vyšlapávání cest.

14. Fog of War

Stromy, skalní útvary a ložiska musí respektovat aktuální Fog of War.

Při zapnutém FoW a Exploration platí tři stavy: UNEXPLORED černá oblast, EXPLORED šedá naposledy známá mapa, VISIBLE skutečný aktuální stav. Nikdy bezdůvodně nezobrazuj celý terén.

V prozkoumaných oblastech mimo dohled se zobrazí pouze poslední známý statický stav stromů a ložisek z Persistent Map Memory; živý stav zůstane skrytý.

Skryté objekty nelze nově vybrat kliknutím.

AI pracovníků nadále pracuje i mimo zorné pole krále.

Zajisti, aby skrývání grafiky neovlivňovalo skutečnou simulaci.

15. Asset Library

Přidej definice:

oak_tree

pine_tree

lumberjack_hut

wood

stone_deposit

iron_deposit

iron_mine

iron_ore

U stromů přidej růstové fáze a těžební výnos.

U ložisek přidej aktuální a maximální zásobu.

U budov přidej pracovní kapacity a náklady.

Připrav možnost pozdějšího nahrazení grafiky profesionálními izometrickými sprity.

16. Save / Load

Rozšiř stávající ukládání hry.

Ukládej:

Typ, ID, pozici a fázi růstu stromu.

Jeho dosavadní postup růstu.

Stav pařezu.

Aktuální zásobu každého ložiska.

Stav vyčerpaných ložisek.

Postavené dřevorubecké chaty a doly.

Přiřazené pracovníky.

Rozpracovanou těžbu.

Rezervace těžebních úkolů.

Fyzické náklady dřeva a železné rudy.

Skladové zásoby.

Odpovídající nové skilly a statistiky.

Po načtení se nesmí znovu generovat původní stromy a ložiska.

Nesmí dojít k opakovanému přidání vytěžených surovin.

Zachovej kompatibilitu starších save souborů.

Pokud starší save neobsahuje lesy ani ložiska, zvol bezpečnou migraci, která nepoškodí existující stav světa.

17. Optimalizace

Mapa má 100 × 100 políček.

Stromy a ložiska reprezentuj především jednoduchými datovými objekty.

Růst rostlin nepočítej každý snímek.

Používej centrální herní čas.

Nevytvářej samostatné časovače pro každý strom.

Grafiku mimo viditelnou oblast kamery nevykresluj zbytečně.

AI pracovníků nemusí vyhledávat nové úkoly každý snímek.

Opakované pathfinding výpočty omezuj pomocí rezervací a plánování úkolů.

18. Testování

Před úpravami vytvoř Git commit.

Ověř:

Lesy se generují v přirozených skupinách.

Stromy mají různé fáze růstu.

Dřevorubci dokážou samostatně kácet stromy.

Dřevo se fyzicky přepravuje do skladu.

Král může pokácet strom.

Po pokácení vznikne pařez.

Strom postupně znovu vyroste.

Růst respektuje roční období, pokud je systém implementován.

Kamenná ložiska obsahují omezené zásoby.

Nově umístěné Quarry těží pouze z platně překrytého skalního ložiska a má přístupné pracovní místo.

Iron Mine lze postavit pouze v dosahu železného ložiska.

Horníci získávají Iron Ore.

Železná ruda se fyzicky dopravuje do skladu.

Ložisko se nemůže vytěžit do záporných hodnot.

Woodcutting a Mining XP se správně přičítají.

Stromy a ložiska správně ovlivňují pathfinding.

Fog of War funguje.

Save/Load obnovuje všechny přírodní zdroje a rozpracované úkoly.

Nedochází k duplicitnímu vytváření surovin.

Hra zůstává plynulá na mapě 100 × 100.

19. Postup implementace

Rozděl práci na čtyři fáze:

Fáze A – Forestry
Generování lesů, růst stromů, kácení a Woodcutting.

Fáze B – Lumberjack Hut
Pracovní budova, automatická práce dřevorubců a doprava dřeva.

Fáze C – Natural Mining
Kamenná a železná ložiska, těžba a Iron Mine.

Fáze D – Integration
Stavební náklady, logistika, Save/Load, Fog of War, optimalizace a testování.

Po každé dokončené a otestované fázi vytvoř samostatný Git commit.

Neimplementuj zatím zpracování železné rudy, těžbu uhlí ani složitý průmysl.

Prioritou je propojení obnovitelných lesů s konečnými nerostnými ložisky a spolehlivý fyzický pohyb vytěžených surovin.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 08/15 – původní krok 31A: Extended Zoom Out

**Milník:** M2. **Důležitá úprava:** Samostatně ověř min zoom a přesnost izometrického klikání, FoW a výkon.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Extended Camera Zoom & Daily Resource Statistics

V této samostatné etapě implementuj pouze větší rozsah Zoom Out. Ekonomické statistiky jsou následující etapa 31B.

Nezakládej nový projekt. Nejprve analyzuj aktuální Camera System, ovládání kolečkem myši, izometrický renderer, Resource Inventory, Logistics System, Warehouse, Granary, Economy System, Game Time, Save/Load a horní UI panel.

Zachovej všechny již fungující mechaniky.

1. Rozšíření Zoom Out

Uprav existující Camera Zoom System tak, aby hráč mohl mapu oddálit výrazně více než nyní.

Požadavky:

Zachovej stávající ovládání kolečkem myši.

Sniž minimální úroveň zoomu.

Jako výchozí návrh použij minimální zoom 0.25×, pokud to aktuální renderer umožňuje.

Zachovej dosavadní maximální přiblížení, pokud není potřeba změna kvůli technickým omezením.

Zachovej dosavadní výchozí úroveň přiblížení.

Zoom musí být plynulý.

Kamera nesmí překračovat povolené hranice mapy.

Zoom musí fungovat správně na izometrické mapě 100×100.

Pokud má projekt vlastní způsob přepočtu souřadnic, ověř jeho správnou funkci při nižším zoomu.

2. Chování při velkém oddálení

Při velkém oddálení musí nadále správně fungovat:

Vykreslování terénu.

Budovy a blueprinty.

Stromy, kameny a ložiska.

Postavy a zvířata.

Fog of War.

Kruhový View Range.

Exploration Mode.

Zvýraznění vybraných objektů.

Klikání na objekty.

Výběr stavebních pozic.

Pohyb kamery.

Zajisti, že kliknutí odpovídá správnému políčku bez ohledu na zoom.

Fog of War se musí oddalovat společně s mapou a nesmí se vizuálně oddělit od terénu.

Pokud se při extrémním oddálení objekty stanou příliš malé, můžeš snížit zobrazení nepodstatných detailů, například drobných ikon nebo dlouhých popisků.

Neodstraňuj samotné herní objekty.

3. Výkon při velkém oddálení

Při velkém Zoom Out je na obrazovce viditelná mnohem větší část mapy.

Optimalizuj vykreslování, aby zbytečně neklesalo FPS.

Použij existující culling a efektivní vykreslování izometrických objektů.

Zabraň:

Zbytečnému vytváření nových grafických objektů.

Opakovanému přepočítávání celé mapy bez důvodu.

Nadměrnému překreslování Fog of War.

Zbytečným aktualizacím vzdálených objektů.

Pokud existuje Performance Monitor, využij jej pro srovnání FPS při současném a novém minimálním zoomu.

ČÁST B – DENNÍ STATISTIKY SUROVIN

## Integrační testy etapy 31A

1. Kamera zvládá minimálně zoom 0.25×, pokud renderer tento rozsah bezpečně podporuje; jinak použij nejnižší prokazatelně bezpečnou hodnotu a vysvětli proč.
2. Klikání a výběr políčka funguje i při extrémním zoomu; hranice mapy, pan a přesun kamery zůstávají korektní.
3. Fog of War, Memory mapy, postavy, přístupnost UI a vrstvy fungují na 0.25×.
4. FPS zůstává přiměřené a Save/Load nemění zvolený zoom podle existujících pravidel.
5. Proveď testy, build, commit a Unreleased; další etapou je 31B.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 09/15 – původní krok 31B: Daily Resource Statistics & Ledger

**Milník:** M2. **Důležitá úprava:** Denní ledger používá autoritativní ekonomické události, ne interní přesuny a ne odečty podle jednoho skladu.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Daily Resource Statistics & Transaction Ledger (samostatná etapa 31B)

4. Změna horní Resource Bar

U každé suroviny zobraz kromě aktuálního množství také její čistou změnu za poslední dokončený herní den.

Příklad:

Stone: 125 (+18)
Wood: 80 (-12)
Gold: 250 (+5)
Bread: 45 (+20)
Meat: 30 (-8)

Pravidla zobrazení:

Kladná změna: zelená hodnota s +.

Záporná změna: červená hodnota s -.

Nulová změna: neutrální šedá hodnota 0.

Použij skutečné barvy a grafický styl aktuálního rozhraní.

Denní změna musí být vizuálně menší než hlavní množství suroviny, aby horní panel zůstal přehledný.

Pokud se všechny suroviny nevejdou na jednu řádku, použij kompaktní rozložení nebo rozbalovací přehled.

5. Co znamená poslední den

Používej existující Game Time System.

Standardně trvá jeden herní den 120 sekund, ale respektuj nastavení New Game Setup.

Denní bilance musí být nezávislá na FPS.

Po skončení herního dne:

Uzavři statistiky dokončeného dne.

Ulož celkový zisk a spotřebu každé suroviny.

Vypočítej čistou změnu.

Připrav záznam pro další den.

V horní liště zobraz bilanci právě dokončeného dne.

Během aktuálně probíhajícího dne se v horní liště nadále zobrazuje poslední dokončený den.

Pokud ještě neuplynul ani jeden herní den, zobraz neutrální informaci, například —, místo vymyšlených údajů.

6. Detail po najetí myší

Po najetí myší na konkrétní surovinu otevři tooltip s přehledem denní ekonomiky.

Příklad pro Stone:

STONE

Current Storage: 125

LAST GAME DAY

Production: +30
Consumption: -12

Net Change: +18

INCOME
+20 Mining
+10 Stone Collection

EXPENSES
-10 Castle Construction
-2 Warehouse Construction

Tooltip musí obsahovat:

Název suroviny.

Aktuální množství.

Zisk za poslední dokončený den.

Spotřebu za poslední dokončený den.

Čistou změnu.

Rozpis jednotlivých zdrojů příjmů.

Rozpis jednotlivých kategorií výdajů.

Tooltip musí fungovat pro všechny skutečně dostupné suroviny včetně Gold.

Pokud je seznam dlouhý, zajisti jeho přehledné zobrazení a případné scrollování.

7. Kategorizace příjmů

Zaznamenávej, odkud suroviny přicházejí.

Příklady:

Stone:

Mining

Stone Collection

Trade Purchase

Construction Refund

Wood:

Woodcutting

Trade Purchase

Construction Refund

Wheat:

Farming

Trade Purchase

Apple:

Orchard Harvest

Trade Purchase

Flour:

Milling Production

Trade Purchase

Bread:

Bakery Production

Trade Purchase

Meat:

Hunting

Trade Purchase

Iron Ore:

Iron Mining

Trade Purchase

Gold:

Castle Income

Trade Sales

Treasure

Other Existing Income

Používej skutečné implementované systémy.

Pokud některá uvedená činnost ve hře neexistuje, nevytvářej ji pouze kvůli statistikám.

8. Kategorizace výdajů

Zaznamenávej, za co se suroviny spotřebovávají.

Příklady:

Building Construction

Production Processing

Food Consumption

Trade Sales

Wages

Trade Purchases

Other Existing Expenses

Při stavění eviduj konkrétní budovu, například:

-10 Stone – Castle Construction

Při výrobě zobraz:

-4 Wheat – Mill

Při spotřebě jídla zobraz:

-12 Bread – Villager Consumption

Při výplatě mezd:

-18 Gold – Worker Wages

Nevytvářej duplicitní statistiky pro stejnou transakci.

9. Správná integrace s fyzickou logistikou

Toto je zásadní.

Použij existující autoritativní Resource System.

Rozlišuj:

Vznik nové suroviny.

Přesun suroviny.

Spotřebu suroviny.

Prodej suroviny.

Nákup suroviny.

Vrácení suroviny.

Příklad:

Horník vytěží 10 Stone.

Kameny seberou nosiči.

Odnesou je do Warehouse.

Denní statistika musí vykázat pouze:

+10 Stone – Mining

Nesmí vykázat další příjem při:

Sebrání nákladu.

Předání nosiči.

Uložení do Warehouse.

Přesunu mezi sklady.

Doručení na staveniště.

Interní logistické přesuny nejsou nové příjmy ani skutečná spotřeba.

Materiál rezervovaný pro stavbu se nemá automaticky počítat jako spotřebovaný.

Za skutečnou spotřebu jej považuj až v okamžiku, který autoritativní stavební systém používá jako nevratné využití materiálu.

U zrušené stavby správně eviduj pouze skutečně ztracenou část materiálu. Materiál pouze vrácený ze staveniště do skladu není nový zisk.

Stejná pravidla platí pro výrobní budovy, sklady a obchodníky.

10. Central Resource Transaction Ledger

Vytvoř centrální systém pro evidenci ekonomických transakcí, například:

ResourceTransactionLedger

Každá skutečná ekonomická událost bude mít:

Unique Transaction ID

Game Time

Resource Type

Quantity

Direction / Transaction Type

Source / Reason

Related Building ID nebo Entity ID

Game Day

Zaznamenávej pouze skutečně dokončené transakce.

Nepoužívej samostatné nezávislé výpočty v každé UI komponentě.

UI musí pouze číst agregované statistiky z tohoto systému.

Pokud již existuje podobná evidence transakcí, rozšiř ji a nevytvářej druhou.

Zajisti, aby opakovaná událost se stejným ID nebyla započítána dvakrát.

11. Výpočty denní bilance

Pro každou surovinu vypočítej:

Daily Income = součet všech skutečných příjmů.

Daily Expenses = součet všech skutečných výdajů.

Daily Net Change = Daily Income - Daily Expenses.

Příklad:

Wood

Income: +35
Expenses: -18
Net: +17

Při klasifikaci rozlišuj externí příjmy, produkci, spotřebu a interní převody.

Denní bilance musí odpovídat skutečné ekonomice hry.

Nepočítej rozdíl pouze podle stavu jednoho Warehouse, protože suroviny mohou být fyzicky na více místech.

Pokud hráč používá více skladů, musí být zahrnutý celý majetek království včetně přepravovaného a doručeného, ale ještě nespotřebovaného materiálu.

12. Historie statistik

Uchovávej ekonomickou historii posledních 30 herních dnů.

Pro každý den a surovinu ukládej:

Income

Expenses

Net Change

Breakdown by Category

Historie musí být připravená pro budoucí grafy ekonomiky.

Prozatím není potřeba vytvářet nový rozsáhlý Economy Dashboard.

Zaměř se hlavně na horní Resource Bar a hover tooltipy.

Starší záznamy nad limit mohou být automaticky odstraněny.

13. Gold Economy

Gold musí používat stejný denní přehled jako ostatní suroviny.

Příjmy:

Castle Income

Trade Sales

Treasure

Other Existing Income

Výdaje:

Wages

Trade Purchases

Other Existing Expenses

Při výplatách pracovníků eviduj skutečně vyplacené zlato.

Nevyplacené mzdy nejsou skutečný výdaj Gold, dokud nedojde k platbě.

Zabraň duplicitním záznamům při denním ekonomickém vyhodnocení.

14. Save / Load

Rozšiř stávající Save/Load.

Ukládej:

Aktuální rozpracovanou denní bilanci.

Poslední dokončenou denní bilanci.

Historii za 30 herních dnů.

Poslední zpracovaná ID transakcí potřebná pro ochranu před duplicitami.

Stav dne, ke kterému statistiky patří.

Po načtení:

Nesmí vzniknout falešné ekonomické transakce při obnově inventáře.

Nesmí být zpětně přičtená již zaznamenaná produkce.

Nesmí dojít k opakované denní uzávěrce.

Statistiky musí pokračovat ze správného stavu.

U starších save souborů bez statistik začni evidenci od okamžiku načtení.

Nevymýšlej historické ekonomické údaje.

15. Background Simulation

Pokud již existuje Run in Background, zahrň do statistik i transakce vzniklé při simulaci neaktivní karty; jinak připrav čisté API pro pozdější integraci v etapě 29B a nepředstírej, že simulace na pozadí už funguje.

Při návratu musí denní bilance odpovídat skutečným změnám.

Například při simulaci tří herních dnů vytvoř tři samostatné denní záznamy.

Nezapočítej vše do jediného dne jen proto, že se události dopočítaly při návratu.

16. Uživatelské rozhraní

Zachovej stávající styl Medieval Kingdom.

Denní změnu zobraz menším písmem za množstvím suroviny.

Příklad:

Stone 125  +18

Wood 80  -12

Bread 45  +20

Pozitivní a negativní hodnoty vizuálně rozlišuj.

Tooltip umisťuj tak, aby nevystupoval mimo obrazovku.

Zajisti, aby šlo bez problémů používat:

Levý Settings panel.

Pravý Population panel.

Spodní Buildings panel.

Hlavní kameru.

Při otevřeném tooltipu nesmí scrollování uvnitř tooltipu měnit zoom kamery.

## Integrační testy etapy 31B

1. Poslední **dokončený** herní den ukazuje přesně příjem, spotřebu a saldo pro každou reálnou surovinu (před prvním dokončeným dnem "—").
2. Tooltip rozpadá příjmy a náklady podle skutečných zdrojů a důvodů; vykazuje skutečně zaplacené mzdy a reálné obchodní transakce pouze pokud jsou tyto systémy implementované.
3. Při těžbě + přenášení + uložení není surovina započtena víckrát; interní přesuny se nepočítají jako příjmy/výdaje.
4. Rezervovaný stavební materiál není spotřebován dříve než při nevratném použití; stornování stavby nevytváří falešný příjem.
5. Výroba 3 Iron Ore + 2 Wood -> 1 Iron Bar musí být po pozdějším kroku 35 správně zachycena a testy doplněny, až bude budova existovat.
6. Denní uzávěrky jsou idempotentní, posledních 30 dní je uložených a Save/Load nepřipisuje transakce zpětně.
7. Vytvoř testy, build, commit a Unreleased; následuje etapa 35.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 10/15 – původní krok 35: Quarry Placement & Iron Smelter

**Milník:** M2. **Důležitá úprava:** Nezakládej znovu pravidla Quarry z etapy 25. Přidej Iron Bar recept 3 Iron Ore + 2 Wood, produkce 40 s.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Quarry Placement & Iron Smelter

Rozšiř stávající izometrickou 2.5D strategii Medieval Kingdom o dvě změny:

Úpravu pravidel umisťování kamenolomu (Quarry), který musí být částečně postaven na skalní překážce.

Novou budovu Smelter (Slévárna), která vyrábí Iron Bars ze surové Iron Ore.

Nezakládej nový projekt. Nejprve analyzuj existující Building Placement, Terrain Collision, Natural Resources, Quarry, Iron Mine, Production System, Worker AI, Logistics, Asset Library a Save/Load.

Zachovej dosavadní herní mechaniky.

ČÁST A – QUARRY PLACEMENT

1. Povinné umístění na skále

Uprav existující Quarry pouze pokud krok 25 finální placement pravidlo ještě nemá; jinak ho ověř, oprav případné chyby a NEDUPLIKUJ implementaci.

Zachovej jeho aktuální rozměry, stavební cenu, pracovní kapacitu a rychlost těžby, pokud není níže uvedeno jinak.

Nové pravidlo:

Quarry lze postavit pouze tehdy, pokud alespoň jedno políčko jeho stavebního půdorysu překrývá objekt skalní překážky.

Příklad pro Quarry 3×3:

Budova zabírá 9 políček.

Alespoň 1 z těchto políček musí obsahovat skalní překážku.

Ostatní políčka musí být vhodná pro stavbu.

Pokud je skalní překážka větší než jedno políčko, stačí průnik půdorysů alespoň jednoho skutečného políčka.

Za platný skalní objekt považuj:

Rock Obstacle.

Přírodní skalní útvar.

Stone Deposit, pokud jde skutečně o skalní objekt.

Za platný skalní objekt NEPOVAŽUJ:

Volně ležící sebratelný kámen.

Dekorativní texturu kamenné země.

Předmět nesený pracovníkem.

Materiál uložený ve skladu.

Použij existující Object Registry.

Nevytvářej duplicitní kategorii skal, pokud ji hra již má.

2. Výjimka z kolizí při stavbě

Současný Building Placement pravděpodobně nedovoluje stavět přes neprůchozí objekty.

U Quarry vytvoř speciální výjimku:

Quarry smí částečně překrývat skalní překážku.

Nesmí překrývat jinou budovu.

Nesmí překrývat nepovolený přírodní objekt.

Nesmí zasahovat mimo hranice mapy.

Musí zachovat průchozí přístup pro pracovníky.

Výjimka platí pouze pro Quarry a povolené skalní objekty.

Nesmí nechtěně umožnit ostatním budovám stavět přes překážky.

3. Kontrola přístupnosti pro pracovníky

Kamenolom musí mít přístupné místo, odkud mohou pracovníci vstoupit nebo pracovat.

Požadavky:

Alespoň jedno vhodné přístupové políčko u budovy.

Přístupové políčko musí být průchozí.

Nesmí být blokované skalou nebo jinou stavbou.

Musí existovat platná pěší cesta z dostupné části herního světa.

Použij skutečný Pathfinding.

Pokud je kamenolom umístěn správně na skále, ale není k němu přístup, umístění je neplatné.

Dělníci nemusí vstupovat přímo na neprůchozí skalní políčko. Mohou vykonávat těžbu z definovaného pracovního místa u kamenolomu.

Vstup a pracovní místa nesmějí být zablokované vlastním půdorysem stavby.

4. Stavební náhled

Při umisťování Quarry uprav Blueprint Preview.

Platné umístění:

Zelený náhled.

Neplatné umístění:

Červený náhled.

Zobraz konkrétní důvod:

Quarry must overlap a rock formation.

nebo

Workers need access to the quarry.

nebo

Building placement blocked.

Pokud je umístění platné, zvýrazni skalní objekt, ke kterému bude kamenolom přiřazen.

5. Vazba kamenolomu na skalní objekt

Po dokončení stavby ulož jednoznačnou vazbu mezi Quarry a příslušným skalním objektem.

Například:

Quarry -> Rock Deposit ID

Jestliže stavební půdorys překrývá více skalních objektů, vyber jedno jednoznačné primární ložisko podle stabilního pravidla.

Zabraň tomu, aby několik kamenolomů mohlo současně neomezeně těžit stejnou konečnou zásobu bez kontroly rezervací.

Pokud má skalní objekt zásobu kamene, používej její skutečné množství.

Stone Deposit z kroku 25 již má jedinečnou konečnou zásobu 80–160 Stone; pokud chybí, doplň ji bez druhého nezávislého registru ložisek.

Zachovej případné existující ložiskové hodnoty a pravidla těžby.

Když se ložisko vyčerpá:

Quarry přestane produkovat kámen.

Zobrazí stav Deposit Depleted.

Budova zůstane na mapě.

Kamenolom nesmí pokračovat v těžbě z neexistující zásoby.

Pokud už existuje funkční možnost připojení k dalšímu ložisku, zachovej ji pouze tehdy, pokud nové ložisko splňuje skutečná pravidla dostupnosti.

6. Grafické zobrazení

Kamenolom musí vizuálně působit jako stavba částečně zasazená do skály.

Ponech viditelnou odpovídající část skalního útvaru.

Nepřekresluj automaticky celý skalní objekt obyčejnou zemí.

Podle dostupných assetů může Quarry obsahovat:

Dřevěnou konstrukci.

Pracovní plošinu.

Těžební prostor.

Nakládací místo.

Správně řeš izometrické pořadí vrstev.

Skála, budova a pracovníci se nesmějí nesprávně překrývat.

7. Existující kamenolomy

Pokud starší uložená hra již obsahuje Quarry, který nestojí na skalní překážce, nesmí být automaticky odstraněn.

Nové pravidlo aplikuj na nově umisťované kamenolomy.

U starých budov použij bezpečnou migraci, která zachová jejich existující stav a zabrání pádu hry.

Nepřidávej automaticky nové skály pod existující budovy.

ČÁST B – IRON SMELTER

8. Nová budova Smelter

Přidej novou výrobní budovu:

ID: smelter

Name: Smelter

Czech Name: Slévárna

Size: 3×3

Construction Cost: 12 Stone + 10 Wood

Worker Slots: 2

Profession: Smelter Operator

Product: Iron Bar

Budova se staví prostřednictvím současného Blueprint a Construction Systemu.

Musí být možné ji umístit na standardní vhodný terén.

Není nutné, aby stála na železném ložisku. Iron Ore se bude dovážet z dolu.

Do Buildings a Asset Library přidej odpovídající definici.

9. Výroba železa

Implementuj nový výrobní recept:

Iron Bar

Input:

3 Iron Ore

2 Wood

Output:

1 Iron Bar

Base Production Time:

40 sekund aktivní práce

Dřevo funguje jako zjednodušené palivo pro první verzi.

Nevytvářej zatím nový systém uhlí.

Recept musí být centrálně konfigurovatelný.

Železná ruda a dřevo musí být skutečně fyzicky doručeny do Smelter.

Výroba nesmí používat vzdálené zásoby přímo ze skladu bez fyzické přepravy.

10. Výrobní cyklus

Výroba probíhá následujícím způsobem:

Smelter má přiděleného pracovníka.

Zkontroluje dostupné vstupy.

Vytvoří logistické úkoly pro Iron Ore a Wood.

Nosiči dopraví suroviny do Smelter.

Materiály se bezpečně rezervují.

Pracovník zahájí tavicí proces.

Postupně roste výrobní progress.

Po dokončení se spotřebují rezervované vstupy.

Vznikne 1 Iron Bar.

Hotový výrobek je uložen ve výstupním zásobníku.

Nosič jej odnese do Warehouse.

Může začít další výrobní cyklus.

Využij existující Production System.

Nevytvářej duplicitní logiku výrobních budov.

Při dokončení výroby odečti vstupy právě jednou, podle skutečného modelu rezervací a spotřeby.

11. Nová surovina Iron Bar

Přidej do Resource Registry:

ID: iron_bar

Name: Iron Bar

Category: Processed Material

Storage: Warehouse

Iron Ore a Iron Bar musí být dvě oddělené suroviny.

Iron Ore = surová železná ruda.

Iron Bar = zpracované železo.

Iron Bar se nesmí automaticky vytvářet při těžbě.

Do horní Resource Bar přidej nový ukazatel železných prutů.

Přidej také odpovídající ikonu nebo sprite.

Pro účely budoucí logistiky nastav hmotnost Iron Bar na 5 load units, pokud současný systém používá hmotnostní jednotky.

12. Nová profese a skill

Přidej profesi:

Smelter Operator

Pracoviště:
Smelter

Hlavní skill:
Smelting

Pokud už existuje vhodný odpovídající skill, použij jej.

Jinak přidej Smelting s levely 1–50.

Vyšší skill zrychluje výrobu.

Použij současný vzorec pracovní efektivity:

Efficiency = 1 + (SkillLevel - 1) × 0.01

Pracovník získává Smelting XP pouze za skutečně dokončené výrobní cykly.

Výchozí odměna:

10 Smelting XP za 1 Iron Bar.

Dodrž existující systém celkového XP, talentů a mezd.

13. Integrace zaměstnávání

Novou profesi přidej do:

Job Registry.

Auto Employment.

Assign Worker Menu.

Population Sidebar.

Skill Sorting.

Worker AI.

Wage System.

Automatické zaměstnávání má vybrat nezaměstnaného s nejvyšším Smelting Skillem.

Zaměstnané poddané automaticky nepřeřazuj.

Portrét Smelter Operator bude mít vlastní barvu pozadí, například tmavě oranžovou.

14. Panel slévárny

Po kliknutí na Smelter otevři výrobní panel.

Zobraz:

SMELTER

Workers: 1 / 2

Production:
Iron Bar

Required:

Iron Ore: 3

Wood: 2

Current Production:
65 %

Output Storage:
4 Iron Bars

Přidej:

Auto Production ON/OFF.

Výrobní progress.

Počet přidělených zaměstnanců.

Stav vstupních zásob.

Stav výstupního zásobníku.

Informaci o nedostatku surovin.

Pokud chybí zaměstnanci, zobraz existující blikající indikátor Missing Workers.

Pokud chybí suroviny, ukaž důvod zastavení výroby.

15. Využití železných prutů

Iron Bars budou připravené pro výrobu:

Nářadí.

Zbraní.

Brnění.

Trakařů.

Koňských povozů.

Dalších pokročilých staveb.

Připrav Iron Bar jako autoritativní zpracované železo pro pozdější Wheelwright (krok 34). Zatím automaticky neměň ostatní již fungující recepty bez testu ekonomické dosažitelnosti.

Neměň ale plošně všechny ceny budov a výrobků.

Nové využití Iron Bar musí respektovat dostupnost suroviny a fyzickou logistiku.

16. Resource Statistics

Napoj výrobu na existující denní statistiky surovin.

Při dokončení jednoho výrobního cyklu zaznamenej:

Iron Ore: -3 (Smelting)

Wood: -2 (Smelting Fuel)

Iron Bar: +1 (Smelter Production)

Pokud logistika pouze přesune suroviny mezi Warehouse a Smelter, nesmí to být vykázané jako nový příjem nebo výdaj.

Spotřebu eviduj pouze jednou.

Po najetí na Iron Bar v Resource Bar musí být viditelná denní produkce a její zdroj.

17. Fog of War a Map Memory

Quarry i Smelter musí respektovat aktuální Fog of War.

V prozkoumané oblasti mimo View Range zůstává poslední známý vizuální stav budov.

Aktuální animace těžby nebo tavby nesmějí prozrazovat skryté informace mimo dohled.

Skalní překážka také musí respektovat Map Memory.

Vyčerpání ložiska mimo dohled se projeví až při opětovném spatření oblasti.

18. Save / Load

Rozšiř existující ukládání.

U Quarry ukládej:

Přiřazený skalní objekt.

Stav ložiska.

Zbývající zásobu.

Průběh těžby.

U Smelter ukládej:

Budovu a její stav.

Přiřazené zaměstnance.

Vstupní suroviny.

Výstupní zásobník.

Aktuální výrobní progress.

Výrobní rezervace.

Auto Production.

Novou surovinu Iron Bar.

Smelting Skill a XP.

Po načtení nesmí dojít k:

Duplicitní produkci Iron Bars.

Dvojité spotřebě Iron Ore nebo Wood.

Znovuvytvoření vytěženého ložiska.

Ztrátě vazby Quarry na skálu.

Duplicitním pracovníkům.

Zachovej kompatibilitu starších save souborů.

Pokud se změní struktura uložených dat, aktualizuj samostatný Save Schema Version.

19. Výkon

Nové systémy musí fungovat na mapě 100×100.

Nepočí­tej kompletní validaci všech okolních skal každým herním snímkem.

Validaci umístění proveď při změně pozice stavebního náhledu.

Výrobu aktualizuj pomocí existujícího Game Time a Production Systemu.

Zabraň zbytečným pathfinding výpočtům pracovníků.

Zachovej podporu Run in Background, pokud je implementovaná.

20. Testování

Ověř:

Quarry nelze umístit na obyčejnou louku.

Quarry lze umístit s překryvem jednoho políčka skalní překážky.

Quarry lze umístit s větším platným překryvem skály.

Quarry nelze umístit přes jinou budovu.

Quarry nelze postavit bez přístupu pro dělníky.

Blueprint ukazuje správný důvod neplatného umístění.

Dělníci mohou do kamenolomu fyzicky dojít.

Quarry těží z přiřazeného skalního ložiska.

Vyčerpané ložisko přestane produkovat kámen.

Starší uložené kamenolomy zůstanou funkční.

Smelter lze postavit.

Smelter přijímá Iron Ore a Wood.

Smelter produkuje Iron Bar.

Výroba vyžaduje pracovníka.

Smelting Skill zrychluje práci.

Auto Employment obsazuje pracovní místa.

Iron Bars jsou fyzicky dopravovány do Warehouse.

Denní statistiky správně zaznamenávají výrobu.

Fog of War správně skrývá aktuální změny.

Save/Load zachovává všechna data.

Nedochází k duplicitnímu vytváření nebo spotřebě surovin.

Hra zůstává stabilní při více kamenolomech a slévárnách.

21. Postup implementace

Rozděl upgrade do tří fází:

Phase A – Quarry Placement
Kolize, povinný překryv skály, validace přístupu a vazba na ložisko.

Phase B – Iron Smelter
Nová budova, Iron Bar, výrobní recept, profese a výrobní AI.

Phase C – Integration
Logistika, zaměstnávání, Resource Statistics, Fog of War, Save/Load a testování.

Před úpravami vytvoř bezpečný Git commit.

Po každé dokončené a otestované fázi vytvoř samostatný commit.

Zapiš skutečně dokončené změny do sekce Unreleased v CHANGELOG.md.

Nevydávej automaticky novou verzi hry.

Prioritou je správné umisťování Quarry a stabilní výroba Iron Bars bez ztráty nebo zdvojování surovin.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 11/15 – původní krok 37: Stone Pavement & Courtyards

**Milník:** M3. **Důležitá úprava:** Infrastructure → Stone Pavement, cestovní bonus +25 %, 1 Stone na 2 nové tiles za stavební objednávku.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

# Medieval Kingdom – Upgrade: Stone Pavement, Roads & Courtyards

Rozšiř stávající izometrickou 2.5D strategii Medieval Kingdom o možnost stavět trvalé dlážděné cesty a zpevněné plochy.

**Hlavní cíl:** Hráč může pomocí kamene vytvářet dlážděné cesty, nádvoří a náměstí. Dláždění zvyšuje rychlost pohybu jednotek a zlepšuje logistiku království.

Nezakládej nový projekt. Nejprve analyzuj existující Buildings Menu, Building Registry, Blueprint System, Construction System, Logistics, Pathfinding, Path Wear System, Isometric Renderer a Save/Load.

Zachovej současné herní mechaniky.

## 1. Nová stavba – Stone Pavement

Přidej:

- ID: `stone_pavement`
- Name: Stone Pavement
- Czech Name: Dlážděná cesta
- Category: Infrastructure
- Size: 1×1 tile
- Construction Cost: 1 Stone za každá 2 nově dlážděná políčka, zaokrouhleno nahoru na úroveň jedné stavební objednávky
- Movement Speed Bonus: +25 %
- Durability: Permanent

Stone Pavement není klasická neprůchozí budova.

Jedná se o speciální povrchovou vrstvu terénu.

Dlážděná políčka musí zůstat průchozí pro pěší jednotky, koně, trakaře a povozy, pokud je dané místo jinak průchozí.

## 2. Nová kategorie Infrastructure

Do Buildings Menu přidej kategorii:

`Infrastructure`

Ikona: cesta nebo kamenná dlažba.

Zařaď sem Stone Pavement.

Do budoucna připrav možnost přidat:
- Dirt Road
- Stone Road
- Bridge
- Town Square

Tyto další typy zatím neimplementuj.

Záložka All musí obsahovat také Stone Pavement.

## 3. Tři způsoby stavění

Implementuj tři režimy pokládání dlažby.

### Single Tile

Kliknutím umísti jedno dlážděné políčko.

### Line Mode

Klikni na počáteční políčko a tažením myši vytvoř souvislou cestu.

Cesta se zobrazuje jako náhled během tažení.

Po uvolnění tlačítka myši se vytvoří stavební plán celé cesty.

Podporuj vodorovné, svislé i diagonální linie v souřadnicích herní mřížky.

### Area Mode

Klikni a tažením označ obdélníkovou oblast.

Po uvolnění tlačítka myši vytvoř stavební plán všech platných políček ve výběru.

Tento režim slouží zejména pro:
- Hradní nádvoří.
- Náměstí.
- Prostory kolem skladů.
- Prostory mezi budovami.
- Větší logistické plochy.

V panelu stavby přidej přepínače:

`Single | Line | Area`

Výchozí režim: Line.

## 4. Stavební náhled

Před potvrzením umístění zobraz průhledný náhled dlažby.

Barvy:
- Zelená – platné nové políčko.
- Červená – neplatné políčko.
- Neutrální – políčko je již vydlážděné.

V průběhu výběru zobraz:
- Počet nových políček.
- Potřebné množství Stone.
- Počet neplatných políček.

Cena se počítá pouze z nových platných políček.

Při výběru 20 nových políček:

`Cost: 10 Stone`

Při výběru 25 nových políček:

`Cost: 13 Stone`

Pokud není dostatek dostupného kamene, nedovol potvrdit celou objednávku a zobraz důvod.

Po dokončení výběru vytvoř jeden stavební projekt s individuálními políčky, aby bylo možné správně evidovat cenu, průběh výstavby a případné zrušení.

## 5. Pravidla umístění

Dlažbu lze pokládat na:
- Travnatý terén.
- Přirozeně vyšlapané cesty.
- Další vhodný průchozí terén.

Nelze ji pokládat na:
- Neprůchozí skály.
- Stromy.
- Vodní plochy.
- Stávající neprůchozí budovy.
- Železná a kamenná ložiska.
- Jiná neplatná stavební místa.

Dlažba nesmí blokovat vstupy do budov.

Pokud se přes vydlážděné políčko později postaví jiná budova, nesmí se dlažba vykreslovat přes její podlahu nebo konstrukci.

Zachovej původní terénní informace, aby odstranění budovy nebo dlažby nepoškodilo mapu.

## 6. Stavba pomocí Builderů

Napoj Stone Pavement na existující Blueprint a Construction System.

Po umístění:
1. Vytvoř stavební plán.
2. Rezervuj potřebný Stone.
3. Nosiči fyzicky doručí materiál na staveniště.
4. Stavitelé přicházejí k jednotlivým políčkům.
5. Postupně dokončují dlažbu.
6. Hotová políčka získají finální texturu a rychlostní bonus.

Základní čas výstavby:
- 2 sekundy aktivní práce na jedno políčko.

Construction Skill ovlivňuje rychlost práce podle současných pravidel.

Král může stavět dlažbu ručně podle existující mechaniky stavění.

Pokud je celá dlažba zadána jako jeden dlouhý projekt, umožni více stavitelům pracovat na různých políčkách současně, aniž by vytvářeli duplicitní stavbu.

Nedovol automaticky dokončit všechna políčka okamžitě po zadání.

Pokud současná architektura podporuje jen jednotlivé blueprinty, vytvoř nad nimi společnou stavební objednávku.

Dodrž stávající pravidla vracení materiálu při zrušení stavby.

## 7. Rychlost pohybu

Stone Pavement poskytuje:

`Movement Speed +25 %`

Bonus platí pro:
- King
- Villagers
- Workers
- Soldiers
- Hunters
- Haulers
- Horses
- Wheelbarrows
- Horse Wagons

Pokud má některý typ jednotky vlastní rychlostní pravidla, zachovej je a použij bonus jako násobič rychlosti pohybu po dlážděném terénu.

Příklad:

Základní rychlost jednotky = 100 %

Pohyb po Stone Pavement = 125 %

Dlážděná cesta musí mít vyšší dopravní výhodu než přirozeně vyšlapaná cesta třetí úrovně, která má nyní bonus +15 %.

## 8. Integrace s vyšlapanými cestami

Zachovej existující Path Wear System.

Přirozené cesty mají dosavadní bonusy:
- Level 0: +0 %
- Level 1: +5 %
- Level 2: +10 %
- Level 3: +15 %

Stone Pavement:
- +25 %
- Trvalý povrch.
- Nezarůstá.
- Nevyžaduje opakované vyšlapávání.

Pokud je na políčku dlažba, bonus Path Wear a Stone Pavement se nesčítá.

Použij bonus dlažby.

Původní hodnotu Path Wear můžeš zachovat pod dlažbou pro případ jejího odstranění, ale nesmí to vytvářet další rychlostní bonus.

## 9. Inteligentní Pathfinding

Uprav existující A* Pathfinding tak, aby zohledňoval rychlost jednotlivých typů povrchu.

Jednotky mají při výběru trasy preferovat rychlejší cestu, ne vždy pouze geometricky nejkratší.

Příklad:

Trasa A:
- 20 políček po trávě.

Trasa B:
- 22 políček po dlážděné cestě.

Jednotka může upřednostnit trasu B, pokud skutečný odhad doby přesunu vychází lépe.

Použij časovou cenu pohybu:

`Movement Cost = Distance / Effective Movement Speed`

Zachovej:
- Osmisměrný pohyb.
- Diagonální náklady.
- Zákaz procházení neprůchozími rohy.
- Kolize budov.
- Specifické požadavky pro povozy.

Dlažba nesmí způsobovat nekonečné přepočítávání tras.

Pokud se cesta dostaví během pohybu jednotky, novou trasu vyhodnoť až při vhodné aktualizaci, ne každý snímek.

## 10. Grafické provedení

Vytvoř kvalitní izometrickou texturu kamenné dlažby odpovídající středověkému prostředí.

Požadavky:
- Nepravidelné kamenné kostky.
- Jemné spáry.
- Tlumené šedé a přírodní barvy.
- Vzhled odpovídající ostatním herním assetům.
- Bez výrazných mezer mezi jednotlivými dlaždicemi.

Dláždění musí tvořit souvislou plochu.

Při spojení několika políček nesmí být vidět rušivé opakování identické textury.

Zohledni:
- Rovné úseky cest.
- Zatáčky.
- Křižovatky.
- Okraje dlážděné plochy.
- Velká nádvoří.

Použij autotiling nebo jiný vhodný systém pro plynulé spojování textur.

Při dokončení sousedního políčka aktualizuj potřebné okrajové textury.

Dlažba musí být vykreslena nad terénem, ale pod postavami, budovami a objekty.

## 11. Odstranění dlažby

Po kliknutí na hotové dlážděné políčko umožni:

`Remove Pavement`

Přidej také režim odstranění větší vybrané oblasti.

Po odstranění:
- Obnov původní viditelný povrch terénu.
- Zruš bonus rychlosti.
- Aktualizuj Pathfinding.
- Zachovej ostatní objekty.

Za odstranění hotové dlažby se materiál automaticky nevrací.

U nedokončených blueprintů používej existující pravidla storna a refundace.

## 12. Fog of War

Stone Pavement musí respektovat aktuální:
- Circular Fog of War.
- Exploration Mode.
- Map Memory.

V aktuálně viditelné oblasti zobraz skutečný stav dlažby.

V prozkoumané, ale momentálně neviditelné oblasti zobraz poslední známý stav.

Pokud je dlažba postavena nebo odstraněna mimo dohled, nesmí se tato změna zobrazit, dokud hráč oblast znovu neuvidí.

Neprozkoumaná oblast zůstává černá.

## 13. Asset Library

Přidej Stone Pavement do centrální Asset Library.

Definuj:
- ID
- Category
- Construction Cost
- Movement Speed Bonus
- Tile Type
- Texture Variants
- Construction State

Dláždění musí být snadno rozšiřitelné o jiné typy povrchů.

Nevytvářej samostatnou nezávislou databázi terénu, pokud už vhodný systém existuje.

## 14. Save / Load

Ukládej:
- Všechna vydlážděná políčka.
- Jejich pozice.
- Rozpracované stavební projekty.
- Rezervovaný a doručený materiál.
- Stavební progress jednotlivých políček.
- Informace potřebné pro správné obnovení terénu.

Po načtení:
- Dlažba zůstane na stejných místech.
- Rychlostní bonus funguje.
- Pathfinding používá správné náklady.
- Nedokončené projekty pokračují.
- Nedojde k duplicitní spotřebě kamene.
- Map Memory zachová poslední známý stav.

Zachovej kompatibilitu starších save souborů.

## 15. Výkon

Hra používá mapu 100×100 políček.

Stone Pavement implementuj jako efektivní terénní vrstvu, nikoliv jako tisíce samostatných plnohodnotných budov s vlastní AI a časovači.

Optimalizuj:
- Renderování dlažby.
- Aktualizaci sousedních textur.
- Hromadné stavební objednávky.
- Přepočítávání Pathfindingu.
- Fog of War.
- Save/Load.

Počítej s možností vydláždit stovky až tisíce políček bez výrazného poklesu FPS.

## 16. Testování

Ověř:

1. Stone Pavement je dostupné v Buildings → Infrastructure.
2. Funguje stavba jednoho políčka.
3. Funguje stavba cesty tažením myši.
4. Funguje označení celé obdélníkové plochy.
5. Cena se správně vypočítává.
6. Již vydlážděná políčka se neplatí znovu.
7. Dlažba nezablokuje pohyb.
8. Stavitelé fyzicky dokončují dlažbu.
9. Nosiči doručují materiál.
10. Král může dlažbu stavět.
11. Rychlost pohybu se zvýší o 25 %.
12. Bonus se nesčítá s Path Wear.
13. Pathfinding preferuje rychlejší dlážděné trasy.
14. Povozy a trakaře mohou používat dlažbu.
15. Textury se správně spojují.
16. Dláždění nádvoří funguje i pro velké plochy.
17. Dlažbu lze odstranit.
18. Fog of War zachovává poslední známý stav dlažby.
19. Save/Load správně obnovuje hotové i rozestavěné plochy.
20. Hra zůstává plynulá při velkém Zoom Out.

## 17. Implementace

Rozděl upgrade do čtyř fází:

**Phase A – Pavement Terrain Layer**
Nový typ terénu, grafika a průchodnost.

**Phase B – Construction Tools**
Single, Line a Area režimy, stavební projekty a logistika.

**Phase C – Movement & Pathfinding**
Rychlostní bonusy, integrace s vyšlapanými cestami a optimalizace tras.

**Phase D – Integration**
Fog of War, Save/Load, Asset Library, odstranění dlažby a testování.

Před úpravami vytvoř bezpečný Git commit.

Po dokončení přidej skutečně implementované změny do sekce Unreleased v CHANGELOG.md.

Nevydávej automaticky novou verzi hry.

Prioritou je pohodlné budování dlouhých cest a větších dlážděných ploch, které budou skutečně zlepšovat rychlost pohybu a logistiku království.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 12/15 – původní krok 34: Wheelwright, Wagons, Stables & Housing

**Milník:** M3. **Důležitá úprava:** Závazné výrobní recepty: Wheelbarrow 10 Wood + 2 Iron Bars; Horse Wagon 30 Wood + 6 Iron Bars + jeden ochočený kůň. House = 5 obyvatel.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Wheelwright, Wheelbarrows, Horse Wagons, Stables & Housing

Rozšiř stávající izometrickou 2.5D středověkou strategii Medieval Kingdom o nové dopravní prostředky, kolářství, stáje, ochočování koní a úpravu kapacity obytných domů.

Hlavní cíl: Nosiči budou přepravovat suroviny s omezenou kapacitou podle jejich hmotnosti. Hráč bude moci vyrábět trakaře a koňské povozy, díky kterým se výrazně zvýší efektivita logistiky.

Pro výrobu a provoz koňského povozu musí hráč získat a ochočit divokého koně.

Nezakládej nový projekt. Nejprve analyzuj skutečně existující systémy Logistics, Hauler AI, Worker Jobs, Construction, Inventory, Warehouse, Wildlife, Horses, King Mounting, Pathfinding, Asset Library a Save/Load.

Zachovej současné mechaniky a nepřidávej jejich duplicitní implementace.

1. Nový systém přepravní kapacity

Nahraď dosavadní jednoduché omezení počtu přepravovaných kusů systémem nosnosti podle hmotnosti.

Každý druh suroviny musí mít definovanou přepravní hmotnost.

Výchozí hodnoty:

Stone: 10 load units

Wood: 5 load units

Iron Ore: 10 load units

Meat: 1 load unit

Wheat: 1 load unit

Apple: 1 load unit

Flour: 1 load unit

Bread: 1 load unit

Hmotnost je herní jednotka, nikoliv kilogram.

Konfiguraci hmotností ulož centrálně do Resource Registry.

Pokud hra obsahuje další suroviny, přidej jim odpovídající hodnoty.

Gold zatím zůstává centrální měnou a není fyzicky přepravované.

Základní nosnost

Nosič bez vybavení:

Carry Capacity = 10 load units

Příklady:

1 Stone

2 Wood

10 Meat

Podporuj také kombinovaný náklad.

Například:

1 Wood = 5 jednotek

5 Meat = 5 jednotek

Dohromady 10 jednotek

Nesmí být překročena maximální nosnost.

Při převodu ze současného systému přepravy zajisti kompatibilitu již existujících nákladů, včetně rozpracovaných přeprav.

Pokud Logistics Skill nyní zvyšuje nosnost, uprav jeho bonus tak, aby neporušoval výchozí uvedené kapacity. Zachovej získané Logistics XP a levely. Dovednost může místo toho zrychlovat nakládku a vykládku.

2. Dopravní prostředky

Přidej dva dopravní prostředky:

Wheelbarrow – Trakař

ID: wheelbarrow

Type: Transport Equipment

Carry Capacity: 50 load units

Capacity Bonus: +400 % oproti přepravě v rukou

Requires Horse: No

Operator: 1 Hauler

Příklady maximálního nákladu:

5 Stone

10 Wood

50 Meat

Horse Wagon – Koňský povoz

ID: horse_wagon

Type: Transport Equipment

Carry Capacity: 100 load units

Capacity Multiplier: 10× oproti přepravě v rukou

Requires Horse: Yes

Operator: 1 Hauler

Requires Tamed Horse: Yes

Příklady:

10 Stone

20 Wood

100 Meat

Dopravní prostředky nesmějí kombinovat své bonusy.

Nosič používá právě jeden režim:

Carrying by Hand

Using Wheelbarrow

Driving Horse Wagon

Všechny hodnoty musí být centrálně konfigurovatelné.

3. Nová budova – Wheelwright's Workshop

Přidej novou pracovní budovu:

ID: wheelwright_workshop

Name: Wheelwright's Workshop

Czech Name: Kolářství

Size: 3×3

Construction Cost: 12 Stone + 15 Wood

Worker Slots: 2

Profession: Wheelwright

Budova se staví prostřednictvím existujícího Blueprint a Construction Systemu.

Po dokončení umožňuje vyrábět dopravní prostředky.

Vzhled:

Dřevěná středověká řemeslná dílna.

Přístřešek pro práci se dřevem.

Opřená dřevěná kola.

Rozpracovaný vůz nebo trakař.

Vizuální styl odpovídající ostatním budovám.

Přidej budovu do Buildings nabídky a Asset Library.

4. Výrobní recepty

Wheelbarrow

Navrhovaný recept:

10 Wood

2 Iron Bars (zpracované železo ze Smelter, ne Iron Ore ani Stone)

Production Time: 30 sekund aktivní práce

Výstup:

1 Wheelbarrow

Horse Wagon

Navrhovaný recept:

30 Wood

6 Iron Bars (zpracované železo ze Smelter)

1 dostupný ochočený kůň

Production Time: 90 sekund aktivní práce

Výstup:

1 Horse Wagon připravený k používání s přiřazeným koněm

Závazné recepty používají Wood + Iron Bars z kroku 35. Iron Ore NENÍ zpracované železo. Není dovolena tichá náhrada Iron Bars kamenem či rudou. Pokud Smelter z kroku 35 ještě reálně není implementován, přeruš implementaci výroby a nahlas chybějící závislost.

Výroba musí respektovat skutečné zásoby, rezervace a fyzickou logistiku.

Suroviny se doručují do kolářství stejně jako do ostatních výrobních budov.

Dokud nejsou dodané materiály, výroba nezačne.

Před zahájením výroby koňského povozu musí být dostupný ochočený kůň, kterého lze rezervovat.

Kůň nesmí být spotřebován jako surovina.

Při dokončení výroby se přiřadí ke konkrétnímu povozu.

Pokud je výroba zrušená, rezervace koně se uvolní.

5. Nová profese – Wheelwright

Přidej profesi:

ID: wheelwright

Name: Wheelwright

Workplace: Wheelwright's Workshop

Skill: Crafting / Wheelwrighting

Pokud hra již obsahuje vhodný výrobní skill, použij jej místo zavádění duplicitního systému.

Pokud žádný vhodný skill neexistuje, vytvoř Wheelwrighting s levely 1–50.

Vyšší skill zrychluje výrobu dopravních prostředků.

Použij existující XP System.

Kolář získává XP pouze za skutečně dokončenou výrobu.

Novou profesi integruj do:

Auto Employment

Assign Worker Menu

Population Sidebar

Job Registry

Wage System

Save/Load

Přidej vlastní barvu portrétu koláře.

6. Vybavení nosičů

Každý Hauler musí mít údaj:

Transport Mode

Možnosti:

Hands

Wheelbarrow

Horse Wagon

Nosiči mohou používat pouze dopravní prostředky, které království skutečně vlastní.

Každý vyrobený trakař a povoz má vlastní jedinečné ID.

Jeden dopravní prostředek nemohou používat dva pracovníci současně.

Pokud chce nosič použít trakař:

Najde dostupný trakař.

Fyzicky k němu dojde.

Převezme jej.

Používá jej při přepravě materiálu.

Po odložení zůstane trakař na skutečné pozici.

Stejné pravidlo platí pro povoz.

Nosiči nesmějí vybavení teleportovat mezi sklady nebo budovami.

V panelu pracovníka přidej možnost vybrat režim přepravy.

Podporuj také režim:

Auto – Best Available Transport

Ten automaticky vybere nejvhodnější dostupný dopravní prostředek.

Výchozí režim může být Auto.

Výběr nesmí způsobit, že pracovník bude neustále přecházet mezi několika dopravními prostředky.

7. Dopravní prostředky jako skutečné objekty

Trakař i povoz musí fyzicky existovat na mapě.

Každý dopravní prostředek eviduje:

ID

Type

Position

Current Operator

Current Cargo

Maximum Capacity

Assigned Horse, pokud existuje

Current State

Možné stavy:

Available

Reserved

In Use

Parked

Disabled

Vybavení musí být správně přístupné přes izometrický Pathfinding.

Pokud pracovník zemře, opustí království nebo změní profesi, dopravní prostředek nesmí zmizet.

Zůstane na vhodné pozici a může jej převzít jiný nosič.

Nesený náklad musí být bezpečně zachován.

8. Pohyb s trakařem a povozem

Přidej odpovídající grafiku a animace.

Trakař

Pracovník jej tlačí před sebou.

Trakař se vizuálně pohybuje společně s pracovníkem.

Při přepravě je viditelný náklad.

Správně mění orientaci v osmi směrech.

Koňský povoz

Kůň táhne povoz.

Nosič jej řídí.

Povoz se pohybuje jako jeden funkční celek.

Správně reaguje na změny směru.

Při přepravě zobrazuje naložené suroviny.

V první verzi není nutné simulovat fyziku jednotlivých kol.

Povoz musí respektovat průchodnost a rozměry dopravního prostředku.

Nesmí projíždět:

Stromy.

Budovami.

Skalními útvary.

Neprůchozími překážkami.

Příliš úzkými průchody.

Pokud je cesta průchozí pro pěšího, ale nikoliv pro povoz, musí Pathfinding umět najít jinou trasu.

Zachovej existující systém vyšlapávání cest.

Povozy a trakaře mají cesty preferovat, pokud představují výhodnější trasu.

9. Nová budova – Stables

Přidej:

ID: stables

Name: Stables

Czech Name: Stáje

Size: 5×5 tiles

Construction Cost: 15 Wood + 10 Stone

Horse Capacity: 4

Vizuální koncept:

Budova zabírá plochu 5×5 políček.

Obsahuje:

Malý dřevěný domek se stájí.

Kryté místo pro koně.

Oplocenou ohradu.

Trávu uvnitř ohrady.

Vstupní bránu.

Přibližně 2×2 políčka využij pro vlastní budovu, zbytek tvoří výběh.

Koně musí být fyzicky viditelní v ohradě.

Pokud jsou uvnitř čtyři koně, musí být možné všechny vizuálně rozlišit.

V ohradě se mohou pomalu pohybovat.

Budova musí mít korektní izometrickou kolizi, vstup a průchodnost.

10. Kapacita a správa koní

Jedna stáj má kapacitu 4 koně.

Více stájí zvyšuje celkovou kapacitu.

Každý ochočený kůň má:

Unique Horse ID

Position

Health

Tamed Status

Assigned Stable

Assigned Wagon

Assigned Rider

Current State

Možné stavy:

Wild

Being Tamed

Following Tamer

In Stable

Mounted

Assigned to Wagon

Jeden kůň nesmí:

Současně táhnout povoz a sloužit jako jezdecký kůň.

Být evidovaný ve dvou stájích.

Být přiřazen ke dvěma povozům.

Být duplikovaný po Save/Load.

Kůň přiřazený k povozu zůstává skutečným zvířetem, ne spotřebovanou surovinou.

Pokud se povoz odstaví, může být kůň vrácen do stáje nebo ponechán zapřažený podle zvoleného stavu.

Přidej možnost Unhitch Horse.

Po odpřažení se povoz stane neaktivním, dokud k němu nebude přiřazen další dostupný kůň.

11. Více divokých koní na mapě

Rozšiř současný Horse / Wildlife System.

Na mapě 100×100 generuj při nové hře přibližně 6 divokých koní místo původního jednoho, pokud aktuální nastavení neurčuje jinak.

Koně se mají vyskytovat:

Na loukách.

Na otevřených travnatých plochách.

V menších skupinách.

Mimo neprůchozí terén.

Použij existující pohybovou AI koní.

Koně se mohou volně pohybovat po mapě.

Zachovej současnou možnost jízdy krále na koni, ale sjednoť ji s novým systémem vlastnictví a ochočování.

Divoký kůň není automaticky majetkem království.

Nesmí být automaticky použit pro povoz.

Pokud je ve hře Wildlife Respawn, přidej samostatnou bezpečnou konfiguraci obnovování divokých koní, aby jejich populace nebyla neomezená.

12. Ochočování koní

Koně mohou ochočit:

Hunter

King

Nepřidávej zatím samostatnou profesi Horse Trainer.

Ochočování králem

Po kliknutí na divokého koně nabídni:

Tame Horse

Král:

Vybere koně.

Fyzicky k němu dojde.

Začne proces ochočování.

Po dokončení se kůň stane ochočeným.

Kůň začne následovat krále.

Král jej může zavést do stáje.

Výchozí doba ochočování: 25 sekund.

Král musí mít možnost proces přerušit.

Ochočování lovcem

Hunter může dostat příkaz:

Tame Horse

Lovec:

Zarezervuje konkrétního divokého koně.

Dojde k němu.

Provede ochočení.

Získá Hunting XP.

Odvede koně do dostupné stáje.

Poté pokračuje ve svých pracovních úkolech.

Výchozí doba ochočování: 20 sekund.

Vyšší Hunting Skill může proces zrychlovat podle existujícího vzorce pracovní efektivity.

Lovci nesmějí automaticky ochočovat všechny divoké koně bez pokynu hráče.

Zabraň současnému ochočování stejného koně více postavami.

Ochočený kůň nesmí být považován za kořist při běžném lovu.

13. Podmínky ochočení

Před zahájením ochočování ověř dostupnou kapacitu stájí.

Pokud hráč nemá žádnou stáj:

Koně lze případně následovat jako dočasně ochočeného společníka krále, pokud to umožňuje stávající Mount System.

Nesmí být ale zařazen do automatické výroby a provozu povozu.

UI musí hráči vysvětlit, že pro využití v logistice potřebuje stáje.

Pokud jsou stáje plné, další ochočování za účelem získání pracovního koně není možné, dokud se neuvolní kapacita nebo nevznikne další stáj.

Rezervuj kapacitu stáje již při zahájení úkolu ochočení, aby dvě postavy neobsadily poslední volné místo současně.

Při zrušení ochočování rezervaci uvolni.

14. Panel stájí

Po kliknutí na stáje otevři panel:

STABLES

Capacity: 3 / 4

Horses:

Horse 01 – Available

Horse 02 – Assigned to Wagon

Horse 03 – Mounted

Empty Slot

U každého koně zobraz:

Portrét.

HP.

Aktuální stav.

Přiřazení.

Možnost Locate.

Dostupné akce.

Přidej počítadlo:

Total Tamed Horses

Available Horses

Horses Assigned to Wagons

Koně skutečně využívaní pro práci musí být evidováni, i když se právě nenacházejí fyzicky v ohradě.

15. Panel kolářství

Po kliknutí na Wheelwright's Workshop zobraz:

WHEELWRIGHT

Workers: 1 / 2

Craft:

Wheelbarrow

Horse Wagon

U výrobku zobraz:

Potřebné suroviny.

Dostupné suroviny.

Dobu výroby.

Aktuální výrobní frontu.

Průběh výroby.

Dostupnost koně, pokud je vyžadován.

Přidej:

Craft

Craft x5 pro trakaře

Cancel Production

Neumožni zařadit výrobu povozu, pokud není k dispozici rezervovatelný ochočený kůň.

Při zrušení výroby bezpečně vrať nebo uvolni nevyužité suroviny podle skutečného stavu výroby a existujících pravidel.

16. Úprava existujícího House

Uprav existující budovu House.

Každý dokončený House musí zvyšovat kapacitu obyvatel o 5. Tato hodnota je závazná i pro pozdější Needs/Housing.

Pokud má nyní House kapacitu 4, změň ji na 5.

Nevytvářej druhý duplicitní typ House, pokud současná budova již existuje.

Zachovej její současné rozměry a stavební náklady, pokud není nutné je měnit.

Požadavky:

1 House = 5 obyvatel.

2 Houses = 10 obyvatel.

3 Houses = 15 obyvatel.

Kapacita musí být integrována do:

Population System.

Migration System.

Villager Needs.

Housing Assignment.

Happiness.

Save/Load.

Pokud je dům již postavený ve staré uložené hře, po migraci poskytne kapacitu 5.

Stávající ubytovaní obyvatelé nesmějí přijít o přiřazené bydlení.

V panelu budovy zobraz například:

House
Residents: 3 / 5

17. Propojení s Auto Employment

Nová profese Wheelwright musí správně fungovat s Auto Employment.

Pokud hráč postaví kolářství a má zapnuté automatické zaměstnávání:

Volná pracovní místa mohou být automaticky obsazena.

Výběr musí respektovat odbornost.

Již zaměstnaní pracovníci se nesmí automaticky přeřazovat.

V ručním Assign Worker menu použij stávající pravidla řazení kandidátů podle relevantního skillu.

18. Propojení s Logistics System

Všechny současné logistické úkoly musí používat nový systém hmotnosti.

Zohledni:

Nesený náklad.

Volnou kapacitu.

Dostupné trakaře.

Dostupné povozy.

Dostupné koně.

Skutečnou průchodnost trasy.

Vzdálenost.

Rychlost pohybu.

Auto Hauler AI má pro větší množství materiálu preferovat vhodný dopravní prostředek, pokud jeho získání a použití skutečně ušetří čas.

Pro krátkou přepravu jednoho kusu suroviny nemusí pracovník běžet přes celou mapu pro povoz.

Zvaž celkový čas:

Cesta k dopravnímu prostředku.

Naložení.

Přesun k cíli.

Vyložení.

Návrat nebo odstavení vozidla.

Nosič nesmí vytvořit nekonečný cyklus hledání dopravního prostředku.

Pokud není vozidlo dostupné, pokračuje v přepravě rukama.

Všechna dopravní vozidla musí respektovat stávající rezervace a vlastnictví nákladů.

19. Integrace s vyšlapanými cestami

Wheelbarrow a Horse Wagon musí používat existující Path Wear System.

Trakař i povoz přispívají k opotřebení cest.

Povoz může přispívat více než pěší NPC, například +3 při průjezdu místo +1, pokud existující systém podporuje podobnou mechaniku.

Bonusy cest pro pohyb zachovej.

Při hledání trasy preferuj kvalitnější a rychlejší cesty.

Do budoucna připrav rozšíření o kamenné silnice, ale zatím je neimplementuj.

20. Save / Load

Rozšiř ukládání hry.

Ukládej:

Všechny vyrobené trakaře.

Všechny povozy.

Jedinečná ID dopravních prostředků.

Aktuální náklady.

Aktuální operátory.

Pozice vozidel.

Rezervace vozidel.

Přiřazené koně.

Ochočené a divoké koně.

Stav ochočování.

Přiřazené stáje.

Kapacitu stájí.

Výrobní fronty kolářství.

Rozpracovanou výrobu.

Nové pracovní profese a skilly.

Kapacitu domů 5 obyvatel.

Po načtení:

Nesmí vzniknout duplicitní povoz.

Nesmí vzniknout duplicitní kůň.

Kůň nesmí být přiřazen dvěma povozům.

Nosiči nesmějí ztratit svůj náklad.

Výrobní fronta nesmí znovu spotřebovat již odečtené suroviny.

Stávající obyvatelé musí zůstat ubytovaní.

Starší save soubory musí bezpečně fungovat.

Pokud současná verze Save Schema vyžaduje migraci, aktualizuj její samostatné číslo podle existujícího systému.

21. Výkon

Hra musí nadále stabilně fungovat na mapě 100×100.

Předpokládej budoucí populaci 100–200 NPC.

Optimalizuj:

Pathfinding povozů.

Rezervace dopravních prostředků.

AI nosičů.

Pohyb divokých koní.

Výrobní úkoly.

Vyhodnocování dostupných kapacit.

Nevytvářej samostatné časovače pro každého koně nebo vozidlo.

Nevypočítávej nové trasy v každém snímku.

Využívej existující centrální AI, Game Time a Logistics Manager.

22. Testování

Ověř následující scénáře:

Nosič bez vybavení unese maximálně 1 Stone.

Bez vybavení unese maximálně 2 Wood.

Bez vybavení unese maximálně 10 Meat.

S trakařem unese 5 Stone nebo ekvivalent jiných surovin.

S koňským povozem unese 10 Stone nebo ekvivalent.

Kombinovaný náklad respektuje hmotnost.

Wheelwright's Workshop lze postavit.

Kolář vyrábí trakaře.

Kolář vyrábí koňské povozy pouze s dostupným koněm.

Jeden kůň nemůže být přiřazen ke dvěma povozům.

Povoz se pohybuje skutečně po mapě.

Trakař se pohybuje společně s nosičem.

Dopravní prostředky nevznikají duplicitně.

Stáje mají správný rozměr 5×5.

Stáje mají kapacitu 4 koně.

Koně se fyzicky zobrazují v ohradě.

Na mapě se generuje více divokých koní.

Král může ochočit divokého koně.

Hunter může ochočit divokého koně.

Ochočený kůň může být přiřazen ke stáji.

Ochočený kůň může být použit pro povoz.

Kůň nemůže zároveň táhnout povoz a být využíván k jízdě krále.

Nosiči dokážou automaticky používat dostupné dopravní prostředky.

Path Wear System reaguje na přepravu.

Auto Employment funguje s kolářstvím.

House poskytuje kapacitu 5 obyvatel.

Migration a Housing System respektují novou kapacitu.

Save/Load zachovává všechna vozidla, koně i výrobní fronty.

Žádná surovina se při přepravě ani výrobě neduplikuje.

Hra zůstává plynulá při více aktivních nosičích a povozech.

23. Implementační fáze

Rozděl práci do pěti fází:

Phase A – Weighted Cargo System
Hmotnosti surovin, základní nosnost, kombinované náklady a kompatibilita existující logistiky.

Phase B – Wheelwright & Wheelbarrows
Kolářství, nová profese, výroba trakařů a jejich používání nosiči.

Phase C – Stables & Horse Taming
Stáje, více divokých koní, ochočování králem a lovcem, správa koní.

Phase D – Horse Wagons & Housing
Výroba povozů, zapřahání koní, dopravní AI a úprava kapacity House na 5.

Phase E – Integration & Testing
Save/Load, Auto Employment, Logistics, Fog of War, Pathfinding, výkon a integrační testy.

Po každé dokončené a otestované fázi vytvoř Git commit.

Zapiš dokončené změny do sekce Unreleased v CHANGELOG.md.

Nevydávej automaticky novou verzi hry.

Prioritou je správná fyzická přeprava surovin, bezpečné přiřazování koní a dopravních prostředků a stabilní logistika bez duplicit nebo ztráty materiálu.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 13/15 – původní krok 26: Villager Needs & Happiness

**Milník:** M4. **Důležitá úprava:** House má 5 obyvatel, ne staré 4. Rozšiř existující Population Sidebar místo vytváření duplicitního panelu.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade 4: Villager Needs, Happiness & Social Simulation

Rozšiř stávající izometrickou 2.5D strategickou hru ve Phaseru o systém individuálních potřeb obyvatel, spokojenosti, pracovní morálky, stávek a emigrace.

Hlavní cíl: Každý poddaný bude skutečnou postavou s vlastními potřebami. Musí mít přístup k jídlu, odpočinku, bydlení a bezpečí. Jeho životní podmínky ovlivňují efektivitu práce a ochotu zůstat v království.

Navazuj na existující systémy:

Population a Migration System

Individuální skilly a profese

Worker AI a Job System

Houses a Housing Capacity

Food System a Granary

Logistics System

Wages a Economy

Game Time a Seasons

Fog of War

Save/Load

Nezakládej nový projekt. Nejdříve ověř skutečnou implementaci těchto systémů a nevytvářej duplicitní mechaniky.

1. Individuální potřeby obyvatel

Každý trvalý poddaný má čtyři potřeby:

Food – nasycení (0–100)

Rest – odpočinek (0–100)

Housing – kvalita bydlení (0–100)

Safety – pocit bezpečí (0–100)

Přidej také:

Happiness – celková spokojenost (0–100)

Current Mood – aktuální stav nálady

Strike State – zda postava stávkuje

Assigned Home – ID přiděleného domu

Consecutive Unhappy Days – počet po sobě jdoucích dnů nespokojenosti

Každá postava musí mít vlastní hodnoty.

Král zatím nebude stávkovat ani opouštět království. Jeho HP a potravinové potřeby zachovej podle dosavadního systému.

Pocestní, kteří nejsou obyvateli království, nepoužívají plnou simulaci potřeb.

2. Potřeba jídla

Poddaní potřebují pravidelně jíst.

Zachovej stávající Food System a spotřebu jedné porce potravin na obyvatele za herní den.

Potraviny:

Meat

Bread

Apple

Wheat a Flour nelze přímo konzumovat.

Při dostupnosti jídla se potřeba Food udržuje na vysoké hodnotě.

Při nedostatku jídla začne postupně klesat.

Po úspěšném přidělení porce se Food zvýší.

Spotřebu řeš přes existující skladový systém a jeho rezervace.

Důležité: Nesmí existovat dva nezávislé systémy spotřeby jídla. Nová mechanika nasycení pouze navazuje na skutečně spotřebované porce.

Prozatím nemusí každý poddaný fyzicky navštěvovat sýpku. Individuální distribuci jídla lze doplnit později.

Pokud Food klesne pod 20:

Postava získá negativní vliv na Happiness.

Zobraz upozornění Hungry.

Nedostatek potravy může vést ke stávce nebo odchodu.

Zatím nepřidávej smrt hladem.

3. Odpočinek a denní režim

Implementuj skutečný denní režim poddaných.

Jeden herní den má standardně 120 sekund, ale respektuj délku dne nastavenou v Game Setup.

Rozděl herní den na:

Pracovní dobu.

Dobu odpočinku.

Výchozí návrh:

Práce a běžné činnosti: prvních 75 % herního dne.

Odpočinek: posledních 25 % dne.

Při práci klesá Rest.

Při odpočinku se Rest obnovuje.

Poddaný s přiděleným domem:

Ukončí pracovní úkol v okamžiku odpočinku.

Dojde ke svému domu.

Vstoupí do domu.

Odpočívá a obnovuje Rest.

Po skončení odpočinku vyjde z domu.

Vrátí se ke svému zaměstnání.

Postavy nesmějí teleportovat mezi domem a pracovištěm.

Pokud je postava velmi unavená, například Rest pod 20 %, může přerušit práci a odpočinout si dříve.

Zajisti správné pokračování pracovních úkolů po odpočinku a zachování rezervací bez duplicit.

V noci může být zobrazena jednoduchá tmavší atmosféra, ale není nutné vytvářet složité osvětlení.

4. Bydlení

Každý poddaný by měl mít přidělené bydlení.

Použij existující House:

Velikost 2×2

Kapacita 5 obyvatel (závazná změna z kroku 34)

Každý dům eviduje konkrétní ubytované obyvatele.

Po přistěhování:

Nový poddaný získá volné místo v dostupném domě.

Přiřazení musí být jednoznačné.

Jeden obyvatel nemůže být registrovaný ve více domech.

Pokud dům zanikne nebo ztratí funkčnost:

Jeho obyvatelé přijdou o bydlení.

Pokusí se získat místo v jiném dostupném domě.

Pokud žádné bydlení není, stanou se bezdomovci.

Housing:

Má přidělené dostupné bydlení: 100.

Nemá dostupné bydlení: 0.

Bezdomovci mohou odpočívat jen omezeně a obnovují Rest pomaleji.

Zatím nepřidávej různé úrovně kvality domů.

5. Bezpečnost

Každý poddaný bude mít vlastní pocit bezpečí podle okolí.

Zaveď jednoduchý Safety System.

Bezpečnost ovlivní:

Vzdálenost od dokončeného hradu.

Vzdálenost od dokončené obranné věže.

Přítomnost vlastních vojáků a hlídek.

Nedávné napadení postavy nebo jejího okolí.

Později skutečná přítomnost nepřátel.

Výchozí bezpečnost: 45 bodů.

Orientační bonusy:

V dosahu hradu: +25.

V dosahu obranné věže: +15.

V dosahu kasáren nebo hlídkující jednotky: +10.

Používej rozumné konfigurovatelné dosahy, například 10–15 políček.

Bezpečnost omez na 0–100.

Nedávný útok způsobí dočasné snížení Safety.

Bonusy z budov platí pouze pro dokončené stavby.

Nedokončené blueprinty bezpečnost nezvyšují.

V první verzi neimplementuj složité vyhodnocování uzavřeného opevnění. Hradby samy o sobě nemusí zvyšovat bezpečnost, pokud systém nedokáže ověřit skutečně chráněnou oblast.

6. Celková spokojenost

Vytvoř individuální Happiness.

Použij vážený výpočet:

Happiness =
Food × 0.35 +
Rest × 0.25 +
Housing × 0.25 +
Safety × 0.15

Výsledek zaokrouhli a omez na 0–100.

Stávající nevyplacené mzdy musí navíc snižovat Happiness pomocí samostatné penalizace.

Zamez dvojímu započtení stejné penalizace.

Výsledná spokojenost se automaticky aktualizuje podle skutečného stavu postavy.

7. Vliv spokojenosti na pracovní výkon

Nastav následující stavy:

70–100: Happy, pracovní efektivita ×1.10

40–69: Neutral, efektivita ×1.00

25–39: Unhappy, efektivita ×0.80

0–24: Critical, riziko stávky

Efektivitu kombinuj s existujícími bonusy skillů, talentů a pracovních budov.

Například:

FinalWorkSpeed =
BaseWorkSpeed × SkillEfficiency × HappinessModifier

Neovlivňuj přímo rychlost chůze, pokud to není výslovně určeno jiným systémem.

Spokojenost nesmí neúmyslně měnit bojové statistiky ani kvalitu vybavení.

8. Stávky poddaných

Pokud má poddaný Happiness pod 25 po dobu alespoň dvou celých herních dnů, přejde do stavu Strike.

Stávkující:

Přestane vykonávat svoji práci.

Nevytváří nové suroviny.

Nezískává pracovní XP.

Zachová si profesi a pracovní místo.

Může se pohybovat poblíž domu nebo osady.

Nad postavou se zobrazí jednoduchá ikona nespokojenosti.

Pokud se Happiness obnoví alespoň na 45, postava stávku ukončí a vrátí se do práce.

Pravidla mezd při stávce napoj na existující systém odměňování, aby se pracovní doba nepočítala duplicitně. Již vzniklé mzdové dluhy zachovej.

Zajisti správné uvolnění pracovních úkolů a přepravních rezervací při zahájení stávky.

9. Emigrace

Pokud Happiness zůstane pod 15 po dobu alespoň tří herních dnů, může se poddaný rozhodnout opustit království.

Postup:

Postava ukončí profesní úkol.

Uvolní pracovní místo.

Uvolní místo v domě.

Změní stav na Leaving Kingdom.

Vybere dostupnou trasu k okraji mapy.

Fyzicky opustí království.

Po dosažení okraje mapy se odstraní z aktivní populace.

Před odchodem zpracuj bezpečně všechny nesené suroviny a rezervace.

Pokud cestu nelze najít, NPC nesmí způsobovat nekonečné pathfinding výpočty. Použij bezpečný čekací stav a opakované hledání v omezených intervalech.

Zobraz oznámení:

A villager has left your kingdom due to poor living conditions.

Emigrace nesmí způsobovat duplicitní obyvatele ani zápornou populaci.

10. Spokojenost celého království

Přidej Kingdom Happiness.

Vypočítej ji jako průměr Happiness všech živých trvalých poddaných.

Pokud království zatím nemá žádné poddané, nepřidávej bonus ani penalizaci.

V horním rozhraní zobraz:

Population

Kingdom Happiness

Po kliknutí otevři detailní přehled.

11. Vliv na migraci

Napoj Kingdom Happiness na existující Kingdom Attractiveness System.

Spokojené království bude přitahovat více přistěhovalců.

Nespokojené království bude přitahovat méně lidí.

Výchozí pravidla:

Happiness 80–100: bonus k atraktivitě a vyšší šance usazení pocestných.

Happiness 50–79: neutrální stav.

Happiness 30–49: snížená atraktivita.

Happiness pod 30: výrazně snížená atraktivita.

Bonus nebo penalizace musí být součástí existujícího výpočtu atraktivity, ne druhý paralelní migrační systém.

Noví obyvatelé musí nadále fyzicky přicházet z okraje mapy.

Bez volného bydlení se nemohou usadit, ani při maximální spokojenosti.

12. Informační panel obyvatele

Rozšiř stávající panel postavy.

Zobraz:

Jméno

Profesi

Celkový level

HP

Food

Rest

Housing

Safety

Happiness

Current Mood

Assigned Home

Current Workplace

Salary / Unpaid Wages

Strike Status

Použij přehledné grafické ukazatele a tooltipy vysvětlující důvody nespokojenosti.

Příklad:

Radovan
Miner – Level 14

Food: 80 %
Rest: 25 %
Housing: 100 %
Safety: 70 %

Happiness: 65 %

Main problem: Low Rest

13. Přehled království

Rozšiř již existující pravý Population Sidebar o souhrn potřeb a spokojenosti; nevytvářej souběžný duplicitní panel Population & Happiness.

Zobraz:

Celkovou populaci.

Průměrnou spokojenost.

Počet hladových obyvatel.

Počet nevyspalých obyvatel.

Počet obyvatel bez bydlení.

Počet stávkujících.

Počet obyvatel ohrožených emigrací.

Umožni rozkliknout konkrétní postavu.

Přidej možnost seřadit obyvatele podle Happiness od nejnižší po nejvyšší.

14. AI a denní režim

Rozšiř existující Worker AI o individuální potřeby.

Priorita chování:

Kritické přežití a bezpečí.

Nutný odpočinek.

Stávka nebo emigrace.

Pracovní úkol.

Volný čas.

Postava nesmí vykonávat více neslučitelných činností současně.

Při přerušení práce musí být zachovaný skutečný stav surovin a rozpracované výroby.

Poddaní se musí fyzicky pohybovat mezi pracovišti, domy a dalšími dostupnými místy.

Běžní pocestní nepoužívají kompletní denní režim poddaných.

15. Save / Load

Rozšiř existující ukládání hry.

U každého obyvatele ukládej:

Potřeby

Happiness

Aktuální náladu

Přidělené bydlení

Stav odpočinku

Stav stávky

Počet dnů nespokojenosti

Stav případné emigrace

Aktuální AI stav

Ukládej také celkový Kingdom Happiness a relevantní migrační modifikátory, případně je bezpečně dopočítej z uložených obyvatel.

Po načtení:

Nezapočítej spotřebu jídla dvakrát.

Neprováděj znovu již dokončené denní události.

Nezdvojuj pracovní úkoly.

Zachovej přiřazení domů a pracovních míst.

Obnov stav stávkujících a odcházejících poddaných.

Zachovej kompatibilitu starších uložených her pomocí bezpečných výchozích hodnot.

16. Optimalizace

Předpokládej budoucí populaci alespoň 100–200 poddaných.

Neprováděj kompletní výpočty potřeb při každém vykresleném snímku.

Používej:

Centrální Game Time.

Intervalové nebo událostní aktualizace.

Efektivní vyhodnocování bezpečnosti.

Existující pathfinding a Worker AI.

Oddělení simulace od grafiky.

Denní režim a potřeby musí fungovat také mimo viditelnou oblast kamery.

Fog of War nesmí zastavovat simulaci NPC.

17. Testování

Před úpravami vytvoř Git commit.

Ověř:

Každý poddaný má individuální potřeby.

Food odpovídá skutečné spotřebě jídla.

Rest klesá při práci a obnovuje se při odpočinku.

Obyvatelé fyzicky docházejí domů.

Každý obyvatel má maximálně jedno přiřazené bydlení.

Bezdomovci mají horší podmínky odpočinku.

Blízkost obranných budov zvyšuje Safety.

Happiness se správně počítá.

Spokojenost ovlivňuje produktivitu práce.

Dlouhodobě nespokojení poddaní mohou stávkovat.

Při zlepšení podmínek se vrátí do práce.

Velmi nespokojení poddaní mohou emigrovat.

Emigrace správně aktualizuje populaci a pracovní místa.

Spokojenost ovlivňuje migraci.

Save/Load obnovuje všechny potřeby a AI stavy.

Nedošlo k duplicitní spotřebě potravin nebo mezd.

Hra zůstává stabilní při 100 aktivních obyvatelích.

18. Implementační fáze

Rozděl implementaci do čtyř fází.

Fáze A – Needs System
Individuální potřeby, Happiness a informační panely.

Fáze B – Daily Life
Bydlení, skutečný odpočinek a denní režim.

Fáze C – Social Behavior
Pracovní efektivita, stávky, emigrace a vliv na migraci.

Fáze D – Integration
Save/Load, ekonomika, optimalizace a automatizované testování.

Po každé dokončené a otestované fázi vytvoř Git commit.

Neimplementuj zatím:

Rodiny a narození dětí.

Stárnutí obyvatel.

Nemoci.

Kriminalitu.

Složité sociální vztahy mezi postavami.

Prioritou je funkční simulace základních potřeb obyvatel bez poškození existující ekonomiky a AI.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 14/15 – původní krok 27: Merchants, Caravans & Trade

**Milník:** M4. **Důležitá úprava:** Obchodní karavany mají vlastní cizí koně/povozy, nepřebírají zvířata hráčových stájí.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade 7: Merchants, Caravans & Dynamic Trade

Rozšiř stávající izometrickou 2.5D středověkou strategii o obchodní karavany, tržiště, nákup a prodej surovin, dynamické ceny a fyzickou přepravu obchodovaného zboží.

Hlavní cíl: Vytvoř funkční obchodní ekonomiku, ve které zahraniční obchodníci pravidelně přijíždějí do království, nabízejí vlastní zboží, vykupují suroviny a po určité době odjíždějí. Veškeré zboží musí respektovat existující logistiku, sklady a fyzickou přepravu.

Nezakládej nový projekt.

Nejdříve prozkoumej aktuální implementaci a navazuj na existující systémy. Pokud některý systém z předchozího návrhu ještě není implementován, přizpůsob rozsah skutečnému kódu a nepřidávej nefunkční závislosti.

Zachovej zejména:

Isometric World 100×100

Existing NPC Travelers and Merchants

LogisticsTaskManager

Hauler AI

Warehouse and Granary

Physical Resources

Kingdom Inventory and Gold

Construction and Blueprint System

Kingdom Attractiveness

Worker Jobs and Skills

Game Time

Pathfinding and Path Wear

Fog of War

Asset Library

Save/Load

1. Nová budova – Marketplace

Přidej budovu:

ID: marketplace

Name: Marketplace

Size: 3×3 tiles

Cost: 12 Stone + 8 Wood

Temporary Cargo Capacity: 80 units

Loading Points: 2

Allowed Haulers: 2

Budova se staví standardním blueprint systémem.

Tržiště začne fungovat pouze po dokončení stavby.

Jeho funkce:

Přijímání obchodních karavan.

Nákup a prodej surovin.

Dočasné skladování obchodovaného zboží.

Organizace nakládky a vykládky.

Zobrazení aktuálních cen a nabídek.

Správa obchodních objednávek.

Tržiště nemusí mít vlastní novou profesi. Zpočátku ho mohou obsluhovat existující Haulers.

Pokud je postaveno více tržišť, každé má vlastní nakládací prostor a skladovou kapacitu.

Karavana si vybere jedno dostupné tržiště jako cíl své návštěvy.

2. Obchodní karavany

Implementuj nezávislé obchodní karavany.

Každá karavana obsahuje:

Merchant NPC

Horse-drawn Cart (vlastní obchodníkův povoz a kůň, nikoli majetek hráčova Wheelwright/Stables; využij stejnou cestovní/kolizní infrastrukturu)

Jedinečné ID

Vlastní zásoby zboží

Vlastní množství zlata

Aktuální trasu

Cílové tržiště

Stav návštěvy

Čas zbývající do odjezdu

Karavana se musí fyzicky objevit na vhodném okraji mapy.

Poté:

Vybere dostupné dokončené tržiště.

Vypočítá průchozí cestu.

Přijíždí po mapě.

Zastaví u tržiště.

Otevře možnost obchodování.

Setrvá na tržišti po omezenou dobu.

Po skončení obchodu odjede k okraji mapy.

Po opuštění mapy se bezpečně odstraní.

Karavana nesmí teleportovat přes mapu.

Při pohybu používej existující Pathfinding a Path Wear System.

Povozy musí respektovat překážky a nesmí procházet budovami ani stromy.

Pokud nelze najít cestu, vyber jiný dostupný vstup nebo tržiště. Zabraň nekonečným pokusům o pathfinding.

3. Frekvence příjezdu

Výchozí nastavení:

Nová karavana každé 2–4 herní dny.

Doba pobytu na tržišti: 90 sekund při výchozí délce dne 120 sekund; při jiné délce dne zachovej ekvivalent 0,75 herního dne.

Maximálně 1 aktivní obchodní karavana najednou.

Další karavanu plánuj až podle herního času.

Existující náhodní pocestní a obchodníci, kteří procházejí mapou, musí fungovat dál.

Nevytvářej duplicitní migraci.

Obyčejný Merchant Traveler nemusí být automaticky obchodní karavanou.

Karavany se nikdy neusazují jako trvalí obyvatelé.

Pokud není postavené tržiště, karavany zatím nemusí přijíždět. Existující pocestní se ale objevují dál.

4. Vlastní zásoby obchodníků

Každá karavana přiváží omezené množství surovin.

Podporované obchodní komodity:

Stone

Wood

Iron Ore

Wheat

Apple

Meat

Flour

Bread

Základní příklad náhodného inventáře karavany:

20–50 Wood

10–30 Stone

10–25 Iron Ore

10–40 Wheat

5–25 Bread

10–30 Apple

Nemusí převážet všechny suroviny současně.

Některé karavany mohou být specializované:

Food Merchant

Building Materials Merchant

Ore Merchant

General Merchant

Každá karavana má také omezenou zásobu zlata, například 100–300 Gold.

Pokud obchodník nemá dostatek zlata, nemůže vykupovat další zboží.

Pokud nemá dostatečné zásoby konkrétní suroviny, nemůže ji dále prodávat.

Karavana nesmí vytvářet neomezené množství zlata ani surovin.

5. Dynamické ceny

Implementuj centrální TradePricingSystem.

Výchozí referenční ceny za jednotku:

Wheat: 2 Gold

Apple: 3 Gold

Stone: 3 Gold

Wood: 4 Gold

Meat: 5 Gold

Flour: 5 Gold

Bread: 7 Gold

Iron Ore: 9 Gold

Ceny musí být definované centrálně, nikoliv natvrdo na více místech.

Aktuální cena bude záviset na:

Základní ceně komodity.

Dostupnosti komodity v království.

Zásobách obchodní karavany.

Nabídce a poptávce.

Bezpečnosti obchodních cest.

Počítej samostatně:

Buy Price: kolik zlata zaplatí hráč za jednu jednotku.

Sell Price: kolik zlata obdrží hráč za jednu jednotku.

Obchodní marže musí zajistit, že nákupní cena pro hráče je vždy vyšší než jeho prodejní cena.

Počáteční návrh:

Hráč nakupuje za 115 % referenční tržní ceny.

Hráč prodává za 80 % referenční tržní ceny.

Ceny zaokrouhluj na celé jednotky zlata.

Zajisti:

Minimální cenu 1 Gold.

Maximální rozumný cenový multiplikátor.

Ochranu před obchodní arbitráží, kdy by hráč mohl opakovaným nákupem a prodejem okamžitě vytvářet zisk bez reálné změny ekonomických podmínek.

6. Nabídka a poptávka

Cena komodity se mění podle dostupnosti.

Pokud má království málo určité suroviny, cena při nákupu může růst.

Pokud má velký přebytek, cena může klesat.

Zohledni také zásoby samotné karavany.

Příklad:

Království má nadbytek obilí.

Obchodník má také hodně obilí.

Výkupní cena obilí je nízká.

Jiný příklad:

Království má velmi málo železné rudy.

Obchodník jí přivezl jen malé množství.

Nákupní cena je vysoká.

Použij jednoduchý, předvídatelný a konfigurovatelný cenový model.

Doporučené omezení základního koeficientu poptávky: 0.75–1.35.

Ceny aktualizuj při změně relevantních zásob nebo při příjezdu karavany, nikoliv každým vykresleným snímkem.

Zobraz hráči důvod zvýšené nebo snížené ceny.

7. Bezpečnost obchodních cest

Připrav systém Route Safety v rozsahu 0–100.

Bezpečnost může ovlivňovat:

Přítomnost vlastních hlídek.

Blízkost obranných věží.

Existující nebezpečné oblasti.

Zaznamenané útoky banditů.

Přítomnost nepřátel, pokud jsou již implementováni.

Bezpečnější obchodní cesta může poskytovat výhodnější ceny.

Nebezpečnější cesta znamená vyšší obchodní přirážku.

Pro první verzi použij omezený cenový vliv bezpečnosti, například maximálně ±15 %.

Pokud neexistuje systém banditů nebo skutečných nebezpečných oblastí, použij neutrální výchozí bezpečnost a bonusy z již funkčních obranných prvků.

Nevytvářej falešné útoky nebo náhodné ztráty nákladu, které nelze sledovat ve skutečné herní simulaci.

Později bude možné přidat loupežná přepadení karavan.

8. Obchodní rozhraní

Po kliknutí na karavanu stojící u tržiště otevři Trade Window.

Zobraz:

Jméno nebo typ obchodníka.

Aktuální množství zlata obchodníka.

Čas do odjezdu.

Bezpečnost obchodní cesty.

Seznam dostupných surovin.

Zásoby karavany.

Dostupné zásoby království.

Buy Price.

Sell Price.

U každé suroviny přidej:

Buy

Sell

Výběr množství

Buy Max / Sell Max

Před potvrzením zobraz:

Množství surovin.

Celkovou cenu.

Dostupné zlato.

Stav skladových zásob.

Potřebnou přepravu.

Zobraz také aktivní objednávky a jejich stav.

Přidej přehledné chybové zprávy:

Not enough gold

Not enough available resources

Merchant out of stock

Merchant has insufficient gold

Insufficient storage capacity

Caravan is leaving

9. Fyzická přeprava prodávaného zboží

Suroviny se nesmí teleportovat ze skladu do karavany.

Příklad prodeje:

Hráč chce prodat 30 Stone.

Systém ověří dostupné zásoby a peníze obchodníka.

Zarezervuje 30 Stone pro obchod.

Vytvoří Logistics Tasks.

Nosiči vyzvednou kameny z Warehouse.

Fyzicky je přenesou na Marketplace.

Zboží se naloží do karavany.

Teprve při skutečném předání zboží hráč dostane zlato.

Obchodníkovi se zvýší zásoby Stone a sníží zásoba Gold.

Obchod je možné rozdělit na více fyzických dodávek.

Každou dodávku zpracuj právě jednou.

Pokud karavana odjede před dokončením objednávky, neprovedená část obchodu se zruší a neprodané suroviny zůstanou hráči.

Suroviny již převezené na Marketplace se vrátí do dostupného skladu prostřednictvím Logistics Systemu.

Žádná surovina nesmí zmizet při zrušení objednávky.

10. Fyzická přeprava nakoupeného zboží

Příklad nákupu:

Hráč chce koupit 20 Iron Ore.

Ověř dostatek Gold.

Rezervuj požadované množství zlata.

Rezervuj skutečné zásoby karavany.

Karavana vyloží zboží na Marketplace.

Při předání proběhne platba a převod vlastnictví.

Vznikne Logistics Task.

Nosič odnese Iron Ore do Warehouse.

Teprve po doručení se zboží objeví jako uložené v daném skladu.

Dokud není náklad doručen do Warehouse, musí být evidován jako zboží na Marketplace nebo jako nesený náklad.

Objednávku neumožni dokončit, pokud není dostupné bezpečné místo pro vyložení zboží.

Peníze i suroviny převeď pouze jednou.

11. Rezervace a transakční integrita

Použij existující systém rezervací surovin a přepravních úkolů.

Každá obchodní objednávka má:

Unique Trade Order ID

Merchant ID

Marketplace ID

Resource Type

Quantity

Agreed Unit Price

Reserved Resources or Gold

Delivered Quantity

Completed Quantity

Order Status

Stavy:

Pending

Transporting

Partially Completed

Completed

Cancelled

Failed

Při potvrzení objednávky zafixuj dohodnutou cenu.

Pozdější změny tržních cen nesmí zpětně měnit již potvrzené obchody.

Všechny transakce musí být bezpečné proti opakovanému provedení.

Zabraň:

Duplicitnímu vyplacení zlata.

Duplicitnímu odečtení surovin.

Ztrátě zboží při odjezdu obchodníka.

Duplicitním rezervacím.

Obchodování s nákladem, který již vlastní jiný úkol.

Záporným zásobám nebo zápornému zlatu.

12. Automatický obchod

Přidej do Marketplace volitelný Auto Trade System.

Výchozí nastavení: OFF.

Hráč může pro každou komoditu nastavit:

Auto Sell

Prodat množství nad nastavenou rezervu.

Minimální přijatelná prodejní cena.

Příklad:

Udržuj minimálně 100 Stone.

Přebytečné Stone prodávej, pokud cena dosahuje alespoň 3 Gold.

Auto Buy

Nakup, pokud zásoba klesne pod určenou hodnotu.

Maximální nákupní cena.

Maximální celkový rozpočet.

Příklad:

Pokud Wood klesne pod 30, nakup do zásoby 80.

Maximální nákupní cena 6 Gold za jednotku.

Automatické obchodní příkazy se vyhodnocují pouze při dostupné karavaně.

Respektuj:

Skutečné skladové zásoby.

Rezervované materiály na stavby.

Rezervy potravin.

Dostupné zlato.

Kapacitu Marketplace.

Kapacitu karavany.

Dostatek času do odjezdu.

Nevytvářej nekonečné nákupní a prodejní cykly.

Pro jednu komoditu nedovol současně konfliktní automatický nákup a prodej.

13. Obchod a potřeby obyvatel

Integruj Trade System s existujícím Food Economy a Villager Needs.

Auto Sell nesmí prodávat potraviny pod minimální rezervu určenou hráčem.

Zobraz upozornění, pokud by prodej potravin ohrozil zásobování království.

Obchod může být důležitý například během zimy:

Vlastní pole neprodukují obilí.

Království spotřebovává skladované jídlo.

Přijede obchodník s chlebem.

Hráč může potraviny nakoupit.

Nakoupené potraviny musí být fyzicky uložené ve skladu, než je lze spotřebovat.

Nevytvářej druhý Food Consumption System.

14. Obchodní statistiky

Přidej panel Trade Statistics.

Zobraz:

Celkovou hodnotu prodaného zboží.

Celkovou hodnotu nakoupeného zboží.

Obchodní bilanci.

Počet uskutečněných obchodů.

Nejobchodovanější komodity.

Poslední obchodní transakce.

Historii cen jednotlivých surovin.

Historii cen ukládej v omezeném rozsahu, například za posledních 20 herních dnů.

Přidej jednoduchý graf cen vybrané komodity.

Cenové statistiky musí vycházet ze skutečně dokončených obchodů nebo zaznamenaných tržních nabídek, ne z vymyšlených hodnot.

15. Grafika a animace

Zachovej stávající izometrický 2.5D grafický styl.

Vytvoř:

Marketplace s obchodními stánky.

Merchant NPC.

Obchodní povoz.

Naložený a prázdný povoz.

Jednoduchou animaci zastavení karavany.

Jednoduché vizuální znázornění nakládky a vykládky.

Povoz musí viditelně cestovat po mapě.

Nemusíš vytvářet detailní fyzikální simulaci kol.

Pokud nejsou dostupné finální assety, vytvoř kvalitní dočasnou grafiku připravenou k výměně v Asset Library.

16. Interakce s existujícími NPC

Zachovej současný systém náhodných pocestných.

Obchodní karavany budou samostatným typem události a NPC.

Merchant Traveler může:

Projít mapou jako dosud.

Později fungovat jako obchodník na cestách.

V první verzi nemusí obyčejný Merchant Traveler prodávat zboží bez tržiště.

Zachovej pravidlo, že obchodníci se trvale neusazují.

17. Save / Load

Ukládej:

Marketplace a jeho stav.

Aktivní obchodní karavany.

Pozice povozů.

Zásoby a zlato jednotlivých obchodníků.

Čas příštího příjezdu.

Čas do odjezdu aktuální karavany.

Aktuální ceny.

Historii cen.

Všechny obchodní objednávky.

Rezervované zlato a suroviny.

Rozpracované přepravy.

Automatická obchodní pravidla.

Obchodní statistiky.

Po načtení musí obchod pokračovat bez duplicit.

Pokud byla objednávka částečně dokončena, obnov pouze její zbývající část.

Nepřidávej při načtení nové zásoby karavaně.

Nesnižuj hráčovo zlato opakovaně.

Starší uložené hry bez Trade Systemu musí zůstat načitatelné.

18. Optimalizace

Systém musí fungovat stabilně na mapě 100×100.

Nepočítej ceny a nové cesty každý snímek.

Používej:

Centrální Game Time.

Event-driven Trade Orders.

Existující LogisticsTaskManager.

Omezenou frekvenci plánování karavan.

Efektivní pathfinding.

Jednoznačná ID transakcí.

Oddělení obchodní simulace od vykreslování.

Simulace obchodních objednávek musí fungovat i mimo viditelnou část mapy.

Fog of War nesmí zastavit fungování obchodního systému.

19. Testování

Před implementací vytvoř Git commit funkční verze.

Ověř:

Marketplace lze postavit.

Nedokončené tržiště není funkční.

Karavana přijede z okraje mapy.

Karavana fyzicky dojde na tržiště.

Obchodník má vlastní zlato a zásoby.

Hráč může nakupovat suroviny.

Hráč může prodávat suroviny.

Nosiči skutečně přepravují prodávané zboží.

Nakoupené zboží je fyzicky dopravováno do skladů.

Transakce nemůže proběhnout dvakrát.

Nelze prodat rezervované stavební materiály.

Nelze nakoupit za nedostupné zlato.

Nelze prodat více surovin, než obchodník dokáže zaplatit.

Ceny reagují na nabídku a poptávku.

Rozdíl mezi nákupní a prodejní cenou brání jednoduchému zneužití obchodování.

Auto Trade respektuje minimální zásoby.

Karavana po návštěvě odjede.

Při předčasném odjezdu nedojde ke ztrátě surovin.

Save/Load zachovává rozpracované obchodní objednávky.

Dosavadní systémy ekonomiky, obyvatel a výstavby fungují beze změn.

20. Implementační fáze

Rozděl upgrade na čtyři fáze.

Fáze A – Marketplace & Caravans
Budova tržiště, fyzický příjezd karavan a inventář obchodníků.

Fáze B – Manual Trading
Nákup, prodej, potvrzování objednávek, fyzická doprava a bezpečné transakce.

Fáze C – Dynamic Economy
Dynamické ceny, nabídka a poptávka, Route Safety a automatický obchod.

Fáze D – Integration
Statistiky, grafika, Save/Load, optimalizace a automatizované testy.

Po každé dokončené fázi vytvoř Git commit a ověř funkční build.

Zatím NEIMPLEMENTUJ:

Bandits / Caravan Attacks, pokud ještě neexistuje funkční bojový systém banditů.

Mezinárodní diplomacii.

Obchodní smlouvy s jinými královstvími.

Obchodní flotily.

Daně nebo clo.

Vlastní obchodní karavany hráče.

Prioritou je stabilní obchodní systém propojený s fyzickou logistikou a existující ekonomikou hry.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# ETAPA 15/15 – původní krok 29B: Background Simulation & Catch-up

**Milník:** M5. **Důležitá úprava:** Žádná falešná plynulá simulace v background tab. Visibility API + bezpečný catch-up max 15 min, validovaný against foreground se stejným seedem.

**Pořadí:** řiď se `00_ORCHESTRATOR.md`; implementuj tuto etapu až když jsou předchozí `DONE`. Pokud následující pokyny z původního promptu odporují společným pravidlům nebo výslovným úpravám, platí novější sjednocená pravidla zde a v orchestrátoru.

---

Medieval Kingdom – Upgrade: Background Simulation & Catch-up (samostatná závěrečná etapa 29B)

Tato etapa se provádí až po dokončení obchodování, přepravy, potřeb poddaných a všech ekonomických systémů. Použij již vytvořenou Release Foundation (29A), ekonomický Resource Transaction Ledger (31B), Fog of War (28), počasí/sezóny, pracovní AI a všechny systémy z dalších etap.

8. Nový přepínač v levém panelu

Do existujícího levého Settings panelu přidej:

Run in Background: ON / OFF

Výchozí hodnota:

OFF

Pod přepínač přidej krátký tooltip:

Continue game simulation when the browser tab is inactive.

Přepínač musí být funkční i během rozehrané hry.

Jeho změna se projeví okamžitě.

Nastavení ukládej a obnovuj při dalším spuštění nebo načtení hry, konzistentně se stávajícím systémem nastavení.

9. Chování při vypnutém režimu

Pokud je Run in Background = OFF:

Přepnutí na jinou kartu pozastaví herní simulaci.

Herní čas nepostupuje.

NPC nevykonávají práci.

Neprobíhá produkce.

Nespotřebovává se jídlo.

Neprobíhají stavební práce.

Karavany neodjíždějí.

Neběží herní časovače.

Po návratu hra pokračuje tam, kde skončila.

Zachovej explicitní pauzu hráče a chování hlavního menu.

10. Chování při zapnutém režimu

Pokud je Run in Background = ON:

Herní svět má pokračovat podle skutečně uplynulého času také při přepnutí prohlížeče na jinou kartu nebo minimalizaci okna.

DŮLEŽITÉ TECHNICKÉ OMEZENÍ:

Moderní prohlížeče pozastavují requestAnimationFrame a omezují časovače skrytých karet.

Není možné zaručit, že Phaser bude skutečně nepřetržitě vykonávat aktualizační smyčku v neaktivní kartě.

Proto implementuj spolehlivý systém Background Simulation + Catch-up.

Neslibuj nepřetržitý běh tam, kde jej prohlížeč nepovoluje.

Při návratu do hry dopočítej chybějící herní čas bezpečně a konzistentně.

11. Detekce neaktivní karty

Použij standardní Page Visibility API.

Sleduj:

document.visibilityState

visibilitychange

Zohledni také existující Phaser lifecycle události.

Rozlišuj:

Viditelnou, ale nezaměřenou kartu nebo okno.

Skrytou kartu.

Skutečnou pauzu vyvolanou hráčem.

Hlavní menu.

Game Over.

Neaktivní karta nesmí automaticky způsobit restart scény nebo ztrátu herního stavu.

Při přepnutí do skrytého režimu ulož časový checkpoint.

12. Centrální Background Simulation Manager

Vytvoř centrální systém, například:

BackgroundSimulationManager

Jeho úkoly:

Evidovat nastavení ON/OFF.

Zaznamenat okamžik přechodu na neaktivní kartu.

Evidovat již zpracovaný simulační čas.

Při návratu vypočítat skutečně nezpracovaný čas.

Provést bezpečný catch-up.

Aktualizovat herní svět.

Pokračovat v normální simulaci.

Nepřidávej samostatné nezávislé časovače do jednotlivých budov nebo profesí.

Používej existující centrální Game Time System.

Nevytvářej druhý herní čas.

13. Výpočet uplynulého času

Příklad:

Délka herního dne: 120 sekund.

Hráč zapne Run in Background.

Přepne na kartu Codex.

Po 300 sekundách se vrátí.

Hra musí správně zpracovat ekvivalent 2,5 herního dne.

Zohledni:

Produkci surovin.

Růst obilí a stromů.

Těžbu.

Stavění.

Spotřebu potravin.

Odpočinek obyvatel.

Mzdy.

Příjem zlata z hradu.

Obchodní karavany.

Průběh práce NPC.

Další existující herní systémy založené na čase.

Neprováděj pouze mechanické přičtení 300 sekund ke Game Time, pokud by tím došlo k přeskočení důležitých událostí.

14. Simulace NPC na pozadí

Zachovej konzistentní průběh práce poddaných.

Příklad:

Horník:

Dojde ke kameni.

Vytěží jej.

Odnese náklad do skladu.

Vyloží jej.

Pokračuje dalším úkolem.

Pokud během neaktivní karty uběhne dostatek času, systém musí odpovídající práce zpracovat ve správném pořadí.

Nesmí dojít k:

Teleportaci surovin bez odpovídajícího průběhu práce.

Zdvojení těžených surovin.

Nekonečné produkci.

Ignorování skladových limitů.

Přeskakování spotřeby jídla.

Duplicitním výplatám.

Nesprávným přepravním rezervacím.

Používej autoritativní logiku stejné herní simulace, nikoliv odlišné zjednodušené vzorce, které by dávaly jiné výsledky.

Tam, kde to dává smysl, můžeš zpracovávat čas ve větších intervalech. Činnosti závislé na pořadí událostí, pohybu a kolizích ale musí být zpracovány bezpečně.

15. Výkon při návratu do hry

Catch-up nesmí na dlouhou dobu zablokovat prohlížeč.

Použij:

Oddělený simulační a renderovací cyklus.

Časové kroky nebo event-driven simulaci.

Dávkové zpracování.

Omezení výpočetního času na jeden snímek.

Průběžné aktualizace stavu.

Nevykresluj každý mezikrok.

Pokud je nutné simulovat dlouhé období, zpracuj jej po dávkách a zobraz například:

Updating kingdom...

Po dokončení obnov normální vykreslování.

Pro první verzi nastav bezpečný limit automaticky dopočítávané nepřítomnosti například na 15 minut reálného času.

Pokud je nepřítomnost delší, jasně informuj hráče o tom, kolik času bylo skutečně simulováno a kolik nebylo. Nikdy tiše nepředstírej, že proběhla celá nepřítomnost.

Limit musí být centrálně konfigurovatelný.

16. Synchronizace času

Zajisti, že se nezapočítá stejný čas dvakrát.

Ošetři zejména:

Opakované visibilitychange události.

Velmi rychlé přepínání karet.

Přerušení nebo restart catch-up.

Ruční pauzu během simulace.

Uložení a načtení hry.

Obnovení prohlížeče.

Změnu systémového času.

Probuzení počítače z režimu spánku.

Při normálním načtení uložené pozice nespouštěj offline simulaci za dobu, kdy byla hra zcela zavřená.

Run in Background se má vztahovat k otevřené herní relaci, ne k libovolně dlouhému období mezi spuštěními.

Výjimku můžeš připravit do budoucna jako samostatný Offline Progress System, ale nyní ji neimplementuj.

17. Bezpečnost herního stavu

Při simulaci na pozadí musí fungovat:

Death / Game Over.

Nedostatek potravin.

Stávky a emigrace obyvatel.

Vyčerpání ložisek.

Dokončení budov.

Změny ročních období.

Příjezdy a odjezdy obchodníků.

Pokud král během běhu na pozadí zemře, hra musí správně přejít do Game Over.

Nesmí se pokračovat ve výrobě a ekonomice po skončení hry, pokud to neodpovídá běžným pravidlům.

Po návratu zobraz důležité události, které nastaly během nepřítomnosti.

18. Background Summary

Po návratu na kartu můžeš zobrazit stručný souhrn, pokud uplynul alespoň jeden herní den.

Například:

WHILE YOU WERE AWAY

Time elapsed: 3 game days

+45 Wood
+28 Stone
+60 Bread
-35 Food consumed
+15 Gold

2 Buildings completed
1 New villager arrived

Continue

Údaje musejí pocházet ze skutečných změn v herním stavu.

Nesestavuj je odhadem.

Pokud už hra obsahuje systém notifikací, integruj souhrn do něj.

Souhrn musí být možné zavřít a pokračovat ve hře.

19. Interakce s Fog of War

Simulace na pozadí nesmí automaticky odhalit celou mapu.

Zachovej:

Circular View Range.

Exploration Mode.

Explored Map Memory.

Poslední známý stav statických objektů.

Pokud jednotka během simulace skutečně prochází oblastí a je oprávněným zdrojem vidění, může ji standardně prozkoumat.

Pokud zdroj vidění oblast neviděl, nesmí být odhalena.

Při návratu aktualizuj Fog of War podle skutečného stavu.

20. Ukládání nastavení

Nastavení Run in Background musí být zachováno.

Použij současný Settings Manager a Save/Load.

Nevytvářej nový nezávislý systém nastavení.

Pokud existují globální a per-save nastavení, dodrž jejich dosavadní pravidla.

Zajisti, že u starších uložených her bude výchozí hodnota OFF.

21. Testování Background Simulation

Přidej automatické testy alespoň pro:

OFF – po přepnutí karty se simulační čas nezmění.

ON – po 60 sekundách v neaktivní kartě proběhne odpovídající postup simulace.

ON – po 300 sekundách se správně dopočítá herní čas.

Produkce se nezapočítá duplicitně.

Spotřeba jídla se provede správně.

Pracovníci respektují pracovní úkoly a přepravu.

Skladové kapacity zůstávají platné.

Stavba nemůže být dokončena bez materiálu.

Migrace obyvatel funguje.

Úmrtí krále správně ukončí hru.

Fog of War neodhalí neprozkoumané oblasti.

Save/Load nezapočítává čas dvakrát.

Opakované přepínání karet nezpůsobí chybu.

Dlouhý catch-up nezablokuje uživatelské rozhraní.

Po návratu se korektně obnoví normální běh Phaseru.

Dále vytvoř srovnávací test:

Spusť dvě identické hry se stejným seedem a stejnými počátečními podmínkami.

Jednu simuluj 5 minut v popředí a druhou pomocí Background Catch-up.

Výsledné ekonomické zásoby, herní čas, pracovní úkoly a jiné deterministické stavy musí být shodné nebo musí být odchylky konkrétně vysvětlené a odstraněné.

## Postup a kontrola

Proveď v samostatných malých commitech: (1) Page Visibility + pause/catchup čas, (2) propojení s jedním autoritativním simulačním cyklem, (3) NPC a logistika, (4) obchod, příroda, denní účetnictví, FoW a Save/Load, (5) integrační testy stejného seedu foreground versus catch-up. Doplň Unreleased, zkontroluj release gate M5 a pokud všechny testy projdou, proveď skutečný MINOR release. Důsledně zachovej limit 15 minut a nepředstírej nepřetržitý běh skryté karty.

---

## Povinné dokončení etapy

Dodrž společná pravidla testování, ukládání, commitů a release gate uvedená v `00_ORCHESTRATOR.md`. Po testech aktualizuj `docs/UPGRADE_PROGRESS.md`, zapiš do `CHANGELOG.md` v Unreleased a vytvoř smysluplný commit. Pokud jsou kontrolní podmínky splněné, **automaticky přejdi na další etapu podle pořadí**, bez čekání na další zprávu. Report zapisuj průběžně do progress souboru; uživateli vrať souhrn až po dokončení plánu či při skutečné blokaci.


---

# POSLEDNÍ POKYN

Nyní při prvním zadání tohoto textu připrav roadmapu, progress a soubory `docs/upgrades/` s kompletními specifikacemi, ověř skutečný kód a zahaj etapu 01 / 29A. **Potom AUTOMATICKY pokračuj etapami 02–15 v definovaném pořadí, vždy až po ověření funkčnosti a commitu předchozí etapy.** Po dokončení milníků M1–M5 prováděj integrační testy, release gate a skutečné verzování pouze při úspěšné kontrole. **NEČEKEJ na příkaz „pokračuj“ a neptej se na potvrzení mezi etapami.** Pokud okolnosti znemožní další postup, zaznamenej přesný checkpoint, důvod blokace a konkrétní kroky k obnovení. Nezačínej všech 15 etap současně, nesnižuj rozsah požadavků jen proto, abys prohlásil plán za hotový, a nikdy nevydávej netestovanou verzi.
