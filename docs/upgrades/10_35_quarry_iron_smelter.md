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

