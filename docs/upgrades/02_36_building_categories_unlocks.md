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

