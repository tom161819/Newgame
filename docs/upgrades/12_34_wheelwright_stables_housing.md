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

