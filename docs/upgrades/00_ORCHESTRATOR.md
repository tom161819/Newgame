# MEDIEVAL KINGDOM – MASTER PROMPT PRO AUTONOMNÍ REALIZACI 15 ETAP

**Aktuální pořadí podle nového pokynu uživatele2026-11-04:** dokončit M2,
potom C01–C08, potom původní master11–15. Čísla etap a milníky M3–M5 zůstávají;
starší pořadí v původním zadání je tímto přepsané. Autoritativní fronta:
[docs/TASK_QUEUE.md](../TASK_QUEUE.md), návaznosti [CODEX_PROGRESS.md](../CODEX_PROGRESS.md).

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
4. Povinné invarianty: bez duplikace či ztráty surovin; přiřazení pracovníka max. jednou; kapacity ne do mínusu; žádné dvojí zpracování obchodních/výrobních transakcí; žádný únik aktuálních informací přes Fog of War; funkční Save/Load aktuálního Save Schema Version (v ALPHA bez migrací starších savů, viz níže); žádné uvízlé rezervace.
5. Testuj minimálně: New Game, Save/Load aktuálního schématu a odmítnutí jiného schématu, dokončení/rušení stavby, fyzickou logistiku, více NPC, FoW, plynulost při zoom out a relevantní specifické scénáře z této etapy. Pokud je dostupný Playwright nebo obdobný nástroj, použij i end-to-end smoke; jinak přesně vypiš neověřené UI testy.
6. Každou dokončenou ověřenou etapu/fázi zaznamenej do `CHANGELOG.md` sekce `Unreleased` a do `docs/UPGRADE_PROGRESS.md`. Vytvoř smysluplný Git commit; nevytvářej novou veřejnou verzi pro každý commit. Stav označ `DONE`, `PARTIAL` nebo `BLOCKED` s přesným důvodem.
7. **Release gate:** po poslední etapě milníku proveď integrační regresní test, ověř produkční build, Save/Load, nejdůležitější herní smyčku, žádné duplicity a funkční GitHub Pages deploy. POUZE při úspěchu zvyš MINOR v pre-1.0 semver (`0.MINOR.0`), případně PATCH pro samostatnou opravu chyby. Respektuj aktuální číslo i případné existující verze. Přesuň ověřené položky z Unreleased pod konkrétní vydanou verzi, sjednoť metadata verzí, vytvoř nezaměnitelný Git tag a skutečný neměnný archiv spustitelného buildu, pokud to práva a nasazení umožňují. Nikdy nevymýšlej historické verze nebo dostupné URL. Když publikace není možná, připrav release kandidáta, napiš konkrétní překážku a netvrď, že proběhl release.
8. GitHub Push / vytvoření tagu / deployment prováděj pouze se skutečnými oprávněními a podle existujících pravidel repozitáře. Neprováděj force-push ani přepis Git historie.
9. Po dokončení každé etapy zapiš krátký strukturovaný report do `docs/UPGRADE_PROGRESS.md`: co se změnilo, jaké testy prošly/neprošly, Git commit, stav milníku a číslo další etapy. **Pokud je etapa DONE a neexistuje blocker, bez dotazu automaticky pokračuj další etapou.** Finální zprávu pro uživatele vrať až po dokončení všech 15 etap, případně při skutečné blokaci nebo při limitu relace. Na začátku každé další etapy znovu čti plán a progress, aby bylo možné práci bezpečně obnovit.
10. Pokud etapa závisí na funkcionalitě, která chybí, přidej nejmenší kompatibilní integraci nebo nahlas blokaci. Nikdy nepředstírej splněné testy či dokončenou funkci. Priorita je funkční hra, ne počet commitů.


## Rozhodnutí, která řeší konflikty starších promptů (závazná)

0. **ALPHA – ukládání her (od 2026-11-04, má přednost před všemi specifikacemi etap):** zpětná kompatibilita uložených her mezi verzemi se nevyžaduje. Žádné migrace starších savů; při změně datového modelu zvýšit `SAVE_VERSION`. Save jiného schématu se odmítne s upozorněním a nabídkou nové hry, nikdy se automaticky nemaže. Požadavky typu „zachovej kompatibilitu starších save souborů“ nebo „Save/Load včetně staršího formátu“ v etapách 09–15 se neuplatňují, dokud je vývojář výslovně znovu nevyžádá. Platí plná funkčnost a kontroly konzistence Save/Load v aktuálním schématu. Úplná pravidla: `AGENTS.md`, sekce Alpha save policy.

1. **Quarry:** nové kamenolomy 3×3 lze založit pouze s překryvem alespoň 1 skutečného skalního políčka / finite stone_deposit a průchozím pracovním přístupem. Musí těžit z jednoznačně přiřazené konečné zásoby. Žádné automatické přepnutí na ložiska v okolí a žádná nekonečná alternativa přes volně ležící kameny. Existující legacy Quarry ze starého savu zůstávají zachované; nové pravidlo musí být implementováno už v etapě 25 a etapa 35 jej pouze doladí.
2. **House:** kapacita = 5 trvalých obyvatel na dokončený dům. Ve Villager Needs (26) nepoužívej starou hodnotu 4; v ALPHA bez migrace starších savů. Při smrti záznam není aktivním obyvatelem.
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

